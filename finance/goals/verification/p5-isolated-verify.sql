\set ON_ERROR_STOP on
-- Disposable PostgreSQL only. P1→P4 fixtures and candidate P5 migration.
\ir p4-isolated-security.sql
\ir ../sql/p5-full-goals-candidate.sql

do $$
begin
 if has_function_privilege('anon',
   'public.lizhi_finance_p5_goal_set(uuid,text,uuid,uuid,bigint,text,text,bigint,text,text,integer,bigint,text)','execute')
   or has_function_privilege('authenticated',
   'public.lizhi_finance_p5_allocation_set(uuid,text,uuid,uuid,text,bigint,text,boolean)','execute')
   or has_table_privilege('authenticated','public.lizhi_finance_goal_requests','select')
   or has_table_privilege('authenticated','public.lizhi_finance_goals','insert')
   or has_table_privilege('authenticated','public.lizhi_finance_goals','update')
   or has_table_privilege('authenticated','public.lizhi_finance_goal_events','insert')
   or has_table_privilege('authenticated','public.lizhi_finance_salary_plans','update')
   or has_table_privilege('authenticated','public.lizhi_finance_sinking_funds','insert')
 then raise exception 'P5_SERVICE_ROLE_EXPOSURE';end if;
end $$;

set role service_role;
do $$
declare owner uuid:='11111111-1111-4111-8111-111111111111';
declare goal uuid:='99999999-2222-4222-8222-999999999999';
declare req uuid:='99999999-1111-4111-8111-999999999999';
declare x jsonb;
begin
 x:=public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,req,
  0,'create','savings',5000,null,null,null,null,null);
 if x->>'status'<>'created' or (x->>'version')::int<>1
 then raise exception 'P5_GOAL_CREATE_FAILED';end if;
 x:=public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,req,
  0,'create','savings',5000,null,null,null,null,null);
 if x->>'status'<>'already_applied' then raise exception 'P5_IDEMPOTENCY_FAILED';end if;
 begin
   perform public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,req,
      0,'create','savings',6000,null,null,null,null,null);
   raise exception 'P5_PAYLOAD_CONFLICT_NOT_BLOCKED';
 exception when check_violation then null;
 end;
 begin
   perform public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
      '11111111-2222-4222-8222-111111111111',
      0,'update','savings',6000,null,null,null,null,null);
   raise exception 'P5_CAS_NOT_BLOCKED';
 exception when check_violation then null;
 end;
 x:=public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
  '22222222-2222-4222-8222-222222222222',
  1,'update','savings',5500,null,null,null,null,null);
 if x->>'status'<>'updated' or (x->>'version')::int<>2
 then raise exception 'P5_GOAL_UPDATE_FAILED';end if;
 begin
   perform public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
     '33333333-2222-4222-8222-333333333333',2,'update',
      'investible_cash',5500,null,null,null,null,null);
   raise exception 'P5_KIND_CHANGE_ALLOWED';
 exception when check_violation then null;
 end;
 begin
   perform public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
     '44444444-2222-4222-8222-444444444444',2,'update',
      'savings',5500,'other-owner-id',null,null,null,null);
   raise exception 'P5_FOREIGN_ACCOUNT_ALLOWED';
 exception when check_violation then null;
 end;
end $$;

-- Test new goal allocation with explicit user-confirmed source slice.
do $$
declare owner uuid:='11111111-1111-4111-8111-111111111111';
declare goal uuid:='99999999-2222-4222-8222-999999999999';
declare event uuid:='55555555-2222-4222-8222-555555555555';
declare x jsonb;
begin
 x:=public.lizhi_finance_p5_allocation_set(owner,'2026-12',goal,
   event,'allocate',3000,'salary-dec-p5-goal-slice',true);
 if x->>'status'<>'recorded' or x->>'bank_verified'<>'false' then
   raise exception 'P5_ALLOCATION_FAILED';end if;
 x:=public.lizhi_finance_p5_allocation_set(owner,'2026-12',goal,
   event,'allocate',3000,'salary-dec-p5-goal-slice',true);
 if x->>'status'<>'already_applied' then raise exception 'P5_ALLOCATION_RETRY_FAILED';end if;
 begin
   perform public.lizhi_finance_p5_allocation_set(owner,'2026-12',goal,
      event,'allocate',2000,'salary-dec-p5-goal-slice',true);
   raise exception 'P5_ALLOCATION_ID_COLLISION_ALLOWED';
 exception when check_violation then null;
 end;
 begin
   perform public.lizhi_finance_p5_allocation_set(owner,'2026-12',goal,
      '66666666-2222-4222-8222-666666666666',
      'release',3001,'salary-dec-p5-goal-slice',true);
   raise exception 'P5_EXCESS_RELEASE_ALLOWED';
 exception when check_violation then null;
 end;
 x:=public.lizhi_finance_p5_allocation_set(owner,'2026-12',goal,
   '77777777-2222-4222-8222-777777777777',
   'release',1000,'salary-dec-p5-goal-slice',true);
 if x->>'status'<>'recorded' then raise exception 'P5_RELEASE_FAILED';end if;
 begin
   perform public.lizhi_finance_p5_allocation_set(owner,'2026-12',goal,
      '88888888-2222-4222-8222-888888888888',
      'allocate',1000,'salary-dec-p5-goal-slice',true);
   raise exception 'P5_DUPLICATE_SOURCE_ALLOWED';
 exception when unique_violation then null;
 end;
