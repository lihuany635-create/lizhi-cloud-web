-- English Academy P1 candidate schema - NOT APPLIED TO PRODUCTION.
-- Intended for isolated PostgreSQL/Supabase verification only.
-- Production migration requires separate explicit owner approval.
begin;

create table if not exists public.english_authorized_users (
  owner_id uuid primary key,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table public.english_authorized_users is 'Manually approved owner IDs; seed using a private admin operation, never public repo';

create table if not exists public.english_card_candidates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  source_event_id text not null,
  term text not null check (char_length(term) between 1 and 120),
  normalized_term text not null check (char_length(normalized_term) between 1 and 120),
  meaning_zh text not null check (char_length(meaning_zh) between 1 and 500),
  part_of_speech text not null default '',
  example_en text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','ignored','duplicate')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (owner_id, source_event_id, normalized_term),
  unique (id, owner_id)
);

create table if not exists public.english_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  source_candidate_id uuid,
  term text not null check (char_length(term) between 1 and 120),
  normalized_term text not null check (char_length(normalized_term) between 1 and 120),
  sense_key text not null default '',
  meaning_zh text not null,
  part_of_speech text not null default '',
  example_en text not null default '',
  created_at timestamptz not null default now(),
  unique (owner_id, normalized_term, sense_key),
  unique (id, owner_id),
  foreign key (source_candidate_id, owner_id)
    references public.english_card_candidates (id, owner_id) on delete restrict
);

create table if not exists public.english_learning_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  mode text not null default 'card_review',
  status text not null default 'started' check (status in ('started','paused','completed')),
  unique (id, owner_id)
);

create table if not exists public.english_practice_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null,
  card_id uuid not null,
  exercise_type text not null,
  answer_snapshot text not null default '',
  grader_type text not null check (grader_type in ('objective','learner_self','ai_proposed')),
  result boolean,
  created_at timestamptz not null default now(),
  request_id text not null check (char_length(request_id) between 12 and 100),
  unique (owner_id, request_id),
  foreign key (session_id, owner_id) references public.english_learning_sessions (id, owner_id) on delete restrict,
  foreign key (card_id, owner_id) references public.english_cards (id, owner_id) on delete restrict
);

create table if not exists public.english_sync_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  source text not null,
  request_id text not null check (char_length(request_id) between 12 and 100),
  payload_digest text not null,
  action text not null,
  status text not null check (status in ('pending','success','failed')),
  result_reference text,
  created_at timestamptz not null default now(),
  unique (owner_id, request_id)
);

create table if not exists public.english_audit_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  actor_type text not null,
  action text not null,
  resource_id text,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists english_candidates_due_idx on public.english_card_candidates(owner_id, status, created_at);
create index if not exists english_cards_owner_idx on public.english_cards(owner_id, created_at);
create index if not exists english_practice_recent_idx on public.english_practice_events(owner_id, created_at desc);
create index if not exists english_audit_recent_idx on public.english_audit_events(owner_id, created_at desc);

alter table public.english_authorized_users enable row level security;
alter table public.english_card_candidates enable row level security;
alter table public.english_cards enable row level security;
alter table public.english_learning_sessions enable row level security;
alter table public.english_practice_events enable row level security;
alter table public.english_sync_events enable row level security;
alter table public.english_audit_events enable row level security;

-- Fail closed: browser and direct MCP clients may read their own rows, but
-- they cannot write without the trusted server which must verify JWT and permissions.
revoke all on public.english_authorized_users from public, anon, authenticated;
revoke all on public.english_card_candidates from public, anon, authenticated;
revoke all on public.english_cards from public, anon, authenticated;
revoke all on public.english_learning_sessions from public, anon, authenticated;
revoke all on public.english_practice_events from public, anon, authenticated;
revoke all on public.english_sync_events from public, anon, authenticated;
revoke all on public.english_audit_events from public, anon, authenticated;

grant select on public.english_authorized_users to authenticated;
grant select on public.english_card_candidates, public.english_cards,
  public.english_learning_sessions, public.english_practice_events,
  public.english_sync_events, public.english_audit_events to authenticated;
grant select, insert, update, delete on public.english_authorized_users,
  public.english_card_candidates, public.english_cards,
  public.english_learning_sessions, public.english_practice_events,
  public.english_sync_events, public.english_audit_events to service_role;

drop policy if exists english_allowed_self on public.english_authorized_users;
create policy english_allowed_self on public.english_authorized_users
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists english_candidate_select on public.english_card_candidates;
create policy english_candidate_select on public.english_card_candidates
  for select to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.english_authorized_users a
      where a.owner_id = (select auth.uid()) and a.enabled
    )
  );
