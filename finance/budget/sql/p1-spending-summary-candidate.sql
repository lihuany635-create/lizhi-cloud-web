-- P1 candidate: low-egress owner-scoped monthly spending summary.
-- Requires the existing lizhi_finance_records table and signed-in owner JWT.
-- May be added to a reviewed migration later; NOT applied to production.
create or replace function public.lizhi_finance_budget_month_spending(p_month text)
returns jsonb
language plpgsql stable security invoker
set search_path = '' as $$
declare
  owner_id uuid := (select auth.uid());
  outcome jsonb;
  invalid_count bigint;
begin
  if owner_id is null then
    raise exception 'BUDGET_AUTH_REQUIRED' using errcode='42501';
  end if;
  if p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then
    raise exception 'BUDGET_INVALID_MONTH' using errcode='22023';
  end if;
  with month_entries as (
    select
      nullif(r.payload->>'categoryId','') as category_id,
      case when (r.payload->>'amount') ~ '^[0-9]{1,16}$'
        then (r.payload->>'amount')::numeric else null end as amount,
      coalesce(nullif(r.payload->>'currency',''),
        case when r.payload->>'type'='expense'
          then nullif(a.payload->>'currency','')
          else nullif(c.payload->>'currency','') end,
        'TWD') as entry_currency
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
  ),
  valid_entries as (
    select * from month_entries where entry_currency='TWD'
  ),
  category_totals as (
    select category_id,sum(amount) as spent
    from valid_entries where amount is not null group by category_id
  )
  select jsonb_build_object(
    'month',p_month,'currency','TWD',
    'used',coalesce((select sum(amount) from valid_entries),0),
    'by_category',coalesce(
      (select jsonb_agg(jsonb_build_object('category_id',category_id,'used',spent)
              order by spent desc) from category_totals),'[]'::jsonb),
    'excluded_foreign_currency',(select count(*) from month_entries where entry_currency<>'TWD'),
    'counted_transactions',(select count(*) from valid_entries),
    'read_at',now()
  ),
  (select count(*) from valid_entries where amount is null or amount<=0 or amount>9007199254740991)
  into outcome,invalid_count;

  if invalid_count>0 or (outcome->>'used')::numeric>9007199254740991 then
    raise exception 'BUDGET_INVALID_SPENDING_DATA' using errcode='22003';
  end if;
  return outcome;
end;
$$;
revoke all on function public.lizhi_finance_budget_month_spending(text)
  from public, anon;
grant execute on function public.lizhi_finance_budget_month_spending(text)
  to authenticated;
