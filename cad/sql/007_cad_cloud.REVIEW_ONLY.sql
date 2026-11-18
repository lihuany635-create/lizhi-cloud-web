-- 立之 CAD｜雲端 CAD 執行器（電腦關機也能讓 ChatGPT 畫 CAD）
-- REVIEW ONLY. Requires 006 (lizhi-cad-files bucket, lizhi_cad_call_valid).
-- The authoritative drawing is a real DXF file in private storage, one object
-- per revision (old versions are kept). A headless `cadcraft-cli mcp` worker
-- (GitHub Actions) claims queued jobs through the worker Edge endpoint, runs
-- them against the file and writes the next revision.
-- Every function here is service_role only; browsers never touch it.

begin;

create table if not exists lizhi_private.lizhi_cad_cloud_documents (
  id uuid primary key default gen_random_uuid(),
  owner_uid uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  metric boolean not null default true,
  revision integer not null default 0 check (revision >= 0),
  -- null until the worker has written revision 1
  current_path text check (current_path is null or length(current_path) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_uid, id)
);

create table if not exists lizhi_private.lizhi_cad_cloud_jobs (
  id uuid primary key default gen_random_uuid(),
  seq bigserial not null,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  document_id uuid not null references lizhi_private.lizhi_cad_cloud_documents(id) on delete cascade,
  expected_revision integer not null check (expected_revision >= 0),
  call jsonb not null check (jsonb_typeof(call) = 'object' and octet_length(call::text) <= 32768),
  state text not null default 'queued'
    check (state in ('queued','claimed','succeeded','failed','cancelled','expired')),
  result jsonb check (result is null or octet_length(result::text) <= 262144),
  error text,
  mutated boolean,
  new_revision integer,
  worker_run text check (worker_run is null or length(worker_run) <= 120),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default now() + interval '2 hours',
  unique (owner_uid, request_id)
);
create index if not exists lizhi_cad_cloud_jobs_queue on lizhi_private.lizhi_cad_cloud_jobs (state, seq);

revoke all on lizhi_private.lizhi_cad_cloud_documents, lizhi_private.lizhi_cad_cloud_jobs
  from public, anon, authenticated;

create or replace function lizhi_private.lizhi_cad_require_service_role() returns void
language plpgsql stable set search_path to '' as $$
begin
  if (auth.jwt()->>'role') is distinct from 'service_role' then
    raise exception 'service role only' using errcode = '42501';
  end if;
end $$;

-- Site: list documents.
create or replace function public.lizhi_cad_cloud_list(p_owner uuid)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  perform lizhi_private.lizhi_cad_require_service_role();
  return coalesce((select jsonb_agg(jsonb_build_object('document_id', d.id, 'name', d.name,
      'revision', d.revision, 'has_file', d.current_path is not null, 'updated_at', d.updated_at)
      order by d.updated_at desc)
    from lizhi_private.lizhi_cad_cloud_documents d where d.owner_uid = p_owner), '[]'::jsonb);
end $$;

-- Site: create an empty document (the worker writes revision 1 on its first job).
create or replace function public.lizhi_cad_cloud_new(p_owner uuid, p_name text, p_metric boolean default true)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare d record;
begin
  perform lizhi_private.lizhi_cad_require_service_role();
  if p_owner is null or length(coalesce(trim(p_name),'')) not between 1 and 80 then
    raise exception 'invalid document' using errcode = '22023'; end if;
  if (select count(*) from lizhi_private.lizhi_cad_cloud_documents where owner_uid = p_owner) >= 200 then
    raise exception 'document limit' using errcode = 'P0001'; end if;
  insert into lizhi_private.lizhi_cad_cloud_documents (owner_uid, name, metric)
  values (p_owner, trim(p_name), coalesce(p_metric,true)) returning * into d;
  return jsonb_build_object('document_id', d.id, 'name', d.name, 'revision', d.revision);
end $$;

-- Site: queue one CAD call against a drawing revision (idempotent).
create or replace function public.lizhi_cad_cloud_enqueue(
  p_owner uuid, p_request uuid, p_document uuid, p_revision integer, p_call jsonb)
returns uuid language plpgsql security definer set search_path to '' as $$
declare job uuid; d record;
begin
  perform lizhi_private.lizhi_cad_require_service_role();
  if p_owner is null or p_request is null or p_document is null or p_revision is null
     or not lizhi_private.lizhi_cad_call_valid(p_call)
     -- the worker owns the file lifecycle: no save/saveas/new in cloud mode
     or (p_call->>'op' = 'execute' and lower(p_call->>'command') in ('new','qsave','save','saveas','qnew'))
  then raise exception 'invalid cloud CAD call' using errcode = '42501'; end if;
  select j.id into job from lizhi_private.lizhi_cad_cloud_jobs j
   where j.owner_uid = p_owner and j.request_id = p_request;
  if job is not null then
    if exists (select 1 from lizhi_private.lizhi_cad_cloud_jobs j where j.id = job
      and j.document_id = p_document and j.expected_revision = p_revision
      and j.call = p_call) then return job; end if;
    raise exception 'request_id reused with different job' using errcode = '23505';
  end if;
  select * into d from lizhi_private.lizhi_cad_cloud_documents
   where id = p_document and owner_uid = p_owner for update;
  if not found then raise exception 'document not found' using errcode = '42501'; end if;
  if d.revision <> p_revision then raise exception 'MODEL_REVISION_CONFLICT' using errcode = 'P0001'; end if;
  if (select count(*) from lizhi_private.lizhi_cad_cloud_jobs j
       where j.owner_uid = p_owner and j.created_at > statement_timestamp() - interval '60 seconds') >= 20
  then raise exception 'model rate limit' using errcode = 'P0001'; end if;
  insert into lizhi_private.lizhi_cad_cloud_jobs
    (owner_uid, request_id, document_id, expected_revision, call)
  values (p_owner, p_request, p_document, p_revision, p_call)
  returning id into job;
  return job;