drop policy if exists english_card_select on public.english_cards;
create policy english_card_select on public.english_cards
  for select to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.english_authorized_users a
      where a.owner_id = (select auth.uid()) and a.enabled
    )
  );
drop policy if exists english_session_select on public.english_learning_sessions;
create policy english_session_select on public.english_learning_sessions
  for select to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.english_authorized_users a
      where a.owner_id = (select auth.uid()) and a.enabled
    )
  );
drop policy if exists english_practice_select on public.english_practice_events;
create policy english_practice_select on public.english_practice_events
  for select to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.english_authorized_users a
      where a.owner_id = (select auth.uid()) and a.enabled
    )
  );
drop policy if exists english_sync_select on public.english_sync_events;
create policy english_sync_select on public.english_sync_events
  for select to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.english_authorized_users a
      where a.owner_id = (select auth.uid()) and a.enabled
    )
  );
drop policy if exists english_audit_select on public.english_audit_events;
create policy english_audit_select on public.english_audit_events
  for select to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.english_authorized_users a
      where a.owner_id = (select auth.uid()) and a.enabled
    )
  );

-- Prevent mutation of historical practice/audit facts from trusted API by DB grants;
-- service_role bypasses RLS, so application still must restrict it to append only.
revoke update, delete on public.english_practice_events, public.english_audit_events from service_role;

-- A single transaction promotes a pending candidate to a formal card,
-- marks candidate reviewed, and emits audit and idempotency records.
-- Entry point is service_role ONLY, called after verified OAuth JWT & approval.
create or replace function public.english_promote_candidate(
  p_owner_id uuid, p_candidate_id uuid, p_request_id text, p_payload_digest text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  c public.english_card_candidates%rowtype;
  existing public.english_sync_events%rowtype;
  card_id uuid;
  outcome text;
begin
  if p_owner_id is null or p_candidate_id is null or
     p_request_id is null or length(p_request_id) < 12 or
     p_payload_digest is null or length(p_payload_digest) < 8 then
    raise exception 'INVALID_ARGUMENT';
  end if;

  if not exists(select 1 from public.english_authorized_users
                where owner_id = p_owner_id and enabled) then
    raise exception 'OWNER_NOT_AUTHORIZED';
  end if;
  -- Transaction-scoped advisory lock stops concurrent requests by the same
  -- idempotency key; do NOT use this as the only auth check.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_owner_id::text || ':' || p_request_id, 0));

  select * into existing from public.english_sync_events
    where owner_id = p_owner_id and request_id = p_request_id;
  if found then
    if existing.action <> 'promote_candidate' or
       existing.payload_digest <> p_payload_digest then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    return pg_catalog.jsonb_build_object('status','replay','card_id',existing.result_reference);
  end if;

  select * into c from public.english_card_candidates
    where id = p_candidate_id and owner_id = p_owner_id
    for update;
  if not found then raise exception 'CANDIDATE_NOT_FOUND'; end if;
  if c.status <> 'pending' then raise exception 'CANDIDATE_NOT_PENDING'; end if;

  insert into public.english_cards(owner_id, source_candidate_id,
      term, normalized_term, meaning_zh, part_of_speech, example_en)
    values(p_owner_id,c.id,c.term,c.normalized_term,c.meaning_zh,c.part_of_speech,c.example_en)
    on conflict (owner_id, normalized_term, sense_key) do nothing
    returning id into card_id;
  outcome := case when card_id is null then 'duplicate' else 'accepted' end;
  if card_id is null then
    select id into card_id from public.english_cards
      where owner_id = p_owner_id and normalized_term = c.normalized_term and sense_key = '';
  end if;
  update public.english_card_candidates set status = outcome, reviewed_at = now()
    where id=c.id and owner_id=p_owner_id;
  insert into public.english_sync_events(owner_id,source,request_id,payload_digest,action,status,result_reference)
    values(p_owner_id,'web',p_request_id,p_payload_digest,'promote_candidate','success',card_id::text);
  insert into public.english_audit_events(owner_id,actor_type,action,resource_id,request_id)
    values(p_owner_id,'verified_user','promote_candidate',c.id::text,p_request_id);
  return pg_catalog.jsonb_build_object('status',outcome,'card_id',card_id);
end;
$$;
revoke execute on function public.english_promote_candidate(uuid,uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.english_promote_candidate(uuid,uuid,text,text) to service_role;

commit;
