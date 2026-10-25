-- CANDIDATE ONLY: CAD Sites bridge. NEVER execute on live database until
-- a PRIVATE owner-scoped Site, independent server secret and isolated RLS
-- tests are ready. Uses existing lizhi_private CAD sessions/commands tables.
-- This is NOT a desktop CAD engine, not an exposed drawing filesystem.
--
-- The invoker is the dedicated Supabase Edge Function using service_role JWT.
-- Never grant EXECUTE to anon/authenticated/public. Existing browser RPCs and
-- OAuth consent functions remain completely unchanged.
create or replace function public.lizhi_cad_site_active(p_owner uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select case
    when auth.role() <> 'service_role' or p_owner is null then '[]'::jsonb
    else coalesce((
      select jsonb_agg(jsonb_build_object('session_id', q.id,
        'last_seen',q.last_seen) order by q.last_seen desc)
      from (
        select s.id,s.last_seen
        from lizhi_private.lizhi_cad_sessions s
        where s.user_id=p_owner and s.enabled=true
          and s.expires_at>now()
          and s.last_seen>now()-interval '30 seconds'
        order by s.last_seen desc limit 8
      ) q
    ),'[]'::jsonb)
  end;
$$;

create or replace function public.lizhi_cad_site_enqueue(
  p_owner uuid, p_session uuid, p_command text,
  p_params jsonb, p_request_id uuid
) returns uuid language plpgsql volatile security definer set search_path='' as $$
declare job_id uuid;
begin
  if auth.role() <> 'service_role' or p_owner is null or p_request_id is null then
    raise exception 'sites service required' using errcode='42501';
  end if;
  if not lizhi_private.lizhi_cad_command_valid(p_command,p_params) then
    raise exception 'invalid CAD geometry' using errcode='22023';
  end if;
  perform 1 from lizhi_private.lizhi_cad_sessions s
    where s.id=p_session and s.user_id=p_owner and s.enabled
      and s.expires_at>statement_timestamp()
      and s.last_seen>statement_timestamp()-interval '30 seconds';
  if not found then raise exception 'CAD not connected or local user approval expired' using errcode='42501'; end if;
  if (select count(*) from lizhi_private.lizhi_cad_commands c
      where c.user_id=p_owner and c.created_at>statement_timestamp()-interval '60 seconds')>=20 then
    raise exception 'CAD command rate limited' using errcode='P0001';
  end if;
  insert into lizhi_private.lizhi_cad_commands
    (user_id,session_id,idempotency_key,command,params)
  values(p_owner,p_session,p_request_id,p_command,p_params)
  on conflict(user_id,idempotency_key) do nothing
  returning id into job_id;
  if job_id is null then
    select id into job_id from lizhi_private.lizhi_cad_commands
      where user_id=p_owner and idempotency_key=p_request_id
        and session_id=p_session and command=p_command and params=p_params;
  end if;
  if job_id is null then
    raise exception 'CAD request ID already used for other parameters' using errcode='23505';
  end if;
  return job_id;
end $$;

create or replace function public.lizhi_cad_site_job(
  p_owner uuid, p_job uuid
) returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'job_id',c.id,'session_id',c.session_id,
    'state',case when c.state in ('queued','claimed') and c.expires_at<=now()
      then 'expired' else c.state end,
    'created_at',c.created_at,'completed_at',c.completed_at,
    'result',case when c.state='succeeded' then c.result else null end,
    'error',case when c.state='failed' then left(c.error,200) else null end)
  from lizhi_private.lizhi_cad_commands c
  where auth.role()='service_role' and p_owner is not null
    and c.user_id=p_owner and c.id=p_job;
$$;

revoke all on function public.lizhi_cad_site_active(uuid) from public,anon,authenticated;
revoke all on function public.lizhi_cad_site_enqueue(uuid,uuid,text,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.lizhi_cad_site_job(uuid,uuid) from public,anon,authenticated;
grant execute on function public.lizhi_cad_site_active(uuid) to service_role;
grant execute on function public.lizhi_cad_site_enqueue(uuid,uuid,text,jsonb,uuid) to service_role;
grant execute on function public.lizhi_cad_site_job(uuid,uuid) to service_role;
