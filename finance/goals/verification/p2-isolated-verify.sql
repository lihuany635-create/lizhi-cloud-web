\set ON_ERROR_STOP on
-- Disposable PostgreSQL fixture ONLY; P1 baseline and P2 extension.
\ir p1-isolated-verify.sql

-- Minimal existing-ledger account references: generated fake data only.
create table public.lizhi_finance_records (
  user_id uuid not null, kind text not null, id text not null,
  payload jsonb not null default '{}'::jsonb, deleted_at timestamptz
);
grant select on public.lizhi_finance_records to authenticated;
insert into public.lizhi_finance_records(user_id,kind,id,payload) values
('11111111-1111-4111-8111-111111111111','accounts','first-bank-debit-verified','{"archived":false}'),
('22222222-2222-4222-8222-222222222222','accounts','other-owner-id','{"archived":false}');

\ir ../sql/p2-salary-sinking-candidate.sql

-- Structural security: anon denied, no hard delete, strict allowlist.
do $$
begin
  if has_table_privilege('anon','public.lizhi_finance_sinking_funds','SELECT')
     or has_table_privilege('anon','public.lizhi_finance_salary_plans','INSERT')
     or has_table_privilege('authenticated','public.lizhi_finance_sinking_funds','DELETE')
     or has_table_privilege('authenticated','public.lizhi_finance_salary_plans','DELETE')
     or not (select relrowsecurity from pg_class where oid='public.lizhi_finance_salary_plans'::regclass)
     or not (select relrowsecurity from pg_class where oid='public.lizhi_finance_sinking_funds'::regclass)
     or not exists(select 1 from pg_policies
       where tablename='lizhi_finance_salary_plans' and policyname='p2_salary_allowlist'
         and permissive='RESTRICTIVE')
  then raise exception 'P2_PERMISSIONS_FAILED'; end if;
end $$;

-- Fixture writes and trigger checks are performed by the disposable DB owner.
-- Client permissions remain read-only from the moment P2 is applied.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('app.allowed','true',false);

insert into public.lizhi_finance_goals (id,user_id,month,goal_kind,target_amount)
values
('33333333-3333-4333-8333-333333333333',
 '11111111-1111-4111-8111-111111111111','2026-12','sinking_fund',7000),
('44444444-4444-4444-8444-444444444444',
 '11111111-1111-4111-8111-111111111111','2026-12','sinking_fund',1850);

insert into public.lizhi_finance_sinking_funds
(id,user_id,purpose,cadence_months,monthly_contribution,due_amount)
values
('33333333-3333-4333-8333-333333333333',
 '11111111-1111-4111-8111-111111111111','rent',3,7000,null),
('44444444-4444-4444-8444-444444444444',
 '11111111-1111-4111-8111-111111111111','insurance',12,1850,22000);

do $$
begin
  if not exists(select 1 from public.lizhi_finance_sinking_funds
    where purpose='rent' and due_amount is null and monthly_contribution=7000
      and cadence_months=3)
     or not exists(select 1 from public.lizhi_finance_sinking_funds
    where purpose='insurance' and due_amount=22000 and monthly_contribution=1850
      and cadence_months=12) then
    raise exception 'P2_SINKING_FUNDS_WRONG';
  end if;
end $$;

-- A fund must attach to an actual sinking_fund goal, not P1 savings.
do $$
begin
  begin
    insert into public.lizhi_finance_sinking_funds
      (id,user_id,purpose,cadence_months,monthly_contribution)
    values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111','rent',3,5000);
    raise exception 'P2_FUND_KIND_NOT_BLOCKED';
  exception when check_violation then null;
  end;
end $$;

-- Salary lines are atomic and each category appears once.
insert into public.lizhi_finance_salary_plans
  (id,user_id,month,expected_income,lines)
values
('55555555-5555-4555-8555-555555555555',
 '11111111-1111-4111-8111-111111111111','2026-12',43000,
 '[
 {"category":"food","amount":7000,"accountRole":"first_bank_debit","accountId":null},
 {"category":"daily","amount":1500,"accountRole":"first_bank_debit","accountId":null},
 {"category":"transport","amount":1000,"accountRole":"first_bank_debit","accountId":null},
 {"category":"savings","amount":5000,"accountRole":"first_bank_savings","accountId":null},
 {"category":"investible_cash","amount":14650,"accountRole":"investment_cash_pool","accountId":null},
 {"category":"rent_reserve","amount":7000,"accountRole":"investment_cash_pool","accountId":null},
 {"category":"insurance_reserve","amount":1850,"accountRole":"investment_cash_pool","accountId":null},
 {"category":"credit_card_reserve","amount":5000,"accountRole":"ctbc_salary","accountId":null}
 ]'::jsonb);

