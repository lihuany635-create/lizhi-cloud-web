"""P5 isolated 320-row OOXML + safe export + P2 limits + denial/restore.

Synthetic data ONLY. Never contains any user workbook, credentials or paths.
"""
from __future__ import annotations

import io
import hashlib
from pathlib import Path
import tempfile
import unittest
import uuid
import zipfile
from xml.etree import ElementTree as ET

from gridcraft_xlsx_fidelity import inventory_bytes, compare
from gridcraft_p4_safe_write import P4SafeWriter, P4Denied, bounded_region
from gridcraft_p4_safe_save import P4SafeSaveWriter
from gridcraft_p2_batch import P2BatchWriter
from test_xlsx_fidelity import synthetic_parts, zipped, S, Q


def large_fixture(rows=320):
    """A1:F321, 320 formula cells, styled headers, a merge, page layout."""
    assert 300 <= rows <= 400
    parts = synthetic_parts()
    root = ET.Element(Q("worksheet"))
    ET.SubElement(root, Q("dimension"), {"ref": f"A1:F{rows+1}"})
    cols = ET.SubElement(root, Q("cols"))
    ET.SubElement(cols, Q("col"), {"min":"1", "max":"1", "width":"18", "customWidth":"1"})
    data = ET.SubElement(root, Q("sheetData"))
    head = ET.SubElement(data, Q("row"), {"r":"1", "ht":"26", "customHeight":"1"})
    for col,text in [("A","Sequence"),("B","Base"),("C","Calc"),("D","Notes"),("E","Merged")]:
        cell = ET.SubElement(head, Q("c"), {"r":f"{col}1","t":"inlineStr","s":"1"})
        ET.SubElement(ET.SubElement(cell,Q("is")),Q("t")).text=text
    for i in range(2,rows+2):
        row = ET.SubElement(data,Q("row"),{"r":str(i)})
        for col,value in (("A",i-1),("B",(i-1)*7)):
            cell=ET.SubElement(row,Q("c"),{"r":f"{col}{i}","t":"n"})
            ET.SubElement(cell,Q("v")).text=str(value)
        cell=ET.SubElement(row,Q("c"),{"r":f"C{i}","s":"1"})
        ET.SubElement(cell,Q("f")).text=f"A{i}+B{i}"
        ET.SubElement(cell,Q("v")).text=str((i-1)*8)
        cell=ET.SubElement(row,Q("c"),{"r":f"D{i}","t":"inlineStr"})
        ET.SubElement(ET.SubElement(cell,Q("is")),Q("t")).text=f"Synthetic {i-1}"
    merges=ET.SubElement(root,Q("mergeCells"),{"count":"1"})
    ET.SubElement(merges,Q("mergeCell"),{"ref":"E1:F1"})
    ET.SubElement(root,Q("pageMargins"),{"left":"0.7","right":"0.7","top":"0.75","bottom":"0.75"})
    ET.SubElement(root,Q("pageSetup"),{"orientation":"landscape","paperSize":"9"})
    parts["xl/worksheets/custom.xml"]=ET.tostring(root,encoding="utf-8",xml_declaration=True)
    return zipped(parts)


class SyntheticDesktop:
    def __init__(self, blob):
        self.blob=blob
        self.online=True
        self.cells={}
        self.writes=0
        self.fail_after_write=False
    def windows(self):
        return [{"doc":"1","title":"P5_Synthetic.xlsx"}] if self.online else []
    def snapshot_bytes(self,doc):
        if not self.online: raise OSError("offline")
        return self.blob
    def read_range(self,sheet,region,doc=None,formulas=False):
        if not self.online: raise OSError("offline")
        r0,c0,r1,c1=bounded_region(region)
        return {"values":[[self.cells.get((sheet,r,c)) for c in range(c0,c1+1)]
                          for r in range(r0,r1+1)]}
    def write_range(self,doc,sheet,region,values,parse=False):
        if not self.online: raise OSError("offline")
        self.writes+=1
        r0,c0,r1,c1=bounded_region(region)
        for r,row in enumerate(values,r0):
            for c,v in enumerate(row,c0):self.cells[(sheet,r,c)]=v
        if self.fail_after_write: raise TimeoutError("ambiguous after write")
        return {"written":sum(map(len,values))}


