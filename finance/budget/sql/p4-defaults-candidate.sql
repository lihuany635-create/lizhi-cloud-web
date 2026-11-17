-- P4 candidate: owner-scoped optional future-month budget defaults.
-- Does NOT create or overwrite a monthly budget or transaction.
-- Deploy only after owner approval, a fresh encrypted backup and isolated checks.
begin;
create table if not exists public.lizhi_finance_budget_defaults(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category_id text,
 currency text not null default 'TWD' check(currency='TWD'),
 amount bigint not null check(amount between 0 and 9007199254740991),
 start_month text not null check(start_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
 version bigint not null default 1 check(version>=1),
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 disabled_at timestamptz,
 check(category_id is null or length(category_id) between 1 and 160)
);
create unique index if not exists lizhi_budget_default_total
 on public.lizhi_finance_budget_defaults(user_id,currency) where category_id is null;
create unique index if not exists lizhi_budget_default_category
 on public.lizhi_finance_budget_defaults(user_id,currency,category_id) where category_id is not null;
create index if not exists lizhi_budget_default_owner_month
 on public.lizhi_finance_budget_defaults(user_id,start_month);
create or replace function public.lizhi_budget_default_version_guard()
 returns trigger language plpgsql security invoker set search_path='' as $guard$
begin
 if tg_op='UPDATE' then
  if new.id<>old.id or new.user_id<>old.user_id or
     new.currency<>old.currency or
     new.category_id is distinct from old.category_id or
     new.created_at<>old.created_at then
   raise exception 'BUDGET_DEFAULT_SCOPE_IMMUTABLE' using errcode='23514';
  end if;
  if new.version<>old.version+1 then
   raise exception 'BUDGET_DEFAULT_VERSION_CONFLICT' using errcode='23514';
  end if;
  new.updated_at:=clock_timestamp();
 else
  if new.version<>1 or new.disabled_at is not null then
   raise exception 'BUDGET_DEFAULT_INVALID_INITIAL' using errcode='23514';
  end if;
  new.created_at:=clock_timestamp();
  new.updated_at:=new.created_at;
 end if;
 if tg_op='INSERT' and new.category_id is not null and not exists(
  select 1 from public.lizhi_finance_records r where r.user_id=new.user_id
    and r.kind='categories' and r.id=new.category_id and r.deleted_at is null
    and coalesce(r.payload->>'archived','false')<>'true'
    and r.payload->>'type'='expense'
 ) then raise exception 'BUDGET_DEFAULT_CATEGORY_NOT_FOUND' using errcode='23514';
 end if;
 return new;
end
$guard$;
revoke all on function public.lizhi_budget_default_version_guard() from public,anon;
drop trigger if exists lizhi_budget_default_version_guard on public.lizhi_finance_budget_defaults;
create trigger lizhi_budget_default_version_guard
 before insert or update on public.lizhi_finance_budget_defaults
 for each row execute function public.lizhi_budget_default_version_guard();
alter table public.lizhi_finance_budget_defaults enable row level security;
revoke all on public.lizhi_finance_budget_defaults from public,anon,authenticated;
grant select,insert,update on public.lizhi_finance_budget_defaults to authenticated;
create policy lizhi_budget_default_read_own on public.lizhi_finance_budget_defaults
 for select to authenticated using(user_id=(select auth.uid()));
create policy lizhi_budget_default_insert_own on public.lizhi_finance_budget_defaults
 for insert to authenticated with check(user_id=(select auth.uid()));
create policy lizhi_budget_default_update_own on public.lizhi_finance_budget_defaults
 for update to authenticated using(user_id=(select auth.uid()))
 with check(user_id=(select auth.uid()));
create policy lizhi_budget_default_allowlist on public.lizhi_finance_budget_defaults
 as restrictive for all to authenticated
 using(public.lizhi_web_is_allowed()) with check(public.lizhi_web_is_allowed());
commit;
