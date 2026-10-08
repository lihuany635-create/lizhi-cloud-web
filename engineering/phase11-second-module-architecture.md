# Engineering Phase 11 — Second Professional Module Validation

## Decision

Gate 11 validates that `Woodworking` and `Supervision` can coexist above the same Engineering Core. Supervision is deliberately an MVP, not a complete construction-management system.

## Reuse matrix

| Capability | Woodworking | Supervision | Direct Core reuse | Generic extension | Module-owned |
|---|---:|---:|---:|---:|---:|
| Project / `module_ids` | yes | yes | yes | no | no |
| Calculation Engine | yes | yes | yes | no | formula definitions |
| Attachment metadata/binary | yes | yes | yes | no | relation IDs only |
| Workflow | yes | yes | yes | `module_entity` relation | defect rules |
| AI Context | yes | yes | yes | `module_entity` selection | no new AI pipeline |
| Sync classification | yes | classified | yes | new policies | local-only entities |
| BOM / Quote | yes | no | unchanged | no | woodworking only |

Woodworking depends on public Project, Calculation, Project Data, Workflow, AI and Sync contracts. Its template, rendering, BOM adapter, and formulas remain in `modules/woodworking`. The Core contains no woodworking-specific fields or imports.

## Generic Core extension proposal

- Current limitation: Workflow and AI could reference only the fixed Core entity list.
- Requirement: a professional module must expose a project-scoped entity without adding its fields to Task or AI Core.
- Generic rationale: any future Civil, Safety, Survey, or Woodworking module can expose an entity using the same composite reference.
- Contract: `module_entity` plus an external resolver registry keyed by `module_id:entity_type:id`.
- Compatibility: all existing relation types remain unchanged; Woodworking requires no migration.
- Migration impact: none in stored Task shape because it already stores strings for relation type and ID.
- Contract tests: registry validation, duplicate rejection, project scoping through Workflow and AI Context, and Core import-boundary tests.
- Risk: an unavailable module resolver rejects the relation safely instead of inventing an entity.
- Alternative rejected: adding `supervision_defect` to Task would pollute Core.

## Supervision MVP contract

The module owns versioned checklist definitions, `SupervisionInspection`, `SupervisionDefect`, repositories, service, UI, and two formulas. Inspections keep a full checklist snapshot so unknown or newer template versions cannot rewrite history. Defect status is independent of Workflow Task status. A Task is created only through `WorkflowService`; Task completion never auto-closes a Defect.

Attachments are reused by stable Phase 4 attachment IDs. Missing relations are displayed explicitly and do not crash. No second attachment store or cloud storage is introduced.

## Data isolation

Both stores carry stable `id`, `project_id`, and forced `module_id=supervision`. The service verifies project ownership and that the Project enables the module. Attachment and Inspection relations are checked within the same Project. Woodworking services never read either Supervision store.

## Database migration

Engineering DB moves from v8 to v9 with two additive stores:

- `supervision_inspections`: keyPath `id`; indexes `project_id`, `module_id`, `status`, `updated_at`.
- `supervision_defects`: keyPath `id`; indexes `project_id`, `module_id`, `inspection_id`, `status`, `updated_at`.

The IndexedDB upgrade transaction creates missing stores only. Existing Phase 0–10 stores, including `sync_outbox`, `sync_state`, `sync_conflicts`, `sync_receipts`, and `sync_audit`, are not rewritten or deleted. The migration fixture verifies a v8 database creates only these two stores and preserves the pending-outbox surface. Rollback is forward-fix only: do not delete or downgrade the database; an older application simply ignores the additive stores.

## Sync and AI boundary

Supervision entities are classified `local_only_module`, Wave 0, direction `none`, with stable IDs. Phase 10 stays Wave 1 and uses the local-simulation adapter; no cloud adapter is enabled. Engineering AI can explicitly select a project-scoped `module_entity`, but no new capability or execution pipeline was added. Existing Draft → Validation → Human Confirmation → Domain Service controls remain intact.

## Platformization proof

A second professional module was added without rewriting Engineering Core. The evidence is: two modules register concurrently; both formula packs use one Calculation Engine; Project, Attachment, Workflow, and AI Context are reused; module data remains in its own directory and stores; Core has no professional imports or branches; multi-module UI keeps each professional section separate; and generic contract/boundary tests can be applied to a future third module.

## Known limitations

This phase does not implement a complete inspection ERP, regulation database, cloud sync, cloud collaboration, automatic AI write, full photo workflow, cost estimation, or BIM/CAD. Checklist editing and cloud synchronization require a separately approved future phase.