class P5Tests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        self.root=Path(temp.name)
        self.source=large_fixture()
        self.local=SyntheticDesktop(self.source)
        self.p4=P4SafeWriter(self.local,self.root/"P4Backups",{"1"})
        self.saver=P4SafeSaveWriter(self.p4)

    def test_320_rows_and_320_formulas(self):
        inv=inventory_bytes(self.source)
        self.assertEqual(inv.warnings,[])
        self.assertGreaterEqual(inv.stats["formula_nodes"],320)
        self.assertTrue(any("A321:" in k for k in inv.fields),"last row absent")
        self.assertTrue(any("merge" in k.lower() and "E1:F1" in str(v) for k,v in inv.fields.items()))
        self.assertEqual(compare(inv,inventory_bytes(self.source))["status"],"MATCH")

    def test_320_row_mutation_detected_without_styling_loss(self):
        original=inventory_bytes(self.source)
        with zipfile.ZipFile(io.BytesIO(self.source)) as z:
            parts={name:z.read(name) for name in z.namelist()}
        root=ET.fromstring(parts["xl/worksheets/custom.xml"])
        cell=root.find(f'.//{Q("c")}[@r="B321"]')
        self.assertIsNotNone(cell)
        cell.find(Q("v")).text="999999"
        parts["xl/worksheets/custom.xml"]=ET.tostring(root,encoding="utf-8")
        newer=inventory_bytes(zipped(parts))
        diff=compare(original,newer)
        self.assertEqual(diff["status"],"DIFFERENT")
        self.assertIn("cell_value",diff["categories"])
        self.assertNotIn("cell_formula",diff["categories"])
        self.assertNotIn("merge",diff["categories"])

    def test_copy_backup_restore_and_disk_reopen_320_rows(self):
        name="P5-320-Synthetic.xlsx"
        p=self.saver.prepare("1",name)
        rid=str(uuid.uuid4())
        r=self.saver.commit(p["preview_id"],p["expected_version"],rid,
                            write_enabled=True,owner_confirmed=True)
        self.assertEqual(r["status"],"DISK_REOPEN_VERIFIED_COPY_ONLY")
        self.assertFalse(r["source_document_saved"])
        self.assertEqual(self.saver.status(rid,verify_disk=True)["disk_verification"],"MATCH")
        exported=(self.saver.root/name).read_bytes()
        backup=(self.p4.backups/r["backup_id"]).read_bytes()
        restored=self.root/"P5_Restored_Test_Copy.xlsx"
        restored.write_bytes(backup)
        self.assertEqual(hashlib.sha256(exported).digest(),hashlib.sha256(backup).digest())
        self.assertEqual(compare(inventory_bytes(self.source),inventory_bytes(restored.read_bytes()))["status"],"MATCH")
        self.assertEqual(self.local.blob,self.source)

    def test_owner_gate_rejects_without_writing(self):
        p=self.saver.prepare("1","denied.xlsx")
        with self.assertRaisesRegex(P4Denied,"OWNER_CONFIRMATION_REQUIRED"):
            self.saver.commit(p["preview_id"],p["expected_version"],str(uuid.uuid4()),
                              write_enabled=False,owner_confirmed=True)
        self.assertEqual(list(self.saver.root.glob("*.xlsx")),[])

    def test_revocation_after_prepare(self):
        p=self.saver.prepare("1","revoked.xlsx")
        self.p4.approved_docs.clear()
        with self.assertRaisesRegex(P4Denied,"WORKBOOK_NOT_GRANTED"):
            self.saver.commit(p["preview_id"],p["expected_version"],str(uuid.uuid4()),
                              write_enabled=True,owner_confirmed=True)
        self.assertEqual(list(self.saver.root.glob("*.xlsx")),[])

    def test_offline_after_prepare(self):
        p=self.saver.prepare("1","offline.xlsx")
        self.local.online=False
        with self.assertRaisesRegex(P4Denied,"WORKBOOK_CLOSED"):
            self.saver.commit(p["preview_id"],p["expected_version"],str(uuid.uuid4()),
                              write_enabled=True,owner_confirmed=True)

    def test_replay_rejected_after_copy(self):
        p=self.saver.prepare("1","copy.xlsx")
        request_id=str(uuid.uuid4())
        self.saver.commit(p["preview_id"],p["expected_version"],request_id,
                          write_enabled=True,owner_confirmed=True)
        with self.assertRaisesRegex(P4Denied,"REPLAY_DENIED"):
            self.saver.commit(p["preview_id"],p["expected_version"],request_id,
                              write_enabled=True,owner_confirmed=True)
        self.assertEqual(len(list(self.saver.root.glob("*.xlsx"))),1)

    def test_path_escape_refused(self):
        for name in ["../steal.xlsx","C:\\test.xlsx","\\\\host\\share\\file.xlsx","CON.xlsx"]:
            with self.subTest(name=name),self.assertRaises(P4Denied):
                self.saver.prepare("1",name)

    def test_p2_limit_200_cells_per_batch(self):
        batch=P2BatchWriter(self.p4)
        ranges=[f"A{2+i*6}:H{6+i*6}" for i in range(5)]
        ops=[{"sheet":"Demo","range":r,"values":[[i]*8 for _ in range(5)]} for i,r in enumerate(ranges)]
        p=batch.prepare("1",ops)
        self.assertEqual(p["total_cells"],200)
        with self.assertRaisesRegex(P4Denied,"BATCH_CELL_LIMIT"):
            batch.prepare("1",ops+[{"sheet":"Demo","range":"J1","values":[[1]]}])

    def test_p2_ambiguous_write_never_auto_retries(self):
        self.local.fail_after_write=True
        batch=P2BatchWriter(self.p4)
        ops=[{"sheet":"Demo","range":"A2:B2","values":[[40,50]]}]
        p=batch.prepare("1",ops)
        rid=str(uuid.uuid4())
        r=batch.commit(p["preview_id"],p["expected_version"],rid,write_enabled=True,owner_confirmed=True)
        self.assertFalse(r["ok"])
        self.assertEqual(r["error"],"WRITE_OUTCOME_UNKNOWN")
        self.assertEqual(self.local.writes,1)
        with self.assertRaisesRegex(P4Denied,"REPLAY_DENIED"):
            batch.commit(p["preview_id"],p["expected_version"],rid,write_enabled=True,owner_confirmed=True)
        self.assertEqual(self.local.writes,1)


if __name__=="__main__":unittest.main(verbosity=2)
