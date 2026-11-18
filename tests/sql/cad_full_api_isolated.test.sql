\set ON_ERROR_STOP on
-- Isolated PostgreSQL 16 ONLY: Supabase auth/storage stubs, the deployed CAD relay
-- migrations and Sites bridge, then 006 (full commands) and 007 (cloud CAD).
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
grant usage on schema auth to authenticated,service_role,anon;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('role',current_setting('request.jwt.claim.role',true)) $$;
create or replace function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
create or replace function public.lizhi_web_is_allowed() returns boolean language sql stable as $$ select auth.uid() is not null $$;
create schema if not exists storage;
create table if not exists storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
create table if not exists storage.objects(id bigserial primary key,bucket_id text,name text);
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated,service_role,anon;
grant select,insert on storage.objects to authenticated;
grant usage on sequence storage.objects_id_seq to authenticated;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
 select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
\i supabase/migrations/20261025023119_lizhi_cad_mcp_secure_relay_v1.sql
\i supabase/migrations/20261025025149_lizhi_cad_mcp_oauth_client_segregation.sql
\i tests/sql/fixtures_cad_sites_bridge_001.sql
\i cad/sql/006_cad_full_api.REVIEW_ONLY.sql
\i cad/sql/007_cad_cloud.REVIEW_ONLY.sql

do $$ begin
 if not lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"execute","command":"offset","params":{"distance":2}}') then raise exception 'offset refused'; end if;
 if not lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"cmdline","text":"line 0,0 @10,0 c"}') then raise exception 'cmdline refused'; end if;
 if not lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"render","width":800}') then raise exception 'render refused'; end if;
 if lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"execute","command":"open"}') then raise exception 'open allowed'; end if;
 if lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"execute","command":"erase","params":{"handles":["1"]}}') then raise exception 'unconfirmed erase'; end if;
 if not lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"execute","command":"erase","params":{"handles":["1"]},"confirmed":true}') then raise exception 'confirmed erase refused'; end if;
 if lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"execute","command":"saveas","params":{"path":"/x.dxf"}}') then raise exception 'path allowed'; end if;
 if lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"cmdline","text":"appload"}') then raise exception 'appload allowed'; end if;
 if lizhi_private.lizhi_cad_command_valid('lizhi.call','{"op":"shell"}') then raise exception 'unknown op'; end if;
 if not lizhi_private.lizhi_cad_command_valid('rectang','{"p1":[0,0],"p2":[1,1]}') then raise exception 'legacy rectang broke'; end if;
 if (select public from storage.buckets where id='lizhi-cad-files') is distinct from false then raise exception 'bucket'; end if;
end $$;

-- Browser session + Site enqueue + finish with a large call result.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claim.role','authenticated',false);
do $$ begin
 if not public.lizhi_cad_begin_session('33333333-3333-4333-8333-333333333333') then raise exception 'begin'; end if;
end $$;
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
select set_config('t.job',public.lizhi_cad_site_enqueue('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',
 'lizhi.call','{"op":"inspect","entities":true,"limit":500}','55555555-5555-4555-8555-555555555555')::text,false);
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
do $$ declare c jsonb; big jsonb;
begin
 c:=public.lizhi_cad_claim_next('33333333-3333-4333-8333-333333333333');
 if c->>'command'<>'lizhi.call' then raise exception 'claim %',c; end if;
 big:=jsonb_build_object('entities',(select jsonb_agg(jsonb_build_object('handle',g,'type','Line')) from generate_series(1,2000) g),'mutated',false);
 if not public.lizhi_cad_finish('33333333-3333-4333-8333-333333333333',(c->>'id')::uuid,true,big,null) then raise exception 'finish'; end if;
end $$;
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $$ declare j jsonb; begin
 j:=public.lizhi_cad_site_job('11111111-1111-4111-8111-111111111111',current_setting('t.job')::uuid);
 if j->>'state'<>'succeeded' or jsonb_array_length(j->'result'->'entities')<>2000 then raise exception 'large result not kept'; end if;
end $$;

-- Cloud CAD queue.
select set_config('t.doc',(public.lizhi_cad_cloud_new('11111111-1111-4111-8111-111111111111','一樓平面圖',true)->>'document_id'),false);
do $$ declare owner uuid:='11111111-1111-4111-8111-111111111111'; doc uuid:=current_setting('t.doc')::uuid; j1 uuid; c jsonb; r jsonb;
begin
 j1:=public.lizhi_cad_cloud_enqueue(owner,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',doc,0,'{"op":"cmdline","text":"rectang 0,0 8000,6000"}');
 begin perform public.lizhi_cad_cloud_enqueue(owner,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',doc,0,'{"op":"execute","command":"saveas","params":{}}');
  raise exception 'saveas queued in cloud'; exception when insufficient_privilege then null; end;
 c:=public.lizhi_cad_cloud_claim('run-1');
 if (c->>'job_id')::uuid<>j1 or c->'call'->>'op'<>'cmdline' or not (c->>'metric')::boolean then raise exception 'claim %',c; end if;
 r:=public.lizhi_cad_cloud_finish(j1,true,true,owner::text||'/docs/'||doc::text||'/r1.dxf','{"mutated":true}',null);
 if (r->>'revision')::int<>1 then raise exception 'finish %',r; end if;
 if public.lizhi_cad_cloud_job(owner,j1)->>'op'<>'cmdline' then raise exception 'job read-back'; end if;
end $$;
reset role;
select 'LIZHI_CAD_FULL_API_SQL_TEST_PASS' as verdict;
