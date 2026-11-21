#!/usr/bin/env python3
"""P2 bounded SQLite snapshot/CAS tests; synthetic data, no cloud deployment."""
import base64
import hashlib
import os
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from p2_synthetic_store import (
    Conflict, LocalSyntheticStore, StoreError, Unauthorized,
    run_synthetic_gridcraft_edit,
)
from p1_fidelity_probe import load_sheet_info

FIXTURE = Path(__file__).parent / "fixtures" / "engineering_estimate.xlsx.b64"
EXPECTED_SHA = "372da585170c730613e5c83cf78cf027a5815403a3d979eff57a6587fc3fec7f"
os.environ["GRIDCRAFT_P2_SYNTHETIC_ONLY"] = "1"


class P2StateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="p2-store-test-")
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)/"snapshots.sqlite"
        self.original = base64.b64decode(FIXTURE.read_text().strip(),validate=True)
        self.assertEqual(hashlib.sha256(self.original).hexdigest(), EXPECTED_SHA)
        self.store = LocalSyntheticStore(self.path)
        self.book = self.store.create("verified-owner-A", self.original)
        self.wid = self.book["workbook_id"]

    def test_version_and_restart(self):
        first = self.store.read("verified-owner-A", self.wid)
        self.assertEqual(first["content"], self.original)
        after_restart = LocalSyntheticStore(self.path)
        self.assertEqual(after_restart.read("verified-owner-A",self.wid)["sha256"],EXPECTED_SHA)
        result = after_restart.save("verified-owner-A",self.wid,1,"request-save-0001",self.original)
        self.assertEqual(result["version"],2)
        self.assertEqual(self.store.read("verified-owner-A", self.wid)["version"],2)
        self.assertEqual(self.store.read("verified-owner-A", self.wid,1)["content"],self.original)
        self.assertTrue(after_restart.save("verified-owner-A",self.wid,1,"request-save-0001",self.original)["replayed"])
        self.assertEqual(after_restart.read("verified-owner-A",self.wid)["current_version"],2)

    def test_owner_version_idempotency(self):
        for action in (
            lambda:self.store.read("verified-owner-B",self.wid),
            lambda:self.store.save("verified-owner-B",self.wid,1,"request-save-0002",self.original),
            lambda:self.store.restore("verified-owner-B",self.wid,1,1,"request-save-0003"),
        ):
            with self.assertRaises(Unauthorized):
                action()
        with self.assertRaises(Conflict):
            self.store.save("verified-owner-A",self.wid,0,"request-save-0004",self.original)
        self.store.save("verified-owner-A",self.wid,1,"request-save-0005",self.original)
        with self.assertRaises(Conflict):
            self.store.save("verified-owner-A",self.wid,1,"request-save-0005",self.original+b"changed")
        with self.assertRaises(Conflict):
            self.store.save("verified-owner-A",self.wid,1,"request-save-0006",self.original)

    def test_corruption_and_bad_input(self):
        with self.assertRaises(StoreError):
            self.store.create("verified-owner-A",b"hello")
        with sqlite3.connect(self.path) as c:
            c.execute("UPDATE snapshots SET sha256='bad' WHERE workbook_id=? AND version=1",(self.wid,))
        with self.assertRaisesRegex(StoreError,"corruption"):
            self.store.read("verified-owner-A",self.wid)

    def test_restore_is_new_snapshot(self):
        self.store.save("verified-owner-A", self.wid,1,"request-save-0007",self.original)
        ret=self.store.restore("verified-owner-A",self.wid,2,1,"request-restore-0008")
        self.assertEqual(ret["version"],3)
        self.assertEqual(self.store.read("verified-owner-A",self.wid,1)["sha256"],EXPECTED_SHA)
        self.assertEqual(self.store.read("verified-owner-A",self.wid)["sha256"],EXPECTED_SHA)

    def test_concurrent_same_version(self):
        barrier=threading.Barrier(2)
        results=[]
        def one(req):
            barrier.wait()
            try:
                results.append(self.store.save("verified-owner-A",self.wid,1,req,self.original)["version"])
            except Conflict:
                results.append("CONFLICT")
        a=threading.Thread(target=one,args=("request-thread-0009",))
        b=threading.Thread(target=one,args=("request-thread-0010",))
        a.start();b.start();a.join(timeout=5);b.join(timeout=5)
        self.assertCountEqual(results,[2,"CONFLICT"])

    def test_real_cloud_runner_gridcraft_cli(self):
        cli=os.getenv("GRIDCRAFT_CLI")
        if not cli:
            self.skipTest("official CLI unavailable outside CI; NOT_TESTED locally")
        saved=run_synthetic_gridcraft_edit(cli,self.store,"verified-owner-A",self.wid,
                                           1,"request-gridcraft-0011","B3","2500")
        self.assertEqual(saved["version"],2)
        self.assertNotEqual(saved["sha256"],EXPECTED_SHA)
        self.assertEqual(self.store.read("verified-owner-A",self.wid,1)["sha256"],EXPECTED_SHA)
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/"source.xlsx"; changed=Path(tmp)/"changed.xlsx"
            source.write_bytes(self.original)
            changed.write_bytes(self.store.read("verified-owner-A",self.wid)["content"])
            old=load_sheet_info(source)
            new=load_sheet_info(changed)
            self.assertEqual(old["sheets"],new["sheets"])
            self.assertEqual(new["data"]["估價清單"]["cells"]["B3"]["v"],"2500")
            self.assertEqual(new["data"]["估價清單"]["cells"]["D3"]["v"],"75000")
        restored=self.store.restore("verified-owner-A",self.wid,2,1,"request-gridcraft-restore-0012")
        self.assertEqual(restored["version"],3)
        self.assertEqual(self.store.read("verified-owner-A",self.wid)["sha256"],EXPECTED_SHA)


if __name__=="__main__":
    unittest.main(verbosity=2)
