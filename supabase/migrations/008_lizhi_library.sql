-- 立之圖書館：上傳的檔案存在私有 Storage，Claude 讀取抽出的文字後回填書架、標題、摘要與標籤。
-- 只新增 lizhi_library_* 資料表與 lizhi-library bucket，不修改其他資料。

create table if not exists public.lizhi_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),

  -- 上傳時由瀏覽器寫入
  file_name text not null check (char_length(file_name) between 1 and 300),
  mime text not null default '',
  size bigint not null default 0 check (size >= 0),
  storage_path text not null check (char_length(storage_path) between 1 and 400),
  text_excerpt text check (text_excerpt is null or octet_length(text_excerpt) <= 262144),
  thumb text check (thumb is null or octet_length(thumb) <= 262144),
  extract_status text not null default 'none' check (extract_status in ('ok', 'partial', 'none', 'error')),
  extract_note text,
  user_note text check (user_note is null or char_length(user_note) <= 2000),

  -- 由 Claude 整理後回填
  status text not null default 'inbox' check (status in ('inbox', 'organized', 'skipped')),
  shelf text check (shelf is null or char_length(shelf) <= 80),
  title text check (title is null or char_length(title) <= 200),
  summary text check (summary is null or char_length(summary) <= 4000),
  tags text[] not null default '{}',
  organized_at timestamptz,
  organized_by text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists lizhi_library_items_user_idx
  on public.lizhi_library_items (user_id, created_at desc) where deleted_at is null;
create index if not exists lizhi_library_items_inbox_idx
  on public.lizhi_library_items (user_id, created_at) where status = 'inbox' and deleted_at is null;

create or replace function public.lizhi_library_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists lizhi_library_items_touch on public.lizhi_library_items;
create trigger lizhi_library_items_touch before update on public.lizhi_library_items
  for each row execute function public.lizhi_library_touch();

alter table public.lizhi_library_items enable row level security;

drop policy if exists "library_items_own" on public.lizhi_library_items;
create policy "library_items_own" on public.lizhi_library_items for all to authenticated
  using (user_id = (select auth.uid()) and public.lizhi_web_is_allowed())
  with check (user_id = (select auth.uid()) and public.lizhi_web_is_allowed());

revoke all on table public.lizhi_library_items from anon;
grant select, insert, update, delete on table public.lizhi_library_items to authenticated;

-- 私有檔案空間：路徑固定為 <user_id>/<item_id>.<副檔名>
insert into storage.buckets (id, name, public, file_size_limit)
values ('lizhi-library', 'lizhi-library', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "lizhi_library_objects_own" on storage.objects;
create policy "lizhi_library_objects_own" on storage.objects for all to authenticated
  using (
    bucket_id = 'lizhi-library'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.lizhi_web_is_allowed()
  )
  with check (
    bucket_id = 'lizhi-library'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.lizhi_web_is_allowed()
  );
