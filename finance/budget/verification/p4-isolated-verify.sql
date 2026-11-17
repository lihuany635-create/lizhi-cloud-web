-- Disposable PostgreSQL only. Never run this file against production.
\set ON_ERROR_STOP on
\ir p1-isolated-fixture.sql
create role service_role nologin bypassrls;
grant usage on schema public,auth to service_role;
grant select on public.lizhi_finance_records to service_role;
\ir ../sql/p1-budgets-candidate.sql
\ir ../sql/p3-mcp-candidate.sql
\ir ../sql/p4-defaults-candidate.sql
\ir ../sql/p4-linked-refunds-candidate.sql

do $s$
begin
 if has_table_privilege('anon','public.lizhi_finance_budget_defaults','SELECT') or
    (select relrowsecurity from pg_class where oid='public.lizhi_finance_budget_defaults'::regclass)=false
 then raise exception 'P4_DEFAULT_RLS_FAILED'; end if;
 raise notice 'PASS P4 default RLS anonymous denial';
end $s$;

begin;
set local role authenticated;
set local "test.allowed"='true';
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
do $s$
declare r public.lizhi_finance_budget_defaults%rowtype; denied boolean:=false;
begin
 insert into public.lizhi_finance_budget_defaults(user_id,category_id,amount,start_month)
 values ('11111111-1111-4111-8111-111111111111',null,100,'2026-12')
 returning * into r;
 if r.version<>1 or r.amount<>100 then raise exception 'P4_DEFAULT_INSERT_FAILED';end if;
 update public.lizhi_finance_budget_defaults
 set amount=120,version=2 where id=r.id returning * into r;
 if r.version<>2 or r.amount<>120 then raise exception 'P4_DEFAULT_CAS_FAILED';end if;
 begin
  update public.lizhi_finance_budget_defaults set amount=130
  where id=r.id;
 exception when check_violation then denied:=true;
 end;
 if not denied then raise exception 'P4_DEFAULT_STALE_VERSION_ACCEPTED';end if;
 denied:=false;
 begin
  insert into public.lizhi_finance_budget_defaults(user_id,category_id,amount,start_month)
  values ('22222222-2222-4222-8222-222222222222',null,2,'2026-12');
 exception when insufficient_privilege then denied:=true;
 end;
 if not denied then raise exception 'P4_DEFAULT_CROSS_OWNER_ACCEPTED';end if;
 raise notice 'PASS P4 default owner and version guards';
end $s$;
rollback;

insert into public.lizhi_finance_records(user_id,kind,id,payload) values
 ('11111111-1111-4111-8111-111111111111','transactions','refund-meal',
  '{"type":"income","date":"2026-12-01","amount":200,"accountId":"cash","categoryId":"salary","refundOfTransactionId":"meal","refundVerified":true}'),
 ('11111111-1111-4111-8111-111111111111','transactions','refund-card',
  '{"type":"income","date":"2026-12-02","amount":150,"accountId":"cash","categoryId":"salary","refundOfTransactionId":"card","refundVerified":true}'),
 ('11111111-1111-4111-8111-111111111111','transactions','ordinary-income',
  '{"type":"income","date":"2026-11-12","amount":5000,"accountId":"cash","categoryId":"salary"}'),
 ('22222222-2222-4222-8222-222222222222','transactions','wrong-owner-refund',
  '{"type":"income","date":"2026-12-02","amount":850,"accountId":"cash","refundOfTransactionId":"card","refundVerified":true}');

begin;
set local role authenticated;
set local "test.allowed"='true';
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
do $s$
declare r jsonb;
begin
 r:=public.lizhi_finance_budget_month_spending('2026-11');
 if (r->>'used')::numeric<>2000 or (r->>'counted_linked_refunds')::int<>2 or
    (select count(*) from jsonb_array_elements(r->'by_category') x
      where x->>'category_id'='food' and (x->>'used')::numeric=2000)<>1 then
  raise exception 'P4_AUTH_MONTH_REFUNDS_FAILED %',r;
 end if;
 raise notice 'PASS P4 authenticated owner-scoped month refund netting';
end $s$;
rollback;

begin;
set local role service_role;
do $s$
declare r jsonb;
begin
 r:=public.lizhi_finance_budget_site_spending(
  '11111111-1111-4111-8111-111111111111','2026-11');
 if (r->>'used')::numeric<>2000 or (r->>'counted_linked_refunds')::int<>2
 then raise exception 'P4_SITE_MONTH_REFUNDS_FAILED %',r; end if;
 r:=public.lizhi_finance_budget_site_spending(
  '22222222-2222-4222-8222-222222222222','2026-11');
 if (r->>'used')::numeric<>999 then raise exception 'P4_OWNER_LEAK %',r;end if;
 raise notice 'PASS P4 service owner refund netting and isolation';
end $s$;
rollback;

insert into public.lizhi_finance_records(user_id,kind,id,payload) values
 ('11111111-1111-4111-8111-111111111111','transactions','overrefund-meal',
 '{"type":"income","date":"2026-12-02","amount":1400,"accountId":"cash","refundOfTransactionId":"meal","refundVerified":true}');
begin;
set local role service_role;
do $s$
declare r jsonb;
begin
 r:=public.lizhi_finance_budget_site_spending(
  '11111111-1111-4111-8111-111111111111','2026-11');
 if (r->>'used')::numeric<>2200 or (r->>'counted_linked_refunds')::int<>1
 then raise exception 'P4_OVER_REFUND_GROUP_FAIL %',r; end if;
 raise notice 'PASS P4 over-refund source entirely excluded';
end $s$;
rollback;
\echo P4_ISOLATED_POSTGRES_PASS
