\set ON_ERROR_STOP on
-- Apply ONLY to a fresh, restored disposable test database.
do $$
declare g integer; f integer; p integer; e integer;
begin
  select count(*) into g from public.lizhi_finance_goals;
  select count(*) into f from public.lizhi_finance_sinking_funds;
  select count(*) into p from public.lizhi_finance_salary_plans;
  select count(*) into e from public.lizhi_finance_goal_events;
  if g<>3 or f<>2 or p<>2 or e<>2 then
    raise exception 'P4_RESTORED_DATA_MISMATCH goal=% fund=% plans=% events=%',g,f,p,e;
  end if;
  if not exists(select 1 from public.lizhi_finance_salary_plans
    where month='2027-04' and version=4 and deleted_at is null) then
    raise exception 'P4_RESTORED_PLAN_MISMATCH';
  end if;
  if exists(select 1 from public.lizhi_finance_salary_plans where month='2028-01') then
    raise exception 'P4_ROLLBACK_NOT_PRESERVED';
  end if;
  if not exists(select 1 from pg_policies
    where tablename='lizhi_finance_salary_plans'
      and policyname='p2_salary_allowlist' and permissive='RESTRICTIVE') then
    raise exception 'P4_RLS_RESTORE_MISSING';
  end if;
  if not exists(select 1 from pg_policies
    where tablename='lizhi_finance_goals'
      and policyname='finance_goal_allowlist' and permissive='RESTRICTIVE') then
    raise exception 'P4_GOALS_RLS_RESTORE_MISSING';
  end if;
  if not exists(select 1 from pg_proc
    where proname='lizhi_finance_p3_month_report') then
    raise exception 'P4_RPC_RESTORE_MISSING';
  end if;
end $$;
select 'P4_ISOLATED_RESTORE_PASS' as result;
