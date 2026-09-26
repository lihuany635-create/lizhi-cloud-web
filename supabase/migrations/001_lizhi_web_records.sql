-- Dedicated tables for the new 立之雲端庫 website.
-- This migration does not alter any existing project tables.
create table if not exists public.lizhi_web_records (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

alter table public.lizhi_web_records enable row level security;

create or replace function public.lizhi_web_is_allowed()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'lihuany63@gmail.com';
$$;

drop policy if exists "lizhi_web_records_owner_select" on public.lizhi_web_records;
create policy "lizhi_web_records_owner_select" on public.lizhi_web_records
  for select to authenticated using (user_id = auth.uid() and public.lizhi_web_is_allowed());

drop policy if exists "lizhi_web_records_owner_insert" on public.lizhi_web_records;
create policy "lizhi_web_records_owner_insert" on public.lizhi_web_records
  for insert to authenticated with check (user_id = auth.uid() and public.lizhi_web_is_allowed());

drop policy if exists "lizhi_web_records_owner_update" on public.lizhi_web_records;
create policy "lizhi_web_records_owner_update" on public.lizhi_web_records
  for update to authenticated using (user_id = auth.uid() and public.lizhi_web_is_allowed()) with check (user_id = auth.uid() and public.lizhi_web_is_allowed());

drop policy if exists "lizhi_web_records_owner_delete" on public.lizhi_web_records;
create policy "lizhi_web_records_owner_delete" on public.lizhi_web_records
  for delete to authenticated using (user_id = auth.uid() and public.lizhi_web_is_allowed());

create index if not exists lizhi_web_records_user_updated_idx
  on public.lizhi_web_records (user_id, updated_at desc);
