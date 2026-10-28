-- Read-only view of the cloud avatar state for the signed-in site owner's own browser.
-- The GitHub Pages viewer polls this to show what ChatGPT moved; it can NOT write.
-- Single-user site: access is gated by public.lizhi_web_is_allowed() (approved Google account).
CREATE OR REPLACE FUNCTION public.lizhi_viewer_cloud_browser_read(
  p_model_key text, p_model_sha text, p_since bigint DEFAULT -1
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
DECLARE s record;
BEGIN
  IF NOT public.lizhi_web_is_allowed() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_model_key !~ '^[a-z0-9_-]{2,80}$' OR p_model_sha !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'INVALID_ARGUMENTS'; END IF;
  SELECT revision,state,updated_at INTO s FROM public.lizhi_viewer_cloud_scenes
   WHERE owner_id LIKE 'appgprj\_6ae0c336243881919e9ba2bbf450f1fb:%'
     AND model_key=p_model_key AND model_sha=p_model_sha
   ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('ok',true,'revision',0,'state',NULL,'updated_at',NULL);
  END IF;
  IF s.revision<=p_since THEN
    RETURN pg_catalog.jsonb_build_object('ok',true,'revision',s.revision,'unchanged',true,'updated_at',s.updated_at);
  END IF;
  RETURN pg_catalog.jsonb_build_object('ok',true,'revision',s.revision,'updated_at',s.updated_at,
    'state',pg_catalog.jsonb_build_object('avatars',s.state->'avatars','selected_id',s.state->'selected_id','camera',s.state->'camera',
      'checkpoint_count',pg_catalog.jsonb_array_length(coalesce(s.state->'checkpoints','[]'::jsonb))));
END;
$$;
REVOKE ALL ON FUNCTION public.lizhi_viewer_cloud_browser_read(text,text,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lizhi_viewer_cloud_browser_read(text,text,bigint) TO authenticated;
