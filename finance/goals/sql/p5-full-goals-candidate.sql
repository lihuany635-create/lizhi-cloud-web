-- Finance P5 isolated migration candidate. Depends on P1/P2/P3 candidates.
-- No production execution without separate owner approval.
begin;
create table public.lizhi_finance_goal_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null, payload jsonb not null, receipt jsonb,
 created_at timestamptz not null default clock_timestamp(),
 primary key(user_id,request_id)
);
alter table public.lizhi_finance_goal_requests enable row level security;
revoke all on public.lizhi_finance_goal_requests from public,anon,authenticated;
grant select,insert,update on public.lizhi_finance_goal_requests to service_role;
grant insert,update on public.lizhi_finance_goals,
 public.lizhi_finance_sinking_funds to service_role;
grant insert on public.lizhi_finance_goal_events to service_role;

create or replace function public.lizhi_finance_p5_goal_set(
 p_owner uuid,p_month text,p_goal_id uuid,p_request_id uuid,
 p_expected_version bigint,p_action text,p_kind text,p_target bigint,
 p_account text,p_purpose text,p_cadence integer,p_due_amount bigint,p_due_month text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_payload jsonb;v_request public.lizhi_finance_goal_requests%rowtype;
declare v_goal public.lizhi_finance_goals%rowtype;v_status text;v_version bigint;
declare v_result jsonb;
begin
 if p_owner is null or p_goal_id is null or p_request_id is null
    or p_month is null or p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'
    or p_expected_version is null or p_expected_version<0
    or p_action not in ('create','update','remove') then
    raise exception 'GOALS_INVALID_ARGS' using errcode='23514';end if;
 if p_action='remove' then
   if p_kind is not null or p_target is not null or p_account is not null
     or p_purpose is not null or p_cadence is not null
     or p_due_amount is not null or p_due_month is not null
     then raise exception 'GOALS_INVALID_ARGS' using errcode='23514';end if;
 else
   if p_kind not in ('savings','investible_cash','sinking_fund') or
      p_kind is null or p_target is null or p_target<0 or p_target>9007199254740991
      or (p_account is not null and length(p_account) not between 1 and 160)
      or (p_action='create' and p_expected_version<>0)
      or (p_action='update' and p_expected_version=0) then
      raise exception 'GOALS_INVALID_GOAL' using errcode='23514';end if;
   if p_kind='sinking_fund' then
      if not ((p_purpose='rent' and p_cadence=3) or
              (p_purpose='insurance' and p_cadence=12))
        or (p_due_amount is not null and (p_due_amount<0 or p_due_amount>9007199254740991))
        or (p_due_month is not null and p_due_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$')
      then raise exception 'GOALS_INVALID_FUND' using errcode='23514';end if;
   elsif p_purpose is not null or p_cadence is not null or
         p_due_amount is not null or p_due_month is not null then
     raise exception 'GOALS_INVALID_GOAL' using errcode='23514';
   end if;
   if not public.lizhi_finance_p2_account_is_owned(p_owner,p_account) then
     raise exception 'GOALS_ACCOUNT_NOT_OWNED' using errcode='23514';end if;
 end if;
 v_payload:=pg_catalog.jsonb_build_array(p_owner,p_month,p_goal_id,
   p_request_id,p_expected_version,p_action,p_kind,p_target,p_account,
   p_purpose,p_cadence,p_due_amount,p_due_month);
 insert into public.lizhi_finance_goal_requests(user_id,request_id,payload)
 values(p_owner,p_request_id,v_payload) on conflict(user_id,request_id) do nothing;
 select * into v_request from public.lizhi_finance_goal_requests
 where user_id=p_owner and request_id=p_request_id for update;
 if v_request.payload<>v_payload then
    raise exception 'GOALS_DUPLICATE_REQUEST' using errcode='23514';end if;
 if v_request.receipt is not null then
   return pg_catalog.jsonb_set(v_request.receipt,'{status}','"already_applied"'::jsonb);
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_owner::text||':goal:'||p_goal_id::text,0));
 select * into v_goal from public.lizhi_finance_goals
 where user_id=p_owner and id=p_goal_id for update;
 if p_action='create' then
    if found then raise exception 'GOALS_VERSION_CONFLICT' using errcode='23514';end if;
    insert into public.lizhi_finance_goals
       (id,user_id,month,goal_kind,target_amount,account_id)
    values(p_goal_id,p_owner,p_month,p_kind,p_target,p_account)
    returning version into v_version;
    if p_kind='sinking_fund' then
       insert into public.lizhi_finance_sinking_funds
         (id,user_id,purpose,cadence_months,monthly_contribution,
           due_amount,due_month,account_id)
       values(p_goal_id,p_owner,p_purpose,p_cadence,p_target,p_due_amount,p_due_month,p_account);
    end if;
    v_status='created';
 else
    if not found or v_goal.month<>p_month or v_goal.deleted_at is not null
       or v_goal.version<>p_expected_version then
       raise exception 'GOALS_VERSION_CONFLICT' using errcode='23514';end if;
    if p_action='remove' then
       -- Do not hide actively reserved money by soft-removing its goal.
       -- Source slices must first be explicitly released, leaving audit events.
       if exists (
         select 1 from public.lizhi_finance_goal_events e
           where e.user_id=p_owner and e.goal_id=p_goal_id
         having coalesce(sum(case when e.event_kind='allocate'
           then e.amount::numeric else -e.amount::numeric end),0)<>0
       ) then
         raise exception 'GOALS_RESERVE_NOT_RELEASED' using errcode='23514';
       end if;
       -- A protected-purpose fund is deactivated while the linked goal is
       -- still active, because the P2 fund trigger checks the live parent.
       if v_goal.goal_kind='sinking_fund' then
         update public.lizhi_finance_sinking_funds f
           set deleted_at=pg_catalog.clock_timestamp(),version=f.version+1
           where f.id=p_goal_id and f.user_id=p_owner and f.deleted_at is null;
       end if;
       update public.lizhi_finance_goals g
       set deleted_at=pg_catalog.clock_timestamp(),version=g.version+1
       where g.id=p_goal_id and g.user_id=p_owner
       returning g.version into v_version;
       v_status='removed';
    else
       if v_goal.goal_kind<>p_kind then
          raise exception 'GOALS_KIND_IMMUTABLE' using errcode='23514';end if;
       if p_kind='sinking_fund' and not exists(
         select 1 from public.lizhi_finance_sinking_funds f
         where f.user_id=p_owner and f.id=p_goal_id and f.deleted_at is null
         and f.purpose=p_purpose and f.cadence_months=p_cadence) then
         raise exception 'GOALS_FUND_SCOPE_IMMUTABLE' using errcode='23514';end if;
       update public.lizhi_finance_goals g
       set target_amount=p_target,account_id=p_account,version=g.version+1
       where g.id=p_goal_id and g.user_id=p_owner
       returning g.version into v_version;
       if p_kind='sinking_fund' then
         update public.lizhi_finance_sinking_funds f
         set monthly_contribution=p_target,account_id=p_account,
           due_amount=p_due_amount,due_month=p_due_month,version=f.version+1
         where f.id=p_goal_id and f.user_id=p_owner;
       end if;
       v_status='updated';
    end if;
 end if;
 v_result:=pg_catalog.jsonb_build_object('month',p_month,
   'source','finance_goals_cloud_snapshot','goal_id',p_goal_id,
   'request_id',p_request_id,'version',v_version,
   'status',v_status,'committed',true,'actual_transfer',false);
 update public.lizhi_finance_goal_requests set receipt=v_result
  where user_id=p_owner and request_id=p_request_id;
 return v_result;
