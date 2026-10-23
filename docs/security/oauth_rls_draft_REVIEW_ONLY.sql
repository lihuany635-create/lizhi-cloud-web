-- REVIEW ONLY. DO NOT APPLY AUTOMATICALLY OR WITH supabase db push.
-- This hardens EXISTING application tables against access tokens from
-- third-party Supabase OAuth 2.1 clients (JWT with client_id claim).
-- Requires an explicit owner-approved production change window and backup.
-- It is NOT yet approved or deployed.
--
-- DANGER: OAuth client grants to these 12 tables will be denied. Existing
-- app/browser login sessions without a client_id claim are intended to remain
-- unaffected. Confirm against real Auth session claims before applying.
BEGIN;

-- Existing helper function also protects two authenticated-callable SECURITY
-- DEFINER RPCs: lizhi_web_send_message and lizhi_library_mcp_take_rate_limit.
-- No change to user email allowlist or function signature.
CREATE OR REPLACE FUNCTION public.lizhi_web_is_allowed()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT (auth.jwt() ->> 'client_id') IS NULL
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'lihuany635@gmail.com';
$function$;

DO $guard$
DECLARE
  tablename text;
  table_names text[] := ARRAY[
    'lizhi_ai_runs',
    'lizhi_finance_ai_hosts',
    'lizhi_finance_ai_jobs',
    'lizhi_finance_records',
    'lizhi_finance_rule_memories',
    'lizhi_library_items',
    'lizhi_licut_commands',
    'lizhi_licut_projects',
    'lizhi_licut_thumbs',
    'lizhi_production_state',
    'lizhi_web_chat_messages',
    'lizhi_web_records'
  ];
BEGIN
  FOREACH tablename IN ARRAY table_names LOOP
    IF NOT EXISTS (
      SELECT 1
        FROM pg_policies
       WHERE schemaname='public' AND pg_policies.tablename=tablename
         AND policyname='deny_third_party_oauth_client'
    ) THEN
      EXECUTE format(
        'CREATE POLICY deny_third_party_oauth_client ON public.%I AS RESTRICTIVE
         FOR ALL TO authenticated
         USING ((auth.jwt() ->> ''client_id'') IS NULL)
         WITH CHECK ((auth.jwt() ->> ''client_id'') IS NULL)',
        tablename
      );
    END IF;
  END LOOP;
END
$guard$;

COMMIT;

-- POST-DEPLOY MANUAL CHECKS (read only):
-- SELECT tablename, policyname, permissive, cmd FROM pg_policies
-- WHERE schemaname='public' AND policyname='deny_third_party_oauth_client';
-- The list above should show exactly 12 restrictive policies.
-- Confirm normal Lizhi Cloud site login, finance READ/WRITE, knowledge save,
-- library read/write, chat send, video editing, Supabase Edge Functions,
-- mobile-agent token handshake, and OAuth-client ACCESS DENIED.
