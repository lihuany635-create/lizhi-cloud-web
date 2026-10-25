-- PRIVATE Finance browser UI relay. No ledger table alteration or direct financial writes.
-- First-party browser opens an explicit 30-minute lease and claims UI events.
-- Private ChatGPT Site can enqueue ONLY validated UI commands for the configured owner.
create schema if not exists lizhi_private;
revoke all on schema lizhi_private from public, anon, authenticated;

create table if not exists lizhi_private.lizhi_finance_ui_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  last_seen timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  created_at timestamptz not null default now()
);
create index if not exists lizhi_finance_ui_sessions_owner
  on lizhi_private.lizhi_finance_ui_sessions(user_id,last_seen desc);
alter table lizhi_private.lizhi_finance_ui_sessions enable row level security;
revoke all on lizhi_private.lizhi_finance_ui_sessions from public,anon,authenticated;

create table if not exists lizhi_private.lizhi_finance_ui_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references lizhi_private.lizhi_finance_ui_sessions(id) on delete cascade,
  idempotency_key uuid not null,
  operation text not null check (operation in ('inspect','interact')),
  params jsonb not null,
  state text not null default 'queued'
    check (state in ('queued','claimed','succeeded','failed','cancelled','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '75 seconds',
  claimed_at timestamptz,
  completed_at timestamptz,
  result jsonb,
  error text,
  unique(user_id,idempotency_key)
);
create index if not exists lizhi_finance_ui_jobs_claim
  on lizhi_private.lizhi_finance_ui_jobs(session_id,state,created_at);
alter table lizhi_private.lizhi_finance_ui_jobs enable row level security;
revoke all on lizhi_private.lizhi_finance_ui_jobs from public,anon,authenticated;

create or replace function lizhi_private.lizhi_finance_ui_command_valid(op text,p jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare keys text[];
begin
  if op not in ('inspect','interact') or jsonb_typeof(p)<>'object' or
    octet_length(p::text)>8192 then return false; end if;
  if op='inspect' then return p='{}'::jsonb; end if;
  select array_agg(k order by k) into keys from jsonb_object_keys(p) k;
  if keys is null or not (p ? 'revision' and p ? 'ref' and p ? 'action') then return false; end if;
  if exists (select 1 from unnest(keys) k
     where k not in ('revision','ref','action','value','confirm')) then return false; end if;
  if jsonb_typeof(p->'revision')<>'string' or length(p->>'revision') not between 1 and 96 or
    jsonb_typeof(p->'ref')<>'string' or (p->>'ref') !~ '^u[0-9]{1,3}$' or
    jsonb_typeof(p->'action')<>'string' or p->>'action' not in ('click','fill','select')
    then return false; end if;
  if p ? 'confirm' and jsonb_typeof(p->'confirm') <> 'boolean' then return false; end if;
  if p->>'action' in ('fill','select') then
    return p ? 'value' and jsonb_typeof(p->'value')='string' and
      length(p->>'value')<=300 and not (p ? 'confirm');
  end if;
  return not (p ? 'value');
exception when others then return false;
end; $$;

create or replace function public.lizhi_finance_ui_begin(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); accepted uuid;
begin
  if actor is null or p_session is null or not public.lizhi_web_is_allowed()
    or nullif(auth.jwt()->>'client_id','') is not null then
    raise exception 'FIRST_PARTY_FINANCE_SESSION_REQUIRED' using errcode='42501';
  end if;
  -- Only one Finance control session can be active per owner.
  update lizhi_private.lizhi_finance_ui_sessions set enabled=false,expires_at=statement_timestamp()
    where user_id=actor and id<>p_session and enabled;
  insert into lizhi_private.lizhi_finance_ui_sessions as s
    (id,user_id,enabled,last_seen,expires_at)
  values(p_session,actor,true,statement_timestamp(),statement_timestamp()+interval '30 minutes')
  on conflict(id) do update set
    enabled=true,last_seen=statement_timestamp(),expires_at=statement_timestamp()+interval '30 minutes'
  where s.user_id=actor
  returning id into accepted;
  return accepted=p_session;
end; $$;

create or replace function public.lizhi_finance_ui_heartbeat(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); changed integer;
begin
  if actor is null or not public.lizhi_web_is_allowed()
    or nullif(auth.jwt()->>'client_id','') is not null then return false; end if;
  update lizhi_private.lizhi_finance_ui_sessions
    set last_seen=statement_timestamp()
    where id=p_session and user_id=actor and enabled=true
      and expires_at>statement_timestamp();
  get diagnostics changed=row_count;
  return changed=1;
end; $$;

create or replace function public.lizhi_finance_ui_close(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); changed integer;
begin
  if actor is null or not public.lizhi_web_is_allowed()
    or nullif(auth.jwt()->>'client_id','') is not null then return false; end if;
  update lizhi_private.lizhi_finance_ui_sessions
    set enabled=false,expires_at=statement_timestamp()
    where id=p_session and user_id=actor;
  get diagnostics changed=row_count;
  update lizhi_private.lizhi_finance_ui_jobs
    set state='cancelled',completed_at=statement_timestamp()
    where user_id=actor and session_id=p_session and state in ('queued','claimed');
  return changed=1;
end; $$;

create or replace function public.lizhi_finance_ui_claim(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); item record;
begin
  if actor is null or not public.lizhi_web_is_allowed()
    or nullif(auth.jwt()->>'client_id','') is not null then return null; end if;
  perform 1 from lizhi_private.lizhi_finance_ui_sessions s
    where s.id=p_session and s.user_id=actor and s.enabled=true
      and s.last_seen>statement_timestamp()-interval '30 seconds'
      and s.expires_at>statement_timestamp();
  if not found then return null; end if;
  update lizhi_private.lizhi_finance_ui_jobs set state='expired',completed_at=statement_timestamp()
    where session_id=p_session and user_id=actor and state='queued'
      and expires_at<=statement_timestamp();
  with next_job as (
    select id from lizhi_private.lizhi_finance_ui_jobs
    where user_id=actor and session_id=p_session and state='queued'
      and expires_at>statement_timestamp()
    order by created_at,id limit 1 for update skip locked
  )
  update lizhi_private.lizhi_finance_ui_jobs j
    set state='claimed',claimed_at=statement_timestamp()
    from next_job n where j.id=n.id
    returning j.id,j.operation,j.params into item;
  if not found then return null; end if;
  return jsonb_build_object('id',item.id,'operation',item.operation,'params',item.params);
end; $$;

create or replace function public.lizhi_finance_ui_complete(
  p_session uuid,p_job uuid,p_ok boolean,p_result jsonb default null,p_error text default null)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); changed integer;
begin
  if actor is null or not public.lizhi_web_is_allowed()
    or nullif(auth.jwt()->>'client_id','') is not null then return false; end if;
  if octet_length(coalesce(p_result,'null'::jsonb)::text)>32768 then return false; end if;
  update lizhi_private.lizhi_finance_ui_jobs j
    set state=case when p_ok then 'succeeded' else 'failed' end,
        completed_at=statement_timestamp(),result=p_result,
        error=case when p_ok then null else left(coalesce(p_error,'UI_INTERACTION_FAILED'),200) end
    where j.id=p_job and j.user_id=actor and j.session_id=p_session and j.state='claimed'
      and exists(select 1 from lizhi_private.lizhi_finance_ui_sessions s
        where s.id=p_session and s.user_id=actor and s.enabled
          and s.expires_at>statement_timestamp());
  get diagnostics changed=row_count;
  return changed=1;
end; $$;

-- These three functions are server-only. The Site Edge server uses a fixed
-- configured owner UID and its protected service-role JWT.
create or replace function public.lizhi_finance_ui_site_sessions(p_owner uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('session_id',x.id,'last_seen',x.last_seen,'expires_at',x.expires_at)),'[]'::jsonb)
  from (
    select s.id,s.last_seen,s.expires_at from lizhi_private.lizhi_finance_ui_sessions s
    where (auth.jwt()->>'role')='service_role'
      and s.user_id=p_owner and s.enabled=true
      and s.expires_at>now() and s.last_seen>now()-interval '30 seconds'
    order by s.last_seen desc limit 1
  ) x;
