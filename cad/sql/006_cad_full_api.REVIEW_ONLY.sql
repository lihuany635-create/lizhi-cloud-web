-- 立之 CAD｜完整指令（瀏覽器模式）
-- REVIEW ONLY. On top of the deployed lizhi_cad_mcp_secure_relay_v1 + Sites bridge.
-- Adds the generic `lizhi.call` command (any CADCraft command / command line / script /
-- inspect / render), larger bounded results, and the owner-private lizhi-cad-files bucket.
-- Existing new/line/rectang/circle/lizhi.inspect/lizhi.entities behaviour is unchanged.

begin;

alter table lizhi_private.lizhi_cad_commands drop constraint if exists lizhi_cad_commands_command_check;
alter table lizhi_private.lizhi_cad_commands add constraint lizhi_cad_commands_command_check
  check (command in ('new','line','rectang','circle','lizhi.inspect','lizhi.entities','lizhi.call'));

-- Last server-side gate for a `lizhi.call` (the Edge contract and the CAD engine check more).
create or replace function lizhi_private.lizhi_cad_call_valid(p jsonb)
returns boolean language plpgsql immutable set search_path to '' as $$
declare k text; op text; cmd text; first_word text; confirmed boolean;
  blocked text[] := array['open','close','closeall','recover','drawingrecovery','xopen','appload','lisp',
    'script','plot','plotwindow','plottermanager','-plottermanager','refclose','bclose','compareclose',
    'arrayclose','quit','exit'];
  destructive text[] := array['new','erase','erase.selection','purge','audit','layer.delete',
    'layerstate.delete','layout.delete','style.delete','dimstyle.delete','table.deleterow',
    'table.deletecol','-purge','overkill'];
begin
  if jsonb_typeof(p) <> 'object' or octet_length(p::text) > 32768 then return false; end if;
  for k in select jsonb_object_keys(p) loop
    if k not in ('op','command','params','text','filter','entities','limit','width','height','fit','window','confirmed')
    then return false; end if;
  end loop;
  if p ? 'confirmed' and p->'confirmed' <> 'true'::jsonb then return false; end if;
  confirmed := coalesce((p->>'confirmed')::boolean, false);
  if p::text ~* '"(path|file|filename|folder|dir|directory|template|url|output|[a-z_]*_path)"\s*:' then return false; end if;
  op := p->>'op';
  if op = 'execute' then
    cmd := lower(regexp_replace(coalesce(p->>'command',''), '^[_.]+', ''));
    if cmd = '' or length(cmd) > 64 or cmd = any(blocked) then return false; end if;
    if cmd = any(destructive) and not confirmed then return false; end if;
    return p->'params' is null or jsonb_typeof(p->'params') in ('object','null');
  elsif op in ('cmdline','script') then
    if jsonb_typeof(p->'text') <> 'string' or length(p->>'text') > 16384 then return false; end if;
    first_word := lower(regexp_replace(split_part(ltrim(p->>'text'), ' ', 1), '^[_.]+', ''));
    first_word := split_part(split_part(first_word, E'\n', 1), '{', 1);
    if first_word = any(blocked) then return false; end if;
    if first_word = any(destructive) and not confirmed then return false; end if;
    return true;
  elsif op in ('commands','inspect','render') then
    return true;
  end if;
  return false;
exception when others then return false;
end $$;

-- Replaces the deployed validator: same rules for the old commands, plus `lizhi.call`.
create or replace function lizhi_private.lizhi_cad_command_valid(cmd text, p jsonb)
returns boolean language plpgsql immutable set search_path to '' as $function$
declare n int; point jsonb; magnitude numeric;
begin
  if cmd = 'lizhi.call' then return lizhi_private.lizhi_cad_call_valid(p); end if;
  if cmd not in ('new','line','rectang','circle') or jsonb_typeof(p)<>'object'
    or octet_length(p::text)>8192 then return false; end if;
  select count(*) into n from jsonb_object_keys(p);
  if cmd='new' then
    return n=0 or (n=1 and p ? 'metric' and jsonb_typeof(p->'metric')='boolean');
  elsif cmd='rectang' then
    return n=2 and p ? 'p1' and p ? 'p2'
      and lizhi_private.lizhi_cad_point_valid(p->'p1')
      and lizhi_private.lizhi_cad_point_valid(p->'p2');
  elsif cmd='line' then
    if not p ? 'points' or n>2 or jsonb_typeof(p->'points')<>'array' then return false; end if;
    if n=2 and (not p ? 'closed' or jsonb_typeof(p->'closed')<>'boolean') then return false; end if;
    if jsonb_array_length(p->'points') not between 2 and 64 then return false; end if;
    for point in select value from jsonb_array_elements(p->'points') loop
      if not lizhi_private.lizhi_cad_point_valid(point) then return false; end if;
    end loop;
    return true;
  elsif cmd='circle' then
    if not p ? 'center' or n<>2 or not lizhi_private.lizhi_cad_point_valid(p->'center')
      or (p ? 'radius')=(p ? 'diameter') then return false; end if;
    point:=coalesce(p->'radius',p->'diameter');
    if jsonb_typeof(point)<>'number' then return false; end if;
    magnitude:=(point #>> '{}')::numeric;
    return magnitude>0 and magnitude<=1000000;
  end if;
  return false;
exception when others then return false;
end; $function$;

-- Same as the deployed finish, but a `lizhi.call` may store up to 256 KB of result JSON.
create or replace function public.lizhi_cad_finish(p_session uuid, p_job uuid, p_ok boolean,
  p_result jsonb default null, p_error text default null)
returns boolean language plpgsql security definer set search_path to '' as $function$
declare actor uuid:=auth.uid(); updated int;
begin
  if nullif(auth.jwt()->>'client_id','') is not null then return false; end if;
  if actor is null or not public.lizhi_web_is_allowed() then return false; end if;
  update lizhi_private.lizhi_cad_commands c
    set state=case when p_ok then 'succeeded' else 'failed' end,
        completed_at=statement_timestamp(),
        result=case when octet_length(coalesce(p_result,'null'::jsonb)::text)
                    <= case when c.command='lizhi.call' then 262144 else 4096 end
               then p_result else null end,
        error=case when p_ok then null else left(coalesce(p_error,'CAD engine error'),300) end
  where c.id=p_job and c.user_id=actor and c.session_id=p_session and c.state='claimed'
    and exists (
      select 1 from lizhi_private.lizhi_cad_sessions
      where id=p_session and user_id=actor and enabled=true
        and last_seen>statement_timestamp()-interval '30 seconds'
    );
  get diagnostics updated=row_count;
  return updated=1;
end; $function$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('lizhi-cad-files', 'lizhi-cad-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists lizhi_cad_files_owner_insert on storage.objects;
create policy lizhi_cad_files_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lizhi-cad-files' and public.lizhi_web_is_allowed()
    and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists lizhi_cad_files_owner_select on storage.objects;
create policy lizhi_cad_files_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'lizhi-cad-files' and public.lizhi_web_is_allowed()
    and (storage.foldername(name))[1] = auth.uid()::text);

commit;