end $$;


-- Funds cannot be hidden by deactivating a goal while reservations remain.
do $
declare owner uuid:='11111111-1111-4111-8111-111111111111';
declare goal uuid:='99999999-2222-4222-8222-999999999999';
declare result jsonb;
begin
 begin
   perform public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
     'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa',2,'remove',
     null,null,null,null,null,null,null);
   raise exception 'P5_FUNDED_GOAL_REMOVAL_ALLOWED';
 exception when check_violation then null;
 end;
 result:=public.lizhi_finance_p5_allocation_set(owner,'2026-12',goal,
   '99999999-aaaa-4aaa-8aaa-999999999999','release',2000,
   'salary-dec-p5-goal-slice',true);
 if result->>'status'<>'recorded' then
   raise exception 'P5_FULL_RELEASE_FAILED';end if;
end $;

-- Create and edit sinking fund atomically, retaining its original purpose.
do $$
declare owner uuid:='11111111-1111-4111-8111-111111111111';
declare goal uuid:='55555555-4444-4444-8444-555555555555';
declare x jsonb;
begin
 x:=public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
 '11111111-5555-4555-8555-111111111111',0,
 'create','sinking_fund',7000,null,'rent',3,null,null);
 if x->>'status'<>'created' then raise exception 'P5_FUND_CREATE_FAILED';end if;
 if not exists(select 1 from public.lizhi_finance_sinking_funds
   where id=goal and monthly_contribution=7000 and purpose='rent')
 then raise exception 'P5_FUND_NOT_ATTACHED';end if;
 x:=public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
 '22222222-5555-4555-8555-222222222222',1,
 'update','sinking_fund',7100,null,'rent',3,21300,'2027-02');
 if x->>'status'<>'updated' then raise exception 'P5_FUND_UPDATE_FAILED';end if;
 if not exists(select 1 from public.lizhi_finance_sinking_funds
   where id=goal and monthly_contribution=7100 and due_amount=21300
     and due_month='2027-02')
 then raise exception 'P5_FUND_METADATA_NOT_SYNCED';end if;
 begin
  perform public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
    '33333333-5555-4555-8555-333333333333',2,
    'update','sinking_fund',7100,null,'insurance',12,22000,'2027-02');
  raise exception 'P5_FUND_PURPOSE_CHANGE_ALLOWED';
 exception when check_violation then null;
 end;
end $$;

do $$
declare owner uuid:='11111111-1111-4111-8111-111111111111';
declare goal uuid:='99999999-2222-4222-8222-999999999999';
declare x jsonb;
begin
 x:=public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
 '99999999-3333-4333-8333-999999999999',
 2,'remove',null,null,null,null,null,null,null);
 if x->>'status'<>'removed' or (x->>'version')::int<>3
 then raise exception 'P5_SOFT_REMOVE_FAILED';end if;
 begin
   perform public.lizhi_finance_p5_allocation_set(owner,'2026-12',goal,
   '99999999-4444-4444-8444-999999999999',
   'allocate',100,'no-allocations-to-deleted-goal',true);
   raise exception 'P5_DELETED_GOAL_ALLOWED_ALLOCATION';
 exception when check_violation then null;
 end;
 if exists(select 1 from public.lizhi_finance_goals
   where user_id=owner and id=goal and deleted_at is null)
 then raise exception 'P5_REMOVED_GOAL_VISIBLE';end if;
 if (select count(*) from public.lizhi_finance_goal_events
   where goal_id=goal)<>3 then raise exception 'P5_EVENTS_CHANGED';end if;
end $$;


-- The metadata for an empty protected fund must soft-delete in the same operation.
do $
declare owner uuid:='11111111-1111-4111-8111-111111111111';
declare goal uuid:='55555555-4444-4444-8444-555555555555';
declare result jsonb;
begin
 result:=public.lizhi_finance_p5_goal_set(owner,'2026-12',goal,
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc',2,'remove',
   null,null,null,null,null,null,null);
 if result->>'status'<>'removed' or exists(
   select 1 from public.lizhi_finance_sinking_funds
   where id=goal and deleted_at is null) then
   raise exception 'P5_PROTECTED_FUND_SOFT_DELETE_INCONSISTENT';end if;
end $;

-- Read-only month report cannot expose disabled goal.
do $$
declare r jsonb;
begin
 r:=public.lizhi_finance_p3_month_report(
 '11111111-1111-4111-8111-111111111111','2026-12');
 if exists(select 1 from jsonb_array_elements(r->'goals') as x
   where x->>'id'='99999999-2222-4222-8222-999999999999') then
   raise exception 'P5_SOFT_REMOVED_IN_MONTH_REPORT';end if;
end $$;
reset role;
select 'P5_ISOLATED_SQL_PASS' as result;