$$;

create or replace function public.lizhi_finance_ui_site_enqueue(
  p_owner uuid,p_session uuid,p_request_id uuid,p_operation text,p_params jsonb)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare returned uuid;
begin
  if (auth.jwt()->>'role')<>'service_role' or p_owner is null then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501';
  end if;
  if p_request_id is null or not lizhi_private.lizhi_finance_ui_command_valid(p_operation,p_params) then
    raise exception 'INVALID_UI_COMMAND' using errcode='22023';
  end if;
  perform 1 from lizhi_private.lizhi_finance_ui_sessions s
    where s.id=p_session and s.user_id=p_owner and s.enabled=true
      and s.expires_at>statement_timestamp()
      and s.last_seen>statement_timestamp()-interval '30 seconds';
  if not found then raise exception 'FINANCE_UI_OFFLINE_OR_NOT_ALLOWED' using errcode='42501'; end if;
  if (select count(*) from lizhi_private.lizhi_finance_ui_jobs j
    where j.user_id=p_owner and j.created_at>statement_timestamp()-interval '60 seconds')>=25 then
    raise exception 'FINANCE_UI_RATE_LIMIT' using errcode='P0001'; end if;
  insert into lizhi_private.lizhi_finance_ui_jobs(user_id,session_id,idempotency_key,operation,params)
    values(p_owner,p_session,p_request_id,p_operation,p_params)
    on conflict(user_id,idempotency_key) do nothing returning id into returned;
  if returned is null then
    select j.id into returned from lizhi_private.lizhi_finance_ui_jobs j
      where j.user_id=p_owner and j.idempotency_key=p_request_id
        and j.session_id=p_session and j.operation=p_operation and j.params=p_params;
  end if;
  if returned is null then raise exception 'FINANCE_UI_IDEMPOTENCY_CONFLICT' using errcode='23505'; end if;
  return returned;
