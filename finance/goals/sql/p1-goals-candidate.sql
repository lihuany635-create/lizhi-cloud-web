-- P1 ISOLATED CANDIDATE ONLY. DO NOT APPLY TO PRODUCTION WITHOUT OWNER APPROVAL.
-- Existing finance ledger and expense budgets are not modified.
begin;
create table if not exists public.lizhi_finance_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null check (month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  goal_kind text not null check (goal_kind in ('savings','investible_cash')),
  currency text not null default 'TWD' check (currency = 'TWD'),
  target_amount bigint not null check (target_amount between 0 and 9007199254740991),
  account_id text check (account_id is null or length(account_id) between 1 and 160),
  version bigint not null default 1 check (version >= 1),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  unique (user_id, id)
);
create index if not exists lizhi_finance_goals_month_read
  on public.lizhi_finance_goals (user_id, month, goal_kind)
  where deleted_at is null;

-- Each row is a declared, user-confirmed allocation, NOT a bank transfer or
-- broker trade. A source_reference identifies an indivisible allocation slice.
create table if not exists public.lizhi_finance_goal_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null,
  request_id uuid not null,
  event_kind text not null check (event_kind in ('allocate','release')),
  amount bigint not null check (amount between 1 and 9007199254740991),
  source_reference text not null check (length(source_reference) between 1 and 160),
  evidence_type text not null default 'user_confirmed'
    check (evidence_type = 'user_confirmed'),
  created_at timestamptz not null default clock_timestamp(),
  unique(user_id, request_id),
  foreign key(user_id, goal_id)
    references public.lizhi_finance_goals(user_id,id)
);
-- A single confirmed source slice can only be allocated to one goal.
create unique index if not exists lizhi_finance_goal_source_once
  on public.lizhi_finance_goal_events (user_id, source_reference)
  where event_kind='allocate';
create index if not exists lizhi_finance_goal_event_read
  on public.lizhi_finance_goal_events (user_id, goal_id, created_at, id);

create or replace function public.lizhi_finance_goal_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='INSERT' then
    if new.version <> 1 or new.deleted_at is not null then
      raise exception 'GOAL_INITIAL_VERSION_INVALID' using errcode='23514';
    end if;
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
  else
    if old.deleted_at is not null
       or new.id <> old.id or new.user_id <> old.user_id
       or new.month <> old.month or new.goal_kind <> old.goal_kind
       or new.currency <> old.currency or new.created_at <> old.created_at then
      raise exception 'GOAL_IMMUTABLE_SCOPE' using errcode='23514';
    end if;
    if new.version <> old.version + 1 then
      raise exception 'GOAL_VERSION_CONFLICT' using errcode='23514';
    end if;
    new.updated_at := clock_timestamp();
  end if;
  return new;
end $$;
drop trigger if exists lizhi_finance_goal_guard on public.lizhi_finance_goals;
create trigger lizhi_finance_goal_guard before insert or update on public.lizhi_finance_goals
  for each row execute function public.lizhi_finance_goal_guard();

-- One lock per goal serialises release checking (prevents two simultaneous
-- releases spending the same reservation). Event records stay append-only.
create or replace function public.lizhi_finance_goal_event_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare current_reserved numeric;
declare source_reserved numeric;
declare goal_target numeric;
declare source_owner_goal uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'GOAL_EVENT_IMMUTABLE' using errcode='23514';
  end if;
  select g.target_amount into goal_target from public.lizhi_finance_goals g
    where g.id=new.goal_id and g.user_id=new.user_id and g.deleted_at is null
    for update;
  if not found then
    raise exception 'GOAL_NOT_FOUND' using errcode='23514';
  end if;
  if new.event_kind='allocate' then
    select coalesce(sum(case when e.event_kind='allocate' then e.amount::numeric
      else -e.amount::numeric end),0) into current_reserved
      from public.lizhi_finance_goal_events e
      where e.user_id=new.user_id and e.goal_id=new.goal_id;
    if current_reserved + new.amount::numeric > goal_target then
      raise exception 'GOAL_RESERVE_EXCEEDS_TARGET' using errcode='23514';
    end if;
  end if;
  if new.event_kind='release' then
    select e.goal_id into source_owner_goal
      from public.lizhi_finance_goal_events e
      where e.user_id=new.user_id and e.source_reference=new.source_reference
        and e.event_kind='allocate';
    if source_owner_goal is null or source_owner_goal <> new.goal_id then
      raise exception 'GOAL_RELEASE_SOURCE_INVALID' using errcode='23514';
    end if;
    select coalesce(sum(case when e.event_kind='allocate' then e.amount else -e.amount end),0)
      into source_reserved from public.lizhi_finance_goal_events e
      where e.user_id=new.user_id and e.source_reference=new.source_reference;
    select coalesce(sum(case when e.event_kind='allocate' then e.amount else -e.amount end),0)
      into current_reserved from public.lizhi_finance_goal_events e
      where e.user_id=new.user_id and e.goal_id=new.goal_id;
    if source_reserved < new.amount or current_reserved < new.amount then
      raise exception 'GOAL_RELEASE_EXCEEDS_RESERVE' using errcode='23514';
    end if;
  end if;
  new.created_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists lizhi_finance_goal_event_guard on public.lizhi_finance_goal_events;
create trigger lizhi_finance_goal_event_guard
  before insert or update or delete on public.lizhi_finance_goal_events
  for each row execute function public.lizhi_finance_goal_event_guard();

alter table public.lizhi_finance_goals enable row level security;
alter table public.lizhi_finance_goal_events enable row level security;
revoke all on public.lizhi_finance_goals, public.lizhi_finance_goal_events from public, anon, authenticated;
-- Read-only at EVERY migration boundary: service_role-only writes begin in P5.
-- Never rely on a later migration revoking an earlier unsafe grant.
grant select on public.lizhi_finance_goals to authenticated;
grant select on public.lizhi_finance_goal_events to authenticated;

create policy finance_goal_select_own on public.lizhi_finance_goals
  for select to authenticated using (user_id=(select auth.uid()));
create policy finance_goal_allowlist on public.lizhi_finance_goals
  as restrictive for all to authenticated
  using (public.lizhi_web_is_allowed())
  with check (public.lizhi_web_is_allowed());

create policy finance_goal_event_select_own on public.lizhi_finance_goal_events
  for select to authenticated using (user_id=(select auth.uid()));
create policy finance_goal_event_allowlist on public.lizhi_finance_goal_events
  as restrictive for all to authenticated
  using (public.lizhi_web_is_allowed())
  with check (public.lizhi_web_is_allowed());

-- Future production design MUST validate source_reference against an
-- authorised allocation proof and enforce per-source total at the API boundary.
-- P1 does not claim bank verification, exact brokerage value or real transfers.
commit;
