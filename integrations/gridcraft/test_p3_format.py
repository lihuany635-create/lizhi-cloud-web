"""P3 isolated format and safety tests; entirely synthetic data; no PC/device/Edge.

In the full GitHub source these run with the REAL P1, P2 and P4 imports.
A local-only stdlib shim permits testing the candidate module in isolation.
"""
from __future__ import annotations
import copy
import hashlib
import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
import threading
import types
import unittest
from unittest import mock
import uuid

try:
    import gridcraft_p4_safe_write as p4real
    from gridcraft_p2_batch import BatchReceiptStore
    import gridcraft_xlsx_fidelity
    HAVE_REAL=True
except ImportError:
    HAVE_REAL=False
    a=types.ModuleType('gridcraft_p4_safe_write')
    class P4Denied(RuntimeError):pass
    def valid_doc(v):
        if not isinstance(v,str) or not v.isdigit() or int(v)<1 or int(v)>2**64-1:raise P4Denied('INVALID_DOC')
        return v
    def valid_sheet(v):
        if not isinstance(v,str) or not v or len(v)>80:raise P4Denied('INVALID_SHEET')
        return v
    def bounded_region(s):
        import re
        m=re.fullmatch(r'([A-Z]{1,3})(\d+):([A-Z]{1,3})(\d+)',s)
        if not m:raise P4Denied('INVALID_RANGE')
        def col(v):
            n=0
            for ch in v:n=n*26+ord(ch)-64
            return n
        out=(int(m[2]),col(m[1]),int(m[4]),col(m[3]))
        if out[2]<out[0] or out[3]<out[1] or (out[2]-out[0]+1)*(out[3]-out[1]+1)>50:
            raise P4Denied('RANGE_LIMIT')
        return out
    def check_request_id(v):
        try:
            t=str(uuid.UUID(v))
            if t!=v.lower():raise ValueError('bad')
        except (ValueError,TypeError,AttributeError):raise P4Denied('INVALID_REQUEST_ID')
        return t
    for name,value in {'P4Denied':P4Denied,'valid_doc':valid_doc,'valid_sheet':valid_sheet,
                       'bounded_region':bounded_region,'check_request_id':check_request_id,'TTL_SECONDS':90}.items():
        setattr(a,name,value)
    sys.modules[a.__name__]=a
    b=types.ModuleType('gridcraft_p2_batch')
    class BatchReceiptStore:
        def __init__(self,root):
            self.root=Path(root)/'p2-batch-receipts';self.root.mkdir(parents=True,exist_ok=True)
        def _path(self,rid):return self.root/('batch-'+hashlib.sha256(rid.encode()).hexdigest()+'.json')
        def get(self,rid):
            p=self._path(rid)
            if not p.exists():return None
            try:return json.loads(p.read_text())
            except (OSError,ValueError):raise P4Denied('BATCH_RECEIPT_CORRUPT') from None
        def reserve(self,rid,record):
            p=self._path(rid)
            if p.exists():raise P4Denied('REPLAY_DENIED')
            p.write_text(json.dumps(record))
        def update(self,rid,**changes):
            v=self.get(rid)
            if v is None:raise P4Denied('RECEIPT_MISSING')
            v.update(changes);self._path(rid).write_text(json.dumps(v))
    b.BatchReceiptStore=BatchReceiptStore;sys.modules[b.__name__]=b
    c=types.ModuleType('gridcraft_xlsx_fidelity')
    class WorkbookInvalid(ValueError):pass
    c.WorkbookInvalid=WorkbookInvalid;c.inventory_bytes=lambda a,path=None:None
    sys.modules[c.__name__]=c
    import gridcraft_p4_safe_write as p4real

import gridcraft_p3_format as p3
from gridcraft_p3_format import P3FormatWriter, compile_format
P4Denied=p4real.P4Denied


def uid():return str(uuid.uuid4())


class FakeInventory:
    def __init__(self,fields):
        self.fields=copy.deepcopy(fields)
        self.stats={'sheets':[{'sheet_id':'1','name':'Sheet1'}]}
        self.warnings=[]


