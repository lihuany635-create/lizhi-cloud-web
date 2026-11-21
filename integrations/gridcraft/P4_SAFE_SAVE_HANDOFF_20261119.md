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

## 2026-11-19 receipt identity hardening

P4 status on a **fresh** agent session must not trust a recycled GridCraft numeric workbook UID. Before returning the previous receipt's filename or disk-match status, the newly connected agent verifies current per-document grant and the original source snapshot SHA-256. If the prior workbook is closed, the agent is offline, or the UID now refers to a different workbook, status returns only `RECEIPT_IDENTITY_NOT_VERIFIED` and does not reveal the filename. This is intentionally more restrictive than the earlier offline-restart receipt lookup. It does not prevent a same-byte clone of a workbook from matching, and is not a substitute for a stable cryptographic workbook identity. Windows GUI/native app close/reopen and cross-account revocation still require a real device.

Two tests added: same-session restart rebind with matching open workbook and recycled UID to different workbook; original offline-after-restart test changed to fail closed. P4 isolated tests now 28/28 PASS locally; GitHub Windows/Linux CI is required before accepting the change.

## Optional local native GridCraft parser probe (prepared; **not yet executed against a real CLI**)

`gridcraft_p4_native_read_probe.py` uses the official **GridCraft CLI v0.19.1** via strict read-only `version`, `info --json` and `check --json --max-report 0` commands, with no shell, bounded output, timeouts, and local-only file/binary parameters. It requires an already-exported P4 copy in the agent-controlled folder. A matching CLI `check` exits 0 and is labeled `NATIVE_CLI_ROUNDTRIP_PASS`; any differences are **not** falsely marked success. No worksheet contents, absolute file paths, or raw command outputs are logged. It cannot modify or close an open GridCraft GUI document, and is not exposed as a remote MCP. Testing with mocked CLI responses is **not actual native GridCraft verification**. The CLI binary must be independently installed and the target copy authorized before a real-device run.

Example, to be run on the user's approved Windows test workstation only:

```powershell
python integrations/gridcraft/gridcraft_p4_native_read_probe.py --export-folder "$env:LOCALAPPDATA\Lizhi\GridCraftAgent\P4SafeExports" --file-name "測試副本.xlsx" --cli-bin "C:\Path\To\gridcraft-cli.exe"
```

`test_p4_native_read_probe.py`: synthetic-only command isolation, invalid-path, native-version, timeout and nonzero-`check` tests; all 8 pass locally. No real CLI, GUI close/open, or source workbook write was performed.

## 2026-11-21 Windows candidate and native desktop acceptance

The Windows source now reports v0.5.4. The PR workflow builds an isolated PyInstaller EXE and requires its self-test to exercise the P4 prepare and status dispatch, verify local authorization and reject an unrestricted native save. The EXE is a workflow artifact; the job does not release or install it.

With installed GridCraft 0.19.1 on Windows, a synthetic workbook was copied, opened in a separate GridCraft window, edited only at D1, saved through the desktop, closed, and reopened from disk. The new value survived. P1 found six expected fields: four introduced for D1, the used range and the recorded selection. Existing formula, cell style, merge and print fields matched, with zero inventory warnings. Native CLI matched both formula caches and reported zero round-trip differences. This fixture was generated by GridCraft and does not establish general Excel or visual print fidelity.

The installed v0.5.3 production agent and its Book1 were left alone. The sandbox denied connections to the isolated desktop control port with Windows error 10013, so the v0.5.4 candidate worker was not verified against a live socket or the production MCP. The native GUI result is separate from the safe-copy worker. No Site, Edge, or database configuration change was applied.

The queued worker now returns the actual bounded P4 refusal code (for example, `OWNER_CONFIRMATION_REQUIRED`) to the relay. Previously its generic exception handler reported `LOCAL_CONTROL_UNAVAILABLE` for that refusal. This change does not grant a write or retry it.
