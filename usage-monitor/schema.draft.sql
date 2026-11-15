-- LIZHI Supabase usage monitor / candidate-only SQL.
-- NOT APPLIED. Must become a validated Supabase CLI migration before deployment.
-- Usage is intentionally separate from AI workbench, finance, library and other data.
-- Do not expose these tables to anon/authenticated Data API consumers.
create schema if not exists private_lz;

create table if not exists public.lz_usage_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  source text not null check (source ~ '^[A-Za-z0-9_.-]{1,80}
  route text not null check (route ~ '^[A-Za-z0-9_./:-]{1,120}
  status_code integer not null check (status_code between 100 and 599),
  request_bytes bigint check (request_bytes is null or request_bytes between 0 and 1099511627776),
  response_bytes bigint check (response_bytes is null or response_bytes between 0 and 1099511627776),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 3600000),
  decision text not null default 'allow' check (decision in ('allow','throttle','block')),
  request_id uuid not null default gen_random_uuid(),
  constraint lz_usage_events_unique_request unique (source, request_id)
);

create index if not exists lz_usage_events_latest_idx on public.lz_usage_events (occurred_at desc);
create index if not exists lz_usage_events_source_idx on public.lz_usage_events (source, occurred_at desc);

create table if not exists public.lz_usage_daily (
  day date not null,
  source text not null,
  request_count bigint not null default 0,
  request_bytes_known bigint not null default 0,
  response_bytes_known bigint not null default 0,
  unknown_request_count bigint not null default 0,
  unknown_response_count bigint not null default 0,
  blocked_count bigint not null default 0,
  throttled_count bigint not null default 0,
  error_count bigint not null default 0,
  primary key(day, source)
);

-- Source + request_id uniqueness protects rollups from duplicate event replays.
-- A single insert writes the event and updates the compact daily rollup atomically.
create or replace function private_lz.usage_rollup() returns trigger
language plpgsql security invoker
set search_path = pg_catalog, public, private_lz
as $$
begin
  insert into public.lz_usage_daily (
    day, source, request_count, request_bytes_known, response_bytes_known,
    unknown_request_count, unknown_response_count, blocked_count, throttled_count, error_count
  ) values (
    (new.occurred_at at time zone 'UTC')::date,
    new.source, 1, coalesce(new.request_bytes,0), coalesce(new.response_bytes,0),
    case when new.request_bytes is null then 1 else 0 end,
    case when new.response_bytes is null then 1 else 0 end,
    case when new.decision = 'block' then 1 else 0 end,
    case when new.decision = 'throttle' then 1 else 0 end,
    case when new.status_code >= 400 then 1 else 0 end
  )
  on conflict (day,source) do update set
    request_count = public.lz_usage_daily.request_count + excluded.request_count,
    request_bytes_known = public.lz_usage_daily.request_bytes_known + excluded.request_bytes_known,
    response_bytes_known = public.lz_usage_daily.response_bytes_known + excluded.response_bytes_known,
    unknown_request_count = public.lz_usage_daily.unknown_request_count + excluded.unknown_request_count,
    unknown_response_count = public.lz_usage_daily.unknown_response_count + excluded.unknown_response_count,
    blocked_count = public.lz_usage_daily.blocked_count + excluded.blocked_count,
    throttled_count = public.lz_usage_daily.throttled_count + excluded.throttled_count,
    error_count = public.lz_usage_daily.error_count + excluded.error_count;
  return new;
end;
$$;

drop trigger if exists lz_usage_rollup_trigger on public.lz_usage_events;
create trigger lz_usage_rollup_trigger
after insert on public.lz_usage_events
for each row execute function private_lz.usage_rollup();

alter table public.lz_usage_events enable row level security;
alter table public.lz_usage_daily enable row level security;
revoke all on public.lz_usage_events from public, anon, authenticated;
revoke all on public.lz_usage_daily from public, anon, authenticated;
grant select, insert, delete on public.lz_usage_events to service_role;
grant select on public.lz_usage_daily to service_role;
grant insert, update on public.lz_usage_daily to service_role;
revoke all on function private_lz.usage_rollup() from public, anon, authenticated;
grant usage on schema private_lz to service_role;
grant execute on function private_lz.usage_rollup() to service_role;

-- No public policies; the monitor server verifies the owner and uses the server-side
-- service role. Never put the service role key in GitHub Pages / JavaScript.
-- Maintenance plan (not auto-scheduled here): after daily rollup reconciliation,
-- delete public.lz_usage_events rows older than 72 hours.
),
  route text not null check (char_length(route) between 1 and 120),
  status_code integer not null check (status_code between 100 and 599),
  request_bytes bigint check (request_bytes is null or request_bytes between 0 and 1099511627776),
  response_bytes bigint check (response_bytes is null or response_bytes between 0 and 1099511627776),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 3600000),
  decision text not null default 'allow' check (decision in ('allow','throttle','block')),
  request_id uuid not null default gen_random_uuid()
);

