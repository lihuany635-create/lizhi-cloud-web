-- Finance P3 candidate ONLY. Requires P1 and P2 isolated migrations.
-- NEVER run against the production Supabase project without separate owner approval.
-- Adds no actual transfers, brokerage trades, card payments or expense transactions.
begin;

create table public.lizhi_finance_salary_plan_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload jsonb not null,
  receipt jsonb,
  created_at timestamptz not null default clock_timestamp(),
  primary key(user_id,request_id)
);
alter table public.lizhi_finance_salary_plan_requests enable row level security;
revoke all on public.lizhi_finance_salary_plan_requests from public,anon,authenticated;
grant select,insert,update on public.lizhi_finance_salary_plan_requests to service_role;
-- An explicit service-only grant is necessary because P1/P2 revoke PUBLIC.
grant select on public.lizhi_finance_goals,public.lizhi_finance_goal_events,
  public.lizhi_finance_sinking_funds,public.lizhi_finance_salary_plans to service_role;
grant insert,update on public.lizhi_finance_salary_plans to service_role;
grant select on public.lizhi_finance_records to service_role;

-- One bounded SQL RPC, avoiding full transaction or account-detail returns.
create or replace function public.lizhi_finance_p3_month_report(p_owner uuid,p_month text)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v_plan jsonb;v_goals jsonb;v_funds jsonb;v_n integer;
begin
  if p_owner is null or p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then
    raise exception 'GOALS_INVALID_ARGS' using errcode='23514'; end if;
  select jsonb_build_object('id',p.id,'estimated_income',p.expected_income,
    'lines',p.lines,'version',p.version)
    into v_plan from public.lizhi_finance_salary_plans p
    where p.user_id=p_owner and p.month=p_month and p.deleted_at is null;
  select count(*) into v_n from public.lizhi_finance_goals g
    where g.user_id=p_owner and g.month=p_month and g.deleted_at is null;
  if v_n>50 then raise exception 'GOALS_REPORT_LIMIT' using errcode='23514'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id',g.id,'kind',g.goal_kind,'target_amount',g.target_amount,'version',g.version,
      'account_id',g.account_id,
      'user_confirmed_reserved',coalesce((
        select sum(case when e.event_kind='allocate' then e.amount else -e.amount end)
        from public.lizhi_finance_goal_events e
        where e.user_id=p_owner and e.goal_id=g.id),0)
    ) order by g.goal_kind,g.id),'[]'::jsonb) into v_goals
    from public.lizhi_finance_goals g
    where g.user_id=p_owner and g.month=p_month and g.deleted_at is null;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',f.id,'purpose',f.purpose,'cadence_months',f.cadence_months,
    'monthly_contribution',f.monthly_contribution,'due_amount',f.due_amount,
    'due_month',f.due_month
  ) order by f.purpose,f.id),'[]'::jsonb) into v_funds
    from public.lizhi_finance_sinking_funds f
    join public.lizhi_finance_goals g
      on g.user_id=f.user_id and g.id=f.id and g.deleted_at is null
    where f.user_id=p_owner and g.month=p_month and f.deleted_at is null;
  return jsonb_build_object('month',p_month,'source','finance_goals_cloud_snapshot',
    'plan',v_plan,'goals',v_goals,'funds',v_funds);
end $$;

create or replace function public.lizhi_finance_p3_salary_get(p_owner uuid,p_month text)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v_plan jsonb;
begin
  if p_owner is null or p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then
    raise exception 'GOALS_INVALID_ARGS' using errcode='23514'; end if;
  select jsonb_build_object('id',p.id,'estimated_income',p.expected_income,
    'lines',p.lines,'version',p.version)
    into v_plan from public.lizhi_finance_salary_plans p
    where p.user_id=p_owner and p.month=p_month and p.deleted_at is null;
  return jsonb_build_object('month',p_month,'source','finance_goals_cloud_snapshot','plan',v_plan);
end $$;

