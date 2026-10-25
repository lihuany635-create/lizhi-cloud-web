\set ON_ERROR_STOP on
-- Only for a disposable PostgreSQL 16 test container.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create table auth.users(id uuid primary key);
insert into auth.users(id) values
('11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222');
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
create function auth.role() returns text language sql stable as $$
 select nullif(current_setting('request.jwt.claim.role',true),'');
$$;
grant usage on schema auth to authenticated,service_role;
grant execute on function auth.uid() to authenticated,service_role;
grant execute on function auth.role() to authenticated,service_role;
create function public.lizhi_web_is_allowed() returns boolean language sql stable as $$
 select current_setting('request.jwt.claim.allowed',true)='true';
$$;
\i supabase/migrations/20261025023119_lizhi_cad_mcp_secure_relay_v1.sql
\i cad/sites/sql/001_sites_bridge.REVIEW_ONLY.sql
\i cad/sites/sql/002_entity_read_queue.REVIEW_ONLY.sql

-- Anonymous and regular authenticated clients cannot invoke Sites-only RPCs.
do $$
begin
 if has_function_privilege('anon','public.lizhi_cad_site_enqueue(uuid,uuid,text,jsonb,uuid)','EXECUTE') then
  raise exception 'anon incorrectly granted CAD Sites write';
 end if;
 if has_function_privilege('authenticated','public.lizhi_cad_site_enqueue(uuid,uuid,text,jsonb,uuid)','EXECUTE') then
  raise exception 'regular app incorrectly granted Sites write';
 end if;
end $$;

-- Current CAD browser stays the original first-party signed-in session owner.
set role authenticated;
set request.jwt.claim.role='authenticated';
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.allowed='true';
select public.lizhi_cad_begin_session('33333333-3333-4333-8333-333333333333');

-- A trusted server can only write geometry into that active owner's session.
reset role;
set role service_role;
set request.jwt.claim.role='service_role';
do $$
declare owner uuid:='11111111-1111-4111-8111-111111111111';
 session uuid:='33333333-3333-4333-8333-333333333333';
 req uuid:='44444444-4444-4444-8444-444444444444';
 job uuid;
begin
 if jsonb_array_length(public.lizhi_cad_site_active(owner))<>1 then
  raise exception 'active owner session missing';
 end if;
 if jsonb_array_length(public.lizhi_cad_site_active('22222222-2222-4222-8222-222222222222'))<>0 then
  raise exception 'other user session leaked';
 end if;
 begin
  perform public.lizhi_cad_site_enqueue(
   '22222222-2222-4222-8222-222222222222',session,'rectang',
   '{"p1":[0,0],"p2":[800,900]}'::jsonb,gen_random_uuid());
  raise exception 'cross owner write accepted';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.lizhi_cad_site_enqueue(owner,session,'circle',
    '{"center":[0,0],"radius":-1}'::jsonb,gen_random_uuid());
  raise exception 'bad geometry accepted';
 exception when invalid_parameter_value then null;
 end;
 job:=public.lizhi_cad_site_enqueue(owner,session,'rectang',
    '{"p1":[0,0],"p2":[800,900]}'::jsonb,req);
 if job is distinct from public.lizhi_cad_site_enqueue(owner,session,'rectang',
    '{"p1":[0,0],"p2":[800,900]}'::jsonb,req) then
   raise exception 'duplicate created new job';
 end if;
 if public.lizhi_cad_site_job(owner,job)->>'state'<>'queued' then
   raise exception 'queued report incorrect';
 end if;
 if public.lizhi_cad_site_job('22222222-2222-4222-8222-222222222222',job) is not null then
   raise exception 'cross owner job detail leaked';
 end if;
end $$;

-- At the rate cap, a duplicate request must still return the original job ID.
-- A different command with the same request ID must still fail.
do $cad$
declare
 owner uuid:='11111111-1111-4111-8111-111111111111';
 session uuid:='33333333-3333-4333-8333-333333333333';
 req uuid:='44444444-4444-4444-8444-444444444444';
 original uuid;
 refused boolean:=false;
 conflict_found boolean:=false;
begin
 original:=public.lizhi_cad_site_enqueue(owner,session,'rectang',
  '{"p1":[0,0],"p2":[800,900]}'::jsonb,req);
 for i in 1..19 loop
   perform public.lizhi_cad_site_enqueue(owner,session,'rectang',
    '{"p1":[0,0],"p2":[800,900]}'::jsonb,gen_random_uuid());
 end loop;
 if public.lizhi_cad_site_enqueue(owner,session,'rectang',
  '{"p1":[0,0],"p2":[800,900]}'::jsonb,req) is distinct from original then
   raise exception 'idempotent retry failed at rate cap';
 end if;
 begin
   perform public.lizhi_cad_site_enqueue(owner,session,'rectang',
    '{"p1":[0,0],"p2":[800,901]}'::jsonb,req);
 exception when unique_violation then conflict_found:=true;
 end;
 if not conflict_found then raise exception 'conflicting request ID accepted'; end if;
 begin
   perform public.lizhi_cad_site_enqueue(owner,session,'rectang',
    '{"p1":[0,0],"p2":[800,900]}'::jsonb,gen_random_uuid());
 exception when raise_exception then refused:=true;
 end;
 if not refused then raise exception 'rate cap bypassed'; end if;
