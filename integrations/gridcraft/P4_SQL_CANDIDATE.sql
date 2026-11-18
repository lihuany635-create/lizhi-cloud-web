-- GRIDCRAFT P4 MIGRATION CANDIDATE — NOT APPLIED TO PRODUCTION.
-- Requires separate explicit production approval and real Windows safety tests.
-- Preserve all P3 tool types and RLS; do not create any new database.
BEGIN;
ALTER TABLE public.lz_gridcraft_jobs
 DROP CONSTRAINT IF EXISTS lz_gridcraft_jobs_tool_check;
ALTER TABLE public.lz_gridcraft_jobs
 ADD CONSTRAINT lz_gridcraft_jobs_tool_check
 CHECK(tool IN (
  'gridcraft_list_workbooks','gridcraft_read_range',
  'gridcraft_prepare_write','gridcraft_commit_write'
 ));
-- Future P4 production rollout must be gated in the existing Edge & Site:
-- Edge config.p4Enabled = false until human approval and tests.
-- P4 command arguments hold sensitive proposed cell data. Restrict to
-- service_role and purge completed P4 jobs after the result has been delivered.
-- Failed/expired P4 jobs need an explicit 24h retention clean-up job before
-- enabling production writes. No Storage or public new RLS policy is added.
COMMIT;
