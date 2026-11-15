\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 database only. No real user data or Supabase.
-- The authenticated role must FAIL even when resolving private schema names;
-- PostgreSQL may raise permission denied before has_table_privilege can answer.
set role authenticated;
do $$
begin
 if has_schema_privilege(current_user,'english_internal','USAGE') then
   raise exception 'P7_AUTHENTICATED_SCHEMA_LEAK';
 end if;
 begin
   perform count(*) from english_internal.site_owner_links;
   raise exception 'P7_AUTHENTICATED_PRIVATE_READ_LEAK';
 exception when insufficient_privilege then null;
 end;
 begin
   perform english_internal.consume_and_promote_candidate(
     '11111111-1111-4111-8111-111111111111',
     '99999999-9999-4999-8999-999999999999',
     'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
     'p7-approve-apple-0001','digest-apple-server-20261115');
   raise exception 'P7_AUTHENTICATED_RPC_LEAK';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
set role anon;
do $$
begin
 if has_schema_privilege(current_user,'english_internal','USAGE') then
   raise exception 'P7_ANON_SCHEMA_LEAK';
 end if;
 begin
   perform count(*) from english_internal.site_owner_links;
   raise exception 'P7_ANON_READ_LEAK';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;

set role service_role;
insert into english_internal.site_owner_links(
 owner_id,chatgpt_account_sha256,link_verified,enabled,approved_at)
values('11111111-1111-4111-8111-111111111111',repeat('a',64),
 true,true,now());
do $$
begin
 if not exists(select 1 from english_internal.site_owner_links
  where owner_id='11111111-1111-4111-8111-111111111111'
    and link_verified and enabled) then
   raise exception 'P7_OWNER_LINK_NOT_STORED';
 end if;
 -- A reused ChatGPT account digest cannot be linked to another owner.
 begin
  insert into english_internal.site_owner_links(
   owner_id,chatgpt_account_sha256,link_verified,enabled,approved_at)
  values('22222222-2222-4222-8222-222222222222',repeat('a',64),
    true,true,now());
  raise exception 'P7_MULTIPLE_OWNERS_SHARED_SITE_ID';
 exception when unique_violation then null;
 end;
end $$;

insert into english_internal.english_card_approvals(
 approval_id,owner_id,candidate_id,action,request_id,
 payload_digest,consent_status,approved_by_server,expires_at)
values(
 '99999999-9999-4999-8999-999999999999',
 '11111111-1111-4111-8111-111111111111',
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'promote_candidate','p7-approve-apple-0001',
 'digest-apple-server-20261115','approved','server-verified-owner',
 now()+interval '5 minutes'
);
do $$
declare
 a jsonb;
 b jsonb;
begin
 a=english_internal.consume_and_promote_candidate(
  '11111111-1111-4111-8111-111111111111',
  '99999999-9999-4999-8999-999999999999',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'p7-approve-apple-0001','digest-apple-server-20261115');
 if a->>'status'<>'accepted' then raise exception 'P7_PROMOTION_DENIED %',a;end if;
 b=english_internal.consume_and_promote_candidate(
  '11111111-1111-4111-8111-111111111111',
  '99999999-9999-4999-8999-999999999999',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'p7-approve-apple-0001','digest-apple-server-20261115');
 if b->>'status'<>'replay' or b->>'card_id'<>a->>'card_id'
 then raise exception 'P7_REPLAY_BROKEN %',b;end if;
 if not exists(select 1 from english_internal.english_card_approvals
  where approval_id='99999999-9999-4999-8999-999999999999'
    and consent_status='consumed' and consumed_at is not null) then
    raise exception 'P7_APPROVAL_NOT_CONSUMED';
 end if;
 if (select count(*) from public.english_cards where owner_id=
   '11111111-1111-4111-8111-111111111111' and normalized_term='apple')<>1
 then raise exception 'P7_DUPLICATE_CARD';end if;
end $$;
-- An already consumed approval cannot be reused for another term or owner.
do $$
begin
 begin
 perform english_internal.consume_and_promote_candidate(
  '11111111-1111-4111-8111-111111111111',
  '99999999-9999-4999-8999-999999999999',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'p7-approve-apple-0001','digest-other');
 raise exception 'P7_DIGEST_MISMATCH_ALLOWED';
 exception when raise_exception then
  if SQLERRM<>'P7_APPROVAL_NOT_MATCHED' then raise;end if;
 end;
 begin
 perform english_internal.consume_and_promote_candidate(
  '22222222-2222-4222-8222-222222222222',
  '99999999-9999-4999-8999-999999999999',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'p7-approve-apple-0001','digest-apple-server-20261115');
 raise exception 'P7_OWNER_MISMATCH_ALLOWED';
 exception when raise_exception then
  if SQLERRM not in ('P7_OWNER_NOT_AUTHORIZED','P7_APPROVAL_NOT_MATCHED') then raise;end if;
 end;
end $$;
insert into english_internal.english_card_approvals(
 approval_id,owner_id,candidate_id,action,request_id,payload_digest,
 consent_status,approved_by_server,expires_at)
values(
 '88888888-8888-4888-8888-888888888888',
 '11111111-1111-4111-8111-111111111111',
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'promote_candidate','p7-expired-apple-001',
 'digest-expired-20261115','approved','server-verified-owner',
 now()-interval '5 minutes'
);
do $$
begin
 begin
  perform english_internal.consume_and_promote_candidate(
  '11111111-1111-4111-8111-111111111111',
  '88888888-8888-4888-8888-888888888888',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'p7-expired-apple-001','digest-expired-20261115');
  raise exception 'P7_EXPIRED_APPROVAL_ACCEPTED';
 exception when raise_exception then
   if SQLERRM<>'P7_APPROVAL_EXPIRED_OR_REVOKED' then raise;end if;
 end;
 if (select count(*) from public.english_sync_events where
   request_id='p7-expired-apple-001')<>0 then
   raise exception 'P7_EXPIRED_APPROVAL_CREATED_EVENT';
 end if;
end $$;
reset role;
select 'P7_PRIVATE_OWNER_LINK_AND_ATOMIC_CONSENT_PASS' as result;
