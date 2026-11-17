-- P1 candidate only. Do not apply to the production Supabase project without owner approval.
-- Separate owner-scoped budget settings. Never change finance transaction records.
begin;

create table if not exists public.lizhi_finance_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null check (month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  category_id text,
  currency text not null default 'TWD' check (currency='TWD'),
  amount bigint not null check (amount between 0 and 9007199254740991),
  version bigint not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (category_id is null or (length(category_id) between 1 and 160))
);

-- PostgreSQL UNIQUE on a nullable category alone would allow multiple total budgets.
create unique index if not exists lizhi_finance_budget_total_unique
  on public.lizhi_finance_budgets (user_id, month, currency)
  where category_id is null;
create unique index if not exists lizhi_finance_budget_category_unique
  on public.lizhi_finance_budgets (user_id, month, currency, category_id)
  where category_id is not null;
create index if not exists lizhi_finance_budgets_month_read
  on public.lizhi_finance_budgets (user_id, month, currency, deleted_at);

-- CAS version is incremented exactly once by the authenticated updater.
-- Scope changes use a new budget record, not a mutation of identity.
create or replace function public.lizhi_finance_budget_validate_change()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if new.id <> old.id or new.user_id <> old.user_id
       or new.month <> old.month or new.currency <> old.currency
       or new.category_id is distinct from old.category_id
       or new.created_at <> old.created_at then
      raise exception 'BUDGET_SCOPE_IMMUTABLE' using errcode='23514';
    end if;
    if new.version <> old.version+1 then
      raise exception 'BUDGET_VERSION_CONFLICT' using errcode='23514';
    end if;
    new.updated_at:=clock_timestamp();
  else
    if new.version <> 1 or new.deleted_at is not null then
      raise exception 'BUDGET_INVALID_INITIAL_VERSION' using errcode='23514';
    end if;
    new.created_at:=clock_timestamp();
    new.updated_at:=new.created_at;
  end if;

  -- Only expense categories may receive a budget; archived/deleted categories
  -- remain usable for existing historical rows, but not new budget rows.
  if new.category_id is not null
     and (tg_op='INSERT' or new.category_id is distinct from old.category_id) then
    if not exists (
      select 1 from public.lizhi_finance_records r
      where r.user_id=new.user_id and r.kind='categories'
        and r.id=new.category_id and r.deleted_at is null
        and coalesce(r.payload->>'archived','false')<>'true'
        and r.payload->>'type'='expense'
    ) then
      raise exception 'BUDGET_CATEGORY_NOT_FOUND' using errcode='23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists lizhi_finance_budget_validate_change
  on public.lizhi_finance_budgets;
create trigger lizhi_finance_budget_validate_change
  before insert or update on public.lizhi_finance_budgets
  for each row execute function public.lizhi_finance_budget_validate_change();

alter table public.lizhi_finance_budgets enable row level security;
revoke all on public.lizhi_finance_budgets from public, anon, authenticated;
grant select, insert, update on public.lizhi_finance_budgets to authenticated;

create policy finance_budget_select_own
  on public.lizhi_finance_budgets for select to authenticated
  using (user_id=(select auth.uid()));
create policy finance_budget_insert_own
  on public.lizhi_finance_budgets for insert to authenticated
  with check (user_id=(select auth.uid()));
create policy finance_budget_update_own
  on public.lizhi_finance_budgets for update to authenticated
  using (user_id=(select auth.uid()))
  with check (user_id=(select auth.uid()));
-- Match the existing Finance allowlist restriction.
create policy finance_budgets_allowlist
  on public.lizhi_finance_budgets as restrictive for all to authenticated
  using (public.lizhi_web_is_allowed())
  with check (public.lizhi_web_is_allowed());

-- Do not grant hard DELETE; clients soft-delete using deleted_at + version CAS.
-- This is a candidate migration; no production DDL has been applied.
commit;
