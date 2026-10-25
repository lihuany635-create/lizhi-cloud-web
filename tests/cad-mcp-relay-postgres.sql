\set ON_ERROR_STOP on
-- Run only in throwaway GitHub Actions postgres container. No production DB.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create function public.lizhi_web_is_allowed() returns boolean
language sql stable as $$select current_setting('request.jwt.claim.allowed',true)='true';$$;
insert into auth.users(id) values
('11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222');

\i cad/relay/schema-review.sql

-- Negative: schema and tables are private even to an authenticated account.
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.allowed='true';
do $$
begin
  begin
    perform * from lizhi_private.lizhi_cad_sessions;
    raise exception 'Direct private table SELECT unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Create a session, validate input geometry, protect idempotency and report real state.
do $$
declare s uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
        key uuid:='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
        first_job uuid;second_job uuid; item jsonb;
begin
  if not public.lizhi_cad_begin_session(s) then raise exception 'open session failed';end if;
  if not public.lizhi_cad_heartbeat(s) then raise exception 'heartbeat failed';end if;
  if (select count(*) from public.lizhi_cad_active_sessions())<>1 then raise exception 'session not listed';end if;
  begin
    perform public.lizhi_cad_enqueue(s,'circle','{"center":[0,0],"radius":-5}'::jsonb,gen_random_uuid());
    raise exception 'Negative radius accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.lizhi_cad_enqueue(s,'script','{"path":"C:\\private.dxf"}'::jsonb,gen_random_uuid());
    raise exception 'Disallowed script accepted';
  exception when invalid_parameter_value then null;
  end;
  first_job:=public.lizhi_cad_enqueue(s,'rectang','{"p1":[0,0],"p2":[800,900]}'::jsonb,key);
  second_job:=public.lizhi_cad_enqueue(s,'rectang','{"p1":[0,0],"p2":[800,900]}'::jsonb,key);
  if first_job is distinct from second_job then raise exception 'idempotency failed'; end if;
  if public.lizhi_cad_job_status(first_job)->>'state'<>'queued' then raise exception 'queued missing';end if;
  item:=public.lizhi_cad_claim_next(s);
  if item->>'id'<>first_job::text then raise exception 'claim wrong item'; end if;
  if public.lizhi_cad_claim_next(s) is not null then raise exception 'Duplicate claim';end if;
  if not public.lizhi_cad_finish(s,first_job,true,'{"created":1}'::jsonb,null) then raise exception 'finish failed';end if;
  if public.lizhi_cad_job_status(first_job)->>'state'<>'succeeded' then raise exception 'succeeded missing';end if;
  if public.lizhi_cad_finish(s,first_job,true,null,null) then raise exception 'Duplicate completion accepted';end if;
end $$;

-- Different authenticated owner cannot inspect, enqueue into, claim, or finish the first owner's session.
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
declare s uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
        job uuid; claimed jsonb;
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then raise exception 'Cross-owner active session leaked';end if;
  if public.lizhi_cad_claim_next(s) is not null then raise exception 'Cross-owner claim leaked';end if;
  if public.lizhi_cad_finish(s,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,null,null) then
    raise exception 'Cross-owner job completion leaked';end if;
  begin
    job:=public.lizhi_cad_enqueue(s,'new','{}'::jsonb,gen_random_uuid());
    raise exception 'Cross-owner enqueue accepted';
  exception when insufficient_privilege then null;
  end;
  if public.lizhi_cad_job_status('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') is not null then
    raise exception 'Cross-owner job status leaked';end if;
end $$;

-- A revoked / unauthorized account cannot create an arbitrary new control session.
set request.jwt.claim.allowed='false';
do $$
begin
  begin
    perform public.lizhi_cad_begin_session(gen_random_uuid());
    raise exception 'Unauthorized session creation accepted';
  exception when insufficient_privilege then null;
  end;
end $$;

set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.allowed='true';
do $$
declare s uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
begin
  if not public.lizhi_cad_close_session(s) then raise exception 'Close session failed';end if;
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then raise exception 'Revocation ignored';end if;
  begin
    perform public.lizhi_cad_enqueue(s,'new','{}',gen_random_uuid());
    raise exception 'Enqueue accepted after revoke';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select 'CAD_SQL_RLS_OAUTH_OWNER_ISOLATION_PASS' as result;
