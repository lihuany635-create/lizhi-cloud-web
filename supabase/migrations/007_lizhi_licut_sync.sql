-- 立剪：時間軸同步、縮圖、Claude 剪輯指令佇列。
-- 影片檔本身不上傳，只同步時間軸資料與小縮圖。

-- 目前的專案（每個使用者一份，由手機上的立剪寫入）
create table if not exists public.lizhi_licut_projects (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  project jsonb not null check (jsonb_typeof(project) = 'object' and octet_length(project::text) <= 1048576),
  summary jsonb not null default '{}'::jsonb,
  rev bigint not null default 0,
  device text,
  updated_at timestamptz not null default now()
);

-- 每個素材的縮圖與膠卷（小張 JPEG 的 data URL），讓 Claude 看得到大概的畫面
create table if not exists public.lizhi_licut_thumbs (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  media_id text not null check (char_length(media_id) between 1 and 80),
  name text not null default '',
  kind text not null default 'video',
  duration real,
  thumb text check (thumb is null or octet_length(thumb) <= 262144),
  filmstrip text check (filmstrip is null or octet_length(filmstrip) <= 524288),
  updated_at timestamptz not null default now(),
  primary key (user_id, media_id)
);

-- Claude 送給手機的剪輯指令；手機上的立剪執行後回填結果
create table if not exists public.lizhi_licut_commands (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  label text not null default '',
  ops jsonb not null check (jsonb_typeof(ops) = 'array' and jsonb_array_length(ops) between 1 and 200),
  status text not null default 'pending' check (status in ('pending', 'done', 'error')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  done_at timestamptz
);

create index if not exists lizhi_licut_commands_pending_idx
  on public.lizhi_licut_commands (user_id, id) where status = 'pending';

alter table public.lizhi_licut_projects enable row level security;
alter table public.lizhi_licut_thumbs enable row level security;
alter table public.lizhi_licut_commands enable row level security;

drop policy if exists "licut_projects_own" on public.lizhi_licut_projects;
create policy "licut_projects_own" on public.lizhi_licut_projects for all to authenticated
  using (user_id = auth.uid() and public.lizhi_web_is_allowed())
  with check (user_id = auth.uid() and public.lizhi_web_is_allowed());

drop policy if exists "licut_thumbs_own" on public.lizhi_licut_thumbs;
create policy "licut_thumbs_own" on public.lizhi_licut_thumbs for all to authenticated
  using (user_id = auth.uid() and public.lizhi_web_is_allowed())
  with check (user_id = auth.uid() and public.lizhi_web_is_allowed());

drop policy if exists "licut_commands_own" on public.lizhi_licut_commands;
create policy "licut_commands_own" on public.lizhi_licut_commands for all to authenticated
  using (user_id = auth.uid() and public.lizhi_web_is_allowed())
  with check (user_id = auth.uid() and public.lizhi_web_is_allowed());

revoke all on table public.lizhi_licut_projects, public.lizhi_licut_thumbs, public.lizhi_licut_commands from anon;
grant select, insert, update, delete on table public.lizhi_licut_projects, public.lizhi_licut_thumbs, public.lizhi_licut_commands to authenticated;

-- 手機即時收到 Claude 的指令
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lizhi_licut_commands'
  ) then
    alter publication supabase_realtime add table public.lizhi_licut_commands;
  end if;
end $$;
