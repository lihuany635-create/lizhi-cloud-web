begin;

create table if not exists public.lizhi_finance_rule_memories (
  user_id uuid not null,
  id text not null check (char_length(id) between 1 and 160),
  payload jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz null,
  primary key (user_id, id),
  constraint lizhi_finance_rule_memories_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint lizhi_finance_rule_memories_payload_size check (octet_length(payload::text) <= 8192),
  constraint lizhi_finance_rule_memories_source check (payload->>'source' = 'user_confirmed'),
  constraint lizhi_finance_rule_memories_version check ((payload->>'version')::integer = 1),
  constraint lizhi_finance_rule_memories_target check (payload->>'targetField' in ('category','account','creditCard','merchant')),
  constraint lizhi_finance_rule_memories_match check (payload->>'matchKind' in ('merchant','keyword','phrase')),
  constraint lizhi_finance_rule_memories_timestamp_order check (updated_at >= created_at)
);

create index if not exists lizhi_finance_rule_memories_user_updated_idx
  on public.lizhi_finance_rule_memories (user_id, updated_at desc);

alter table public.lizhi_finance_rule_memories enable row level security;
revoke all on table public.lizhi_finance_rule_memories from anon;
grant select, insert, update, delete on table public.lizhi_finance_rule_memories to authenticated;

drop policy if exists lizhi_finance_rule_memories_select_own on public.lizhi_finance_rule_memories;
create policy lizhi_finance_rule_memories_select_own
  on public.lizhi_finance_rule_memories for select to authenticated
  using (user_id = auth.uid());

drop policy if exists lizhi_finance_rule_memories_insert_own on public.lizhi_finance_rule_memories;
create policy lizhi_finance_rule_memories_insert_own
  on public.lizhi_finance_rule_memories for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists lizhi_finance_rule_memories_update_own on public.lizhi_finance_rule_memories;
create policy lizhi_finance_rule_memories_update_own
  on public.lizhi_finance_rule_memories for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists lizhi_finance_rule_memories_delete_own on public.lizhi_finance_rule_memories;
create policy lizhi_finance_rule_memories_delete_own
  on public.lizhi_finance_rule_memories for delete to authenticated
  using (user_id = auth.uid());

commit;
