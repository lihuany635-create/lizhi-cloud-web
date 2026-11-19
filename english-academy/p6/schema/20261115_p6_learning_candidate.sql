-- P6 isolated candidate migration. NEVER apply to production without separate owner approval.
-- Requires P1 schema and P5 aggregate schema installed in a disposable PG17 database.
begin;

alter table public.english_card_candidates
 add column if not exists sense_key text not null default '' check (char_length(sense_key)<=80);

create table if not exists public.english_p6_sync_requests(
 owner_id uuid not null,
 request_id text not null check (char_length(request_id) between 12 and 100),
 source_session_id text not null,
 action text not null check (action='sync_learning_session'),
 payload_digest text not null check (char_length(payload_digest)=64),
 result_json jsonb not null check (jsonb_typeof(result_json)='object'),
 status text not null check (status='success'),
 created_at timestamptz not null default now(),
 primary key(owner_id,request_id),
 foreign key(owner_id,source_session_id) references
   public.english_session_authorizations(owner_id,source_session_id) on delete restrict
);

create table if not exists public.english_p6_diagnostic_attempts(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 session_id text not null check (char_length(session_id) between 12 and 100),
 question_id text not null check (char_length(question_id) between 1 and 80),
 answer_state text not null check (answer_state in
   ('objective-graded','needs-human-review','audio-unverified','self-rated')),
 score boolean,
 rubric_version text not null,
 evidence_json jsonb not null check (jsonb_typeof(evidence_json)='object'
   and pg_column_size(evidence_json)<=32768),
 created_at timestamptz not null default now(),
 unique(owner_id,session_id,question_id)
);

create table if not exists public.english_p6_sentence_reviews(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 attempt_id text not null check (char_length(attempt_id) between 12 and 100),
 proposed_feedback text not null check (char_length(proposed_feedback)<=500),
 rubric_version text not null check (char_length(rubric_version)<=60),
 reviewer_type text not null check (reviewer_type in ('ai-proposal','verified-learner')),
 rubric_json jsonb not null check (jsonb_typeof(rubric_json)='array' and
   jsonb_array_length(rubric_json)=4),
 result boolean,
 created_at timestamptz not null default now(),
 unique(owner_id,attempt_id,reviewer_type)
);
create index if not exists english_p6_sync_by_session on public.english_p6_sync_requests(owner_id,source_session_id,created_at desc);

