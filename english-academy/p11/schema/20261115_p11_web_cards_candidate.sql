-- P11 follow-on: atomic verified-web card actions and session status.
-- DEVELOPMENT CANDIDATE ONLY. Never run against production until explicitly approved.
-- Requires P1 -> P5 -> P6 -> P7 schema in that order, and independent RLS/security review.
begin;

-- Every mutating RPC below is SERVICE-ROLE ONLY. An authenticated browser is
-- NEVER permitted to call them directly. The Edge authenticates Google JWT,
-- checks auth session revocation and owner allowlist before passing owner UUID.
create or replace function public.english_web_session_active(
  p_owner_id uuid, p_session_id uuid
) returns boolean
language sql stable security definer set search_path=''
as $$
  select p_owner_id is not null and p_session_id is not null
    and exists (
      select 1 from auth.sessions s
      where s.user_id=p_owner_id and s.id=p_session_id
        and (s.not_after is null or s.not_after>pg_catalog.now())
    )
    and exists (
      select 1 from public.english_authorized_users a
      where a.owner_id=p_owner_id and a.enabled
    );
$$;
revoke all on function public.english_web_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.english_web_session_active(uuid,uuid) to service_role;

-- User-initiated manual additions are PENDING candidates, never formal cards.
-- The candidate, audit and idempotency event are one DB transaction.
create or replace function public.english_web_create_candidate(
  p_owner_id uuid,p_request_id text,p_term text,p_meaning_zh text,
  p_sense_key text default ''
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_normalized text;
  v_sense text := coalesce(pg_catalog.btrim(p_sense_key),'');
  v_term text := pg_catalog.btrim(p_term);
  v_meaning text := pg_catalog.btrim(p_meaning_zh);
  v_digest text;
  v_prior public.english_sync_events%rowtype;
  v_id uuid;
  v_status text;
begin
  if p_owner_id is null or p_request_id is null or
     p_request_id !~ '^[A-Za-z0-9_-]{12,100}$' or
     v_term is null or char_length(v_term) not between 1 and 120 or
     v_meaning is null or char_length(v_meaning) not between 1 and 500 or
     char_length(v_sense)>80 then
    raise exception 'INVALID_WEB_CANDIDATE_INPUT';
  end if;
  if not exists (select 1 from public.english_authorized_users
      where owner_id=p_owner_id and enabled) then
    raise exception 'OWNER_NOT_AUTHORIZED';
  end if;
  v_normalized := pg_catalog.lower(pg_catalog.regexp_replace(v_term,'[[:space:]]+',' ','g'));
  v_digest := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_object('term',v_normalized,'meaning',v_meaning,
      'sense',v_sense)::text,'UTF8')),'hex');

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('english-web-candidate:'||p_owner_id::text,0));
  select * into v_prior from public.english_sync_events
    where owner_id=p_owner_id and request_id=p_request_id;
  if found then
    if v_prior.action<>'web_create_candidate' or v_prior.payload_digest<>v_digest
      then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return pg_catalog.jsonb_build_object('status','replay','id',v_prior.result_reference);
  end if;

  select c.id into v_id from public.english_cards c
    where c.owner_id=p_owner_id and c.normalized_term=v_normalized
      and c.sense_key=v_sense limit 1;
  if v_id is not null then
    v_status:='already-active';
  else
    select c.id into v_id from public.english_card_candidates c
      where c.owner_id=p_owner_id and c.normalized_term=v_normalized
        and c.sense_key=v_sense and c.status='pending'
      order by c.created_at limit 1;
    if v_id is not null then
      v_status:='duplicate-pending';
    else
      insert into public.english_card_candidates(
        owner_id,source_event_id,term,normalized_term,meaning_zh,sense_key,status)
      values (p_owner_id,'web:'||p_request_id,v_term,v_normalized,v_meaning,v_sense,'pending')
      returning id into v_id;
      v_status:='pending';
    end if;
  end if;
  insert into public.english_sync_events(owner_id,source,request_id,payload_digest,
    action,status,result_reference)
  values (p_owner_id,'web',p_request_id,v_digest,
    'web_create_candidate','success',v_id::text);
  insert into public.english_audit_events(owner_id,actor_type,action,resource_id,request_id)
  values (p_owner_id,'verified-google-web','web_create_candidate',v_id::text,p_request_id);
  return pg_catalog.jsonb_build_object('status',v_status,'id',v_id,'replay',false);
