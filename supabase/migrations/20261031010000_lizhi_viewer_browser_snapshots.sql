-- Optional owner-browser WebGL capture channel. No cloud GPU and no modification to GLBs.
-- Owner must explicitly enable capture in the authenticated GitHub Pages viewer.
-- Latest JPEG per model only; read back solely through the private Site's authenticated Edge.
CREATE TABLE IF NOT EXISTS public.lizhi_viewer_cloud_snapshots (
  owner_id text NOT NULL,
  model_key text NOT NULL,
  model_sha text NOT NULL,
  revision bigint NOT NULL CHECK (revision >= 0),
  avatar_id text NOT NULL,
  jpeg_b64 text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id,model_key,model_sha)
);
ALTER TABLE public.lizhi_viewer_cloud_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lizhi_viewer_cloud_snapshots FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.lizhi_viewer_cloud_snapshot_submit(
  p_model_key text, p_model_sha text, p_revision bigint,
  p_avatar_id text, p_jpeg_base64 text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE s record; frame bytea; matching_owners bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT public.lizhi_web_is_allowed() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  -- Every upload also sweeps expired frames, so storage never accumulates.
  PERFORM public.lizhi_viewer_cloud_snapshot_purge(300);
  IF p_model_key !~ '^[a-z0-9_-]{2,80}$'
     OR p_model_sha !~ '^[a-f0-9]{64}$'
     OR p_revision IS NULL OR p_revision < 0
     OR p_avatar_id IS NULL OR length(p_avatar_id) > 200
     OR p_jpeg_base64 IS NULL OR length(p_jpeg_base64) NOT BETWEEN 1000 AND 350000
     OR p_jpeg_base64 !~ '^/9j/[A-Za-z0-9+/]*={0,2}$'
  THEN RAISE EXCEPTION 'INVALID_FRAME'; END IF;
  frame := pg_catalog.decode(p_jpeg_base64,'base64');
  IF pg_catalog.octet_length(frame)>262144
     OR pg_catalog.substring(frame,1,3) <> pg_catalog.decode('ffd8ff','hex')
     OR pg_catalog.substring(frame,pg_catalog.octet_length(frame)-1,2) <> pg_catalog.decode('ffd9','hex')
  THEN RAISE EXCEPTION 'INVALID_JPEG'; END IF;
  -- Browser account is approved separately from the private Site principal.
  -- Fail closed rather than select an arbitrary principal if Site ownership grows.
  SELECT pg_catalog.count(DISTINCT owner_id) INTO matching_owners
    FROM public.lizhi_viewer_cloud_scenes
    WHERE pg_catalog.left(owner_id,pg_catalog.length('appgprj_6ae0c336243881919e9ba2bbf450f1fb:'))
      = 'appgprj_6ae0c336243881919e9ba2bbf450f1fb:'
      AND model_key=p_model_key AND model_sha=p_model_sha;
  IF matching_owners <> 1 THEN RAISE EXCEPTION 'OWNER_SCOPE_AMBIGUOUS'; END IF;
  SELECT owner_id,revision,state INTO s FROM public.lizhi_viewer_cloud_scenes
    WHERE pg_catalog.left(owner_id,pg_catalog.length('appgprj_6ae0c336243881919e9ba2bbf450f1fb:'))
      = 'appgprj_6ae0c336243881919e9ba2bbf450f1fb:'
      AND model_key=p_model_key AND model_sha=p_model_sha
    FOR UPDATE;
  IF NOT FOUND OR s.revision <> p_revision OR s.state->>'selected_id' IS DISTINCT FROM p_avatar_id
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(coalesce(s.state->'avatars','[]'::jsonb)) a WHERE a->>'id'=p_avatar_id)
  THEN RAISE EXCEPTION 'FRAME_SCENE_REVISION_MISMATCH'; END IF;
  INSERT INTO public.lizhi_viewer_cloud_snapshots
    (owner_id,model_key,model_sha,revision,avatar_id,jpeg_b64,captured_at)
  VALUES (s.owner_id,p_model_key,p_model_sha,p_revision,p_avatar_id,p_jpeg_base64,now())
  ON CONFLICT (owner_id,model_key,model_sha) DO UPDATE
    SET revision=EXCLUDED.revision,avatar_id=EXCLUDED.avatar_id,
        jpeg_b64=EXCLUDED.jpeg_b64,captured_at=EXCLUDED.captured_at;
  RETURN pg_catalog.jsonb_build_object('ok',true,'revision',p_revision,'avatar_id',p_avatar_id,
    'source','owner_browser_uploaded_jpeg','render_attested',false);
