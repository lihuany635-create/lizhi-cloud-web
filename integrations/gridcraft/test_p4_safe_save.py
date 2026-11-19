"""P4 safe XLSX copy-export tests: synthetic data, no Windows process required."""
from __future__ import annotations
import os
import sys
from pathlib import Path
import tempfile
import threading
import types
import unittest
import uuid
from unittest import mock

try:
    import gridcraft_p4_safe_write as live_p4
except ImportError:
    # Outside the complete repo, use a narrow contract shim. CI includes the real P4.
    shim=types.ModuleType('gridcraft_p4_safe_write')
    class P4Denied(Exception):pass
    def valid_doc(v):
        if type(v) is not str or not v.isdecimal() or int(v)<1 or int(v)>2**64-1:
            raise P4Denied('INVALID_DOC')
        return v
    def check_request_id(v):
        try:
            u=str(uuid.UUID(v))
            if v.lower()!=u:raise ValueError('bad')
            return u
        except (ValueError,TypeError,AttributeError):
            raise P4Denied('INVALID_REQUEST_ID') from None
    shim.P4Denied=P4Denied
    shim.valid_doc=valid_doc
    shim.check_request_id=check_request_id
    shim.TTL_SECONDS=90
    shim.bounded_region=lambda _: (1,1,2,2)
    shim.clean_values=lambda _r,v:v
    shim.valid_sheet=lambda s:s
    shim.fingerprint=lambda *a: 'a'*64
    sys.modules[shim.__name__]=shim
    import gridcraft_p4_safe_write as live_p4

import gridcraft_p4_safe_save as save
from gridcraft_p4_safe_save import P4SafeSaveWriter, safe_basename, _file_inventory
from test_xlsx_fidelity import zipped, synthetic_parts


class Local:
    def __init__(self):
        self.data=zipped(synthetic_parts())
        self.online=True
        self.snapshot_calls=0
        self.change_after=None
    def windows(self):return [{'doc':'1'}] if self.online else []
    def snapshot_bytes(self,doc):
        self.snapshot_calls+=1
        if self.change_after is not None and self.snapshot_calls>=self.change_after:
            new=synthetic_parts()
            new['xl/drawings/drawing1.xml']=b'<changed/>'
            return zipped(new)
        return self.data

class GlobalReceipts:
    def __init__(self):self.seen=set()
    def reserve(self,rid,pid,sha):
        if rid in self.seen:raise live_p4.P4Denied('REPLAY_DENIED')
        self.seen.add(rid)

class FakeP4:
    def __init__(self,root):
        self.local=Local()
        self.backups=Path(root)/'P4Backups';self.backups.mkdir()
        self._lock=threading.RLock()
        self.approved_docs={'1'}
        self.receipts=GlobalReceipts()
        self.saved_backups=0
    def _authorized(self,doc):
        if doc not in self.approved_docs:raise live_p4.P4Denied('WORKBOOK_NOT_GRANTED')
        if doc not in {w['doc'] for w in self.local.windows()}:raise live_p4.P4Denied('WORKBOOK_CLOSED')
    def _save_backup(self,doc):
        self.saved_backups+=1
        return {'backup_id':f'p4-{doc}-{uuid.uuid4().hex}.xlsx','backup_sha256':'a'*64}

def uid():return str(uuid.uuid4())

