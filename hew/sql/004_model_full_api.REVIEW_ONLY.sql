-- 立之 3D｜M4 完整 Hew API（瀏覽器 host 模式）
-- REVIEW ONLY: apply after review, on top of 001/002 (browser queue).
-- Adds the generic `call` job, a finish RPC that lets read-only calls ACK at
-- the same revision, larger bounded results, result read-back for the Site,
-- and the owner-private storage bucket for snapshots / exports / saves.
-- Leaves create_box / move and lizhi_model_finish exactly as they are.

begin;

-- 1. Job rows: allow `call`, bigger params (a transaction of many commands)
--    and bigger results (query replies; binaries live in storage).
alter table lizhi_model_private.jobs drop constraint if exists jobs_command_check;
alter table lizhi_model_private.jobs add constraint jobs_command_check
  check (command in ('create_box','move','call'));
alter table lizhi_model_private.jobs drop constraint if exists model_job_params_size;
alter table lizhi_model_private.jobs add constraint model_job_params_size
  check (octet_length(params::text) <= 32768);
alter table lizhi_model_private.jobs drop constraint if exists model_job_result_size;
alter table lizhi_model_private.jobs add constraint model_job_result_size
  check (result is null or octet_length(result::text) <= 262144);
alter table lizhi_model_private.jobs add column if not exists mutated boolean;

-- 2. Server-side validation of a `call` job. The Edge contract already checks
--    the method against the generated registry; this is the last gate.
create or replace function lizhi_model_private.valid_call(p_params jsonb)
returns boolean language plpgsql immutable set search_path to '' as $$
declare k text; m text; c jsonb;
  blocked text[] := array['hew.meta.hello','hew.doc.attach','hew.doc.focus'];
  destructive text[] := array['hew.doc.new','hew.doc.open','hew.doc.close','hew.doc.revert',
    'hew.doc.import','hew.doc.purge_unused','hew.entity.delete','hew.sketch.delete',
    'hew.solid.delete_faces','hew.solid.delete_imprint','hew.group.explode',
    'hew.component.explode','hew.tag.delete','hew.scenes.remove','hew.library.remove',
    'hew.attr.delete','hew.guide.clear'];
  confirmed boolean;
begin
  if jsonb_typeof(p_params) <> 'object' or octet_length(p_params::text) > 32768 then return false; end if;
  for k in select jsonb_object_keys(p_params) loop
    if k not in ('method','params','confirmed') then return false; end if;
  end loop;
  m := p_params->>'method';
  if jsonb_typeof(p_params->'method') <> 'string' or m !~ '^hew\.[a-z]+\.[a-z_]+$'
     or m = any(blocked) then return false; end if;
  if jsonb_typeof(coalesce(p_params->'params','{}'::jsonb)) <> 'object' then return false; end if;
  if p_params ? 'confirmed' and p_params->'confirmed' <> 'true'::jsonb then return false; end if;
  confirmed := coalesce((p_params->>'confirmed')::boolean, false);
  if m = any(destructive) and not confirmed then return false; end if;
  if m = 'hew.doc.transact' then
    if jsonb_typeof(p_params->'params'->'commands') <> 'array'
       or jsonb_array_length(p_params->'params'->'commands') not between 1 and 200 then return false; end if;
    for c in select value from jsonb_array_elements(p_params->'params'->'commands') loop
      if jsonb_typeof(c) <> 'object' or jsonb_typeof(c->'method') <> 'string'
         or (c->>'method') !~ '^hew\.[a-z]+\.[a-z_]+$'
         or (c->>'method') = any(blocked) or (c->>'method') = 'hew.doc.transact'
         or ((c->>'method') = any(destructive) and not confirmed) then return false; end if;
    end loop;
  end if;
  return true;
exception when others then return false;
end $$;

create or replace function lizhi_model_private.valid_command(p_command text, p_params jsonb)
returns boolean language plpgsql immutable set search_path to '' as $function$
declare count_keys integer; x jsonb; dimension numeric;
begin
  if p_command = 'call' then return lizhi_model_private.valid_call(p_params); end if;
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
end $function$;

