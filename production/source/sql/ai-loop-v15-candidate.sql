-- REVIEW CANDIDATE ONLY. Never applied automatically. Existing Site D1 binding DB.
CREATE TABLE ai_loop_grants_v15 (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, owner TEXT NOT NULL,
 project TEXT NOT NULL, expires INTEGER NOT NULL CHECK(expires>0), revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN (0,1)),
 state TEXT NOT NULL DEFAULT 'ISSUED' CHECK(state IN ('ISSUED','RUNNING','DONE','FAILED')), request_id TEXT,
 calls INTEGER NOT NULL DEFAULT 0 CHECK(calls BETWEEN 0 AND 5), UNIQUE(owner, request_id)
);
CREATE TABLE ai_loop_audit_v15 (
 id TEXT PRIMARY KEY, grant_id TEXT, request_id TEXT,
 event TEXT NOT NULL, tool TEXT, at INTEGER NOT NULL
);

-- No cleanup is registered or run. Keep request_id tombstones: deleting grants permits replay.
CREATE INDEX ai_loop_audit_v15_at ON ai_loop_audit_v15(at);
