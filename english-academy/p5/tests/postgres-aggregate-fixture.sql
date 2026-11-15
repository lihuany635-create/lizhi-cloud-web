\set ON_ERROR_STOP on
-- Synthetic P5 integration rows in disposable PG17 source only.
insert into public.english_review_states(owner_id,card_id,model_version,library_version,due_at,state_json)
values
 ('11111111-1111-4111-8111-111111111111','dddddddd-dddd-4ddd-8ddd-dddddddddddd','FSRS-7','6.0.0','2026-11-17T00:00:00Z','{"stability":2,"difficulty":5}'),
 ('22222222-2222-4222-8222-222222222222','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','FSRS-7','6.0.0','2026-11-17T00:00:00Z','{"stability":1,"difficulty":4}');
insert into public.english_review_events(owner_id,card_id,request_id,rating,model_version,before_json,after_json,reviewed_at)
values('11111111-1111-4111-8111-111111111111','dddddddd-dddd-4ddd-8ddd-dddddddddddd',
 'p5-review-test-00001',3,'FSRS-7','{"stability":0}','{"stability":2}','2026-11-15T00:00:00Z');
insert into public.english_skill_evidence(owner_id,source_event_id,skill,grader,score,weight,evidence_state,occurred_at)
values('11111111-1111-4111-8111-111111111111','p5-review-test-00001','vocabulary',
 'objective',1,1,'observed','2026-11-15T00:00:00Z');
insert into public.english_session_authorizations(owner_id,source_session_id,explicitly_confirmed,verified_actor_id,enabled,expires_at)
values('11111111-1111-4111-8111-111111111111','approved-session-001',true,'verified-site-actor',true,'2026-12-15T00:00:00Z');
insert into public.english_error_records(owner_id,source_event_id,source_session_id,original_sentence,corrected_sentence,explanation,skill,category,occurred_at)
values('11111111-1111-4111-8111-111111111111','p5-error-test-001',
 'approved-session-001','I hasn''t ate.','I haven''t eaten.','Use have + past participle.',
 'grammar','present-perfect','2026-11-15T00:00:00Z');
insert into public.english_assessment_results(owner_id,skill,proposed_level,rubric_version,assessor_type,evidence_refs,owner_approved)
values('11111111-1111-4111-8111-111111111111','vocabulary','A0','p4-rubric-v1',
 'ai-proposal','["p5-review-test-00001"]',false);
insert into public.english_learning_plans(owner_id,planned_for,policy_version,plan_json,status)
values('11111111-1111-4111-8111-111111111111','2026-11-15','p4-adaptive-v1',
 '{"goalMinutes":20,"tasks":[]}','suggested');
select 'P5_AGGREGATE_DISPOSABLE_FIXTURE_PASS' as result;
