-- P4 candidate: never treat unlinked income as a refund.
-- Explicit income.refundOfTransactionId plus refundVerified=true, matched original owner,
-- original expense in selected month and same currency, capped to original amount.
-- The original transaction and its historical value are NEVER rewritten.
begin;
create or replace function public.lizhi_finance_budget_month_spending(p_month text)
returns jsonb language plpgsql stable security invoker set search_path='' as $body$
declare
  owner_id uuid := (select auth.uid());
  outcome jsonb;
  invalid_count bigint;
begin
  if owner_id is null then raise exception 'BUDGET_AUTH_REQUIRED' using errcode='42501'; end if;
  if p_month is null or p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then
    raise exception 'BUDGET_INVALID_MONTH' using errcode='22023';
  end if;

  with expense_rows as (
    select r.id as original_id,
      nullif(r.payload->>'categoryId','') as category_id,
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
    where r.user_id=owner_id and r.kind='transactions'
      and r.deleted_at is null
      and nullif(r.payload->>'deletedAt','') is null
      and r.payload->>'type' in ('expense','credit_card_purchase')
      and left(r.payload->>'date',7)=p_month
  ), local_expenses as (
    select * from expense_rows where currency='TWD'
  ), refund_candidates as (
    select e.original_id,e.amount as original_amount,
      case when r.payload->>'amount' ~ '^[0-9]{1,16}$'
        then (r.payload->>'amount')::numeric else null end as refund_amount,
      coalesce(nullif(r.payload->>'currency',''),nullif(a.payload->>'currency',''),'TWD') as currency
    from public.lizhi_finance_records r
    join local_expenses e on e.original_id=r.payload->>'refundOfTransactionId'
    left join public.lizhi_finance_records a
      on a.user_id=r.user_id and a.kind='accounts'
      and a.id=r.payload->>'accountId' and a.deleted_at is null
    where r.user_id=owner_id and r.kind='transactions'
      and r.deleted_at is null and nullif(r.payload->>'deletedAt','') is null
      and r.payload->>'type'='income' and r.payload->>'refundVerified'='true'
  ), valid_refunds as (
    select original_id,original_amount,refund_amount
    from refund_candidates
    where currency='TWD' and refund_amount between 1 and 9007199254740991
  ), grouped_refunds as (
    select original_id,sum(refund_amount) as refunded,count(*) as refund_count
    from valid_refunds
    group by original_id
    having sum(refund_amount)<=max(original_amount)
  ), net_expenses as (
    select e.category_id,e.original_id,
      e.amount-coalesce(r.refunded,0) as amount
    from local_expenses e
    left join grouped_refunds r on r.original_id=e.original_id
  ), category_sums as (
    select category_id,sum(amount) as used from net_expenses
    where amount is not null group by category_id
  )
  select jsonb_build_object(
    'month',p_month,'currency','TWD',
    'used',coalesce((select sum(amount) from net_expenses),0),
    'by_category',coalesce((select jsonb_agg(jsonb_build_object(
      'category_id',category_id,'used',used) order by category_id)
      from category_sums),'[]'::jsonb),
    'counted_transactions',(select count(*) from local_expenses),
    'counted_linked_refunds',coalesce((select sum(refund_count) from grouped_refunds),0),
    'excluded_foreign_currency',(select count(*) from expense_rows where currency<>'TWD')
  ),(select count(*) from local_expenses
    where amount is null or amount<=0 or amount>9007199254740991)
  into outcome,invalid_count;
  if invalid_count>0 or (outcome->>'used')::numeric<0
     or (outcome->>'used')::numeric>9007199254740991 then
    raise exception 'BUDGET_INVALID_SPENDING_DATA' using errcode='22003';
  end if;
  return outcome;

end;
$body$;
revoke all on function public.lizhi_finance_budget_month_spending(text)
  from public,anon,authenticated;
grant execute on function public.lizhi_finance_budget_month_spending(text)
  to authenticated;

create or replace function public.lizhi_finance_budget_site_spending(p_owner uuid,p_month text)
returns jsonb language plpgsql stable security invoker set search_path='' as $body$
declare
  outcome jsonb;
  invalid_count bigint;
begin
  if p_owner is null then raise exception 'BUDGET_OWNER_REQUIRED' using errcode='42501'; end if;
  if p_month is null or p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then
    raise exception 'BUDGET_INVALID_MONTH' using errcode='22023';
  end if;

  with expense_rows as (
    select r.id as original_id,
      nullif(r.payload->>'categoryId','') as category_id,
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
  ), local_expenses as (
    select * from expense_rows where currency='TWD'
  ), refund_candidates as (
    select e.original_id,e.amount as original_amount,
      case when r.payload->>'amount' ~ '^[0-9]{1,16}$'
        then (r.payload->>'amount')::numeric else null end as refund_amount,
      coalesce(nullif(r.payload->>'currency',''),nullif(a.payload->>'currency',''),'TWD') as currency
    from public.lizhi_finance_records r
    join local_expenses e on e.original_id=r.payload->>'refundOfTransactionId'
    left join public.lizhi_finance_records a
      on a.user_id=r.user_id and a.kind='accounts'
      and a.id=r.payload->>'accountId' and a.deleted_at is null
    where r.user_id=p_owner and r.kind='transactions'
      and r.deleted_at is null and nullif(r.payload->>'deletedAt','') is null
      and r.payload->>'type'='income' and r.payload->>'refundVerified'='true'
  ), valid_refunds as (
    select original_id,original_amount,refund_amount
    from refund_candidates
    where currency='TWD' and refund_amount between 1 and 9007199254740991
  ), grouped_refunds as (
    select original_id,sum(refund_amount) as refunded,count(*) as refund_count
    from valid_refunds
    group by original_id
    having sum(refund_amount)<=max(original_amount)
  ), net_expenses as (
    select e.category_id,e.original_id,
      e.amount-coalesce(r.refunded,0) as amount
    from local_expenses e
    left join grouped_refunds r on r.original_id=e.original_id
  ), category_sums as (
    select category_id,sum(amount) as used from net_expenses
    where amount is not null group by category_id
  )
  select jsonb_build_object(
    'month',p_month,'currency','TWD',
    'used',coalesce((select sum(amount) from net_expenses),0),
    'by_category',coalesce((select jsonb_agg(jsonb_build_object(
      'category_id',category_id,'used',used) order by category_id)
      from category_sums),'[]'::jsonb),
    'counted_transactions',(select count(*) from local_expenses),
    'counted_linked_refunds',coalesce((select sum(refund_count) from grouped_refunds),0),
    'excluded_foreign_currency',(select count(*) from expense_rows where currency<>'TWD')
  ),(select count(*) from local_expenses
    where amount is null or amount<=0 or amount>9007199254740991)
  into outcome,invalid_count;
  if invalid_count>0 or (outcome->>'used')::numeric<0
     or (outcome->>'used')::numeric>9007199254740991 then
    raise exception 'BUDGET_INVALID_SPENDING_DATA' using errcode='22003';
  end if;
  return outcome;

end;
$body$;
revoke all on function public.lizhi_finance_budget_site_spending(uuid,text)
  from public,anon,authenticated;
grant execute on function public.lizhi_finance_budget_site_spending(uuid,text)
  to service_role;

commit;