end $$;

-- Site: job read-back.
create or replace function public.lizhi_cad_cloud_job(p_owner uuid, p_job uuid)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  perform lizhi_private.lizhi_cad_require_service_role();
  return (select jsonb_build_object('job_id', j.id, 'document_id', j.document_id,
      'state', case when j.state in ('queued','claimed') and j.expires_at <= now() then 'expired' else j.state end,
      'op', j.call->>'op', 'mutated', j.mutated, 'new_revision', j.new_revision,
      'error', left(j.error, 300), 'result', j.result)
    from lizhi_private.lizhi_cad_cloud_jobs j where j.owner_uid = p_owner and j.id = p_job);
end $$;

-- Worker: claim the oldest runnable job. One claimed job per document; a job
-- whose document moved past its revision is cancelled, never replayed.
create or replace function public.lizhi_cad_cloud_claim(p_worker text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare j record; d record;
begin
  perform lizhi_private.lizhi_cad_require_service_role();
  update lizhi_private.lizhi_cad_cloud_jobs set state = 'expired', completed_at = now()
   where state in ('queued','claimed') and expires_at <= now();
  -- a crashed worker's claim is released as failed (unknown) after 15 minutes
  update lizhi_private.lizhi_cad_cloud_jobs
     set state = 'failed', completed_at = now(), error = 'MODEL_WORKER_LOST_RESULT_UNKNOWN_DO_NOT_RETRY'
   where state = 'claimed' and claimed_at < now() - interval '15 minutes';
  for j in
    select q.* from lizhi_private.lizhi_cad_cloud_jobs q
     where q.state = 'queued'
       and not exists (select 1 from lizhi_private.lizhi_cad_cloud_jobs c
                        where c.document_id = q.document_id and c.state = 'claimed')
     order by q.seq
     for update skip locked
  loop
    select * into d from lizhi_private.lizhi_cad_cloud_documents where id = j.document_id for update;
    if d.revision <> j.expected_revision then
      update lizhi_private.lizhi_cad_cloud_jobs set state = 'cancelled', completed_at = now(),
        error = 'MODEL_STALE_DOCUMENT_REVISION' where id = j.id;
      continue;
    end if;
    update lizhi_private.lizhi_cad_cloud_jobs set state = 'claimed', claimed_at = now(),
      worker_run = left(p_worker, 120) where id = j.id;
    return jsonb_build_object('job_id', j.id, 'owner_uid', j.owner_uid, 'document_id', j.document_id,
      'revision', d.revision, 'current_path', d.current_path, 'metric', d.metric, 'call', j.call);
  end loop;
  return null;
end $$;

-- Worker: finish. A mutation must name the uploaded next-revision file.
create or replace function public.lizhi_cad_cloud_finish(
  p_job uuid, p_success boolean, p_mutated boolean, p_new_path text,
  p_result jsonb, p_error text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare j record; d record; next_rev integer;
begin
  perform lizhi_private.lizhi_cad_require_service_role();
  select * into j from lizhi_private.lizhi_cad_cloud_jobs where id = p_job and state = 'claimed' for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'MODEL_JOB_NOT_CLAIMED'); end if;
  select * into d from lizhi_private.lizhi_cad_cloud_documents where id = j.document_id for update;
  if d.revision <> j.expected_revision then
    update lizhi_private.lizhi_cad_cloud_jobs set state = 'failed', completed_at = now(),
      error = 'MODEL_REVISION_MOVED_DURING_JOB' where id = j.id;
    return jsonb_build_object('ok', false, 'code', 'MODEL_REVISION_MOVED_DURING_JOB');
  end if;
  if p_result is not null and octet_length(p_result::text) > 262144 then
    return jsonb_build_object('ok', false, 'code', 'MODEL_RESULT_TOO_LARGE'); end if;
  next_rev := d.revision + 1;
  if p_success and p_mutated then
    if p_new_path is null or p_new_path <> (j.owner_uid::text || '/docs/' || d.id::text || '/r' || next_rev || '.dxf') then
      return jsonb_build_object('ok', false, 'code', 'MODEL_NEW_REVISION_PATH_INVALID'); end if;
    update lizhi_private.lizhi_cad_cloud_documents
       set revision = next_rev, current_path = p_new_path, updated_at = now() where id = d.id;
  end if;
  update lizhi_private.lizhi_cad_cloud_jobs
     set state = case when p_success then 'succeeded' else 'failed' end,
         completed_at = now(), result = p_result,
         mutated = coalesce(p_success and p_mutated, false),
         new_revision = case when p_success and p_mutated then next_rev else d.revision end,
         error = case when p_success then null else left(coalesce(p_error, 'MODEL_ENGINE_FAILED'), 300) end
   where id = j.id;
  return jsonb_build_object('ok', true,
    'revision', case when p_success and p_mutated then next_rev else d.revision end);
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.lizhi_cad_cloud_list(uuid)',
    'public.lizhi_cad_cloud_new(uuid,text,boolean)',
    'public.lizhi_cad_cloud_enqueue(uuid,uuid,uuid,integer,jsonb)',
    'public.lizhi_cad_cloud_job(uuid,uuid)',
    'public.lizhi_cad_cloud_claim(text)',
    'public.lizhi_cad_cloud_finish(uuid,boolean,boolean,text,jsonb,text)']
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

commit;
