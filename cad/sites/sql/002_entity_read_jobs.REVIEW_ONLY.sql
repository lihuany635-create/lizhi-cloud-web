-- REVIEW ONLY. CAD native entity read job bridge v1: no production deployment.
-- Depends on the existing lizhi_private CAD sessions/commands schema and owner-scoped site RPCs.
-- Exactly two new command types: neither is a mutation. No raw DXF, text, path or screenshots.
do $readcheck$
declare def text;
begin
 select pg_get_constraintdef(c.oid) into def
 from pg_constraint c join pg_class t on t.oid=c.conrelid
 join pg_namespace n on n.oid=t.relnamespace
 where n.nspname='lizhi_private' and t.relname='lizhi_cad_commands'
   and c.conname='lizhi_cad_commands_command_check';
 if def is null or def not like '%rectang%' or def not like '%circle%' then
  raise exception 'CAD command allowlist schema not as expected; review migration first';
 end if;
end $readcheck$;

alter table lizhi_private.lizhi_cad_commands
 drop constraint lizhi_cad_commands_command_check;
alter table lizhi_private.lizhi_cad_commands
 add constraint lizhi_cad_commands_command_check
 check(command in ('new','line','rectang','circle','lizhi.inspect','lizhi.entities'));

create or replace function public.lizhi_cad_site_read_enqueue(
 p_owner uuid,p_session uuid,p_command text,p_params jsonb,p_request_id uuid
) returns uuid language plpgsql volatile security definer set search_path='' as $read$
declare job_id uuid;
begin
 if auth.role()<>'service_role' or p_owner is null or p_request_id is null then
   raise exception 'service owner required' using errcode='42501';
 end if;
 if p_command not in ('lizhi.inspect','lizhi.entities')
    or jsonb_typeof(p_params)<>'object' or octet_length(p_params::text)>1024 then
   raise exception 'unsupported bounded read' using errcode='22023';
 end if;
 if p_command='lizhi.inspect' and p_params<>'{}'::jsonb then
   raise exception 'inspect accepts no arguments' using errcode='22023';
 end if;
 if p_command='lizhi.entities' and (
    exists (select 1 from jsonb_object_keys(p_params) x(k)
      where x.k not in ('type','layer','limit','offset','selected'))
    or (p_params ? 'limit' and
       (jsonb_typeof(p_params->'limit')<>'number'
         or (p_params->>'limit') !~ '^[0-9]+$'
         or (p_params->>'limit')::integer not between 1 and 8))
    or (p_params ? 'offset' and
       (jsonb_typeof(p_params->'offset')<>'number'
        or (p_params->>'offset') !~ '^[0-9]+$'
        or (p_params->>'offset')::integer not between 0 and 10000))
    or (p_params ? 'type' and
       (jsonb_typeof(p_params->'type')<>'string' or
        length(p_params->>'type') not between 1 and 32))
    or (p_params ? 'layer' and
       (jsonb_typeof(p_params->'layer')<>'string' or
        length(p_params->>'layer') not between 1 and 80))
    or (p_params ? 'selected' and jsonb_typeof(p_params->'selected')<>'boolean')
 ) then raise exception 'invalid bounded entity query' using errcode='22023'; end if;
 -- Deny attempts to reuse another owner's local CAD session.
 perform 1 from lizhi_private.lizhi_cad_sessions s
   where s.id=p_session and s.user_id=p_owner and s.enabled
   and s.expires_at>statement_timestamp()
   and s.last_seen>statement_timestamp()-interval '30 seconds';
 if not found then raise exception 'CAD session offline' using errcode='42501'; end if;
 select c.id into job_id from lizhi_private.lizhi_cad_commands c
   where c.user_id=p_owner and c.idempotency_key=p_request_id
    and c.session_id=p_session and c.command=p_command and c.params=p_params;
 if job_id is not null then return job_id; end if;
 if exists (select 1 from lizhi_private.lizhi_cad_commands c
      where c.user_id=p_owner and c.idempotency_key=p_request_id)
 then raise exception 'request conflict' using errcode='23505'; end if;
 if (select count(*) from lizhi_private.lizhi_cad_commands c
   where c.user_id=p_owner and c.created_at>statement_timestamp()-interval '60 seconds')>=20
 then raise exception 'read rate limited' using errcode='P0001'; end if;
 insert into lizhi_private.lizhi_cad_commands
    (user_id,session_id,idempotency_key,command,params)
 values(p_owner,p_session,p_request_id,p_command,p_params)
 on conflict(user_id,idempotency_key) do nothing returning id into job_id;
 if job_id is null then
  select id into job_id from lizhi_private.lizhi_cad_commands c
    where c.user_id=p_owner and c.idempotency_key=p_request_id
     and c.session_id=p_session and c.command=p_command and c.params=p_params;
 end if;
 if job_id is null then raise exception 'read request conflict' using errcode='23505'; end if;
 return job_id;
end $read$;

-- A read receipt is only fetchable by service_role, only the original owner,
-- only for two read command types. This never returns a write job's result.
create or replace function public.lizhi_cad_site_read_job(p_owner uuid,p_job uuid)
returns jsonb language sql stable security definer set search_path='' as $read$
 select jsonb_build_object(
   'job_id',c.id,'kind',c.command,
   'state',case when c.state in ('queued','claimed') and c.expires_at<=now()
        then 'expired' else c.state end,
   'data',case when c.state='succeeded' and
           jsonb_typeof(c.result)='object' and
           octet_length(c.result::text)<=3500 then c.result else null end
 )
 from lizhi_private.lizhi_cad_commands c
 where auth.role()='service_role' and p_owner is not null
   and c.user_id=p_owner and c.id=p_job
   and c.command in ('lizhi.inspect','lizhi.entities');
$read$;

revoke all on function public.lizhi_cad_site_read_enqueue(uuid,uuid,text,jsonb,uuid)
 from public,anon,authenticated;
revoke all on function public.lizhi_cad_site_read_job(uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.lizhi_cad_site_read_enqueue(uuid,uuid,text,jsonb,uuid) to service_role;
grant execute on function public.lizhi_cad_site_read_job(uuid,uuid) to service_role;