end $$;

create or replace function public.lizhi_finance_p5_allocation_set(
 p_owner uuid,p_month text,p_goal_id uuid,p_request_id uuid,
 p_action text,p_amount bigint,p_source_reference text,p_confirmed boolean
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_goal public.lizhi_finance_goals%rowtype;
declare v_event public.lizhi_finance_goal_events%rowtype;
declare v_result jsonb;
declare v_constraint text;
begin
 if p_owner is null or p_goal_id is null or p_request_id is null
   or p_month is null or p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'
   or p_action not in ('allocate','release')
   or p_amount is null or p_amount<=0 or p_amount>9007199254740991
   or p_source_reference is null or
      length(p_source_reference) not between 1 and 160
   or btrim(p_source_reference)='' or p_confirmed is distinct from true
 then raise exception 'GOALS_INVALID_ALLOCATION' using errcode='23514';end if;
 -- Serialises same-key retries before the append-only P1 trigger executes.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_owner::text||':request:'||p_request_id::text,0));
 select * into v_event from public.lizhi_finance_goal_events
  where user_id=p_owner and request_id=p_request_id;
 if found then
   if v_event.goal_id<>p_goal_id or v_event.event_kind<>p_action or
      v_event.amount<>p_amount or v_event.source_reference<>p_source_reference
      then raise exception 'GOALS_DUPLICATE_REQUEST' using errcode='23514';end if;
   select month into v_goal.month from public.lizhi_finance_goals
     where id=p_goal_id and user_id=p_owner;
   if v_goal.month is distinct from p_month then
      raise exception 'GOALS_DUPLICATE_REQUEST' using errcode='23514';end if;
   return pg_catalog.jsonb_build_object('month',p_month,
     'source','finance_goals_cloud_snapshot','goal_id',p_goal_id,
     'request_id',p_request_id,'status','already_applied',
     'committed',true,'actual_transfer',false);
 end if;
 select * into v_goal from public.lizhi_finance_goals
  where user_id=p_owner and id=p_goal_id and month=p_month
    and deleted_at is null;
 if not found then raise exception 'GOALS_NOT_FOUND' using errcode='23514';end if;
 -- A source slice is intentionally single-use for its lifetime, even after
 -- release; reusing it would obscure the immutable allocation audit chain.
 begin
   insert into public.lizhi_finance_goal_events
     (user_id,goal_id,request_id,event_kind,amount,source_reference,evidence_type)
   values(p_owner,p_goal_id,p_request_id,p_action,p_amount,
      p_source_reference,'user_confirmed');
 exception when unique_violation then
   get stacked diagnostics v_constraint = constraint_name;
   if v_constraint='lizhi_finance_goal_source_once' then
     raise exception 'GOAL_SOURCE_ALREADY_ALLOCATED' using errcode='23505';
   end if;
   raise;
 end;
 v_result:=pg_catalog.jsonb_build_object('month',p_month,
   'source','finance_goals_cloud_snapshot','goal_id',p_goal_id,
   'request_id',p_request_id,'status','recorded','committed',true,
   'actual_transfer',false,'bank_verified',false);
 return v_result;
end $$;
revoke all on function public.lizhi_finance_p5_goal_set(
 uuid,text,uuid,uuid,bigint,text,text,bigint,text,text,integer,bigint,text)
 from public,anon,authenticated;
revoke all on function public.lizhi_finance_p5_allocation_set(
 uuid,text,uuid,uuid,text,bigint,text,boolean)
 from public,anon,authenticated;
grant execute on function public.lizhi_finance_p5_goal_set(
 uuid,text,uuid,uuid,bigint,text,text,bigint,text,text,integer,bigint,text) to service_role;
grant execute on function public.lizhi_finance_p5_allocation_set(
 uuid,text,uuid,uuid,text,bigint,text,boolean) to service_role;

-- Final permission boundary: browser/authenticated clients may read their
-- own goals using existing restrictive RLS, but can never bypass service-side
-- per-request write approval, idempotency receipts, or source checks.
revoke insert,update,delete on public.lizhi_finance_goals from authenticated,anon,public;
revoke insert,update,delete on public.lizhi_finance_sinking_funds from authenticated,anon,public;
revoke insert,update,delete on public.lizhi_finance_salary_plans from authenticated,anon,public;
revoke insert,update,delete on public.lizhi_finance_goal_events from authenticated,anon,public;
commit;
