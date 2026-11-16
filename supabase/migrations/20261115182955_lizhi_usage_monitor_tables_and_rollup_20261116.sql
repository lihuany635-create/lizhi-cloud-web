-- Already applied to the existing Supabase project using the approved migration API.
-- Production migration version: 20261115182955. Do not reapply manually.
-- Scope restricted to public.lz_usage_events, public.lz_usage_daily, private_lz.usage_rollup().
DO $preflight$
BEGIN
 IF to_regclass('public.lz_usage_events') IS NOT NULL
    OR to_regclass('public.lz_usage_daily') IS NOT NULL
    OR EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='private_lz')
 THEN
    RAISE EXCEPTION 'Usage objects already exist; this migration is intentionally create-only';
 END IF;
END
$preflight$;

-- LIZHI Supabase Usage Monitor | candidate-only PostgreSQL 17 schema.
-- NOT APPLIED: never run on the live Supabase project without explicit approval.
-- Supabase service_role only; browser/anon/authenticated cannot read or write.
-- Time aggregation is UTC calendar days, NOT authoritative billing-cycle dates.
CREATE SCHEMA IF NOT EXISTS private_lz;
REVOKE ALL ON SCHEMA private_lz FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private_lz TO service_role;

CREATE TABLE IF NOT EXISTS public.lz_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source ~ '^[A-Za-z0-9_.-]{1,80}$'),
  route text NOT NULL CHECK (route ~ '^[A-Za-z0-9_./:-]{1,120}$'),
  status_code integer NOT NULL CHECK (status_code BETWEEN 100 AND 599),
  request_bytes bigint CHECK (request_bytes IS NULL OR request_bytes BETWEEN 0 AND 1099511627776),
  response_bytes bigint CHECK (response_bytes IS NULL OR response_bytes BETWEEN 0 AND 1099511627776),
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms BETWEEN 0 AND 3600000),
  decision text NOT NULL DEFAULT 'allow' CHECK (decision IN ('allow','throttle','block')),
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT lz_usage_events_unique_request UNIQUE (source,request_id)
);

CREATE INDEX IF NOT EXISTS lz_usage_events_latest_idx
  ON public.lz_usage_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS lz_usage_events_source_idx
  ON public.lz_usage_events(source,occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.lz_usage_daily (
  day date NOT NULL,
  source text NOT NULL CHECK (source ~ '^[A-Za-z0-9_.-]{1,80}$'),
  request_count bigint NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  request_bytes_known bigint NOT NULL DEFAULT 0 CHECK (request_bytes_known >= 0),
  response_bytes_known bigint NOT NULL DEFAULT 0 CHECK (response_bytes_known >= 0),
  unknown_request_count bigint NOT NULL DEFAULT 0 CHECK (unknown_request_count >= 0),
  unknown_response_count bigint NOT NULL DEFAULT 0 CHECK (unknown_response_count >= 0),
  blocked_count bigint NOT NULL DEFAULT 0 CHECK (blocked_count >= 0),
  throttled_count bigint NOT NULL DEFAULT 0 CHECK (throttled_count >= 0),
  error_count bigint NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  PRIMARY KEY(day,source)
);

-- An insert and its daily rollup happen in the same PostgreSQL transaction.
-- A replayed (source,request_id) conflicts before this trigger and is not
-- counted twice.  Updating or deleting a stored event does NOT alter rollup.
CREATE OR REPLACE FUNCTION private_lz.usage_rollup()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public, private_lz
AS $$
BEGIN
  INSERT INTO public.lz_usage_daily (
    day,source,request_count,request_bytes_known,response_bytes_known,
    unknown_request_count,unknown_response_count,blocked_count,throttled_count,error_count
  ) VALUES (
    (NEW.occurred_at AT TIME ZONE 'UTC')::date,
    NEW.source,1,COALESCE(NEW.request_bytes,0),COALESCE(NEW.response_bytes,0),
    CASE WHEN NEW.request_bytes IS NULL THEN 1 ELSE 0 END,
    CASE WHEN NEW.response_bytes IS NULL THEN 1 ELSE 0 END,
    CASE WHEN NEW.decision = 'block' THEN 1 ELSE 0 END,
    CASE WHEN NEW.decision = 'throttle' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status_code >= 400 THEN 1 ELSE 0 END
  )
  ON CONFLICT(day,source) DO UPDATE SET
    request_count=public.lz_usage_daily.request_count+EXCLUDED.request_count,
    request_bytes_known=public.lz_usage_daily.request_bytes_known+EXCLUDED.request_bytes_known,
    response_bytes_known=public.lz_usage_daily.response_bytes_known+EXCLUDED.response_bytes_known,
    unknown_request_count=public.lz_usage_daily.unknown_request_count+EXCLUDED.unknown_request_count,
    unknown_response_count=public.lz_usage_daily.unknown_response_count+EXCLUDED.unknown_response_count,
    blocked_count=public.lz_usage_daily.blocked_count+EXCLUDED.blocked_count,
    throttled_count=public.lz_usage_daily.throttled_count+EXCLUDED.throttled_count,
    error_count=public.lz_usage_daily.error_count+EXCLUDED.error_count;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private_lz.usage_rollup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private_lz.usage_rollup() TO service_role;

DROP TRIGGER IF EXISTS lz_usage_rollup_trigger ON public.lz_usage_events;
CREATE TRIGGER lz_usage_rollup_trigger
AFTER INSERT ON public.lz_usage_events
FOR EACH ROW EXECUTE FUNCTION private_lz.usage_rollup();

ALTER TABLE public.lz_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lz_usage_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lz_usage_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.lz_usage_daily FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,DELETE ON public.lz_usage_events TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.lz_usage_daily TO service_role;

-- The owner-authenticated Edge reads these tables with its server-side key.
-- DO NOT expose this key or the tables to a browser or public MCP client.
-- Retain detailed records up to 72 hours AFTER testing scheduled retention;
-- don't enable cleanup before reconciliation and backup validation.
