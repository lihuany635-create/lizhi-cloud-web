# Engineering Phase 7 — BOM, Quote and PDF Architecture

## Approved gates

BOM consumes only a saved `ParametricDesign.derived_snapshot`. One logical part becomes one BOM line; no dimension/material aggregation is performed in v1. Quantity and the existing `length_mm`, `width_mm`, and `thickness_mm` values are copied without cabinet calculations. `material_ref` stays null unless the snapshot already owns one; `material_label` is optional manual text. A new immutable BOM is created for each generation and pins design revision, template identity, source snapshot hash, and BOM version. Both v1.0 and v1.1 snapshots contain the approved part contract, so runtime template availability and Phase 6 placement are not required.

Phase 7 pricing supports only human-entered `per_piece` prices in TWD. Price entries are versioned, project/BOM-item scoped, and identify their source as `manual`. No market, supplier, area, length, Taiwanese trade-unit, tax, or discount assumptions are made. Missing prices remain unresolved (`null`), never zero.

Quote calculations are domain-owned. Quantities are positive integers, TWD unit prices and every line/subtotal/total use zero-decimal half-up rounding, adjustments are empty, and tax is zero and excluded from the MVP. Drafts may be repriced. Publishing requires an explicit human action and complete validation, then stores a deep immutable snapshot. A published quote cannot be edited; changes create a new draft revision. Quote numbers use `Q-YYYYMMDD-<stable id prefix>-R<revision>`.

## PDF boundary

The renderer accepts a Quote snapshot (or a draft clearly marked `DRAFT`) and performs layout only. It never derives quantity, unit price, line total, subtotal, tax, or total. Browser canvas renders Chinese text and tables into page JPEGs; a small dependency-free writer packages those images as A4 PDF pages. Repeated headers, wrapping, right-aligned amounts, and page bounds are defined by the layout contract.

## Persistence and migration

Engineering IndexedDB upgrades from v4 to v5 and adds only `boms`, `price_entries`, and `quotes`, each with `keyPath: id` and a `project_id` index. BOM also indexes `design_id`; price entries index `bom_item_id`; quotes index `bom_id`, `status`, and `updated_at`. Existing projects, calculations, Phase 4 data, designs, and attachment binary storage are untouched. Upgrade/open failure rejects safely; there is no downgrade or destructive rollback.

## Failure and isolation

BOM generation completes before repository write. Quote creation requires a persisted BOM. Missing price blocks publish. Repository/publish failure leaves the draft status unchanged. PDF failure does not mutate its Quote. All repository lists are project-scoped. This phase adds no Finance write, AI, cloud sync, payment, invoice, inventory, purchasing, optimization, CAD/DXF, or Phase 8 workflow.
