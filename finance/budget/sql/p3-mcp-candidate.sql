-- P3 CANDIDATE ONLY. No automatic production deployment.
-- Existing finance project, owner-only ChatGPT Site -> service-role Edge.
-- Explicitly deny direct client execution and do not touch transaction rows.
begin;
do $$
begin
  if to_regclass('public.lizhi_finance_budgets') is null
     or to_regclass('public.lizhi_finance_records') is null then
    raise exception 'BUDGET_P3_DEPENDENCY_MISSING';
  end if;
end;
$$;

create table if not exists public.lizhi_finance_budget_requests (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  receipt jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists lizhi_finance_budget_requests_owner
  on public.lizhi_finance_budget_requests (user_id, created_at desc);
alter table public.lizhi_finance_budget_requests enable row level security;
revoke all on public.lizhi_finance_budget_requests from public, anon, authenticated;
grant select,insert on public.lizhi_finance_budget_requests to service_role;
grant select,insert,update on public.lizhi_finance_budgets to service_role;

-- Return only aggregates; never download the entire ledger to the MCP Site.
-- Callers cannot choose arbitrary owners: only the fixed service-role Edge can execute.
create or replace function public.lizhi_finance_budget_site_spending(
  p_owner uuid, p_month text)
returns jsonb language plpgsql stable security invoker
set search_path='' as $fn$
declare
  result jsonb;
  invalid_rows bigint;
begin
  if p_owner is null then
    raise exception 'BUDGET_OWNER_REQUIRED' using errcode='42501';
  end if;
  if p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then
    raise exception 'BUDGET_INVALID_MONTH' using errcode='22023';
  end if;
  with expenses as (
    select nullif(r.payload->>'categoryId','') as category_id,
      case when r.payload->>'amount' ~ '^[0-9]{1,16}$'
        then (r.payload->>'amount')::numeric else null end as amount,
      coalesce(nullif(r.payload->>'currency',''),
        case when r.payload->>'type'='expense'
          then nullif(a.payload->>'currency','')
          else nullif(c.payload->>'currency','') end,'TWD') as currency
    from public.lizhi_finance_records r
    left join public.lizhi_finance_records a
      on a.user_id=r.user_id and a.kind='accounts'
      and a.id=r.payload->>'accountId' and a.deleted_at is null
    left join public.lizhi_finance_records c
      on c.user_id=r.user_id and c.kind='creditCards'
      and c.id=r.payload->>'creditCardId' and c.deleted_at is null
    where r.user_id=p_owner and r.kind='transactions'
      and r.deleted_at is null
      and nullif(r.payload->>'deletedAt','') is null
      and r.payload->>'type' in ('expense','credit_card_purchase')
      and left(r.payload->>'date',7)=p_month
  ), local_currency as (
    select * from expenses where currency='TWD'
  ), category_sums as (
    select category_id,sum(amount) as used
      from local_currency where amount is not null group by category_id
  )
  select jsonb_build_object(
    'month',p_month,'currency','TWD',
    'used',coalesce((select sum(amount) from local_currency),0),
    'by_category',coalesce((select jsonb_agg(jsonb_build_object(
      'category_id',category_id,'used',used) order by category_id)
      from category_sums),'[]'::jsonb),
    'counted_transactions',(select count(*) from local_currency),
    'excluded_foreign_currency',(select count(*) from expenses where currency<>'TWD')
  ), (select count(*) from local_currency
      where amount is null or amount<=0 or amount>9007199254740991)
  into result,invalid_rows;

  if invalid_rows>0 or (result->>'used')::numeric>9007199254740991 then
    raise exception 'BUDGET_INVALID_SPENDING_DATA' using errcode='22003';
  end if;
  return result;
end;
$fn$;

revoke all on function public.lizhi_finance_budget_site_spending(uuid,text)
  from public, anon, authenticated;
grant execute on function public.lizhi_finance_budget_site_spending(uuid,text)
  to service_role;

-- Atomic version CAS and durable request-id receipt, all in one transaction.
-- Owner UID is a server Secret, not exposed by the MCP tool schema.
create or replace function public.lizhi_finance_budget_site_set(
  p_owner uuid, p_request_id uuid, p_month text,
  p_category_id text, p_currency text, p_amount bigint,
  p_delete boolean, p_expected_version bigint)
returns jsonb language plpgsql volatile security invoker
set search_path='' as $fn$
declare
  payload_hash text;
  previous public.lizhi_finance_budget_requests%rowtype;
  current_budget public.lizhi_finance_budgets%rowtype;
  saved public.lizhi_finance_budgets%rowtype;
  receipt jsonb;
  action_label text;
begin
  if p_owner is null or p_request_id is null then
    raise exception 'BUDGET_OWNER_REQUIRED' using errcode='42501';
  end if;
  if p_month is null or p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'
    or p_currency is distinct from 'TWD'
    or (p_category_id is not null and
      (length(p_category_id)<1 or length(p_category_id)>160))
    or p_expected_version is null or p_expected_version<0
    or p_expected_version>9007199254740991
    or p_delete is null
    or (p_delete and p_amount is not null)
    or (not p_delete and
      (p_amount is null or p_amount<0 or p_amount>9007199254740991)) then
    raise exception 'BUDGET_VALIDATION_ERROR' using errcode='22023';
  end if;
  payload_hash := encode(sha256(convert_to(jsonb_build_object(
    'owner',p_owner,'month',p_month,'category',p_category_id,
    'currency',p_currency,'amount',p_amount,'delete',p_delete,
    'version',p_expected_version)::text,'UTF8')),'hex');

  -- Lock only this owner/request pair; a retry cannot cause another write.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_owner::text||':'||p_request_id::text,0));
  select * into previous from public.lizhi_finance_budget_requests
    where request_id=p_request_id;
  if found then
    if previous.user_id<>p_owner or previous.request_hash<>payload_hash then
      raise exception 'BUDGET_DUPLICATE_REQUEST' using errcode='23505';
    end if;
    return previous.receipt;
  end if;

  select * into current_budget from public.lizhi_finance_budgets
    where user_id=p_owner and month=p_month and currency=p_currency
      and category_id is not distinct from p_category_id
    for update;

  if p_delete then
    if not found or current_budget.deleted_at is not null
       or current_budget.version<>p_expected_version then
      raise exception 'BUDGET_VERSION_CONFLICT' using errcode='23514';
    end if;
    update public.lizhi_finance_budgets
      set deleted_at=pg_catalog.clock_timestamp(),version=version+1
      where id=current_budget.id and user_id=p_owner
        and version=p_expected_version returning * into saved;
    action_label:='deleted';
  elsif found then
    if current_budget.version<>p_expected_version then
      raise exception 'BUDGET_VERSION_CONFLICT' using errcode='23514';
    end if;
    update public.lizhi_finance_budgets
      set amount=p_amount,deleted_at=null,version=version+1
      where id=current_budget.id and user_id=p_owner
        and version=p_expected_version returning * into saved;
    action_label:='updated';
  else
    if p_expected_version<>0 then
      raise exception 'BUDGET_VERSION_CONFLICT' using errcode='23514';
    end if;
    insert into public.lizhi_finance_budgets(
      user_id,month,category_id,currency,amount)
      values(p_owner,p_month,p_category_id,p_currency,p_amount)
      returning * into saved;
    action_label:='created';
  end if;
  if saved.id is null then
    raise exception 'BUDGET_VERSION_CONFLICT' using errcode='23514';
  end if;
  receipt:=jsonb_build_object(
    'status',action_label,'request_id',p_request_id,
    'budget',jsonb_build_object(
      'id',saved.id,'month',saved.month,'category_id',saved.category_id,
      'currency',saved.currency,'amount',saved.amount,
      'version',saved.version,'deleted_at',saved.deleted_at,
      'updated_at',saved.updated_at
    )
  );
  insert into public.lizhi_finance_budget_requests(
    request_id,user_id,request_hash,receipt)
  values(p_request_id,p_owner,payload_hash,receipt);
  return receipt;
end;
$fn$;

revoke all on function public.lizhi_finance_budget_site_set(
  uuid,uuid,text,text,text,bigint,boolean,bigint)
  from public, anon, authenticated;
grant execute on function public.lizhi_finance_budget_site_set(
  uuid,uuid,text,text,text,bigint,boolean,bigint)
  to service_role;
commit;
