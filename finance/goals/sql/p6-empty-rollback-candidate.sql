-- SECURITY REVIEW CANDIDATE. DO NOT RUN ON PRODUCTION WITHOUT OWNER APPROVAL.
-- Revert P1-P5 finance-goals objects ONLY when every goals table is EMPTY.
-- After real goals data exist, use feature flags and a separately reviewed
-- migration instead of deleting personal planning records.
\set ON_ERROR_STOP on
begin;
do $guard$
declare target text;
declare rows_exist boolean;
begin
  for target in select unnest(array[
    'public.lizhi_finance_goal_requests',
    'public.lizhi_finance_salary_plan_requests',
    'public.lizhi_finance_goal_events',
    'public.lizhi_finance_sinking_funds',
    'public.lizhi_finance_salary_plans',
    'public.lizhi_finance_goals'
  ]) loop
    if to_regclass(target) is not null then
      execute format('select exists(select 1 from %s)',target)
        into rows_exist;
      if rows_exist then
        raise exception 'GOALS_ROLLBACK_REFUSES_NONEMPTY_TABLE: %',target
          using errcode='23514';
      end if;
    end if;
  end loop;
end $guard$;

-- No CASCADE: if another feature depends on one of these objects, stop.
drop function if exists public.lizhi_finance_p5_allocation_set(
  uuid,text,uuid,uuid,text,bigint,text,boolean);
drop function if exists public.lizhi_finance_p5_goal_set(
  uuid,text,uuid,uuid,bigint,text,text,bigint,text,text,integer,bigint,text);
drop function if exists public.lizhi_finance_p3_salary_set(
  uuid,text,uuid,bigint,text,bigint,jsonb);
drop function if exists public.lizhi_finance_p3_salary_get(uuid,text);
drop function if exists public.lizhi_finance_p3_month_report(uuid,text);
drop trigger if exists lizhi_finance_p2_fund_guard
  on public.lizhi_finance_sinking_funds;
drop trigger if exists lizhi_finance_p2_salary_guard
  on public.lizhi_finance_salary_plans;
drop trigger if exists lizhi_finance_goal_event_guard
  on public.lizhi_finance_goal_events;
drop trigger if exists lizhi_finance_goal_guard
  on public.lizhi_finance_goals;
drop function if exists public.lizhi_finance_p2_fund_guard();
drop function if exists public.lizhi_finance_p2_salary_guard();
drop function if exists public.lizhi_finance_goal_event_guard();
drop function if exists public.lizhi_finance_goal_guard();
drop function if exists public.lizhi_finance_p2_account_is_owned(uuid,text);

drop table if exists public.lizhi_finance_goal_requests;
drop table if exists public.lizhi_finance_salary_plan_requests;
drop table if exists public.lizhi_finance_goal_events;
drop table if exists public.lizhi_finance_sinking_funds;
drop table if exists public.lizhi_finance_salary_plans;
drop table if exists public.lizhi_finance_goals;
commit;
