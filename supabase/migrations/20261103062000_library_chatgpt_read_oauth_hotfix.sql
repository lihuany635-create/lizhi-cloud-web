-- Minimal hotfix: allow the already-consented ChatGPT OAuth client to READ owner's library.
-- Existing web sessions remain unchanged. No write/delete privileges for any OAuth client.
-- Target existing Supabase project: hrdzywkihfqggiwjgavi.
BEGIN;

CREATE OR REPLACE FUNCTION public.lizhi_library_chatgpt_read_allowed()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND lower(coalesce(auth.jwt()->>'email','')) = 'lihuany635@gmail.com'
    AND (auth.jwt()->>'client_id') = '0e595d24-4691-4be6-a9b9-0716302d216a';
$$;
REVOKE ALL ON FUNCTION public.lizhi_library_chatgpt_read_allowed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lizhi_library_chatgpt_read_allowed() TO authenticated;

-- Previous restrictive FOR ALL policy denied OAuth reads AND writes.
-- Keep OAuth write denial as restrictive per-operation policies and add one read-only SELECT.
DROP POLICY IF EXISTS "deny_third_party_oauth_client" ON public.lizhi_library_items;

DROP POLICY IF EXISTS "library_oauth_no_insert" ON public.lizhi_library_items;
CREATE POLICY "library_oauth_no_insert" ON public.lizhi_library_items
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'client_id') IS NULL);

DROP POLICY IF EXISTS "library_oauth_no_update" ON public.lizhi_library_items;
CREATE POLICY "library_oauth_no_update" ON public.lizhi_library_items
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'client_id') IS NULL)
  WITH CHECK ((auth.jwt()->>'client_id') IS NULL);

DROP POLICY IF EXISTS "library_oauth_no_delete" ON public.lizhi_library_items;
CREATE POLICY "library_oauth_no_delete" ON public.lizhi_library_items
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((auth.jwt()->>'client_id') IS NULL);

DROP POLICY IF EXISTS "library_chatgpt_owner_read" ON public.lizhi_library_items;
CREATE POLICY "library_chatgpt_owner_read" ON public.lizhi_library_items
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) AND public.lizhi_library_chatgpt_read_allowed());

-- Preserve exact existing minute-window accounting; authorize only existing web or ChatGPT-read tokens.
CREATE OR REPLACE FUNCTION public.lizhi_library_mcp_take_rate_limit(max_requests integer DEFAULT 60)
RETURNS TABLE(allowed boolean, remaining integer, retry_after_seconds integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  current_window timestamptz := date_trunc('minute', statement_timestamp());
  safe_limit integer := greatest(1,least(coalesce(max_requests,60),120));
  new_count integer;
BEGIN
  IF caller_id IS NULL OR NOT (
    public.lizhi_web_is_allowed() OR public.lizhi_library_chatgpt_read_allowed()
  ) THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;

  DELETE FROM lizhi_private.lizhi_library_mcp_rate_limits
  WHERE user_id=caller_id AND window_start<current_window - interval '1 day';

  INSERT INTO lizhi_private.lizhi_library_mcp_rate_limits AS limits
    (user_id,window_start,request_count,updated_at)
  VALUES (caller_id,current_window,1,statement_timestamp())
  ON CONFLICT (user_id,window_start) DO UPDATE
    SET request_count=limits.request_count+1, updated_at=statement_timestamp()
    WHERE limits.request_count<safe_limit
  RETURNING request_count INTO new_count;

  IF new_count IS NULL THEN
    RETURN QUERY SELECT false,0,
      greatest(1,60-extract(second from statement_timestamp())::integer);
  ELSE
    RETURN QUERY SELECT true,greatest(0,safe_limit-new_count),0;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.lizhi_library_mcp_take_rate_limit(integer)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lizhi_library_mcp_take_rate_limit(integer) TO authenticated;

COMMIT;

-- Rollback requires approval: restore previous restricted FOR ALL policy, original rate limiter,
-- drop per-operation restrictive policies, read-only SELECT policy and read helper.
-- No rows are inserted/changed and no storage settings or unrelated RLS policies are changed.
