-- 立之圖書館｜工作專區：公文放置。
-- 公文原檔放使用者本人的 Google Drive；這張表只存索引、欄位、處理狀態與 AI 抽出的文字。
-- 只新增 lizhi_library_official_docs 與搜尋函式，不修改既有圖書館資料。

create table if not exists public.lizhi_library_official_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),

  direction text not null default 'incoming' check (direction in ('incoming', 'outgoing')),  -- 收文／發文

  -- 公文欄位（AI 填，使用者可改）
  doc_no text check (doc_no is null or char_length(doc_no) <= 120),              -- 發文字號
  issuer text check (issuer is null or char_length(issuer) <= 120),              -- 發文機關
  recipient text check (recipient is null or char_length(recipient) <= 200),     -- 受文者
  subject text check (subject is null or char_length(subject) <= 1000),          -- 主旨
  doc_date date,                                                                  -- 發文日期
  received_date date,                                                             -- 收文日期（收文才有）
  due_date date,                                                                  -- 辦理期限
  speed text check (speed is null or speed in ('最速件', '速件', '普通件')),      -- 速別
  secrecy text check (secrecy is null or char_length(secrecy) <= 20),             -- 密等及解密條件
  summary text check (summary is null or char_length(summary) <= 4000),          -- AI 摘要（說明段重點）
  tags text[] not null default '{}',
  user_note text check (user_note is null or char_length(user_note) <= 2000),    -- 承辦備註

  -- 處理狀態
  status text not null default 'todo' check (status in ('todo', 'doing', 'closed')),
  closed_at timestamptz,

  -- Google Drive 原檔
  drive_file_id text check (drive_file_id is null or drive_file_id ~ '^[A-Za-z0-9_-]{8,200}$'),
  drive_folder_id text check (drive_folder_id is null or drive_folder_id ~ '^[A-Za-z0-9_-]{8,200}$'),
  file_name text check (file_name is null or char_length(file_name) <= 300),
  mime text not null default '',

  -- AI 處理
  text_excerpt text check (text_excerpt is null or octet_length(text_excerpt) <= 262144),
  ai_status text not null default 'inbox' check (ai_status in ('inbox', 'filled', 'skipped', 'manual')),
  ai_note text check (ai_note is null or char_length(ai_note) <= 1000),
  ai_filled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 同一個 Drive 檔案只登記一次（軟刪後可重新登記）
create unique index if not exists lizhi_library_official_docs_drive_uniq
  on public.lizhi_library_official_docs (user_id, drive_file_id)
  where drive_file_id is not null and deleted_at is null;
create index if not exists lizhi_library_official_docs_user_idx
  on public.lizhi_library_official_docs (user_id, created_at desc)
  where deleted_at is null;
create index if not exists lizhi_library_official_docs_inbox_idx
  on public.lizhi_library_official_docs (user_id, created_at)
  where ai_status = 'inbox' and deleted_at is null;

create or replace function public.lizhi_library_official_docs_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'closed' and (old.status is distinct from 'closed') then
    new.closed_at := now();
  elsif new.status <> 'closed' then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists lizhi_library_official_docs_touch on public.lizhi_library_official_docs;
create trigger lizhi_library_official_docs_touch before update on public.lizhi_library_official_docs
  for each row execute function public.lizhi_library_official_docs_touch();

alter table public.lizhi_library_official_docs enable row level security;

drop policy if exists "library_official_docs_own" on public.lizhi_library_official_docs;
create policy "library_official_docs_own" on public.lizhi_library_official_docs for all to authenticated
  using (user_id = (select auth.uid()) and public.lizhi_web_is_allowed())
  with check (user_id = (select auth.uid()) and public.lizhi_web_is_allowed());

revoke all on table public.lizhi_library_official_docs from anon;
grant select, insert, update, delete on table public.lizhi_library_official_docs to authenticated;

-- 內文搜尋：AI 抽出的公文文字（依登入者權限執行，只看得到自己的公文）
create or replace function public.lizhi_library_official_docs_search(q text)
returns table (id uuid, snippet text)
language sql
stable
security invoker
set search_path = ''
as $$
  with term as (
    select lower(btrim(q)) as t,
           '%' || replace(replace(replace(btrim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select d.id,
         substring(d.text_excerpt
                   from greatest(1, strpos(lower(d.text_excerpt), term.t) - 40)
                   for 140) as snippet
  from public.lizhi_library_official_docs d, term
  where char_length(term.t) between 1 and 100
    and d.deleted_at is null
    and d.text_excerpt ilike term.pattern
  order by d.created_at desc
  limit 50;
$$;

revoke all on function public.lizhi_library_official_docs_search(text) from public, anon;
grant execute on function public.lizhi_library_official_docs_search(text) to authenticated;
