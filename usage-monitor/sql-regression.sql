-- Run only against an isolated disposable PostgreSQL 17 database.
-- Requires usage-monitor/schema.draft.sql already applied.
\set ON_ERROR_STOP on
BEGIN;

-- The endpoint must not be exposed to anonymous and normal signed-in users.
DO $$
BEGIN
 IF has_table_privilege('anon','public.lz_usage_events','SELECT') THEN RAISE EXCEPTION 'anon SELECT leaked'; END IF;
 IF has_table_privilege('anon','public.lz_usage_events','INSERT') THEN RAISE EXCEPTION 'anon INSERT leaked'; END IF;
 IF has_table_privilege('authenticated','public.lz_usage_events','SELECT') THEN RAISE EXCEPTION 'authenticated SELECT leaked'; END IF;
 IF has_table_privilege('authenticated','public.lz_usage_daily','SELECT') THEN RAISE EXCEPTION 'authenticated daily SELECT leaked'; END IF;
 IF has_function_privilege('anon','private_lz.usage_rollup()','EXECUTE') THEN RAISE EXCEPTION 'trigger function exposed'; END IF;
END $$;

SET LOCAL ROLE service_role;

-- Two records with one exact duplicate: only two inserts may count.
INSERT INTO public.lz_usage_events
  (occurred_at, source, route, status_code, request_bytes, response_bytes, decision, request_id)
VALUES
  ('2026-11-15T11:00:00Z','usage-qa', '/mcp', 200, null, 500, 'allow', '14f8c3bc-e692-4c3b-9629-280afcedc68b'),
  ('2026-11-15T11:01:00Z','usage-qa', '/mcp', 429, 25, null, 'block', '14f8c3bc-e692-4c3b-9629-280afcedc68c'),
  ('2026-11-15T11:02:00Z','usage-qa', '/mcp', 200, null, 12, 'throttle', '14f8c3bc-e692-4c3b-9629-280afcedc68d');

DO $$
DECLARE r record;
BEGIN
 SELECT * INTO r FROM public.lz_usage_daily
 WHERE day='2026-11-15' AND source='usage-qa';
 IF NOT FOUND THEN RAISE EXCEPTION 'daily row missing'; END IF;
 IF r.request_count<>3 OR r.blocked_count<>1 OR r.throttled_count<>1 OR r.error_count<>1
 OR r.unknown_request_count<>2 OR r.unknown_response_count<>1
 OR r.request_bytes_known<>25 OR r.response_bytes_known<>512
 THEN RAISE EXCEPTION 'daily rollup mismatch %', row_to_json(r); END IF;
END $$;

DO $$
BEGIN
 BEGIN
 INSERT INTO public.lz_usage_events
   (occurred_at,source,route,status_code,decision,request_id)
 VALUES('2026-11-15T11:04:00Z','usage-qa','/mcp',200,'allow','14f8c3bc-e692-4c3b-9629-280afcedc68b');
 RAISE EXCEPTION 'duplicate unexpectedly accepted';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
 IF (SELECT request_count FROM public.lz_usage_daily WHERE day='2026-11-15' AND source='usage-qa')<>3
 THEN RAISE EXCEPTION 'duplicate changed daily totals'; END IF;
END $$;

-- Reject attempts to log query strings containing secrets.
DO $$
BEGIN
 BEGIN
 INSERT INTO public.lz_usage_events(source,route,status_code,decision,request_id)
 VALUES('usage-qa','/mcp?token=bad',200,'allow','14f8c3bc-e692-4c3b-9629-280afcedc68e');
 RAISE EXCEPTION 'unsafe route unexpectedly accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $$;

-- Any test data is discarded; production is never touched.
ROLLBACK;
\echo 'PASS: RLS/grants + daily atomic rollup + unique replay + unknown lengths + protected route.'
