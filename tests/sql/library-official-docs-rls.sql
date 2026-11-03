-- Disposable PostgreSQL test for 圖書館工作專區・公文. Does not connect to production Supabase.
\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$fn$;
CREATE FUNCTION public.lizhi_web_is_allowed() RETURNS boolean LANGUAGE sql STABLE AS $fn$
 SELECT current_setting('request.jwt.claim.email',true)='approved@example.invalid'
$fn$;

\ir ../../supabase/migrations/20261103030000_lizhi_library_official_docs.sql

DO $t$ BEGIN
 IF has_table_privilege('anon','public.lizhi_library_official_docs','SELECT') THEN RAISE EXCEPTION 'ANON CAN READ'; END IF;
 IF has_function_privilege('anon','public.lizhi_library_official_docs_search(text)','EXECUTE') THEN RAISE EXCEPTION 'ANON CAN SEARCH'; END IF;
END $t$;

-- 核准的本人
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
SET request.jwt.claim.email = 'approved@example.invalid';
INSERT INTO public.lizhi_library_official_docs(direction,doc_no,issuer,subject,drive_file_id,text_excerpt,speed)
 VALUES ('incoming','府工字第1150001234號','臺北市政府工務局','函送本案施工計畫審查意見','AbCdEfGh12345678','主旨：函送本案施工計畫審查意見，請於文到七日內修正。','速件');

DO $t$ DECLARE n int; c timestamptz; BEGIN
 SELECT count(*) INTO n FROM public.lizhi_library_official_docs_search('施工計畫'); IF n<>1 THEN RAISE EXCEPTION 'SEARCH FAILED %',n; END IF;
 UPDATE public.lizhi_library_official_docs SET status='closed';
 SELECT closed_at INTO c FROM public.lizhi_library_official_docs; IF c IS NULL THEN RAISE EXCEPTION 'CLOSED_AT NOT SET'; END IF;
 UPDATE public.lizhi_library_official_docs SET status='doing';
 SELECT closed_at INTO c FROM public.lizhi_library_official_docs; IF c IS NOT NULL THEN RAISE EXCEPTION 'CLOSED_AT NOT CLEARED'; END IF;
 BEGIN
  INSERT INTO public.lizhi_library_official_docs(direction,drive_file_id) VALUES ('incoming','AbCdEfGh12345678');
  RAISE EXCEPTION 'DUPLICATE DRIVE FILE ALLOWED';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.lizhi_library_official_docs(direction,speed) VALUES ('incoming','超級急件');
  RAISE EXCEPTION 'BAD SPEED ALLOWED';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $t$;

-- 已登入但未核准
SET request.jwt.claim.email = 'unapproved@example.invalid';
DO $t$ DECLARE n int; BEGIN
 SELECT count(*) INTO n FROM public.lizhi_library_official_docs; IF n<>0 THEN RAISE EXCEPTION 'UNAPPROVED CAN READ'; END IF;
END $t$;

-- 另一位帳號（即使核准）看不到別人的公文
SET request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
SET request.jwt.claim.email = 'approved@example.invalid';
DO $t$ DECLARE n int; BEGIN
 SELECT count(*) INTO n FROM public.lizhi_library_official_docs; IF n<>0 THEN RAISE EXCEPTION 'CROSS ACCOUNT READ'; END IF;
 BEGIN
  INSERT INTO public.lizhi_library_official_docs(user_id,direction) VALUES ('11111111-1111-4111-8111-111111111111','incoming');
  RAISE EXCEPTION 'CROSS ACCOUNT INSERT';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $t$;

RESET ROLE;
SELECT 'LIBRARY OFFICIAL DOCS SQL TEST PASS' AS result;