-- 3. Finish v2 (owner browser, user JWT). Same guards as lizhi_model_finish,
--    plus: a non-mutating call finishes at the SAME revision and does not
--    cancel the other queued jobs; a mutating one needs a new revision.
create or replace function public.lizhi_model_finish_v2(
  p_session uuid, p_job uuid, p_success boolean, p_mutated boolean,
  p_new_revision text, p_result jsonb default null, p_error text default null)
returns boolean language plpgsql security definer set search_path to '' as $$
declare actor uuid := auth.uid(); current_session record; claimed_job record;
begin
  if actor is null or not public.lizhi_web_is_allowed()
     or p_success is null or p_mutated is null then return false; end if;
  select s.* into current_session from lizhi_model_private.sessions s
   where s.id = p_session and s.owner_uid = actor and s.enabled
     and s.last_seen > statement_timestamp() - interval '30 seconds'
     and s.approved_until > statement_timestamp() for update;
  if not found then return false; end if;
  select j.* into claimed_job from lizhi_model_private.jobs j
   where j.id = p_job and j.owner_uid = actor and j.session_id = p_session
     and j.state = 'claimed' and j.command = 'call'
     and j.document_id = current_session.document_id
     and j.expected_revision = current_session.revision
   for update;
  if not found then return false; end if;
  if p_result is not null and octet_length(p_result::text) > 262144 then return false; end if;
  if p_success and p_mutated and (length(coalesce(p_new_revision,'')) not between 1 and 128
     or p_new_revision = current_session.revision) then return false; end if;
  if (not p_success or not p_mutated) and p_new_revision is distinct from current_session.revision
     then return false; end if;
  update lizhi_model_private.jobs j
     set state = case when p_success then 'succeeded' else 'failed' end,
         completed_at = statement_timestamp(), result = p_result,
         mutated = p_success and p_mutated,
         error = case when p_success then null else left(coalesce(p_error,'MODEL_ENGINE_FAILED'),200) end
   where j.id = p_job;
  if p_success and p_mutated then
    update lizhi_model_private.sessions s set revision = p_new_revision where s.id = p_session;
    update lizhi_model_private.jobs j
       set state = 'cancelled', completed_at = statement_timestamp(),
           error = 'MODEL_STALE_DOCUMENT_REVISION'
     where j.session_id = p_session and j.owner_uid = actor and j.state = 'queued';
  end if;
  return true;
end $$;
revoke all on function public.lizhi_model_finish_v2(uuid,uuid,boolean,boolean,text,jsonb,text) from public, anon;
grant execute on function public.lizhi_model_finish_v2(uuid,uuid,boolean,boolean,text,jsonb,text) to authenticated;

-- 4. Site job read-back now includes the result, method and mutated flag.
create or replace function public.lizhi_model_site_job(p_owner uuid, p_job uuid)
returns jsonb language sql stable security definer set search_path to '' as $$
 select jsonb_build_object('job_id', j.id, 'state',
   case when j.state in ('queued','claimed') and j.expires_at <= now() then 'expired' else j.state end,
   'completed_at', j.completed_at, 'command', j.command,
   'method', case when j.command = 'call' then j.params->>'method' else null end,
   'mutated', j.mutated,
   'error', case when j.state = 'failed' then left(j.error,200) else null end,
   'result', j.result)
 from lizhi_model_private.jobs j
 where (auth.jwt()->>'role') = 'service_role' and p_owner is not null
   and j.owner_uid = p_owner and j.id = p_job;
$$;

-- 5. Owner-private bucket for job outputs: <owner uid>/<job id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit)
values ('lizhi-model-files', 'lizhi-model-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists lizhi_model_files_owner_insert on storage.objects;
create policy lizhi_model_files_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lizhi-model-files'
    and public.lizhi_web_is_allowed()
    and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists lizhi_model_files_owner_select on storage.objects;
create policy lizhi_model_files_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'lizhi-model-files'
    and public.lizhi_web_is_allowed()
    and (storage.foldername(name))[1] = auth.uid()::text);

commit;
