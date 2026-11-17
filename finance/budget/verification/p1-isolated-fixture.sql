-- Isolated CI fixture ONLY. Never apply to a user's production Supabase project.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key);
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create function public.lizhi_web_is_allowed() returns boolean language sql stable as $$
 select current_setting('test.allowed',true)='true'
$$;
grant execute on function public.lizhi_web_is_allowed() to authenticated;
create table public.lizhi_finance_records(
 user_id uuid not null references auth.users(id),
 kind text not null check(kind in('accounts','creditCards','categories','transactions')),
 id text not null,
 payload jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 deleted_at timestamptz,
 primary key(user_id,kind,id)
);
alter table public.lizhi_finance_records enable row level security;
grant select on public.lizhi_finance_records to authenticated;
create policy finance_select_own on public.lizhi_finance_records for select to authenticated
 using (user_id=(select auth.uid()) and public.lizhi_web_is_allowed());
insert into public.lizhi_finance_records(user_id,kind,id,payload) values
 ('11111111-1111-4111-8111-111111111111','categories','food','{"id":"food","type":"expense","archived":false}'),
 ('11111111-1111-4111-8111-111111111111','categories','salary','{"id":"salary","type":"income","archived":false}'),
 ('22222222-2222-4222-8222-222222222222','categories','food','{"id":"food","type":"expense","archived":false}'),
 ('11111111-1111-4111-8111-111111111111','accounts','cash','{"id":"cash","currency":"TWD"}'),
 ('11111111-1111-4111-8111-111111111111','accounts','usd','{"id":"usd","currency":"USD"}'),
 ('11111111-1111-4111-8111-111111111111','creditCards','cc','{"id":"cc","currency":"TWD"}'),
 ('22222222-2222-4222-8222-222222222222','accounts','cash','{"id":"cash","currency":"TWD"}'),
 ('11111111-1111-4111-8111-111111111111','transactions','meal','{"type":"expense","date":"2026-11-12","amount":1500,"accountId":"cash","categoryId":"food"}'),
 ('11111111-1111-4111-8111-111111111111','transactions','card','{"type":"credit_card_purchase","date":"2026-11-13","amount":850,"creditCardId":"cc","categoryId":"food"}'),
 ('11111111-1111-4111-8111-111111111111','transactions','pay','{"type":"credit_card_payment","date":"2026-11-13","amount":850,"creditCardId":"cc"}'),
 ('11111111-1111-4111-8111-111111111111','transactions','transfer','{"type":"transfer","date":"2026-11-13","amount":30000}'),
 ('11111111-1111-4111-8111-111111111111','transactions','fx','{"type":"expense","date":"2026-11-12","amount":300,"accountId":"usd","categoryId":"food"}'),
 ('11111111-1111-4111-8111-111111111111','transactions','old','{"type":"expense","date":"2026-10-12","amount":200,"accountId":"cash","categoryId":"food"}'),
 ('11111111-1111-4111-8111-111111111111','transactions','deleted','{"type":"expense","date":"2026-11-12","amount":600,"accountId":"cash","categoryId":"food","deletedAt":"2026-11-15T00:00:00Z"}'),
 ('22222222-2222-4222-8222-222222222222','transactions','other-user','{"type":"expense","date":"2026-11-12","amount":999,"accountId":"cash","categoryId":"food"}');
\echo ISOLATED_FIXTURE_READY
