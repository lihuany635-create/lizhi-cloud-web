"""P3 candidate worker dispatch tests. Synthetic only; no remote endpoint."""
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import mock
from gridcraft_outbound_worker import OutboundWorker, UnsafeJob
from gridcraft_p3_format import P3FormatWriter
from gridcraft_p4_safe_write import P4Denied
from test_p3_format import FakeDesktop, FakeP4, FakeInventory, uid
import gridcraft_p3_format as p3

class RoutingTests(unittest.TestCase):
    def setUp(self):
        self.tmp=TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.local=FakeDesktop();self.p4=FakeP4(self.local,Path(self.tmp.name))
        self.formatter=P3FormatWriter(self.p4,clock=lambda:100)
        self.grants={'1'};self.enabled=True
        self.worker=OutboundWorker(transport=None,local=self.local,approved_docs={'1'},
                    p4_writer=self.p4,p3_formatter=self.formatter,
                    p4_enabled=lambda:self.enabled,grant_checker=lambda:self.grants)
        self.patch=mock.patch.object(p3,'_inv',lambda local,doc:FakeInventory(local.fields))
        self.patch.start();self.addCleanup(self.patch.stop)
        self.spec={'kind':'style','sheet':'Sheet1','range':'A1:B1','field':'bold','value':True}
    def call(self,name,args):return self.worker.execute_job({'name':name,'args':args})
    def test_full_prepare_commit_status(self):
        p=self.call('gridcraft_format_prepare',{'doc':'1','spec':self.spec})
        self.assertTrue(p['ok'])
        rid=uid();result=self.call('gridcraft_format_commit',{'preview_id':p['preview_id'],
                   'expected_version':p['expected_version'],'request_id':rid,'owner_confirmed':True})
        self.assertEqual(result['status'],'EFFECT_OBSERVED_NOT_SAVED')
        status=self.call('gridcraft_format_status',{'request_id':rid,'reconcile':True})
        self.assertEqual(status['reconciliation'],'CURRENT_SNAPSHOT_MATCHES_OBSERVED')
        self.assertEqual(self.local.write_count,1)
    def test_p3_gate_off_does_not_disable_p3_read(self):
        self.worker.p3_formatter=None
        with self.assertRaisesRegex(UnsafeJob,'P3_FORMAT_GATE_OFF'):
            self.call('gridcraft_format_prepare',{'doc':'1','spec':self.spec})
        self.assertEqual(self.worker.execute_job({'name':'gridcraft_list_workbooks','args':{}})['ok'],True)
    def test_commit_requires_owner_and_local_gate(self):
        p=self.call('gridcraft_format_prepare',{'doc':'1','spec':self.spec})
        args={'preview_id':p['preview_id'],'expected_version':p['expected_version'],'request_id':uid(),'owner_confirmed':False}
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):
            self.call('gridcraft_format_commit',args)
        args['owner_confirmed']=True;self.enabled=False
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):
            self.call('gridcraft_format_commit',args)
        self.assertEqual(self.local.write_count,0)
    def test_revoke_after_preview(self):
        p=self.call('gridcraft_format_prepare',{'doc':'1','spec':self.spec});self.grants=set()
        with self.assertRaisesRegex(P4Denied,'WORKBOOK_NOT_GRANTED'):
            self.call('gridcraft_format_commit',{'preview_id':p['preview_id'],
                    'expected_version':p['expected_version'],'request_id':uid(),'owner_confirmed':True})
        self.assertEqual(self.local.write_count,0)
    def test_extra_args_and_invalid_reconcile_denied(self):
        with self.assertRaisesRegex(UnsafeJob,'INVALID_ARGS'):
            self.call('gridcraft_format_prepare',{'doc':'1','spec':self.spec,'save_path':'C:\\test.xlsx'})
        with self.assertRaisesRegex(UnsafeJob,'INVALID_ARGS'):
            self.call('gridcraft_format_status',{'request_id':uid(),'reconcile':'true'})
    def test_unrelated_method_denied(self):
        with self.assertRaisesRegex(UnsafeJob,'METHOD_DENIED'):
            self.call('gridcraft_engine_execute',{'command':'file.save'})

if __name__=='__main__':unittest.main(verbosity=2)
