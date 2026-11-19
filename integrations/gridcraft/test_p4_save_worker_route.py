"""P4 save-route integration tests (GitHub full repo; synthetic workbooks only)."""
from __future__ import annotations
import tempfile
import unittest
import uuid
from gridcraft_outbound_worker import OutboundWorker, UnsafeJob
from gridcraft_p4_safe_write import P4Denied
from gridcraft_p4_safe_save import P4SafeSaveWriter
from test_p4_safe_save import FakeP4


class SaveRoutingTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.p4=FakeP4(self.tmp.name)
        self.saver=P4SafeSaveWriter(self.p4,clock=lambda:100.)
        self.grants={'1'}
        self.enabled=True
        self.worker=OutboundWorker(transport=None,local=self.p4.local,
              approved_docs={'1'},p4_writer=self.p4,p4_saver=self.saver,
              p4_enabled=lambda:self.enabled,grant_checker=lambda:self.grants)

    def call(self,name,args):
        return self.worker.execute_job({'name':name,'args':args})

    def test_prepare_commit_and_disk_status(self):
        p=self.call('gridcraft_save_prepare',{'doc':'1','file_name':'出勤副本.xlsx'})
        self.assertTrue(p['ok'])
        rid=str(uuid.uuid4())
        result=self.call('gridcraft_save_commit',{'preview_id':p['preview_id'],
              'expected_version':p['expected_version'],'request_id':rid,
              'owner_confirmed':True})
        self.assertEqual(result['status'],'DISK_REOPEN_VERIFIED_COPY_ONLY')
        status=self.call('gridcraft_save_status',{'request_id':rid,'verify_disk':True})
        self.assertEqual(status['disk_verification'],'MATCH')
        self.assertFalse(status['source_document_saved'])

    def test_worker_no_gate(self):
        self.worker.p4_saver=None
        with self.assertRaisesRegex(UnsafeJob,'P4_SAVE_GATE_OFF'):
            self.call('gridcraft_save_prepare',{'doc':'1','file_name':'copy.xlsx'})

    def test_owner_and_local_gate(self):
        p=self.call('gridcraft_save_prepare',{'doc':'1','file_name':'copy.xlsx'})
        args={'preview_id':p['preview_id'],'expected_version':p['expected_version'],
              'request_id':str(uuid.uuid4()),'owner_confirmed':False}
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):
            self.call('gridcraft_save_commit',args)
        args['owner_confirmed']=True;self.enabled=False
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):
            self.call('gridcraft_save_commit',args)
        self.assertEqual(list(self.saver.root.glob('*.xlsx')),[])

    def test_revocation_blocks_commit_and_status(self):
        p=self.call('gridcraft_save_prepare',{'doc':'1','file_name':'copy.xlsx'})
        self.grants.clear()
        with self.assertRaisesRegex(P4Denied,'WORKBOOK_NOT_GRANTED'):
            self.call('gridcraft_save_commit',{'preview_id':p['preview_id'],
                  'expected_version':p['expected_version'],'request_id':str(uuid.uuid4()),
                  'owner_confirmed':True})

    def test_strict_args_no_path_passthrough(self):
        with self.assertRaisesRegex(UnsafeJob,'INVALID_ARGS'):
            self.call('gridcraft_save_prepare',{'doc':'1','file_name':'copy.xlsx','path':'C:\\other'})
        with self.assertRaisesRegex(UnsafeJob,'INVALID_ARGS'):
            self.call('gridcraft_save_status',{'request_id':str(uuid.uuid4()),'verify_disk':'true'})
        with self.assertRaisesRegex(UnsafeJob,'METHOD_DENIED'):
            self.call('gridcraft_app_save',{'path':'C:\\windows'})

if __name__=='__main__':unittest.main(verbosity=2)
