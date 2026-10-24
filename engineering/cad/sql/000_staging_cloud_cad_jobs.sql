-- Staging review ONLY. DO NOT run against the production Supabase database.
-- No implicit deployment. Run only in an isolated test database after approval.
BEGIN;
CREATE TABLE IF NOT EXISTS public.lizhi_cad_cloud_jobs (
  owner_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  job_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lizhi_cad_cloud_jobs_pk PRIMARY KEY(owner_id, idempotency_key),
  CONSTRAINT lizhi_cad_cloud_job_key_check CHECK(idempotency_key ~ '^[0-9a-f]{64}$'),
  CONSTRAINT lizhi_cad_cloud_job_object_check CHECK(jsonb_typeof(job_data) = 'object'),
  CONSTRAINT lizhi_cad_cloud_job_key_match CHECK(job_data->>'idempotency_key' = idempotency_key),
  CONSTRAINT lizhi_cad_cloud_job_status_check CHECK(
    job_data->>'status' IN ('queued','claimed','running','completed','failed','cancelled')
  )
);
CREATE INDEX IF NOT EXISTS lizhi_cad_cloud_jobs_pending_idx
  ON public.lizhi_cad_cloud_jobs ((job_data->>'status'), created_at)
  WHERE (job_data->>'status') IN ('queued','claimed','running');
ALTER TABLE public.lizhi_cad_cloud_jobs ENABLE ROW LEVEL SECURITY;
-- Explicitly deny browser and API roles. Only a trusted server-side worker
-- may use a privileged credential, scoped by verified owner_id.
REVOKE ALL ON TABLE public.lizhi_cad_cloud_jobs FROM PUBLIC, anon, authenticated;
-- No public RLS policies intentionally: browser clients cannot directly read/write.
COMMIT;
