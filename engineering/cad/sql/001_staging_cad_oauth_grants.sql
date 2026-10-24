-- Disposable PostgreSQL staging ONLY. Do not apply on production Supabase.
-- The trusted Lizhi project administration backend must provision grants
-- *after* verifying the user's project ownership. No public provisioning RPC.
BEGIN;
CREATE TABLE IF NOT EXISTS public.lizhi_cad_oauth_project_grants (
  owner_id uuid NOT NULL,
  project_id text NOT NULL CHECK(
    length(project_id) BETWEEN 1 AND 128 AND project_id !~ '[^A-Za-z0-9_-]'
  ),
  oauth_client_id text NOT NULL CHECK(
    length(oauth_client_id) BETWEEN 1 AND 256 AND oauth_client_id !~ '[^A-Za-z0-9_.:-]'
  ),
  can_write boolean NOT NULL DEFAULT false,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT lizhi_cad_oauth_grants_pk PRIMARY KEY (owner_id,project_id,oauth_client_id)
);
ALTER TABLE public.lizhi_cad_oauth_project_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lizhi_cad_oauth_project_grants FROM PUBLIC, anon, authenticated;
-- No public read, write, and no SECURITY DEFINER function. Grants are
-- server-only data, not derived from JWT user_metadata. App-level revocation
-- takes effect on the *next* CAD tool call even if a JWT remains valid.
COMMIT;
