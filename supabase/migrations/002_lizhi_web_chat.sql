-- Authenticated chat for the new 立之雲端庫 website.
-- This is separate from any existing project chat table or function.
begin;

create table if not exists public.lizhi_web_chat_messages (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  device_name text not null check (char_length(device_name) between 1 and 40),
  content text not null check (char_length(content) between 1 and 10000),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists lizhi_web_chat_messages_created
  on public.lizhi_web_chat_messages(created_at desc, id desc);

alter table public.lizhi_web_chat_messages enable row level security;
revoke all on public.lizhi_web_chat_messages from public, anon, authenticated;
grant select on public.lizhi_web_chat_messages to authenticated;

drop policy if exists "lizhi web chat read" on public.lizhi_web_chat_messages;
create policy "lizhi web chat read" on public.lizhi_web_chat_messages
  for select to authenticated using (public.lizhi_web_is_allowed());

create or replace function public.lizhi_web_send_message(
  p_id uuid, p_device_id uuid, p_device_name text, p_content text
)
returns public.lizhi_web_chat_messages
language plpgsql
security definer
set search_path = ''
as $$
declare saved public.lizhi_web_chat_messages;
begin
  if not public.lizhi_web_is_allowed() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_id is null or p_device_id is null or p_content is null
    or char_length(btrim(p_content)) not between 1 and 10000
    or p_device_name is null or char_length(btrim(p_device_name)) not between 1 and 40 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(418019);
  select * into saved from public.lizhi_web_chat_messages where id = p_id;
  if found then
    if saved.user_id <> auth.uid() or saved.device_id <> p_device_id or saved.content <> btrim(p_content) then
      raise exception 'message_id_conflict' using errcode = '22023';
    end if;
    return saved;
  end if;
  insert into public.lizhi_web_chat_messages(user_id, id, device_id, device_name, content)
    values (auth.uid(), p_id, p_device_id, btrim(p_device_name), btrim(p_content)) returning * into saved;
  return saved;
end;
$$;

revoke all on function public.lizhi_web_send_message(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.lizhi_web_send_message(uuid, uuid, text, text) to authenticated;
commit;

