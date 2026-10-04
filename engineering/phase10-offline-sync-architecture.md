# Engineering Phase 10 — Offline / Sync Hardening

## Gate decision

Phase 10 implements an **offline/sync foundation**, not production cloud sync. The existing root `sync.js` is a generic timestamp-based synchronizer and is not reused. No Supabase schema, RLS, Storage bucket, production row, Finance sync code, or Finance transaction is changed. A future cloud adapter must pass a separate schema/RLS/security gate before it can replace the local simulation adapter.

The browser path is `Domain Service → atomic local entity + Outbox commit → validated adapter boundary → Inbox → ownership/schema/version policy → domain-safe apply → Receipt/Checkpoint/Audit`. Client timestamps are diagnostic only; ordering uses per-entity logical versions and server sequence. Checkpoints advance only after the complete pulled batch is safely applied, deduplicated, or recorded as a conflict.

## Data classification matrix

| Data | Class | Truth / scope | Direction & wave | Delete | Conflict / ordering |
|---|---|---|---|---|---|
| Project | mutable | Project Domain / workspace | bidirectional W1 | archive/tombstone | manual, logical version |
| Measurement, Note, ProjectRecord | mutable | Project Data / project | bidirectional W1 | tombstone | manual, logical version |
| CalculationRecord | versioned immutable | Calculation Domain / project | deferred W2 | archive | version fork, revision |
| ParametricDesign snapshot | versioned immutable | Design Domain / project | deferred W2 | archive | version fork, revision |
| BOM, Published Quote | immutable snapshot | Commercial Domain / project | deferred W2 | archive | immutable reject, version |
| Quote Draft, PriceEntry | mutable/versioned | Commercial Domain / project | deferred W2 | tombstone/archive | manual or version fork |
| Member, Task | workflow mutable | Workflow Domain / project | deferred W3 | archive | manual; Task transition guard required |
| Review, WorkflowEvent | append-only | Workflow Domain / project | deferred W3 | none | append-only union, server sequence |
| AI Draft | local-only mutable | AI Domain / project | no cloud in W4 | 90-day retention | local authoritative |
| AI Action, AI Event | executed/append-only local audit | AI Domain / project | no cloud in W4 | none | action/event ID dedupe; never re-execute |
| Attachment metadata/binary | binary metadata/binary | Project Data + binary DB / project | deferred W5 | tombstone then purge | checksum/object-key dedupe |
| 2D/3D render state/cache | derived cache | saved design snapshot | never | local purge | local only; never sync truth |

All synchronized identities are stable UUID-style entity IDs. Filenames, array positions, display names, local auto-increments, and timestamp-only IDs are forbidden.

## Active scope and contracts

Wave 1 actively queues Project, Measurement, Note, and ProjectRecord. Engineering DB v7 migrates forward to v8 and preserves all old stores. New stores are `sync_outbox`, `sync_state`, `sync_conflicts`, `sync_receipts`, and `sync_audit`. Entity mutation, logical receipt increment, and Outbox insertion share one IndexedDB transaction, so a committed formal change cannot silently lose its change record.

`SyncOutboxItem` contains stable change/entity/project/workspace IDs, operation, logical local version, bounded payload, created time, attempt count, next attempt, status, last safe error code, and idempotency key. Delete carries no entity payload. Duplicate push/pull and lost responses are deduplicated by idempotency/change receipts.

Remote rows never write directly from a cloud table into IndexedDB. Inbox applies strict contract validation, workspace/project ownership, active-wave allowlisting, tombstone policy, logical-version conflict detection, and the entity model validator before the domain apply adapter writes. Tasks are deferred until a remote workflow adapter can call the Phase 8 State Machine; Published Quotes and immutable snapshots reject mutation with `SYNC_IMMUTABLE_CONFLICT`.

Retry is exponential (2 seconds to 5 minutes), capped at five attempts. Authentication, authorization, invalid payload, deferred-wave, and immutable failures are non-retryable. Failed work remains diagnostic/dead-letter; there is no busy loop. Audit stores event identity and safe codes/counts, never full sensitive payloads.

## Tombstones and clock skew

A delete atomically removes the current Wave 1 local row while retaining a delete Outbox item and receipt. An older or equal remote version cannot resurrect a receipt marked deleted. A newer post-delete update becomes a manual conflict rather than an automatic resurrection. Client `updated_at` never chooses a winner. Remote ordering requires server sequence; entity concurrency uses logical versions.

## Attachment gate

Attachment metadata and binary remain separate. Local storage already uses `project/{project_id}/attachment/{attachment_id}` and compensates metadata/binary failures. Phase 10 adds diagnostics and explicit recovery plans for interrupted upload, duplicate retry, orphan metadata/binary, checksum mismatch, quota, missing remote binary, and partial deletion. No binary is uploaded in this phase. A future provider must require checksum, size/MIME validation, project-scoped object paths, signed access, quota, and tombstone-before-purge.

## Cloud schema and security gate (not executed)

Before enabling Supabase, create a new reviewed migration—never modify migration history—with workspace/project ownership, foreign keys, stable unique IDs, logical version, server sequence, tombstone, idempotency constraints, append-only/immutable triggers, RLS for SELECT/INSERT/UPDATE/DELETE, and project-scoped Storage policies. Negative tests must cover cross-user/project access, forged IDs/scopes, object-path escape, revoked signed URLs, Published Quote mutation, and append-only event mutation. Production was not touched by Phase 10.

## Recovery and UX

The workspace distinguishes Offline, Saved locally, Pending sync, Synced, Conflict, and Failed. Because the configured adapter is explicitly `local-simulation`, the UI says Cloud not connected and never implies upload. `EngineeringSyncDiagnostics` exposes pending/failed outbox, checkpoint, conflicts, and attachment orphan diagnostics. Manual conflict choices are Keep Local, Keep Remote, Create New Revision, or Later; immutable conflicts cannot use arbitrary overwrite choices.

Rollback is forward-fix: disable the sync worker/adapter, preserve Outbox/conflicts for diagnosis, do not delete or downgrade IndexedDB, and leave local Domain Services usable. Finance DB remains v1 with zero Finance writes.
