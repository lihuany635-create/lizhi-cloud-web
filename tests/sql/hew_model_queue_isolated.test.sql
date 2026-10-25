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
\i hew/sql/002_model_one_button_30min.sql

-- Least privilege / private schema inaccessible to client roles.
do $$
begin
 if has_table_privilege('anon','lizhi_model_private.jobs','SELECT')
 or has_table_privilege('authenticated','lizhi_model_private.jobs','SELECT')
 or has_table_privilege('anon','lizhi_model_private.sessions','INSERT')
 or has_table_privilege('authenticated','lizhi_model_private.sessions','UPDATE')
 then raise exception 'private model tables unexpectedly accessible'; end if;
 if has_function_privilege('authenticated','public.lizhi_model_site_enqueue(uuid,uuid,uuid,uuid,text,text,jsonb)','EXECUTE')
 then raise exception 'model Site enqueue callable by regular browser'; end if;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
begin
 if not public.lizhi_model_begin(
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444','rev-1') then
  raise exception 'owner did not consent';end if;
 if not public.lizhi_model_heartbeat(
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444','rev-1')
 then raise exception 'owner heartbeat failed';end if;
end $$;

-- Consent is 30 minutes, not renewable by heartbeat or browser polling.
do $
declare life interval; d text;
begin
 select approved_until-created_at into life
 from lizhi_model_private.sessions
 where id='33333333-3333-4333-8333-333333333333';
 if life<interval '29 minutes' or life>interval '31 minutes'
 then raise exception 'expected bounded 30-minute consent, found %',life; end if;
 select pg_get_functiondef('public.lizhi_model_site_enqueue(uuid,uuid,uuid,uuid,text,text,jsonb)'::regprocedure) into d;
 if position('5 minutes' in d)=0 then
  raise exception 'site enqueue freshness was not relaxed for background polls';end if;
 select pg_get_functiondef('public.lizhi_model_claim(uuid)'::regprocedure) into d;
 if position('5 minutes' in d)=0 then
  raise exception 'owner claim freshness was not relaxed';end if;
end $;

-- Another owner cannot adopt, heartbeat, claim or close the first owner's session.
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
 if public.lizhi_model_heartbeat(
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444','rev-1')
 then raise exception 'cross-owner heartbeat'; end if;
 if public.lizhi_model_claim('33333333-3333-4333-8333-333333333333') is not null
 then raise exception 'cross-owner claimed model'; end if;
 if public.lizhi_model_close('33333333-3333-4333-8333-333333333333')
 then raise exception 'cross-owner closed model'; end if;
end $$;

set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $$
declare sessions jsonb;
begin
 sessions:=public.lizhi_model_site_sessions('11111111-1111-4111-8111-111111111111');
 if jsonb_array_length(sessions)<>1 then raise exception 'owner status session count mismatch %',sessions; end if;
 if jsonb_array_length(public.lizhi_model_site_sessions('22222222-2222-4222-8222-222222222222'))<>0
 then raise exception 'cross-owner session leak'; end if;
end $$;

-- Approve one 1200 x 600 x 750mm solid job, record its durable job ID in a session GUC.
select set_config('test.model.job',public.lizhi_model_site_enqueue(
 '11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333',
 '55555555-5555-4555-8555-555555555555',
 '44444444-4444-4444-8444-444444444444',
 'rev-1','create_box',
 '{"origin_m":[0,0,0],"size_m":[1.2,0.6,0.75],"name":"Desk"}'::jsonb
)::text,false);
-- Exact same request_id must return the same job, never duplicate model.
do $$
declare prev uuid:=current_setting('test.model.job')::uuid; later uuid;
begin
 later:=public.lizhi_model_site_enqueue(
 '11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333',
 '55555555-5555-4555-8555-555555555555',
 '44444444-4444-4444-8444-444444444444','rev-1','create_box',
 '{"origin_m":[0,0,0],"size_m":[1.2,0.6,0.75],"name":"Desk"}'::jsonb);
 if prev<>later then raise exception 'idempotency broken'; end if;
 if public.lizhi_model_site_job('22222222-2222-4222-8222-222222222222',prev) is not null
 then raise exception 'job status owner leak'; end if;
 begin
  perform public.lizhi_model_site_enqueue(
   '11111111-1111-4111-8111-111111111111',
   '33333333-3333-4333-8333-333333333333',
   '55555555-5555-4555-8555-555555555555',
   '44444444-4444-4444-8444-444444444444','rev-1','create_box',
   '{"origin_m":[0,0,0],"size_m":[2,0.6,0.75]}'::jsonb);
  raise exception 'different geometry reused request_id';
 exception when unique_violation then null; end;
 begin
  perform public.lizhi_model_site_enqueue(
   '11111111-1111-4111-8111-111111111111',
   '33333333-3333-4333-8333-333333333333',
   '66666666-6666-4666-8666-666666666666',
   '44444444-4444-4444-8444-444444444444','rev-1','create_box',
   '{"origin_m":[0,0,0],"size_m":[-2,0.6,0.75]}'::jsonb);
  raise exception 'negative geometry accepted';
 exception when insufficient_privilege then null; end;
 begin
  perform public.lizhi_model_site_enqueue(
   '11111111-1111-4111-8111-111111111111',
   '33333333-3333-4333-8333-333333333333',
   '77777777-7777-4777-8777-777777777777',
   '99999999-9999-4999-8999-999999999999','rev-1','create_box',
   '{"origin_m":[0,0,0],"size_m":[1,0.6,0.75]}'::jsonb);
  raise exception 'cross-document job accepted';
 exception when insufficient_privilege then null; end;
end $$;

-- A second same-revision write can be queued, but cannot be claimed
-- concurrently and must be cancelled after the first changes revision.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
select set_config('test.model.second_job',public.lizhi_model_site_enqueue(
 '11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333',
 '88888888-8888-4888-8888-888888888888',
 '44444444-4444-4444-8444-444444444444',
 'rev-1','create_box',
 '{"origin_m":[2,0,0],"size_m":[1,0.5,0.5]}'::jsonb
)::text,false);

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
declare job jsonb;
begin
 job:=public.lizhi_model_claim('33333333-3333-4333-8333-333333333333');
 if job is null or (job->>'job_id')::uuid<>current_setting('test.model.job')::uuid
 or job->>'expected_revision'<>'rev-1'
 then raise exception 'incorrect claimed job %',job; end if;
 if public.lizhi_model_claim('33333333-3333-4333-8333-333333333333') is not null
 then raise exception 'concurrent second claim while first unacknowledged';end if;
 if not public.lizhi_model_finish(
 '33333333-3333-4333-8333-333333333333',
 current_setting('test.model.job')::uuid,true,'rev-2',
 '{"entity_count":1}'::jsonb,null)
 then raise exception 'finish claimed model failed'; end if;
 if public.lizhi_model_finish(
 '33333333-3333-4333-8333-333333333333',
 current_setting('test.model.job')::uuid,true,'rev-3',
 '{"entity_count":2}'::jsonb,null)
 then raise exception 'double completion should not be allowed';end if;
 if not public.lizhi_model_publish_scene(
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  'rev-2','[{"id":"obj_1","name":"Desk","kind":"solid"}]'::jsonb)
 then raise exception 'new revision scene publish failed';end if;
 if public.lizhi_model_publish_scene(
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  'rev-1','[]'::jsonb)
 then raise exception 'stale scene revision overwritten'; end if;
end $$;

set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $$
declare j jsonb; summary jsonb;
begin
 j:=public.lizhi_model_site_job(
 '11111111-1111-4111-8111-111111111111',
 current_setting('test.model.job')::uuid);
 if j->>'state'<>'succeeded' then raise exception 'job not succeeded %',j; end if;
 if (public.lizhi_model_site_job(
   '11111111-1111-4111-8111-111111111111',
   current_setting('test.model.second_job')::uuid)->>'state') <> 'cancelled'
 then raise exception 'queued stale second job not cancelled after revision change'; end if;
 summary:=public.lizhi_model_site_scene(
  '11111111-1111-4111-8111-111111111111',
  '33333333-3333-4333-8333-333333333333');
 if summary->>'revision'<>'rev-2' or jsonb_array_length(summary->'entities')<>1 then
 raise exception 'scene failed %',summary; end if;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
begin
 if not public.lizhi_model_close('33333333-3333-4333-8333-333333333333') then
  raise exception 'closing owner approval failed'; end if;
 if public.lizhi_model_heartbeat(
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444','rev-2')
 then raise exception 'revoked session accepted heartbeat'; end if;
end $$;
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $$
begin
 if jsonb_array_length(public.lizhi_model_site_sessions(
  '11111111-1111-4111-8111-111111111111'))<>0
 then raise exception 'revoked session still appears online'; end if;
end $$;
reset role;
select 'LIZHI_MODEL_POSTGRES_16_ISOLATED_TEST_PASS' as verdict;
