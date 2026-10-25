-- 首頁 3D 伸展台的自製角色：模型檔放私有 Storage，清單與設定放資料表，跨裝置同步。
-- 只新增 lizhi_stage_characters 資料表與 lizhi-stage-characters bucket，不修改其他資料。

create table if not exists public.lizhi_stage_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 80),
  file_name text not null check (char_length(file_name) between 1 and 300),
  format text not null check (format in ('glb', 'gltf', 'vrm', 'fbx')),
  size bigint not null default 0 check (size >= 0),
  storage_path text not null check (char_length(storage_path) between 1 and 400),
  thumb text check (thumb is null or octet_length(thumb) <= 262144),
  -- 身高、轉向、動畫對應等：{"height":1.7,"yaw":0,"anim":{"idle":"Idle","walk":"Walk","run":"Run"},"clips":[...]}
  settings jsonb not null default '{}'::jsonb check (octet_length(settings::text) <= 16384),
  is_selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lizhi_stage_characters_user_idx
  on public.lizhi_stage_characters (user_id, created_at desc);
-- 每個人同時只會有一個「使用中」角色
create unique index if not exists lizhi_stage_characters_one_selected
  on public.lizhi_stage_characters (user_id) where is_selected;

create or replace function public.lizhi_stage_characters_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists lizhi_stage_characters_touch on public.lizhi_stage_characters;
create trigger lizhi_stage_characters_touch before update on public.lizhi_stage_characters
  for each row execute function public.lizhi_stage_characters_touch();

alter table public.lizhi_stage_characters enable row level security;

drop policy if exists "stage_characters_own" on public.lizhi_stage_characters;
create policy "stage_characters_own" on public.lizhi_stage_characters for all to authenticated
  using (user_id = (select auth.uid()) and public.lizhi_web_is_allowed())
  with check (user_id = (select auth.uid()) and public.lizhi_web_is_allowed());

revoke all on table public.lizhi_stage_characters from anon;
grant select, insert, update, delete on table public.lizhi_stage_characters to authenticated;

-- 切換使用中角色（同一個交易內先取消舊的再設定新的，避免撞到唯一索引）
create or replace function public.lizhi_stage_select_character(target uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.lizhi_stage_characters set is_selected = false
    where user_id = (select auth.uid()) and is_selected and (target is null or id <> target);
  if target is not null then
    update public.lizhi_stage_characters set is_selected = true
      where id = target and user_id = (select auth.uid());
  end if;
end;
$$;
revoke all on function public.lizhi_stage_select_character(uuid) from public, anon;
grant execute on function public.lizhi_stage_select_character(uuid) to authenticated;

-- 私有檔案空間：路徑固定為 <user_id>/<character_id>.<副檔名>
insert into storage.buckets (id, name, public, file_size_limit)
values ('lizhi-stage-characters', 'lizhi-stage-characters', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "lizhi_stage_characters_objects_own" on storage.objects;
create policy "lizhi_stage_characters_objects_own" on storage.objects for all to authenticated
  using (
    bucket_id = 'lizhi-stage-characters'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.lizhi_web_is_allowed()
  )
  with check (
    bucket_id = 'lizhi-stage-characters'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.lizhi_web_is_allowed()
  );