create index if not exists lz_usage_events_latest_idx on public.lz_usage_events (occurred_at desc);
create index if not exists lz_usage_events_source_idx on public.lz_usage_events (source, occurred_at desc);

create table if not exists public.lz_usage_daily (
  day date not null,
  source text not null,
  request_count bigint not null default 0,
  request_bytes_known bigint not null default 0,
  response_bytes_known bigint not null default 0,
  unknown_request_count bigint not null default 0,
  unknown_response_count bigint not null default 0,
  blocked_count bigint not null default 0,
  error_count bigint not null default 0,
  primary key(day, source)
);

-- A single insert writes the event and updates the compact daily rollup atomically.
create or replace function private_lz.usage_rollup() returns trigger
language plpgsql security invoker
set search_path = pg_catalog, public, private_lz
as $$
begin
  insert into public.lz_usage_daily (
    day, source, request_count, request_bytes_known, response_bytes_known,
    unknown_request_count, unknown_response_count, blocked_count, error_count
  ) values (
    (new.occurred_at at time zone 'UTC')::date,
    new.source, 1, coalesce(new.request_bytes,0), coalesce(new.response_bytes,0),
    case when new.request_bytes is null then 1 else 0 end,
    case when new.response_bytes is null then 1 else 0 end,
    case when new.decision <> 'allow' then 1 else 0 end,
    case when new.status_code >= 400 then 1 else 0 end
  )
  on conflict (day,source) do update set
    request_count = public.lz_usage_daily.request_count + excluded.request_count,
    request_bytes_known = public.lz_usage_daily.request_bytes_known + excluded.request_bytes_known,
    response_bytes_known = public.lz_usage_daily.response_bytes_known + excluded.response_bytes_known,
    unknown_request_count = public.lz_usage_daily.unknown_request_count + excluded.unknown_request_count,
    unknown_response_count = public.lz_usage_daily.unknown_response_count + excluded.unknown_response_count,
    blocked_count = public.lz_usage_daily.blocked_count + excluded.blocked_count,
    error_count = public.lz_usage_daily.error_count + excluded.error_count;
  return new;
end;
$$;

drop trigger if exists lz_usage_rollup_trigger on public.lz_usage_events;
create trigger lz_usage_rollup_trigger
after insert on public.lz_usage_events
for each row execute function private_lz.usage_rollup();

alter table public.lz_usage_events enable row level security;
alter table public.lz_usage_daily enable row level security;
revoke all on public.lz_usage_events from public, anon, authenticated;
revoke all on public.lz_usage_daily from public, anon, authenticated;
grant select, insert, delete on public.lz_usage_events to service_role;
grant select on public.lz_usage_daily to service_role;
grant insert, update on public.lz_usage_daily to service_role;

-- No public policies; the monitor server verifies the owner and uses the server-side
-- service role. Never put the service role key in GitHub Pages / JavaScript.
-- Maintenance plan (not auto-scheduled here): after daily rollup reconciliation,
-- delete public.lz_usage_events rows older than 72 hours.
),
  status_code integer not null check (status_code between 100 and 599),
  request_bytes bigint check (request_bytes is null or request_bytes between 0 and 1099511627776),
  response_bytes bigint check (response_bytes is null or response_bytes between 0 and 1099511627776),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 3600000),
  decision text not null default 'allow' check (decision in ('allow','throttle','block')),
  request_id uuid not null default gen_random_uuid()
);

create index if not exists lz_usage_events_latest_idx on public.lz_usage_events (occurred_at desc);
create index if not exists lz_usage_events_source_idx on public.lz_usage_events (source, occurred_at desc);

create table if not exists public.lz_usage_daily (
  day date not null,
  source text not null,
  request_count bigint not null default 0,
  request_bytes_known bigint not null default 0,
  response_bytes_known bigint not null default 0,
  unknown_request_count bigint not null default 0,
  unknown_response_count bigint not null default 0,
  blocked_count bigint not null default 0,
  error_count bigint not null default 0,
  primary key(day, source)
);

-- A single insert writes the event and updates the compact daily rollup atomically.
create or replace function private_lz.usage_rollup() returns trigger
language plpgsql security invoker
set search_path = pg_catalog, public, private_lz
as $$
begin
  insert into public.lz_usage_daily (
    day, source, request_count, request_bytes_known, response_bytes_known,
    unknown_request_count, unknown_response_count, blocked_count, error_count
  ) values (
    (new.occurred_at at time zone 'UTC')::date,
    new.source, 1, coalesce(new.request_bytes,0), coalesce(new.response_bytes,0),
    case when new.request_bytes is null then 1 else 0 end,
    case when new.response_bytes is null then 1 else 0 end,
    case when new.decision <> 'allow' then 1 else 0 end,
    case when new.status_code >= 400 then 1 else 0 end
  )
  on conflict (day,source) do update set
    request_count = public.lz_usage_daily.request_count + excluded.request_count,
    request_bytes_known = public.lz_usage_daily.request_bytes_known + excluded.request_bytes_known,
    response_bytes_known = public.lz_usage_daily.response_bytes_known + excluded.response_bytes_known,
    unknown_request_count = public.lz_usage_daily.unknown_request_count + excluded.unknown_request_count,
    unknown_response_count = public.lz_usage_daily.unknown_response_count + excluded.unknown_response_count,
    blocked_count = public.lz_usage_daily.blocked_count + excluded.blocked_count,
    error_count = public.lz_usage_daily.error_count + excluded.error_count;
  return new;
