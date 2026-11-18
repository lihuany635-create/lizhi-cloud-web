\set ON_ERROR_STOP on
-- This script executes ONLY on a disposable CI PostgreSQL service.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;
\i integrations/gridcraft/P3_SQL_CANDIDATE.sql
DO $$
BEGIN
  IF has_table_privilege('anon','public.lz_gridcraft_devices','SELECT') OR
     has_table_privilege('authenticated','public.lz_gridcraft_jobs','SELECT') OR
     has_function_privilege('anon','public.lz_gridcraft_claim_job(text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'anonymous or authenticated role has unacceptable access';
  END IF;
  IF (SELECT count(*) FROM pg_class WHERE relname IN
      ('lz_gridcraft_pairings','lz_gridcraft_devices','lz_gridcraft_jobs') AND relrowsecurity) != 3 THEN
    RAISE EXCEPTION 'RLS not enabled on all P3 tables';
  END IF;
END $$;

INSERT INTO public.lz_gridcraft_devices(device_id,owner_id,token_sha256,last_seen,last_status)
VALUES ('synthetic-owner-device','synthetic-owner-2026',repeat('a',64),now(),'READY');
INSERT INTO public.lz_gridcraft_jobs(id,owner_id,device_id,tool,arguments,expires_at)
VALUES ('00000000-0000-4000-8000-000000000001','synthetic-owner-2026','synthetic-owner-device',
        'gridcraft_read_range','{"doc":"dummy","sheet":"Demo","range":"B3"}'::jsonb,now()+interval '1 minute');

SET ROLE service_role;

DO $$
DECLARE result record;
BEGIN
  SELECT * INTO result FROM public.lz_gridcraft_claim_job('wrong-owner-2026','synthetic-owner-device');
  IF FOUND THEN RAISE EXCEPTION 'owner check failed'; END IF;

  SELECT * INTO result FROM public.lz_gridcraft_claim_job('synthetic-owner-2026','synthetic-owner-device');
  IF NOT FOUND OR result.job_id <> '00000000-0000-4000-8000-000000000001'::uuid THEN
    RAISE EXCEPTION 'failed to claim authorized queued job';
  END IF;

  SELECT * INTO result FROM public.lz_gridcraft_claim_job('synthetic-owner-2026','synthetic-owner-device');
  IF FOUND THEN RAISE EXCEPTION 'duplicate job claim allowed'; END IF;

  IF public.lz_gridcraft_complete_job('wrong-owner-2026','synthetic-owner-device',
       '00000000-0000-4000-8000-000000000001'::uuid,'{"ok":true}'::jsonb) THEN
    RAISE EXCEPTION 'wrong owner completed job';
  END IF;
  IF NOT public.lz_gridcraft_complete_job('synthetic-owner-2026','synthetic-owner-device',
       '00000000-0000-4000-8000-000000000001'::uuid,'{"ok":true}'::jsonb) THEN
    RAISE EXCEPTION 'correct owner could not complete job';
  END IF;
  IF public.lz_gridcraft_complete_job('synthetic-owner-2026','synthetic-owner-device',
       '00000000-0000-4000-8000-000000000001'::uuid,'{"ok":true}'::jsonb) THEN
    RAISE EXCEPTION 'same job completed twice';
  END IF;
  RAISE NOTICE 'PASS: RLS, owner isolation, single claim and no replay complete';
END $$;

RESET ROLE;
