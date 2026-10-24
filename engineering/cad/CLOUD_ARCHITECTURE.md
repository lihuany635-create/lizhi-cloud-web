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
- Cloud runtime support, persistence, RLS, authentication and host costs remain **UNTESTED**. The previous v0.12.0 end-to-end run was on Windows only.

## Required staging acceptance
1. In Linux container, verify official CADCraft binary hash and license; run CLI and stdio MCP tests.
2. Submit new drawing while the user's Windows machine is off; poll until job completion.
3. Reopen drawing and modify existing entity, produce a new immutable revision; verify entity identity, geometry and hashes.
4. Test authorization isolation between two projects/users, expired token and untrusted tools.
5. Test duplicate request, stale expected revision, worker crash/requeue, timeout, restart and cancellation.
6. Show versioned result in the Engineering Center; run regression tests; only then consider production review.

**Never silently deploy or incur paid cloud charges** without explicit user approval.
