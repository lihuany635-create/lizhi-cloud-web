-- Executed only by the isolated CI postgres:16 service.
\set ON_ERROR_STOP on
\ir p1-isolated-fixture.sql
\ir ../sql/p1-budgets-candidate.sql
\ir ../sql/p1-spending-summary-candidate.sql

-- Baseline: authenticated, owner 1, allowlisted.
set role authenticated;
set "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
set "test.allowed"='true';

insert into public.lizhi_finance_budgets(id,user_id,month,category_id,currency,amount)
values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','2026-11',null,'TWD',12000),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','2026-11','food','TWD',2500);
do $$
declare n bigint;
begin
 select count(*) into n from public.lizhi_finance_budgets;
 if n<>2 then raise exception 'FAIL owner sees own two budgets: %',n; end if;
 raise notice 'PASS: owner can insert and read two budgets';
end;$$;

do $$
begin
 begin
  insert into public.lizhi_finance_budgets(user_id,month,currency,amount)
  values ('11111111-1111-4111-8111-111111111111','2026-11','TWD',18000);
  raise exception 'FAIL duplicate total budget unexpectedly inserted';
 exception when unique_violation then
  raise notice 'PASS: nullable total budget has true unique index';
 end;
end;$$;

do $$
begin
 begin
  insert into public.lizhi_finance_budgets(user_id,month,category_id,currency,amount)
  values ('11111111-1111-4111-8111-111111111111','2026-11','food','TWD',10);
  raise exception 'FAIL duplicate category budget unexpectedly inserted';
 exception when unique_violation then
  raise notice 'PASS: duplicate category budget rejected';
 end;
end;$$;

do $$
begin
 begin
  insert into public.lizhi_finance_budgets(user_id,month,category_id,currency,amount)
  values ('11111111-1111-4111-8111-111111111111','2026-11','salary','TWD',10);
  raise exception 'FAIL income category accepted as expense budget';
 exception when check_violation then
  raise notice 'PASS: income category rejected';
 end;
end;$$;

do $$
begin
 begin
  insert into public.lizhi_finance_budgets(user_id,month,category_id,currency,amount)
  values ('11111111-1111-4111-8111-111111111111','2026-11','missing','TWD',10);
  raise exception 'FAIL unknown category accepted';
 exception when check_violation then
  raise notice 'PASS: missing category rejected';
 end;
end;$$;

do $$
declare n integer;
begin
 update public.lizhi_finance_budgets set amount=12500,version=2
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and version=1;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'FAIL version CAS update'; end if;
 update public.lizhi_finance_budgets set amount=11000,version=2
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and version=1;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL stale version unexpectedly wrote %',n; end if;
 raise notice 'PASS: version CAS keeps stale writer out';
end;$$;

do $$
begin
 begin
  update public.lizhi_finance_budgets set amount=13000,version=4
  where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  raise exception 'FAIL version gap accepted';
 exception when check_violation then
  raise notice 'PASS: trigger rejects nonsequential version';
 end;
end;$$;

do $$
begin
 begin
  update public.lizhi_finance_budgets set month='2026-12',version=3
  where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  raise exception 'FAIL scope change accepted';
 exception when check_violation then
  raise notice 'PASS: immutable budget scope';
 end;
end;$$;

do $$
declare result jsonb;
begin
 select public.lizhi_finance_budget_month_spending('2026-11') into result;
 if (result->>'used')::numeric<>2350
   or (result->>'counted_transactions')::integer<>2
   or (result->>'excluded_foreign_currency')::integer<>1 then
  raise exception 'FAIL month spending summary: %',result;
 end if;
 if (result->'by_category'->0->>'used')::numeric<>2350 then
  raise exception 'FAIL category monthly totals: %',result;
 end if;
 raise notice 'PASS: month summary excludes transfers, card repayment, deleted, FX, old month, other owner';
end;$$;

do $$
begin
 begin
  perform public.lizhi_finance_budget_month_spending('2026-99');
  raise exception 'FAIL invalid month accepted';
 exception when invalid_parameter_value then
  raise notice 'PASS: invalid month rejected';
 end;
end;$$;

-- RLS owner 2 must not see owner 1. Cross-owner write must not pass check.
set "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';
do $$
declare n bigint;
begin
 select count(*) into n from public.lizhi_finance_budgets;
 if n<>0 then raise exception 'FAIL cross-owner read leaked % rows',n; end if;
 raise notice 'PASS: owner 2 cannot read owner 1 budgets';
end;$$;

do $$
begin
 begin
  insert into public.lizhi_finance_budgets(user_id,month,amount)
  values ('11111111-1111-4111-8111-111111111111','2026-12',999);
  raise exception 'FAIL cross-owner insert accepted';
 exception when insufficient_privilege then
  raise notice 'PASS: cross-owner insert rejected by RLS';
 end;
end;$$;

do $$
declare n integer;
begin
 update public.lizhi_finance_budgets set version=3,amount=777
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL cross-owner UPDATE changed row';end if;
 raise notice 'PASS: cross-owner UPDATE cannot alter another owner budget';
end;$$;

-- Owner 2 may have their own total in same month without colliding.
insert into public.lizhi_finance_budgets(id,user_id,month,amount)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222','2026-11',1000);
do $$
declare result jsonb;
begin
 select public.lizhi_finance_budget_month_spending('2026-11') into result;
 if (result->>'used')::numeric<>999 then
  raise exception 'FAIL user 2 sees wrong owner spending: %',result;
 end if;
 raise notice 'PASS: monthly spending RPC is owner isolated';
end;$$;

-- The allowlist used by the production schema is represented here by a fixed fixture.
set "test.allowed"='false';
do $$
declare n integer;
begin
 select count(*) into n from public.lizhi_finance_budgets;
 if n<>0 then raise exception 'FAIL disallowed owner can still read budgets';end if;
 raise notice 'PASS: restricted allowlist rejects reads';
end;$$;

do $$
begin
 begin
  insert into public.lizhi_finance_budgets(user_id,month,amount)
  values ('22222222-2222-4222-8222-222222222222','2026-12',20);
  raise exception 'FAIL disallowed owner can insert';
 exception when insufficient_privilege then
  raise notice 'PASS: restricted allowlist rejects writes';
 end;
end;$$;

reset role;
set role anon;
do $$
begin
 begin
  perform count(*) from public.lizhi_finance_budgets;
  raise exception 'FAIL anon can select budgets';
 exception when insufficient_privilege then
  raise notice 'PASS: anon cannot select budgets';
 end;
end;$$;

\echo P1_ISOLATED_POSTGRES_PASS