end; $$;

create or replace function public.lizhi_finance_ui_site_job(p_owner uuid,p_job uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('job_id',j.id,'state',
    case when j.state in ('queued','claimed') and j.expires_at<now()
      then 'expired' else j.state end,'created_at',j.created_at,
    'completed_at',j.completed_at,'result',j.result,'error',j.error)
  from lizhi_private.lizhi_finance_ui_jobs j
  where (auth.jwt()->>'role')='service_role'
    and j.user_id=p_owner and j.id=p_job;
$$;

revoke all on function lizhi_private.lizhi_finance_ui_command_valid(text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.lizhi_finance_ui_begin(uuid) from public,anon,authenticated,service_role;
revoke all on function public.lizhi_finance_ui_heartbeat(uuid) from public,anon,authenticated,service_role;
revoke all on function public.lizhi_finance_ui_close(uuid) from public,anon,authenticated,service_role;
revoke all on function public.lizhi_finance_ui_claim(uuid) from public,anon,authenticated,service_role;
revoke all on function public.lizhi_finance_ui_complete(uuid,uuid,boolean,jsonb,text) from public,anon,authenticated,service_role;
revoke all on function public.lizhi_finance_ui_site_sessions(uuid) from public,anon,authenticated,service_role;
revoke all on function public.lizhi_finance_ui_site_enqueue(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.lizhi_finance_ui_site_job(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.lizhi_finance_ui_begin(uuid) to authenticated;
grant execute on function public.lizhi_finance_ui_heartbeat(uuid) to authenticated;
grant execute on function public.lizhi_finance_ui_close(uuid) to authenticated;
grant execute on function public.lizhi_finance_ui_claim(uuid) to authenticated;
grant execute on function public.lizhi_finance_ui_complete(uuid,uuid,boolean,jsonb,text) to authenticated;
grant execute on function public.lizhi_finance_ui_site_sessions(uuid) to service_role;
grant execute on function public.lizhi_finance_ui_site_enqueue(uuid,uuid,uuid,text,jsonb) to service_role;
grant execute on function public.lizhi_finance_ui_site_job(uuid,uuid) to service_role;
