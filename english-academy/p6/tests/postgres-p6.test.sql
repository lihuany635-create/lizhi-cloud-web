\set ON_ERROR_STOP on
-- Disposable PG17 only, seeded by P1 + P5 candidate migrations and synthetic fixtures.
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
begin
 if has_table_privilege(current_user,'public.english_p6_sync_requests','INSERT') or
    has_table_privilege(current_user,'public.english_p6_sentence_reviews','UPDATE') or
    has_function_privilege(current_user,
      'public.english_p6_ingest_batch(uuid,text,text,jsonb,jsonb)','EXECUTE') then
   raise exception 'P6_AUTHENTICATED_WRITE_OR_RPC_LEAK';
 end if;
end $$;
reset role;

set role service_role;
do $$
declare
 r jsonb;
 replay jsonb;
 count_before integer;
begin
 r=public.english_p6_ingest_batch(
   '11111111-1111-4111-8111-111111111111','approved-session-001',
   'p6-sync-000000000001',
   '[{"term":"weather","meaningZh":"天氣","senseKey":""},
     {"term":"rice","meaningZh":"米飯"}]'::jsonb,
   '[{"original":"I hasn''t ate.","corrected":"I haven''t eaten.","explanation":"Use haven''t eaten."}]'::jsonb
 );
 if r->>'status'<>'success' or (r->>'pendingAdded')::int<>1 or
    (r->>'candidatesDuplicated')::int<>1 or (r->>'errorsAdded')::int<>1
 then raise exception 'P6_INGEST_UNEXPECTED_OUTCOME %',r; end if;
 replay=public.english_p6_ingest_batch(
   '11111111-1111-4111-8111-111111111111','approved-session-001',
   'p6-sync-000000000001',
   '[{"term":"weather","meaningZh":"天氣","senseKey":""},
     {"term":"rice","meaningZh":"米飯"}]'::jsonb,
   '[{"original":"I hasn''t ate.","corrected":"I haven''t eaten.","explanation":"Use haven''t eaten."}]'::jsonb
 );
 if replay->>'replay'<>'true' then raise exception 'P6_REPLAY_MISSING'; end if;
 if (select count(*) from public.english_p6_sync_requests where
    owner_id='11111111-1111-4111-8111-111111111111')<>1 then
    raise exception 'P6_DUPLICATE_REQUEST_CREATED'; end if;
 if (select count(*) from public.english_card_candidates where
    owner_id='11111111-1111-4111-8111-111111111111' and normalized_term='weather')<>1
 then raise exception 'P6_DUPLICATE_CANDIDATE_CREATED'; end if;
 count_before=(select count(*) from public.english_card_candidates);
 -- Different payload with same requestId must not rewrite history.
 begin
   perform public.english_p6_ingest_batch(
    '11111111-1111-4111-8111-111111111111','approved-session-001',
    'p6-sync-000000000001','[{"term":"sunny","meaningZh":"晴朗"}]'::jsonb,'[]'::jsonb);
   raise exception 'P6_IDEMPOTENCY_NOT_ENFORCED';
 exception when raise_exception then
   if SQLERRM<>'IDEMPOTENCY_CONFLICT' then raise; end if;
 end;
 if (select count(*) from public.english_card_candidates)<>count_before
 then raise exception 'P6_CONFLICT_CREATED_DATA';end if;
 -- Attempt to use another owner's authorization must not be accepted.
 begin
   perform public.english_p6_ingest_batch(
    '22222222-2222-4222-8222-222222222222','approved-session-001',
    'p6-sync-000000000002','[{"term":"sunny","meaningZh":"晴朗"}]'::jsonb,'[]'::jsonb);
   raise exception 'P6_WRONG_OWNER_SESSION_SUCCEEDED';
 exception when raise_exception then
   if SQLERRM not in ('LEARNING_SESSION_NOT_AUTHORIZED','OWNER_NOT_AUTHORIZED') then raise;end if;
 end;
 -- A malformed item later in the same batch must roll back all earlier inserts.
 begin
   perform public.english_p6_ingest_batch(
    '11111111-1111-4111-8111-111111111111','approved-session-001',
    'p6-sync-000000000003',
    '[{"term":"humidity","meaningZh":"濕度"},{"term":"","meaningZh":"空白"}]'::jsonb,'[]'::jsonb);
   raise exception 'P6_PARTIAL_BATCH_SUCCEEDED';
 exception when raise_exception then
   if SQLERRM<>'INVALID_CANDIDATE' then raise;end if;
 end;
 if exists(select 1 from public.english_card_candidates where normalized_term='humidity') then
   raise exception 'P6_TRANSACTION_ROLLBACK_FAILED';
 end if;
 -- Revoked source session stops future writes.
 update public.english_session_authorizations set enabled=false
   where owner_id='11111111-1111-4111-8111-111111111111'
   and source_session_id='approved-session-001';
 begin
   perform public.english_p6_ingest_batch(
    '11111111-1111-4111-8111-111111111111','approved-session-001',
    'p6-sync-000000000004','[{"term":"cloud","meaningZh":"雲"}]'::jsonb,'[]'::jsonb);
   raise exception 'P6_REVOKED_SESSION_SUCCEEDED';
 exception when raise_exception then
   if SQLERRM<>'LEARNING_SESSION_NOT_AUTHORIZED' then raise;end if;
 end;
 update public.english_session_authorizations set enabled=true
   where owner_id='11111111-1111-4111-8111-111111111111'
   and source_session_id='approved-session-001';
 -- Confirm owner B cannot read A's synced request with authenticated RLS.
end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
 if (select count(*) from public.english_p6_sync_requests)<>0 then
   raise exception 'P6_CROSS_OWNER_READ_LEAK';
 end if;
end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
begin
 if (select count(*) from public.english_p6_sync_requests)<>1 then
   raise exception 'P6_OWNER_READ_MISSING';
 end if;
end $$;
reset role;
select 'P6_ATOMIC_SESSION_SYNC_RLS_PASS' as result;