end;
$$;

drop trigger if exists lz_usage_rollup_trigger on public.lz_usage_events;
create trigger lz_usage_rollup_trigger
after insert on public.lz_usage_events
for each row execute function private_lz.usage_rollup();

alter table public.lz_usage_events enable row level security;
alter table public.lz_usage_daily enable row level security;
revoke all on public.lz_usage_events from public, anon, authenticated;
revoke all on public.lz_usage_daily from public, anon, authenticated;
grant select, insert, delete on public.lz_usage_events to service_role;
grant select on public.lz_usage_daily to service_role;
grant insert, update on public.lz_usage_daily to service_role;

-- No public policies; the monitor server verifies the owner and uses the server-side
-- service role. Never put the service role key in GitHub Pages / JavaScript.
-- Maintenance plan (not auto-scheduled here): after daily rollup reconciliation,
-- delete public.lz_usage_events rows older than 72 hours.
),
  route text not null check (char_length(route) between 1 and 120),
  status_code integer not null check (status_code between 100 and 599),
  request_bytes bigint check (request_bytes is null or request_bytes between 0 and 1099511627776),
  response_bytes bigint check (response_bytes is null or response_bytes between 0 and 1099511627776),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 3600000),
  decision text not null default 'allow' check (decision in ('allow','throttle','block')),
  request_id uuid not null default gen_random_uuid()
);

create index if not exists lz_usage_events_latest_idx on public.lz_usage_events (occurred_at desc);
create index if not exists lz_usage_events_source_idx on public.lz_usage_events (source, occurred_at desc);

create table if not exists public.lz_usage_daily (
  day date not null,
  source text not null,
  request_count bigint not null default 0,
  request_bytes_known bigint not null default 0,
  response_bytes_known bigint not null default 0,
  unknown_request_count bigint not null default 0,
  unknown_response_count bigint not null default 0,
  blocked_count bigint not null default 0,
  error_count bigint not null default 0,
  primary key(day, source)
);

-- A single insert writes the event and updates the compact daily rollup atomically.
create or replace function private_lz.usage_rollup() returns trigger
language plpgsql security invoker
set search_path = pg_catalog, public, private_lz
as $$
begin
  insert into public.lz_usage_daily (
    day, source, request_count, request_bytes_known, response_bytes_known,
    unknown_request_count, unknown_response_count, blocked_count, error_count
  ) values (
    (new.occurred_at at time zone 'UTC')::date,
    new.source, 1, coalesce(new.request_bytes,0), coalesce(new.response_bytes,0),
    case when new.request_bytes is null then 1 else 0 end,
    case when new.response_bytes is null then 1 else 0 end,
    case when new.decision <> 'allow' then 1 else 0 end,
    case when new.status_code >= 400 then 1 else 0 end
  )
  on conflict (day,source) do update set
    request_count = public.lz_usage_daily.request_count + excluded.request_count,
    request_bytes_known = public.lz_usage_daily.request_bytes_known + excluded.request_bytes_known,
    response_bytes_known = public.lz_usage_daily.response_bytes_known + excluded.response_bytes_known,
    unknown_request_count = public.lz_usage_daily.unknown_request_count + excluded.unknown_request_count,
    unknown_response_count = public.lz_usage_daily.unknown_response_count + excluded.unknown_response_count,
    blocked_count = public.lz_usage_daily.blocked_count + excluded.blocked_count,
    error_count = public.lz_usage_daily.error_count + excluded.error_count;
  return new;
end;
$$;

drop trigger if exists lz_usage_rollup_trigger on public.lz_usage_events;
create trigger lz_usage_rollup_trigger
after insert on public.lz_usage_events
for each row execute function private_lz.usage_rollup();

alter table public.lz_usage_events enable row level security;
alter table public.lz_usage_daily enable row level security;
revoke all on public.lz_usage_events from public, anon, authenticated;
revoke all on public.lz_usage_daily from public, anon, authenticated;
grant select, insert, delete on public.lz_usage_events to service_role;
grant select on public.lz_usage_daily to service_role;
grant insert, update on public.lz_usage_daily to service_role;

-- No public policies; the monitor server verifies the owner and uses the server-side
-- service role. Never put the service role key in GitHub Pages / JavaScript.
-- Maintenance plan (not auto-scheduled here): after daily rollup reconciliation,
-- delete public.lz_usage_events rows older than 72 hours.
