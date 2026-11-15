\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 only, AFTER P1 + P5 + P6 + P7 + P11 migrations.
-- auth.sessions is synthetic and contains no real users or login tokens.
insert into auth.sessions(id,user_id,not_after) values
 ('5cbf2e04-61ca-4c69-9d85-4ba11dcb6303',
  '11111111-1111-4111-8111-111111111111',
  now()+interval '10 days');

set role anon;
do $$
begin
 if has_function_privilege(current_user,'public.english_web_session_active(uuid,uuid)','EXECUTE') or
    has_function_privilege(current_user,
      'public.english_web_create_candidate(uuid,text,text,text,text)','EXECUTE') or
    has_function_privilege(current_user,
      'public.english_web_promote_candidate(uuid,uuid,text,text)','EXECUTE') or
    has_function_privilege(current_user,
      'public.english_web_ignore_candidate(uuid,uuid,text)','EXECUTE') then
      raise exception 'P11_ANONYMOUS_RPC_EXPOSED';
 end if;
end $$;
reset role;
set role authenticated;
do $$
begin
 if has_function_privilege(current_user,'public.english_web_session_active(uuid,uuid)','EXECUTE') or
    has_function_privilege(current_user,
      'public.english_web_promote_candidate(uuid,uuid,text,text)','EXECUTE') then
      raise exception 'P11_AUTHENTICATED_DIRECT_WRITE_EXPOSED';
 end if;
end $$;
reset role;
set role service_role;
do $$
declare
 owner_a uuid := '11111111-1111-4111-8111-111111111111';
 owner_b uuid := '22222222-2222-4222-8222-222222222222';
 r jsonb;again jsonb; promoted jsonb; c_id uuid; other uuid;
begin
 if not public.english_web_session_active(owner_a,
   '5cbf2e04-61ca-4c69-9d85-4ba11dcb6303') then
   raise exception 'P11_REAL_SESSION_ROW_NOT_VERIFIED';
 end if;
 if public.english_web_session_active(owner_b,
   '5cbf2e04-61ca-4c69-9d85-4ba11dcb6303') then
   raise exception 'P11_CROSS_OWNER_SESSION_LEAK';
 end if;

 r=public.english_web_create_candidate(owner_a,'p11-candidate-000001','museum','博物館','');
 if r->>'status'<>'pending' then raise exception 'P11_CANDIDATE_CREATE_FAILED %',r; end if;
 c_id=(r->>'id')::uuid;
 if c_id is null then raise exception 'P11_MISSING_CANDIDATE_ID';end if;
 if exists(select 1 from public.english_cards where owner_id=owner_a
   and normalized_term='museum') then
   raise exception 'P11_MANUAL_CANDIDATE_BECAME_CARD_WITHOUT_APPROVAL'; end if;

 again=public.english_web_create_candidate(owner_a,'p11-candidate-000001','museum','博物館','');
 if again->>'status'<>'replay' or again->>'id'<>c_id::text then
   raise exception 'P11_CREATE_REPLAY_FAILED'; end if;
 again=public.english_web_create_candidate(owner_a,'p11-candidate-000002','Museum','博物館','');
 if again->>'status'<>'duplicate-pending' then raise exception 'P11_DEDUP_FAILED %',again;end if;
 begin
   perform public.english_web_create_candidate(owner_a,'p11-candidate-000001',
     'museum','different meaning','');
   raise exception 'P11_DUPLICATE_REQUEST_ACCEPTED';
 exception when raise_exception then
   if SQLERRM<>'IDEMPOTENCY_CONFLICT' then raise;end if;
 end;

 promoted=public.english_web_promote_candidate(owner_a,c_id,
   'p11-promote-0000001',repeat('a',64));
 if promoted->>'status'<>'accepted' then raise exception 'P11_PROMOTE_FAILED %',promoted; end if;
 again=public.english_web_promote_candidate(owner_a,c_id,
   'p11-promote-0000001',repeat('a',64));
 if again->>'status'<>'replay' then raise exception 'P11_PROMOTION_REPLAY_FAILED'; end if;
 if (select count(*) from public.english_cards
   where owner_id=owner_a and normalized_term='museum')<>1 then
   raise exception 'P11_FORMAL_CARD_MISSING_OR_DUPLICATED';end if;
 if not exists(select 1 from english_internal.english_card_approvals
   where owner_id=owner_a and candidate_id=c_id and consent_status='consumed') then
   raise exception 'P11_CONSENT_NOT_CONSUMED_ATOMICALLY';end if;
 if (select count(*) from public.english_audit_events
   where owner_id=owner_a and action='promote_candidate'
     and request_id='p11-promote-0000001')<>1 then
   raise exception 'P11_APPROVAL_AUDIT_NOT_ATOMIC';end if;

 again=public.english_web_create_candidate(owner_a,'p11-candidate-000003','museum','博物館','');
 if again->>'status'<>'already-active' then raise exception 'P11_ACTIVE_CARD_DEDUP_FAILED';end if;
 r=public.english_web_create_candidate(owner_a,'p11-candidate-000004','stadium','體育場','');
 other=(r->>'id')::uuid;
 again=public.english_web_ignore_candidate(owner_a,other,'p11-ignore-00000001');
 if again->>'status'<>'ignored' then raise exception 'P11_IGNORE_FAILED';end if;
 again=public.english_web_ignore_candidate(owner_a,other,'p11-ignore-00000001');
 if again->>'status'<>'replay' then raise exception 'P11_IGNORE_REPLAY_FAILED';end if;
 if exists(select 1 from public.english_cards where owner_id=owner_a
   and normalized_term='stadium') then raise exception 'P11_IGNORED_CARD_CREATED';end if;
 begin
   perform public.english_web_promote_candidate(owner_a,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'p11-promote-0000002',repeat('b',64));
   raise exception 'P11_CROSS_OWNER_PROMOTED';
 exception when raise_exception then
   if SQLERRM<>'CANDIDATE_NOT_FOUND' then raise; end if;
 end;
 begin
   perform public.english_web_create_candidate(owner_b,
    'p11-candidate-bob001','coffee','咖啡','');
   raise exception 'P11_DISABLED_OWNER_WROTE_CARD';
 exception when raise_exception then
   if SQLERRM<>'OWNER_NOT_AUTHORIZED' then raise;end if;
 end;
