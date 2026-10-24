-- STAGING-ONLY DDL: DO NOT APPLY TO PRODUCTION.
-- Execute only against a disposable PostgreSQL environment.
BEGIN;
CREATE TABLE IF NOT EXISTS public.lizhi_cad_cloud_jobs (
 owner_id uuid NOT NULL,
 idempotency_key text NOT NULL,
 job_data jsonb NOT NULL,
 lease_until timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lizhi_cad_cloud_jobs_pk PRIMARY KEY(owner_id,idempotency_key),
 CONSTRAINT lizhi_cad_cloud_jobs_key_chk CHECK(idempotency_key ~ '^[0-9a-f]{64}$'),
 CONSTRAINT lizhi_cad_cloud_jobs_object_chk CHECK(jsonb_typeof(job_data)='object'),
 CONSTRAINT lizhi_cad_cloud_jobs_identity_chk CHECK(job_data->>'idempotency_key'=idempotency_key),
 CONSTRAINT lizhi_cad_cloud_jobs_status_chk CHECK(job_data->>'status' IN ('queued','claimed','running','completed','failed','cancelled'))
);
CREATE INDEX IF NOT EXISTS lizhi_cad_cloud_jobs_pending_idx
 ON public.lizhi_cad_cloud_jobs ((job_data->>'status'),created_at)
 WHERE job_data->>'status' IN ('queued','claimed','running');
ALTER TABLE public.lizhi_cad_cloud_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lizhi_cad_cloud_jobs FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.lizhi_cad_cloud_intents (
 owner_id uuid NOT NULL,
 cloud_job_key text NOT NULL,
 prepared_job jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lizhi_cad_cloud_intents_pk PRIMARY KEY(owner_id,cloud_job_key),
 CONSTRAINT lizhi_cad_cloud_intents_key_chk CHECK(cloud_job_key ~ '^[0-9a-f]{64}$'),
 CONSTRAINT lizhi_cad_cloud_intents_payload_chk CHECK(
  jsonb_typeof(prepared_job)='object'
  AND prepared_job->>'cloud_job_key'=cloud_job_key
  AND prepared_job->>'status'='prepared_not_executed'
  AND (prepared_job->>'job_key') ~ '^[0-9a-f]{64}$'
 )
);
ALTER TABLE public.lizhi_cad_cloud_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lizhi_cad_cloud_intents FROM PUBLIC,anon,authenticated;
-- No browser-facing RLS policies. A server-only trusted worker must enforce
-- verified owner and project ACL before using a privileged DB connection.

-- Staging-only bounded DXF bytea snapshots. Production should use dedicated
-- immutable object storage while retaining the same atomic revision metadata.
CREATE TABLE IF NOT EXISTS public.lizhi_cad_cloud_drawings (
 owner_id uuid NOT NULL,
 project_id text NOT NULL CHECK(length(project_id) BETWEEN 1 AND 128 AND project_id !~ '[^A-Za-z0-9_-]'),
 drawing_id text NOT NULL CHECK(length(drawing_id) BETWEEN 1 AND 128 AND drawing_id !~ '[^A-Za-z0-9_-]'),
 current_revision integer NOT NULL DEFAULT 0 CHECK(current_revision>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lizhi_cad_cloud_drawings_pk PRIMARY KEY(owner_id,drawing_id)
);
CREATE TABLE IF NOT EXISTS public.lizhi_cad_cloud_revisions (
 owner_id uuid NOT NULL,
 drawing_id text NOT NULL,
 revision integer NOT NULL CHECK(revision>=1),
 job_key text NOT NULL CHECK(length(job_key)=64 AND job_key !~ '[^a-f0-9]'),
 sha256 text NOT NULL CHECK(length(sha256)=64 AND sha256 !~ '[^a-f0-9]'),
 dxf_bytes bytea NOT NULL,
 byte_size integer NOT NULL CHECK(byte_size>0 AND byte_size<=16777216 AND byte_size=octet_length(dxf_bytes)),
 inspection jsonb NOT NULL CHECK(inspection->>'valid'='true'),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lizhi_cad_cloud_revisions_pk PRIMARY KEY(owner_id,drawing_id,revision),
 CONSTRAINT lizhi_cad_cloud_revisions_drawing_fk FOREIGN KEY(owner_id,drawing_id)
   REFERENCES public.lizhi_cad_cloud_drawings(owner_id,drawing_id) ON DELETE RESTRICT,
 CONSTRAINT lizhi_cad_cloud_revisions_job_unique UNIQUE(owner_id,job_key)
);
ALTER TABLE public.lizhi_cad_cloud_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lizhi_cad_cloud_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lizhi_cad_cloud_drawings FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.lizhi_cad_cloud_revisions FROM PUBLIC,anon,authenticated;

-- Object-backed revisions are a staging alternative to legacy DXF bytea.
-- Binary content remains in immutable S3-style keys; job metadata and the
-- drawing head advance transactionally only after successful object upload.
CREATE TABLE IF NOT EXISTS public.lizhi_cad_cloud_object_revisions (
 owner_id uuid NOT NULL,
 drawing_id text NOT NULL,
 revision integer NOT NULL CHECK(revision>=1),
 job_key text NOT NULL CHECK(length(job_key)=64 AND job_key !~ '[^a-f0-9]'),
 artifacts jsonb NOT NULL CHECK(
   jsonb_typeof(artifacts)='object'
   AND jsonb_typeof(artifacts->'dxf')='object'
   AND length(artifacts->'dxf'->>'sha256')=64
 ),
 inspection jsonb NOT NULL CHECK(inspection->>'valid'='true'),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lizhi_cad_cloud_object_revision_pk PRIMARY KEY(owner_id,drawing_id,revision),
 CONSTRAINT lizhi_cad_cloud_object_revision_job_unique UNIQUE(owner_id,job_key),
 CONSTRAINT lizhi_cad_cloud_object_revision_drawing_fk FOREIGN KEY(owner_id,drawing_id)
   REFERENCES public.lizhi_cad_cloud_drawings(owner_id,drawing_id) ON DELETE RESTRICT
);
-- Every attempted S3 upload has an audit record created BEFORE network IO.
-- Pending rows make orphaned staging objects discoverable, not automatically
-- deletable: cleanup requires a separately reviewed and authorized process.
CREATE TABLE IF NOT EXISTS public.lizhi_cad_cloud_upload_attempts (
 owner_id uuid NOT NULL,
 job_key text NOT NULL CHECK(length(job_key)=64 AND job_key !~ '[^a-f0-9]'),
 project_id text NOT NULL,
 drawing_id text NOT NULL,
 target_revision integer NOT NULL CHECK(target_revision>=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz,
 CONSTRAINT lizhi_cad_cloud_upload_attempt_pk PRIMARY KEY(owner_id,job_key)
);
CREATE INDEX IF NOT EXISTS lizhi_cad_cloud_upload_pending_idx
 ON public.lizhi_cad_cloud_upload_attempts(created_at) WHERE published_at IS NULL;
ALTER TABLE public.lizhi_cad_cloud_object_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lizhi_cad_cloud_upload_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lizhi_cad_cloud_object_revisions FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.lizhi_cad_cloud_upload_attempts FROM PUBLIC,anon,authenticated;
COMMIT;
