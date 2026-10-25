-- Cloud-first, owner-only Finance transaction creation.
-- Existing Finance records, local IndexedDB schema and original finance sync remain intact.
-- No caller-supplied owner, record ID, timestamps, raw SQL or arbitrary mutation.
create schema if not exists lizhi_private;
revoke all on schema lizhi_private from public, anon, authenticated;
create table if not exists lizhi_private.lizhi_finance_cloud_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  intent jsonb not null,
  record_id text not null,
  created_at timestamptz not null default now(),
  primary key(user_id,request_id)
);
alter table lizhi_private.lizhi_finance_cloud_requests enable row level security;
revoke all on lizhi_private.lizhi_finance_cloud_requests from public,anon,authenticated;
create index if not exists lizhi_finance_cloud_requests_owner_created
  on lizhi_private.lizhi_finance_cloud_requests(user_id,created_at desc);

create or replace function public.lizhi_finance_cloud_create_transaction(
  p_owner uuid,p_request_id uuid,p_data jsonb)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare
  owner_role text:=coalesce(auth.jwt()->>'role','');
  entity_type text; account_id text; from_id text; to_id text; card_id text; category_id text;
  amount_text text; amount_value bigint; date_text text; note_text text;
  saved record; previous record; entry_id text; stamp timestamptz; stamp_text text;
  payload jsonb; statement_ok boolean; outstanding numeric;
