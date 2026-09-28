-- Phase 8: user-owned Finance ledger sync. Apply through the Supabase migration workflow.
create table if not exists public.lizhi_finance_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('accounts', 'creditCards', 'categories', 'transactions')),
  id text not null check (char_length(id) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 65536),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, kind, id),
  check (updated_at >= created_at)
);

create index if not exists lizhi_finance_records_user_updated_idx
  on public.lizhi_finance_records (user_id, updated_at desc);

alter table public.lizhi_finance_records enable row level security;

drop policy if exists "finance_select_own" on public.lizhi_finance_records;
create policy "finance_select_own"
  on public.lizhi_finance_records for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "finance_insert_own" on public.lizhi_finance_records;
create policy "finance_insert_own"
  on public.lizhi_finance_records for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "finance_update_own" on public.lizhi_finance_records;
create policy "finance_update_own"
  on public.lizhi_finance_records for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "finance_delete_own" on public.lizhi_finance_records;
create policy "finance_delete_own"
  on public.lizhi_finance_records for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.lizhi_finance_records from anon;
grant select, insert, update, delete on table public.lizhi_finance_records to authenticated;
