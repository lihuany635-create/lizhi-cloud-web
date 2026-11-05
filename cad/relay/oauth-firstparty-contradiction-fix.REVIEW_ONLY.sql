-- REVIEW CANDIDATE. Do not apply until isolated integration tests pass.
-- Regression: public.lizhi_web_is_allowed() refuses JWTs with client_id,
-- but CAD OAuth functions also require lizhi_cad_client_allowed() (client_id present).
-- Consequently both gates can NEVER be true for OAuth. Fix ONLY three
-- CAD-specific OAuth RPCs, leaving first-party functions and other tables unchanged.
-- Existing user-bound client_id allowlist, owner/session checks and rate limits remain.
create or replace function public.lizhi_cad_active_sessions()
returns table(session_id uuid,last_seen timestamptz)
language sql stable security definer set search_path='' as $$
  select s.id,s.last_seen from lizhi_private.lizhi_cad_sessions s
  where s.user_id=auth.uid()
    and lizhi_private.lizhi_cad_client_allowed()
    and s.enabled and s.expires_at>now() and s.last_seen>now()-interval '30 seconds'
  order by s.last_seen desc limit 8;
$$;

create or replace function public.lizhi_cad_enqueue(
  p_session uuid,p_command text,p_params jsonb,p_request_id uuid
) returns uuid language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); returned uuid;
begin
  if not lizhi_private.lizhi_cad_client_allowed() then raise exception 'CAD OAuth client not authorized by user' using errcode='42501'; end if;
  if actor is null or not lizhi_private.lizhi_cad_client_allowed() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if p_request_id is null or not lizhi_private.lizhi_cad_command_valid(p_command,p_params) then
    raise exception 'invalid geometry instruction' using errcode='22023';
  end if;
  perform 1 from lizhi_private.lizhi_cad_sessions s
    where s.id=p_session and s.user_id=actor and s.enabled
      and s.expires_at>statement_timestamp()
      and s.last_seen>statement_timestamp()-interval '30 seconds';
  if not found then
    raise exception 'CAD session is not open or user approval has expired' using errcode='42501';
  end if;
  if (select count(*) from lizhi_private.lizhi_cad_commands c
      where c.user_id=actor and c.created_at>statement_timestamp()-interval '60 seconds')>=20 then
    raise exception 'CAD command rate limit' using errcode='P0001';
  end if;
  insert into lizhi_private.lizhi_cad_commands
    (user_id,session_id,idempotency_key,command,params)
    values(actor,p_session,p_request_id,p_command,p_params)
    on conflict(user_id,idempotency_key) do nothing
    returning id into returned;
  if returned is null then
    select id into returned from lizhi_private.lizhi_cad_commands
      where user_id=actor and idempotency_key=p_request_id
        and session_id=p_session and command=p_command and params=p_params;
  end if;
  if returned is null then
    raise exception 'idempotency request conflicts with previous CAD command' using errcode='23505';
  end if;
  return returned;
end; $$;

create or replace function public.lizhi_cad_job_status(p_job uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'job_id',c.id,'session_id',c.session_id,
    'state',case when c.state in ('queued','claimed') and c.expires_at<=now()
                 then 'expired' else c.state end,
    'created_at',c.created_at,'completed_at',c.completed_at,
    'result',c.result,'error',c.error)
  from lizhi_private.lizhi_cad_commands c
  where c.id=p_job and c.user_id=auth.uid() and lizhi_private.lizhi_cad_client_allowed();
$$;

-- Least privilege stays explicit; do not expose any new table or generic RPC.
revoke all on function public.lizhi_cad_active_sessions() from public,anon,authenticated;
revoke all on function public.lizhi_cad_enqueue(uuid,text,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.lizhi_cad_job_status(uuid) from public,anon,authenticated;
grant execute on function public.lizhi_cad_active_sessions() to authenticated;
grant execute on function public.lizhi_cad_enqueue(uuid,text,jsonb,uuid) to authenticated;
grant execute on function public.lizhi_cad_job_status(uuid) to authenticated;
