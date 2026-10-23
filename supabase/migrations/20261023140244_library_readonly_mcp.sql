-- Read-only library MCP support.
--
-- Library rows remain protected by the existing lizhi_library_items RLS policy.
-- The only SECURITY DEFINER routine is the narrow, authenticated rate limiter;
-- it cannot read library data and its backing table is outside exposed schemas.

create schema if not exists lizhi_private;
revoke all on schema lizhi_private from public, anon, authenticated;

create table if not exists lizhi_private.lizhi_library_mcp_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, window_start)
);

alter table lizhi_private.lizhi_library_mcp_rate_limits enable row level security;

revoke all on table lizhi_private.lizhi_library_mcp_rate_limits from public, anon, authenticated;

create or replace function public.lizhi_library_mcp_take_rate_limit(
  max_requests integer default 60
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  current_window timestamptz := date_trunc('minute', statement_timestamp());
  safe_limit integer := greatest(1, least(coalesce(max_requests, 60), 120));
  new_count integer;
begin
  if caller_id is null or not public.lizhi_web_is_allowed() then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  delete from lizhi_private.lizhi_library_mcp_rate_limits
  where user_id = caller_id
    and window_start < current_window - interval '1 day';

  insert into lizhi_private.lizhi_library_mcp_rate_limits as limits
    (user_id, window_start, request_count, updated_at)
  values
    (caller_id, current_window, 1, statement_timestamp())
  on conflict (user_id, window_start) do update
    set request_count = limits.request_count + 1,
        updated_at = statement_timestamp()
    where limits.request_count < safe_limit
  returning request_count into new_count;

  if new_count is null then
    return query select false, 0,
      greatest(1, 60 - extract(second from statement_timestamp())::integer);
  else
    return query select true, greatest(0, safe_limit - new_count), 0;
  end if;
end;
$$;

revoke all on function public.lizhi_library_mcp_take_rate_limit(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.lizhi_library_mcp_take_rate_limit(integer)
  to authenticated;

create or replace function public.lizhi_library_mcp_search(
  q text,
  p_sources text[] default null,
  p_types text[] default null,
  p_limit integer default 10
)
returns table (
  item_id uuid,
  title text,
  source text,
  availability text,
  mime text,
  shelf text,
  summary text,
  snippet text,
  score integer,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select lower(btrim(q)) as term,
           '%' || replace(replace(replace(lower(btrim(q)), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern,
           greatest(1, least(coalesce(p_limit, 10), 20)) as result_limit
  ), ranked as (
    select i.*,
      case
        when lower(coalesce(i.title, i.file_name)) = input.term then 100
        when lower(coalesce(i.title, i.file_name)) like input.term || '%' then 90
        when lower(coalesce(i.title, '')) like input.pattern escape '\'
          or lower(i.file_name) like input.pattern escape '\' then 80
        when lower(coalesce(i.shelf, '')) like input.pattern escape '\'
          or lower(array_to_string(i.tags, ' ')) like input.pattern escape '\'
          or lower(coalesce(i.summary, '')) like input.pattern escape '\' then 60
        else 40
      end as rank_score,
      strpos(lower(coalesce(i.text_excerpt, '')), input.term) as excerpt_pos,
      input.result_limit
    from public.lizhi_library_items i cross join input
    where char_length(input.term) between 1 and 100
      and i.deleted_at is null
      and (p_sources is null or cardinality(p_sources) = 0 or i.location = any(p_sources))
      and (
        p_types is null or cardinality(p_types) = 0
        or ('document' = any(p_types) and (
          i.mime like 'text/%' or i.mime in (
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          )
        ))
        or ('image' = any(p_types) and i.mime like 'image/%')
        or ('audio' = any(p_types) and i.mime like 'audio/%')
        or ('video' = any(p_types) and i.mime like 'video/%')
        or ('other' = any(p_types) and i.mime !~ '^(text/|image/|audio/|video/)' and i.mime not like 'application/pdf%')
      )
      and (
        lower(coalesce(i.title, '')) like input.pattern escape '\'
        or lower(i.file_name) like input.pattern escape '\'
        or lower(coalesce(i.shelf, '')) like input.pattern escape '\'
        or lower(array_to_string(i.tags, ' ')) like input.pattern escape '\'
        or lower(coalesce(i.summary, '')) like input.pattern escape '\'
        or lower(coalesce(i.text_excerpt, '')) like input.pattern escape '\'
      )
  )
  select r.id as item_id,
         coalesce(r.title, r.file_name) as title,
         r.location as source,
         case
           when r.location = 'cloud' then 'cloud_original_available'
           when r.text_excerpt is not null and r.text_excerpt <> '' then 'excerpt_only'
           else 'metadata_only'
         end as availability,
         r.mime,
         r.shelf,
         r.summary,
         case
           when r.excerpt_pos > 0 then substring(r.text_excerpt from greatest(1, r.excerpt_pos - 100) for 360)
           else left(coalesce(r.summary, array_to_string(r.key_points, '；'), ''), 360)
         end as snippet,
         r.rank_score as score,
         r.updated_at
  from ranked r
  order by r.rank_score desc, r.updated_at desc, r.id
  limit (select result_limit from input);
$$;

revoke all on function public.lizhi_library_mcp_search(text, text[], text[], integer)
  from public, anon;
grant execute on function public.lizhi_library_mcp_search(text, text[], text[], integer)
  to authenticated;

comment on function public.lizhi_library_mcp_search(text, text[], text[], integer) is
  'RLS-scoped metadata and excerpt search for the read-only library MCP. Never returns storage or local filesystem paths.';

create or replace function public.lizhi_library_mcp_status()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with visible as (
    select location, status, extract_status, text_excerpt, updated_at
    from public.lizhi_library_items
    where deleted_at is null
  ), by_source as (
    select coalesce(jsonb_object_agg(location, n), '{}'::jsonb) as value
    from (select location, count(*) as n from visible group by location) grouped
  ), by_status as (
    select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) as value
    from (select status, count(*) as n from visible group by status) grouped
  ), by_extraction as (
    select coalesce(jsonb_object_agg(extract_status, n), '{}'::jsonb) as value
    from (select extract_status, count(*) as n from visible group by extract_status) grouped
  )
  select jsonb_build_object(
    'total', (select count(*) from visible),
    'sources', (select value from by_source),
    'statuses', (select value from by_status),
    'extraction', (select value from by_extraction),
    'with_excerpt', (select count(*) from visible where text_excerpt is not null and text_excerpt <> ''),
    'last_updated', (select max(updated_at) from visible)
  );
$$;

revoke all on function public.lizhi_library_mcp_status() from public, anon;
grant execute on function public.lizhi_library_mcp_status() to authenticated;
