\set ON_ERROR_STOP on
-- Disposable CI database ONLY: never run against production.
insert into public.english_authorized_users(owner_id,enabled) values
 ('11111111-1111-4111-8111-111111111111',true),
 ('22222222-2222-4222-8222-222222222222',true);
insert into public.english_card_candidates(id,owner_id,source_event_id,term,normalized_term,meaning_zh) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','evt-001','hungry','hungry','飢餓的'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','evt-002','sleepy','sleepy','想睡的'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111','evt-003','apple','apple','蘋果');
insert into public.english_cards(id,owner_id,term,normalized_term,meaning_zh) values
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-4111-8111-111111111111','rice','rice','米飯'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','22222222-2222-4222-8222-222222222222','tea','tea','茶');
-- Authenticated users can SELECT only their own data and cannot mutate it.
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
begin
 if (select count(*) from public.english_card_candidates) <> 2 then
   raise exception 'ALICE_CANDIDATE_ISOLATION_FAILED';
 end if;
 if (select count(*) from public.english_cards) <> 1 then
   raise exception 'ALICE_CARD_ISOLATION_FAILED';
 end if;
 if has_table_privilege(current_user,'public.english_cards','INSERT') then
   raise exception 'ALICE_WRITE_PERMISSION_LEAK';
 end if;
 if has_function_privilege(current_user,'public.english_promote_candidate(uuid,uuid,text,text)','EXECUTE') then
   raise exception 'ALICE_RPC_EXECUTE_LEAK';
 end if;
end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
 if (select count(*) from public.english_card_candidates) <> 1 then
   raise exception 'BOB_CANDIDATE_ISOLATION_FAILED';
 end if;
 if (select count(*) from public.english_cards) <> 1 then
   raise exception 'BOB_CARD_ISOLATION_FAILED';
 end if;
end $$;
reset role;
-- If the allowlist disables Bob, RLS hides his data.
update public.english_authorized_users set enabled=false where owner_id='22222222-2222-4222-8222-222222222222';
set role authenticated;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
 if (select count(*) from public.english_card_candidates) <> 0 or
    (select count(*) from public.english_cards) <> 0 then
    raise exception 'DISABLED_OWNER_CAN_READ';
 end if;
end $$;
reset role;
-- Anonymous users cannot read private learning data even with forged claim.
set role anon;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
begin
 if has_table_privilege(current_user,'public.english_cards','SELECT') then
   raise exception 'ANON_READ_PRIVILEGE_LEAK';
 end if;
 if has_function_privilege(current_user,'public.english_promote_candidate(uuid,uuid,text,text)','EXECUTE') then
   raise exception 'ANON_RPC_PRIVILEGE_LEAK';
 end if;
end $$;
reset role;
-- Only privileged server role can promote candidate atomically.
set role service_role;
do $$
declare a jsonb; b jsonb;
begin
 a := public.english_promote_candidate(
 '11111111-1111-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'promote-hungry-000001','digest-hungry-000001');
 if a->>'status' <> 'accepted' then raise exception 'PROMOTE_FAILED: %',a; end if;
 b := public.english_promote_candidate(
 '11111111-1111-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'promote-hungry-000001','digest-hungry-000001');
 if b->>'status' <> 'replay' or b->>'card_id' <> a->>'card_id' then
   raise exception 'REPLAY_FAILED: % %',a,b;
 end if;
 if (select count(*) from public.english_cards where owner_id =
   '11111111-1111-4111-8111-111111111111' and normalized_term='hungry') <> 1 then
   raise exception 'DUPLICATE_CARD_CREATED';
 end if;
 if (select count(*) from public.english_audit_events where action='promote_candidate') <> 1 then
   raise exception 'AUDIT_MISSING_OR_DUPLICATED';
 end if;
end $$;
-- New candidate with reused request ID but DIFFERENT payload must fail.
do $$
begin
 begin
   perform public.english_promote_candidate(
      '11111111-1111-4111-8111-111111111111',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'promote-hungry-000001','digest-apple-000001');
   raise exception 'DID_NOT_REJECT_CONFLICT';
 exception when raise_exception then
   if SQLERRM <> 'IDEMPOTENCY_CONFLICT' then raise; end if;
 end;
end $$;
-- Cross-owner promotion must fail before any mutation.
do $$
begin
 begin
   perform public.english_promote_candidate(
      '11111111-1111-4111-8111-111111111111',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'promote-sleepy-000001','digest-sleepy-000001');
   raise exception 'DID_NOT_REJECT_OTHER_OWNER';
 exception when raise_exception then
   if SQLERRM <> 'CANDIDATE_NOT_FOUND' then raise; end if;
 end;
end $$;
-- A service role must not UPDATE/DELETE append-only event tables.
do $$
begin
 if has_table_privilege(current_user,'public.english_practice_events','UPDATE') or
    has_table_privilege(current_user,'public.english_practice_events','DELETE') or
    has_table_privilege(current_user,'public.english_audit_events','UPDATE') then
    raise exception 'APPEND_ONLY_PRIVILEGE_LEAK';
 end if;
end $$;
reset role;
select 'ENGLISH_P1_RLS_AND_PROMOTION_TESTS_PASS' as result;
