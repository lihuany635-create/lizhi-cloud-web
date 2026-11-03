-- Candidate migration for owner-controlled Library MCP (NOT APPLIED).
-- Preserve the normal web whitelist; authorize only explicitly registered OAuth client IDs.
-- Empty allowlist means OAuth MCP stays disabled. Do NOT auto-enroll dynamic OAuth clients.
BEGIN;
CREATE TABLE IF NOT EXISTS public.lizhi_library_mcp_clients (
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text NOT NULL CHECK (char_length(client_id) BETWEEN 8 AND 512),
  can_write boolean NOT NULL DEFAULT false,
  approved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, client_id)
);
ALTER TABLE public.lizhi_library_mcp_clients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lizhi_library_mcp_clients FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lizhi_library_mcp_clients TO authenticated;
DROP POLICY IF EXISTS "lizhi_library_mcp_clients_owner_read" ON public.lizhi_library_mcp_clients;
CREATE POLICY "lizhi_library_mcp_clients_owner_read"
ON public.lizhi_library_mcp_clients FOR SELECT TO authenticated
USING (owner_id = (SELECT auth.uid()) AND lower(coalesce(auth.jwt()->>'email','')) = 'lihuany635@gmail.com');

-- SECURITY INVOKER: allowlist lookups remain RLS-scoped; web tokens are not accepted as MCP tokens.
CREATE OR REPLACE FUNCTION public.lizhi_library_mcp_client_allowed(p_write boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND lower(coalesce(auth.jwt()->>'email','')) = 'lihuany635@gmail.com'
    AND coalesce(auth.jwt()->>'client_id','') <> ''
    AND EXISTS (
      SELECT 1 FROM public.lizhi_library_mcp_clients c
      WHERE c.owner_id = (SELECT auth.uid())
        AND c.client_id = auth.jwt()->>'client_id'
        AND (NOT coalesce(p_write,false) OR c.can_write)
    );
$$;
REVOKE ALL ON FUNCTION public.lizhi_library_mcp_client_allowed(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lizhi_library_mcp_client_allowed(boolean) TO authenticated;

-- Keep exactly the existing owner and web whitelist conditions.
-- The new OAuth branch requires a matching, manually approved client row.
DROP POLICY IF EXISTS "deny_third_party_oauth_client" ON public.lizhi_library_items;
DROP POLICY IF EXISTS "library_items_own" ON public.lizhi_library_items;
DROP POLICY IF EXISTS "library_items_owner_read" ON public.lizhi_library_items;
DROP POLICY IF EXISTS "library_items_owner_insert" ON public.lizhi_library_items;
DROP POLICY IF EXISTS "library_items_owner_update" ON public.lizhi_library_items;
DROP POLICY IF EXISTS "library_items_owner_delete" ON public.lizhi_library_items;
CREATE POLICY "library_items_owner_read" ON public.lizhi_library_items FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(false)));
CREATE POLICY "library_items_owner_insert" ON public.lizhi_library_items FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));
CREATE POLICY "library_items_owner_update" ON public.lizhi_library_items FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)))
WITH CHECK (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));
CREATE POLICY "library_items_owner_delete" ON public.lizhi_library_items FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));

DROP POLICY IF EXISTS "library_official_docs_own" ON public.lizhi_library_official_docs;
DROP POLICY IF EXISTS "library_official_docs_owner_read" ON public.lizhi_library_official_docs;
DROP POLICY IF EXISTS "library_official_docs_owner_insert" ON public.lizhi_library_official_docs;
DROP POLICY IF EXISTS "library_official_docs_owner_update" ON public.lizhi_library_official_docs;
DROP POLICY IF EXISTS "library_official_docs_owner_delete" ON public.lizhi_library_official_docs;
CREATE POLICY "library_official_docs_owner_read" ON public.lizhi_library_official_docs FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(false)));
CREATE POLICY "library_official_docs_owner_insert" ON public.lizhi_library_official_docs FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));
CREATE POLICY "library_official_docs_owner_update" ON public.lizhi_library_official_docs FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)))
WITH CHECK (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));
CREATE POLICY "library_official_docs_owner_delete" ON public.lizhi_library_official_docs FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()) AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));

-- Preserve the existing private bucket and user UUID prefix. Never expose other buckets.
DROP POLICY IF EXISTS "lizhi_library_objects_own" ON storage.objects;
DROP POLICY IF EXISTS "lizhi_library_objects_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "lizhi_library_objects_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "lizhi_library_objects_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "lizhi_library_objects_owner_delete" ON storage.objects;
CREATE POLICY "lizhi_library_objects_owner_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='lizhi-library' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(false)));
CREATE POLICY "lizhi_library_objects_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='lizhi-library' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));
CREATE POLICY "lizhi_library_objects_owner_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='lizhi-library' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)))
WITH CHECK (bucket_id='lizhi-library' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));
CREATE POLICY "lizhi_library_objects_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='lizhi-library' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND (public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(true)));

-- Fix the rate-limit false "temporarily unavailable" when an approved MCP OAuth client is used.
-- Counter logic is unchanged; only its authentication gate is corrected.
CREATE OR REPLACE FUNCTION public.lizhi_library_mcp_take_rate_limit(max_requests integer DEFAULT 60)
RETURNS TABLE (allowed boolean, remaining integer, retry_after_seconds integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  current_window timestamptz := date_trunc('minute', statement_timestamp());
  safe_limit integer := greatest(1, least(coalesce(max_requests,60),120));
  new_count integer;
BEGIN
  IF caller_id IS NULL OR NOT (
    public.lizhi_web_is_allowed() OR public.lizhi_library_mcp_client_allowed(false)
  ) THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  DELETE FROM lizhi_private.lizhi_library_mcp_rate_limits
  WHERE user_id=caller_id AND window_start < current_window - INTERVAL '1 day';
  INSERT INTO lizhi_private.lizhi_library_mcp_rate_limits AS limits
    (user_id,window_start,request_count,updated_at)
  VALUES (caller_id,current_window,1,statement_timestamp())
  ON CONFLICT(user_id,window_start) DO UPDATE
    SET request_count=limits.request_count+1, updated_at=statement_timestamp()
    WHERE limits.request_count < safe_limit
  RETURNING request_count INTO new_count;
  IF new_count IS NULL THEN
    RETURN QUERY SELECT false,0,greatest(1,60-extract(second from statement_timestamp())::integer);
  ELSE
    RETURN QUERY SELECT true,greatest(0,safe_limit-new_count),0;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.lizhi_library_mcp_take_rate_limit(integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.lizhi_library_mcp_take_rate_limit(integer) TO authenticated;
COMMIT;

-- Mandatory deployment checklist:
-- 1. Inspect actual consented auth OAuth client_id and owner uid without exposing tokens.
-- 2. Obtain user's explicit approval to enable that exact client read-only (can_write=false),
--    then separately approve write capability (can_write=true) if desired.
-- 3. Approve and apply this migration ONLY after tests and rollback review.
-- 4. No client rows are seeded by this migration.
