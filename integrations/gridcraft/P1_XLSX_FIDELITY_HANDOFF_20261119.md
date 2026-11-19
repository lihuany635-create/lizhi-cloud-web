# GridCraft v0.5.4 P1 — Source Excel fidelity candidate

**Status:** isolated candidate; no Site/Edge deployment, no GridCraft desktop edits. Derived from v0.5.3 PR #105 HEAD for stacked review. Do not merge or deploy as part of this handoff.

## Deliverable

- `gridcraft_xlsx_fidelity.py`: standard-library, **read-only** OOXML parser and source/target differential report; no automation, editing, disk save, credentials, or network access.
- `test_xlsx_fidelity.py`: synthetic (non-personal) XLSX fixture and 38 unit/negative tests; no private workbook is embedded.
- `.github/workflows/gridcraft-v054-p1-xlsx-fidelity.yml`: Python 3.12/3.13 tests in GitHub Actions; no secrets.

## Covered

- Resolves actual worksheet files from workbook relationships; compares workbook sheets, order, defined names, date basis, formula calculation properties.
- Reports cell type, raw values, shared/inline strings, rich-string OOXML, cache vs formula, shared formula followers (conservative A1 translation), resolved font/fill/border/number formats, rows/cols, merges, page and print-related XML, unknown OOXML parts by SHA-256.
- Defaults to **redacted value reports** (addresses/categories only). User must explicitly pass `--show-values` to display contents locally.
- Rejects duplicate/traversal paths, excessive ZIP package sizes, invalid internal relationships, malformed XML, DTD/entities, invalid sheet references and invalid shared-string indexes.
- Results `MATCH` and `DIFFERENT` are **OOXML structural fidelity** only; they do not certify rendered layout, formulas' recalculated results, GridCraft import/export fidelity, or safe disk save.

## Usage

```
python integrations/gridcraft/gridcraft_xlsx_fidelity.py SOURCE.xlsx TARGET.xlsx --json-out report.json
# Optional local debugging on personally authorized files only:
python integrations/gridcraft/gridcraft_xlsx_fidelity.py SOURCE.xlsx TARGET.xlsx --show-values
```

CLI exit codes: `0` = structural match without warnings, `1` = differences or unresolved formulas, `2` = invalid/unsafe archive. JSON can be written only to an explicitly specified local path.

## Constraints and gaps

- Shared formulas with external/structured references produce warnings instead of guessed translation. Internal shared formulas with ordinary A1 refs are translated conservatively.
- Future P1 extensions may improve defined names, normalized shared-formula metadata and other OOXML feature coverage; unknown parts are hashed, not interpreted.
- No formulas are calculated. Styles are compared by referenced definitions, but a format/layout may still render differently across spreadsheet engines.
- Never feed private workbook raw XML, values, secrets, full paths or personal names to GitHub logs / PRs / Supabase.
- P2–P5 must authorize and integrate this parser with the original owner-only GridCraft bridge. Do not expose unrestricted `engine.execute`, filesystem operations, `app.save`, or arbitrary paths over MCP.

## Verification and provenance

Local isolated suite: 38/38 PASS; separate 13/13 in-memory mutations on the user's supplied XLSX also PASS without altering the source. An earlier derived workbook with the same visible content produced **3,181** structural differences (styles, rich text, row/col geometry, unknown package items and print metadata), demonstrating why value-only validation is insufficient. No user's actual workbook bytes or cell values are committed.

P0 plan/report and original private Drive references remain the canonical user-owned project documents; new candidate requires separate final review and real GridCraft app integration before full end-to-end acceptance.
