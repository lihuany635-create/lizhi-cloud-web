-- REVIEW ONLY: Lizhi 3D model queue v0.1.
-- NOT a Supabase migration, not applied to production and not related to CAD tables.
-- Apply only in an isolated PostgreSQL / Supabase test project first.
-- No geometry files, SKP/GLB, local paths or secrets are stored.
-- All public RPCs are owner-scoped; site RPCs are service_role-only.
create schema if not exists lizhi_model_private;
revoke all on schema lizhi_model_private from PUBLIC,anon,authenticated;

create table if not exists lizhi_model_private.sessions (
  id uuid primary key,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null,
  revision text not null check (length(revision) between 1 and 128),
  enabled boolean not null default true,
  approved_until timestamptz not null,
  last_seen timestamptz not null default now(),
  scene_summary jsonb not null default '{"entities":[]}'::jsonb,
  created_at timestamptz not null default now(),
  constraint model_scene_size check (octet_length(scene_summary::text)<=8192)
);
create index if not exists lizhi_model_sessions_owner_online on lizhi_model_private.sessions(owner_uid,last_seen desc);
alter table lizhi_model_private.sessions enable row level security;
revoke all on lizhi_model_private.sessions from PUBLIC,anon,authenticated;

create table if not exists lizhi_model_private.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_uid uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references lizhi_model_private.sessions(id) on delete cascade,
  request_id uuid not null,
  document_id uuid not null,
  expected_revision text not null,
  command text not null check (command in ('create_box','move')),
  params jsonb not null,
  state text not null default 'queued'
    check (state in ('queued','claimed','succeeded','failed','cancelled','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 seconds',
  claimed_at timestamptz,
  completed_at timestamptz,
  result jsonb,
  error text,
  unique(owner_uid,request_id),
  constraint model_job_params_size check(octet_length(params::text)<=8192),
  constraint model_job_result_size check(result is null or octet_length(result::text)<=4096)
);
create index if not exists lizhi_model_jobs_claim on lizhi_model_private.jobs(session_id,state,created_at);
alter table lizhi_model_private.jobs enable row level security;
revoke all on lizhi_model_private.jobs from PUBLIC,anon,authenticated;

create or replace function lizhi_model_private.vec3(v jsonb, maximum numeric)
returns boolean language plpgsql immutable set search_path='' as $$
declare x jsonb; n numeric;
begin
  if jsonb_typeof(v)<>'array' or jsonb_array_length(v)<>3 then return false; end if;
  for x in select value from jsonb_array_elements(v) loop
    if jsonb_typeof(x)<>'number' then return false; end if;
    n:=(x #>> '{}')::numeric;
    if n='NaN'::numeric or abs(n)>maximum then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;

create or replace function lizhi_model_private.valid_command(p_command text,p_params jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare count_keys integer; q jsonb; x jsonb; dimension numeric;
begin
  if jsonb_typeof(p_params)<>'object' or octet_length(p_params::text)>8192 then return false; end if;
  select count(*) into count_keys from jsonb_object_keys(p_params);
  if p_command='create_box' then
    if not (p_params ? 'origin_m' and p_params ? 'size_m') or
        count_keys not in (2,3) or
        (count_keys=3 and not p_params ? 'name') or
        not lizhi_model_private.vec3(p_params->'origin_m',100) or
        not lizhi_model_private.vec3(p_params->'size_m',20) then return false; end if;
    for x in select value from jsonb_array_elements(p_params->'size_m') loop
      dimension:=(x #>> '{}')::numeric;
      if dimension<0.0001 or dimension>20 then return false; end if;
    end loop;
    if p_params ? 'name' and
       (jsonb_typeof(p_params->'name')<>'string' or length(p_params->>'name') not between 1 and 80)
       then return false; end if;
    return true;
  end if;
  if p_command='move' then
    return count_keys=2 and p_params ? 'entity_id' and p_params ? 'translation_m'
      and jsonb_typeof(p_params->'entity_id')='string'
      and length(p_params->>'entity_id') between 1 and 80
      and (p_params->>'entity_id') ~ '^[a-zA-Z][a-zA-Z0-9_-]*$'
      and lizhi_model_private.vec3(p_params->'translation_m',100)
      and p_params->'translation_m'<>'[0,0,0]'::jsonb;
  end if;
  return false;
exception when others then return false;
end $$;

-- Authenticated browser only. This is called ONLY after a visible user click.
-- Short-living consent must not be renewed by heartbeat alone indefinitely.
create or replace function public.lizhi_model_begin(
 p_session uuid,p_document uuid,p_revision text)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); accepted uuid;
begin
 if actor is null or not public.lizhi_web_is_allowed() or
    p_session is null or p_document is null or length(coalesce(p_revision,'')) not between 1 and 128
   then raise exception 'model permission required' using errcode='42501'; end if;
 insert into lizhi_model_private.sessions as s
 (id,owner_uid,document_id,revision,enabled,last_seen,approved_until,scene_summary)
 values(p_session,actor,p_document,p_revision,true,statement_timestamp(),
        statement_timestamp()+interval '120 seconds','{"entities":[]}'::jsonb)
 on conflict(id) do update set
  enabled=true,document_id=p_document,revision=p_revision,
  last_seen=statement_timestamp(),approved_until=statement_timestamp()+interval '120 seconds',
  scene_summary='{"entities":[]}'::jsonb
 where s.owner_uid=actor and not exists(
   select 1 from lizhi_model_private.jobs j where j.session_id=s.id and j.state='claimed')
 returning id into accepted;
 return accepted=p_session;
end $$;

create or replace function public.lizhi_model_heartbeat(p_session uuid,p_document uuid,p_revision text)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); n int;
begin
 if actor is null or not public.lizhi_web_is_allowed() then return false; end if;
 update lizhi_model_private.sessions
 set last_seen=statement_timestamp()
 where id=p_session and owner_uid=actor and enabled and document_id=p_document
   and revision=p_revision and approved_until>statement_timestamp();
 get diagnostics n=row_count;
 return n=1;
end $$;

create or replace function public.lizhi_model_close(p_session uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); n int;
begin
 if actor is null or not public.lizhi_web_is_allowed() then return false; end if;
 update lizhi_model_private.sessions
 set enabled=false,approved_until=statement_timestamp()
 where id=p_session and owner_uid=actor;
 get diagnostics n=row_count;
 update lizhi_model_private.jobs
 set state='cancelled',completed_at=statement_timestamp()
 where session_id=p_session and owner_uid=actor and state='queued';
 return n=1;
end $$;

create or replace function public.lizhi_model_claim(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); claimed_row record;
begin
 if actor is null or not public.lizhi_web_is_allowed() then return null; end if;
 perform 1 from lizhi_model_private.sessions s
 where s.id=p_session and s.owner_uid=actor and s.enabled
   and s.last_seen>statement_timestamp()-interval '30 seconds'
   and s.approved_until>statement_timestamp();
 if not found then return null; end if;
 update lizhi_model_private.jobs
 set state='expired',completed_at=statement_timestamp()
 where session_id=p_session and owner_uid=actor and state='queued'
   and expires_at<=statement_timestamp();
 with picked as (
  select j.id from lizhi_model_private.jobs j
  join lizhi_model_private.sessions s on s.id=j.session_id
  where j.session_id=p_session and j.owner_uid=actor and j.state='queued'
    and j.document_id=s.document_id and j.expected_revision=s.revision
    and j.expires_at>statement_timestamp()
  order by j.created_at,j.id limit 1 for update of j skip locked
 )
 update lizhi_model_private.jobs j set state='claimed',claimed_at=statement_timestamp()
 from picked where j.id=picked.id
 returning j.id,j.request_id,j.command,j.params,j.document_id,j.expected_revision into claimed_row;
 if not found then return null; end if;
 return jsonb_build_object('job_id',claimed_row.id,'request_id',claimed_row.request_id,
  'command',claimed_row.command,'params',claimed_row.params,'document_id',claimed_row.document_id,
  'expected_revision',claimed_row.expected_revision,'session_id',p_session);
end $$;

create or replace function public.lizhi_model_finish(
 p_session uuid,p_job uuid,p_success boolean,p_new_revision text,
 p_result jsonb default null,p_error text default null
)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); current_session record; claimed_job record;
begin
 if actor is null or not public.lizhi_web_is_allowed() or p_success is null then return false; end if;
 select s.* into current_session from lizhi_model_private.sessions s
 where s.id=p_session and s.owner_uid=actor and s.enabled
 and s.last_seen>statement_timestamp()-interval '30 seconds'
 and s.approved_until>statement_timestamp() for update;
 if not found then return false; end if;
 select j.* into claimed_job from lizhi_model_private.jobs j
 where j.id=p_job and j.owner_uid=actor and j.session_id=p_session
 and j.state='claimed' and j.document_id=current_session.document_id
 and j.expected_revision=current_session.revision
 for update;
 if not found then return false; end if;
 if p_success and (length(coalesce(p_new_revision,'')) not between 1 and 128 or
    p_new_revision=current_session.revision) then return false; end if;
 if p_result is not null and octet_length(p_result::text)>4096 then return false; end if;
 update lizhi_model_private.jobs j
 set state=case when p_success then 'succeeded' else 'failed' end,
  completed_at=statement_timestamp(),result=p_result,
  error=case when p_success then null else left(coalesce(p_error,'MODEL_ENGINE_FAILED'),200) end
 where j.id=p_job;
 if p_success then
  update lizhi_model_private.sessions s set revision=p_new_revision where s.id=p_session;
 end if;
 return true;
end $$;

-- Minimal server-checked scene summary. This is NOT a file store.
create or replace function public.lizhi_model_publish_scene(
 p_session uuid,p_document uuid,p_revision text,p_entities jsonb)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); n int;
