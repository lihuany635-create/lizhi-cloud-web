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
\i hew/sql/005_model_cloud_hew.REVIEW_ONLY.sql

-- Browser roles cannot reach anything cloud-hew.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claim.role','authenticated',false);
do $$ begin
 begin perform public.lizhi_model_cloud_hew_list('11111111-1111-4111-8111-111111111111');
  raise exception 'browser listed cloud docs';
 exception when insufficient_privilege then null; end;
end $$;
reset role;

set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
select set_config('t.doc',(public.lizhi_model_cloud_hew_new('11111111-1111-4111-8111-111111111111','主角臥室')->>'document_id'),false);
do $$
declare owner uuid:='11111111-1111-4111-8111-111111111111'; doc uuid:=current_setting('t.doc')::uuid;
 j1 uuid; j2 uuid; c jsonb; r jsonb;
begin
 if jsonb_array_length(public.lizhi_model_cloud_hew_list(owner))<>1 then raise exception 'list'; end if;
 if jsonb_array_length(public.lizhi_model_cloud_hew_list('22222222-2222-4222-8222-222222222222'))<>0 then raise exception 'owner leak'; end if;
 j1:=public.lizhi_model_cloud_hew_enqueue(owner,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',doc,0,'hew.doc.transact',
   '{"commands":[{"method":"hew.sketch.draw_rect","as":"r","params":{}},{"method":"hew.solid.extrude","params":{}}]}',false);
 if public.lizhi_model_cloud_hew_enqueue(owner,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',doc,0,'hew.doc.transact',
   '{"commands":[{"method":"hew.sketch.draw_rect","as":"r","params":{}},{"method":"hew.solid.extrude","params":{}}]}',false)<>j1
 then raise exception 'not idempotent'; end if;
 j2:=public.lizhi_model_cloud_hew_enqueue(owner,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',doc,0,'hew.query.scene','{}',false);
 begin perform public.lizhi_model_cloud_hew_enqueue(owner,'cccccccc-cccc-4ccc-8ccc-cccccccccccc',doc,0,'hew.doc.save','{}',false);
  raise exception 'doc.save queued in cloud mode'; exception when insufficient_privilege then null; end;
 begin perform public.lizhi_model_cloud_hew_enqueue(owner,'dddddddd-dddd-4ddd-8ddd-dddddddddddd',doc,0,'hew.entity.delete','{"ids":["a"]}',false);
  raise exception 'unconfirmed delete queued'; exception when insufficient_privilege then null; end;
 begin perform public.lizhi_model_cloud_hew_enqueue(owner,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',doc,5,'hew.query.scene','{}',false);
  raise exception 'stale revision queued'; exception when raise_exception then
   if sqlerrm<>'MODEL_REVISION_CONFLICT' then raise; end if; end;

 -- Worker claims first job; second waits (one claimed job per document).
 c:=public.lizhi_model_cloud_hew_claim('run-1');
 if (c->>'job_id')::uuid<>j1 or (c->>'revision')::int<>0 or c->>'current_path' is not null then raise exception 'claim1 %',c; end if;
 if public.lizhi_model_cloud_hew_claim('run-1') is not null then raise exception 'second claim on same doc'; end if;
 r:=public.lizhi_model_cloud_hew_finish(j1,true,true,'wrong/path.hew','{}',null);
 if (r->>'ok')::boolean then raise exception 'bad path accepted'; end if;
 r:=public.lizhi_model_cloud_hew_finish(j1,true,true,owner::text||'/docs/'||doc::text||'/r1.hew','{"object_id":"obj_1"}',null);
 if not (r->>'ok')::boolean or (r->>'revision')::int<>1 then raise exception 'finish1 %',r; end if;
 -- The read queued at revision 0 is now stale: cancelled, not replayed.
 if public.lizhi_model_cloud_hew_claim('run-1') is not null then raise exception 'stale job claimed'; end if;
 if public.lizhi_model_cloud_hew_job(owner,j2)->>'state'<>'cancelled' then raise exception 'stale not cancelled'; end if;
 -- Read at revision 1 finishes without moving the revision.
 j2:=public.lizhi_model_cloud_hew_enqueue(owner,'ffffffff-ffff-4fff-8fff-ffffffffffff',doc,1,'hew.view.snapshot','{"width":256}',false);
 c:=public.lizhi_model_cloud_hew_claim('run-2');
 if c->>'current_path'<>owner::text||'/docs/'||doc::text||'/r1.hew' then raise exception 'current path %',c; end if;
 r:=public.lizhi_model_cloud_hew_finish(j2,true,false,null,'{"width":256}',null);
 if (r->>'revision')::int<>1 then raise exception 'read moved revision'; end if;
 r:=public.lizhi_model_cloud_hew_job(owner,j1);
 if r->>'state'<>'succeeded' or (r->>'new_revision')::int<>1 or r->'result'->>'object_id'<>'obj_1' then raise exception 'job read-back %',r; end if;
 if public.lizhi_model_cloud_hew_job('22222222-2222-4222-8222-222222222222',j1) is not null then raise exception 'job owner leak'; end if;
end $$;
reset role;
select 'LIZHI_MODEL_CLOUD_HEW_SQL_TEST_PASS' as verdict;
