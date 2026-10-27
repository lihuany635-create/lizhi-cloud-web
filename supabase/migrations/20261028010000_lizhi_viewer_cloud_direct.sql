-- Independent cloud-direct mannequin state for existing GLB viewer.
-- DOES NOT touch GLB, Hew, current online sessions or existing viewer dispatcher.
CREATE TABLE IF NOT EXISTS public.lizhi_viewer_cloud_scenes (
  owner_id text NOT NULL,
  model_key text NOT NULL,
  model_sha text NOT NULL CHECK (model_sha ~ '^[a-f0-9]{64}$'),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  state jsonb NOT NULL DEFAULT '{"avatars":[],"selected_id":null,"camera":{"mode":"free"},"checkpoints":[]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,model_key,model_sha),
  CONSTRAINT lizhi_viewer_cloud_state_shape CHECK (jsonb_typeof(state)='object' AND jsonb_typeof(state->'avatars')='array')
);
CREATE TABLE IF NOT EXISTS public.lizhi_viewer_cloud_requests (
  owner_id text NOT NULL,
  request_id uuid NOT NULL,
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  model_key text NOT NULL,
  model_sha text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,request_id)
);
CREATE INDEX IF NOT EXISTS lizhi_viewer_cloud_requests_time ON public.lizhi_viewer_cloud_requests(owner_id,created_at DESC);
ALTER TABLE public.lizhi_viewer_cloud_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lizhi_viewer_cloud_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lizhi_viewer_cloud_scenes, public.lizhi_viewer_cloud_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON public.lizhi_viewer_cloud_scenes TO service_role;
GRANT SELECT,INSERT ON public.lizhi_viewer_cloud_requests TO service_role;
CREATE OR REPLACE FUNCTION public.lizhi_viewer_cloud_read(p_owner text,p_model_key text,p_model_sha text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE s record;
BEGIN
  IF current_user <> 'service_role' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF left(p_owner,41) <> 'appgprj_6ae0c336243881919e9ba2bbf450f1fb:' OR length(p_owner)>200 THEN RAISE EXCEPTION 'OWNER_INVALID'; END IF;
  SELECT revision,state,updated_at INTO s FROM public.lizhi_viewer_cloud_scenes
   WHERE owner_id=p_owner AND model_key=p_model_key AND model_sha=p_model_sha;
  RETURN pg_catalog.jsonb_build_object('ok',true,'revision',coalesce(s.revision,0),
    'state',coalesce(s.state,'{"avatars":[],"selected_id":null,"camera":{"mode":"free"},"checkpoints":[]}'::jsonb),
    'updated_at',s.updated_at,'model_key',p_model_key,'model_sha',p_model_sha,
    'render_ready',false,'geometry_qa','NOT_PERFORMED','cloud_rendering',false);
END;
$$;
CREATE OR REPLACE FUNCTION public.lizhi_viewer_cloud_write(
  p_owner text,p_request uuid,p_model_key text,p_model_sha text,
  p_expected_revision bigint,p_fingerprint text,p_state jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE existing record; current_row record; output jsonb; next_revision bigint;
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF left(p_owner,41)<>'appgprj_6ae0c336243881919e9ba2bbf450f1fb:' OR length(p_owner)>200 THEN RAISE EXCEPTION 'OWNER_INVALID'; END IF;
 IF p_request IS NULL OR p_model_key !~ '^[a-z0-9_-]{2,80}$' OR
    p_model_sha !~ '^[a-f0-9]{64}$' OR p_fingerprint !~ '^[a-f0-9]{64}$' OR
    p_expected_revision<0 THEN RAISE EXCEPTION 'INVALID_ARGUMENTS'; END IF;
 IF p_state IS NULL OR pg_catalog.jsonb_typeof(p_state)<>'object' OR
   pg_catalog.jsonb_typeof(p_state->'avatars')<>'array' OR
   pg_catalog.jsonb_array_length(p_state->'avatars')>100 OR
   pg_catalog.length(p_state::text)>125000 THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
 SELECT fingerprint,response INTO existing FROM public.lizhi_viewer_cloud_requests
 WHERE owner_id=p_owner AND request_id=p_request;
 IF FOUND THEN
   IF existing.fingerprint<>p_fingerprint THEN RAISE EXCEPTION 'REQUEST_ID_REUSED'; END IF;
   RETURN existing.response;
 END IF;
 INSERT INTO public.lizhi_viewer_cloud_scenes(owner_id,model_key,model_sha) VALUES(p_owner,p_model_key,p_model_sha)
 ON CONFLICT DO NOTHING;
 SELECT revision,state INTO current_row FROM public.lizhi_viewer_cloud_scenes
 WHERE owner_id=p_owner AND model_key=p_model_key AND model_sha=p_model_sha FOR UPDATE;
 -- Retest request after locking the scene, since another request may have committed.
 SELECT fingerprint,response INTO existing FROM public.lizhi_viewer_cloud_requests
 WHERE owner_id=p_owner AND request_id=p_request;
 IF FOUND THEN
   IF existing.fingerprint<>p_fingerprint THEN RAISE EXCEPTION 'REQUEST_ID_REUSED'; END IF;
   RETURN existing.response;
 END IF;
 IF current_row.revision<>p_expected_revision THEN
   RETURN pg_catalog.jsonb_build_object('ok',false,'code','REVISION_CONFLICT','revision',current_row.revision);
 END IF;
 next_revision:=current_row.revision+1;
 UPDATE public.lizhi_viewer_cloud_scenes SET revision=next_revision,state=p_state,updated_at=now()
 WHERE owner_id=p_owner AND model_key=p_model_key AND model_sha=p_model_sha;
 output:=pg_catalog.jsonb_build_object('ok',true,'revision',next_revision,'state',p_state,'model_key',p_model_key,'model_sha',p_model_sha,
   'mode','cloud_direct','render_ready',false,'geometry_qa','NOT_PERFORMED');
 INSERT INTO public.lizhi_viewer_cloud_requests(owner_id,request_id,fingerprint,model_key,model_sha,response)
 VALUES(p_owner,p_request,p_fingerprint,p_model_key,p_model_sha,output);
 RETURN output;
END;
$$;
REVOKE ALL ON FUNCTION public.lizhi_viewer_cloud_read(text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.lizhi_viewer_cloud_write(text,uuid,text,text,bigint,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lizhi_viewer_cloud_read(text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lizhi_viewer_cloud_write(text,uuid,text,text,bigint,text,jsonb) TO service_role;