end $cad$;

-- Other credentials cannot spoof service_role by only being signed into Site.
set request.jwt.claim.role='authenticated';
do $$
begin
 if public.lizhi_cad_site_active('11111111-1111-4111-8111-111111111111')<>'[]'::jsonb then
   raise exception 'wrong JWT role passed service gate';
 end if;
end $$;
reset role;

-- The first-party CAD browser still claims and finishes the same queued job.
set role authenticated;
set request.jwt.claim.role='authenticated';
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.allowed='true';
do $$
declare item jsonb;
begin
 item:=public.lizhi_cad_claim_next('33333333-3333-4333-8333-333333333333');
 if item->>'command'<>'rectang' then raise exception 'browser could not claim Site rectangle'; end if;
 if not public.lizhi_cad_finish('33333333-3333-4333-8333-333333333333',
  (item->>'id')::uuid,true,'{"drawn":true}'::jsonb,null)
 then raise exception 'browser could not finish Site work'; end if;
end $$;
reset role;
set role service_role;
set request.jwt.claim.role='service_role';
do $$
declare job uuid;
begin
 job:=public.lizhi_cad_site_enqueue('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','rectang','{"p1":[0,0],"p2":[800,900]}'::jsonb,'44444444-4444-4444-8444-444444444444');
 if public.lizhi_cad_site_job('11111111-1111-4111-8111-111111111111',job)->>'state'<>'succeeded' then
   raise exception 'Site cannot confirm native CAD success';
 end if;
end $$;
reset role;
-- Strictly isolated read-job queue acceptance and native browser claim.
-- Existing rate-limit test has filled this disposable job table; clear only
-- disposable queued CI rows so the new read test can verify its own work.
delete from lizhi_private.lizhi_cad_commands where state='queued';
set role service_role;
set request.jwt.claim.role='service_role';
do $entity$
declare
 owner uuid:='11111111-1111-4111-8111-111111111111';
 session uuid:='33333333-3333-4333-8333-333333333333';
 job uuid;
begin
 if has_function_privilege('anon','public.lizhi_cad_site_enqueue_read(uuid,uuid,text,jsonb,uuid)','EXECUTE') then
  raise exception 'anon can enqueue CAD entity reads';
 end if;
 if has_function_privilege('authenticated','public.lizhi_cad_site_enqueue_read(uuid,uuid,text,jsonb,uuid)','EXECUTE') then
  raise exception 'regular authenticated can enqueue CAD entity reads';
 end if;
 begin
  perform public.lizhi_cad_site_enqueue_read(owner,session,'lizhi.entities',
    '{"limit":1000}'::jsonb,gen_random_uuid());
  raise exception 'oversized entity query accepted';
 exception when invalid_parameter_value then null;
 end;
 begin
  perform public.lizhi_cad_site_enqueue_read(owner,session,'lizhi.entities',
    '{"path":"local.dxf"}'::jsonb,gen_random_uuid());
  raise exception 'path filter was accepted';
 exception when invalid_parameter_value then null;
 end;
 job:=public.lizhi_cad_site_enqueue_read(owner,session,'lizhi.entities',
   '{"type":"Line","limit":8,"offset":0}'::jsonb,'88888888-8888-4888-8888-888888888888');
 if job is distinct from public.lizhi_cad_site_enqueue_read(owner,session,'lizhi.entities',
   '{"type":"Line","limit":8,"offset":0}'::jsonb,'88888888-8888-4888-8888-888888888888') then
   raise exception 'read job idempotency violated';
 end if;
end $entity$;
reset role;
set role authenticated;
set request.jwt.claim.role='authenticated';
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.allowed='true';
do $entity$
declare job jsonb;
begin
 job:=public.lizhi_cad_claim_next('33333333-3333-4333-8333-333333333333');
 if job->>'command'<>'lizhi.entities' then
   raise exception 'native browser cannot claim read work';
 end if;
 if not public.lizhi_cad_finish('33333333-3333-4333-8333-333333333333',
  (job->>'id')::uuid,true,
  '{"revision":1,"count":1,"offset":0,"entities":[{"handle":"1A","type":"Line"}]}'::jsonb,null)
 then raise exception 'native read work finish failed'; end if;
end $entity$;
reset role;
set role service_role;
set request.jwt.claim.role='service_role';
do $entity$
declare rec jsonb;
begin
 rec:=public.lizhi_cad_site_job('11111111-1111-4111-8111-111111111111',
     (select id from lizhi_private.lizhi_cad_commands where idempotency_key='88888888-8888-4888-8888-888888888888'));
 if rec->>'state'<>'succeeded' or rec->'result'->>'count'<>'1' then
  raise exception 'read result receipt missing';
 end if;
end $entity$;
reset role;

select 'CAD_SITES_POSTGRES_ISOLATION_AND_COMMAND_PASS' as result;
