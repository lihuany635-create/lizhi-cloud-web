-- REVIEW_ONLY: CAD native geometry inspection job queue.
-- DO NOT apply to production until new pinned WASM, browser host, Sites v4 and
-- Edge contract pass isolated E2E and the owner explicitly approves migration.
-- Never returns source DXF or exposes private tables to anon/authenticated.
do $cad_guard$
declare def text;
begin
  select pg_get_constraintdef(oid) into def
  from pg_constraint
  where conrelid='lizhi_private.lizhi_cad_commands'::regclass
    and conname='lizhi_cad_commands_command_check';
  if def is null or def not like '%new%' or def not like '%line%'
    or def not like '%rectang%' or def not like '%circle%' then
    raise exception 'Unrecognized CAD command constraint, manual review required';
  end if;
  alter table lizhi_private.lizhi_cad_commands
    drop constraint lizhi_cad_commands_command_check;
  alter table lizhi_private.lizhi_cad_commands
    add constraint lizhi_cad_commands_command_check
    check (command in ('new','line','rectang','circle','lizhi.inspect','lizhi.entities'));
end $cad_guard$;

create or replace function public.lizhi_cad_site_enqueue_read(
  p_owner uuid, p_session uuid, p_command text, p_params jsonb, p_request_id uuid
) returns uuid language plpgsql volatile security definer set search_path='' as $cad$
declare job_id uuid;
begin
  if auth.role()<>'service_role' or p_owner is null or p_request_id is null
    or p_session is null then
    raise exception 'private CAD Site service required' using errcode='42501';
  end if;
  if p_command not in ('lizhi.inspect','lizhi.entities')
    or jsonb_typeof(p_params)<>'object' or octet_length(p_params::text)>1024 then
    raise exception 'unsupported bounded read' using errcode='22023';
  end if;
  if p_command='lizhi.inspect' and p_params<>'{}'::jsonb then
    raise exception 'inspect takes no arguments' using errcode='22023';
  end if;
  if p_command='lizhi.entities' then
    if exists(select 1 from jsonb_object_keys(p_params) as keys(key)
              where keys.key not in ('type','layer','selected','limit','offset')) then
      raise exception 'invalid entity filter keys' using errcode='22023';
    end if;
    if p_params ? 'type' and
       (jsonb_typeof(p_params->'type')<>'string' or length(p_params->>'type')>32) then
      raise exception 'invalid entity type' using errcode='22023';
    end if;
    if p_params ? 'layer' and
       (jsonb_typeof(p_params->'layer')<>'string' or length(p_params->>'layer')>80) then
      raise exception 'invalid entity layer' using errcode='22023';
    end if;
    if p_params ? 'selected' and jsonb_typeof(p_params->'selected')<>'boolean' then
      raise exception 'invalid selected filter' using errcode='22023';
    end if;
    if p_params ? 'limit' and
       (jsonb_typeof(p_params->'limit')<>'number'
        or (p_params->>'limit') !~ '^[1-8]$') then
      raise exception 'invalid bounded page size' using errcode='22023';
    end if;
    if p_params ? 'offset' and
       (jsonb_typeof(p_params->'offset')<>'number'
        or (p_params->>'offset') !~ '^(0|[1-9][0-9]{0,4})$') then
      raise exception 'invalid bounded offset' using errcode='22023';
    end if;
    if p_params ? 'offset' and (p_params->>'offset')::integer>10000 then
      raise exception 'offset exceeds bound' using errcode='22023';
    end if;
  end if;
  perform 1 from lizhi_private.lizhi_cad_sessions s
    where s.id=p_session and s.user_id=p_owner and s.enabled
      and s.expires_at>statement_timestamp()
      and s.last_seen>statement_timestamp()-interval '30 seconds';
  if not found then
    raise exception 'CAD owner or lease no longer approved' using errcode='42501';
  end if;
  select c.id into job_id from lizhi_private.lizhi_cad_commands c
   where c.user_id=p_owner and c.idempotency_key=p_request_id
     and c.session_id=p_session and c.command=p_command and c.params=p_params;
  if job_id is not null then return job_id; end if;
  if exists(select 1 from lizhi_private.lizhi_cad_commands c
      where c.user_id=p_owner and c.idempotency_key=p_request_id) then
    raise exception 'request_id parameters conflict' using errcode='23505';
  end if;
  if (select count(*) from lizhi_private.lizhi_cad_commands c
      where c.user_id=p_owner and c.created_at>statement_timestamp()-interval '60 seconds')>=20 then
    raise exception 'CAD rate limit' using errcode='P0001';
  end if;
  insert into lizhi_private.lizhi_cad_commands
    (user_id,session_id,idempotency_key,command,params)
    values (p_owner,p_session,p_request_id,p_command,p_params)
  on conflict(user_id,idempotency_key) do nothing returning id into job_id;
  if job_id is null then
    select id into job_id from lizhi_private.lizhi_cad_commands
     where user_id=p_owner and idempotency_key=p_request_id
       and session_id=p_session and command=p_command and params=p_params;
  end if;
  if job_id is null then raise exception 'request conflict' using errcode='23505'; end if;
  return job_id;
end $cad$;
revoke all on function public.lizhi_cad_site_enqueue_read(uuid,uuid,text,jsonb,uuid)
  from public,anon,authenticated;
grant execute on function public.lizhi_cad_site_enqueue_read(uuid,uuid,text,jsonb,uuid)
  to service_role;
