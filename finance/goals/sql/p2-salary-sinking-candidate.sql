-- P2 candidate ONLY, depends on P1 isolated finance/goals/sql/p1-goals-candidate.sql.
-- Never run against the production Supabase project without explicit owner approval.
-- Planning records are not real bank movements, card spending, rent payments or trades.
begin;

alter table public.lizhi_finance_goals
  drop constraint if exists lizhi_finance_goals_goal_kind_check;
alter table public.lizhi_finance_goals
  add constraint lizhi_finance_goals_goal_kind_check
  check (goal_kind in ('savings','investible_cash','sinking_fund'));

-- Rent and insurance reserve metadata attaches to an existing owner-scoped goal.
-- Monthly contribution and cadence are distinct from verified bill amounts.
create table public.lizhi_finance_sinking_funds (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check(purpose in ('rent','insurance')),
  cadence_months smallint not null check(
    (purpose='rent' and cadence_months=3) or
    (purpose='insurance' and cadence_months=12)),
  monthly_contribution bigint not null
    check(monthly_contribution between 0 and 9007199254740991),
  due_amount bigint check(due_amount between 0 and 9007199254740991),
  due_month text check(due_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  account_id text check(account_id is null or length(account_id) between 1 and 160),
  version bigint not null default 1 check(version >= 1),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  unique(user_id,id),
  foreign key(user_id,id) references public.lizhi_finance_goals(user_id,id)
);
create index lizhi_finance_sinking_fund_owner_read
  on public.lizhi_finance_sinking_funds(user_id,purpose)
  where deleted_at is null;

-- One owner/month plan; eight distinct exact categories kept in JSONB
-- for atomic, versioned reallocation with no partially-saved target lines.
create table public.lizhi_finance_salary_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null check(month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  currency text not null default 'TWD' check(currency='TWD'),
  expected_income bigint not null
    check(expected_income between 0 and 9007199254740991),
  lines jsonb not null check(jsonb_typeof(lines)='array'),
  version bigint not null default 1 check(version >= 1),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  unique(user_id,month)
);

create or replace function public.lizhi_finance_p2_account_is_owned(
  p_owner uuid,p_account text)
returns boolean language sql stable security invoker set search_path='' as $$
  select p_account is null or exists (
    select 1 from public.lizhi_finance_records r
    where r.user_id=p_owner and r.kind='accounts'
      and r.id=p_account and r.deleted_at is null
      and coalesce(r.payload->>'archived','false') <> 'true'
  )
$$;

create or replace function public.lizhi_finance_p2_fund_guard()
returns trigger language plpgsql security invoker set search_path='' as $$
declare g public.lizhi_finance_goals%rowtype;
begin
  select * into g from public.lizhi_finance_goals
    where user_id=new.user_id and id=new.id and deleted_at is null;
  if not found or g.goal_kind <> 'sinking_fund'
     or g.target_amount <> new.monthly_contribution
     or g.account_id is distinct from new.account_id then
    raise exception 'FUND_GOAL_MISMATCH' using errcode='23514';
  end if;
  if not public.lizhi_finance_p2_account_is_owned(new.user_id,new.account_id) then
    raise exception 'FUND_ACCOUNT_NOT_OWNED' using errcode='23514';
  end if;
  if tg_op='INSERT' then
    if new.version<>1 or new.deleted_at is not null then
      raise exception 'FUND_INITIAL_VERSION_INVALID' using errcode='23514';
    end if;
    new.created_at:=clock_timestamp();
    new.updated_at:=new.created_at;
  else
    if (old.deleted_at is not null and new.deleted_at is not null) or new.id<>old.id
       or new.user_id<>old.user_id or new.purpose<>old.purpose
       or new.cadence_months<>old.cadence_months or new.created_at<>old.created_at
    then raise exception 'FUND_SCOPE_IMMUTABLE' using errcode='23514'; end if;
    if new.version<>old.version+1 then
      raise exception 'FUND_VERSION_CONFLICT' using errcode='23514';
    end if;
    new.updated_at:=clock_timestamp();
  end if;
  return new;
end $$;
create trigger lizhi_finance_p2_fund_guard
  before insert or update on public.lizhi_finance_sinking_funds
  for each row execute function public.lizhi_finance_p2_fund_guard();

create or replace function public.lizhi_finance_p2_salary_guard()
returns trigger language plpgsql security invoker set search_path='' as $$
declare line jsonb;
declare c text;
declare r text;
declare a text;
declare v numeric;
declare total numeric:=0;
declare seen text[]:=array[]::text[];
declare required_role text;
begin
  if jsonb_typeof(new.lines)<>'array' or jsonb_array_length(new.lines)<>8
  then raise exception 'SALARY_PLAN_LINES_INVALID' using errcode='23514'; end if;
  for line in select value from jsonb_array_elements(new.lines) loop
    if jsonb_typeof(line)<>'object' or
       (select count(*) from jsonb_object_keys(line))<>4 or
       not (line ? 'category' and line ? 'amount' and
            line ? 'accountRole' and line ? 'accountId') or
       exists(select 1 from jsonb_object_keys(line) k
              where k not in ('category','amount','accountRole','accountId'))
    then raise exception 'SALARY_PLAN_LINE_SHAPE' using errcode='23514'; end if;
    if jsonb_typeof(line->'category')<>'string' or
       jsonb_typeof(line->'accountRole')<>'string' or
       jsonb_typeof(line->'amount')<>'number' or
       line->>'amount' !~ '^[0-9]{1,16}$'
    then raise exception 'SALARY_PLAN_LINE_TYPES' using errcode='23514'; end if;
    c:=line->>'category'; r:=line->>'accountRole';
    required_role:=case
      when c in ('food','daily','transport') then 'first_bank_debit'
      when c='savings' then 'first_bank_savings'
      when c in ('investible_cash','rent_reserve','insurance_reserve')
        then 'investment_cash_pool'
      when c='credit_card_reserve' then 'ctbc_salary'
      else null end;
    if required_role is null or r<>required_role or c=any(seen)
    then raise exception 'SALARY_PLAN_CATEGORY_INVALID' using errcode='23514'; end if;
    seen:=array_append(seen,c);
    v:=(line->>'amount')::numeric;
    if v>9007199254740991 then
      raise exception 'SALARY_PLAN_AMOUNT_OVERFLOW' using errcode='23514'; end if;
    total:=total+v;
    if jsonb_typeof(line->'accountId') not in ('null','string')
    then raise exception 'SALARY_PLAN_ACCOUNT_INVALID' using errcode='23514'; end if;
    a:=line->>'accountId';
    if a is not null and (length(a) not between 1 and 160 or
       not public.lizhi_finance_p2_account_is_owned(new.user_id,a))
    then raise exception 'SALARY_PLAN_ACCOUNT_NOT_OWNED' using errcode='23514'; end if;
  end loop;
  if total <> new.expected_income then
    raise exception 'SALARY_PLAN_UNBALANCED' using errcode='23514'; end if;
  if tg_op='INSERT' then
    if new.version<>1 or new.deleted_at is not null then
      raise exception 'SALARY_PLAN_INITIAL_VERSION_INVALID' using errcode='23514';
    end if;
    new.created_at:=clock_timestamp();new.updated_at:=new.created_at;
  else
    if (old.deleted_at is not null and new.deleted_at is not null) or new.id<>old.id
       or new.user_id<>old.user_id or new.month<>old.month
       or new.currency<>old.currency or new.created_at<>old.created_at
    then raise exception 'SALARY_PLAN_SCOPE_IMMUTABLE' using errcode='23514'; end if;
    if new.version<>old.version+1 then
      raise exception 'SALARY_PLAN_VERSION_CONFLICT' using errcode='23514'; end if;
    new.updated_at:=clock_timestamp();
  end if;
  return new;
end $$;
create trigger lizhi_finance_p2_salary_guard
  before insert or update on public.lizhi_finance_salary_plans
  for each row execute function public.lizhi_finance_p2_salary_guard();

alter table public.lizhi_finance_sinking_funds enable row level security;
alter table public.lizhi_finance_salary_plans enable row level security;
revoke all on public.lizhi_finance_sinking_funds,
  public.lizhi_finance_salary_plans from public,anon,authenticated;
-- Clients may read their own plans, but no direct writes can bypass P5 approval.
grant select on public.lizhi_finance_sinking_funds,
  public.lizhi_finance_salary_plans to authenticated;

create policy p2_fund_read_own on public.lizhi_finance_sinking_funds
  for select to authenticated using(user_id=(select auth.uid()));
create policy p2_fund_allowlist on public.lizhi_finance_sinking_funds
  as restrictive for all to authenticated
  using(public.lizhi_web_is_allowed())
  with check(public.lizhi_web_is_allowed());

create policy p2_salary_read_own on public.lizhi_finance_salary_plans
  for select to authenticated using(user_id=(select auth.uid()));
create policy p2_salary_allowlist on public.lizhi_finance_salary_plans
  as restrictive for all to authenticated
  using(public.lizhi_web_is_allowed())
  with check(public.lizhi_web_is_allowed());

-- Exclude destructive DELETE. Schema validates planning only; actual salary
-- receipt, funded balance, quarterly rent payment and card statement remain
-- unverified until explicitly confirmed in existing ledger.
commit;