END;
$$;
REVOKE ALL ON FUNCTION public.lizhi_viewer_cloud_snapshot_submit(text,text,bigint,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lizhi_viewer_cloud_snapshot_submit(text,text,bigint,text,text) TO authenticated;

-- Explicit revocation: turning off sharing removes the last frame immediately.
-- Closing a tab without revocation leaves at most a stale, short-lived MCP-visible frame.
CREATE OR REPLACE FUNCTION public.lizhi_viewer_cloud_snapshot_revoke(
 p_model_key text,p_model_sha text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE matching_owners bigint;
BEGIN
 IF auth.uid() IS NULL OR NOT public.lizhi_web_is_allowed() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF p_model_key !~ '^[a-z0-9_-]{2,80}$'
    OR p_model_sha !~ '^[a-f0-9]{64}$'
 THEN RAISE EXCEPTION 'INVALID_ARGUMENTS'; END IF;
 SELECT pg_catalog.count(DISTINCT owner_id) INTO matching_owners
   FROM public.lizhi_viewer_cloud_scenes
   WHERE pg_catalog.left(owner_id,pg_catalog.length('appgprj_6ae0c336243881919e9ba2bbf450f1fb:'))
     = 'appgprj_6ae0c336243881919e9ba2bbf450f1fb:'
     AND model_key=p_model_key AND model_sha=p_model_sha;
 IF matching_owners <> 1 THEN RAISE EXCEPTION 'OWNER_SCOPE_AMBIGUOUS'; END IF;
 DELETE FROM public.lizhi_viewer_cloud_snapshots AS f
 WHERE f.model_key=p_model_key AND f.model_sha=p_model_sha
   AND EXISTS (SELECT 1 FROM public.lizhi_viewer_cloud_scenes AS s
     WHERE s.owner_id=f.owner_id AND s.model_key=f.model_key AND s.model_sha=f.model_sha
       AND pg_catalog.left(s.owner_id,pg_catalog.length('appgprj_6ae0c336243881919e9ba2bbf450f1fb:'))
         = 'appgprj_6ae0c336243881919e9ba2bbf450f1fb:');
 RETURN pg_catalog.jsonb_build_object('ok',true,'revoked',true);
END;
$$;
REVOKE ALL ON FUNCTION public.lizhi_viewer_cloud_snapshot_revoke(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lizhi_viewer_cloud_snapshot_revoke(text,text) TO authenticated;

-- Retention: frames are short-lived evidence, never an archive. Anything older than the
-- given age (minimum 60 s) is deleted. Not callable by browsers; used by submit, the Edge
-- read path (90 s, same window it accepts) and a 5-minute pg_cron sweep when available.
CREATE OR REPLACE FUNCTION public.lizhi_viewer_cloud_snapshot_purge(p_max_age_seconds integer DEFAULT 300)
RETURNS integer
LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $$
 WITH gone AS (
  DELETE FROM public.lizhi_viewer_cloud_snapshots
  WHERE captured_at < pg_catalog.now()
    - pg_catalog.make_interval(secs => GREATEST(coalesce(p_max_age_seconds,300),60))
  RETURNING 1)
 SELECT pg_catalog.count(*)::integer FROM gone;
$$;
REVOKE ALL ON FUNCTION public.lizhi_viewer_cloud_snapshot_purge(integer) FROM PUBLIC, anon, authenticated;
DO $grant$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='service_role') THEN
  GRANT EXECUTE ON FUNCTION public.lizhi_viewer_cloud_snapshot_purge(integer) TO service_role;
 END IF;
END $grant$;
DO $cron$ BEGIN
 CREATE EXTENSION IF NOT EXISTS pg_cron;
 PERFORM cron.schedule('lizhi-viewer-snapshot-purge','*/5 * * * *',
   'SELECT public.lizhi_viewer_cloud_snapshot_purge(300)');
EXCEPTION WHEN OTHERS THEN
 RAISE NOTICE 'pg_cron unavailable (%); frames are still purged on upload and on MCP read', SQLERRM;
END $cron$;