create or replace function public.lizhi_finance_p3_salary_set(
  p_owner uuid,p_month text,p_request_id uuid,p_expected_version bigint,
  p_action text,p_income bigint,p_lines jsonb
)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_payload jsonb;v_previous record;v_existing public.lizhi_finance_salary_plans%rowtype;
declare v_version bigint;v_status text;v_receipt jsonb;
begin
  if p_owner is null or p_request_id is null
     or p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'
     or p_action not in ('set','remove')
     or p_expected_version is null or p_expected_version<0
  then raise exception 'GOALS_INVALID_ARGS' using errcode='23514'; end if;
  if (p_action='set' and (p_income is null or p_income<0 or p_lines is null))
     or (p_action='remove' and (p_income is not null or p_lines is not null))
  then raise exception 'GOALS_INVALID_ARGS' using errcode='23514'; end if;
  v_payload=jsonb_build_object('owner',p_owner,'month',p_month,'action',p_action,
    'expected_version',p_expected_version,'income',p_income,'lines',p_lines);
  -- Insert the idempotency claim first. This also serialises requests with the
  -- same UUID across concurrent attempts, with no duplicate side effects.
  insert into public.lizhi_finance_salary_plan_requests(user_id,request_id,payload)
  values(p_owner,p_request_id,v_payload)
  on conflict(user_id,request_id) do nothing;
  select * into v_previous from public.lizhi_finance_salary_plan_requests
    where user_id=p_owner and request_id=p_request_id for update;
  if v_previous.payload<>v_payload then
    raise exception 'GOALS_DUPLICATE_REQUEST' using errcode='23514'; end if;
  if v_previous.receipt is not null then
    return jsonb_set(v_previous.receipt,'{status}','"already_applied"'::jsonb);
  end if;
  -- Serialise concurrent first-writes to the same owner/month. Otherwise a
  -- race on the UNIQUE index can leak a low-level unique_violation instead of CAS.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_owner::text||':'||p_month,0));
  select * into v_existing from public.lizhi_finance_salary_plans p
    where p.user_id=p_owner and p.month=p_month for update;
  if found then
    if v_existing.version<>p_expected_version
       or (v_existing.deleted_at is not null and p_action='remove') then
      raise exception 'GOALS_VERSION_CONFLICT' using errcode='23514'; end if;
    if p_action='set' then
      update public.lizhi_finance_salary_plans p
        set expected_income=p_income,lines=p_lines,
          deleted_at=null,version=p.version+1
        where p.id=v_existing.id returning p.version into v_version;
      v_status=case when v_existing.deleted_at is not null
        then 'restored' else 'updated' end;
    else
      update public.lizhi_finance_salary_plans p
        set deleted_at=clock_timestamp(),version=p.version+1
        where p.id=v_existing.id returning p.version into v_version;
      v_status='removed';
    end if;
  else
    if p_action<>'set' then
      raise exception 'GOALS_NOT_FOUND' using errcode='23514'; end if;
    if p_expected_version<>0 then
      raise exception 'GOALS_VERSION_CONFLICT' using errcode='23514'; end if;
    insert into public.lizhi_finance_salary_plans(
      user_id,month,expected_income,lines
    ) values(p_owner,p_month,p_income,p_lines) returning version into v_version;
    v_status='created';
  end if;
  v_receipt=jsonb_build_object(
    'month',p_month,'request_id',p_request_id,'version',v_version,
    'status',v_status,'committed',true,
    'source','finance_goals_cloud_snapshot');
  update public.lizhi_finance_salary_plan_requests
    set receipt=v_receipt where user_id=p_owner and request_id=p_request_id;
  return v_receipt;
end $$;

revoke all on function public.lizhi_finance_p3_month_report(uuid,text) from public,anon,authenticated;
revoke all on function public.lizhi_finance_p3_salary_get(uuid,text) from public,anon,authenticated;
revoke all on function public.lizhi_finance_p3_salary_set(uuid,text,uuid,bigint,text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.lizhi_finance_p3_month_report(uuid,text) to service_role;
grant execute on function public.lizhi_finance_p3_salary_get(uuid,text) to service_role;
grant execute on function public.lizhi_finance_p3_salary_set(uuid,text,uuid,bigint,text,bigint,jsonb) to service_role;

-- Candidate callable by original private Site after approved P3 wiring only.
-- Goal plans are not actual bank or securities transactions.
commit;
