"""GridCraft v0.5.4 P2: bounded multi-range writer for the already-authorised P4 local writer.

ISOLATED CANDIDATE. No remote MCP wiring or disk workbook save. An entire batch has
one XLSX backup and one durable request-ID tombstone; each range still uses the
existing P4 strict value validator and CAS/readback guarantees. A batch is NOT
atomic: errors after one write are reported as partial/unknown, never retried.
The receipt records digests and coordinates, not cell contents or credentials.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
import secrets
import threading
import time
import uuid

from gridcraft_p4_safe_write import (
    P4Denied, bounded_region, clean_values, valid_doc, valid_sheet,
    fingerprint, check_request_id, TTL_SECONDS,
)

MAX_OPERATIONS = 8
MAX_BATCH_CELLS = 200
MAX_BATCH_BYTES = 16 * 1024
MAX_RECORDS = 50000


def _canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def _digest(value):
    return hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def _rect_overlaps(a, b):
    return not (a[2] < b[0] or b[2] < a[0] or a[3] < b[1] or b[3] < a[1])


def _check_data_shape(before, after):
    if not isinstance(before, list) or len(before) != len(after):
        raise P4Denied("READBACK_SHAPE")
    for i, line in enumerate(after):
        if not isinstance(before[i], list) or len(before[i]) != len(line):
            raise P4Denied("READBACK_SHAPE")


class BatchReceiptStore:
    """Immutable O_EXCL request tombstones; atomic updates and corruption fail-closed.

    A receipt is intentionally retained indefinitely to reject even very late
    replays. On hitting the configured count limit, stop; do not remove hashes.
    """
    def __init__(self, root: Path):
        self.root = Path(root) / "p2-batch-receipts"
        self.root.mkdir(parents=True, exist_ok=True)
        if self.root.is_symlink():
            raise P4Denied("BATCH_RECEIPT_PATH_UNSAFE")
        self._lock = threading.RLock()
        # Refuse P2 work if any historical record is corrupt or a symlink.
        # Do not delete a questionable record, as that could enable replay.
        records = list(self.root.glob("batch-*.json"))
        if len(records) > MAX_RECORDS:
            raise P4Denied("BATCH_RECEIPT_LIMIT")
        for entry in records:
            if entry.is_symlink() or not entry.is_file():
                raise P4Denied("BATCH_RECEIPT_CORRUPT")
            suffix = entry.name[len("batch-"):-len(".json")]
            if len(suffix) != 64 or any(x not in "0123456789abcdef" for x in suffix):
                raise P4Denied("BATCH_RECEIPT_CORRUPT")
            try:
                raw = entry.read_bytes()
                if len(raw) > 65536:
                    raise ValueError("oversized")
                record = json.loads(raw)
                if (not isinstance(record,dict) or record.get("request_hash") != suffix or
                        record.get("integrity") != _digest({k:v for k,v in record.items() if k!="integrity"})):
                    raise ValueError("invalid")
            except (OSError, UnicodeError, ValueError):
                raise P4Denied("BATCH_RECEIPT_CORRUPT") from None

    def _path(self, rid: str) -> Path:
        return self.root / ("batch-" + hashlib.sha256(rid.encode("ascii")).hexdigest() + ".json")

    @staticmethod
    def _signed(record):
        core = {k: v for k, v in record.items() if k != "integrity"}
        return {**core, "integrity": _digest(core)}

    def get(self, rid: str):
        rid = check_request_id(rid)
        path = self._path(rid)
        with self._lock:
            if not path.exists() and not path.is_symlink():
                return None
            if path.is_symlink():
                raise P4Denied("BATCH_RECEIPT_CORRUPT")
            try:
                if path.stat().st_size > 65536:
                    raise ValueError("oversized")
                data = json.loads(path.read_text("utf-8"))
                if (not isinstance(data, dict) or data.get("integrity") !=
                        _digest({k: v for k, v in data.items() if k != "integrity"}) or
                        data.get("request_hash") != hashlib.sha256(rid.encode("ascii")).hexdigest()):
                    raise ValueError("invalid")
                return data
            except (OSError, ValueError, UnicodeError):
                raise P4Denied("BATCH_RECEIPT_CORRUPT") from None

    def reserve(self, rid: str, record: dict):
        rid = check_request_id(rid)
        with self._lock:
            if len(list(self.root.glob("batch-*.json"))) >= MAX_RECORDS:
                raise P4Denied("BATCH_RECEIPT_LIMIT")
            signed = self._signed({**record, "request_hash": hashlib.sha256(rid.encode("ascii")).hexdigest()})
            payload = _canonical(signed).encode("utf-8")
            path = self._path(rid)
            flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
            if hasattr(os, "O_NOFOLLOW"):
                flags |= os.O_NOFOLLOW
            try:
                fd = os.open(path, flags, 0o600)
            except FileExistsError:
                raise P4Denied("REPLAY_DENIED") from None
            except OSError:
                raise P4Denied("BATCH_RECEIPT_SAVE_FAILED") from None
            try:
                with os.fdopen(fd, "wb") as out:
                    out.write(payload)
                    out.flush()
                    os.fsync(out.fileno())
            except OSError:
                # Never remove a partially created record: unknown state means
                # the same request ID must be rejected until manual review.
                raise P4Denied("BATCH_RECEIPT_SAVE_FAILED") from None
            return signed

    def update(self, rid: str, **changes):
        rid = check_request_id(rid)
        with self._lock:
            previous = self.get(rid)
            if previous is None:
                raise P4Denied("BATCH_RECEIPT_MISSING")
            record = self._signed({**previous, **changes, "updated_at": int(time.time())})
            payload = _canonical(record).encode("utf-8")
            path = self._path(rid)
            temp = self.root / ("." + secrets.token_hex(16) + ".tmp")
            try:
                with temp.open("xb") as out:
                    out.write(payload)
                    out.flush()
                    os.fsync(out.fileno())
                os.replace(temp, path)
            except OSError:
                raise P4Denied("BATCH_RECEIPT_SAVE_FAILED") from None
            finally:
                if temp.exists():
                    temp.unlink()
            return record


class P2BatchWriter:
    """One-process wrapper around existing P4SafeWriter, not a new remote gate.

    The Windows agent/Edge must recheck identity and approval before exposing
    these methods. Merely instantiating this class does not permit remote writes.
    """
    def __init__(self, p4, *, clock=time.monotonic):
        self.p4 = p4
        self.clock = clock
        self._lock = p4._lock  # serialize P4 and P2 with a shared RLock
        self._previews: dict[str, dict] = {}
        self.session = uuid.uuid4().hex
        self.receipts = BatchReceiptStore(p4.backups)

    def invalidate_previews(self):
        with self._lock:
            self._previews.clear()
            # GridCraft transient doc IDs can be recycled across restarts.
            # Invalidate prior session's live receipt reconciliation too.
            self.session = uuid.uuid4().hex

    def _preimage(self, doc, ops):
        out = []
        for op in ops:
            self.p4._authorized(doc)
            before = self.p4._preimage(doc, op["sheet"], op["range"])
            _check_data_shape(before, op["values"])
            out.append(before)
        return out

    def prepare(self, doc: str, operations: list[dict]):
        doc = valid_doc(doc)
        if not isinstance(operations, list) or not 1 <= len(operations) <= MAX_OPERATIONS:
            raise P4Denied("BATCH_OPERATION_LIMIT")
        if len(_canonical(operations).encode("utf-8")) > MAX_BATCH_BYTES:
            raise P4Denied("BATCH_PAYLOAD_LIMIT")
        plans, areas, cells = [], [], 0
        for op in operations:
            if not isinstance(op, dict) or set(op) != {"sheet", "range", "values"}:
                raise P4Denied("BATCH_ARGS_DENIED")
            sheet = valid_sheet(op["sheet"])
            region = op["range"]
            rect = bounded_region(region)
            for other_sheet, other_rect in areas:
                if sheet == other_sheet and _rect_overlaps(rect, other_rect):
                    raise P4Denied("BATCH_OVERLAP_DENIED")
            areas.append((sheet, rect))
            values = clean_values(region, op["values"])
            cells += sum(len(x) for x in values)
            if cells > MAX_BATCH_CELLS:
                raise P4Denied("BATCH_CELL_LIMIT")
            plans.append({"sheet": sheet, "range": region, "values": values})
        with self._lock:
            self.p4._authorized(doc)
            before = self._preimage(doc, plans)
            version = _digest({"doc": doc, "ranges": [
                {"sheet": op["sheet"], "range": op["range"],
                 "before": fingerprint(doc, op["sheet"], op["range"], v),
                 "after": fingerprint(doc, op["sheet"], op["range"], op["values"])}
                for op, v in zip(plans, before)]})
            preview = str(uuid.uuid4())
            self._previews.clear()  # One current batch per writer session
            self._previews[preview] = {"doc": doc, "ops": plans, "before": before,
                                       "version": version, "expires": self.clock()+TTL_SECONDS}
            return {"ok": True, "preview_id": preview,
                    "expected_version": version, "doc": doc,
                    "ranges": [{"sheet": op["sheet"], "range": op["range"]} for op in plans],
                    "total_cells": cells,
                    "changed_cells": sum(a != b for old, op in zip(before, plans)
                                         for row_a, row_b in zip(old, op["values"])
                                         for a, b in zip(row_a, row_b)),
                    "expires_in_seconds": TTL_SECONDS,
                    "values_redacted": True,
                    "requires_owner_confirmation": True,
                    "requires_local_write_enable": True}

    def _record(self, plan, backup):
        doc = plan["doc"]
        ranges = []
        for op, before in zip(plan["ops"], plan["before"]):
            ranges.append({"sheet": op["sheet"], "range": op["range"],
                           "before_hash": fingerprint(doc, op["sheet"], op["range"], before),
                           "after_hash": fingerprint(doc, op["sheet"], op["range"], op["values"])})
        return {"version": 1, "doc": doc, "session": self.session,
                "preview_id": plan["preview"], "ranges": ranges,
                "backup_id": backup["backup_id"], "backup_sha256": backup["backup_sha256"],
                "state": "RESERVED", "attempted": 0, "updated_at": int(time.time())}

    def commit(self, preview_id: str, expected_version: str, request_id: str,
               *, write_enabled: bool, owner_confirmed: bool):
        request_id = check_request_id(request_id)
        if write_enabled is not True or owner_confirmed is not True:
            raise P4Denied("OWNER_CONFIRMATION_REQUIRED")
        if not isinstance(preview_id, str) or len(preview_id) != 36:
            raise P4Denied("INVALID_PREVIEW")
        with self._lock:
            # Reject any pre-existing batch ID, even after agent restart.
            if self.receipts.get(request_id) is not None:
                raise P4Denied("REPLAY_DENIED")
            plan = self._previews.pop(preview_id, None)
            if not plan:
                raise P4Denied("PREVIEW_NOT_FOUND")
            if self.clock() > plan["expires"]:
                raise P4Denied("PREVIEW_EXPIRED")
            if expected_version != plan["version"]:
                raise P4Denied("VERSION_MISMATCH")
            doc, ops = plan["doc"], plan["ops"]
            self.p4._authorized(doc)
            if self._preimage(doc, ops) != plan["before"]:
                raise P4Denied("VERSION_CONFLICT")
            backup = self.p4._save_backup(doc)  # exactly one snapshot before mutation
            if self._preimage(doc, ops) != plan["before"]:
                raise P4Denied("VERSION_CONFLICT_AFTER_SNAPSHOT")
            plan["preview"] = preview_id
            self.receipts.reserve(request_id, self._record(plan, backup))
            try:
                # Reuse P4 global replay index to prevent cross-path ID reuse.
                self.p4.receipts.reserve(request_id, preview_id, backup["backup_sha256"])
            except Exception:
                self.receipts.update(request_id, state="ABORTED_NO_WRITE")
                raise
            for i, (op, original) in enumerate(zip(ops, plan["before"])):
                try:
                    self.p4._authorized(doc)
                    actual = self.p4._preimage(doc, op["sheet"], op["range"])
                    if actual != original:
                        self.receipts.update(request_id, state="PARTIAL_CONFLICT", attempted=i)
                        return {"ok": False, "error": "VERSION_CONFLICT_DURING_BATCH",
                                "request_id": request_id, "attempted": i,
                                "backup_id": backup["backup_id"]}
                    # Persist 'about to attempt' BEFORE sending the command.
                    self.receipts.update(request_id, state="ATTEMPTING", attempted=i+1)
                    self.p4.local.write_range(doc, op["sheet"], op["range"], op["values"], parse=False)
                    observed = self.p4._preimage(doc, op["sheet"], op["range"])
                    if observed != op["values"]:
                        self.receipts.update(request_id, state="OUTCOME_UNKNOWN", attempted=i+1)
                        return {"ok": False, "error": "VERIFY_MISMATCH",
                                "request_id": request_id, "attempted": i+1,
                                "backup_id": backup["backup_id"]}
                    self.receipts.update(request_id, state="PROGRESS", attempted=i+1)
                except Exception:
                    # A write may have happened before the exception; never retry.
                    try:
                        self.receipts.update(request_id, state="OUTCOME_UNKNOWN", attempted=i+1)
                    except Exception:
                        pass  # fail-closed receipt may remain ATTEMPTING
                    return {"ok": False, "error": "WRITE_OUTCOME_UNKNOWN",
                            "request_id": request_id, "attempted": i+1,
                            "backup_id": backup["backup_id"]}
            try:
                self.receipts.update(request_id, state="VERIFIED_NOT_SAVED", attempted=len(ops))
            except Exception:
                return {"ok": False, "error": "RECEIPT_PERSIST_UNKNOWN",
                        "request_id": request_id, "backup_id": backup["backup_id"]}
            return {"ok": True, "status": "VERIFIED_NOT_SAVED",
                    "request_id": request_id, "ranges_written": len(ops),
                    "verified_cells": sum(sum(len(x) for x in op["values"]) for op in ops),
                    "backup_id": backup["backup_id"], "backup_sha256": backup["backup_sha256"]}

    def status(self, request_id: str, *, reconcile: bool = False):
        rid = check_request_id(request_id)
        with self._lock:
            r = self.receipts.get(rid)
            if r is None:
                return {"ok": False, "error": "RECEIPT_NOT_FOUND"}
            result = {"ok": True, "state": r["state"], "request_id": rid,
                      "attempted": r["attempted"], "total_ranges": len(r["ranges"]),
                      "backup_id": r["backup_id"], "values_redacted": True}
            if not reconcile:
                return result
            # A transient doc UID may be reused in a different agent session;
            # prevent false reconciliation after restart/reconnect.
            if r["session"] != self.session:
                return {**result, "reconciliation": "SESSION_CHANGED_NOT_VERIFIED"}
            try:
                self.p4._authorized(r["doc"])
                states = []
                for op in r["ranges"]:
                    actual = self.p4._preimage(r["doc"], op["sheet"], op["range"])
                    digest = fingerprint(r["doc"], op["sheet"], op["range"], actual)
                    states.append("AFTER" if digest == op["after_hash"] else
                                  "BEFORE" if digest == op["before_hash"] else "OTHER")
            except Exception:
                return {**result, "reconciliation": "READBACK_UNAVAILABLE"}
            if all(x == "AFTER" for x in states):
                code = "CURRENT_VALUES_MATCH_TARGET"
            elif all(x == "BEFORE" for x in states):
                code = "NO_CHANGE_OBSERVED"
            elif "OTHER" in states:
                code = "CONFLICT_OR_PARTIAL"
            else:
                code = "PARTIAL_APPLIED"
            # Status is observational; never replays any write or claims saved.
            return {**result, "reconciliation": code,
                    "verified_ranges": sum(x == "AFTER" for x in states),
                    "total_ranges": len(states)}
