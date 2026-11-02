\set ON_ERROR_STOP on
-- Isolated PostgreSQL 16 ONLY. Boot minimal Supabase auth role/UID stubs.
do $$
begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
grant usage on schema auth to authenticated,service_role,anon;
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
 select jsonb_build_object('role',current_setting('request.jwt.claim.role',true));
$$;
create or replace function public.lizhi_web_is_allowed() returns boolean language sql stable as $$
 select auth.uid() is not null;
$$;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222')
on conflict do nothing;
\i hew/sql/001_model_queue.REVIEW_ONLY.sql
-- Minimal Supabase Storage stubs (bucket table, objects with RLS, foldername).
create schema if not exists storage;
create table if not exists storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
create table if not exists storage.objects(id bigserial primary key,bucket_id text,name text);
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated,service_role,anon;
grant select,insert on storage.objects to authenticated;
grant usage on sequence storage.objects_id_seq to authenticated;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
 select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1];
$$;
\i hew/sql/004_model_full_api.REVIEW_ONLY.sql
\set OWNER '11111111-1111-4111-8111-111111111111'
\set SID '33333333-3333-4333-8333-333333333333'
\set DOC '44444444-4444-4444-8444-444444444444'

-- Client roles still cannot see private tables; finish_v2 is owner-browser only.
do $$
begin
 if has_table_privilege('authenticated','lizhi_model_private.jobs','SELECT')
 then raise exception 'private jobs readable by browser'; end if;
 if has_function_privilege('anon','public.lizhi_model_finish_v2(uuid,uuid,boolean,boolean,text,jsonb,text)','EXECUTE')
 then raise exception 'finish_v2 callable by anon'; end if;
 if (select public from storage.buckets where id='lizhi-model-files') is distinct from false
 then raise exception 'model files bucket missing or public'; end if;
end $$;

-- Validation: allowed, blocked, unconfirmed destructive, bad transactions.
do $$
begin
 if not lizhi_model_private.valid_command('call','{"method":"hew.solid.follow_me","params":{"profile":"r1"}}') then raise exception 'follow_me refused'; end if;
 if not lizhi_model_private.valid_command('call','{"method":"hew.query.scene"}') then raise exception 'no-params call refused'; end if;
 if lizhi_model_private.valid_command('call','{"method":"hew.doc.attach","params":{}}') then raise exception 'host method allowed'; end if;
 if lizhi_model_private.valid_command('call','{"method":"hew.entity.delete","params":{"ids":["a"]}}') then raise exception 'unconfirmed delete allowed'; end if;
 if not lizhi_model_private.valid_command('call','{"method":"hew.entity.delete","params":{"ids":["a"]},"confirmed":true}') then raise exception 'confirmed delete refused'; end if;
 if lizhi_model_private.valid_command('call','{"method":"hew.doc.transact","params":{"commands":[{"method":"hew.entity.delete","params":{}}]}}') then raise exception 'nested unconfirmed delete allowed'; end if;
 if lizhi_model_private.valid_command('call','{"method":"hew.doc.transact","params":{"commands":[]}}') then raise exception 'empty transaction allowed'; end if;
 if lizhi_model_private.valid_command('call','{"method":"x; drop","params":{}}') then raise exception 'bad method allowed'; end if;
 if lizhi_model_private.valid_command('call','{"method":"hew.query.scene","extra":1}') then raise exception 'extra key allowed'; end if;
 if not lizhi_model_private.valid_command('create_box','{"origin_m":[0,0,0],"size_m":[1,1,1]}') then raise exception 'legacy box broke'; end if;
end $$;

-- Owner consents in the browser.
set role authenticated;
select set_config('request.jwt.claim.sub',:'OWNER',false);
select set_config('request.jwt.claim.role','authenticated',false);
do $$ begin
 if not public.lizhi_model_begin('33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444','rev-1')
 then raise exception 'begin failed'; end if;
end $$;

-- Site queues a read-only snapshot and a later edit at rev-1.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
select set_config('test.read',public.lizhi_model_site_enqueue(:'OWNER',:'SID',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',:'DOC','rev-1','call',
 '{"method":"hew.view.snapshot","params":{"width":256}}')::text,false);
select set_config('test.edit',public.lizhi_model_site_enqueue(:'OWNER',:'SID',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',:'DOC','rev-1','call',
 '{"method":"hew.sketch.offset","params":{"region":"r1","distance":0.02}}')::text,false);
