-- Applied to production 2026-10-26 as migration 20261026091616.
-- PostgREST 14.5 retries SQLSTATE 40001 indefinitely for a deliberate
-- optimistic-revision conflict. P0001 is a non-retryable application error.
-- No table, privilege, document, or idempotency change.
DO $repair$
DECLARE
  funcdef text;
  old_fragment constant text := 'raise exception ''MODEL_REVISION_CONFLICT'' using errcode=''40001''';
  new_fragment constant text := 'raise exception ''MODEL_REVISION_CONFLICT'' using errcode=''P0001''';
BEGIN
  SELECT pg_get_functiondef('public.lizhi_model_cloud_write(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure)
    INTO funcdef;
  IF strpos(funcdef, old_fragment) > 0 THEN
    EXECUTE replace(funcdef, old_fragment, new_fragment);
  ELSIF strpos(funcdef, new_fragment) = 0 THEN
    RAISE EXCEPTION 'Unexpected model write definition: repair not applied';
  END IF;
END
$repair$;