class P4SafeSaveTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.p4=FakeP4(self.temp.name)
        self.now=100.0
        self.writer=P4SafeSaveWriter(self.p4,clock=lambda:self.now)
    def prepare(self,name='留存副本.xlsx'):
        return self.writer.prepare('1',name)
    def commit(self,p,rid=None,**overrides):
        return self.writer.commit(p['preview_id'],p['expected_version'],rid or uid(),
                write_enabled=overrides.get('enabled',True),owner_confirmed=overrides.get('owner',True))

    def test_prepare_is_read_only_and_private(self):
        a=self.prepare()
        self.assertTrue(a['ok']);self.assertFalse(a['source_document_saved'])
        self.assertEqual(self.p4.saved_backups,0)
        self.assertEqual(list(self.writer.root.glob('*.xlsx')),[])
        self.assertNotIn(str(self.temp.name),str(a))

    def test_commit_creates_new_file_and_reopens_from_disk(self):
        original=self.p4.local.data
        p=self.prepare()
        r=self.commit(p)
        self.assertTrue(r['ok']);self.assertEqual(r['status'],'DISK_REOPEN_VERIFIED_COPY_ONLY')
        self.assertEqual(r['gridcraft_native_reopen'],'NOT_TESTED')
        self.assertFalse(r['source_document_saved'])
        self.assertEqual(self.p4.local.data,original)
        self.assertEqual((self.writer.root/'留存副本.xlsx').read_bytes(),original)
        self.assertEqual(self.p4.saved_backups,1)
        self.assertEqual(self.writer.status(r['request_id'],verify_disk=True)['disk_verification'],'MATCH')

    def test_fresh_writer_does_not_leak_receipt_while_doc_offline(self):
        r=self.commit(self.prepare(),uid())
        self.p4.local.online=False
        other=P4SafeSaveWriter(self.p4)
        reply=other.status(r['request_id'],verify_disk=True)
        self.assertFalse(reply['ok'])
        self.assertEqual(reply['error'],'RECEIPT_IDENTITY_NOT_VERIFIED')
        self.assertNotIn('file_name',reply)

    def test_fresh_writer_reconciles_same_live_workbook(self):
        r=self.commit(self.prepare(),uid())
        other=P4SafeSaveWriter(self.p4)
        reply=other.status(r['request_id'],verify_disk=True)
        self.assertTrue(reply['ok'])
        self.assertEqual(reply['disk_verification'],'MATCH')
        self.assertFalse(reply['source_document_saved'])

    def test_uid_reused_for_new_workbook_cannot_read_old_receipt(self):
        r=self.commit(self.prepare(),uid())
        # The new workbook happens to have the same document UID, but its
        # contents are unrelated. A fresh session cannot trust that UID alone.
        self.p4.local.data=b'OTHER_WORKBOOK'
        other=P4SafeSaveWriter(self.p4)
        reply=other.status(r['request_id'],verify_disk=True)
        self.assertFalse(reply['ok'])
        self.assertEqual(reply['error'],'RECEIPT_IDENTITY_NOT_VERIFIED')
        self.assertNotIn('file_name',reply)

    def test_no_overwrite_existing(self):
        path=self.writer.root/'留存副本.xlsx';path.write_bytes(b'KEEP_ME')
        with self.assertRaisesRegex(live_p4.P4Denied,'SAVE_ALREADY_EXISTS'):self.prepare()
        self.assertEqual(path.read_bytes(),b'KEEP_ME')

    def test_case_insensitive_collision(self):
        (self.writer.root/'Book.xlsx').write_bytes(b'old')
        with self.assertRaisesRegex(live_p4.P4Denied,'SAVE_ALREADY_EXISTS'):
            self.prepare('book.XLSX')

    def test_forbidden_names(self):
        bad=['../foo.xlsx','C:\\secret.xlsx','//server/a.xlsx','folder/x.xlsx',
             'A.xlsx:secret','CON.xlsx','LPT1.xlsx','NUL.xlsx','name.xls',
             'a..xlsx','  file.xlsx','a .xlsx','文件.xlsx.','bad?.xlsx','bad\x01.xlsx',
             'bad\u202e.xlsx','.hidden.xlsx']
        for name in bad:
            with self.subTest(name=name),self.assertRaises(live_p4.P4Denied):safe_basename(name)

    def test_unicode_safe_name(self):
        self.assertEqual(safe_basename('出勤紀錄 2026.xlsx'),'出勤紀錄 2026.xlsx')

    def test_owner_and_local_switch(self):
        p=self.prepare()
        with self.assertRaisesRegex(live_p4.P4Denied,'OWNER_CONFIRMATION_REQUIRED'):
            self.commit(p,owner=False)
        with self.assertRaisesRegex(live_p4.P4Denied,'OWNER_CONFIRMATION_REQUIRED'):
            self.commit(p,enabled=False)
        self.assertEqual(self.p4.saved_backups,0)

    def test_revocation_after_preview(self):
        p=self.prepare();self.p4.approved_docs.clear()
        with self.assertRaisesRegex(live_p4.P4Denied,'WORKBOOK_NOT_GRANTED'):self.commit(p)
        self.assertEqual(self.p4.saved_backups,0)

    def test_document_closed_after_preview(self):
        p=self.prepare();self.p4.local.online=False
        with self.assertRaisesRegex(live_p4.P4Denied,'WORKBOOK_CLOSED'):self.commit(p)

    def test_expired_preview(self):
        p=self.prepare();self.now+=91
        with self.assertRaisesRegex(live_p4.P4Denied,'PREVIEW_EXPIRED'):self.commit(p)

    def test_version_conflict(self):
        p=self.prepare();self.p4.local.change_after=2
        with self.assertRaisesRegex(live_p4.P4Denied,'VERSION_CONFLICT'):self.commit(p)
        self.assertEqual(self.p4.saved_backups,0)

    def test_version_conflict_after_backup(self):
        p=self.prepare();self.p4.local.change_after=3
        with self.assertRaisesRegex(live_p4.P4Denied,'VERSION_CONFLICT_AFTER_SNAPSHOT'):self.commit(p)
        self.assertEqual(self.p4.saved_backups,1)
        self.assertEqual(list(self.writer.root.glob('*.xlsx')),[])

    def test_same_preview_cannot_be_committed_twice(self):
        p=self.prepare();self.commit(p)
        with self.assertRaisesRegex(live_p4.P4Denied,'PREVIEW_NOT_FOUND'):self.commit(p)

    def test_replay_same_request_id(self):
        rid=uid();self.commit(self.prepare('A.xlsx'),rid)
        with self.assertRaisesRegex(live_p4.P4Denied,'REPLAY_DENIED'):
            self.commit(self.prepare('B.xlsx'),rid)
        self.assertEqual(len(list(self.writer.root.glob('*.xlsx'))),1)

    def test_existing_file_modified_after_export(self):
        r=self.commit(self.prepare())
        f=self.writer.root/'留存副本.xlsx'
        f.write_bytes(b'tampered')
        self.assertIn(self.writer.status(r['request_id'],verify_disk=True)['disk_verification'],
                      ('SAVE_SOURCE_UNSUPPORTED','SAVE_DISK_MISMATCH'))

    def test_symlink_export_file_blocked(self):
        try:
            (self.writer.root/'留存副本.xlsx').symlink_to(self.p4.backups)
        except (OSError,NotImplementedError):self.skipTest('OS disallows symlinks')
        with self.assertRaises(live_p4.P4Denied):self.prepare()

    def test_symlink_export_root_blocked(self):
        root=self.writer.root
        root.rmdir()
        try:root.symlink_to(self.p4.backups, target_is_directory=True)
        except (OSError,NotImplementedError):self.skipTest('OS disallows symlinks')
        with self.assertRaisesRegex(live_p4.P4Denied,'SAVE_FOLDER_UNSAFE'):self.prepare()

    def test_bad_zip_rejected_before_backup(self):
        self.p4.local.data=b'NOT A XLSX'
        with self.assertRaises(live_p4.P4Denied):self.prepare()
        self.assertEqual(self.p4.saved_backups,0)

    def test_status_refuses_revoked_workbook(self):
        r=self.commit(self.prepare())
        self.p4.approved_docs.clear()
        with self.assertRaisesRegex(live_p4.P4Denied,'WORKBOOK_NOT_GRANTED'):
            self.writer.status(r['request_id'],verify_disk=True)

    def test_no_native_workbook_close_or_save(self):
        self.assertFalse(hasattr(self.p4.local,'save_workbook'))
        self.assertFalse(hasattr(self.p4.local,'close_workbook'))

    def test_status_without_receipt(self):
        self.assertEqual(self.writer.status(uid())['error'],'RECEIPT_NOT_FOUND')

    def test_reopen_error_after_write_tombstone(self):
        p=self.prepare();rid=uid()
        with mock.patch.object(save,'_file_inventory',side_effect=OSError('disk failure')):
            res=self.commit(p,rid)
        self.assertEqual(res['status'],'OUTCOME_UNKNOWN')
        self.assertEqual(len(list(self.writer.root.glob('*.xlsx'))),1)
        with self.assertRaisesRegex(live_p4.P4Denied,'REPLAY_DENIED'):
            self.commit(self.prepare('second.xlsx'),rid)
        self.assertEqual(self.writer.status(rid,verify_disk=True)['disk_verification'],'MATCH')

    def test_no_auto_delete_or_overwrite_on_failure(self):
        p=self.prepare();rid=uid()
        with mock.patch.object(save,'_sync_folder',side_effect=OSError('inject')):
            ans=self.commit(p,rid)
        self.assertEqual(ans['status'],'OUTCOME_UNKNOWN')
        self.assertEqual(len(list(self.writer.root.glob('*.xlsx'))),1)

    def test_reject_existing_dot_reserved(self):
        for name in ('AUX.xlsx','COM2.xlsx','PRN.xlsx'):
            with self.assertRaises(live_p4.P4Denied):self.prepare(name)

    def test_single_user_app_root_only(self):
        self.assertIn('P4SafeExports',str(self.writer.root))
        self.assertNotIn('file_path',self.prepare())

if __name__=='__main__':unittest.main(verbosity=2)