do $$
declare total numeric; protected numeric; free numeric;
begin
  select sum((line->>'amount')::numeric) into total
  from public.lizhi_finance_salary_plans p
  cross join lateral jsonb_array_elements(p.lines) line
  where p.month='2026-12';
  select sum((line->>'amount')::numeric) into protected
  from public.lizhi_finance_salary_plans p
  cross join lateral jsonb_array_elements(p.lines) line
  where line->>'category' in ('rent_reserve','insurance_reserve');
  select (line->>'amount')::numeric into free
  from public.lizhi_finance_salary_plans p
  cross join lateral jsonb_array_elements(p.lines) line
  where line->>'category'='investible_cash';
  if total<>43000 or protected<>8850 or free<>14650 then
    raise exception 'P2_SALARY_SUMMARY_INVALID';
  end if;
end $$;

-- Invalid total fails before acceptance.
do $$
begin
  begin
    insert into public.lizhi_finance_salary_plans
      (user_id,month,expected_income,lines)
    select user_id,'2027-01',44000,lines
      from public.lizhi_finance_salary_plans where month='2026-12';
    raise exception 'P2_UNBALANCED_NOT_BLOCKED';
  exception when check_violation then null;
  end;
end $$;
-- Forged account reference must be blocked.
do $$
begin
  begin
    update public.lizhi_finance_salary_plans set
      lines=jsonb_set(lines,'{0,accountId}','"other-owner-id"'::jsonb),
      version=version+1 where month='2026-12';
    raise exception 'P2_FOREIGN_ACCOUNT_NOT_BLOCKED';
  exception when check_violation then null;
  end;
end $$;
-- Real owner-scoped reference can be selected; version increments.
update public.lizhi_finance_salary_plans set
  lines=jsonb_set(lines,'{0,accountId}','"first-bank-debit-verified"'::jsonb),
  version=version+1 where month='2026-12';
do $$
begin
 if not exists(select 1 from public.lizhi_finance_salary_plans
   where version=2 and month='2026-12') then
   raise exception 'P2_ACCOUNT_ASSIGNMENT_WRONG';
 end if;
end $$;
-- CAS must fail for update without version increment.
do $$
begin
  begin
    update public.lizhi_finance_salary_plans set
      expected_income=expected_income where month='2026-12';
    raise exception 'P2_STALE_CAS_NOT_BLOCKED';
  exception when check_violation then null;
  end;
end $$;
-- A foreign owner's previously selected account ID must fail before insert.
do $$
begin
  begin
    insert into public.lizhi_finance_salary_plans
      (user_id,month,expected_income,lines)
    select '22222222-2222-4222-8222-222222222222','2027-02',expected_income,lines
      from public.lizhi_finance_salary_plans where month='2026-12';
    raise exception 'P2_FOREIGN_OWNER_ACCOUNT_NOT_BLOCKED';
  exception when check_violation then null;
  end;
end $$;
-- Regression for F-05: even the real allowlisted owner cannot write directly.
set role authenticated;
do $$
begin
  if has_table_privilege('authenticated','public.lizhi_finance_salary_plans','INSERT')
    or has_table_privilege('authenticated','public.lizhi_finance_salary_plans','UPDATE')
    or has_table_privilege('authenticated','public.lizhi_finance_sinking_funds','INSERT')
    or has_table_privilege('authenticated','public.lizhi_finance_sinking_funds','UPDATE')
  then raise exception 'P2_AUTH_DIRECT_WRITE_GRANTED'; end if;
  begin
    update public.lizhi_finance_salary_plans set version=version+1
       where month='2026-12';
    raise exception 'P2_AUTH_DIRECT_WRITE_NOT_BLOCKED';
  exception when insufficient_privilege then null;
  end;
end $$;
-- Also verify pure cross-owner RLS independently with only null account IDs.
do $$
begin
  begin
    insert into public.lizhi_finance_salary_plans
      (user_id,month,expected_income,lines)
    select '22222222-2222-4222-8222-222222222222','2027-03',
      expected_income, jsonb_set(lines,'{0,accountId}','null'::jsonb)
      from public.lizhi_finance_salary_plans where month='2026-12';
    raise exception 'P2_CROSS_OWNER_RLS_NOT_BLOCKED';
  exception when insufficient_privilege then null;
  end;
end $$;
-- Cross-owner read must return no rows.
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
 if exists(select 1 from public.lizhi_finance_salary_plans)
    or exists(select 1 from public.lizhi_finance_sinking_funds) then
    raise exception 'P2_OTHER_OWNER_READ_LEAK';
 end if;
end $$;
-- Restrictive allowlist must deny access even for correct owner.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('app.allowed','false',false);
do $$
begin
 if exists(select 1 from public.lizhi_finance_salary_plans)
    or exists(select 1 from public.lizhi_finance_sinking_funds) then
    raise exception 'P2_ALLOWLIST_BYPASS';
 end if;
end $$;
reset role;
select 'P2_ISOLATED_SQL_PASS' as result;
