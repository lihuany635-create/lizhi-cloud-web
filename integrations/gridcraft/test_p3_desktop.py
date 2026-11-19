"""Strict GridCraft control adapter tests; no actual socket or real workbook."""
import io
import json
import unittest
from unittest import mock
from gridcraft_p3_desktop import P3Local
from gridcraft_p4_safe_write import P4Denied

class FakeSocket:
    def __init__(self):
        self.sent=[]
        self.stream=io.BytesIO((json.dumps({'id':0,'ok':True,'result':{'authenticated':True}})+'\n'+
               json.dumps({'id':1,'ok':True,'result':{'changed':True}})+'\n').encode())
    def __enter__(self):return self
    def __exit__(self,*a):pass
    def settimeout(self,*a):pass
    def makefile(self,*a):
        return io.BytesIO(self.stream.getvalue())
    def sendall(self,b):self.sent.append(b)

class DesktopTests(unittest.TestCase):
    def setUp(self):
        self.local=P3Local(port=7979)
        self.local.windows=lambda:[{'doc':'1'}]
        self.local._token=lambda:'local_fake_test_token'
        self.sock=FakeSocket()
        self.sock_patch=mock.patch('gridcraft_p3_desktop.socket.create_connection',return_value=self.sock)
        self.sock_patch.start();self.addCleanup(self.sock_patch.stop)
    def test_valid_exact_white_list_command(self):
        res=self.local.format_command('1','home.bold',{'sheet':'Sheet1','range':'A1:B2','on':True})
        self.assertEqual(res,{'changed':True})
        self.assertEqual(len(self.sock.sent),2)
        body=json.loads(self.sock.sent[1])
        self.assertEqual(body['method'],'engine.execute');self.assertEqual(body['params']['doc'],1)
        self.assertEqual(body['params']['command'],'home.bold')
    def test_no_arbitrary_command_or_params(self):
        bad=[('file.save',{}),('home.formatCells',{'sheet':'Sheet1','range':'A1:B2','style':{'protection':{'locked':False}}}),
             ('home.bold',{'sheet':'Sheet1','range':'A1:B2','on':True,'extra':'evil'}),
             ('home.bold',{'sheet':'Sheet1','range':'A1:B2','on':'true'}),
             ('home.borders',{'sheet':'Sheet1','range':'A1:B2','preset':'none'}),
             ('pageLayout.pageSetup',{'sheet':'Sheet1','orientation':'landscape','path':'C:/test'}),
             ('home.rowHeight',{'sheet':'Sheet1','rows':'1:500','points':12}),
             ('home.columnWidth',{'sheet':'Sheet1','cols':'A:ZZZ','chars':8})]
        for cmd,params in bad:
            with self.subTest(cmd=cmd,params=params):
                with self.assertRaises(P4Denied):self.local.format_command('1',cmd,params)
        self.assertEqual(self.sock.sent,[])
    def test_unopened_document_denied(self):
        with self.assertRaisesRegex(P4Denied,'WORKBOOK_CLOSED'):
            self.local.format_command('2','home.bold',{'sheet':'Sheet1','range':'A1:B2','on':True})
    def test_unmerge_and_page_setup(self):
        self.local.format_command('1','home.unmergeCells',{'sheet':'Sheet1','range':'A1:B2'})
        self.local.format_command('1','pageLayout.pageSetup',{'sheet':'Sheet1','orientation':'landscape'})
    def test_alignment_only_vertical(self):
        self.local.format_command('1','home.alignMiddle',{'sheet':'Sheet1','range':'A1:B2'})
        with self.assertRaisesRegex(P4Denied,'FORMAT_COMMAND_DENIED'):
            self.local.format_command('1','home.alignCenter',{'sheet':'Sheet1','range':'A1:B2'})

if __name__=='__main__':unittest.main(verbosity=2)
