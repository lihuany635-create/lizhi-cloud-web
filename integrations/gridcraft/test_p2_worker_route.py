"""P2 candidate routing integration tests for the existing authenticated outbound worker.
Uses only synthetic fake desktop data. No Windows or Supabase connection.
"""
import unittest
from gridcraft_outbound_worker import OutboundWorker, UnsafeJob
from gridcraft_p2_batch import P2BatchWriter
from gridcraft_p4_safe_write import P4Denied
from test_p2_batch import FakeDesktop, FakeP4, uid
from pathlib import Path
import tempfile

class RoutingTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.local=FakeDesktop()
        self.p4=FakeP4(self.local,Path(self.tmp.name))
        self.p2=P2BatchWriter(self.p4,clock=lambda:100.0)
        self.grants={'1'}
        self.enabled=True
        self.worker=OutboundWorker(transport=None,local=self.local,approved_docs={'1'},
                p4_writer=self.p4,p2_batch=self.p2,p4_enabled=lambda:self.enabled,
                grant_checker=lambda:self.grants)
        self.ops=[{'sheet':'Sheet1','range':'A1:B2','values':[['Synthetic',1],[2,None]]},
                  {'sheet':'Sheet1','range':'D1:E2','values':[['Batch',2],[3,None]]}]

    def job(self,name,args):
        return self.worker.execute_job({'name':name,'args':args})

    def test_full_candidate_dispatch(self):
        p=self.job('gridcraft_batch_prepare',{'doc':'1','operations':self.ops})
        self.assertTrue(p['ok'])
        rid=uid()
        result=self.job('gridcraft_batch_commit',{'preview_id':p['preview_id'],
                    'expected_version':p['expected_version'],'request_id':rid,
                    'owner_confirmed':True})
        self.assertEqual(result['status'],'VERIFIED_NOT_SAVED')
        self.assertEqual(self.local.write_count,2)
        status=self.job('gridcraft_batch_status',{'request_id':rid,'reconcile':True})
        self.assertEqual(status['reconciliation'],'CURRENT_VALUES_MATCH_TARGET')

    def test_absent_p2_gate_rejected(self):
        self.worker.p2_batch=None
        with self.assertRaisesRegex(UnsafeJob,'P2_GATE_OFF'):
            self.job('gridcraft_batch_prepare',{'doc':'1','operations':self.ops})

    def test_owner_flag_and_local_gate_both_required(self):
        p=self.job('gridcraft_batch_prepare',{'doc':'1','operations':self.ops})
        args={'preview_id':p['preview_id'],'expected_version':p['expected_version'],
              'request_id':uid(),'owner_confirmed':False}
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):
            self.job('gridcraft_batch_commit',args)
        args['owner_confirmed']=True
        self.enabled=False
        with self.assertRaisesRegex(P4Denied,'OWNER_CONFIRMATION_REQUIRED'):
            self.job('gridcraft_batch_commit',args)
        self.assertEqual(self.local.write_count,0)

    def test_revoke_between_prepare_and_commit(self):
        p=self.job('gridcraft_batch_prepare',{'doc':'1','operations':self.ops})
        self.grants=set()
        with self.assertRaisesRegex(P4Denied,'WORKBOOK_NOT_GRANTED'):
            self.job('gridcraft_batch_commit',{'preview_id':p['preview_id'],
                    'expected_version':p['expected_version'],
                    'request_id':uid(),'owner_confirmed':True})
        self.assertEqual(self.local.write_count,0)

    def test_unexpected_args_and_nonboolean_reconciliation_rejected(self):
        with self.assertRaisesRegex(UnsafeJob,'INVALID_ARGS'):
            self.job('gridcraft_batch_prepare',{'doc':'1','operations':self.ops,'saveAs':'C:\\'})
        with self.assertRaisesRegex(UnsafeJob,'INVALID_ARGS'):
            self.job('gridcraft_batch_status',{'request_id':uid(),'reconcile':'true'})

if __name__=='__main__':
    unittest.main()