-- Read-only direct clients; all writes require separately verified trusted backend.
do $$
declare t text;
begin
 foreach t in array array[
   'english_p6_sync_requests','english_p6_diagnostic_attempts',
   'english_p6_sentence_reviews'
 ] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from public,anon,authenticated',t);
   execute format('grant select on public.%I to authenticated',t);
   execute format('grant select,insert on public.%I to service_role',t);
   execute format('drop policy if exists %I on public.%I',t||'_owner_select',t);
   execute format('create policy %I on public.%I for select to authenticated using
      (owner_id=(select auth.uid()) and exists
         (select 1 from public.english_authorized_users a where
           a.owner_id=(select auth.uid()) and a.enabled))',t||'_owner_select',t);
 end loop;
end $$;

-- One atomic transaction: validate, lock, deduplicate and record outcome.
-- Must be invoked by an authenticated SERVER with p_owner_id derived from JWT,
-- never supplied by an unverified MCP client or browser.
create or replace function public.english_p6_ingest_batch(
 p_owner_id uuid,p_source_session_id text,p_request_id text,
 p_candidates jsonb,p_errors jsonb
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
 payload jsonb;
 digest text;
 prior public.english_p6_sync_requests%rowtype;
 item jsonb;
 i integer;
 term_text text;
 normalized text;
 meaning text;
 v_sense_key text;
 orig_text text;
 corrected text;
 explanation text;
 added integer:=0;
 duplicate_count integer:=0;
 error_added integer:=0;
 result_data jsonb;
begin
 if p_owner_id is null or p_source_session_id is null or
    p_request_id is null or char_length(p_request_id) not between 12 and 100 or
    p_candidates is null or p_errors is null or
    jsonb_typeof(p_candidates)<>'array' or jsonb_typeof(p_errors)<>'array' or
    jsonb_array_length(p_candidates)>10 or jsonb_array_length(p_errors)>10 or
    jsonb_array_length(p_candidates)+jsonb_array_length(p_errors)<1 then
   raise exception 'INVALID_SYNC_REQUEST';
 end if;
 if not exists(select 1 from public.english_authorized_users a
   where a.owner_id=p_owner_id and a.enabled) then
   raise exception 'OWNER_NOT_AUTHORIZED';
 end if;
 if not exists(select 1 from public.english_session_authorizations s
   where s.owner_id=p_owner_id and s.source_session_id=p_source_session_id and
     s.enabled and s.explicitly_confirmed and s.expires_at>now()) then
   raise exception 'LEARNING_SESSION_NOT_AUTHORIZED';
 end if;
 -- Serialize all candidate ingestion per owner to avoid duplicate pending
 -- cards arriving simultaneously through different request IDs.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('english-p6:'||p_owner_id::text,0));
 payload=pg_catalog.jsonb_build_object('session',p_source_session_id,
   'candidates',p_candidates,'errors',p_errors);
 digest=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(payload::text,'UTF8')),'hex');
 select * into prior from public.english_p6_sync_requests
  where owner_id=p_owner_id and request_id=p_request_id;
 if found then
   if prior.payload_digest<>digest or prior.action<>'sync_learning_session' then
     raise exception 'IDEMPOTENCY_CONFLICT';
   end if;
   return prior.result_json||pg_catalog.jsonb_build_object('replay',true);
 end if;

 for i in 0..jsonb_array_length(p_candidates)-1 loop
   item=p_candidates->i;
   if jsonb_typeof(item)<>'object' then raise exception 'INVALID_CANDIDATE'; end if;
   term_text=pg_catalog.btrim(item->>'term');
   meaning=pg_catalog.btrim(item->>'meaningZh');
   v_sense_key=coalesce(pg_catalog.btrim(item->>'senseKey'),'');
   normalized=pg_catalog.lower(pg_catalog.regexp_replace(term_text,'[[:space:]]+',' ','g'));
   if term_text is null or meaning is null or char_length(term_text) not between 1 and 120 or
     char_length(meaning) not between 1 and 500 or char_length(v_sense_key)>80
      then raise exception 'INVALID_CANDIDATE'; end if;
   -- Existing active card or pending candidate is a duplicate.
   if exists(select 1 from public.english_cards where owner_id=p_owner_id and
        normalized_term=normalized and sense_key=v_sense_key) or
      exists(select 1 from public.english_card_candidates where owner_id=p_owner_id and
        normalized_term=normalized and sense_key=v_sense_key and status='pending') then
      duplicate_count=duplicate_count+1;
   else
     insert into public.english_card_candidates(
       owner_id,source_event_id,term,normalized_term,meaning_zh,sense_key,status)
     values(p_owner_id,'p6:'||p_request_id||':'||i,term_text,normalized,meaning,v_sense_key,'pending');
     added=added+1;
   end if;
 end loop;

 for i in 0..jsonb_array_length(p_errors)-1 loop
   item=p_errors->i;
   if jsonb_typeof(item)<>'object' then raise exception 'INVALID_ERROR_ITEM'; end if;
   orig_text=pg_catalog.btrim(item->>'original');
   corrected=pg_catalog.btrim(item->>'corrected');
   explanation=pg_catalog.btrim(item->>'explanation');
   if orig_text is null or corrected is null or explanation is null or
      char_length(orig_text) not between 1 and 500 or
      char_length(corrected) not between 1 and 500 or
      char_length(explanation) not between 1 and 500 then
      raise exception 'INVALID_ERROR_ITEM'; end if;
   insert into public.english_error_records(
     owner_id,source_event_id,source_session_id,
     original_sentence,corrected_sentence,explanation,skill,occurred_at)
   values(p_owner_id,'p6:'||p_request_id||':'||i,p_source_session_id,
     orig_text,corrected,explanation,'grammar',now());
   error_added=error_added+1;
 end loop;
 result_data=pg_catalog.jsonb_build_object(
   'requestId',p_request_id,'status','success','pendingAdded',added,
   'candidatesDuplicated',duplicate_count,'errorsAdded',error_added,'replay',false
 );
 insert into public.english_p6_sync_requests(
   owner_id,request_id,source_session_id,action,payload_digest,result_json,status)
 values(p_owner_id,p_request_id,p_source_session_id,'sync_learning_session',
   digest,result_data,'success');
 insert into public.english_audit_events(owner_id,actor_type,action,resource_id,request_id)
 values(p_owner_id,'server-verified','p6_sync_learning_session',p_source_session_id,p_request_id);
 return result_data;
