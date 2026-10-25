\set ON_ERROR_STOP on
-- Must run AFTER tests/cad-mcp-relay-postgres.sql on disposable CI Postgres.
create function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('sub',current_setting('request.jwt.claim.sub',true),
    'client_id',nullif(current_setting('request.jwt.claim.client_id',true),''));
$$;
grant execute on function auth.jwt() to authenticated;
\i cad/relay/oauth-client-guard-review.sql

set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.allowed='true';
set request.jwt.claim.client_id='';

do $$
declare good uuid:='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
        live uuid:='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
begin
  if not public.lizhi_cad_grant_oauth_client(good) then raise exception 'Explicit consent grant failed';end if;
  if not public.lizhi_cad_begin_session(live) then raise exception 'First-party browser begin failed';end if;
end $$;

-- An unrelated OAuth app belonging to the SAME user cannot see CAD sessions
-- or enqueue commands even if the user has approved it for another purpose.
set request.jwt.claim.client_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
do $$
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then raise exception 'Unapproved OAuth client discovered CAD session';end if;
  if public.lizhi_cad_heartbeat('dddddddd-dddd-4ddd-8ddd-dddddddddddd') then raise exception 'OAuth spoofed browser heartbeat';end if;
  if public.lizhi_cad_claim_next('dddddddd-dddd-4ddd-8ddd-dddddddddddd') is not null then raise exception 'OAuth spoofed browser claim';end if;
  begin
    perform public.lizhi_cad_grant_oauth_client('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
    raise exception 'OAuth app granted itself CAD privileges';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.lizhi_cad_enqueue(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd','rectang',
      '{"p1":[0,0],"p2":[800,900]}'::jsonb,gen_random_uuid());
    raise exception 'Unapproved OAuth client enqueued CAD mutation';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Only the expressly approved CAD OAuth client can enqueue geometric work
-- with a random request ID for the matching logged-in user.
set request.jwt.claim.client_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$
declare live uuid:='dddddddd-dddd-4ddd-8ddd-dddddddddddd'; job uuid;
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>1 then raise exception 'Approved CAD OAuth client sees no session';end if;
  job:=public.lizhi_cad_enqueue(live,'rectang','{"p1":[0,0],"p2":[800,900]}'::jsonb,gen_random_uuid());
  if public.lizhi_cad_job_status(job)->>'state'<>'queued' then raise exception 'Authorized CAD enqueue did not queue';end if;
  if public.lizhi_cad_claim_next(live) is not null then raise exception 'Approved OAuth should not act as browser worker';end if;
end $$;

-- Owner isolation remains effective even if another user has approved the same client ID.
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then raise exception 'Cross-user session leaked to same OAuth app';end if;
end $$;
set request.jwt.claim.client_id='';
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
begin
  if not public.lizhi_cad_revoke_oauth_client('cccccccc-cccc-4ccc-8ccc-cccccccccccc') then
    raise exception 'Browser grant revocation failed';end if;
end $$;
set request.jwt.claim.client_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$
begin
  if (select count(*) from public.lizhi_cad_active_sessions())<>0 then raise exception 'Revoked client still sees CAD session';end if;
  begin
    perform public.lizhi_cad_enqueue('dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'new','{}'::jsonb,gen_random_uuid());
    raise exception 'Revoked OAuth client still controls CAD';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select 'CAD_OAUTH_CLIENT_SEGREGATION_AND_REVOCATION_PASS' as result;
