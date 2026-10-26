-- Cloud-direct 3D design documents; independent of browser sessions/leases.
-- Migration is a CANDIDATE until isolated PG16 owner/idempotency tests pass.
-- A scene JSON document is NOT a native .hew file or exported GLB.
create table if not exists lizhi_model_private.cloud_documents(
 id uuid primary key default gen_random_uuid(),
 owner_uid uuid not null,
 name text not null,
 revision bigint not null default 1 check (revision>=1),
 entities jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default statement_timestamp(),
 updated_at timestamptz not null default statement_timestamp(),
 constraint lizhi_model_cloud_doc_owner unique(owner_uid,id)
);
create table if not exists lizhi_model_private.cloud_requests(
 owner_uid uuid not null,
 request_id uuid not null,
 operation text not null,
 document_id uuid,
 expected_revision bigint,
 payload jsonb not null,
 response jsonb,
 created_at timestamptz not null default statement_timestamp(),
 primary key(owner_uid,request_id)
);
create index if not exists lizhi_model_cloud_documents_owner on
 lizhi_model_private.cloud_documents(owner_uid,updated_at desc);
alter table lizhi_model_private.cloud_documents enable row level security;
alter table lizhi_model_private.cloud_requests enable row level security;
revoke all on lizhi_model_private.cloud_documents from public,anon,authenticated;
revoke all on lizhi_model_private.cloud_requests from public,anon,authenticated;

create or replace function public.lizhi_model_cloud_list(p_owner uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(
  jsonb_build_object('document_id',id,'name',name,
    'revision',revision,'updated_at',updated_at)
  order by updated_at desc),'[]'::jsonb)
 from (select id,name,revision,updated_at from lizhi_model_private.cloud_documents
 where owner_uid=p_owner order by updated_at desc limit 100) docs
 where (auth.jwt()->>'role')='service_role' and p_owner is not null;
