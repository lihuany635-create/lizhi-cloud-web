\set ON_ERROR_STOP on
-- Disposable PostgreSQL only: no production connections, tokens, or user ledger rows.
create schema if not exists auth;
do $$ begin
  if not exists(select 1 from pg_roles where rolname='authenticated') then
    create role authenticated;
  end if;
  if not exists(select 1 from pg_roles where rolname='anon') then
    create role anon;
  end if;
end $$;
create table auth.users (id uuid primary key);
insert into auth.users(id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create function public.lizhi_web_is_allowed() returns boolean language sql stable as $$
  select current_setting('app.allowed',true) = 'true'
$$;
grant usage on schema public,auth to authenticated,anon;
\ir ../sql/p1-goals-candidate.sql
-- Structural and permission sanity checks.
do $$
begin
  if has_table_privilege('anon','public.lizhi_finance_goals','SELECT')
     or has_table_privilege('anon','public.lizhi_finance_goal_events','INSERT')
     or has_table_privilege('authenticated','public.lizhi_finance_goal_events','DELETE')
     or has_table_privilege('authenticated','public.lizhi_finance_goals','INSERT')
     or has_table_privilege('authenticated','public.lizhi_finance_goals','UPDATE')
     or has_table_privilege('authenticated','public.lizhi_finance_goal_events','INSERT')
     or not (select relrowsecurity from pg_class where oid='public.lizhi_finance_goals'::regclass)
     or not (select relrowsecurity from pg_class where oid='public.lizhi_finance_goal_events'::regclass) then
    raise exception 'P1_PERMISSIONS_INVALID';
  end if;
end $$;
-- Fixtures and trigger checks run as a trusted disposable DB owner, not
-- as an authenticated user, which MUST remain read-only at every phase.
select set_config('app.allowed','true',false);
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
insert into public.lizhi_finance_goals(
  id,user_id,month,goal_kind,target_amount,account_id)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       '11111111-1111-4111-8111-111111111111',
       '2026-12','savings',5000,'first-bank-savings');
insert into public.lizhi_finance_goal_events(
 id,user_id,goal_id,request_id,event_kind,amount,source_reference)
values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
       '11111111-1111-4111-8111-111111111111',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
       'allocate',3000,'2026-12-salary-savings-part');
insert into public.lizhi_finance_goal_events(
 id,user_id,goal_id,request_id,event_kind,amount,source_reference)
values('dddddddd-dddd-4ddd-8ddd-dddddddddddd',
       '11111111-1111-4111-8111-111111111111',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
       'release',1000,'2026-12-salary-savings-part');
-- Check the actual net confirmed amount.
do $$
declare reserved bigint;
begin
  select sum(case when event_kind='allocate' then amount else -amount end)
  into reserved from public.lizhi_finance_goal_events
  where user_id=auth.uid();
  if reserved <> 2000 then raise exception 'P1_PROGRESS_INCORRECT'; end if;
end $$;
-- Duplicate source slice must be rejected.
do $$
begin
  begin
    insert into public.lizhi_finance_goal_events(
      user_id,goal_id,request_id,event_kind,amount,source_reference)
    values(auth.uid(),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'ffffffff-ffff-4fff-8fff-ffffffffffff','allocate',1000,
      '2026-12-salary-savings-part');
    raise exception 'P1_DUPLICATE_NOT_BLOCKED';
  exception when unique_violation then null;
  end;
end $$;
-- Excessive release must be rejected.
do $$
begin
  begin
    insert into public.lizhi_finance_goal_events(
      user_id,goal_id,request_id,event_kind,amount,source_reference)
    values(auth.uid(),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '99999999-9999-4999-8999-999999999999','release',2500,
      '2026-12-salary-savings-part');
    raise exception 'P1_EXCESS_RELEASE_NOT_BLOCKED';
  exception when check_violation then null;
  end;
end $$;
-- CAS update must reject stale version.
do $$
begin
  begin
    update public.lizhi_finance_goals set target_amount=6000
    where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'P1_VERSION_NOT_BLOCKED';
  exception when check_violation then null;
  end;
end $$;
-- No first-party or OAuth bearer may directly mutate goal tables.
set role authenticated;
do $
begin
  begin
    insert into public.lizhi_finance_goals(user_id,month,goal_kind,target_amount)
    values(auth.uid(),'2027-01','savings',100);
    raise exception 'P1_AUTH_DIRECT_WRITE_NOT_BLOCKED';
  exception when insufficient_privilege then null;
  end;
end $;
-- Attempt to create another user's goal must be rejected by RLS.
do $$
begin
  begin
    insert into public.lizhi_finance_goals(user_id,month,goal_kind,target_amount)
    values('22222222-2222-4222-8222-222222222222','2026-12','savings',5000);
    raise exception 'P1_CROSS_OWNER_NOT_BLOCKED';
  exception when insufficient_privilege then null;
  end;
end $$;
-- Same session, another allowed authenticated user sees zero rows.
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
  if exists(select 1 from public.lizhi_finance_goals) then
    raise exception 'P1_OWNER_LEAK';
  end if;
end $$;
reset role;
select 'P1_ISOLATED_SQL_PASS' as result;
