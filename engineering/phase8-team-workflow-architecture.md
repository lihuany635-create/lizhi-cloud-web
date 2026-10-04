# Engineering Phase 8 Team Workflow Architecture

## Gate decision

Phase 8 uses **Hybrid Staged Architecture / Phase 8A**: cloud-ready contracts with local IndexedDB persistence. The UI must display **Local Workflow · Not Cloud Collaboration**. Existing `auth.js` supplies a signed-in Supabase identity, but Engineering has no membership, invitation, revocation, Engineering RLS, sync direction, or conflict policy. Existing `sync.js` is not an Engineering collaboration adapter. No Supabase schema or RLS is changed in this phase.

## Contracts and boundaries

- `ProjectMember`: project-scoped stable identity, `actor_type=local`, optional future `actor_ref`, display name, role, status and timestamps. Roles are `owner`, `manager`, `member`, `reviewer`; they are workflow validation only, not a security boundary.
- `Task`: neutral project task with priority, one-element `assignee_ids`, optional due date, optional same-project relation, review requirement, creator and completion timestamp.
- `TaskReview`: immutable review history with `approved` or `changes_requested`.
- `WorkflowEvent`: immutable audit facts. Task status remains the business truth; the timeline is a read projection over events, Phase 4 records and published quotes.
- UI calls `WorkflowService`; it never writes task status, completion, approvals, roles or IndexedDB directly.

## State machine definition

Allowed transitions are `todo -> in_progress|cancelled`, `in_progress -> review|done|cancelled`, and `review -> in_progress|done`. `in_progress -> done` is allowed only when review is not required. `review -> done` is allowed only through an approval. A changes-requested review returns the task to `in_progress`. `done` and `cancelled` are terminal in v1. Cancellation requires owner or manager. Starting, requesting review and direct completion require the assignee or a manager/owner. Review decisions require reviewer, manager or owner.

Assignment is single-assignee in v1, stored as an array for forward compatibility. Archived members remain referenced by historical tasks and events.

## Relations and failure policy

Allowed relations are ProjectRecord, Attachment, Measurement, Note, Calculation, Design, BOM and Quote. Services resolve the entity and verify `project_id`; records are never copied. Repository queries are always project-scoped.

Task changes and audit writes use compensation: if an audit write fails, the task is restored; failed creation removes the new task; failed review removes the review and restores the task/events. This is not event sourcing.

## DB migration

Engineering IndexedDB upgrades v5 to v6 and preserves every existing store. New stores use key path `id`:

- `project_members`: indexes `project_id`, `role`, `status`, `updated_at`.
- `tasks`: indexes `project_id`, `status`, multi-entry `assignee_ids`, `updated_at`.
- `task_reviews`: indexes `project_id`, `task_id`, `reviewer_id`, `created_at`.
- `workflow_events`: indexes `project_id`, `entity_id`, `event_type`, `created_at`.

Upgrade failure aborts the IndexedDB upgrade transaction. There is no automatic downgrade or deletion. Finance DB remains v1. Phase 8 writes no Finance transaction and does not introduce AI, cloud sync, ERP, HR, payroll, chat or Phase 9.
