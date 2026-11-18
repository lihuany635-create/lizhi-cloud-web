-- GridCraft P4 safe additive migration for the ORIGINAL Supabase project.
-- Approved by owner: 2026-11-18 "P4 正式部署".
-- Existing P3 jobs, tables, grants and RLS remain unchanged.
ALTER TABLE public.lz_gridcraft_jobs
  DROP CONSTRAINT IF EXISTS lz_gridcraft_jobs_tool_check;

ALTER TABLE public.lz_gridcraft_jobs
  ADD CONSTRAINT lz_gridcraft_jobs_tool_check
  CHECK (tool IN (
    'gridcraft_list_workbooks',
    'gridcraft_read_range',
    'gridcraft_prepare_write',
    'gridcraft_commit_write'
  ));

-- pg_cron is ALREADY enabled in the original database. Purge ONLY P4
-- ephemeral command arguments/results; never touch P3 jobs or workbook data.
-- Run hourly with a 23-hour threshold so exposure stays below ~24h.
-- Single named job; pg_cron.schedule(name,...) updates an existing name.
SELECT cron.schedule(
  'lizhi-gridcraft-p4-ttl',
  '0 * * * *',
  $gcsql$
  DELETE FROM public.lz_gridcraft_jobs
  WHERE tool IN ('gridcraft_prepare_write','gridcraft_commit_write')
    AND created_at < now() - interval '23 hours'
  $gcsql$
);
