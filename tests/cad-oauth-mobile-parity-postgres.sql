\set ON_ERROR_STOP on
-- Run only on ephemeral postgres after original CAD relay + OAuth client tests.
-- Reproduce the real production first-party guard rejecting JWTs with client_id.
create or replace function public.lizhi_web_is_allowed() returns boolean
language sql stable as $$
  select current_setting('request.jwt.claim.allowed',true)='true'
     and nullif(current_setting('request.jwt.claim.client_id',true),'') is null;
$$;

set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.allowed='true';
set request.jwt.claim.client_id='';
do $$
declare s uuid:='aaaaaaaa-cccc-4aaa-8aaa-cccccccccccc';
begin
  if not public.lizhi_cad_begin_session(s) then raise exception 'first-party session failed'; end if;
  if not public.lizhi_cad_grant_oauth_client('cccccccc-cccc-4ccc-8ccc-cccccccccccc') then raise exception 'explicit OAuth grant failed'; end if;
end $$;

set request.jwt.claim.client_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
-- Old contradictory implementation must be proven broken, so the regression
-- test cannot pass merely by removing an important authorisation condition.
do $$
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then
    raise exception 'baseline guard contradiction was not reproduced';
  end if;
  begin
    perform public.lizhi_cad_enqueue(
      'aaaaaaaa-cccc-4aaa-8aaa-cccccccccccc','rectang',
      '{"p1":[0,0],"p2":[800,900]}'::jsonb,gen_random_uuid());
    raise exception 'legacy contradictory OAuth enqueue unexpectedly accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- The reviewed repair changes only 3 CAD OAuth-facing RPCs.
\i cad/relay/oauth-firstparty-contradiction-fix.REVIEW_ONLY.sql

set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.allowed='true';
set request.jwt.claim.client_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select auth.uid() as oauth_user, auth.jwt()->>'client_id' as oauth_client,
  public.lizhi_web_is_allowed() as firstparty;
do $$
declare sid uuid:='aaaaaaaa-cccc-4aaa-8aaa-cccccccccccc';
        job_id uuid; raw jsonb;
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>1 then
    raise exception 'approved OAuth cannot read own live CAD session';
  end if;
  job_id:=public.lizhi_cad_enqueue(
    sid,'rectang','{"p1":[0,0],"p2":[800,900]}'::jsonb,gen_random_uuid());
  if public.lizhi_cad_job_status(job_id)->>'state'<>'queued' then
    raise exception 'approved OAuth queued job invisible';
  end if;
  if public.lizhi_cad_claim_next(sid) is not null then
    raise exception 'OAuth client must not be allowed to claim from browser queue';
  end if;
end $$;

-- Browser must still be a FIRST-PARTY token, even after an approved OAuth app exists.
set request.jwt.claim.client_id='';
do $$
declare sid uuid:='aaaaaaaa-cccc-4aaa-8aaa-cccccccccccc';
        item jsonb;
begin
  item:=public.lizhi_cad_claim_next(sid);
  if item is null or item->>'command'<>'rectang' then
    raise exception 'first-party browser could not claim queued rectangle';
  end if;
  if not public.lizhi_cad_finish(sid,(item->>'id')::uuid,true,'{"drawn":true}'::jsonb) then
    raise exception 'first-party browser could not complete job';
  end if;
end $$;

set request.jwt.claim.client_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$
begin
  if (select count(*) from lizhi_private.lizhi_cad_commands)>0 then
    raise exception 'authenticated OAuth client directly read private CAD commands';
  end if;
exception when insufficient_privilege then null;
end $$;
do $$
begin
  if not exists (
    select 1 from public.lizhi_cad_active_sessions()
  ) then raise exception 'approved OAuth session no longer visible'; end if;
end $$;

-- An unrelated OAuth client, including phone, never inherits CAD write rights.
set request.jwt.claim.client_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
do $$
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then raise exception 'phone-like OAuth app sees CAD session';end if;
  begin
    perform public.lizhi_cad_enqueue(
      'aaaaaaaa-cccc-4aaa-8aaa-cccccccccccc','new','{}'::jsonb,gen_random_uuid());
    raise exception 'unapproved OAuth wrote CAD';
  exception when insufficient_privilege then null;
  end;
end $$;
set request.jwt.claim.client_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then raise exception 'different OAuth owner sees CAD session';end if;
end $$;

-- Revocation still works via first-party browser token only.
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.client_id='';
do $$
begin
  if not public.lizhi_cad_revoke_oauth_client('cccccccc-cccc-4ccc-8ccc-cccccccccccc') then
    raise exception 'first-party revoke failed';
  end if;
end $$;
set request.jwt.claim.client_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then
    raise exception 'revoked OAuth client remained authorized';
  end if;
end $$;
reset role;
select 'CAD_MOBILE_PARITY_OAUTH_GUARD_FIX_PASS' as result;