end;
$$;
revoke all on function public.english_web_create_candidate(uuid,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.english_web_create_candidate(uuid,text,text,text,text)
 to service_role;

-- Approval minted and consumed in the SAME transaction from a verified
-- Google website action. LLM-provided userConfirmed/approved is NEVER used.
-- Private P7 approval record and P1 promotion / audit are atomically coupled.
create or replace function public.english_web_promote_candidate(
 p_owner_id uuid,p_candidate_id uuid,p_request_id text,p_payload_digest text
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_prior public.english_sync_events%rowtype;
  v_approval uuid;
  v_outcome jsonb;
begin
  if p_owner_id is null or p_candidate_id is null or
     p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{12,100}$' or
     p_payload_digest is null or p_payload_digest !~ '^[0-9a-f]{64}$' then
    raise exception 'INVALID_WEB_APPROVAL_INPUT';
  end if;
  if not exists(select 1 from public.english_authorized_users
      where owner_id=p_owner_id and enabled) then
    raise exception 'OWNER_NOT_AUTHORIZED';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_owner_id::text||':'||p_request_id,0));

  select * into v_prior from public.english_sync_events
    where owner_id=p_owner_id and request_id=p_request_id;
  if found then
    if v_prior.action<>'promote_candidate' or
       v_prior.payload_digest<>p_payload_digest then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    return pg_catalog.jsonb_build_object('status','replay',
      'card_id',v_prior.result_reference);
  end if;

  -- Ensure the candidate belongs to this verified owner BEFORE inserting
  -- any private approval record; never leak FK or cross-owner details.
  if not exists(select 1 from public.english_card_candidates
    where id=p_candidate_id and owner_id=p_owner_id) then
    raise exception 'CANDIDATE_NOT_FOUND';
  end if;
  if not exists(select 1 from public.english_card_candidates
    where id=p_candidate_id and owner_id=p_owner_id and status='pending') then
    raise exception 'CANDIDATE_NOT_PENDING';
  end if;

  -- Only the verified Google web API can issue this consent record. There
  -- is no public endpoint to create it and the private schema isn't exposed.
  insert into english_internal.english_card_approvals(
    owner_id,candidate_id,action,request_id,payload_digest,
    consent_status,approved_by_server,expires_at)
  values (p_owner_id,p_candidate_id,'promote_candidate',p_request_id,
    p_payload_digest,'approved','verified-google-web',pg_catalog.now()+interval '5 minutes')
  returning approval_id into v_approval;

  v_outcome := english_internal.consume_and_promote_candidate(
    p_owner_id,v_approval,p_candidate_id,p_request_id,p_payload_digest);
  return v_outcome;
end;
$$;
revoke all on function public.english_web_promote_candidate(uuid,uuid,text,text)
  from public,anon,authenticated;
grant execute on function public.english_web_promote_candidate(uuid,uuid,text,text)
  to service_role;

-- Ignoring a pending candidate changes status without deleting it and emits
-- audit + idempotency in the same transaction.
create or replace function public.english_web_ignore_candidate(
 p_owner_id uuid,p_candidate_id uuid,p_request_id text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_prior public.english_sync_events%rowtype;
  v_digest text;
  v_status text;
begin
  if p_owner_id is null or p_candidate_id is null or
     p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{12,100}$' then
    raise exception 'INVALID_IGNORE_INPUT';
  end if;
  if not exists(select 1 from public.english_authorized_users
      where owner_id=p_owner_id and enabled) then
    raise exception 'OWNER_NOT_AUTHORIZED';
  end if;
  v_digest:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    'ignore:'||p_owner_id::text||':'||p_candidate_id::text,'UTF8')),'hex');
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_owner_id::text||':'||p_request_id,0));
  select * into v_prior from public.english_sync_events
    where owner_id=p_owner_id and request_id=p_request_id;
  if found then
    if v_prior.action<>'web_ignore_candidate' or
       v_prior.payload_digest<>v_digest then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    return pg_catalog.jsonb_build_object('status','replay',
      'candidate_id',v_prior.result_reference);
  end if;
  update public.english_card_candidates
    set status='ignored',reviewed_at=pg_catalog.now()
    where id=p_candidate_id and owner_id=p_owner_id and status='pending';
  if not found then raise exception 'CANDIDATE_NOT_PENDING'; end if;
  insert into public.english_sync_events(owner_id,source,request_id,payload_digest,
    action,status,result_reference)
  values(p_owner_id,'web',p_request_id,v_digest,'web_ignore_candidate',
    'success',p_candidate_id::text);
  insert into public.english_audit_events(owner_id,actor_type,action,resource_id,request_id)
  values(p_owner_id,'verified-google-web','web_ignore_candidate',p_candidate_id::text,p_request_id);
  return pg_catalog.jsonb_build_object('status','ignored','candidate_id',p_candidate_id);
end;
$$;
revoke all on function public.english_web_ignore_candidate(uuid,uuid,text)
  from public,anon,authenticated;
grant execute on function public.english_web_ignore_candidate(uuid,uuid,text)
  to service_role;


