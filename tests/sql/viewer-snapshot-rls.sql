-- Disposable PostgreSQL test. Does not connect to production Supabase.
\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$fn$;
CREATE FUNCTION public.lizhi_web_is_allowed() RETURNS boolean LANGUAGE sql STABLE AS $fn$
 SELECT current_setting('request.jwt.claim.email',true)='approved@example.invalid'
$fn$;
CREATE TABLE public.lizhi_viewer_cloud_scenes (
 owner_id text NOT NULL, model_key text NOT NULL, model_sha text NOT NULL,
 revision bigint NOT NULL, state jsonb NOT NULL, updated_at timestamptz DEFAULT now(),
 PRIMARY KEY (owner_id,model_key,model_sha)
);
INSERT INTO public.lizhi_viewer_cloud_scenes(owner_id,model_key,model_sha,revision,state)
 VALUES ('appgprj_6ae0c336243881919e9ba2bbf450f1fb:only-owner','lahudi-academy',
 repeat('a',64),5,
 '{"selected_id":"avatar-one","avatars":[{"id":"avatar-one","position":[0,2,-95]}]}'::jsonb);

\ir ../../supabase/migrations/20261031010000_lizhi_viewer_browser_snapshots.sql

DO $test$
BEGIN
 IF has_table_privilege('anon','public.lizhi_viewer_cloud_snapshots','SELECT')
   OR has_table_privilege('authenticated','public.lizhi_viewer_cloud_snapshots','SELECT') THEN
  RAISE EXCEPTION 'RLS TABLE ACCESS NOT RESTRICTED';
 END IF;
 IF has_function_privilege('anon','public.lizhi_viewer_cloud_snapshot_submit(text,text,bigint,text,text)','EXECUTE')
   OR has_function_privilege('anon','public.lizhi_viewer_cloud_snapshot_revoke(text,text)','EXECUTE') THEN
  RAISE EXCEPTION 'ANONYMOUS RPC ACCESS NOT RESTRICTED';
 END IF;
END $test$;

-- Signed-in, but NOT owner-allowlisted: SECURITY DEFINER must not grant access.
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
SET request.jwt.claim.email = 'unapproved@example.invalid';
DO $test$
BEGIN
 BEGIN
  PERFORM public.lizhi_viewer_cloud_snapshot_submit('lahudi-academy',repeat('a',64),5,'avatar-one','/9j/AAAA');
  RAISE EXCEPTION 'UNAPPROVED_USER_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'FORBIDDEN' THEN RAISE; END IF;
 END;
END $test$;

SET request.jwt.claim.email = 'approved@example.invalid';
-- Valid header + body + trailer test fixture (syntactically scoped JPEG payload).
DO $test$
DECLARE picture text; result jsonb;
BEGIN
 picture := replace(pg_catalog.encode(
  pg_catalog.decode('ffd8ff','hex')
  || pg_catalog.decode(repeat('00',1100),'hex')
  || pg_catalog.decode('ffd9','hex'),'base64'), E'\n','');
 result := public.lizhi_viewer_cloud_snapshot_submit('lahudi-academy',repeat('a',64),5,'avatar-one',picture);
 IF result->>'ok' <> 'true' OR (result->>'revision')::bigint <> 5 THEN
  RAISE EXCEPTION 'VALID_OWNER_FRAME_REJECTED';
 END IF;
 BEGIN
  PERFORM public.lizhi_viewer_cloud_snapshot_submit('lahudi-academy',repeat('a',64),4,'avatar-one',picture);
  RAISE EXCEPTION 'STALE_REVISION_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'FRAME_SCENE_REVISION_MISMATCH' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM public.lizhi_viewer_cloud_snapshot_submit('lahudi-academy',repeat('a',64),5,'wrong-avatar',picture);
  RAISE EXCEPTION 'WRONG_AVATAR_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'FRAME_SCENE_REVISION_MISMATCH' THEN RAISE; END IF;
 END;
END $test$;
RESET ROLE;
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.lizhi_viewer_cloud_snapshots) <> 1 THEN
  RAISE EXCEPTION 'FRAME_NOT_STORED';
 END IF;
END $test$;

-- Second private-Site principal for same model must cause a fail-closed response.
INSERT INTO public.lizhi_viewer_cloud_scenes(owner_id,model_key,model_sha,revision,state)
 VALUES ('appgprj_6ae0c336243881919e9ba2bbf450f1fb:second-owner','lahudi-academy',
 repeat('a',64),5,
 '{"selected_id":"avatar-one","avatars":[{"id":"avatar-one","position":[0,2,-95]}]}'::jsonb);
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
SET request.jwt.claim.email = 'approved@example.invalid';
DO $test$
DECLARE picture text;
BEGIN
 picture := replace(pg_catalog.encode(pg_catalog.decode('ffd8ff','hex')
  || pg_catalog.decode(repeat('00',1100),'hex')
  || pg_catalog.decode('ffd9','hex'),'base64'), E'\n','');
 BEGIN
  PERFORM public.lizhi_viewer_cloud_snapshot_submit('lahudi-academy',repeat('a',64),5,'avatar-one',picture);
  RAISE EXCEPTION 'AMBIGUOUS_OWNER_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'OWNER_SCOPE_AMBIGUOUS' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM public.lizhi_viewer_cloud_snapshot_revoke('lahudi-academy',repeat('a',64));
  RAISE EXCEPTION 'AMBIGUOUS_REVOKE_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'OWNER_SCOPE_AMBIGUOUS' THEN RAISE; END IF;
 END;
END $test$;
RESET ROLE;
DELETE FROM public.lizhi_viewer_cloud_scenes WHERE owner_id LIKE '%:second-owner';
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
SET request.jwt.claim.email = 'approved@example.invalid';
DO $test$
DECLARE result jsonb;
BEGIN
 result := public.lizhi_viewer_cloud_snapshot_revoke('lahudi-academy',repeat('a',64));
 IF result->>'revoked' <> 'true' THEN RAISE EXCEPTION 'REVOKE_FAILED'; END IF;
END $test$;
RESET ROLE;
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.lizhi_viewer_cloud_snapshots) <> 0 THEN
  RAISE EXCEPTION 'FRAME_STILL_STORED_AFTER_REVOKE';
 END IF;
END $test$;
SELECT 'VIEWER_SNAPSHOT_SQL_ISOLATION_PASS' AS result;
