-- P7 DISPOSABLE / UNAPPLIED candidate ONLY.
-- PostgreSQL 17; requires P1/P5/P6 candidates. No production migration permission.
-- Site account mapping and consent proofs are server-only and kept in non-exposed schema.
begin;
create schema if not exists english_internal;
revoke all on schema english_internal from public,anon,authenticated;
grant usage on schema english_internal to service_role;

create table if not exists english_internal.site_owner_links(
 owner_id uuid primary key references public.english_authorized_users(owner_id) on delete restrict,
 chatgpt_account_sha256 text not null unique
   check (char_length(chatgpt_account_sha256)=64),
 link_verified boolean not null default false,
 enabled boolean not null default false,
 approved_at timestamptz,
 updated_at timestamptz not null default now(),
 check (not enabled or (link_verified and approved_at is not null))
);
create table if not exists english_internal.english_card_approvals(
 approval_id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 candidate_id uuid not null,
 action text not null check(action='promote_candidate'),
 request_id text not null check(char_length(request_id) between 12 and 100),
 payload_digest text not null check(char_length(payload_digest) between 8 and 128),
 consent_status text not null check(consent_status in ('approved','consumed','revoked')),
 approved_by_server text not null check(char_length(approved_by_server) between 3 and 100),
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 consumed_at timestamptz,
 unique(owner_id,request_id),
 foreign key(candidate_id,owner_id) references public.english_card_candidates(id,owner_id) on delete restrict
);
create index if not exists english_p7_approvals_expiry_idx on english_internal.english_card_approvals(owner_id,expires_at);

-- These are NOT part of Supabase Data API. No browser or MCP client gets SQL
-- permissions to read or write account linking or consent records.
alter table english_internal.site_owner_links enable row level security;
alter table english_internal.english_card_approvals enable row level security;
revoke all on english_internal.site_owner_links,english_internal.english_card_approvals
 from public,anon,authenticated;
grant select,insert,update on english_internal.site_owner_links,
 english_internal.english_card_approvals to service_role;

-- A single transaction consumes website consent AND promotes the card.
-- The caller must be the trusted backend service_role and must derive the
-- owner from a server-verified Google user, NOT from a model/request field.
create or replace function english_internal.consume_and_promote_candidate(
 p_owner_id uuid,p_approval_id uuid,p_candidate_id uuid,
 p_request_id text,p_payload_digest text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 a english_internal.english_card_approvals%rowtype;
 prior public.english_sync_events%rowtype;
 outcome jsonb;
begin
 if p_owner_id is null or p_approval_id is null or p_candidate_id is null or
    p_request_id is null or p_payload_digest is null or
    char_length(p_request_id) not between 12 and 100 or
    char_length(p_payload_digest) not between 8 and 128 then
   raise exception 'P7_INVALID_APPROVAL_INPUT';
 end if;
 if not exists(select 1 from public.english_authorized_users u
   where u.owner_id=p_owner_id and u.enabled) then
   raise exception 'P7_OWNER_NOT_AUTHORIZED';
 end if;
 select * into a from english_internal.english_card_approvals
  where approval_id=p_approval_id and owner_id=p_owner_id
  for update;
 if not found or a.action<>'promote_candidate' or
    a.candidate_id<>p_candidate_id or a.request_id<>p_request_id or
    a.payload_digest<>p_payload_digest then
   raise exception 'P7_APPROVAL_NOT_MATCHED';
 end if;
 if a.consent_status='consumed' then
   select * into prior from public.english_sync_events
    where owner_id=p_owner_id and request_id=p_request_id
      and action='promote_candidate' and payload_digest=p_payload_digest;
   if not found then raise exception 'P7_REPLAY_STATE_MISMATCH'; end if;
   return pg_catalog.jsonb_build_object('status','replay',
     'card_id',prior.result_reference);
 end if;
 if a.consent_status<>'approved' or a.expires_at<=now() then
   raise exception 'P7_APPROVAL_EXPIRED_OR_REVOKED';
 end if;
 -- The P1 function writes card + audit + immutable sync event in same txn.
 outcome=public.english_promote_candidate(p_owner_id,p_candidate_id,
   p_request_id,p_payload_digest);
 update english_internal.english_card_approvals
   set consent_status='consumed',consumed_at=now()
   where approval_id=p_approval_id and owner_id=p_owner_id;
 return outcome;
end $$;

revoke all on function english_internal.consume_and_promote_candidate(
 uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function english_internal.consume_and_promote_candidate(
 uuid,uuid,uuid,text,text) to service_role;
commit;
