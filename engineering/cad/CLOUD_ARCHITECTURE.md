# Cloud CAD worker architecture (development contract)

**Goal:** The user's computer may be powered off. ChatGPT's normal conversation uses a private authenticated remote MCP to submit CAD operations. CADCraft runs in a separate cloud worker/container, not localhost, browser code, or Supabase Edge Functions.

## Data flow
ChatGPT → private HTTPS MCP gateway (OAuth identity) → project-scoped authorization → queued CAD job (idempotency + expectedRevision) → isolated worker with pinned CADCraft headless → read immutable source revision from object storage → perform allowed entity operations → query/inspect and validate → write new immutable drawing revision, DXF and previews → atomically publish job result → return result URL/metadata. The worker must recheck authorizations and revision before publication.

## Contract / trust boundaries
- `cloud-cad-job.cjs` is pure validation and a state-transition *model*, not a durable database, job queue, authorization service, or working MCP server.
- Job identity binds project/drawing/baseRevision/operation/requestId. Request IDs need server-side uniqueness enforcement; hashing alone is not idempotency.
- `expected_revision` is checked against the canonical drawing revision transactionally at publish time; it cannot be trusted from the client.
- Each job runs under bounded CPU, RAM, walltime, file count and output bytes in a restricted sandbox; no arbitrary shell exposed over MCP.
- Never expose CADCraft's underlying unrestricted `execute`, `command_line`, filesystem tools, or unauthenticated localhost control channel to ChatGPT.
- Binary source and outputs belong in dedicated object storage (not legacy Engineering's 10 MiB attachment store). Save by immutable key, SHA-256 and MIME; URLs must be authorized and expiry-scoped.
- A CAD session's in-memory state is ephemeral: save editable revisions to storage after every approved update. Resume by reopening pinned version, never by relying on a running desktop session.
- SVG generated or imported from untrusted sources must not be directly inline-rendered. Prefer isolated PNG preview plus download; process external SVG with a trusted sanitizer where required.
- **Verified in disposable CI:** official CADCraft v0.12.0 Linux headless (DXF reopen/edit, SVG/PNG); test-authenticated HTTP MCP -> Worker -> CADCraft integration; PostgreSQL 16 atomic job completion, immutable DXF, independent-connection readback, worker lease reclamation and fencing; JWT JWKS validator contract tests. See Actions runs 40084771969 and 40087021888.
- **NOT verified/deployed:** a persistent public cloud service, actual Supabase OAuth/JWKS/project ACL, production RLS, durable object storage, periodic heartbeat runner, interrupt-during-upload recovery, actual mobile ChatGPT MCP connection or UI. CI uses disposable Linux/Postgres. Host cost and availability remain unknown.
- Staging revision storage retains bounded 16 MiB DXF bytea snapshots with transactionally committed metadata and job state; production should move binary payloads to immutable object storage.
- Staging worker leases use atomic row locking (FOR UPDATE SKIP LOCKED), heartbeat, lease expiry reclamation and fencing tokens; for preclaimed jobs use runClaimed(key, leaseToken). The production host must renew leases regularly throughout CADCraft execution and refuse stale publication.

## Required staging acceptance
1. In Linux container, verify official CADCraft binary hash and license; run CLI and stdio MCP tests.
2. Submit new drawing while the user's Windows machine is off; poll until job completion.
3. Reopen drawing and modify existing entity, produce a new immutable revision; verify entity identity, geometry and hashes.
4. Test authorization isolation between two projects/users, expired token and untrusted tools.
5. Test duplicate request, stale expected revision, worker crash/requeue, timeout, restart and cancellation.
6. Show versioned result in the Engineering Center; run regression tests; only then consider production review.

**Never silently deploy or incur paid cloud charges** without explicit user approval.
