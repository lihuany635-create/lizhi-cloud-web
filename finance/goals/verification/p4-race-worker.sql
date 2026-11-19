\set ON_ERROR_STOP on
-- Must be called by P4 CI against a disposable DB only.
set role service_role;
select public.lizhi_finance_p3_salary_set(
  '11111111-1111-4111-8111-111111111111','2028-02',
  :'request_id'::uuid,0,'set',43000,
  (select p.lines from public.lizhi_finance_salary_plans p
   where p.user_id='11111111-1111-4111-8111-111111111111'
     and p.month='2026-12')
);
reset role;
