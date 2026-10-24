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

## Joined PostgreSQL + object storage staging (2026-10-24)

- `cloud-cad-object-revisions.cjs` coordinates an auditable upload attempt, immutable S3 object PUTs keyed by owner/project/drawing/revision/**job key**/format, and one PostgreSQL transaction committing object hashes, drawing head, job completion and the upload's published marker.
- `cloud-cad-object-worker-ports.cjs` connects the existing Worker to an owner-scoped compiled intent store and retrieves old DXF versions from the S3-compatible store; testing publishes revisions 1 through 4. The joined CI runner executes simulated geometry for this portion; the separate Linux CADCraft binary smoke test still covers actual CADCraft rendering.
- Staging integration: PostgreSQL 16 Docker service plus Moto S3 HTTP emulator; Actions run 40091058125 PASS. Verified edit races, rollback after partial S3 failure, immutable historical revisions, and two orphan **candidates** kept for manual review. **No automatic object deletion**.
- S3 PUTs are outside the PostgreSQL transaction: metadata publication is atomic **within PostgreSQL only**. Upload crash can leave unreferenced objects. Do not claim a distributed ACID transaction or production recovery. A separate authorized cleanup and quota/retention policy remain required.
- Neither production Supabase Storage, user-specific project ACL, always-on worker, public TLS MCP OAuth connection nor integration with the live Engineering Center UI is deployed.

## New staging integrations (2026-10-24)

- **Lease heartbeat during execution:** `cloud-cad-lease-runner.cjs` renews a preclaimed job's lease throughout execution, propagates a lost-lease AbortSignal to `cloud-cad-worker.cjs`, and terminates the child CADCraft CLI through `cadcraft-cli-runner.cjs`. The PostgreSQL transaction uses the **database clock** to reject expired lease tokens. Tested on Node 20/22 and actual ephemeral PostgreSQL 16 (Actions run 40088145037). This does **not** by itself provide a continuously deployed host or forced cancellation for any separate MCP stdio process.
- **S3-compatible immutable artifact adapter:** `cloud-cad-s3-store.cjs` uses SDK v3 conditional `PutObject If-None-Match: *`, owner/project/drawing/revision-scoped keys, content-signature checks, and SHA-256 verification on read. The same bytes are idempotent and different bytes cannot overwrite a revision. Live S3 **protocol** interactions were tested against an ephemeral Moto HTTP emulator (Actions run 40088705852). This is **not** proof of AWS S3, Supabase Storage, or MinIO production behavior; the official MinIO image/archived binary was unavailable to CI.
- **Integration not yet complete:** PostgreSQL revision publication currently retains a staging DXF bytea payload up to 16 MiB; S3 artifact storage is an independent tested adapter, not yet referenced from the atomic PostgreSQL publication or connected to live Storage credentials. The final cloud service needs S3 object upload → metadata transaction → recovery of orphaned uploads, project ACL, signed URL retrieval, quotas/backups and a real TLS-hosted worker.

## Required staging acceptance
1. In Linux container, verify official CADCraft binary hash and license; run CLI and stdio MCP tests.
2. Submit new drawing while the user's Windows machine is off; poll until job completion.
3. Reopen drawing and modify existing entity, produce a new immutable revision; verify entity identity, geometry and hashes.
4. Test authorization isolation between two projects/users, expired token and untrusted tools.
5. Test duplicate request, stale expected revision, worker crash/requeue, timeout, restart and cancellation.
6. Show versioned result in the Engineering Center; run regression tests; only then consider production review.

**Never silently deploy or incur paid cloud charges** without explicit user approval.
