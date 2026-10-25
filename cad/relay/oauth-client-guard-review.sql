-- CAD OAuth client separation hardening (isolated and idempotent).
-- DO NOT add drawing files or privileged execute credentials to this database.
-- Only the first-party logged-in website can grant or revoke a specific OAuth
-- client after an explicitly checked option on Supabase's user consent page.
create table if not exists lizhi_private.lizhi_cad_authorized_oauth_clients (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  approved_at timestamptz not null default now(),
  primary key(user_id,client_id)
);
alter table lizhi_private.lizhi_cad_authorized_oauth_clients enable row level security;
revoke all on lizhi_private.lizhi_cad_authorized_oauth_clients from public,anon,authenticated;

create or replace function lizhi_private.lizhi_cad_client_allowed()
returns boolean language plpgsql stable security definer set search_path='' as $$
declare current_client text:=nullif(auth.jwt()->>'client_id','');
begin
  return auth.uid() is not null and current_client is not null
    and current_client ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and exists(select 1 from lizhi_private.lizhi_cad_authorized_oauth_clients
      where user_id=auth.uid() and client_id=current_client::uuid);
end $$;
revoke all on function lizhi_private.lizhi_cad_client_allowed() from public,anon,authenticated;

create or replace function public.lizhi_cad_grant_oauth_client(p_client uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare user_id uuid:=auth.uid();
begin
  if user_id is null or p_client is null or not public.lizhi_web_is_allowed()
    or nullif(auth.jwt()->>'client_id','') is not null then
    raise exception 'First-party browser consent required' using errcode='42501';
  end if;
  insert into lizhi_private.lizhi_cad_authorized_oauth_clients(user_id,client_id)
    values(user_id,p_client)
    on conflict(user_id,client_id) do update set approved_at=statement_timestamp();
  return true;
end $$;
revoke all on function public.lizhi_cad_grant_oauth_client(uuid) from public,anon,authenticated;
grant execute on function public.lizhi_cad_grant_oauth_client(uuid) to authenticated;

create or replace function public.lizhi_cad_revoke_oauth_client(p_client uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare user_id uuid:=auth.uid(); deleted integer;
begin
  if user_id is null or p_client is null or not public.lizhi_web_is_allowed()
    or nullif(auth.jwt()->>'client_id','') is not null then
    raise exception 'First-party browser revocation required' using errcode='42501';
  end if;
  delete from lizhi_private.lizhi_cad_authorized_oauth_clients
    where user_id=auth.uid() and client_id=p_client;
  get diagnostics deleted=row_count;
  return deleted=1;
end $$;
revoke all on function public.lizhi_cad_revoke_oauth_client(uuid) from public,anon,authenticated;
grant execute on function public.lizhi_cad_revoke_oauth_client(uuid) to authenticated;


create or replace function public.lizhi_cad_begin_session(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); accepted uuid;
begin
  if nullif(auth.jwt()->>'client_id','') is not null then raise exception 'Browser-only CAD session action' using errcode='42501'; end if;
  if actor is null or not public.lizhi_web_is_allowed() or p_session is null then
    raise exception 'not authorized' using errcode='42501';
  end if;
  insert into lizhi_private.lizhi_cad_sessions as s
    (id,user_id,enabled,last_seen,expires_at)
  values(p_session,actor,true,statement_timestamp(),statement_timestamp()+interval '90 seconds')
  on conflict(id) do update set
    enabled=true,last_seen=statement_timestamp(),expires_at=statement_timestamp()+interval '90 seconds'
  where s.user_id=actor
  returning id into accepted;
  return accepted=p_session;
end; $$;;

create or replace function public.lizhi_cad_heartbeat(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); updated int;
begin
  if nullif(auth.jwt()->>'client_id','') is not null then return false; end if;
  if actor is null or not public.lizhi_web_is_allowed() then return false; end if;
  update lizhi_private.lizhi_cad_sessions
  set last_seen=statement_timestamp(),expires_at=statement_timestamp()+interval '90 seconds'
  where id=p_session and user_id=actor and enabled=true
    and expires_at>statement_timestamp();
  get diagnostics updated=row_count;
  return updated=1;
end; $$;;

create or replace function public.lizhi_cad_close_session(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); updated int;
begin
  if nullif(auth.jwt()->>'client_id','') is not null then return false; end if;
  if actor is null or not public.lizhi_web_is_allowed() then return false; end if;
  update lizhi_private.lizhi_cad_sessions set enabled=false,expires_at=statement_timestamp()
  where id=p_session and user_id=actor;
  get diagnostics updated=row_count;
  update lizhi_private.lizhi_cad_commands set state='cancelled',completed_at=statement_timestamp()
  where session_id=p_session and user_id=actor and state in ('queued','claimed');
  return updated=1;
end; $$;;

create or replace function public.lizhi_cad_active_sessions()
returns table(session_id uuid,last_seen timestamptz)
language sql stable security definer set search_path='' as $$
  select s.id,s.last_seen from lizhi_private.lizhi_cad_sessions s
  where s.user_id=auth.uid()
    and public.lizhi_web_is_allowed()
    and lizhi_private.lizhi_cad_client_allowed()
    and s.enabled and s.expires_at>now() and s.last_seen>now()-interval '30 seconds'
  order by s.last_seen desc limit 8;
$$;;

create or replace function public.lizhi_cad_enqueue(
  p_session uuid,p_command text,p_params jsonb,p_request_id uuid
) returns uuid language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); returned uuid;
begin
  if not lizhi_private.lizhi_cad_client_allowed() then raise exception 'CAD OAuth client not authorized by user' using errcode='42501'; end if;
  if actor is null or not public.lizhi_web_is_allowed() then
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
end; $$;;

create or replace function public.lizhi_cad_claim_next(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); item record;
begin
  if nullif(auth.jwt()->>'client_id','') is not null then return null; end if;
  if actor is null or not public.lizhi_web_is_allowed() then return null; end if;
  perform 1 from lizhi_private.lizhi_cad_sessions
  where id=p_session and user_id=actor and enabled=true
    and last_seen>statement_timestamp()-interval '30 seconds'
    and expires_at>statement_timestamp();
  if not found then return null; end if;
  update lizhi_private.lizhi_cad_commands c
    set state='expired',completed_at=statement_timestamp()
    where c.session_id=p_session and c.user_id=actor
      and c.state='queued' and c.expires_at<=statement_timestamp();
  with next_job as (
    select c.id from lizhi_private.lizhi_cad_commands c
    where c.session_id=p_session and c.user_id=actor and c.state='queued'
      and c.expires_at>statement_timestamp()
    order by c.created_at,c.id
    limit 1 for update skip locked
  )
  update lizhi_private.lizhi_cad_commands c
    set state='claimed',claimed_at=statement_timestamp()
  from next_job
  where c.id=next_job.id
  returning c.id,c.command,c.params into item;
  if not found then return null; end if;
  return jsonb_build_object('id',item.id,'command',item.command,'params',item.params);
end; $$;;

create or replace function public.lizhi_cad_finish(
  p_session uuid,p_job uuid,p_ok boolean,p_result jsonb default null,p_error text default null
) returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); updated int;
begin
  if nullif(auth.jwt()->>'client_id','') is not null then return false; end if;
  if actor is null or not public.lizhi_web_is_allowed() then return false; end if;
  update lizhi_private.lizhi_cad_commands
    set state=case when p_ok then 'succeeded' else 'failed' end,
        completed_at=statement_timestamp(),
        result=case when octet_length(coalesce(p_result,'null'::jsonb)::text)<=4096 then p_result else null end,
        error=case when p_ok then null else left(coalesce(p_error,'CAD engine error'),300) end
  where id=p_job and user_id=actor and session_id=p_session and state='claimed'
    and exists (
      select 1 from lizhi_private.lizhi_cad_sessions
      where id=p_session and user_id=actor and enabled=true
        and last_seen>statement_timestamp()-interval '30 seconds'
    );
  get diagnostics updated=row_count;
  return updated=1;
end; $$;;

create or replace function public.lizhi_cad_job_status(p_job uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'job_id',c.id,'session_id',c.session_id,
    'state',case when c.state in ('queued','claimed') and c.expires_at<=now()
                 then 'expired' else c.state end,
    'created_at',c.created_at,'completed_at',c.completed_at,
    'result',c.result,'error',c.error)
  from lizhi_private.lizhi_cad_commands c
  where c.id=p_job and c.user_id=auth.uid() and public.lizhi_web_is_allowed() and lizhi_private.lizhi_cad_client_allowed();
$$;;
