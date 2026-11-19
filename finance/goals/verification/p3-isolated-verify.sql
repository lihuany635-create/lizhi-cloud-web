\set ON_ERROR_STOP on
-- Disposable PostgreSQL 16 fixture. This script NEVER touches production.
\ir p2-isolated-verify.sql
create role service_role bypassrls;
grant usage on schema public to service_role;
\ir ../sql/p3-goals-mcp-candidate.sql

-- Service-only contract: authenticated and anon cannot execute new RPCs.
do $$
begin
 if has_function_privilege('authenticated',
     'public.lizhi_finance_p3_month_report(uuid,text)','execute')
    or has_function_privilege('anon',
     'public.lizhi_finance_p3_salary_set(uuid,text,uuid,bigint,text,bigint,jsonb)','execute')
    or has_table_privilege('authenticated','public.lizhi_finance_salary_plan_requests','select')
    or has_table_privilege('anon','public.lizhi_finance_salary_plan_requests','select')
 then raise exception 'P3_SERVICE_BOUNDARY_FAILED';end if;
end $$;

set role service_role;
-- Existing P2 fixture created owner A salary and two protected sinking funds.
do $$
declare x jsonb;
begin
  x:=public.lizhi_finance_p3_month_report(
    '11111111-1111-4111-8111-111111111111','2026-12');
  if x->>'source'<>'finance_goals_cloud_snapshot'
     or (x->'plan'->>'estimated_income')::bigint<>43000
     or jsonb_array_length(x->'goals')<>3
     or jsonb_array_length(x->'funds')<>2 then
    raise exception 'P3_MONTH_REPORT_WRONG';end if;
  if x::text ~* 'note|password|secret' then
    raise exception 'P3_LEAK_SENSITIVE_FIELDS';end if;
end $$;
do $$
declare x jsonb;
begin
  x:=public.lizhi_finance_p3_salary_get(
    '22222222-2222-4222-8222-222222222222','2026-12');
  if x->'plan'<>'null'::jsonb then
    raise exception 'P3_OWNER_REPORT_LEAK';end if;
end $$;

-- New month with all eight lines matching required account roles.
do $$
declare lines jsonb; receipt jsonb; replay jsonb; read_back jsonb;
begin
  select p.lines into lines from public.lizhi_finance_salary_plans p
  where p.user_id='11111111-1111-4111-8111-111111111111'
    and p.month='2026-12';
  receipt:=public.lizhi_finance_p3_salary_set(
    '11111111-1111-4111-8111-111111111111','2027-04',
    '11111111-aaaa-4aaa-8aaa-111111111111',0,'set',43000,lines);
  if receipt->>'status'<>'created' or (receipt->>'version')::bigint<>1
    then raise exception 'P3_CREATE_RECEIPT_WRONG';end if;
  replay:=public.lizhi_finance_p3_salary_set(
    '11111111-1111-4111-8111-111111111111','2027-04',
    '11111111-aaaa-4aaa-8aaa-111111111111',0,'set',43000,lines);
  if replay->>'status'<>'already_applied' or (replay->>'version')::bigint<>1
    then raise exception 'P3_IDEMPOTENT_REPLAY_WRONG';end if;
  read_back:=public.lizhi_finance_p3_salary_get(
    '11111111-1111-4111-8111-111111111111','2027-04');
  if (read_back->'plan'->>'estimated_income')::bigint<>43000
     then raise exception 'P3_GET_AFTER_SET_WRONG';end if;
  begin
    perform public.lizhi_finance_p3_salary_set(
      '11111111-1111-4111-8111-111111111111','2027-04',
      '11111111-aaaa-4aaa-8aaa-111111111111',0,'set',43001,lines);
    raise exception 'P3_CHANGED_PAYLOAD_REPLAY_NOT_BLOCKED';
  exception when check_violation then null;
  end;
  begin
    perform public.lizhi_finance_p3_salary_set(
      '11111111-1111-4111-8111-111111111111','2027-04',
      '22222222-aaaa-4aaa-8aaa-222222222222',0,'set',43000,lines);
    raise exception 'P3_STALE_VERSION_NOT_BLOCKED';
  exception when check_violation then null;
  end;
  receipt:=public.lizhi_finance_p3_salary_set(
    '11111111-1111-4111-8111-111111111111','2027-04',
    '33333333-aaaa-4aaa-8aaa-333333333333',1,'set',43000,lines);
  if receipt->>'status'<>'updated' or (receipt->>'version')::bigint<>2
    then raise exception 'P3_UPDATE_WRONG';end if;
  receipt:=public.lizhi_finance_p3_salary_set(
    '11111111-1111-4111-8111-111111111111','2027-04',
    '44444444-aaaa-4aaa-8aaa-444444444444',2,'remove',null,null);
  if receipt->>'status'<>'removed' or (receipt->>'version')::bigint<>3
    then raise exception 'P3_REMOVE_WRONG';end if;
  read_back:=public.lizhi_finance_p3_salary_get(
    '11111111-1111-4111-8111-111111111111','2027-04');
  if read_back->'plan'<>'null'::jsonb then
    raise exception 'P3_SOFT_DELETE_VISIBLE';end if;
end $$;

reset role;
select 'P3_ISOLATED_SQL_PASS' as result;
