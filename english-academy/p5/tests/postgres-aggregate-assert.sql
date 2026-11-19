\set ON_ERROR_STOP on
-- Run once on synthetic source and again on restored disposable database.
do $$
begin
 if (select count(*) from public.english_review_states) <> 2 then raise exception 'REVIEW_STATE_RESTORE_FAILED'; end if;
 if (select count(*) from public.english_review_events) <> 1 then raise exception 'REVIEW_EVENT_RESTORE_FAILED'; end if;
 if (select count(*) from public.english_skill_evidence) <> 1 then raise exception 'SKILL_EVIDENCE_RESTORE_FAILED'; end if;
 if (select count(*) from public.english_session_authorizations) <> 1 then raise exception 'SESSION_AUTH_RESTORE_FAILED'; end if;
 if (select count(*) from public.english_error_records) <> 1 then raise exception 'ERROR_RECORD_RESTORE_FAILED'; end if;
 if (select count(*) from public.english_assessment_results) <> 1 then raise exception 'ASSESSMENT_RESTORE_FAILED'; end if;
 if (select count(*) from public.english_learning_plans) <> 1 then raise exception 'PLAN_RESTORE_FAILED'; end if;
 if not exists (select 1 from public.english_review_events
   where owner_id='11111111-1111-4111-8111-111111111111'
     and request_id='p5-review-test-00001' and rating=3 and model_version='FSRS-7') then
   raise exception 'FSRS_HISTORY_RESTORE_LOST';
 end if;
 if not exists (select 1 from public.english_error_records
  where category='present-perfect' and original_sentence='I hasn''t ate.') then
   raise exception 'ERROR_CONTENT_RESTORE_LOST';
 end if;
 if not exists (select 1 from public.english_assessment_results
  where owner_approved=false and assessor_type='ai-proposal' and proposed_level='A0') then
   raise exception 'ASSESSMENT_APPROVAL_FLIPPED';
 end if;
end $$;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
begin
 if (select count(*) from public.english_review_states) <> 1 or
    (select count(*) from public.english_review_events) <> 1 or
    (select count(*) from public.english_skill_evidence) <> 1 or
    (select count(*) from public.english_session_authorizations) <> 1 or
    (select count(*) from public.english_error_records) <> 1 or
    (select count(*) from public.english_assessment_results) <> 1 or
    (select count(*) from public.english_learning_plans) <> 1 then
    raise exception 'OWNER_SENSITIVE_RLS_FAILED';
 end if;
 if has_table_privilege(current_user,'public.english_review_events','INSERT') or
    has_table_privilege(current_user,'public.english_learning_plans','UPDATE') then
    raise exception 'DIRECT_USER_WRITE_LEAK';
 end if;
end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
 if (select count(*) from public.english_review_states) <> 0 or
    (select count(*) from public.english_learning_plans) <> 0 then
     raise exception 'DISABLED_OWNER_RLS_LEAK';
 end if;
end $$;
reset role;
set role service_role;
do $$
begin
 if has_table_privilege(current_user,'public.english_review_events','UPDATE') or
    has_table_privilege(current_user,'public.english_skill_evidence','DELETE') or
    has_table_privilege(current_user,'public.english_error_records','UPDATE') then
      raise exception 'IMMUTABLE_HISTORY_WRITE_LEAK';
 end if;
end $$;
reset role;
select 'P5_AGGREGATE_SOURCE_OR_RESTORED_DATA_PASS' as result;
