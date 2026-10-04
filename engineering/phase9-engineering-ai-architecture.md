# Phase 9 Engineering AI Architecture

## Gate decisions

Phase 9 uses a **local controlled draft provider**. The existing Finance Gateway is not reused because its endpoint, prompt and output guard are Finance-specific. No cloud provider, external endpoint, browser API key, Supabase table, attachment upload or provider retention is introduced. `PlatformAdapter.callAI` remains unavailable and is not treated as an authorization boundary.

The first capabilities are `project_summary`, `draft_task`, and `draft_project_record`. Structured measurement extraction is deferred. Summary is read-only. The other two capabilities produce proposals that remain `AI Draft · Not yet applied` until a human confirms them.

## Trust and execution boundary

`EngineeringAIContext` is built through existing project-scoped services and repositories. It includes a project summary, at most eight explicitly selected entity references, user intent, allowed actions and trust labels. Attachment content is excluded. Notes and project records are wrapped as `untrusted_data_not_instructions`; their content cannot change the action allowlist.

The only write path is:

`structured provider output -> strict schema validation -> project-scoped domain validation -> human confirmation -> AIExecutionAdapter -> WorkflowService.createTask / ProjectDataService.createRecord`

AI code has no persistence handle for formal Engineering stores. It cannot publish or modify a Quote, alter BOM/design geometry, approve/complete Workflow, change roles, delete data or write Finance transactions. Unknown actions fail with `AI_ACTION_NOT_ALLOWED`. IDs are reloaded from the current project at generation and confirmation time. The saved project version detects stale drafts.

## Provider and failure policy

The provider identity is `local-safe-template / engineering-draft-template / 1.0.0`. It is deterministic, has a bounded timeout and sends no data off-device. Provider timeout, unavailable and malformed output fail closed. The workspace remains usable and formal data is unchanged. Replacing it with a remote provider requires a new privacy/security gate and a server-side adapter; keys must never enter the browser bundle or Git.

## Persistence, retention and migration

Engineering IndexedDB upgrades **v6 to v7** without deleting or rewriting earlier stores. New stores use key path `id` and a `project_id` index:

- `ai_drafts`: `capability_id`, `status`, `created_at`, `updated_at`.
- `ai_actions`: `draft_id`, `action_type`, `status`, `updated_at`.
- `ai_events`: `draft_id`, `action_id`, `event_type`, `created_at`.

Drafts expire after 90 days for execution purposes. MVP keeps structured drafts/actions/audit locally until a later explicit retention cleanup feature. It does not store raw provider output, full prompts, attachment payloads or secrets. Upgrade failure aborts the IndexedDB transaction; there is no downgrade or database deletion.

## Audit and idempotency

Audit covers request, context build, provider call, draft, validation, human decision and execution result with minimal metadata. It does not save unnecessary prompt or attachment content. Stable action IDs use `ai-action:<draft_id>`. Formal Task/Project Record metadata stores this ID, so retries can discover an already-created entity and return `ALREADY_EXECUTED` instead of duplicating it.

Finance DB remains v1. Phase 9 performs zero Finance writes and contains no Phase 10 offline/sync behavior.
