"""Isolated P2 candidate tests. Only synthetic in-memory spreadsheets are used."""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
import uuid
import zipfile
import threading

# In the final GitHub branch the real P4 module is present. On a standalone
# workspace, install a tiny validation shim so the P2 module is still testable.
try:
    from gridcraft_p4_safe_write import (P4Denied, bounded_region, clean_values,
        valid_doc, valid_sheet, fingerprint, check_request_id, TTL_SECONDS,
        P4SafeWriter)
    HAVE_REAL_P4 = True
except ImportError:
    HAVE_REAL_P4 = False
    p4 = types.ModuleType("gridcraft_p4_safe_write")
    class P4Denied(RuntimeError): pass
    def valid_doc(value):
        if not isinstance(value,str) or not value.isdigit() or int(value) < 1:
            raise P4Denied("INVALID_DOC")
        return value
    def valid_sheet(value):
        if not isinstance(value,str) or not value or len(value)>80:
            raise P4Denied("INVALID_SHEET")
        return value
    def bounded_region(s):
        def parse(a):
            col,row='',''
            for c in a:
                if c.isalpha():col+=c
                else:row+=c
            if not col or not row or not row.isdigit():raise P4Denied('INVALID_RANGE')
            n=0
            for c in col:n=n*26+ord(c)-64
            return (int(row),n)
        parts=s.split(':')
        if len(parts)>2:raise P4Denied('INVALID_RANGE')
        a,b=parse(parts[0]);c,d=parse(parts[-1])
        if a>c or b>d or (c-a+1)*(d-b+1)>50:raise P4Denied('RANGE_LIMIT')
        return a,b,c,d
    def clean_values(region,values):
        a,b,c,d=bounded_region(region)
        if not isinstance(values,list) or len(values)!=c-a+1:raise P4Denied('VALUE_SHAPE')
        for row in values:
            if not isinstance(row,list) or len(row)!=d-b+1:raise P4Denied('VALUE_SHAPE')
            for v in row:
                if isinstance(v,str) and (v.startswith('=') or len(v)>1000):raise P4Denied('FORMULA_OR_VALUE_DENIED')
                if not (v is None or isinstance(v,(str,int,float,bool))):raise P4Denied('INVALID_CELL_VALUE')
        return [x[:] for x in values]
    def fingerprint(doc,sheet,region,values):
        return hashlib.sha256(json.dumps({'doc':doc,'sheet':sheet,'range':region,'before':values},sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    def check_request_id(rid):
        try: canonical=str(uuid.UUID(rid))
        except Exception:raise P4Denied('INVALID_REQUEST_ID')
        if rid.lower()!=canonical:raise P4Denied('INVALID_REQUEST_ID')
        return canonical
    TTL_SECONDS=90
    for n in ('P4Denied','bounded_region','clean_values','valid_doc','valid_sheet','fingerprint','check_request_id','TTL_SECONDS'):
        setattr(p4,n,globals()[n])
    sys.modules['gridcraft_p4_safe_write']=p4

from gridcraft_p2_batch import P2BatchWriter, BatchReceiptStore, MAX_OPERATIONS


def sample_xlsx():
    stream=io.BytesIO()
    with zipfile.ZipFile(stream,'w') as z:
        z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
        z.writestr('xl/workbook.xml','<workbook/>')
    return stream.getvalue()


class FakeDesktop:
    def __init__(self):
        self.data={('Sheet1','A1:B2'):[[None,None],[None,None]],
                   ('Sheet1','D1:E2'):[[None,None],[None,None]],
                   ('Other','A1:B2'):[[None,None],[None,None]]}
        self.is_open=True
        self.write_count=0
        self.snapshot_count=0
        self.write_mode='normal'
        self.on_snapshot=None
        self.after_write=None

    def windows(self):
        return [{'doc':'1','title':'synthetic'}] if self.is_open else []

    def read_range(self,sheet,region,doc=None,formulas=False):
        if not self.is_open:raise OSError('offline')
        return {'values':[x[:] for x in self.data[(sheet,region)]]}

    def snapshot_bytes(self,doc):
        self.snapshot_count+=1
        if self.on_snapshot:self.on_snapshot()
        return sample_xlsx()

    def write_range(self,doc,sheet,region,values,parse=False):
        self.write_count+=1
        if self.write_mode=='fail_before':raise TimeoutError('synthetic timeout')
        if self.write_mode=='fail_after':
            self.data[(sheet,region)]=[x[:] for x in values]
            raise TimeoutError('timeout after actual change')
        if self.write_mode=='ignore':return {'written':0}
        self.data[(sheet,region)]=[x[:] for x in values]
        if self.after_write:self.after_write(self.write_count)
        return {'written':sum(len(x) for x in values)}


class FakeGlobalReceipt:
    def __init__(self):self.seen=set()
    def reserve(self,request_id,preview_id,backup_sha):
        if request_id in self.seen:raise P4Denied('REPLAY_DENIED')
        self.seen.add(request_id)


class FakeP4:
    def __init__(self,local,root):
        self.local=local
        self.backups=Path(root)
        self.backups.mkdir(parents=True,exist_ok=True)
        self.approved_docs={'1'}
        self._lock=threading.RLock()
        self.receipts=FakeGlobalReceipt()

    def _authorized(self,doc):
        valid_doc(doc)
        if doc not in self.approved_docs:raise P4Denied('WORKBOOK_NOT_GRANTED')
        if doc not in {x['doc'] for x in self.local.windows()}:raise P4Denied('WORKBOOK_CLOSED')

    def _preimage(self,doc,sheet,region):
        return self.local.read_range(sheet,region,doc=doc,formulas=True)['values']

    def _save_backup(self,doc):
        blob=self.local.snapshot_bytes(doc)
        name='p4-'+doc+'-'+uuid.uuid4().hex+'.xlsx'
        (self.backups/name).write_bytes(blob)
        return {'backup_id':name,'backup_sha256':hashlib.sha256(blob).hexdigest()}


def uid():return str(uuid.uuid4())


class BatchTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.local=FakeDesktop()
        self.p4=FakeP4(self.local,Path(self.tmp.name))
        self.now=100
        self.batch=P2BatchWriter(self.p4,clock=lambda:self.now)
        self.ops=[{'sheet':'Sheet1','range':'A1:B2','values':[['A',1],[2,None]]},
                  {'sheet':'Sheet1','range':'D1:E2','values':[['B',2],[3,None]]}]

    def prep(self,ops=None,doc='1'):
        return self.batch.prepare(doc,self.ops if ops is None else ops)

    def commit(self,p,request_id=None,**kw):
        return self.batch.commit(p['preview_id'],p['expected_version'],request_id or uid(),
                                 write_enabled=kw.get('write_enabled',True),owner_confirmed=kw.get('owner_confirmed',True))

    def test_preview_no_writes_or_backup(self):
        p=self.prep()
        self.assertEqual(p['total_cells'],8)
        self.assertEqual(p['changed_cells'],6)
        self.assertTrue(p['values_redacted'])
        self.assertNotIn('\"A\"',json.dumps(p))
        self.assertEqual((self.local.write_count,self.local.snapshot_count),(0,0))

    def test_single_backup_for_two_ranges_and_readback(self):
        rid=uid();r=self.commit(self.prep(),rid)
        self.assertTrue(r['ok']);self.assertEqual(r['status'],'VERIFIED_NOT_SAVED')
        self.assertEqual((self.local.snapshot_count,self.local.write_count),(1,2))
        self.assertEqual(len(list(self.p4.backups.glob('p4-*.xlsx'))),1)
        self.assertEqual(self.batch.status(rid)['state'],'VERIFIED_NOT_SAVED')
        self.assertEqual(self.batch.status(rid,reconcile=True)['reconciliation'],'CURRENT_VALUES_MATCH_TARGET')
        self.assertNotIn('\"A\"',json.dumps(self.batch.status(rid)))

    def test_owner_confirmation_required(self):
        p=self.prep()
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):self.commit(p,owner_confirmed=False)
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):self.commit(p,write_enabled=False)
        self.assertEqual(self.local.snapshot_count,0)

    def test_no_authorized_doc(self):
        with self.assertRaises(P4Denied):self.prep(doc='2')
        self.assertEqual(self.local.write_count,0)

    def test_closed_workbook_before_commit(self):
        p=self.prep();self.local.is_open=False
        with self.assertRaisesRegex(P4Denied,'WORKBOOK_CLOSED'):self.commit(p)
        self.assertEqual(self.local.snapshot_count,0)

    def test_version_conflict_before_backup(self):
        p=self.prep();self.local.data[('Sheet1','D1:E2')][0][0]='user edited'
        with self.assertRaisesRegex(P4Denied,'VERSION_CONFLICT'):self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_version_change_during_snapshot(self):
        p=self.prep();self.local.on_snapshot=lambda:self.local.data[('Sheet1','A1:B2')][0].__setitem__(0,'edited')
        with self.assertRaisesRegex(P4Denied,'VERSION_CONFLICT_AFTER_SNAPSHOT'):self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_version_conflict_after_one_range_stops(self):
        p=self.prep()
        def edit_second(count):
            if count==1:self.local.data[('Sheet1','D1:E2')][0][0]='user changed'
        self.local.after_write=edit_second
        rid=uid();r=self.commit(p,rid)
        self.assertFalse(r['ok']);self.assertEqual(r['error'],'VERSION_CONFLICT_DURING_BATCH')
        self.assertEqual((self.local.write_count,self.local.snapshot_count),(1,1))
        self.assertEqual(self.batch.status(rid)['state'],'PARTIAL_CONFLICT')
        self.assertEqual(self.batch.status(rid,reconcile=True)['reconciliation'],'CONFLICT_OR_PARTIAL')

    def test_timeout_after_write_reconciles_without_replay(self):
        p=self.prep();self.local.write_mode='fail_after';rid=uid()
        r=self.commit(p,rid)
        self.assertEqual(r['error'],'WRITE_OUTCOME_UNKNOWN')
        self.assertEqual(self.local.write_count,1)
        self.assertEqual(self.batch.status(rid,reconcile=True)['reconciliation'],'PARTIAL_APPLIED')
        with self.assertRaisesRegex(P4Denied,'REPLAY_DENIED'):self.commit(self.prep(),rid)
        self.assertEqual(self.local.write_count,1)

    def test_timeout_before_write_preserves_no_effect(self):
        self.local.write_mode='fail_before';rid=uid();r=self.commit(self.prep(),rid)
        self.assertEqual(r['error'],'WRITE_OUTCOME_UNKNOWN')
        self.assertEqual(self.batch.status(rid,reconcile=True)['reconciliation'],'NO_CHANGE_OBSERVED')
        self.assertEqual(self.local.write_count,1)

    def test_silent_noop_fails_readback(self):
        self.local.write_mode='ignore';rid=uid();r=self.commit(self.prep(),rid)
        self.assertEqual(r['error'],'VERIFY_MISMATCH')
        self.assertEqual(self.batch.status(rid)['state'],'OUTCOME_UNKNOWN')
        self.assertEqual(self.local.write_count,1)

    def test_expired_and_single_use(self):
        p=self.prep();self.now=191
        with self.assertRaisesRegex(P4Denied,'PREVIEW_EXPIRED'):self.commit(p)
        with self.assertRaisesRegex(P4Denied,'PREVIEW_NOT_FOUND'):self.commit(p)

    def test_wrong_version(self):
        p=self.prep()
        with self.assertRaisesRegex(P4Denied,'VERSION_MISMATCH'):
            self.batch.commit(p['preview_id'],'0'*64,uid(),write_enabled=True,owner_confirmed=True)

    def test_overlap_rejected(self):
        ops=self.ops+[{'sheet':'Sheet1','range':'B2:C2','values':[[1,2]]}]
        with self.assertRaisesRegex(P4Denied,'BATCH_OVERLAP_DENIED'):self.prep(ops)

    def test_other_sheet_same_range_allowed(self):
        ops=[self.ops[0],{'sheet':'Other','range':'A1:B2','values':[[5,6],[7,8]]}]
        self.assertEqual(self.prep(ops)['total_cells'],8)

    def test_too_many_operations(self):
        with self.assertRaisesRegex(P4Denied,'BATCH_OPERATION_LIMIT'):self.prep([self.ops[0]]*(MAX_OPERATIONS+1))

    def test_50_cell_single_range_hard_limit_preserved(self):
        with self.assertRaises(P4Denied):self.prep([{'sheet':'Sheet1','range':'A1:Z10','values':[[1]*26]*10}])

    def test_formula_injection_rejected(self):
        ops=[{'sheet':'Sheet1','range':'A1:B2','values':[['=HYPERLINK("https://bad")',1],[2,3]]}]
        with self.assertRaisesRegex(P4Denied,'FORMULA_OR_VALUE_DENIED'):self.prep(ops)
        self.assertEqual(self.local.write_count,0)

    def test_invalid_operation_shape(self):
        with self.assertRaisesRegex(P4Denied,'BATCH_ARGS_DENIED'):self.prep([{'sheet':'Sheet1','range':'A1:B2','values':[[1,2],[3,4]],'cmd':'save'}])

    def test_corrupt_receipt_fail_closed(self):
        rid=uid();self.commit(self.prep(),rid)
        path=self.batch.receipts._path(rid);path.write_text('{"evil":true}')
        with self.assertRaisesRegex(P4Denied,'BATCH_RECEIPT_CORRUPT'):self.batch.status(rid)
        with self.assertRaisesRegex(P4Denied,'BATCH_RECEIPT_CORRUPT'):self.commit(self.prep(),rid)

    def test_ledger_no_values(self):
        rid=uid();self.commit(self.prep(),rid)
        raw=self.batch.receipts._path(rid).read_text()
        self.assertNotIn('"A"',raw);self.assertNotIn('"B"',raw)
        self.assertNotIn(rid,raw)
        self.assertIn('backup_sha256',raw)

    def test_restart_does_not_reconcile_reused_doc_id(self):
        rid=uid();self.commit(self.prep(),rid)
        resumed=P2BatchWriter(self.p4,clock=lambda:100)
        self.assertEqual(resumed.status(rid,reconcile=True)['reconciliation'],'SESSION_CHANGED_NOT_VERIFIED')
        with self.assertRaisesRegex(P4Denied,'REPLAY_DENIED'):resumed.commit(resumed.prepare('1',self.ops)['preview_id'],'x'*64,rid,write_enabled=True,owner_confirmed=True)

    def test_unknown_request(self):
        self.assertEqual(self.batch.status(uid()),{'ok':False,'error':'RECEIPT_NOT_FOUND'})

    def test_invalid_request_id(self):
        with self.assertRaisesRegex(P4Denied,'INVALID_REQUEST_ID'):self.batch.status('../foo')

    def test_revoke_before_commit(self):
        p=self.prep();self.p4.approved_docs.clear()
        with self.assertRaisesRegex(P4Denied,'WORKBOOK_NOT_GRANTED'):self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_invalid_after_write_never_auto_save(self):
        self.commit(self.prep())
        self.assertFalse(hasattr(self.local,'save_workbook'))

    def test_invalid_before_snapshot_no_mutation(self):
        p=self.prep()
        self.p4._save_backup=lambda doc:(_ for _ in ()).throw(P4Denied('SNAPSHOT_INVALID'))
        with self.assertRaisesRegex(P4Denied,'SNAPSHOT_INVALID'):self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_global_receipt_failure_stops(self):
        p=self.prep()
        self.p4.receipts.reserve=lambda *x:(_ for _ in ()).throw(P4Denied('RECEIPT_SAVE_FAILED'))
        with self.assertRaisesRegex(P4Denied,'RECEIPT_SAVE_FAILED'):self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_status_readback_offline(self):
        rid=uid();self.commit(self.prep(),rid)
        self.local.is_open=False
        self.assertEqual(self.batch.status(rid,reconcile=True)['reconciliation'],'READBACK_UNAVAILABLE')

    def test_invalid_doc_precision(self):
        with self.assertRaises(P4Denied):self.prep(doc='18446744073709551616')

    def test_fails_closed_on_ledger_limit(self):
        import gridcraft_p2_batch as mod
        p=self.prep()
        from unittest.mock import patch
        with patch.object(mod,'MAX_RECORDS',0):
            with self.assertRaisesRegex(P4Denied,'BATCH_RECEIPT_LIMIT'):self.commit(p)
        self.assertEqual(self.local.write_count,0)

    def test_invalidate_disables_old_receipt_live_reconciliation(self):
        rid=uid();self.commit(self.prep(),rid)
        self.batch.invalidate_previews()
        self.assertEqual(self.batch.status(rid,reconcile=True)['reconciliation'],'SESSION_CHANGED_NOT_VERIFIED')

    def test_corrupt_receipt_on_restart_blocks_new_p2(self):
        rid=uid();self.commit(self.prep(),rid)
        self.batch.receipts._path(rid).write_text('broken',encoding='utf-8')
        with self.assertRaisesRegex(P4Denied,'BATCH_RECEIPT_CORRUPT'):
            P2BatchWriter(self.p4)

    def test_previews_cleared_on_invalidate(self):
        p=self.prep();self.batch.invalidate_previews()
        with self.assertRaisesRegex(P4Denied,'PREVIEW_NOT_FOUND'):self.commit(p)

    def test_batch_payload_limit(self):
        ops=[{'sheet':'Sheet1','range':'A1:B2','values':[['x'*950,'x'*950],['x'*950,'x'*950]]} for _ in range(8)]
        with self.assertRaises(P4Denied):self.prep(ops)

    def test_raw_uuid_not_in_receipt_name(self):
        rid=uid();self.commit(self.prep(),rid)
        self.assertNotIn(rid,self.batch.receipts._path(rid).name)

    @unittest.skipUnless(HAVE_REAL_P4,'Actual P4 dependency is available only in full GitHub source')
    def test_actual_p4_safe_writer_integration(self):
        local=FakeDesktop()
        real=P4SafeWriter(local,Path(self.tmp.name)/'real_p4',approved_docs={'1'},clock=lambda:100)
        batch=P2BatchWriter(real,clock=lambda:100)
        ops=self.ops
        p=batch.prepare('1',ops)
        r=batch.commit(p['preview_id'],p['expected_version'],uid(),write_enabled=True,owner_confirmed=True)
        self.assertTrue(r['ok'])
        self.assertEqual(local.snapshot_count,1)
        self.assertEqual(local.write_count,2)

if __name__=='__main__':
    unittest.main(verbosity=2)
