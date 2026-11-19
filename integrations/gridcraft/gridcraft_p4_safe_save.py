"""GridCraft v0.5.4 P4 candidate: append-only *copy export*, not app.save.

Persist the in-memory GridCraft XLSX snapshot into a fixed app-owned export folder.
There is NO remote path, overwrite, original-file save, or unsaved-state reset.
Freshly reopens the on-disk ZIP/OOXML and compares its complete P1 inventory to
what the app returned. Native GridCraft UI open/close remains a P5 real-device test.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import stat
import threading
import time
import unicodedata
import uuid

from gridcraft_p4_safe_write import P4Denied, check_request_id, valid_doc, TTL_SECONDS
from gridcraft_p2_batch import BatchReceiptStore
from gridcraft_xlsx_fidelity import inventory_bytes, WorkbookInvalid, MAX_ARCHIVE

MAX_EXPORTS = 200
MAX_EXPORT_FOLDER_BYTES = 512 * 1024 * 1024
# Reserving a backup, snapshot, and verification may temporarily use more RAM;
# reject oversized input at the same P1 MAX_ARCHIVE threshold.
MAX_EXPORT_BYTES = min(MAX_ARCHIVE, 64 * 1024 * 1024)
WINDOWS_DEVICE = re.compile(r"^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$", re.I)
BAD_CHARS = frozenset('<>:"/\\|?*')


def safe_basename(name: str) -> str:
    """Only a single filename. No caller-controlled directory or replacement."""
    if not isinstance(name, str) or type(name) is not str:
        raise P4Denied("SAVE_NAME_DENIED")
    if name != unicodedata.normalize("NFC", name) or not 6 <= len(name) <= 95:
        raise P4Denied("SAVE_NAME_DENIED")
    if name.startswith((".", " ")) or name[-1] in (".", " "):
        raise P4Denied("SAVE_NAME_DENIED")
    if any(ord(c) < 32 or c in BAD_CHARS for c in name) or not name.lower().endswith(".xlsx"):
        raise P4Denied("SAVE_NAME_DENIED")
    if name.count(".") != 1 or not name[:-5].strip() or WINDOWS_DEVICE.fullmatch(name):
        raise P4Denied("SAVE_NAME_DENIED")
    if name[:-5].endswith((" ", ".")) or any(unicodedata.category(c) in ("Cf", "Cs") for c in name):
        raise P4Denied("SAVE_NAME_DENIED")
    return name


def _sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _semantic_inventory(data: bytes):
    if type(data) is not bytes or not 0 < len(data) <= MAX_EXPORT_BYTES:
        raise P4Denied("SAVE_SOURCE_LIMIT")
    try:
        inv = inventory_bytes(data, path="<local-only>")
    except (WorkbookInvalid, ValueError, OSError):
        raise P4Denied("SAVE_SOURCE_UNSUPPORTED") from None
    if inv.warnings:
        raise P4Denied("SAVE_SOURCE_UNRESOLVED")
    return inv


def _signature(inv) -> str:
    # P1 inventory includes cell/formula/style/merge/geometry/print/unknown parts.
    return hashlib.sha256(json.dumps(inv.fields, sort_keys=True, separators=(",", ":"),
                              ensure_ascii=False).encode("utf-8")).hexdigest()


def _is_reparse(st) -> bool:
    return bool(getattr(st, "st_file_attributes", 0) & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0))


def _safe_directory(root: Path) -> None:
    """Reject path substitution/symlink/reparse-point in the fixed export subtree.

    The fixed app-owned parent must be provisioned by the Windows agent; NOT a
    path provided by Site/Edge or from workbook content. The desktop OS user's
    ACL must prevent unrelated processes from swapping parent folders.
    """
    root = Path(root)
    if root.is_symlink():
        raise P4Denied("SAVE_FOLDER_UNSAFE")
    try:
        if not root.is_dir():
            raise P4Denied("SAVE_FOLDER_MISSING")
        current = root
        # Inspect root and immediate configured parent. Root is fixed by agent.
        for _ in range(2):
            st = current.lstat()
            if not stat.S_ISDIR(st.st_mode) or _is_reparse(st):
                raise P4Denied("SAVE_FOLDER_UNSAFE")
            current = current.parent
    except OSError:
        raise P4Denied("SAVE_FOLDER_UNSAFE") from None


def _file_inventory(path: Path):
    # A fresh descriptor and read is a *disk* reopen, not GridCraft UI reopen.
    flags = os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
    try:
        fd = os.open(path, flags)
        with os.fdopen(fd, "rb") as f:
            st = os.fstat(f.fileno())
            if not stat.S_ISREG(st.st_mode) or _is_reparse(st) or st.st_size > MAX_EXPORT_BYTES:
                raise P4Denied("SAVE_DISK_UNSAFE")
            data = f.read(MAX_EXPORT_BYTES + 1)
            if len(data) != st.st_size:
                raise P4Denied("SAVE_DISK_MISMATCH")
        lst = path.lstat()
        if lst.st_dev != st.st_dev or lst.st_ino != st.st_ino or _is_reparse(lst):
            raise P4Denied("SAVE_DISK_CHANGED")
    except OSError:
        raise P4Denied("SAVE_DISK_REOPEN_FAILED") from None
    return data, _semantic_inventory(data)


def _sync_folder(root: Path) -> None:
    # POSIX directory fsync; Windows fsync(file) already completed, and an
    # unprivileged directory handle typically cannot be opened via os.open.
    if os.name != "posix":
        return
    try:
        fd = os.open(root, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
        try: os.fsync(fd)
        finally: os.close(fd)
    except OSError:
        raise P4Denied("SAVE_DIRECTORY_SYNC_FAILED") from None


class P4SafeSaveWriter:
    """Append-only export from the already verified P4 local workbook snapshot.

    Uses P4 global replay index and P2 append-only receipt implementation.
    All tool results omit absolute Windows paths, cell contents and tokens.
    """
    def __init__(self, p4, *, clock=time.monotonic):
        self.p4 = p4
        self.clock = clock
        self._lock = p4._lock
        self._previews = {}
        self.session = uuid.uuid4().hex
        self.root = Path(p4.backups).parent / "P4SafeExports"
        # Forbid an existing symlink before mkdir; the directory is fixed by app.
        if self.root.is_symlink():
            raise P4Denied("SAVE_FOLDER_UNSAFE")
        try:
            self.root.mkdir(mode=0o700, parents=True, exist_ok=True)
        except OSError:
            raise P4Denied("SAVE_FOLDER_UNSAFE") from None
        _safe_directory(self.root)
        self.receipts = BatchReceiptStore(Path(p4.backups) / "P4SafeSaveReceipts")

    def invalidate_previews(self):
        with self._lock:
            self._previews.clear()
            self.session = uuid.uuid4().hex

    def _check_folder(self):
        _safe_directory(self.root)
        try:
            entries = list(self.root.iterdir())
            files = []
            for p in entries:
                if p.is_symlink():
                    raise P4Denied("SAVE_FOLDER_UNSAFE")
                if p.is_file():
                    if _is_reparse(p.lstat()): raise P4Denied("SAVE_FOLDER_UNSAFE")
                    if p.name.lower().endswith(".xlsx"):
                        files.append(p)
            if len(files) >= MAX_EXPORTS:
                raise P4Denied("SAVE_FOLDER_LIMIT")
            if sum(p.stat().st_size for p in files) >= MAX_EXPORT_FOLDER_BYTES:
                raise P4Denied("SAVE_FOLDER_LIMIT")
            return files
        except OSError:
            raise P4Denied("SAVE_FOLDER_UNSAFE") from None

    def _check_filename_absent(self, name: str):
        files = self._check_folder()
        if any(x.name.casefold() == name.casefold() for x in files):
            raise P4Denied("SAVE_ALREADY_EXISTS")
        candidate = self.root / name
        if candidate.exists() or candidate.is_symlink():
            raise P4Denied("SAVE_ALREADY_EXISTS")
        return candidate

    def prepare(self, doc, filename):
        doc = valid_doc(doc)
        name = safe_basename(filename)
        with self._lock:
            self.p4._authorized(doc)
            self._check_filename_absent(name)
            data = self.p4.local.snapshot_bytes(doc)
            inv = _semantic_inventory(data)
            version = _signature(inv)
            pid = str(uuid.uuid4())
            self._previews.clear()
            self._previews[pid] = {"doc": doc, "name": name, "version": version,
                                   "expires": self.clock() + TTL_SECONDS}
            return {"ok": True, "preview_id": pid, "expected_version": version,
                    "file_name": name, "bytes": len(data),
                    "requires_owner_confirmation": True, "requires_local_write_enable": True,
                    "destination": "APP_PRIVATE_EXPORT_FOLDER", "overwrite": False,
                    "source_document_saved": False,
                    "expires_in_seconds": TTL_SECONDS}

    def commit(self, preview_id, expected_version, request_id, *, write_enabled, owner_confirmed):
        rid = check_request_id(request_id)
        if type(write_enabled) is not bool or type(owner_confirmed) is not bool or not write_enabled or not owner_confirmed:
            raise P4Denied("OWNER_CONFIRMATION_REQUIRED")
        if not isinstance(preview_id, str) or not isinstance(expected_version, str):
            raise P4Denied("INVALID_PREVIEW")
        with self._lock:
            if self.receipts.get(rid) is not None or rid in self.p4.receipts.seen:
                raise P4Denied("REPLAY_DENIED")
            plan = self._previews.pop(preview_id, None)
            if not plan: raise P4Denied("PREVIEW_NOT_FOUND")
            if self.clock() > plan["expires"]: raise P4Denied("PREVIEW_EXPIRED")
            if expected_version != plan["version"]: raise P4Denied("VERSION_MISMATCH")
            doc = plan["doc"]
            self.p4._authorized(doc)
            target = self._check_filename_absent(plan["name"])
            before = self.p4.local.snapshot_bytes(doc)
            if _signature(_semantic_inventory(before)) != expected_version:
                raise P4Denied("VERSION_CONFLICT")
            # Ensure the original workbook can be recovered even if export fails.
            backup = self.p4._save_backup(doc)
            source = self.p4.local.snapshot_bytes(doc)
            source_inv = _semantic_inventory(source)
            if _signature(source_inv) != expected_version:
                raise P4Denied("VERSION_CONFLICT_AFTER_SNAPSHOT")
            self._check_filename_absent(plan["name"])
            if sum(p.stat().st_size for p in self._check_folder()) + len(source) > MAX_EXPORT_FOLDER_BYTES:
                raise P4Denied("SAVE_FOLDER_LIMIT")
            record = {"version": 1, "session": self.session, "doc": doc,
                      "state": "RESERVED", "filename": plan["name"],
                      "source_version": expected_version,
                      "source_sha256": _sha_bytes(source), "bytes": len(source),
                      "backup_id": backup["backup_id"], "backup_sha256": backup["backup_sha256"]}
            self.receipts.reserve(rid, record)
            try:
                self.p4.receipts.reserve(rid, preview_id, backup["backup_sha256"])
            except Exception:
                self.receipts.update(rid, state="ABORTED_NO_WRITE")
                raise
            dest = self.root / plan["name"]
            try:
                self.receipts.update(rid, state="ATTEMPTING")
                flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
                fd = os.open(dest, flags, 0o600)  # O_EXCL prevents any overwrite or symlink target.
                with os.fdopen(fd, "wb") as file:
                    file.write(source)
                    file.flush()
                    os.fsync(file.fileno())
                _sync_folder(self.root)
                disk, parsed = _file_inventory(dest)  # close/reopen through a fresh disk descriptor
                if _sha_bytes(disk) != _sha_bytes(source) or _signature(parsed) != expected_version:
                    self.receipts.update(rid, state="DISK_MISMATCH")
                    return {"ok": False, "status": "DISK_MISMATCH", "request_id": rid,
                            "file_name": plan["name"], "source_document_saved": False}
                self.receipts.update(rid, state="DISK_REOPEN_VERIFIED_COPY_ONLY")
                return {"ok": True, "status": "DISK_REOPEN_VERIFIED_COPY_ONLY",
                        "file_name": plan["name"], "bytes": len(source),
                        "sha256": _sha_bytes(source), "request_id": rid,
                        "backup_id": backup["backup_id"], "source_document_saved": False,
                        "gridcraft_native_reopen": "NOT_TESTED"}
            except Exception:
                # No cleanup or automatic retry. A partial file may exist;
                # keep the tombstone and allow explicit status reconciliation.
                try: self.receipts.update(rid, state="OUTCOME_UNKNOWN")
                except Exception: pass
                return {"ok": False, "status": "OUTCOME_UNKNOWN", "request_id": rid,
                        "file_name": plan["name"], "source_document_saved": False,
                        "next_step": "MANUAL_STATUS_RECONCILIATION"}

    def status(self, request_id, *, verify_disk=False):
        rid = check_request_id(request_id)
        if type(verify_disk) is not bool: raise P4Denied("INVALID_ARGS")
        with self._lock:
            rec = self.receipts.get(rid)
            if rec is None: return {"ok": False, "error": "RECEIPT_NOT_FOUND"}
            # Even read-only receipt metadata is private to the locally granted
            # workbook; never leak filenames after authorization is revoked.
            if rec["doc"] not in self.p4.approved_docs:
                raise P4Denied("WORKBOOK_NOT_GRANTED")
            # A GridCraft numeric doc UID is transient and may be reused after
            # restart. Never reveal a previous export name to a newly granted
            # but unrelated workbook sharing that UID. To reconcile a receipt
            # from an earlier agent session, prove the *currently open* and
            # locally authorized document still has the original XLSX bytes.
            # When the old workbook is offline, fail closed; a disk copy is not
            # proof of current workbook identity.
            if rec.get("session") != self.session:
                verified_identity = False
                try:
                    self.p4._authorized(rec["doc"])
                    current = self.p4.local.snapshot_bytes(rec["doc"])
                    verified_identity = (_sha_bytes(current) == rec["source_sha256"])
                except Exception:
                    pass
                if not verified_identity:
                    return {"ok": False, "error": "RECEIPT_IDENTITY_NOT_VERIFIED",
                            "request_id": rid, "source_document_saved": False}
            ans = {"ok": True, "request_id": rid, "status": rec["state"],
                   "file_name": rec["filename"], "source_document_saved": False}
            if not verify_disk: return ans
            try:
                _safe_directory(self.root)
                disk, inv = _file_inventory(self.root / safe_basename(rec["filename"]))
                good = (_sha_bytes(disk) == rec["source_sha256"] and
                        _signature(inv) == rec["source_version"])
                ans["disk_verification"] = "MATCH" if good else "CHANGED_OR_PARTIAL"
                ans["gridcraft_native_reopen"] = "NOT_TESTED"
            except P4Denied as exc:
                ans["disk_verification"] = str(exc)
            return ans
