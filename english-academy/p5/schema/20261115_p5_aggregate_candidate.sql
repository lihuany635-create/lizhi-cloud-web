-- P5 DEVELOPMENT-ONLY integrated model proposal. Never applied to production.
-- Requires P1 candidate schema already installed in the same isolated DB.
begin;

create table if not exists public.english_review_states (
 owner_id uuid not null,
 card_id uuid not null,
 model_version text not null check (model_version='FSRS-7'),
 library_version text not null,
 due_at timestamptz not null,
 state_json jsonb not null check (jsonb_typeof(state_json)='object' and pg_column_size(state_json)<=32768),
 updated_at timestamptz not null default now(),
 primary key(owner_id,card_id),
 foreign key(card_id,owner_id) references public.english_cards(id,owner_id) on delete restrict
);

create table if not exists public.english_review_events (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 card_id uuid not null,
 request_id text not null check (length(request_id) between 12 and 100),
 rating integer not null check (rating between 1 and 4),
 model_version text not null check (model_version='FSRS-7'),
 before_json jsonb not null check (jsonb_typeof(before_json)='object'),
 after_json jsonb not null check (jsonb_typeof(after_json)='object'),
 reviewed_at timestamptz not null,
 created_at timestamptz not null default now(),
 unique(owner_id,request_id),
 foreign key(card_id,owner_id) references public.english_cards(id,owner_id) on delete restrict
);

create table if not exists public.english_skill_evidence (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 source_event_id text not null,
 skill text not null check (skill in ('vocabulary','grammar','reading','writing','listening','speaking')),
 grader text not null,
 score numeric(4,3) check (score between 0 and 1),
 weight numeric(4,3) not null default 1 check (weight > 0 and weight <= 1),
 evidence_state text not null check (evidence_state in ('observed','unassessed')),
 occurred_at timestamptz not null,
 created_at timestamptz not null default now(),
 unique(owner_id,source_event_id,skill)
);

create table if not exists public.english_session_authorizations (
 owner_id uuid not null,
 source_session_id text not null check (length(source_session_id) between 1 and 100),
 explicitly_confirmed boolean not null default false,
 verified_actor_id text not null,
 enabled boolean not null default false,
 expires_at timestamptz not null,
 granted_at timestamptz not null default now(),
 primary key(owner_id,source_session_id)
);

create table if not exists public.english_error_records (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 source_event_id text not null,
 source_session_id text not null,
 original_sentence text not null check (length(original_sentence) between 1 and 500),
 corrected_sentence text not null check (length(corrected_sentence) between 1 and 500),
 explanation text not null check (length(explanation) between 1 and 500),
 skill text not null check (skill in ('vocabulary','grammar','reading','writing','listening','speaking')),
 category text,
 occurred_at timestamptz not null,
 created_at timestamptz not null default now(),
 unique(owner_id,source_event_id),
 foreign key(owner_id,source_session_id)
   references public.english_session_authorizations(owner_id,source_session_id) on delete restrict
);

create table if not exists public.english_assessment_results (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 skill text not null check (skill in ('vocabulary','grammar','reading','writing','listening','speaking')),
 proposed_level text check (proposed_level in ('A0','A1','A2','B1','B2','C1','C2')),
 rubric_version text not null,
 assessor_type text not null check (assessor_type in ('objective','human-reviewed','ai-proposal')),
 evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
 owner_approved boolean not null default false,
 created_at timestamptz not null default now()
);

create table if not exists public.english_learning_plans (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 planned_for date not null,
 policy_version text not null,
 plan_json jsonb not null check (jsonb_typeof(plan_json)='object' and pg_column_size(plan_json)<=65536),
 status text not null check (status in ('suggested','approved','completed','superseded')),
 created_at timestamptz not null default now()
);

create index if not exists english_review_due_idx on public.english_review_states(owner_id,due_at);
create index if not exists english_error_recent_idx on public.english_error_records(owner_id,occurred_at desc);
create index if not exists english_skill_recent_idx on public.english_skill_evidence(owner_id,occurred_at desc);
create index if not exists english_plans_date_idx on public.english_learning_plans(owner_id,planned_for desc);

-- Direct authenticated access: read your own rows only and only while allowed.
-- Write endpoints require verified backend role and action-specific approval.
do $$
declare t text;
begin
 foreach t in array array[
  'english_review_states','english_review_events','english_skill_evidence',
  'english_session_authorizations','english_error_records',
  'english_assessment_results','english_learning_plans'
 ] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from public, anon, authenticated',t);
   execute format('grant select on public.%I to authenticated',t);
   execute format('grant select,insert,update,delete on public.%I to service_role',t);
   execute format('drop policy if exists %I on public.%I',t||'_owner_read',t);
   execute format(
     'create policy %I on public.%I for select to authenticated using
       (owner_id = (select auth.uid()) and exists
        (select 1 from public.english_authorized_users a
         where a.owner_id=(select auth.uid()) and a.enabled))',
      t||'_owner_read',t
   );
 end loop;
end $$;

-- Immutable learning facts: corrections are new events, never destructive edits.
revoke update,delete on public.english_review_events,
 public.english_skill_evidence,public.english_error_records,
 public.english_assessment_results from service_role;

commit;