class FakeDesktop:
    def __init__(self):
        self.fields={'sheet:1:cell:A1:value':('raw','1'), 'sheet:1:cell:A1:type':'n',
                     'sheet:1:cell:A1:style':('original',),
                     'sheet:1:cell:B1:value':('no_value',None),
                     'sheet:1:cell:B1:type':'n',
                     'sheet:1:merges':(), 'sheet:1:columns':(),
                     'sheet:1:pageSetup':(), 'sheet:1:pageMargins':(),
                     'workbook:defined_names':()}
        self.write_count=0
        self.snapshot_count=0
        self.online=True
        self.fail_after=False
        self.fail_before=False
        self.ignore=False
        self.mutate_content=False
        self.snapshot_hook=None
    def windows(self):
        return [{'doc':'1'}] if self.online else []
    def snapshot_bytes(self,doc):
        self.snapshot_count+=1
        if self.snapshot_hook:self.snapshot_hook()
        return b'PK\x03\x04dummy'
    def format_command(self,doc,cmd,params):
        self.write_count+=1
        if self.fail_before:raise TimeoutError('synthetic timeout before write')
        if not self.ignore:
            if cmd=='home.mergeCells':self.fields['sheet:1:merges']=(params['range'],)
            elif cmd=='home.unmergeCells':self.fields['sheet:1:merges']=()
            elif cmd=='home.rowHeight':self.fields['sheet:1:row:1']=(('ht',params['points']),)
            elif cmd=='home.columnWidth':self.fields['sheet:1:columns']=((params['cols'],params['chars']),)
            elif cmd=='pageLayout.pageSetup':self.fields['sheet:1:pageSetup']=(tuple(sorted(params.items())),)
            else:self.fields['sheet:1:cell:A1:style']=(cmd,tuple(sorted((k,str(v)) for k,v in params.items())))
        if self.mutate_content:self.fields['sheet:1:cell:A1:value']=('raw','corrupted')
        if self.fail_after:raise TimeoutError('synthetic timeout after effect')
        return {'ok':True}


class FakeGlobalReceipts:
    def __init__(self):self.seen=set()
    def reserve(self,rid,pid,sha):
        if rid in self.seen:raise P4Denied('REPLAY_DENIED')
        self.seen.add(rid)


class FakeP4:
    def __init__(self,local,root):
        self.local=local;self.backups=Path(root);self.backups.mkdir(parents=True,exist_ok=True)
        self.approved_docs={'1'}
        self._lock=threading.RLock();self.receipts=FakeGlobalReceipts()
    def _authorized(self,doc):
        if doc not in self.approved_docs:raise P4Denied('WORKBOOK_NOT_GRANTED')
        if doc not in {x['doc'] for x in self.local.windows()}:raise P4Denied('WORKBOOK_CLOSED')
    def _save_backup(self,doc):
        self.local.snapshot_bytes(doc)
        return {'backup_id':'p4-1-'+uuid.uuid4().hex+'.xlsx','backup_sha256':'a'*64}


