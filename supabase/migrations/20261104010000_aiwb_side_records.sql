-- 立之 AI 工作台：「其他 AI 紀錄」分頁（三角色以外的任何 AI 都能寫）
-- 工作日誌／交接（aiwb_side_logs）、待辦與勾選（aiwb_side_todos）、其他 AI 的專用金鑰（aiwb_agent_keys）。
-- 只透過 Edge Function（service role）或 Claude 的 Supabase 連接器存取；瀏覽器不直接讀寫。

create table if not exists public.aiwb_agent_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  agent text not null check (char_length(agent) between 1 and 40),
  key_hash text not null unique,
  key_hint text not null default '' check (char_length(key_hint) <= 12),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.aiwb_side_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  agent text not null check (char_length(agent) between 1 and 40),
  project text not null default '' check (char_length(project) <= 80),
  title text not null check (char_length(title) between 1 and 200),
  done text not null default '' check (char_length(done) <= 8000),
  evidence text not null default '' check (char_length(evidence) <= 4000),
  not_done text not null default '' check (char_length(not_done) <= 4000),
  next_step text not null default '' check (char_length(next_step) <= 2000),
  links text[] not null default '{}' check (cardinality(links) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists aiwb_side_logs_owner_idx on public.aiwb_side_logs (owner_id, created_at desc);

create table if not exists public.aiwb_side_todos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  agent text not null check (char_length(agent) between 1 and 40),
  project text not null default '' check (char_length(project) <= 80),
  title text not null check (char_length(title) between 1 and 200),
  status text not null default 'todo' check (status in ('todo','doing','blocked','done')),
  note text not null default '' check (char_length(note) <= 4000),
  checks jsonb not null default '[]'::jsonb check (jsonb_typeof(checks) = 'array' and jsonb_array_length(checks) <= 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists aiwb_side_todos_owner_idx on public.aiwb_side_todos (owner_id, updated_at desc);

alter table public.aiwb_agent_keys enable row level security;
alter table public.aiwb_side_logs enable row level security;
alter table public.aiwb_side_todos enable row level security;
revoke all on public.aiwb_agent_keys, public.aiwb_side_logs, public.aiwb_side_todos from anon, authenticated;
