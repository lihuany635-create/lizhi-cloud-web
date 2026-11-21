#!/usr/bin/env python3
"""P2 synthetic ONLY: two independent GitHub-hosted runners exchange a temporary artifact.

This is not permanent / private workbook storage and may not accept user Excel.
The artifact must have a short expiry and be synthetic (not confidential).
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import tempfile
from p2_synthetic_store import LocalSyntheticStore, Unauthorized, Conflict, run_synthetic_gridcraft_edit
from p1_fidelity_probe import load_sheet_info

SOURCE_HASH = "372da585170c730613e5c83cf78cf027a5815403a3d979eff57a6587fc3fec7f"
OWNER = "p2-synthetic-verified-owner"
OTHER_OWNER = "p2-synthetic-unrelated-owner"
REQUEST_1 = "p2-cross-runner-first-write"
REQUEST_2 = "p2-cross-runner-second-write"
REQUEST_3 = "p2-cross-runner-restore"


def validate_gridcraft_sheet(blob: bytes, expected_quantity: str, expected_total: str) -> None:
    with tempfile.TemporaryDirectory() as p:
        file = Path(p) / "check.xlsx"
        file.write_bytes(blob)
        sheets = load_sheet_info(file)
        assert sheets["sheets"] == ["估價清單", "說明"], sheets["sheets"]
        cells = sheets["data"]["估價清單"]["cells"]
        assert cells["B3"]["v"] == expected_quantity, cells["B3"]
        assert cells["D3"]["v"] == expected_total, cells["D3"]
        assert cells["D3"]["f"] == "B3*C3", cells["D3"]


def produce(args) -> None:
    os.environ["GRIDCRAFT_P2_SYNTHETIC_ONLY"] = "1"
    folder = Path(args.workdir)
    folder.mkdir(parents=True, exist_ok=True)
    raw = base64.b64decode(Path(args.fixture_b64).read_text().strip(), validate=True)
    assert hashlib.sha256(raw).hexdigest() == SOURCE_HASH, "synthetic fixture source SHA256 changed"
    store = LocalSyntheticStore(folder / "snapshots.sqlite")
    wb = store.create(OWNER, raw)
    assert wb["version"] == 1
    result = run_synthetic_gridcraft_edit(args.cli, store, OWNER, wb["workbook_id"], 1, REQUEST_1, "B3", "2500")
    assert result["version"] == 2
    validate_gridcraft_sheet(store.read(OWNER, wb["workbook_id"], 2)["content"], "2500", "75000")
    validate_gridcraft_sheet(store.read(OWNER, wb["workbook_id"], 1)["content"], "2300", "69000")
    manifest = {
        "schema": "gridcraft-p2-cross-runner-synthetic-v1",
        "workbook_id": wb["workbook_id"],
        "version_1_sha256": SOURCE_HASH,
        "version_2_sha256": result["sha256"],
        "versions": [1, 2],
        "synthetic_only": True
    }
    (folder / "manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2), encoding="utf-8")
    print("PASS: producer runner created synthetic original v1 and edited v2 with real GridCraft CLI")
    print("PASS: producer runner retained original SHA256, formula and version metadata")


def consume(args) -> None:
    os.environ["GRIDCRAFT_P2_SYNTHETIC_ONLY"] = "1"
    folder = Path(args.workdir)
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["schema"] == "gridcraft-p2-cross-runner-synthetic-v1"
    assert manifest["synthetic_only"] is True
    assert manifest["version_1_sha256"] == SOURCE_HASH
    wid = manifest["workbook_id"]
    # Runner 2 opens a new process / SQLite connection on files transferred from runner 1.
    store = LocalSyntheticStore(folder / "snapshots.sqlite")
    original = store.read(OWNER, wid, 1)
    edited = store.read(OWNER, wid, 2)
    assert edited["current_version"] == 2
    assert original["sha256"] == SOURCE_HASH
    assert edited["sha256"] == manifest["version_2_sha256"]
    validate_gridcraft_sheet(original["content"], "2300", "69000")
    validate_gridcraft_sheet(edited["content"], "2500", "75000")
    print("PASS: independent consumer runner recovered original v1 and edited v2 with verified hashes and formulas")
    try:
        store.read(OTHER_OWNER, wid)
        raise AssertionError("owner isolation FAILED")
    except Unauthorized:
        print("PASS: synthetic owner isolation on second runner")
    new = run_synthetic_gridcraft_edit(args.cli, store, OWNER, wid, 2, REQUEST_2, "B3", "2600")
    assert new["version"] == 3
    validate_gridcraft_sheet(store.read(OWNER, wid)["content"], "2600", "78000")
    assert store.read(OWNER, wid, 1)["sha256"] == SOURCE_HASH
    assert store.save(OWNER, wid, 2, REQUEST_2, store.read(OWNER, wid, 3)["content"])["replayed"] is True
    try:
        store.save(OWNER, wid, 2, "p2-cross-runner-stale-write", store.read(OWNER, wid, 3)["content"])
        raise AssertionError("stale write accepted")
    except Conflict:
        print("PASS: stale-version write rejected on second runner")
    restored = store.restore(OWNER, wid, 3, 1, REQUEST_3)
    assert restored["version"] == 4
    assert store.read(OWNER, wid)["sha256"] == SOURCE_HASH
    validate_gridcraft_sheet(store.read(OWNER, wid)["content"], "2300", "69000")
    print("PASS: consumer runner performed GridCraft v3 edit, idempotent retry, conflict denial, v4 restore")
    print("PASS: P2 cross-runner synthetic handoff proven; artifact is temporary, NOT private permanent cloud storage")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("mode", choices=["produce", "consume"])
    p.add_argument("--workdir", required=True)
    p.add_argument("--cli", required=True)
    p.add_argument("--fixture-b64", default=str(Path(__file__).parent / "fixtures" / "engineering_estimate.xlsx.b64"))
    args = p.parse_args()
    if args.mode == "produce":
        produce(args)
    else:
        consume(args)


if __name__ == "__main__":
    main()
