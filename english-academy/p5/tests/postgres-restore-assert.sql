\set ON_ERROR_STOP on
-- P5 backup/restore assertions. Use ONLY in an ephemeral PostgreSQL 17 DB
-- named english_p5_restore, never against a user-owned database.
do $$
declare
 candidate_count integer; card_count integer; audit_count integer; sync_count integer;
begin
 select count(*) into candidate_count from public.english_card_candidates;
 select count(*) into card_count from public.english_cards;
 select count(*) into audit_count from public.english_audit_events;
 select count(*) into sync_count from public.english_sync_events;
 if (select count(*) from public.english_authorized_users) <> 2 then
   raise exception 'RESTORE_AUTHORIZED_OWNER_COUNT_MISMATCH';
 end if;
 if candidate_count <> 3 or card_count <> 3 or audit_count <> 1 or sync_count <> 1 then
   raise exception 'RESTORE_ROW_COUNTS_MISMATCH: candidate % card % audit % sync %',
      candidate_count,card_count,audit_count,sync_count;
 end if;
 if not exists (
   select 1 from public.english_card_candidates where
   id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and
   owner_id='11111111-1111-4111-8111-111111111111' and status='accepted'
 ) then raise exception 'RESTORE_APPROVED_CANDIDATE_LOST'; end if;
 if not exists(
   select 1 from public.english_cards where
   owner_id='11111111-1111-4111-8111-111111111111' and normalized_term='hungry'
 ) then raise exception 'RESTORE_FORMAL_CARD_LOST'; end if;
 if not exists (
   select 1 from public.english_audit_events
    where request_id='promote-hungry-000001' and action='promote_candidate'
 ) then raise exception 'RESTORE_AUDIT_HISTORY_LOST'; end if;
 if not exists (
   select 1 from public.english_sync_events
    where request_id='promote-hungry-000001' and status='success'
 ) then raise exception 'RESTORE_SYNC_EVENT_LOST'; end if;
end $$;

-- Re-check row isolation in the RESTORED database.
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
begin
 if (select count(*) from public.english_card_candidates) <> 2 then
   raise exception 'RESTORED_ALICE_RLS_FAILED';
 end if;
 if (select count(*) from public.english_cards) <> 2 then
   raise exception 'RESTORED_ALICE_CARD_RLS_FAILED';
 end if;
 if has_table_privilege(current_user,'public.english_cards','INSERT') then
   raise exception 'RESTORED_WRITE_GRANT_LEAK';
 end if;
end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
 if (select count(*) from public.english_cards) <> 0 then
   raise exception 'RESTORED_DISABLED_ACCOUNT_READ_LEAK';
 end if;
end $$;
reset role;

select 'P5_DISPOSABLE_POSTGRES_BACKUP_RESTORE_PASS' as result;