begin
  if owner_role <> 'service_role' or p_owner is null or p_request_id is null then
    raise exception 'FINANCE_CLOUD_FORBIDDEN' using errcode='42501';
  end if;
  if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>2048 then
    raise exception 'FINANCE_CLOUD_INVALID_PAYLOAD' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_object_keys(p_data) as k
    where k not in ('type','amount','date','accountId','fromAccountId','toAccountId','creditCardId','categoryId','note')) then
    raise exception 'FINANCE_CLOUD_UNKNOWN_FIELD' using errcode='22023';
  end if;
  entity_type:=p_data->>'type';
  if entity_type not in ('income','expense','transfer','credit_card_purchase','credit_card_payment') or entity_type is null then
    raise exception 'FINANCE_CLOUD_INVALID_TYPE' using errcode='22023';
  end if;
  if jsonb_typeof(p_data->'amount')<>'number' then
    raise exception 'FINANCE_CLOUD_INVALID_AMOUNT' using errcode='22023';
  end if;
  amount_text:=p_data->>'amount';
  if amount_text !~ '^[1-9][0-9]{0,14}$' then
    raise exception 'FINANCE_CLOUD_INVALID_AMOUNT' using errcode='22023';
  end if;
  amount_value:=amount_text::bigint;
  if amount_value>9007199254740991 then
    raise exception 'FINANCE_CLOUD_INVALID_AMOUNT' using errcode='22023';
  end if;
  date_text:=p_data->>'date';
  if date_text is null or date_text !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'FINANCE_CLOUD_INVALID_DATE' using errcode='22023';
  end if;
  begin
    if to_char(to_date(date_text,'YYYY-MM-DD'),'YYYY-MM-DD')<>date_text then
      raise exception 'FINANCE_CLOUD_INVALID_DATE' using errcode='22023';
    end if;
  exception when others then
    raise exception 'FINANCE_CLOUD_INVALID_DATE' using errcode='22023';
  end;
  if p_data ? 'note' and jsonb_typeof(p_data->'note')<>'string' then
    raise exception 'FINANCE_CLOUD_INVALID_NOTE' using errcode='22023';
  end if;
  note_text:=coalesce(p_data->>'note','');
  if char_length(note_text)>240 then raise exception 'FINANCE_CLOUD_INVALID_NOTE' using errcode='22023'; end if;
  account_id:=nullif(p_data->>'accountId','');
  from_id:=nullif(p_data->>'fromAccountId','');
  to_id:=nullif(p_data->>'toAccountId','');
  card_id:=nullif(p_data->>'creditCardId','');
  category_id:=nullif(p_data->>'categoryId','');
  if exists(select 1 from jsonb_each(p_data) as e where e.key in
    ('accountId','fromAccountId','toAccountId','creditCardId','categoryId')
    and (jsonb_typeof(e.value)<>'string' or length(e.value #>> '{}')>160)) then
    raise exception 'FINANCE_CLOUD_INVALID_REFERENCE' using errcode='22023';
  end if;
  if (entity_type in ('income','expense') and (account_id is null or category_id is null
        or from_id is not null or to_id is not null or card_id is not null))
    or (entity_type='transfer' and (from_id is null or to_id is null or from_id=to_id
        or account_id is not null or card_id is not null or category_id is not null))
    or (entity_type='credit_card_purchase' and (card_id is null or category_id is null
        or account_id is not null or from_id is not null or to_id is not null))
    or (entity_type='credit_card_payment' and (card_id is null or coalesce(from_id,account_id) is null
        or (from_id is not null and account_id is not null)
        or to_id is not null or category_id is not null)) then
    raise exception 'FINANCE_CLOUD_REFERENCE_FIELDS' using errcode='22023';
  end if;
  -- Lock requests per owner before checking idempotency and financial references.
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text,89712));
  select r.intent,r.record_id into previous
    from lizhi_private.lizhi_finance_cloud_requests r
    where r.user_id=p_owner and r.request_id=p_request_id;
  if found then
    if previous.intent<>p_data then raise exception 'FINANCE_CLOUD_REQUEST_ID_CONFLICT' using errcode='23505'; end if;
    return jsonb_build_object('status','already_created','id',previous.record_id,'idempotent',true);
  end if;

  -- Verify all referenced entities belong to owner, exist and are not archived/deleted.
  if account_id is not null and not exists(
    select 1 from public.lizhi_finance_records r
    where r.user_id=p_owner and r.kind='accounts' and r.id=account_id
      and r.deleted_at is null and coalesce(r.payload->>'archived','false')<>'true') then
    raise exception 'FINANCE_CLOUD_ACCOUNT_NOT_FOUND' using errcode='22023'; end if;
  if from_id is not null and not exists(
    select 1 from public.lizhi_finance_records r
    where r.user_id=p_owner and r.kind='accounts' and r.id=from_id
      and r.deleted_at is null and coalesce(r.payload->>'archived','false')<>'true') then
    raise exception 'FINANCE_CLOUD_FROM_ACCOUNT_NOT_FOUND' using errcode='22023'; end if;
  if to_id is not null and not exists(
    select 1 from public.lizhi_finance_records r
    where r.user_id=p_owner and r.kind='accounts' and r.id=to_id
      and r.deleted_at is null and coalesce(r.payload->>'archived','false')<>'true') then
    raise exception 'FINANCE_CLOUD_TO_ACCOUNT_NOT_FOUND' using errcode='22023'; end if;
  if card_id is not null and not exists(
    select 1 from public.lizhi_finance_records r
    where r.user_id=p_owner and r.kind='creditCards' and r.id=card_id
      and r.deleted_at is null and coalesce(r.payload->>'archived','false')<>'true') then
    raise exception 'FINANCE_CLOUD_CARD_NOT_FOUND' using errcode='22023'; end if;
  if category_id is not null and not exists(
    select 1 from public.lizhi_finance_records r
    where r.user_id=p_owner and r.kind='categories' and r.id=category_id
      and r.deleted_at is null and coalesce(r.payload->>'archived','false')<>'true'
      and r.payload->>'type'=case when entity_type='income' then 'income' else 'expense' end) then
    raise exception 'FINANCE_CLOUD_CATEGORY_NOT_FOUND' using errcode='22023'; end if;
  -- Existing Finance credit card rules: payment is not a new expense and
  -- never silently permits an overpayment.
  if entity_type='credit_card_payment' then
    select coalesce(sum(case
      when r.payload->>'type'='credit_card_purchase' then (r.payload->>'amount')::numeric
      when r.payload->>'type'='credit_card_payment' then -(r.payload->>'amount')::numeric
      else 0 end),0)
    into outstanding from public.lizhi_finance_records r
    where r.user_id=p_owner and r.kind='transactions' and r.deleted_at is null
      and r.payload->>'creditCardId'=card_id;
    if outstanding<amount_value then
      raise exception 'FINANCE_CLOUD_CARD_OVERPAYMENT' using errcode='22023';
    end if;
  end if;
  stamp:=clock_timestamp();
  stamp_text:=to_char(stamp at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  entry_id:='cloud-'||gen_random_uuid()::text;
  payload:=jsonb_build_object('id',entry_id,'type',entity_type,'amount',amount_value,
    'date',date_text,'createdAt',stamp_text,'updatedAt',stamp_text,'note',note_text);
  if account_id is not null then payload:=payload||jsonb_build_object('accountId',account_id); end if;
  if from_id is not null then payload:=payload||jsonb_build_object('fromAccountId',from_id); end if;
  if to_id is not null then payload:=payload||jsonb_build_object('toAccountId',to_id); end if;
  if card_id is not null then payload:=payload||jsonb_build_object('creditCardId',card_id); end if;
  if category_id is not null then payload:=payload||jsonb_build_object('categoryId',category_id); end if;
  insert into public.lizhi_finance_records(user_id,kind,id,payload,created_at,updated_at,deleted_at)
    values(p_owner,'transactions',entry_id,payload,stamp,stamp,null);
  insert into lizhi_private.lizhi_finance_cloud_requests(user_id,request_id,intent,record_id)
    values(p_owner,p_request_id,p_data,entry_id);
  return jsonb_build_object('status','created','id',entry_id,'type',entity_type,
    'amount',amount_value,'date',date_text,'idempotent',false,
    'source','supabase_cloud_ledger');
end; $$;

revoke all on function public.lizhi_finance_cloud_create_transaction(uuid,uuid,jsonb)
  from public, anon, authenticated;
grant execute on function public.lizhi_finance_cloud_create_transaction(uuid,uuid,jsonb)
  to service_role;
