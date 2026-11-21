-- GridCraft v0.5.5 read-only tools: job allow-list candidate. NOT APPLIED.
-- Production constraint read back 2026-11-22 (7 tools). This only ADDS two
-- read-only tool names; it changes no row, grant, RLS policy or function.
-- Apply only with owner approval, after Edge v10 is deployed with
-- readonlyV055Enabled=false, then flip the gate.
BEGIN;
ALTER TABLE public.lz_gridcraft_jobs
  DROP CONSTRAINT IF EXISTS lz_gridcraft_jobs_tool_check;
ALTER TABLE public.lz_gridcraft_jobs
  ADD CONSTRAINT lz_gridcraft_jobs_tool_check
  CHECK (tool = ANY (ARRAY[
    'gridcraft_list_workbooks'::text, 'gridcraft_read_range'::text,
    'gridcraft_prepare_write'::text, 'gridcraft_commit_write'::text,
    'gridcraft_save_prepare'::text, 'gridcraft_save_commit'::text, 'gridcraft_save_status'::text,
    -- v0.5.5 read-only
    'gridcraft_inspect_workbook'::text, 'gridcraft_evaluate_formula'::text
  ])) NOT VALID;
ALTER TABLE public.lz_gridcraft_jobs VALIDATE CONSTRAINT lz_gridcraft_jobs_tool_check;
COMMIT;

-- Rollback (restores the 2026-11-22 production definition):
-- BEGIN;
-- ALTER TABLE public.lz_gridcraft_jobs DROP CONSTRAINT IF EXISTS lz_gridcraft_jobs_tool_check;
-- ALTER TABLE public.lz_gridcraft_jobs ADD CONSTRAINT lz_gridcraft_jobs_tool_check
--   CHECK (tool = ANY (ARRAY['gridcraft_list_workbooks'::text,'gridcraft_read_range'::text,
--     'gridcraft_prepare_write'::text,'gridcraft_commit_write'::text,'gridcraft_save_prepare'::text,
--     'gridcraft_save_commit'::text,'gridcraft_save_status'::text]));
-- COMMIT;
-- Note: rollback fails while v0.5.5 job rows exist; delete or expire them first.
