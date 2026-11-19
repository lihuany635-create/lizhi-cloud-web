\set ON_ERROR_STOP on
-- P4 disposable-only security/rollback/restore fixture. Never invoke on production.
\ir p3-isolated-verify.sql

-- Confirm caller-facing roles still lack execution and direct access.
do $$
begin
  if has_function_privilege('anon',
      'public.lizhi_finance_p3_salary_get(uuid,text)','execute')
     or has_function_privilege('authenticated',
      'public.lizhi_finance_p3_month_report(uuid,text)','execute')
     or has_function_privilege('authenticated',
      'public.lizhi_finance_p3_salary_set(uuid,text,uuid,bigint,text,bigint,jsonb)','execute')
     or has_table_privilege('anon','public.lizhi_finance_salary_plans','select')
  then raise exception 'P4_RPC_BOUNDARY_FAILED'; end if;
end $$;

set role service_role;
-- P3 fixture soft removed the 2027-04 plan, leaving version 3.
-- Before P4 fix it could never be restored due to the UNIQUE(owner,month).
do $$
declare x jsonb; lines jsonb;
begin
  select p.lines into lines from public.lizhi_finance_salary_plans p
    where p.user_id='11111111-1111-4111-8111-111111111111'
      and p.month='2026-12';
  if lines is null then raise exception 'P4_MISSING_FIXTURE'; end if;

  -- Stale version must still be rejected even after soft deletion.
  begin
    perform public.lizhi_finance_p3_salary_set(
      '11111111-1111-4111-8111-111111111111','2027-04',
      '99999999-aaaa-4999-8999-999999999999',2,'set',43000,lines);
    raise exception 'P4_STALE_RESTORE_ALLOWED';
  exception when check_violation then null;
  end;

  x:=public.lizhi_finance_p3_salary_set(
    '11111111-1111-4111-8111-111111111111','2027-04',
    'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',3,'set',43000,lines);
  if x->>'status'<>'restored' or (x->>'version')::bigint<>4
  then raise exception 'P4_RESTORE_FAILED'; end if;

  if (select count(*) from public.lizhi_finance_salary_plans
      where user_id='11111111-1111-4111-8111-111111111111'
        and month='2027-04') <> 1 then
    raise exception 'P4_RESTORE_CREATED_DUPLICATE'; end if;

  if not exists(select 1 from public.lizhi_finance_salary_plans
      where month='2027-04' and deleted_at is null and version=4) then
    raise exception 'P4_RESTORE_ROW_NOT_ACTIVE'; end if;

  -- Same request returns original receipt (idempotent) without second edit.
  x:=public.lizhi_finance_p3_salary_set(
    '11111111-1111-4111-8111-111111111111','2027-04',
    'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',3,'set',43000,lines);
  if x->>'status'<>'already_applied' or (x->>'version')::bigint<>4
  then raise exception 'P4_RESTORE_REPLAY_BROKEN'; end if;

  -- A remove intent cannot reuse the same request_id under a new payload.
  begin
    perform public.lizhi_finance_p3_salary_set(
      '11111111-1111-4111-8111-111111111111','2027-04',
      'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',4,'remove',null,null);
    raise exception 'P4_CHANGED_REPLAY_ALLOWED';
  exception when check_violation then null;
  end;
end $$;
reset role;

-- A failed/uncommitted transaction must leave no salary plan or request receipt.
begin;
set role service_role;
select public.lizhi_finance_p3_salary_set(
  '11111111-1111-4111-8111-111111111111','2028-01',
  'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb',0,'set',43000,
  (select p.lines from public.lizhi_finance_salary_plans p
   where p.user_id='11111111-1111-4111-8111-111111111111' and p.month='2026-12')
);
reset role;
rollback;

do $$
begin
  if exists(select 1 from public.lizhi_finance_salary_plans where month='2028-01')
  or exists(select 1 from public.lizhi_finance_salary_plan_requests
     where request_id='bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb') then
    raise exception 'P4_TRANSACTION_ROLLBACK_FAILED';
  end if;
end $$;

-- Protected savings and confirmed allocations still have their original meaning.
do $$
declare i bigint; protected_count bigint;
begin
  select count(*) into protected_count from public.lizhi_finance_sinking_funds;
  if protected_count<>2 then raise exception 'P4_FUNDS_CHANGED'; end if;
  select count(*) into i from public.lizhi_finance_goal_events
    where user_id='11111111-1111-4111-8111-111111111111';
  if i<>2 then raise exception 'P4_GOAL_EVENT_COUNT_CHANGED'; end if;
end $$;
select 'P4_ISOLATED_SECURITY_PASS' as result;
