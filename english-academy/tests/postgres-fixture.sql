-- Local/Postgres CI ONLY: fake Supabase roles and auth.uid().
-- Never deploy this fixture to a real Supabase database.
do $$
begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid
language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth, public to authenticated, anon, service_role;
grant execute on function auth.uid() to authenticated, anon, service_role;
