-- Computer-linked catalog: local originals, cloud index only. Original files remain on the computer.
alter table public.lizhi_library_items
 add column if not exists computer_id text,
 add column if not exists computer_name text,
 add column if not exists computer_path text,
 add column if not exists computer_modified_at timestamptz;
alter table public.lizhi_library_items drop constraint if exists lizhi_library_items_location_check;
alter table public.lizhi_library_items add constraint lizhi_library_items_location_check check (
 (location = 'cloud' and storage_path is not null)
 or (location = 'device' and device_path is not null and char_length(device_path) between 1 and 300)
 or (location = 'computer' and computer_id is not null and char_length(computer_id) between 1 and 100 and computer_path is not null and char_length(computer_path) between 1 and 1000 and storage_path is null)
);
create unique index if not exists lizhi_library_computer_unique
 on public.lizhi_library_items (user_id,computer_id,computer_path) where location='computer' and deleted_at is null;
