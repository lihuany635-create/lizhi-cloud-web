# Engineering Phase 5 — Parametric Furniture Definition

## Approved scope

- Template and Design are separate. A Template is immutable by `id + version`; a Design is a project-owned instance pinned to that identity.
- Parameters are the source of truth. A pure deterministic `derive(parameters)` produces the shared Derived Model consumed by future drawing and BOM phases.
- A Design stores parameters and a complete `derived_snapshot`. Re-derivation is diagnostic only and never rewrites historical snapshots.
- Draft updates increment `revision`. Archived designs remain readable and cannot be edited through the draft update path.

## First approved template

`woodworking.open-box-cabinet@1.0.0` models only a rectangular open box cabinet. Side panels are full external height/depth. Top, bottom and adjustable shelves fit between the sides. Canonical unit is millimetres. Parameters are `width`, `height`, `depth`, `panel_thickness`, and integer `shelf_count`.

The template explicitly excludes a back panel, doors, toe kick, drawers, hardware, edge banding, joinery, grain direction, cutting optimisation, BOM, pricing and quotes. It therefore makes no hidden claims about those construction choices.

## Derived contract

The model contains template identity, normalized parameters, overall and internal dimensions, stable logical part keys, quantities, dimensions, warnings and metadata. `material_ref` is `null`; no Material database exists in Phase 5.

## Persistence and migration

Engineering IndexedDB upgrades from v3 to v4 and adds only `designs` (`keyPath: id`) with `project_id`, `template_id`, `status`, and `updated_at` indexes. Existing projects, calculations, measurements, notes, attachment metadata and project records are created only when missing and remain untouched. Attachment binary storage stays in its independent v1 database. Upgrade failure rejects opening without downgrade or destructive cleanup.

## Compatibility and rollback

If an exact Template Version is unavailable, the stored snapshot is still displayed with a compatibility warning. The system never substitutes a newer version. Rollback removes the Phase 5 UI/service/repository/template surface while preserving Engineering DB v4 compatibility; no automatic database downgrade is attempted.
