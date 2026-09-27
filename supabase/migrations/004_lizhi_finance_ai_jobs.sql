-- Phase 6B: short-lived Finance AI jobs relayed through the authenticated user's browser host.
create table if not exists public.lizhi_finance_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null check (char_length(request_id) between 1 and 120),
  raw_text text not null check (char_length(raw_text) between 1 and 300),
  request_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  host_id text,
  result_payload jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  unique (user_id, request_id)
);

create index if not exists lizhi_finance_ai_jobs_pending_idx
  on public.lizhi_finance_ai_jobs (user_id, status, created_at);

alter table public.lizhi_finance_ai_jobs enable row level security;

drop policy if exists "finance_ai_jobs_owner_select" on public.lizhi_finance_ai_jobs;
create policy "finance_ai_jobs_owner_select"
on public.lizhi_finance_ai_jobs
for select to authenticated
using (user_id = auth.uid() and public.lizhi_web_is_allowed());

drop policy if exists "finance_ai_jobs_owner_insert" on public.lizhi_finance_ai_jobs;
create policy "finance_ai_jobs_owner_insert"
on public.lizhi_finance_ai_jobs
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.lizhi_web_is_allowed()
  and status = 'pending'
  and host_id is null
  and result_payload is null
  and error_code is null
);

drop policy if exists "finance_ai_jobs_owner_update" on public.lizhi_finance_ai_jobs;
create policy "finance_ai_jobs_owner_update"
on public.lizhi_finance_ai_jobs
for update to authenticated
using (user_id = auth.uid() and public.lizhi_web_is_allowed())
with check (user_id = auth.uid() and public.lizhi_web_is_allowed());

create table if not exists public.lizhi_finance_ai_hosts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  host_id text not null check (char_length(host_id) between 1 and 120),
  status text not null default 'online'
    check (status in ('online', 'busy', 'offline')),
  version text,
  last_seen_at timestamptz not null default now()
);

alter table public.lizhi_finance_ai_hosts enable row level security;

drop policy if exists "finance_ai_hosts_owner_select" on public.lizhi_finance_ai_hosts;
create policy "finance_ai_hosts_owner_select"
on public.lizhi_finance_ai_hosts
for select to authenticated
using (user_id = auth.uid() and public.lizhi_web_is_allowed());

drop policy if exists "finance_ai_hosts_owner_insert" on public.lizhi_finance_ai_hosts;
create policy "finance_ai_hosts_owner_insert"
on public.lizhi_finance_ai_hosts
for insert to authenticated
with check (user_id = auth.uid() and public.lizhi_web_is_allowed());

drop policy if exists "finance_ai_hosts_owner_update" on public.lizhi_finance_ai_hosts;
create policy "finance_ai_hosts_owner_update"
on public.lizhi_finance_ai_hosts
for update to authenticated
using (user_id = auth.uid() and public.lizhi_web_is_allowed())
with check (user_id = auth.uid() and public.lizhi_web_is_allowed());

create or replace function public.lizhi_claim_finance_ai_job(p_host_id text)
returns setof public.lizhi_finance_ai_jobs
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.lizhi_web_is_allowed() then
    raise exception 'USER_NOT_ALLOWED' using errcode = '42501';
  end if;
  if nullif(btrim(p_host_id), '') is null or char_length(p_host_id) > 120 then
    raise exception 'INVALID_HOST_ID' using errcode = '22023';
  end if;

  select id into v_id
  from public.lizhi_finance_ai_jobs
  where user_id = auth.uid()
    and status = 'pending'
    and expires_at > now()
  order by created_at
  for update skip locked
  limit 1;

  if v_id is null then
    return;
  end if;

  update public.lizhi_finance_ai_jobs
  set status = 'processing',
      host_id = p_host_id,
      claimed_at = now(),
      updated_at = now()
  where id = v_id
    and user_id = auth.uid()
    and status = 'pending';

  return query
  select * from public.lizhi_finance_ai_jobs where id = v_id and user_id = auth.uid();
end;
$$;

revoke all on public.lizhi_finance_ai_jobs from anon;
revoke all on public.lizhi_finance_ai_hosts from anon;
grant select, insert, update on public.lizhi_finance_ai_jobs to authenticated;
grant select, insert, update on public.lizhi_finance_ai_hosts to authenticated;
revoke all on function public.lizhi_claim_finance_ai_job(text) from public;
grant execute on function public.lizhi_claim_finance_ai_job(text) to authenticated;

