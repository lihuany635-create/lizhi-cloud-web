#!/usr/bin/env python3
"""P2 candidate: synthetic-only local snapshot store, NOT a cloud storage backend.

No user workbook may be stored here as a production service. This is a
transactional, process-restartable contract intended for P2/P3 tests. Replace
local SQLite with approved private cloud storage before real deployment.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import tempfile
from uuid import uuid4
import zipfile

MAX_XLSX = 2_000_000
MAX_UNCOMPRESSED = 20_000_000
MAX_ENTRIES = 1500
REQ_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{5,95}$")
CELL_RE = re.compile(r"^[A-Z]{1,3}[1-9][0-9]{0,5}$")


class StoreError(RuntimeError):
    pass


class Unauthorized(StoreError):
    pass


class Conflict(StoreError):
    pass


def validate_xlsx(blob: bytes) -> str:
    if not isinstance(blob, bytes) or len(blob) > MAX_XLSX or len(blob) < 100:
        raise StoreError("invalid or oversized XLSX")
    if not zipfile.is_zipfile(io.BytesIO(blob)):
        raise StoreError("not an XLSX ZIP")
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        entries = z.infolist()
        if len(entries) > MAX_ENTRIES or sum(e.file_size for e in entries) > MAX_UNCOMPRESSED:
            raise StoreError("XLSX archive exceeds expansion limits")
        names = {e.filename for e in entries}
        if "[Content_Types].xml" not in names or "xl/workbook.xml" not in names:
            raise StoreError("required XLSX parts missing")
        if any(e.filename.startswith("/") or ".." in e.filename.split("/") for e in entries):
            raise StoreError("unsafe XLSX entry")
    return hashlib.sha256(blob).hexdigest()


class LocalSyntheticStore:
    """Durable across *local process* restarts; NOT durable across cloud runner termination.

    owner is a verified server-side principal supplied ONLY by a future P3
    gateway, never from user-controlled MCP input. This class is test-only.
    """

    def __init__(self, path: str | Path):
        if os.getenv("GRIDCRAFT_P2_SYNTHETIC_ONLY") != "1":
            raise StoreError("LocalSyntheticStore is disabled outside synthetic tests")
        self.path = str(path)
        self._setup()

    def _db(self):
        c = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        c.execute("PRAGMA foreign_keys=ON")
        c.execute("PRAGMA busy_timeout=10000")
        return c

    def _setup(self):
        with self._db() as c:
            c.executescript("""
                CREATE TABLE IF NOT EXISTS workbooks(
                    id TEXT PRIMARY KEY, owner TEXT NOT NULL, current_version INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS snapshots(
                    workbook_id TEXT NOT NULL, version INTEGER NOT NULL,
                    sha256 TEXT NOT NULL, content BLOB NOT NULL,
                    PRIMARY KEY (workbook_id, version),
                    FOREIGN KEY (workbook_id) REFERENCES workbooks(id)
                );
                CREATE TABLE IF NOT EXISTS requests(
                    workbook_id TEXT NOT NULL, request_id TEXT NOT NULL,
                    base_version INTEGER NOT NULL, sha256 TEXT NOT NULL,
                    resulting_version INTEGER NOT NULL,
                    PRIMARY KEY (workbook_id, request_id),
                    FOREIGN KEY (workbook_id) REFERENCES workbooks(id)
                );
            """)

    def create(self, owner: str, blob: bytes):
        if not isinstance(owner, str) or not owner.strip():
            raise Unauthorized("verified owner required")
        digest = validate_xlsx(blob)
        wid = str(uuid4())
        with self._db() as c:
            c.execute("BEGIN IMMEDIATE")
            c.execute("INSERT INTO workbooks VALUES(?,?,?)", (wid, owner, 1))
            c.execute("INSERT INTO snapshots VALUES(?,?,?,?)", (wid, 1, digest, blob))
            c.commit()
        return {"workbook_id": wid, "version": 1, "sha256": digest}

    def _owner_version(self, c, owner: str, wid: str):
        row = c.execute("SELECT owner,current_version FROM workbooks WHERE id=?", (wid,)).fetchone()
        if row is None or row[0] != owner:
            raise Unauthorized("workbook not accessible")
        return row[1]

    def read(self, owner: str, wid: str, version: int | None = None):
        with self._db() as c:
            current = self._owner_version(c, owner, wid)
            v = current if version is None else version
            row = c.execute("SELECT sha256,content FROM snapshots WHERE workbook_id=? AND version=?", (wid, v)).fetchone()
            if row is None:
                raise StoreError("unknown version")
            if hashlib.sha256(row[1]).hexdigest() != row[0]:
                raise StoreError("snapshot corruption detected")
            return {"version": v, "sha256": row[0], "content": row[1], "current_version": current}

    def save(self, owner: str, wid: str, expected_version: int, request_id: str, blob: bytes):
        digest = validate_xlsx(blob)
        if not isinstance(request_id, str) or not REQ_RE.fullmatch(request_id):
            raise StoreError("invalid request id")
        with self._db() as c:
            c.execute("BEGIN IMMEDIATE")
            current = self._owner_version(c, owner, wid)
            prior = c.execute("SELECT base_version,sha256,resulting_version FROM requests WHERE workbook_id=? AND request_id=?", (wid, request_id)).fetchone()
            if prior:
                if prior[:2] != (expected_version, digest):
                    raise Conflict("reused request id with different payload")
                c.commit()
                return {"version": prior[2], "sha256": digest, "replayed": True}
            if expected_version != current:
                raise Conflict("stale workbook version")
            nxt = current + 1
            c.execute("INSERT INTO snapshots VALUES(?,?,?,?)", (wid, nxt, digest, blob))
            c.execute("UPDATE workbooks SET current_version=? WHERE id=? AND current_version=?", (nxt, wid, current))
            c.execute("INSERT INTO requests VALUES(?,?,?,?,?)", (wid, request_id, expected_version, digest, nxt))
            c.commit()
            return {"version": nxt, "sha256": digest, "replayed": False}

    def restore(self, owner: str, wid: str, expected_version: int, restore_version: int, request_id: str):
        original = self.read(owner, wid, restore_version)
        return self.save(owner, wid, expected_version, request_id, original["content"])


def run_synthetic_gridcraft_edit(cli: str, store: LocalSyntheticStore, owner: str,
                                 workbook_id: str, expected_version: int,
                                 request_id: str, cell: str, value: str):
    """Only for in-repo synthetic fixtures. No shell, web, or arbitrary file path."""
    if not CELL_RE.fullmatch(cell) or not isinstance(value, str) or len(value) > 128:
        raise StoreError("invalid or excessive cell edit")
    if value.startswith(("=", "+", "-", "@")) and not value.isdecimal():
        raise StoreError("formulas not enabled for this P2 storage test")
    current = store.read(owner, workbook_id)
    if current["version"] != expected_version:
        raise Conflict("stale workbook version")
    with tempfile.TemporaryDirectory(prefix="gridcraft-p2-synthetic-") as tmp:
        before, after = Path(tmp) / "input.xlsx", Path(tmp) / "output.xlsx"
        before.write_bytes(current["content"])
        command = json.dumps({"cell": cell, "input": value}, ensure_ascii=False, separators=(",", ":"))
        p = subprocess.run([cli, "run", "--in", str(before), "--cmd", "cell.set="+command, "--out", str(after)],
                           capture_output=True, text=True, timeout=30, check=False)
        if p.returncode or not after.exists():
            raise StoreError("GridCraft CLI synthetic edit failed")
        output = after.read_bytes()
    return store.save(owner, workbook_id, expected_version, request_id, output)
