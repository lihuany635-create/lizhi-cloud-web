-- 雙AI工作室｜網站群聊（v1）
-- 網站（本人登入）⇄ 這些資料表 ⇄ 本人電腦上的轉接程式 ⇄ 本機 agentchattr（Claude、Codex）
-- 只新增資料表與函式，不修改任何既有物件。
begin;

-- 訊息：source=web 由網站送出、待轉到電腦；source=local 由電腦轉上來（AI 回覆、本機發言）
create table if not exists public.lizhi_dualai_messages (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('web', 'local')),
  sender text not null check (char_length(sender) between 1 and 40),
  sender_kind text not null check (sender_kind in ('human', 'agent', 'system')),
  content text not null check (char_length(content) between 1 and 10000),
  local_id bigint,
  relayed_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists lizhi_dualai_messages_user_created
  on public.lizhi_dualai_messages(user_id, created_at desc, id desc);
create index if not exists lizhi_dualai_messages_pending
  on public.lizhi_dualai_messages(user_id, created_at)
  where source = 'web' and relayed_at is null;
create unique index if not exists lizhi_dualai_messages_local_once
  on public.lizhi_dualai_messages(user_id, local_id)
  where local_id is not null;

alter table public.lizhi_dualai_messages enable row level security;
revoke all on public.lizhi_dualai_messages from public, anon, authenticated;
grant select on public.lizhi_dualai_messages to authenticated;

drop policy if exists "lizhi dualai read own" on public.lizhi_dualai_messages;
create policy "lizhi dualai read own" on public.lizhi_dualai_messages
  for select to authenticated
  using (public.lizhi_web_is_allowed() and user_id = auth.uid());

-- 轉接金鑰：只存 SHA-256 雜湊與末四碼；每位本人一把，重新產生即作廢舊的
create table if not exists public.lizhi_dualai_bridges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  key_hash text not null unique,
  key_last4 text not null,
  last_seen_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
alter table public.lizhi_dualai_bridges enable row level security;
revoke all on public.lizhi_dualai_bridges from public, anon, authenticated;

-- ===== 網站端（需本人登入）=====

create or replace function public.lizhi_dualai_send(p_id uuid, p_content text)
returns public.lizhi_dualai_messages
language plpgsql security definer set search_path = ''
as $$
declare saved public.lizhi_dualai_messages;
begin
  if not public.lizhi_web_is_allowed() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_id is null or p_content is null or char_length(btrim(p_content)) not between 1 and 10000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;
  select * into saved from public.lizhi_dualai_messages where id = p_id;
  if found then
    if saved.user_id <> auth.uid() or saved.content <> btrim(p_content) then
      raise exception 'message_id_conflict' using errcode = '22023';
    end if;
    return saved;
  end if;
  insert into public.lizhi_dualai_messages(id, user_id, source, sender, sender_kind, content)
    values (p_id, auth.uid(), 'web', 'user', 'human', btrim(p_content))
    returning * into saved;
  return saved;
end;
$$;

create or replace function public.lizhi_dualai_status()
returns table(bridge_configured boolean, key_last4 text, last_seen_at timestamptz, pending_count bigint)
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.lizhi_web_is_allowed() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
    select b.user_id is not null, b.key_last4, b.last_seen_at,
           (select count(*) from public.lizhi_dualai_messages m
             where m.user_id = auth.uid() and m.source = 'web' and m.relayed_at is null)
    from (select auth.uid() as uid) me
    left join public.lizhi_dualai_bridges b on b.user_id = me.uid;
end;
$$;

-- 產生新的轉接金鑰（明碼只回傳這一次）
create or replace function public.lizhi_dualai_create_bridge_key()
returns text
language plpgsql security definer set search_path = ''
as $$
declare k text;
begin
  if not public.lizhi_web_is_allowed() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  k := 'lzb_' || encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.lizhi_dualai_bridges(user_id, key_hash, key_last4, last_seen_at)
    values (auth.uid(), encode(extensions.digest(k, 'sha256'), 'hex'), right(k, 4), null)
    on conflict (user_id) do update
      set key_hash = excluded.key_hash, key_last4 = excluded.key_last4,
          last_seen_at = null, created_at = clock_timestamp();
  return k;
