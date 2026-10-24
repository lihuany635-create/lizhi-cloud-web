> **產品方向更正（2026-10-24）**：本文件記錄歷史雲端 CAD 執行與隔離 CI 的技術成果，**不是目前產品開發主線**。新版正規計畫是先 Fork 官方 CADCraft 完整 Rust 原始碼、保留原生 CAD／MCP，整合使用者已發布的 ChatGPT CAD App，再處理持久儲存、Windows 關機雲端執行與工程中心。請優先閱讀 [CADCRAFT_SOURCE_FORK_PLAN_V2.md](./CADCRAFT_SOURCE_FORK_PLAN_V2.md)。以下原有的 Worker／S3／OAuth 描述是可再利用的歷史技術資料，不代表 Fork 已完成或已部署。

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
- **Historical note (superseded later on 2026-10-24):** the first isolated S3 adapter was not yet joined to PostgreSQL publication. The subsequent 'Joined PostgreSQL + object storage staging' implementation described above now publishes S3-backed revisions through PostgreSQL transactions. This remains **disposable CI only**; orphan recovery, production storage, signed download links, quotas/backups and a publicly reachable TLS-hosted worker remain unfinished.

## Required staging acceptance
1. In Linux container, verify official CADCraft binary hash and license; run CLI and stdio MCP tests.
2. Submit new drawing while the user's Windows machine is off; poll until job completion.
3. Reopen drawing and modify existing entity, produce a new immutable revision; verify entity identity, geometry and hashes.
4. Test authorization isolation between two projects/users, expired token and untrusted tools.
5. Test duplicate request, stale expected revision, worker crash/requeue, timeout, restart and cancellation.
6. Show versioned result in the Engineering Center; run regression tests; only then consider production review.

**Never silently deploy or incur paid cloud charges** without explicit user approval.


## Recovering prior CAD tasks from ordinary ChatGPT conversations (2026-10-24)

- The staging OAuth-protected MCP now advertises `cad_list_jobs` in addition to drawing submission, status, revision history and PNG preview.
- This tool accepts a project ID and a **bounded** 1–25 item limit. The server derives owner UUID and OAuth client ID from the verified bearer token, queries only that owner's project, and independently checks the read grant before returning each drawing.
- Results contain only job key, drawing ID, operation, state, input/output revision and creation time. No CAD script, user prompt, object storage key, object URL, bearer token or internal database credentials are returned.
- Its use case is reopening a new conversation and locating a previous job without depending on the previous chat or ChatGPT Work. Recent-result pagination across very large projects is **not yet implemented**.
- `cloud-cad-job-history.test.cjs` validates owner/project filtering, revoked clients, strict limits and RPC identity binding. The staging SQL includes a supporting owner/project/recent-time index.
- This is a **code/CI capability**; until OAuth, public HTTPS gateway, cloud runtime and private ChatGPT plugin are live, `cad_list_jobs` is **not yet available** in normal chats.

## Current deployment truth

The repository contains a containerized staging MCP API, independent single-owner Linux CADCraft Worker, PostgreSQL queue/OAuth grant model, and immutable S3-compatible artifact publication. Passing GitHub Actions is not equivalent to an always-on cloud CAD service. The connected Supabase account was found to expose only the existing production project at review time; no disposable staging project was found. Do not apply staging migrations to the production project, open public ingress, or incur a paid host without separate explicit authorization. Ordinary CAD usage must not require ChatGPT Work.
