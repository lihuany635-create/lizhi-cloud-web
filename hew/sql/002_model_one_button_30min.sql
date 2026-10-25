-- 立之 3D：single-button 30-minute session, non-renewing consent.
-- Safe isolated upgrade: only five owner-scoped lizhi_model_* RPC implementations.
-- Auth and 3D browser still verify owner on every poll; no service-role
-- exposure, no RLS changes and no schema/table changes.
-- Existing grants are preserved by CREATE OR REPLACE.
-- Browser polls at a bounded interval; allow background timer throttling
-- up to 5 minutes without treating a verified consenting owner as offline.
-- 30-minute absolute approved_until is NEVER extended by heartbeat.
create or replace function public.lizhi_model_begin(
 p_session uuid,p_document uuid,p_revision text)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); accepted uuid;
begin
 if actor is null or not public.lizhi_web_is_allowed() or
    p_session is null or p_document is null or length(coalesce(p_revision,'')) not between 1 and 128
   then raise exception 'model permission required' using errcode='42501'; end if;
 insert into lizhi_model_private.sessions as s
 (id,owner_uid,document_id,revision,enabled,last_seen,approved_until,scene_summary)
 values(p_session,actor,p_document,p_revision,true,statement_timestamp(),
        statement_timestamp()+interval '30 minutes','{"entities":[]}'::jsonb)
 on conflict(id) do update set
  enabled=true,document_id=p_document,revision=p_revision,
  last_seen=statement_timestamp(),approved_until=statement_timestamp()+interval '30 minutes',
  scene_summary='{"entities":[]}'::jsonb
 where s.owner_uid=actor and not exists(
   select 1 from lizhi_model_private.jobs j where j.session_id=s.id and j.state='claimed')
 returning id into accepted;
 return accepted=p_session;
end $$;

create or replace function public.lizhi_model_claim(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); claimed_row record;
begin
 if actor is null or not public.lizhi_web_is_allowed() then return null; end if;
 perform 1 from lizhi_model_private.sessions s
 where s.id=p_session and s.owner_uid=actor and s.enabled
   and s.last_seen>statement_timestamp()-interval '5 minutes'
   and s.approved_until>statement_timestamp()
 for update of s;
 if not found then return null; end if;
 -- Serialize all claims for the same session; a first claim must be ACKed
 -- or manually reconciled before any later job may be picked.
 if exists (select 1 from lizhi_model_private.jobs j
   where j.session_id=p_session and j.owner_uid=actor and j.state='claimed')
 then return null; end if;
 update lizhi_model_private.jobs
 set state='expired',completed_at=statement_timestamp()
 where session_id=p_session and owner_uid=actor and state='queued'
   and expires_at<=statement_timestamp();
 with picked as (
  select j.id from lizhi_model_private.jobs j
  join lizhi_model_private.sessions s on s.id=j.session_id
  where j.session_id=p_session and j.owner_uid=actor and j.state='queued'
    and j.document_id=s.document_id and j.expected_revision=s.revision
    and j.expires_at>statement_timestamp()
  order by j.created_at,j.id limit 1 for update of j skip locked
 )
 update lizhi_model_private.jobs j set state='claimed',claimed_at=statement_timestamp()
 from picked where j.id=picked.id
 returning j.id,j.request_id,j.command,j.params,j.document_id,j.expected_revision into claimed_row;
 if not found then return null; end if;
 return jsonb_build_object('job_id',claimed_row.id,'request_id',claimed_row.request_id,
  'command',claimed_row.command,'params',claimed_row.params,'document_id',claimed_row.document_id,
  'expected_revision',claimed_row.expected_revision,'session_id',p_session);
end $$;

create or replace function public.lizhi_model_site_sessions(p_owner uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select case when (auth.jwt()->>'role')<>'service_role' or p_owner is null
 then '[]'::jsonb else coalesce((
 select jsonb_agg(jsonb_build_object('session_id',x.id,
  'document_id',x.document_id) order by x.last_seen desc)
 from (select s.id,s.document_id,s.last_seen from lizhi_model_private.sessions s
       where s.owner_uid=p_owner and s.enabled and
       s.approved_until>now() and s.last_seen>now()-interval '5 minutes'
       order by s.last_seen desc limit 8) x
 ),'[]'::jsonb) end;
$$;

create or replace function public.lizhi_model_site_enqueue(
 p_owner uuid,p_session uuid,p_request_id uuid,p_document uuid,
 p_revision text,p_command text,p_params jsonb)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare job_id uuid;
begin
 if (auth.jwt()->>'role') is distinct from 'service_role' or p_owner is null or
  p_request_id is null or p_document is null or
  length(coalesce(p_revision,'')) not between 1 and 128 or
  not lizhi_model_private.valid_command(p_command,p_params)
 then raise exception 'invalid model site request' using errcode='42501'; end if;
 select j.id into job_id from lizhi_model_private.jobs j
 where j.owner_uid=p_owner and j.request_id=p_request_id
   and j.session_id=p_session and j.document_id=p_document
   and j.expected_revision=p_revision and j.command=p_command and j.params=p_params;
 if job_id is not null then return job_id; end if;
 if exists(select 1 from lizhi_model_private.jobs j where j.owner_uid=p_owner and j.request_id=p_request_id)
 then raise exception 'request_id reused with different model job' using errcode='23505'; end if;
 perform 1 from lizhi_model_private.sessions s
 where s.id=p_session and s.owner_uid=p_owner and s.document_id=p_document
   and s.revision=p_revision and s.enabled and s.approved_until>statement_timestamp()
   and s.last_seen>statement_timestamp()-interval '5 minutes';
 if not found then raise exception 'owner document session not approved' using errcode='42501'; end if;
 if (select count(*) from lizhi_model_private.jobs j
   where j.owner_uid=p_owner and j.created_at>statement_timestamp()-interval '60 seconds')>=15
 then raise exception 'model rate limit' using errcode='P0001'; end if;
 insert into lizhi_model_private.jobs(owner_uid,session_id,request_id,document_id,expected_revision,command,params)
 values(p_owner,p_session,p_request_id,p_document,p_revision,p_command,p_params)
 on conflict(owner_uid,request_id) do nothing returning id into job_id;
 if job_id is null then
  select j.id into job_id from lizhi_model_private.jobs j
  where j.owner_uid=p_owner and j.request_id=p_request_id
    and j.session_id=p_session and j.document_id=p_document
    and j.expected_revision=p_revision and j.command=p_command and j.params=p_params;
 end if;
 if job_id is null then raise exception 'idempotency conflict' using errcode='23505'; end if;
 return job_id;
end $$;

create or replace function public.lizhi_model_site_scene(p_owner uuid,p_session uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('document_id',s.document_id::text,'revision',s.revision,'entities',s.scene_summary->'entities')
 from lizhi_model_private.sessions s
 where (auth.jwt()->>'role')='service_role' and p_owner is not null
 and s.owner_uid=p_owner and s.id=p_session and s.enabled
 and s.approved_until>now() and s.last_seen>now()-interval '5 minutes';
$$;
