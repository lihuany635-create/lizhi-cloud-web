\set ON_ERROR_STOP on
-- Run only in the disposable PostgreSQL database after p5-isolated-verify.sql.
-- Removal must affect Goals candidate objects and nothing in the original ledger.
do $pre$
begin
 if to_regclass('public.lizhi_finance_goals') is null
    or to_regclass('public.lizhi_finance_records') is null then
   raise exception 'GOALS_ROLLBACK_FIXTURE_MISSING'; end if;
end $pre$;
truncate table
 public.lizhi_finance_goal_requests,
 public.lizhi_finance_salary_plan_requests,
 public.lizhi_finance_goal_events,
 public.lizhi_finance_sinking_funds,
 public.lizhi_finance_salary_plans,
 public.lizhi_finance_goals;
\ir ../sql/p6-empty-rollback-candidate.sql
do $verify$
begin
 if to_regclass('public.lizhi_finance_goals') is not null
    or to_regclass('public.lizhi_finance_goal_events') is not null
    or to_regclass('public.lizhi_finance_salary_plans') is not null
    or to_regclass('public.lizhi_finance_goal_requests') is not null
    or to_regclass('public.lizhi_finance_salary_plan_requests') is not null
    or to_regclass('public.lizhi_finance_sinking_funds') is not null then
   raise exception 'GOALS_ROLLBACK_INCOMPLETE'; end if;
 if to_regclass('public.lizhi_finance_records') is null then
   raise exception 'GOALS_ROLLBACK_DAMAGED_EXISTING_LEDGER'; end if;
end $verify$;
select 'P6_EMPTY_ROLLBACK_ISOLATED_PASS' as result;
