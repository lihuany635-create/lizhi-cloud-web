-- 立之圖書館：檔案可以存在手機資料夾，雲端只留整理用的文字與縮圖。
alter table public.lizhi_library_items
  add column if not exists location text not null default 'cloud',
  add column if not exists device_path text;

alter table public.lizhi_library_items alter column storage_path drop not null;

alter table public.lizhi_library_items drop constraint if exists lizhi_library_items_location_check;
alter table public.lizhi_library_items add constraint lizhi_library_items_location_check check (
  (location = 'cloud' and storage_path is not null)
  or (location = 'device' and device_path is not null and char_length(device_path) between 1 and 300)
);
