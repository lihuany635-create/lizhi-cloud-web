-- Approved user-directed ChatGPT MCP candidate sync, WITHOUT a second website consent.
-- Caller is the existing identity-verified private Site bridge. The RPC remains service_role-only.
-- This patch never grants direct card promotion, weakens role grants, or writes old chat content.
begin;
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
 -- ChatGPT MCP may be used directly after the existing private Site
 -- has verified the account, bridge key and owner linkage. This is not
 -- web consent: explicitly_confirmed stays false, so we never fabricate it.
 if p_source_session_id='mcp-direct-session' then
   if not exists(select 1 from english_internal.site_owner_links l
       where l.owner_id=p_owner_id and l.enabled=true and
         l.link_verified=true and l.approved_at is not null) then
     raise exception 'LEARNING_SESSION_NOT_AUTHORIZED';
   end if;
   insert into public.english_session_authorizations(
       owner_id,source_session_id,explicitly_confirmed,
       verified_actor_id,enabled,expires_at)
   values(p_owner_id,'mcp-direct-session',false,
     'verified-private-site-mcp',true,pg_catalog.now()+interval '24 hours')
   on conflict (owner_id,source_session_id) do update
     set enabled=true,expires_at=excluded.expires_at
     where public.english_session_authorizations.explicitly_confirmed=false
       and public.english_session_authorizations.verified_actor_id='verified-private-site-mcp';
 else
   -- Preserve original web-approved source-session rules unchanged.
   if not exists(select 1 from public.english_session_authorizations s
     where s.owner_id=p_owner_id and s.source_session_id=p_source_session_id
       and s.enabled and s.explicitly_confirmed and s.expires_at>now()) then
     raise exception 'LEARNING_SESSION_NOT_AUTHORIZED';
   end if;
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

commit;
