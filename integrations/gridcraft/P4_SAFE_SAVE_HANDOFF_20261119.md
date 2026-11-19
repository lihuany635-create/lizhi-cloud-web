# GridCraft v0.5.4 — P4 Safe Copy Save candidate (2026-11-19)

This P4 candidate adds a **non-overwriting XLSX export copy** from the memory-resident GridCraft workbook. It does not call `app.save`, save over the original source, change its file path/dirty state, close or reopen the live GridCraft GUI document. P4 separate native GridCraft GUI close/open and actual user Windows E2E remain `NOT_TESTED` and must not be misreported as `PASS`.

## Scope

- Existing single Private Site, original Edge, P3/P4 writer and P2/P3 candidates all preserved. No new Site, DB or MCP deployment. Site/Edge do not advertise new P4-save commands yet.
- New candidate internal worker jobs: `gridcraft_save_prepare({doc,file_name})`, `gridcraft_save_commit({preview_id,expected_version,request_id,owner_confirmed})`, `gridcraft_save_status({request_id,verify_disk})`. All use current local per-workbook grant and the existing P4 local write switch and owner confirmation; job arguments may never supply any directory or path.
- Export folder is fixed in Windows Agent's own app data directory, sibling `P4SafeExports` of existing `P4Backups`; only new `.xlsx` filenames. No implicit path selection, network share, source overwrite, automatic deletion or auto-retry.
- Validates ZIP/OOXML with P1 and rejects unresolved package warnings; 90-second single-use prepare, CAS before and after P4 full-workbook backup, global request-ID tombstone and durable P2-compatible receipt, bounded storage, output file with `O_CREAT|O_EXCL` and `fsync`. Reopens file from disk via new descriptor, byte SHA-256 and P1 semantic fields comparison; no GridCraft native GUI open performed.
- Success status: `DISK_REOPEN_VERIFIED_COPY_ONLY`, `source_document_saved:false`, `gridcraft_native_reopen:NOT_TESTED`. Status query can independently check disk file digest after restart and refuses access after local workbook grant revocation.
- Ambiguous errors preserve file/backup, record `OUTCOME_UNKNOWN`, never automatically delete/retry or overwrite; user should resolve by status and manual verification.

## Security assumptions and limitations

- The export root and its immediate parent are checked for symlinks/reparse-points; the filename is strict, forbidding traversal, ADS, Windows devices, paths and overwrite. An independently malicious process under the **same Windows user identity** with write access to the app-data directory may still race-replace parent directories; true protection needs Windows OS ACLs/directory-handle security review. Do not claim race-free sandboxing.
- File `fsync` and POSIX directory sync completed before success; Windows filesystem durability additionally depends on drive/filesystem. `DISK_REOPEN_VERIFIED_COPY_ONLY` is a reopened ZIP/OOXML byte-equivalence guarantee, not native UI roundtrip, Excel formatting fidelity or guarantee of durable power-loss recovery.
- Existing P3/P4/Edge grants are preserved; new remote Site schema or production deployment requires explicit user permission. Cross-account revoke, user Windows executable, real backup restoration and GridCraft app close/reopen remain P5 gates.

## Candidate tests

`python -m unittest discover -s integrations/gridcraft -p 'test_p4_safe_save.py' -v`
`python -m unittest discover -s integrations/gridcraft -p 'test_p4_save_worker_route.py' -v`

The tests use a small synthetic XLSX generated in memory. Never commit/upload user attendance workbook or personal cell data to public GitHub.

Original candidate branch: `feat/gridcraft-v054-p4-safe-save-20261119`. P3 already merged to `feat/gridcraft-v053-windows-reliability-20261119` via PR #108 on `ba2bcf4b56939b3aa6d73ddbd70dbf1080c45b03`.
