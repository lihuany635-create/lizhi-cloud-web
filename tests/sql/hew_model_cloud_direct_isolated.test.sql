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
\i hew/sql/003_model_cloud_direct.REVIEW_ONLY.sql

-- A browser account can never invoke privileged direct model mutations.
set role authenticated;
do $$
begin
 if has_function_privilege('authenticated',
  'public.lizhi_model_cloud_write(uuid,uuid,text,uuid,bigint,jsonb)','EXECUTE')
  then raise exception 'Browser may mutate direct cloud model';end if;
 if has_table_privilege('authenticated',
  'lizhi_model_private.cloud_documents','SELECT')
  then raise exception 'Private scene leaked';end if;
end $$;
reset role;
-- The Edge service_role credentials are exclusively server-side.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);

do $$
declare
 owner uuid:='11111111-1111-4111-8111-111111111111';
 req1 uuid:='33333333-3333-4333-8333-333333333333';
 req2 uuid:='44444444-4444-4444-8444-444444444444';
 req3 uuid:='55555555-5555-4555-8555-555555555555';
 doc uuid; obj text; a jsonb; b jsonb; scene jsonb; listing jsonb;
 failed boolean;
begin
 a:=public.lizhi_model_cloud_write(owner,req1,'new_document',null,null,
   '{"name":"My First Model"}'::jsonb);
 doc:=(a->>'document_id')::uuid;
 if (a->>'revision')::int<>1 or doc is null or (a->>'native_hew_saved')::boolean<>false
 then raise exception 'new document receipt invalid';end if;
 b:=public.lizhi_model_cloud_write(owner,req1,'new_document',null,null,
  '{"name":"My First Model"}'::jsonb);
 if b is distinct from a then raise exception 'idempotent create produced different document';end if;
 listing:=public.lizhi_model_cloud_list(owner);
 if jsonb_array_length(listing)<>1 then raise exception 'cloud list missing';end if;
 a:=public.lizhi_model_cloud_write(owner,req2,'create_box',doc,1,
  '{"origin_mm":[0,0,0],"width_mm":1200,"depth_mm":600,"height_mm":750,"name":"Cabinet"}'::jsonb);
 obj:=a->>'entity_id';
 if obj !~ '^obj_[0-9a-f]{32}$' or (a->>'revision')::int<>2
 then raise exception 'box receipt invalid %',a;end if;
 b:=public.lizhi_model_cloud_write(owner,req2,'create_box',doc,1,
  '{"origin_mm":[0,0,0],"width_mm":1200,"depth_mm":600,"height_mm":750,"name":"Cabinet"}'::jsonb);
 if b is distinct from a then raise exception 'duplicate box not idempotent';end if;
 scene:=public.lizhi_model_cloud_get(owner,doc);
 if (scene->>'revision')::int<>2 or jsonb_array_length(scene->'entities')<>1 or
   (scene->'entities'->0->'size_mm')<>'[1200, 600, 750]'::jsonb
 then raise exception 'box scene was not persisted %',scene;end if;
 a:=public.lizhi_model_cloud_write(owner,req3,'move',doc,2,
  jsonb_build_object('entity_id',obj,'translation_mm',jsonb_build_array(100,0,50)));
 if (a->>'revision')::int<>3 then raise exception 'move receipt invalid';end if;
 scene:=public.lizhi_model_cloud_get(owner,doc);
 if (scene->'entities'->0->'origin_mm')<>'[100, 0, 50]'::jsonb
 then raise exception 'move geometry not persisted';end if;
 if public.lizhi_model_cloud_get('22222222-2222-4222-8222-222222222222',doc)
    is not null then raise exception 'cross-owner scene read leaked';end if;
 failed:=false;
 begin
  perform public.lizhi_model_cloud_write(owner,
   '66666666-6666-4666-8666-666666666666','create_box',doc,2,
   '{"origin_mm":[0,0,0],"width_mm":1,"depth_mm":1,"height_mm":1}'::jsonb);
 exception when others then failed:=true;
 end;
 if not failed then raise exception 'stale revision accepted';end if;
 failed:=false;
 begin
  perform public.lizhi_model_cloud_write(owner,req2,'create_box',doc,1,
   '{"origin_mm":[0,0,0],"width_mm":2,"depth_mm":1,"height_mm":1}'::jsonb);
 exception when others then failed:=true;
 end;
 if not failed then raise exception 'conflicting request replay allowed';end if;
end $$;

select 'LIZHI_MODEL_CLOUD_DIRECT_ISOLATED_PASS' as outcome;