end;
$$;

-- ===== 電腦端轉接程式（以轉接金鑰驗證，不需要登入）=====

create or replace function public.lizhi_dualai_bridge_owner(p_key text)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select b.user_id from public.lizhi_dualai_bridges b
   where p_key like 'lzb\_%' and b.key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
$$;

-- 取出網站送來、尚未轉到電腦的訊息（同時更新電腦在線時間）
create or replace function public.lizhi_dualai_bridge_pull(p_key text)
returns setof public.lizhi_dualai_messages
language plpgsql security definer set search_path = ''
as $$
declare owner uuid := public.lizhi_dualai_bridge_owner(p_key);
begin
  if owner is null then
    raise exception 'invalid_bridge_key' using errcode = '42501';
  end if;
  update public.lizhi_dualai_bridges set last_seen_at = clock_timestamp() where user_id = owner;
  return query
    select * from public.lizhi_dualai_messages m
     where m.user_id = owner and m.source = 'web' and m.relayed_at is null
     order by m.created_at, m.id
     limit 20;
end;
$$;

-- 標記訊息已送進電腦上的聊天室
create or replace function public.lizhi_dualai_bridge_ack(p_key text, p_ids uuid[])
returns integer
language plpgsql security definer set search_path = ''
as $$
declare owner uuid := public.lizhi_dualai_bridge_owner(p_key); n integer;
begin
  if owner is null then
    raise exception 'invalid_bridge_key' using errcode = '42501';
  end if;
  update public.lizhi_dualai_messages
     set relayed_at = clock_timestamp()
   where user_id = owner and id = any(p_ids) and source = 'web' and relayed_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- 把電腦上聊天室的訊息（AI 回覆、本機發言、系統訊息）轉上雲端；local_id 防重複
create or replace function public.lizhi_dualai_bridge_post(
  p_key text, p_local_id bigint, p_sender text, p_sender_kind text, p_content text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare owner uuid := public.lizhi_dualai_bridge_owner(p_key); new_id uuid;
begin
  if owner is null then
    raise exception 'invalid_bridge_key' using errcode = '42501';
  end if;
  if p_local_id is null or p_sender is null or char_length(btrim(p_sender)) not between 1 and 40
     or p_sender_kind not in ('human', 'agent', 'system')
     or p_content is null or char_length(btrim(p_content)) not between 1 and 10000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;
  insert into public.lizhi_dualai_messages(id, user_id, source, sender, sender_kind, content, local_id, relayed_at)
    values (gen_random_uuid(), owner, 'local', btrim(p_sender), p_sender_kind, btrim(p_content), p_local_id, clock_timestamp())
    on conflict (user_id, local_id) where local_id is not null do nothing
    returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.lizhi_dualai_send(uuid, text) from public, anon, authenticated;
revoke all on function public.lizhi_dualai_status() from public, anon, authenticated;
revoke all on function public.lizhi_dualai_create_bridge_key() from public, anon, authenticated;
revoke all on function public.lizhi_dualai_bridge_owner(text) from public, anon, authenticated;
revoke all on function public.lizhi_dualai_bridge_pull(text) from public, anon, authenticated;
revoke all on function public.lizhi_dualai_bridge_ack(text, uuid[]) from public, anon, authenticated;
revoke all on function public.lizhi_dualai_bridge_post(text, bigint, text, text, text) from public, anon, authenticated;

grant execute on function public.lizhi_dualai_send(uuid, text) to authenticated;
grant execute on function public.lizhi_dualai_status() to authenticated;
grant execute on function public.lizhi_dualai_create_bridge_key() to authenticated;
grant execute on function public.lizhi_dualai_bridge_pull(text) to anon, authenticated;
grant execute on function public.lizhi_dualai_bridge_ack(text, uuid[]) to anon, authenticated;
grant execute on function public.lizhi_dualai_bridge_post(text, bigint, text, text, text) to anon, authenticated;
commit;