-- Website-confirmed, short-lived English conversation authorization. Only a
-- user with an ACTIVE Google web auth.sessions row can approve this chat scope.
-- A model may subsequently name the session, but can never authorize it.
create or replace function public.english_web_grant_chat_session(
 p_owner_id uuid,p_web_session_id uuid,p_source_session_id text,p_request_id text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_prior public.english_sync_events%rowtype;
 v_digest text;
 v_expiry timestamptz:=pg_catalog.now()+interval '24 hours';
begin
 if p_owner_id is null or p_web_session_id is null or
    p_source_session_id is null or
    p_source_session_id !~ '^chat-[0-9a-f-]{36}$' or
    p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{12,100}$'
  then raise exception 'INVALID_CHAT_GRANT_INPUT'; end if;
 if not public.english_web_session_active(p_owner_id,p_web_session_id)
  then raise exception 'WEB_SESSION_INACTIVE';end if;
 v_digest:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
  'chat-grant:'||p_owner_id::text||':'||p_request_id,'UTF8')),'hex');
 perform pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended(p_owner_id::text||':'||p_request_id,0));
 select * into v_prior from public.english_sync_events
   where owner_id=p_owner_id and request_id=p_request_id;
 if found then
   if v_prior.action<>'web_grant_chat_session' or
      v_prior.payload_digest<>v_digest then raise exception 'IDEMPOTENCY_CONFLICT';end if;
   return pg_catalog.jsonb_build_object('status','replay',
      'sourceSessionId',v_prior.result_reference);
 end if;
 insert into public.english_session_authorizations(
  owner_id,source_session_id,explicitly_confirmed,verified_actor_id,enabled,expires_at
 )values(p_owner_id,p_source_session_id,true,
  'verified-google-web:'||p_web_session_id::text,true,v_expiry);
 insert into public.english_sync_events(owner_id,source,request_id,payload_digest,
  action,status,result_reference)
 values(p_owner_id,'web',p_request_id,v_digest,'web_grant_chat_session',
  'success',p_source_session_id);
 insert into public.english_audit_events(owner_id,actor_type,action,resource_id,request_id)
 values(p_owner_id,'verified-google-web','web_grant_chat_session',p_source_session_id,p_request_id);
 return pg_catalog.jsonb_build_object('status','authorized',
  'sourceSessionId',p_source_session_id,'expiresAt',v_expiry);
end;
$$;
revoke all on function public.english_web_grant_chat_session(uuid,uuid,text,text)
  from public,anon,authenticated;
grant execute on function public.english_web_grant_chat_session(uuid,uuid,text,text)
  to service_role;

-- Revocation is an append-only audit plus a change to the scoped authorization,
-- not deletion of the learner's historical mistakes or cards.
create or replace function public.english_web_revoke_chat_session(
 p_owner_id uuid,p_web_session_id uuid,p_source_session_id text,p_request_id text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_prior public.english_sync_events%rowtype;
 v_digest text;
begin
 if p_owner_id is null or p_web_session_id is null or
    p_source_session_id is null or length(p_source_session_id) not between 1 and 100 or
    p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{12,100}$'
  then raise exception 'INVALID_CHAT_REVOKE_INPUT';end if;
 if not public.english_web_session_active(p_owner_id,p_web_session_id)
  then raise exception 'WEB_SESSION_INACTIVE';end if;
 v_digest:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
  'chat-revoke:'||p_owner_id::text||':'||p_source_session_id,'UTF8')),'hex');
 perform pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(p_owner_id::text||':'||p_request_id,0));
 select * into v_prior from public.english_sync_events
  where owner_id=p_owner_id and request_id=p_request_id;
 if found then
   if v_prior.action<>'web_revoke_chat_session' or
      v_prior.payload_digest<>v_digest then raise exception 'IDEMPOTENCY_CONFLICT';end if;
   return pg_catalog.jsonb_build_object('status','replay',
      'sourceSessionId',v_prior.result_reference);
 end if;
 update public.english_session_authorizations
  set enabled=false
  where owner_id=p_owner_id and source_session_id=p_source_session_id;
 if not found then raise exception 'CHAT_SESSION_NOT_FOUND';end if;
 insert into public.english_sync_events(owner_id,source,request_id,payload_digest,
  action,status,result_reference)
 values(p_owner_id,'web',p_request_id,v_digest,'web_revoke_chat_session',
  'success',p_source_session_id);
 insert into public.english_audit_events(owner_id,actor_type,action,resource_id,request_id)
 values(p_owner_id,'verified-google-web','web_revoke_chat_session',
  p_source_session_id,p_request_id);
 return pg_catalog.jsonb_build_object('status','revoked','sourceSessionId',p_source_session_id);
end;
$$;
revoke all on function public.english_web_revoke_chat_session(uuid,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.english_web_revoke_chat_session(uuid,uuid,text,text)
 to service_role;

commit;
