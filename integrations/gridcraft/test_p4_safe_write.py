"""Isolated P4 tests: synthetic workbook only, no user's PC/files/cloud."""
from __future__ import annotations

import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest import mock
import uuid
import zipfile

from gridcraft_p4_safe_write import (
    P4Denied, P4SafeWriter, P4ReceiptStore, bounded_region,
    clean_values, valid_doc
)

def make_xlsx():
    out=io.BytesIO()
    with zipfile.ZipFile(out,"w") as z:
        z.writestr("[Content_Types].xml",'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
        z.writestr("xl/workbook.xml","<workbook/>")
    return out.getvalue()

class FakeDesktop:
    def __init__(self):
        self.values=[[None,None],[None,None]]
        self.window=True
        self.read_count=0
        self.write_count=0
        self.snapshot_count=0
        self.snapshot=make_xlsx()
        self.write_raises=False
        self.read_raises=False

    def windows(self):
        return [{"doc":"1","title":"synthetic-book"}] if self.window else []

    def read_range(self,sheet,region,doc=None,formulas=False):
        if self.read_raises:
            raise OSError("simulated offline")
        self.read_count+=1
        assert sheet=="Sheet1" and region=="A1:B2" and doc=="1" and formulas is True
        return {"values":[row[:] for row in self.values]}

    def snapshot_bytes(self,doc):
        self.snapshot_count+=1
        return self.snapshot

    def write_range(self,doc,sheet,region,values,parse=False):
        self.write_count+=1
        assert doc=="1" and sheet=="Sheet1" and region=="A1:B2" and parse is False
        if self.write_raises:
            raise RuntimeError("simulated uncertain failure")
        self.values=[row[:] for row in values]
        return {"written":4}

NEW=[["立之P4測試",42],[False,None]]
def new_request():return str(uuid.uuid4())

class P4GuardTests(unittest.TestCase):
    def setUp(self):
        self.d=TemporaryDirectory()
        self.addCleanup(self.d.cleanup)
        self.local=FakeDesktop()
        self.time=100
        self.writer=P4SafeWriter(self.local,Path(self.d.name)/"p4",
                                  approved_docs={"1"},clock=lambda:self.time)
    def preview(self,values=None):
        return self.writer.prepare("1","Sheet1","A1:B2",NEW if values is None else values)
    def commit(self,p,**opts):
        return self.writer.commit(p["preview_id"],p["expected_version"],
                                  opts.pop("request_id",new_request()),
                                  write_enabled=opts.pop("write_enabled",True),
                                  owner_confirmed=opts.pop("owner_confirmed",True))

    def test_valid_preview_does_not_modify_gridcraft(self):
        p=self.preview()
        self.assertEqual(p["before"],[[None,None],[None,None]])
        self.assertEqual(p["after"],NEW)
        self.assertEqual(p["expires_in_seconds"],90)
        self.assertEqual(self.local.write_count,0)
        self.assertEqual(self.local.snapshot_count,0)

    def test_commit_creates_verifiable_xlsx_backup_before_one_write(self):
        p=self.preview()
        done=self.commit(p)
        self.assertTrue(done["ok"])
        self.assertEqual(done["status"],"WRITTEN_NOT_SAVED")
        self.assertEqual(self.local.values,NEW)
        self.assertEqual(self.local.write_count,1)
        self.assertEqual(self.local.snapshot_count,1)
        file=Path(self.d.name)/"p4"/done["backup_id"]
        self.assertTrue(file.exists())
        self.assertEqual(file.read_bytes(),self.local.snapshot)  # compare the exact pre-write fixture bytes
        self.assertNotIn("立之",str(file))

    def test_no_local_toggle_no_commit(self):
        p=self.preview()
        with self.assertRaisesRegex(P4Denied,"OWNER_CONFIRMATION_REQUIRED"):
            self.commit(p,write_enabled=False)
        self.assertEqual(self.local.write_count,0)

    def test_no_chat_confirmation_no_commit(self):
        p=self.preview()
        with self.assertRaisesRegex(P4Denied,"OWNER_CONFIRMATION_REQUIRED"):
            self.commit(p,owner_confirmed=False)
        self.assertEqual(self.local.snapshot_count,0)

    def test_preimage_changed_between_preview_and_commit_refused(self):
        p=self.preview()
        self.local.values[0][0]="Changed manually"
        with self.assertRaisesRegex(P4Denied,"VERSION_CONFLICT"):
            self.commit(p)
        self.assertEqual(self.local.write_count,0)
        self.assertEqual(self.local.snapshot_count,0)

    def test_fake_expected_version_refused(self):
        p=self.preview()
        with self.assertRaisesRegex(P4Denied,"VERSION_MISMATCH"):
            self.writer.commit(p["preview_id"],"a"*64,new_request(),True,True)
        self.assertEqual(self.local.write_count,0)

    def test_invalid_preview_refused(self):
        with self.assertRaisesRegex(P4Denied,"INVALID_PREVIEW"):
            self.writer.commit("not-a-uuid","a"*64,new_request(),True,True)

    def test_preview_expiry_90s(self):
        p=self.preview()
        self.time=192
        with self.assertRaisesRegex(P4Denied,"PREVIEW_EXPIRED"):
            self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_preview_single_use(self):
        p=self.preview()
        self.commit(p)
        with self.assertRaisesRegex(P4Denied,"PREVIEW_NOT_FOUND|REPLAY_DENIED"):
            self.commit(p)

    def test_request_id_durable_replay_prevented_after_restart(self):
        p=self.preview()
        rid=new_request()
        self.commit(p,request_id=rid)
        self.writer=P4SafeWriter(self.local,Path(self.d.name)/"p4",approved_docs={"1"},clock=lambda:self.time)
        next_preview=self.preview([["Next",7],[False,None]])
        with self.assertRaisesRegex(P4Denied,"REPLAY_DENIED"):
            self.commit(next_preview,request_id=rid)
        self.assertEqual(self.local.write_count,1)

    def test_invalid_values_formula_command_or_payload_rejected(self):
        for values in [
            [["=SUM(1,2)",42],[False,None]],
            [["=HYPERLINK(\"https://evil.invalid\")",42],[False,None]],
            [["x"*1001,42],[False,None]],
            [["valid",float("nan")],[False,None]],
            [["valid",2**60],[False,None]],
            [["x"],[1,2]],
            [["x",{},], [False,None]],
        ]:
            with self.subTest(values=str(values)[:40]):
                with self.assertRaises(P4Denied):
                    self.preview(values)
        self.assertEqual(self.local.read_count,0)

    def test_other_doc_blocked_even_if_local_has_it(self):
        with self.assertRaisesRegex(P4Denied,"WORKBOOK_NOT_GRANTED"):
            self.writer.prepare("2","Sheet1","A1:B2",NEW)
        self.assertEqual(self.local.write_count,0)

    def test_doc_closed_after_preview_blocks_write(self):
        p=self.preview()
        self.local.window=False
        with self.assertRaisesRegex(P4Denied,"WORKBOOK_CLOSED"):
            self.commit(p)
        self.assertEqual(self.local.snapshot_count,0)

    def test_snapshot_invalid_blocks_write(self):
        p=self.preview()
        self.local.snapshot=b"not a real xlsx"
        with self.assertRaisesRegex(P4Denied,"SNAPSHOT_INVALID"):
            self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_snapshot_exceeds_cap_blocks_write(self):
        p=self.preview()
        self.local.snapshot=b"PK\x03\x04"+b"x"*(8*1024*1024)
        with self.assertRaisesRegex(P4Denied,"SNAPSHOT_LIMIT"):
            self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_unknown_write_result_never_retried(self):
        p=self.preview()
        self.local.write_raises=True
        rid=new_request()
        done=self.commit(p,request_id=rid)
        self.assertFalse(done["ok"])
        self.assertEqual(done["error"],"WRITE_OUTCOME_UNKNOWN")
        p2=self.preview()
        with self.assertRaisesRegex(P4Denied,"REPLAY_DENIED"):
            self.commit(p2,request_id=rid)
        self.assertEqual(self.local.write_count,1)

    def test_ledger_fail_closed_if_corrupt(self):
        self.writer.receipts.path.parent.mkdir(parents=True,exist_ok=True)
        self.writer.receipts.path.write_text("not json\n",encoding="utf-8")
        with self.assertRaisesRegex(P4Denied,"RECEIPT_CORRUPT_QUARANTINED"):
            P4ReceiptStore(self.writer.backups)
        self.assertTrue((self.writer.backups/"p4-write-receipts.needs-review").exists())
        self.assertEqual(len(list(self.writer.backups.glob("p4-write-receipts.corrupt-*.jsonl"))),1)

    def test_4_cells_max_50_and_exact_dimension(self):
        self.assertEqual(bounded_region("A1:B2"),(1,1,2,2))
        with self.assertRaisesRegex(P4Denied,"RANGE_LIMIT"):
            clean_values("A1:Z100",[[1]])
        with self.assertRaisesRegex(P4Denied,"VALUE_SHAPE"):
            clean_values("A1:B2",[[1]])
        with self.assertRaises(P4Denied):
            valid_doc("../../../secret")

    def test_readback_mismatch_reports_error_no_auto_save(self):
        class WrongReadback(FakeDesktop):
            def write_range(self,*a,**k):
                self.write_count+=1
                # Simulate GridCraft silently ignoring a range; don't call file.save.
                return {"written":0}
        self.local=WrongReadback()
        self.writer=P4SafeWriter(self.local,Path(self.d.name)/"p4",
                                  approved_docs={"1"},clock=lambda:self.time)
        result=self.commit(self.preview())
        self.assertEqual(result["error"],"VERIFY_MISMATCH")
        self.assertTrue(result["backup_id"].endswith(".xlsx"))

    def test_change_during_full_backup_blocks_command(self):
        class UserEditedDuringBackup(FakeDesktop):
            def snapshot_bytes(self,doc):
                self.values[0][0]="edited by user during export"
                return super().snapshot_bytes(doc)
        self.local=UserEditedDuringBackup()
        self.writer=P4SafeWriter(self.local,Path(self.d.name)/"p4",
                                 approved_docs={"1"},clock=lambda:self.time)
        p=self.preview()
        with self.assertRaisesRegex(P4Denied,"VERSION_CONFLICT_AFTER_SNAPSHOT"):
            self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_local_snapshot_storage_quota_halts_write_without_deleting_backups(self):
        p=self.preview()
        with mock.patch("gridcraft_p4_safe_write.MAX_BACKUP_FOLDER",1):
            with self.assertRaisesRegex(P4Denied,"BACKUP_STORAGE_LIMIT"):
                self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_no_automatic_save_of_original(self):
        p=self.preview()
        self.commit(p)
        self.assertFalse(hasattr(self.local,"save_workbook"))


if __name__=="__main__":
    unittest.main(verbosity=2)