end $;
-- The website is the ONLY party allowed to authorize one scoped ChatGPT
-- practice conversation. An MCP client may later reference its issued ID.
do $
declare
 owner_a uuid:='11111111-1111-4111-8111-111111111111';
 web_session uuid:='5cbf2e04-61ca-4c69-9d85-4ba11dcb6303';
 source_id text:='chat-9c5f3ef2-86ec-44be-8a1b-45ba21d7fa5d';
 out_json jsonb; replay jsonb; saved jsonb;
begin
 out_json=public.english_web_grant_chat_session(
   owner_a,web_session,source_id,'p11-chat-grant-000001');
 if out_json->>'status'<>'authorized' then
   raise exception 'P11_WEB_CHAT_GRANT_FAILED %',out_json;end if;
 replay=public.english_web_grant_chat_session(
   owner_a,web_session,'chat-479f751a-7240-44a1-ad40-9eecebe1998b',
   'p11-chat-grant-000001');
 if replay->>'status'<>'replay' or replay->>'sourceSessionId'<>source_id then
   raise exception 'P11_CHAT_GRANT_IDEMPOTENCY_FAILED %',replay; end if;
 if not exists(select 1 from public.english_session_authorizations
     where owner_id=owner_a and source_session_id=source_id
       and enabled and explicitly_confirmed) then
   raise exception 'P11_CHAT_SOURCE_NOT_AUTHORIZED';end if;
 saved=public.english_p6_ingest_batch(owner_a,source_id,'p11-chat-sync-0000001',
   '[{"term":"sketch","meaningZh":"草圖"}]'::jsonb,
   '[{"original":"He draw yesterday.","corrected":"He drew yesterday.",
      "explanation":"Use the past tense drew."}]'::jsonb);
 if saved->>'status'<>'success' then
   raise exception 'P11_AUTHORIZED_CHAT_SYNC_FAILED %',saved;end if;
 out_json=public.english_web_revoke_chat_session(
   owner_a,web_session,source_id,'p11-chat-revoke-0001');
 if out_json->>'status'<>'revoked' then
   raise exception 'P11_REVOKE_CHAT_FAILED %',out_json;end if;
 if exists(select 1 from public.english_session_authorizations
     where owner_id=owner_a and source_session_id=source_id and enabled) then
   raise exception 'P11_CHAT_REVOKE_STILL_ACTIVE';end if;
 begin
   perform public.english_p6_ingest_batch(owner_a,source_id,
     'p11-chat-sync-0000002',
     '[{"term":"lunch","meaningZh":"午餐"}]'::jsonb,'[]'::jsonb);
   raise exception 'P11_REVOKED_CHAT_STILL_WRITABLE';
 exception when raise_exception then
   if SQLERRM<>'LEARNING_SESSION_NOT_AUTHORIZED' then raise;end if;
 end;
end $;
reset role;
delete from auth.sessions where id='5cbf2e04-61ca-4c69-9d85-4ba11dcb6303';
set role service_role;
do $$
begin
 if public.english_web_session_active(
  '11111111-1111-4111-8111-111111111111',
  '5cbf2e04-61ca-4c69-9d85-4ba11dcb6303') then
  raise exception 'P11_REVOKED_SESSION_STILL_VALID';
 end if;
end $$;
reset role;
select 'P11_ATOMIC_CANDIDATES_APPROVAL_SESSION_RLS_PASS' as result;
