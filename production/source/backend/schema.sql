create table public.lizhi_production_state (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1 check (revision > 0),
 data jsonb not null check (jsonb_typeof(data)='object' and jsonb_typeof(data->'rows')='array'),
 updated_at timestamptz not null default now()
);
alter table public.lizhi_production_state enable row level security;
revoke all on public.lizhi_production_state from anon, authenticated;
grant select on public.lizhi_production_state to authenticated;
grant all on public.lizhi_production_state to service_role;
create policy production_owner_read on public.lizhi_production_state for select to authenticated using ((select auth.uid())=owner_id);
create table public.lizhi_production_ai_keys (
 key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
 owner_id uuid not null references auth.users(id) on delete cascade,
 chatgpt_owner text not null,
 created_at timestamptz not null default now()
);
alter table public.lizhi_production_ai_keys enable row level security;
revoke all on public.lizhi_production_ai_keys from anon, authenticated;
grant all on public.lizhi_production_ai_keys to service_role;
create index production_ai_owner_idx on public.lizhi_production_ai_keys(owner_id);
