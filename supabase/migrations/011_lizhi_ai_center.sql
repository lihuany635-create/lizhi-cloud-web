-- AI 處理中心：AI／排程的處理紀錄，以及全站狀態彙整。
create table if not exists public.lizhi_ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  source text not null check (char_length(source) between 1 and 40),     -- library / finance / licut / engineering / site …
  kind text not null default 'run' check (char_length(kind) between 1 and 40),
  status text not null default 'ok' check (status in ('ok', 'warning', 'error')),
  title text not null check (char_length(title) between 1 and 200),
  detail text check (detail is null or char_length(detail) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists lizhi_ai_runs_user_idx on public.lizhi_ai_runs (user_id, created_at desc);

alter table public.lizhi_ai_runs enable row level security;
drop policy if exists "ai_runs_own" on public.lizhi_ai_runs;
create policy "ai_runs_own" on public.lizhi_ai_runs for all to authenticated
  using (user_id = (select auth.uid()) and public.lizhi_web_is_allowed())
  with check (user_id = (select auth.uid()) and public.lizhi_web_is_allowed());
revoke all on table public.lizhi_ai_runs from anon;
grant select, insert, update, delete on table public.lizhi_ai_runs to authenticated;

-- 一次取回全站狀態（依登入者權限執行，只看得到自己的資料）
create or replace function public.lizhi_status_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'generated_at', now(),
    'library', (
      select jsonb_build_object(
        'total', count(*),
        'inbox', count(*) filter (where status = 'inbox'),
        'skipped', count(*) filter (where status = 'skipped'),
        'organized', count(*) filter (where status = 'organized'),
        'shelves', count(distinct shelf) filter (where status = 'organized'),
        'device', count(*) filter (where location = 'device'),
        'cloud', count(*) filter (where location = 'cloud'),
        'cloud_bytes', coalesce(sum(size) filter (where location = 'cloud'), 0),
        'last_upload', max(created_at),
        'last_organized', max(organized_at))
      from public.lizhi_library_items where deleted_at is null),
    'finance', jsonb_build_object(
      'records', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, count(*) n from public.lizhi_finance_records where deleted_at is null group by kind) r),
      'rules', (select count(*) from public.lizhi_finance_rule_memories where deleted_at is null),
      'jobs', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.lizhi_finance_ai_jobs group by status) j),
      'last_job', (select max(created_at) from public.lizhi_finance_ai_jobs),
      'hosts', (select coalesce(jsonb_agg(jsonb_build_object('host_id', host_id, 'status', status, 'version', version, 'last_seen_at', last_seen_at) order by last_seen_at desc), '[]'::jsonb) from public.lizhi_finance_ai_hosts)),
    'licut', jsonb_build_object(
      'project', (select jsonb_build_object('updated_at', updated_at, 'device', device, 'rev', rev) from public.lizhi_licut_projects limit 1),
      'media', (select count(*) from public.lizhi_licut_thumbs),
      'commands', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.lizhi_licut_commands group by status) c),
      'last_command', (select max(created_at) from public.lizhi_licut_commands)),
    'chat', (select jsonb_build_object('messages', count(*), 'last_at', max(created_at)) from public.lizhi_web_chat_messages),
    'web', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, count(*) n from public.lizhi_web_records where deleted_at is null group by kind) w),
    'runs', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) from (select id, source, kind, status, title, detail, created_at from public.lizhi_ai_runs order by created_at desc limit 30) r),
    'events', (select coalesce(jsonb_agg(to_jsonb(e) order by e.at desc), '[]'::jsonb) from (
        select * from (
          select 'library' as source, 'upload' as kind, created_at as at, '上傳「' || coalesce(title, file_name) || '」' as title from public.lizhi_library_items where deleted_at is null
          union all
          select 'library', 'organized', organized_at, '整理上架「' || coalesce(title, file_name) || '」→ ' || coalesce(shelf, '未分類') from public.lizhi_library_items where deleted_at is null and organized_at is not null
          union all
          select 'licut', 'command', created_at, 'Claude 剪輯指令「' || coalesce(nullif(label, ''), '未命名') || '」' || case status when 'done' then '已完成' when 'error' then '失敗' else '等待手機執行' end from public.lizhi_licut_commands
          union all
          select 'finance', 'job', created_at, '記帳 AI 解析' || case status when 'completed' then '完成' when 'failed' then '失敗' when 'cancelled' then '已取消' when 'processing' then '處理中' else '等待家中電腦' end from public.lizhi_finance_ai_jobs
        ) u order by at desc limit 40) e)
  );
$$;

revoke all on function public.lizhi_status_summary() from public, anon;
grant execute on function public.lizhi_status_summary() to authenticated;
