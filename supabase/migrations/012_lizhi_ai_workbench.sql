-- 立之 AI 工作台 v2（三角色協作：專案經理／顧問／工程師）
-- 工作台只放待辦、勾選與完成狀態；詳細內容在 Google Drive 報告書，這裡只存連結。
-- 所有讀寫經 Edge Function lizhi-ai-workbench（service role）；RLS 開啟且不開放直接存取。

create table if not exists public.aiwb_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null check (char_length(title) between 1 and 120),
  goal text not null default '' check (char_length(goal) <= 2000),
  drive_folder_url text check (drive_folder_url is null or drive_folder_url ~ '^https://'),
  archived boolean not null default false,
  task_seq integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.aiwb_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  project_id uuid not null references public.aiwb_projects(id),
  code text not null,
  title text not null check (char_length(title) between 1 and 200),
  assignee text not null check (assignee in ('manager','advisor','engineer','user')),
  status text not null default 'todo' check (status in ('todo','doing','blocked','review','done')),
  next_step text not null default '' check (char_length(next_step) <= 1000),
  needs_approval boolean not null default false,
  approval_reason text not null default '' check (char_length(approval_reason) <= 1000),
  approved_at timestamptz,
  approval_note text not null default '' check (char_length(approval_note) <= 1000),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);
create index if not exists aiwb_tasks_owner_status on public.aiwb_tasks(owner_id, status);

create table if not exists public.aiwb_checks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  task_id uuid not null references public.aiwb_tasks(id),
  position integer not null,
  text text not null check (char_length(text) between 1 and 300),
  checked boolean not null default false,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://'),
  checked_by text,
  checked_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists aiwb_checks_task on public.aiwb_checks(task_id, position);

create table if not exists public.aiwb_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  task_id uuid not null references public.aiwb_tasks(id),
  role text not null check (role in ('manager','advisor','engineer')),
  kind text not null check (kind in ('dispatch','analysis','execution','blocked','acceptance')),
  title text not null check (char_length(title) between 1 and 200),
  version text not null default 'v1' check (char_length(version) <= 20),
  url text not null check (url ~ '^https://'),
  created_at timestamptz not null default now()
);
create index if not exists aiwb_reports_task on public.aiwb_reports(task_id, created_at);

create table if not exists public.aiwb_notices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  task_id uuid not null references public.aiwb_tasks(id),
  report_id uuid references public.aiwb_reports(id),
  from_role text not null check (from_role in ('manager','advisor','engineer')),
  to_role text not null check (to_role in ('manager','advisor','engineer','user')),
  next_step text not null check (char_length(next_step) between 1 and 500),
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 120),
  status text not null default 'sent' check (status in ('sent','read')),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_id, dedupe_key)
);
create index if not exists aiwb_notices_inbox on public.aiwb_notices(owner_id, to_role, status);

create table if not exists public.aiwb_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null,
  project_id uuid,
  task_id uuid,
  actor text not null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index if not exists aiwb_events_task on public.aiwb_events(task_id, at);

-- 事件紀錄只能新增，不能改寫或刪除（計畫書：不得刪除過往紀錄）
create or replace function public.aiwb_events_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'aiwb_events is append-only';
end $$;
drop trigger if exists aiwb_events_no_change on public.aiwb_events;
create trigger aiwb_events_no_change before update or delete on public.aiwb_events
  for each row execute function public.aiwb_events_append_only();

-- 任務代號 TASK-001 依專案遞增
create or replace function public.aiwb_next_task_code(p_project uuid, p_owner uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  update public.aiwb_projects set task_seq = task_seq + 1, updated_at = now()
    where id = p_project and owner_id = p_owner and not archived
    returning task_seq into n;
  if n is null then raise exception 'project not found'; end if;
  return 'TASK-' || lpad(n::text, 3, '0');
end $$;
revoke all on function public.aiwb_next_task_code(uuid, uuid) from public, anon, authenticated;

alter table public.aiwb_projects enable row level security;
alter table public.aiwb_tasks enable row level security;
alter table public.aiwb_checks enable row level security;
alter table public.aiwb_reports enable row level security;
alter table public.aiwb_notices enable row level security;
alter table public.aiwb_events enable row level security;
revoke all on public.aiwb_projects, public.aiwb_tasks, public.aiwb_checks, public.aiwb_reports, public.aiwb_notices, public.aiwb_events from anon, authenticated;
