-- GridCraft P3 PRIVATE DB SCHEMA CANDIDATE ONLY — NOT APPLIED.
-- Do not run with db push or execute without the owner's production approval.
-- This adds tables to the ORIGINAL Supabase project only, not a new database.
-- Requires independent security review and integration testing before deployment.

BEGIN;

CREATE TABLE IF NOT EXISTS public.lz_gridcraft_pairings (
  code_sha256 text PRIMARY KEY CHECK (code_sha256 ~ '^[0-9a-f]{64}$'),
  owner_id text NOT NULL CHECK (length(owner_id) BETWEEN 8 AND 256),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.lz_gridcraft_devices (
  device_id text PRIMARY KEY CHECK (device_id ~ '^[A-Za-z0-9._:-]{1,100}$'),
  owner_id text NOT NULL CHECK (length(owner_id) BETWEEN 8 AND 256),
  token_sha256 text NOT NULL CHECK (token_sha256 ~ '^[0-9a-f]{64}$'),
  paired_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  last_seen timestamptz,
  last_status text NOT NULL DEFAULT 'DEVICE_OFFLINE'
    CHECK (last_status IN ('DEVICE_OFFLINE','GRIDCRAFT_OFFLINE','READY','UNAUTHORIZED','CONTROL_ERROR'))
);

CREATE TABLE IF NOT EXISTS public.lz_gridcraft_jobs (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL CHECK (length(owner_id) BETWEEN 8 AND 256),
  device_id text NOT NULL REFERENCES public.lz_gridcraft_devices(device_id),
  tool text NOT NULL CHECK (tool IN ('gridcraft_list_workbooks','gridcraft_read_range')),
  arguments jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'queued'
    CHECK (state IN ('queued','claimed','completed','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  completed_at timestamptz,
  result jsonb
);

CREATE INDEX IF NOT EXISTS lz_gridcraft_jobs_queue_idx
  ON public.lz_gridcraft_jobs(device_id, state, created_at);
CREATE INDEX IF NOT EXISTS lz_gridcraft_jobs_owner_idx
  ON public.lz_gridcraft_jobs(owner_id, id);
CREATE INDEX IF NOT EXISTS lz_gridcraft_pairings_expiry_idx
  ON public.lz_gridcraft_pairings(expires_at);

ALTER TABLE public.lz_gridcraft_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lz_gridcraft_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lz_gridcraft_jobs ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated access. Only a server-side Edge service role with
-- verified Site principal / device token may read/write these tables.
REVOKE ALL ON TABLE public.lz_gridcraft_pairings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.lz_gridcraft_devices FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.lz_gridcraft_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lz_gridcraft_pairings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.lz_gridcraft_devices TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.lz_gridcraft_jobs TO service_role;

-- Claim at most one pending *read-only* command per device. SQL transaction
-- uses row locking to prevent duplicate execution by simultaneous pollers.
CREATE OR REPLACE FUNCTION public.lz_gridcraft_claim_job(
  p_owner text, p_device text
) RETURNS TABLE (job_id uuid, tool text, arguments jsonb, expires_at timestamptz)
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_temp AS $$
BEGIN
  RETURN QUERY
  WITH next_job AS (
    SELECT j.id FROM public.lz_gridcraft_jobs j
    WHERE j.owner_id = p_owner AND j.device_id = p_device
      AND j.state = 'queued' AND j.expires_at > now()
      AND NOT EXISTS (
        SELECT 1 FROM public.lz_gridcraft_jobs active_job
        WHERE active_job.device_id = p_device
          AND active_job.owner_id = p_owner
          AND active_job.state = 'claimed'
          AND active_job.expires_at > now()
      )
    ORDER BY j.created_at
    FOR UPDATE SKIP LOCKED LIMIT 1
  )
  UPDATE public.lz_gridcraft_jobs j
    SET state = 'claimed', claimed_at = now()
  FROM next_job
  WHERE j.id = next_job.id
  RETURNING j.id, j.tool, j.arguments, j.expires_at;
END $$;

CREATE OR REPLACE FUNCTION public.lz_gridcraft_complete_job(
  p_owner text, p_device text, p_id uuid, p_result jsonb
) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_temp AS $$
DECLARE updated_count integer;
BEGIN
  IF p_result IS NULL OR pg_column_size(p_result) > 24576 THEN
    RETURN false;
  END IF;
  UPDATE public.lz_gridcraft_jobs
  SET state = 'completed', completed_at = now(), result = p_result
  WHERE id = p_id AND owner_id = p_owner AND device_id = p_device
    AND state = 'claimed' AND expires_at > now();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count = 1;
END $$;

REVOKE ALL ON FUNCTION public.lz_gridcraft_claim_job(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lz_gridcraft_complete_job(text,text,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lz_gridcraft_claim_job(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lz_gridcraft_complete_job(text,text,uuid,jsonb) TO service_role;


-- One-time pairing: owner created a 64-bit random code through authenticated
-- Private Site. Device presents code and its random credential over TLS.
-- Both are stored as SHA-256; never store raw device bearer token in DB.
CREATE OR REPLACE FUNCTION public.lz_gridcraft_pair_device(
  p_code_hash text, p_device_id text, p_token_hash text
) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_temp AS $
DECLARE paired_owner text;
BEGIN
  IF p_code_hash !~ '^[0-9a-f]{64}
-- Not yet provided by this draft:
-- * pairing Site UI / owner confirmation, per-user rate limits and revocation;
-- * secure random code generation / rate limiting / revocation;
-- * HTTP Edge verification of owner and device;
-- * queued/claimed expiry cleanup, retention & budget policy;
-- * real Windows device connection and cross-account tests.
-- Therefore DO NOT DEPLOY this schema alone.

     OR p_token_hash !~ '^[0-9a-f]{64}
-- Not yet provided by this draft:
-- * one-time owner-authorized device pairing transaction with hashed secrets;
-- * secure random code generation / rate limiting / revocation;
-- * HTTP Edge verification of owner and device;
-- * queued/claimed expiry cleanup, retention & budget policy;
-- * real Windows device connection and cross-account tests.
-- Therefore DO NOT DEPLOY this schema alone.

     OR p_device_id !~ '^[A-Za-z0-9._:-]{1,100}
-- Not yet provided by this draft:
-- * one-time owner-authorized device pairing transaction with hashed secrets;
-- * secure random code generation / rate limiting / revocation;
-- * HTTP Edge verification of owner and device;
-- * queued/claimed expiry cleanup, retention & budget policy;
-- * real Windows device connection and cross-account tests.
-- Therefore DO NOT DEPLOY this schema alone.
 THEN
    RETURN NULL;
  END IF;
  SELECT p.owner_id INTO paired_owner
    FROM public.lz_gridcraft_pairings p
    WHERE p.code_sha256 = p_code_hash AND p.consumed_at IS NULL
      AND p.expires_at > now()
    FOR UPDATE;
  IF paired_owner IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.lz_gridcraft_devices(device_id, owner_id, token_sha256)
    VALUES(p_device_id, paired_owner, p_token_hash);
  UPDATE public.lz_gridcraft_pairings SET consumed_at = now()
    WHERE code_sha256 = p_code_hash AND consumed_at IS NULL;
  RETURN paired_owner;
END $;
REVOKE ALL ON FUNCTION public.lz_gridcraft_pair_device(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lz_gridcraft_pair_device(text,text,text) TO service_role;

COMMIT;

-- Not yet provided by this draft:
-- * one-time owner-authorized device pairing transaction with hashed secrets;
-- * secure random code generation / rate limiting / revocation;
-- * HTTP Edge verification of owner and device;
-- * queued/claimed expiry cleanup, retention & budget policy;
-- * real Windows device connection and cross-account tests.
-- Therefore DO NOT DEPLOY this schema alone.