end;
$$;

revoke execute on function public.english_p6_ingest_batch(uuid,text,text,jsonb,jsonb)
 from public,anon,authenticated;
grant execute on function public.english_p6_ingest_batch(uuid,text,text,jsonb,jsonb) to service_role;


-- Preserve distinct sense keys through the already approved-card promotion
-- contract. Original P1 prototype did not transfer sense_key into formal cards.
-- This is an UNAPPLIED candidate replacement; same server-only signature.
create or replace function public.english_promote_candidate(
  p_owner_id uuid,p_candidate_id uuid,p_request_id text,p_payload_digest text
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
 c public.english_card_candidates%rowtype;
 existing public.english_sync_events%rowtype;
 card_id uuid;
 outcome text;
begin
 if p_owner_id is null or p_candidate_id is null or
    p_request_id is null or length(p_request_id)<12 or
    p_payload_digest is null or length(p_payload_digest)<8 then
   raise exception 'INVALID_ARGUMENT';
 end if;
 if not exists(select 1 from public.english_authorized_users
   where owner_id=p_owner_id and enabled) then
   raise exception 'OWNER_NOT_AUTHORIZED';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended(p_owner_id::text||':'||p_request_id,0));
 select * into existing from public.english_sync_events
  where owner_id=p_owner_id and request_id=p_request_id;
 if found then
   if existing.action<>'promote_candidate' or existing.payload_digest<>p_payload_digest
    then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   return pg_catalog.jsonb_build_object('status','replay','card_id',existing.result_reference);
 end if;
 select * into c from public.english_card_candidates
  where id=p_candidate_id and owner_id=p_owner_id for update;
 if not found then raise exception 'CANDIDATE_NOT_FOUND'; end if;
 if c.status<>'pending' then raise exception 'CANDIDATE_NOT_PENDING'; end if;
 insert into public.english_cards(owner_id,source_candidate_id,
   term,normalized_term,meaning_zh,part_of_speech,example_en,sense_key)
 values(p_owner_id,c.id,c.term,c.normalized_term,c.meaning_zh,
   c.part_of_speech,c.example_en,c.sense_key)
 on conflict (owner_id,normalized_term,sense_key) do nothing
 returning id into card_id;
 outcome=case when card_id is null then 'duplicate' else 'accepted' end;
 if card_id is null then
   select id into card_id from public.english_cards
     where owner_id=p_owner_id and normalized_term=c.normalized_term
       and sense_key=c.sense_key;
 end if;
 update public.english_card_candidates set status=outcome,reviewed_at=now()
  where id=c.id and owner_id=p_owner_id;
 insert into public.english_sync_events(owner_id,source,request_id,payload_digest,action,status,result_reference)
 values(p_owner_id,'web',p_request_id,p_payload_digest,'promote_candidate','success',card_id::text);
 insert into public.english_audit_events(owner_id,actor_type,action,resource_id,request_id)
 values(p_owner_id,'verified_user','promote_candidate',c.id::text,p_request_id);
 return pg_catalog.jsonb_build_object('status',outcome,'card_id',card_id);
end;
$$;
revoke execute on function public.english_promote_candidate(uuid,uuid,text,text)
  from public,anon,authenticated;
grant execute on function public.english_promote_candidate(uuid,uuid,text,text)
 to service_role;

commit;
