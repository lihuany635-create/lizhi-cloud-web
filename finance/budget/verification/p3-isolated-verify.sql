-- P3 isolated PostgreSQL verification: never point at production.
\set ON_ERROR_STOP on
\ir p1-isolated-fixture.sql
create role service_role nologin bypassrls;
grant usage on schema public,auth to service_role;
grant select on public.lizhi_finance_records to service_role;
\ir ../sql/p1-budgets-candidate.sql
\ir ../sql/p3-mcp-candidate.sql

-- Authenticated and anonymous cannot execute service-only P3 RPCs.
do $$
begin
  if has_function_privilege('anon',
    'public.lizhi_finance_budget_site_set(uuid,uuid,text,text,text,bigint,boolean,bigint)','EXECUTE')
    or has_function_privilege('authenticated',
    'public.lizhi_finance_budget_site_set(uuid,uuid,text,text,text,bigint,boolean,bigint)','EXECUTE')
    or has_function_privilege('anon',
    'public.lizhi_finance_budget_site_spending(uuid,text)','EXECUTE')
    or has_function_privilege('authenticated',
    'public.lizhi_finance_budget_site_spending(uuid,text)','EXECUTE')
    or has_table_privilege('authenticated','public.lizhi_finance_budget_requests','SELECT') then
    raise exception 'P3_PRIVILEGE_LEAK';
  end if;
  raise notice 'PASS P3 service-only budget RPC privileges';
end $$;
set role service_role;

do $$
declare
  owner1 uuid='11111111-1111-4111-8111-111111111111';
  owner2 uuid='22222222-2222-4222-8222-222222222222';
  request1 uuid='33333333-3333-4333-8333-333333333333';
  request2 uuid='44444444-4444-4444-8444-444444444444';
  request3 uuid='55555555-5555-4555-8555-555555555555';
  request4 uuid='66666666-6666-4666-8666-666666666666';
  request5 uuid='77777777-7777-4777-8777-777777777777';
  result jsonb;
  prior jsonb;
  spending jsonb;
  failures integer=0;
begin
  spending:=public.lizhi_finance_budget_site_spending(owner1,'2026-11');
  if (spending->>'used')::numeric<>2350
     or (spending->>'excluded_foreign_currency')::int<>1
     or (spending->>'counted_transactions')::int<>2 then
    raise exception 'P3_SPENDING_AGGREGATION_FAIL %',spending;
  end if;
  if (public.lizhi_finance_budget_site_spending(owner2,'2026-11')->>'used')::numeric<>0 then
    raise exception 'P3_CROSS_OWNER_SUMMARY_FAIL';
  end if;
  raise notice 'PASS P3 minimal owner-scoped summary and exclusion';

  result:=public.lizhi_finance_budget_site_set(owner1,request1,
    '2026-11',null,'TWD',0,false,0);
  if result->>'status'<>'created' or (result->'budget'->>'amount')::bigint<>0 or
     (result->'budget'->>'version')::bigint<>1 then
    raise exception 'P3_ZERO_BUDGET_CREATE_FAIL %',result;
  end if;
  prior:=result;
  result:=public.lizhi_finance_budget_site_set(owner1,request1,
    '2026-11',null,'TWD',0,false,0);
  if result is distinct from prior then
    raise exception 'P3_IDEMPOTENT_RETRY_DIFFERENT';
  end if;
  if (select count(*) from public.lizhi_finance_budget_requests
     where request_id=request1)<>1 then
    raise exception 'P3_IDEMPOTENT_DUPLICATE_WRITTEN';
  end if;
  raise notice 'PASS P3 zero budget, same request idempotency';

  begin
    perform public.lizhi_finance_budget_site_set(owner1,request1,
      '2026-11',null,'TWD',700,false,0);
    raise exception 'P3_SHOULD_REJECT_REUSED_CHANGED_REQUEST';
  exception when unique_violation then
    if sqlerrm not like '%BUDGET_DUPLICATE_REQUEST%' then raise; end if;
  end;
  raise notice 'PASS P3 conflicting request-id rejected';

  result:=public.lizhi_finance_budget_site_set(owner1,request2,
    '2026-11',null,'TWD',5000,false,1);
  if result->>'status'<>'updated' or (result->'budget'->>'version')::int<>2 then
    raise exception 'P3_CAS_UPDATE_FAIL %',result;
  end if;
  begin
    perform public.lizhi_finance_budget_site_set(owner1,request3,
      '2026-11',null,'TWD',4000,false,1);
    raise exception 'P3_STALE_WRITE_ACCEPTED';
  exception when check_violation then
    if sqlerrm not like '%BUDGET_VERSION_CONFLICT%' then raise; end if;
  end;
  raise notice 'PASS P3 CAS stale writer rejected';

  result:=public.lizhi_finance_budget_site_set(owner1,request3,
    '2026-11','food','TWD',1800,false,0);
  if result->>'status'<>'created' then raise exception 'P3_CATEGORY_CREATE_FAIL'; end if;
  begin
    perform public.lizhi_finance_budget_site_set(owner1,request4,
      '2026-11','salary','TWD',1800,false,0);
    raise exception 'P3_INCOME_CATEGORY_ACCEPTED';
  exception when check_violation then
    if sqlerrm not like '%BUDGET_CATEGORY_NOT_FOUND%' then raise; end if;
  end;
  raise notice 'PASS P3 expense category only';

  result:=public.lizhi_finance_budget_site_set(owner1,request4,
    '2026-11',null,'TWD',null,true,2);
  if result->>'status'<>'deleted' or (result->'budget'->>'version')::int<>3 or
    result->'budget'->>'deleted_at' is null then
    raise exception 'P3_SOFT_DELETE_FAIL %',result;
  end if;
  prior:=public.lizhi_finance_budget_site_set(owner1,request4,
    '2026-11',null,'TWD',null,true,2);
  if prior is distinct from result then
    raise exception 'P3_DELETE_RETRY_NOT_IDEMPOTENT';
  end if;
  raise notice 'PASS P3 versioned soft delete and retry';

  result:=public.lizhi_finance_budget_site_set(owner2,request5,
    '2026-11',null,'TWD',900,false,0);
  if result->>'status'<>'created' or
    (select count(*) from public.lizhi_finance_budgets where user_id=owner1)<>2 or
    (select count(*) from public.lizhi_finance_budgets where user_id=owner2)<>1 then
    raise exception 'P3_OWNER_SAFETY_FAIL';
  end if;
  raise notice 'PASS P3 two owner scopes remain separate';

  if (select count(*) from public.lizhi_finance_budget_requests)<>5 then
    raise exception 'P3_REQUEST_RECEIPT_COUNT';
  end if;
  raise notice 'P3_POSTGRES_ISOLATED_PASS';
end $$;
reset role;