class FormatTests(unittest.TestCase):
    def setUp(self):
        self.tmp=TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.desktop=FakeDesktop();self.p4=FakeP4(self.desktop,self.tmp.name)
        self.now=123
        self.writer=P3FormatWriter(self.p4,clock=lambda:self.now)
        self.snap_patch=mock.patch.object(p3,'_inv',lambda local,doc:FakeInventory(local.fields))
        self.snap_patch.start();self.addCleanup(self.snap_patch.stop)
        self.bold={'kind':'style','sheet':'Sheet1','range':'A1:B1','field':'bold','value':True}
        self.merge={'kind':'merge','sheet':'Sheet1','range':'A1:B1','action':'merge'}
    def preview(self,op=None):return self.writer.prepare('1',op or self.bold)
    def commit(self,p,rid=None,**kw):
        return self.writer.commit(p['preview_id'],p['expected_version'],rid or uid(),
             write_enabled=kw.get('write_enabled',True),owner_confirmed=kw.get('owner_confirmed',True))
    def test_style_exact_compiler(self):
        c=compile_format(self.bold)
        self.assertEqual(c['command'],'home.bold');self.assertEqual(c['params']['on'],True)
    def test_color_font_size_wrap_and_number_format(self):
        for field,v,cmd in [('fontColor','#ABCDEF','home.fontColor'),('fillColor','none','home.fillColor'),
                            ('fontSize',11.5,'home.fontSize'),('wrapText',False,'home.wrapText'),
                            ('numberFormat','0.00','home.numberFormat'),('verticalAlign','middle','home.alignMiddle')]:
            with self.subTest(field=field):
                spec={**self.bold,'field':field,'value':v}
                self.assertEqual(compile_format(spec)['command'],cmd)
    def test_row_col_and_page_compiler(self):
        self.assertEqual(compile_format({'kind':'rowHeight','sheet':'Sheet1','rows':'1:4','points':15})['command'],'home.rowHeight')
        self.assertEqual(compile_format({'kind':'columnWidth','sheet':'Sheet1','cols':'A:B','chars':8.43})['command'],'home.columnWidth')
        for field,v in [('orientation','landscape'),('paper','A4'),('printArea','A1:G292'),('centerH',True)]:
            self.assertEqual(compile_format({'kind':'pageSetup','sheet':'Sheet1','field':field,'value':v})['command'],'pageLayout.pageSetup')
    def test_disallowed_fields_return_unsupported(self):
        for field in ('horizontalAlign','images','shapes','sheetProtection'):
            self.assertEqual(self.writer.prepare('1',{**self.bold,'field':field})['status'],'UNSUPPORTED')
        self.assertEqual(self.desktop.snapshot_count,0)
    def test_arbitrary_command_and_extra_args_denied(self):
        with self.assertRaisesRegex(P4Denied,'FORMAT_ARGS_DENIED'):
            compile_format({**self.bold,'command':'file.delete'})
        with self.assertRaises(P4Denied):compile_format({**self.bold,'value':'=HYPERLINK("evil")'})
    def test_empty_preview_no_write_no_backup(self):
        p=self.preview();self.assertEqual(p['operation']['value'],True)
        self.assertTrue(p['privacy']);self.assertEqual(self.desktop.write_count,0)
    def test_style_write_backs_up_and_readback(self):
        p=self.preview();r=self.commit(p)
        self.assertTrue(r['ok']);self.assertEqual(r['status'],'EFFECT_OBSERVED_NOT_SAVED')
        self.assertEqual(self.desktop.write_count,1)
        self.assertGreaterEqual(self.desktop.snapshot_count,1)
        self.assertEqual(self.writer.status(r['request_id'],reconcile=True)['reconciliation'],'CURRENT_SNAPSHOT_MATCHES_OBSERVED')
    def test_version_conflict_refused(self):
        p=self.preview();self.desktop.fields['sheet:1:cell:A1:value']=('raw','edited')
        with self.assertRaisesRegex(P4Denied,'VERSION_CONFLICT'):self.commit(p)
        self.assertEqual(self.desktop.write_count,0)
    def test_change_during_backup_refused(self):
        p=self.preview();self.desktop.snapshot_hook=lambda:self.desktop.fields.__setitem__('sheet:1:cell:A1:value',('raw','edited'))
        with self.assertRaisesRegex(P4Denied,'VERSION_CONFLICT_AFTER_SNAPSHOT'):self.commit(p)
        self.assertEqual(self.desktop.write_count,0)
    def test_owner_and_local_gate_both_required(self):
        p=self.preview()
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):self.commit(p,owner_confirmed=False)
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):self.commit(p,write_enabled=False)
        self.assertEqual(self.desktop.write_count,0)
    def test_revocation_after_preview(self):
        p=self.preview();self.p4.approved_docs.clear()
        with self.assertRaisesRegex(P4Denied,'WORKBOOK_NOT_GRANTED'):self.commit(p)
        self.assertEqual(self.desktop.write_count,0)
    def test_offline_after_preview(self):
        p=self.preview();self.desktop.online=False
        with self.assertRaisesRegex(P4Denied,'WORKBOOK_CLOSED'):self.commit(p)
    def test_expire_preview(self):
        p=self.preview();self.now+=91
        with self.assertRaisesRegex(P4Denied,'PREVIEW_EXPIRED'):self.commit(p)
    def test_single_use_preview(self):
        p=self.preview();self.commit(p)
        with self.assertRaisesRegex(P4Denied,'PREVIEW_NOT_FOUND'):self.commit(p)
    def test_replay_denied(self):
        p=self.preview();rid=uid();self.commit(p,rid)
        with self.assertRaisesRegex(P4Denied,'REPLAY_DENIED'):self.commit(self.preview(),rid)
        self.assertEqual(self.desktop.write_count,1)
    def test_merge_nonempty_following_cell_rejected(self):
        self.desktop.fields['sheet:1:cell:B1:value']=('raw','important')
        with self.assertRaisesRegex(P4Denied,'MERGE_WOULD_ERASE_DATA'):self.preview(self.merge)
        self.assertEqual(self.desktop.write_count,0)
    def test_merge_and_unmerge(self):
        r=self.commit(self.preview(self.merge));self.assertTrue(r['ok'])
        r=self.commit(self.preview({**self.merge,'action':'unmerge'}));self.assertTrue(r['ok'])
        self.assertEqual(self.desktop.write_count,2)
    def test_merge_overlaps_other_merge_denied(self):
        self.desktop.fields['sheet:1:merges']=('A1:C3',)
        with self.assertRaisesRegex(P4Denied,'MERGE_OVERLAP_DENIED'):self.preview(self.merge)
    def test_timeout_after_effect_no_retry_and_status(self):
        self.desktop.fail_after=True
        p=self.preview();rid=uid();r=self.commit(p,rid)
        self.assertFalse(r['ok']);self.assertEqual(r['status'],'OUTCOME_UNKNOWN')
        self.assertEqual(self.desktop.write_count,1)
        self.assertEqual(self.writer.status(rid,reconcile=True)['reconciliation'],'DIFFERENT_OR_PARTIAL')
        with self.assertRaisesRegex(P4Denied,'REPLAY_DENIED'):self.commit(self.preview(),rid)
        self.assertEqual(self.desktop.write_count,1)
    def test_noop_fails_effect_claim(self):
        self.desktop.ignore=True
        r=self.commit(self.preview());self.assertFalse(r['ok']);self.assertEqual(r['reason'],'NO_VERIFIABLE_EFFECT')
    def test_content_mutation_fails(self):
        self.desktop.mutate_content=True
        r=self.commit(self.preview());self.assertEqual(r['reason'],'CELL_CONTENT_CHANGED')
    def test_new_style_only_empty_cell_does_not_change_content(self):
        a=FakeInventory({'sheet:1:cell:A1:value':('raw','1'),'sheet:1:cell:A1:type':'n'})
        b=FakeInventory({**a.fields,'sheet:1:cell:B1:value':('no_value',None),'sheet:1:cell:B1:type':'n','sheet:1:cell:B1:style':('new',)})
        self.assertEqual(p3._content_fields(a),p3._content_fields(b))
    def test_row_geometry_effect(self):
        p=self.preview({'kind':'rowHeight','sheet':'Sheet1','rows':'1:2','points':20})
        self.assertTrue(self.commit(p)['ok'])
    def test_col_geometry_effect(self):
        p=self.preview({'kind':'columnWidth','sheet':'Sheet1','cols':'A:C','chars':9})
        self.assertTrue(self.commit(p)['ok'])
    def test_page_setup_effect(self):
        p=self.preview({'kind':'pageSetup','sheet':'Sheet1','field':'orientation','value':'landscape'})
        self.assertTrue(self.commit(p)['ok'])
    def test_large_print_area_allowed(self):
        r=self.preview({'kind':'pageSetup','sheet':'Sheet1','field':'printArea','value':'A1:G292'})
        self.assertTrue(r['ok'])
    def test_oversized_print_area_denied(self):
        with self.assertRaises(P4Denied):compile_format({'kind':'pageSetup','sheet':'Sheet1','field':'printArea','value':'A1:XFD1048576'})
    def test_corrupt_replay_receipt_refused(self):
        rid=uid();self.commit(self.preview(),rid)
        f=self.writer.receipts._path(rid);f.write_text('garbled',encoding='utf-8')
        with self.assertRaises(P4Denied):self.writer.status(rid)
    def test_session_restart_not_reconciled(self):
        rid=uid();self.commit(self.preview(),rid)
        restarted=P3FormatWriter(self.p4,clock=lambda:self.now)
        self.assertEqual(restarted.status(rid,reconcile=True)['reconciliation'],'SESSION_CHANGED_NOT_VERIFIED')
    def test_no_unknown_direct_command(self):
        for bad in ({**self.bold,'field':'macro.run'}, {**self.bold,'kind':'delete'},
                    {**self.bold,'field':'borders','value':{'preset':'eraseAll'}},
                    {**self.bold,'field':'fontSize','value':999}):
            with self.subTest(case=bad):
                with self.assertRaises(P4Denied):compile_format(bad)
    def test_no_disk_save_method(self):
        self.assertFalse(hasattr(self.desktop,'save_workbook'))

if __name__=='__main__':unittest.main(verbosity=2)