do $$ begin
 begin
  perform public.lizhi_model_site_enqueue('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc','44444444-4444-4444-8444-444444444444','rev-1','call',
   '{"method":"hew.doc.new","params":{}}');
  raise exception 'unconfirmed doc.new queued';
 exception when insufficient_privilege then null; end;
end $$;

-- Browser claims the read, finishes it at the SAME revision; edit stays queued.
set role authenticated;
select set_config('request.jwt.claim.sub',:'OWNER',false);
select set_config('request.jwt.claim.role','authenticated',false);
do $$
declare c jsonb; sid uuid:='33333333-3333-4333-8333-333333333333';
begin
 perform public.lizhi_model_heartbeat(sid,'44444444-4444-4444-8444-444444444444','rev-1');
 c:=public.lizhi_model_claim(sid);
 if c->>'job_id'<>current_setting('test.read') or c->>'command'<>'call' then raise exception 'wrong claim %',c; end if;
 if public.lizhi_model_finish_v2(sid,(c->>'job_id')::uuid,true,false,'rev-2','{}') then
  raise exception 'read-only finish moved revision'; end if;
 if not public.lizhi_model_finish_v2(sid,(c->>'job_id')::uuid,true,false,'rev-1',
   '{"width":256,"artifacts":{"png_base64":{"bucket":"lizhi-model-files","path":"x","mime":"image/png","bytes":10}}}')
 then raise exception 'read-only finish refused'; end if;
 -- The edit is next; mutating finish must change revision.
 c:=public.lizhi_model_claim(sid);
 if c->>'job_id'<>current_setting('test.edit') then raise exception 'edit cancelled by a read %',c; end if;
 if public.lizhi_model_finish_v2(sid,(c->>'job_id')::uuid,true,true,'rev-1','{}') then
  raise exception 'mutating finish kept revision'; end if;
 if not public.lizhi_model_finish_v2(sid,(c->>'job_id')::uuid,true,true,'rev-2','{"region_id":"r2"}') then
  raise exception 'mutating finish refused'; end if;
 if public.lizhi_model_finish_v2(sid,(c->>'job_id')::uuid,true,true,'rev-3','{}') then
  raise exception 'double finish'; end if;
end $$;

-- Another owner cannot finish anything.
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$ begin
 if public.lizhi_model_finish_v2('33333333-3333-4333-8333-333333333333',current_setting('test.edit')::uuid,true,true,'rev-9','{}')
 then raise exception 'cross-owner finish'; end if;
end $$;

-- Site reads back result, method and mutated flag; owner isolation holds.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $$
declare j jsonb;
begin
 j:=public.lizhi_model_site_job('11111111-1111-4111-8111-111111111111',current_setting('test.read')::uuid);
 if j->>'state'<>'succeeded' or j->>'method'<>'hew.view.snapshot' or (j->>'mutated')::boolean
    or j->'result'->>'width'<>'256' then raise exception 'read job read-back %',j; end if;
 j:=public.lizhi_model_site_job('11111111-1111-4111-8111-111111111111',current_setting('test.edit')::uuid);
 if j->>'state'<>'succeeded' or not (j->>'mutated')::boolean or j->'result'->>'region_id'<>'r2'
 then raise exception 'edit job read-back %',j; end if;
 if public.lizhi_model_site_job('22222222-2222-4222-8222-222222222222',current_setting('test.edit')::uuid) is not null
 then raise exception 'job leak'; end if;
end $$;
reset role;
do $$ begin
 if (select revision from lizhi_model_private.sessions where id='33333333-3333-4333-8333-333333333333')<>'rev-2'
 then raise exception 'session revision not advanced'; end if;
end $$;

-- Storage: owner may write only inside their own folder.
set role authenticated;
select set_config('request.jwt.claim.sub',:'OWNER',false);
insert into storage.objects(bucket_id,name) values('lizhi-model-files',:'OWNER'||'/j/a.png');
do $$ begin
 begin
  insert into storage.objects(bucket_id,name) values('lizhi-model-files','22222222-2222-4222-8222-222222222222/j/a.png');
  raise exception 'wrote into another owner folder';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$ begin
 if exists(select 1 from storage.objects where bucket_id='lizhi-model-files') then raise exception 'read other owner file'; end if;
end $$;
reset role;
select 'LIZHI_MODEL_FULL_API_SQL_TEST_PASS' as verdict;
