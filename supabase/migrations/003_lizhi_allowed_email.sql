-- Update the single-user allowlist to the confirmed Google account.
create or replace function public.lizhi_web_is_allowed()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'lihuany635@gmail.com';
$$;
