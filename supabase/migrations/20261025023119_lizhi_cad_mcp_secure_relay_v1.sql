-- Migration 20261025023119: applied ONLY via Supabase apply_migration to 立之雲端庫.
-- Private short-lived CAD command metadata; no DXF, local paths, binary drawings, or worker.
create schema if not exists lizhi_private;
revoke all on schema lizhi_private from public, anon, authenticated;

create table if not exists lizhi_private.lizhi_cad_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  last_seen timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 seconds',
  created_at timestamptz not null default now()
);
create index if not exists lizhi_cad_sessions_owner
  on lizhi_private.lizhi_cad_sessions (user_id,last_seen desc);
alter table lizhi_private.lizhi_cad_sessions enable row level security;
revoke all on lizhi_private.lizhi_cad_sessions from public, anon, authenticated;

create table if not exists lizhi_private.lizhi_cad_commands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references lizhi_private.lizhi_cad_sessions(id) on delete cascade,
  idempotency_key uuid not null,
  command text not null check (command in ('new','line','rectang','circle')),
  params jsonb not null,
  state text not null default 'queued'
    check (state in ('queued','claimed','succeeded','failed','cancelled','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 seconds',
  claimed_at timestamptz,
  completed_at timestamptz,
  result jsonb,
  error text,
  unique (user_id,idempotency_key)
);
create index if not exists lizhi_cad_commands_claim
  on lizhi_private.lizhi_cad_commands (session_id,state,created_at);
alter table lizhi_private.lizhi_cad_commands enable row level security;
revoke all on lizhi_private.lizhi_cad_commands from public, anon, authenticated;

create or replace function lizhi_private.lizhi_cad_point_valid(p jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare coordinate jsonb;
begin
  if jsonb_typeof(p) <> 'array' or jsonb_array_length(p)<>2 then return false; end if;
  for coordinate in select value from jsonb_array_elements(p) loop
    if jsonb_typeof(coordinate)<>'number' then return false; end if;
    if abs((coordinate #>> '{}')::numeric)>1000000 then return false; end if;
  end loop;
  return true;
exception when others then return false;
end; $$;

create or replace function lizhi_private.lizhi_cad_command_valid(cmd text,p jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare n int; point jsonb; magnitude numeric;
begin
  if cmd not in ('new','line','rectang','circle') or jsonb_typeof(p)<>'object'
    or octet_length(p::text)>8192 then return false; end if;
  select count(*) into n from jsonb_object_keys(p);
  if cmd='new' then
    return n=0 or (n=1 and p ? 'metric' and jsonb_typeof(p->'metric')='boolean');
  elsif cmd='rectang' then
    return n=2 and p ? 'p1' and p ? 'p2'
      and lizhi_private.lizhi_cad_point_valid(p->'p1')
      and lizhi_private.lizhi_cad_point_valid(p->'p2');
  elsif cmd='line' then
    if not p ? 'points' or n>2 or jsonb_typeof(p->'points')<>'array' then return false; end if;
    if n=2 and (not p ? 'closed' or jsonb_typeof(p->'closed')<>'boolean') then return false; end if;
    if jsonb_array_length(p->'points') not between 2 and 64 then return false; end if;
    for point in select value from jsonb_array_elements(p->'points') loop
      if not lizhi_private.lizhi_cad_point_valid(point) then return false; end if;
    end loop;
    return true;
  elsif cmd='circle' then
    if not p ? 'center' or n<>2 or not lizhi_private.lizhi_cad_point_valid(p->'center')
      or (p ? 'radius')=(p ? 'diameter') then return false; end if;
    point:=coalesce(p->'radius',p->'diameter');
    if jsonb_typeof(point)<>'number' then return false; end if;
    magnitude:=(point #>> '{}')::numeric;
    return magnitude>0 and magnitude<=1000000;
  end if;
  return false;
exception when others then return false;
end; $$;

create or replace function public.lizhi_cad_begin_session(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); accepted uuid;
begin
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
end; $$;

create or replace function public.lizhi_cad_heartbeat(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); updated int;
begin
  if actor is null or not public.lizhi_web_is_allowed() then return false; end if;
  update lizhi_private.lizhi_cad_sessions
  set last_seen=statement_timestamp(),expires_at=statement_timestamp()+interval '90 seconds'
  where id=p_session and user_id=actor and enabled=true
    and expires_at>statement_timestamp();
  get diagnostics updated=row_count;
  return updated=1;
end; $$;

create or replace function public.lizhi_cad_close_session(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); updated int;
begin
  if actor is null or not public.lizhi_web_is_allowed() then return false; end if;
  update lizhi_private.lizhi_cad_sessions set enabled=false,expires_at=statement_timestamp()
  where id=p_session and user_id=actor;
  get diagnostics updated=row_count;
  update lizhi_private.lizhi_cad_commands set state='cancelled',completed_at=statement_timestamp()
  where session_id=p_session and user_id=actor and state in ('queued','claimed');
  return updated=1;
end; $$;

create or replace function public.lizhi_cad_active_sessions()
returns table(session_id uuid,last_seen timestamptz)
language sql stable security definer set search_path='' as $$
  select s.id,s.last_seen from lizhi_private.lizhi_cad_sessions s
  where s.user_id=auth.uid()
    and public.lizhi_web_is_allowed()
    and s.enabled and s.expires_at>now() and s.last_seen>now()-interval '30 seconds'
  order by s.last_seen desc limit 8;
$$;

create or replace function public.lizhi_cad_enqueue(
  p_session uuid,p_command text,p_params jsonb,p_request_id uuid
) returns uuid language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); returned uuid;
begin
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
end; $$;

create or replace function public.lizhi_cad_claim_next(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); item record;
begin
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
end; $$;

create or replace function public.lizhi_cad_finish(
  p_session uuid,p_job uuid,p_ok boolean,p_result jsonb default null,p_error text default null
) returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); updated int;
begin
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
  where c.id=p_job and c.user_id=auth.uid() and public.lizhi_web_is_allowed();
$$;

-- public schema functions default to EXECUTE PUBLIC: revoke explicitly.
revoke all on function lizhi_private.lizhi_cad_point_valid(jsonb) from public,anon,authenticated;
revoke all on function lizhi_private.lizhi_cad_command_valid(text,jsonb) from public,anon,authenticated;
revoke all on function public.lizhi_cad_begin_session(uuid) from public,anon,authenticated;
revoke all on function public.lizhi_cad_heartbeat(uuid) from public,anon,authenticated;
revoke all on function public.lizhi_cad_close_session(uuid) from public,anon,authenticated;
revoke all on function public.lizhi_cad_active_sessions() from public,anon,authenticated;
revoke all on function public.lizhi_cad_enqueue(uuid,text,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.lizhi_cad_claim_next(uuid) from public,anon,authenticated;
revoke all on function public.lizhi_cad_finish(uuid,uuid,boolean,jsonb,text) from public,anon,authenticated;
revoke all on function public.lizhi_cad_job_status(uuid) from public,anon,authenticated;
grant execute on function public.lizhi_cad_begin_session(uuid) to authenticated;
grant execute on function public.lizhi_cad_heartbeat(uuid) to authenticated;
grant execute on function public.lizhi_cad_close_session(uuid) to authenticated;
grant execute on function public.lizhi_cad_active_sessions() to authenticated;
grant execute on function public.lizhi_cad_enqueue(uuid,text,jsonb,uuid) to authenticated;
grant execute on function public.lizhi_cad_claim_next(uuid) to authenticated;
grant execute on function public.lizhi_cad_finish(uuid,uuid,boolean,jsonb,text) to authenticated;
grant execute on function public.lizhi_cad_job_status(uuid) to authenticated;