begin
 if actor is null or not public.lizhi_web_is_allowed() or
    jsonb_typeof(p_entities)<>'array' or jsonb_array_length(p_entities)>100 or
    octet_length(p_entities::text)>8192 then return false; end if;
 update lizhi_model_private.sessions set scene_summary=jsonb_build_object('entities',p_entities)
 where id=p_session and owner_uid=actor and document_id=p_document and revision=p_revision
   and enabled and approved_until>statement_timestamp();
 get diagnostics n=row_count;
 return n=1;
end $$;

-- Service-only functions. The caller is the validated private Site's Edge relay.
-- PostgreSQL function EXECUTE grants enforce this even if someone spoofs params.
-- JWT role claim is only reliable when Supabase PostgREST has verified JWT.
create or replace function public.lizhi_model_site_sessions(p_owner uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select case when (auth.jwt()->>'role')<>'service_role' or p_owner is null
 then '[]'::jsonb else coalesce((
 select jsonb_agg(jsonb_build_object('session_id',x.id,
  'document_id',x.document_id) order by x.last_seen desc)
 from (select s.id,s.document_id,s.last_seen from lizhi_model_private.sessions s
       where s.owner_uid=p_owner and s.enabled and
       s.approved_until>now() and s.last_seen>now()-interval '30 seconds'
       order by s.last_seen desc limit 8) x
 ),'[]'::jsonb) end;
$$;

create or replace function public.lizhi_model_site_enqueue(
 p_owner uuid,p_session uuid,p_request_id uuid,p_document uuid,
 p_revision text,p_command text,p_params jsonb)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare job_id uuid;
begin
 if (auth.jwt()->>'role') is distinct from 'service_role' or p_owner is null or
  p_request_id is null or p_document is null or
  length(coalesce(p_revision,'')) not between 1 and 128 or
  not lizhi_model_private.valid_command(p_command,p_params)
 then raise exception 'invalid model site request' using errcode='42501'; end if;
 select j.id into job_id from lizhi_model_private.jobs j
 where j.owner_uid=p_owner and j.request_id=p_request_id
   and j.session_id=p_session and j.document_id=p_document
   and j.expected_revision=p_revision and j.command=p_command and j.params=p_params;
 if job_id is not null then return job_id; end if;
 if exists(select 1 from lizhi_model_private.jobs j where j.owner_uid=p_owner and j.request_id=p_request_id)
 then raise exception 'request_id reused with different model job' using errcode='23505'; end if;
 perform 1 from lizhi_model_private.sessions s
 where s.id=p_session and s.owner_uid=p_owner and s.document_id=p_document
   and s.revision=p_revision and s.enabled and s.approved_until>statement_timestamp()
   and s.last_seen>statement_timestamp()-interval '30 seconds';
 if not found then raise exception 'owner document session not approved' using errcode='42501'; end if;
 if (select count(*) from lizhi_model_private.jobs j
   where j.owner_uid=p_owner and j.created_at>statement_timestamp()-interval '60 seconds')>=15
 then raise exception 'model rate limit' using errcode='P0001'; end if;
 insert into lizhi_model_private.jobs(owner_uid,session_id,request_id,document_id,expected_revision,command,params)
 values(p_owner,p_session,p_request_id,p_document,p_revision,p_command,p_params)
 on conflict(owner_uid,request_id) do nothing returning id into job_id;
 if job_id is null then
  select j.id into job_id from lizhi_model_private.jobs j
  where j.owner_uid=p_owner and j.request_id=p_request_id
    and j.session_id=p_session and j.document_id=p_document
    and j.expected_revision=p_revision and j.command=p_command and j.params=p_params;
 end if;
 if job_id is null then raise exception 'idempotency conflict' using errcode='23505'; end if;
 return job_id;
end $$;

create or replace function public.lizhi_model_site_job(p_owner uuid,p_job uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('job_id',j.id,'state',
  case when j.state in ('queued','claimed') and j.expires_at<=now() then 'expired' else j.state end,
  'completed_at',j.completed_at,
  'error',case when j.state='failed' then left(j.error,200) else null end)
 from lizhi_model_private.jobs j
 where (auth.jwt()->>'role')='service_role' and p_owner is not null and j.owner_uid=p_owner and j.id=p_job;
$$;

create or replace function public.lizhi_model_site_scene(p_owner uuid,p_session uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('document_id',s.document_id::text,'revision',s.revision,'entities',s.scene_summary->'entities')
 from lizhi_model_private.sessions s
 where (auth.jwt()->>'role')='service_role' and p_owner is not null
 and s.owner_uid=p_owner and s.id=p_session and s.enabled
 and s.approved_until>now() and s.last_seen>now()-interval '30 seconds';
$$;

-- Function default EXECUTE to PUBLIC is dangerous; revoke explicitly.
revoke all on function lizhi_model_private.vec3(jsonb,numeric) from PUBLIC,anon,authenticated;
revoke all on function lizhi_model_private.valid_command(text,jsonb) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_begin(uuid,uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_heartbeat(uuid,uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_close(uuid) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_claim(uuid) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_finish(uuid,uuid,boolean,text,jsonb,text) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_publish_scene(uuid,uuid,text,jsonb) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_site_sessions(uuid) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_site_enqueue(uuid,uuid,uuid,uuid,text,text,jsonb) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_site_job(uuid,uuid) from PUBLIC,anon,authenticated;
revoke all on function public.lizhi_model_site_scene(uuid,uuid) from PUBLIC,anon,authenticated;
grant execute on function public.lizhi_model_begin(uuid,uuid,text) to authenticated;
grant execute on function public.lizhi_model_heartbeat(uuid,uuid,text) to authenticated;
grant execute on function public.lizhi_model_close(uuid) to authenticated;
grant execute on function public.lizhi_model_claim(uuid) to authenticated;
grant execute on function public.lizhi_model_finish(uuid,uuid,boolean,text,jsonb,text) to authenticated;
grant execute on function public.lizhi_model_publish_scene(uuid,uuid,text,jsonb) to authenticated;
grant execute on function public.lizhi_model_site_sessions(uuid) to service_role;
grant execute on function public.lizhi_model_site_enqueue(uuid,uuid,uuid,uuid,text,text,jsonb) to service_role;
grant execute on function public.lizhi_model_site_job(uuid,uuid) to service_role;
grant execute on function public.lizhi_model_site_scene(uuid,uuid) to service_role;
