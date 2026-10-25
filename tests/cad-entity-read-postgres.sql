\set ON_ERROR_STOP on
-- Run AFTER tests/cad-sites-postgres.sql in disposable PG16 ONLY.
\i cad/sites/sql/002_entity_read_jobs.REVIEW_ONLY.sql
do $test$
begin
 if has_function_privilege('anon','public.lizhi_cad_site_read_enqueue(uuid,uuid,text,jsonb,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.lizhi_cad_site_read_enqueue(uuid,uuid,text,jsonb,uuid)','EXECUTE')
    or has_function_privilege('anon','public.lizhi_cad_site_read_job(uuid,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.lizhi_cad_site_read_job(uuid,uuid)','EXECUTE')
 then raise exception 'read-only Site RPC was granted to public or browser role'; end if;
end $test$;
-- Use second local user, so first owner's rate-limit fixture doesn't consume quota.
set role authenticated;
set request.jwt.claim.role='authenticated';
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
set request.jwt.claim.allowed='true';
select public.lizhi_cad_begin_session('55555555-5555-4555-8555-555555555555');
reset role;
set role service_role;
set request.jwt.claim.role='service_role';
do $test$
declare
 owner uuid:='22222222-2222-4222-8222-222222222222';
 session uuid:='55555555-5555-4555-8555-555555555555';
 req uuid:='66666666-6666-4666-8666-666666666666';
 job uuid;
begin
 begin
  perform public.lizhi_cad_site_read_enqueue(owner,session,'lizhi.entities',
    '{"limit":1000}'::jsonb,gen_random_uuid());
  raise exception 'unbounded list passed';
 exception when invalid_parameter_value then null;
 end;
 begin
  perform public.lizhi_cad_site_read_enqueue(owner,session,'erase','{}',gen_random_uuid());
  raise exception 'write through read bridge passed';
 exception when invalid_parameter_value then null;
 end;
 begin
  perform public.lizhi_cad_site_read_enqueue('11111111-1111-4111-8111-111111111111',
    session,'lizhi.inspect','{}',gen_random_uuid());
  raise exception 'cross-owner session accepted';
 exception when insufficient_privilege then null;
 end;
 job:=public.lizhi_cad_site_read_enqueue(owner,session,'lizhi.entities',
       '{"limit":4,"offset":0}'::jsonb,req);
 if job is distinct from public.lizhi_cad_site_read_enqueue(owner,session,'lizhi.entities',
       '{"offset":0,"limit":4}'::jsonb,req) then raise exception 'duplicate did not return original'; end if;
 if public.lizhi_cad_site_read_job(owner,job)->>'state'<>'queued' then
  raise exception 'read job not queued'; end if;
 if public.lizhi_cad_site_read_job('11111111-1111-4111-8111-111111111111',job) is not null then
  raise exception 'cross owner read result';end if;
 begin
  perform public.lizhi_cad_site_read_enqueue(owner,session,'lizhi.inspect','{}',req);
  raise exception 'conflicting read request accepted';
 exception when unique_violation then null;
 end;
end $test$;
reset role;
set role authenticated;
set request.jwt.claim.role='authenticated';
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
set request.jwt.claim.allowed='true';
do $test$
declare item jsonb;
begin
 item:=public.lizhi_cad_claim_next('55555555-5555-4555-8555-555555555555');
 if item->>'command'<>'lizhi.entities' then raise exception 'browser did not claim bounded read job'; end if;
 if not public.lizhi_cad_finish('55555555-5555-4555-8555-555555555555',
    (item->>'id')::uuid,true,
    '{"revision":7,"entities":[{"handle":"1A","type":"LINE","layer":"0","geometry":{"start":[0,0],"end":[800,900]}}]}'::jsonb,null)
 then raise exception 'native bounded read finish failed'; end if;
end $test$;
reset role;
-- The test harness must be postgres for direct private-table assertions;
-- service_role itself has deliberately NO SELECT on lizhi_private.
set request.jwt.claim.role='service_role';
do $test$
declare job jsonb;
begin
 select public.lizhi_cad_site_read_job('22222222-2222-4222-8222-222222222222',c.id) into job
 from lizhi_private.lizhi_cad_commands c
 where c.user_id='22222222-2222-4222-8222-222222222222'
    and c.idempotency_key='66666666-6666-4666-8666-666666666666';
 if job->>'state'<>'succeeded' or job->'data'->>'revision'<>'7' then
  raise exception 'bounded read receipt missing';end if;
 if public.lizhi_cad_site_read_job('11111111-1111-4111-8111-111111111111',
 (select id from lizhi_private.lizhi_cad_commands where command='rectang' limit 1)) is not null then
  raise exception 'write job result exposed';end if;
end $test$;
reset role;
select 'CAD_ENTITY_READ_POSTGRES_PRIVILEGES_AND_JOB_PASS' as result;
