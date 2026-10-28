-- REVIEW CANDIDATE ONLY. Never applied automatically. Existing Site D1 binding DB.
CREATE TABLE ai_loop_grants_v15 (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, owner TEXT NOT NULL,
 project TEXT NOT NULL, expires INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0,
 state TEXT NOT NULL DEFAULT 'ISSUED', request_id TEXT,
 calls INTEGER NOT NULL DEFAULT 0, UNIQUE(owner, request_id)
);
CREATE TABLE ai_loop_audit_v15 (
 id TEXT PRIMARY KEY, grant_id TEXT, request_id TEXT,
 event TEXT NOT NULL, tool TEXT, at INTEGER NOT NULL
);