$$;
create or replace function public.lizhi_model_cloud_get(p_owner uuid,p_document uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('format','lizhi-model-cloud-v1',
  'document_id',id,'name',name,'revision',revision,
  'entities',entities,'native_hew_saved',false,'updated_at',updated_at)
 from lizhi_model_private.cloud_documents
 where owner_uid=p_owner and id=p_document
  and (auth.jwt()->>'role')='service_role';
$$;

create or replace function public.lizhi_model_cloud_write(
 p_owner uuid,p_request uuid,p_op text,p_document uuid,
 p_revision bigint,p_args jsonb)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare
 marker uuid;
 previous record;
 entry record;
 new_id uuid;
 object_id text;
 target text;
 result jsonb;
 next_entities jsonb;
 changed_count int;
 coordinate jsonb;
 dimensions jsonb;
 x numeric;
begin
 if (auth.jwt()->>'role') is distinct from 'service_role'
   or p_owner is null or p_request is null or
   p_op not in ('new_document','create_box','move') or p_args is null or
   jsonb_typeof(p_args)<>'object' or octet_length(p_args::text)>8192
 then raise exception 'MODEL_OWNER_OR_ARGUMENTS_REQUIRED' using errcode='42501'; end if;
 if p_op='new_document' then
  if p_document is not null or p_revision is not null or
     (select count(*) from jsonb_object_keys(p_args))<>1 or
     jsonb_typeof(p_args->'name')<>'string' or
     length(coalesce(p_args->>'name','')) not between 1 and 80 or
     (p_args->>'name') ~ '[[:cntrl:]]'
  then raise exception 'MODEL_INVALID_NEW_DOCUMENT' using errcode='22023';end if;
 else
  if p_document is null or p_revision is null or p_revision<1
  then raise exception 'MODEL_DOCUMENT_REVISION_REQUIRED' using errcode='22023';end if;
 end if;
 if p_op='create_box' then
   if (select count(*) from jsonb_object_keys(p_args)) not in (4,5)
     or not(p_args ? 'origin_mm' and p_args ? 'width_mm' and
       p_args ? 'depth_mm' and p_args ? 'height_mm')
     or (jsonb_object_length(p_args)=5 and not(p_args ? 'name'))
     or not lizhi_model_private.vec3(p_args->'origin_mm',100000)
     or jsonb_typeof(p_args->'width_mm')<>'number'
     or jsonb_typeof(p_args->'depth_mm')<>'number'
     or jsonb_typeof(p_args->'height_mm')<>'number'
     or (p_args->>'width_mm')::numeric not between 0.1 and 20000
     or (p_args->>'depth_mm')::numeric not between 0.1 and 20000
     or (p_args->>'height_mm')::numeric not between 0.1 and 20000
     or (p_args ? 'name' and (jsonb_typeof(p_args->'name')<>'string'
       or length(p_args->>'name') not between 1 and 80
       or (p_args->>'name') ~ '[[:cntrl:]]'))
   then raise exception 'MODEL_INVALID_BOX' using errcode='22023';end if;
 end if;
 if p_op='move' then
   if (select count(*) from jsonb_object_keys(p_args))<>2 or
    not (p_args ? 'entity_id' and p_args ? 'translation_mm') or
    jsonb_typeof(p_args->'entity_id')<>'string' or
    (p_args->>'entity_id') !~ '^obj_[0-9a-f]{32}$' or
    not lizhi_model_private.vec3(p_args->'translation_mm',100000) or
    p_args->'translation_mm'='[0,0,0]'::jsonb
   then raise exception 'MODEL_INVALID_MOVE' using errcode='22023';end if;
 end if;

 -- Atomic idempotency BEFORE any document mutation. The unique key locks
 -- concurrent duplicate requests, and an existing result is always reused.
 insert into lizhi_model_private.cloud_requests as r
   (owner_uid,request_id,operation,document_id,expected_revision,payload)
 values(p_owner,p_request,p_op,p_document,p_revision,p_args)
 on conflict (owner_uid,request_id) do nothing returning request_id into marker;
 if marker is null then
  select * into previous from lizhi_model_private.cloud_requests r
  where r.owner_uid=p_owner and r.request_id=p_request for update;
  if not found or previous.operation<>p_op or
     previous.document_id is distinct from p_document or
     previous.expected_revision is distinct from p_revision or
     previous.payload is distinct from p_args or previous.response is null
  then raise exception 'MODEL_REQUEST_ID_CONFLICT' using errcode='23505'; end if;
  return previous.response;
 end if;

 if p_op='new_document' then
  insert into lizhi_model_private.cloud_documents(owner_uid,name)
   values(p_owner,trim(p_args->>'name')) returning id into new_id;
  result=jsonb_build_object('ok',true,'document_id',new_id,
   'revision',1,'native_hew_saved',false);
 else
  select * into entry from lizhi_model_private.cloud_documents
   where owner_uid=p_owner and id=p_document for update;
  if not found then raise exception 'MODEL_DOCUMENT_NOT_FOUND' using errcode='P0002';end if;
  if entry.revision<>p_revision then raise exception 'MODEL_REVISION_CONFLICT' using errcode='40001';end if;
  if p_op='create_box' then
   if jsonb_array_length(entry.entities)>=1000
    then raise exception 'MODEL_ENTITY_LIMIT' using errcode='22023';end if;
   object_id='obj_'||replace(gen_random_uuid()::text,'-','');
   coordinate=p_args->'origin_mm';
   dimensions=jsonb_build_array((p_args->>'width_mm')::numeric,
      (p_args->>'depth_mm')::numeric,(p_args->>'height_mm')::numeric);
   next_entities=entry.entities || jsonb_build_array(jsonb_build_object(
    'id',object_id,'kind','box',
    'name',coalesce(p_args->>'name','Box'),
    'origin_mm',coordinate,'size_mm',dimensions));
  else
   target=p_args->>'entity_id';
   select count(*) into changed_count from jsonb_array_elements(entry.entities) e
    where e->>'id'=target;
   if changed_count<>1 then raise exception 'MODEL_ENTITY_NOT_FOUND' using errcode='P0002';end if;
   select jsonb_agg(
      case when e->>'id'=target then
        jsonb_set(e,'{origin_mm}',jsonb_build_array(
          (e->'origin_mm'->>0)::numeric+(p_args->'translation_mm'->>0)::numeric,
          (e->'origin_mm'->>1)::numeric+(p_args->'translation_mm'->>1)::numeric,
          (e->'origin_mm'->>2)::numeric+(p_args->'translation_mm'->>2)::numeric))
      else e end order by ord)
   into next_entities from jsonb_array_elements(entry.entities) with ordinality as q(e,ord);
   coordinate=(select e->'origin_mm' from jsonb_array_elements(next_entities) e
     where e->>'id'=target);
   if not lizhi_model_private.vec3(coordinate,100000)
   then raise exception 'MODEL_TRANSLATION_OUT_OF_BOUNDS' using errcode='22023'; end if;
   object_id=target;
  end if;
  update lizhi_model_private.cloud_documents
   set entities=next_entities,revision=revision+1,updated_at=statement_timestamp()
   where owner_uid=p_owner and id=p_document;
  result=jsonb_build_object('ok',true,'document_id',p_document,
    'revision',entry.revision+1,'entity_id',object_id,'native_hew_saved',false);
 end if;
 update lizhi_model_private.cloud_requests
  set response=result where owner_uid=p_owner and request_id=p_request;
 return result;
end $$;

revoke all on function public.lizhi_model_cloud_list(uuid) from public,anon,authenticated;
revoke all on function public.lizhi_model_cloud_get(uuid,uuid) from public,anon,authenticated;
revoke all on function public.lizhi_model_cloud_write(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.lizhi_model_cloud_list(uuid) to service_role;
grant execute on function public.lizhi_model_cloud_get(uuid,uuid) to service_role;
grant execute on function public.lizhi_model_cloud_write(uuid,uuid,text,uuid,bigint,jsonb) to service_role;
