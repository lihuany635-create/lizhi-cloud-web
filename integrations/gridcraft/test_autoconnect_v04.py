"""GridCraft v0.4 startup and persisted exact-local-file grant tests, no real device."""
from __future__ import annotations
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import gridcraft_windows_agent as agent
from gridcraft_desktop_local import GridCraftLocal
from gridcraft_outbound_worker import OutboundWorker, UnsafeJob

class Variable:
    def __init__(self,value=None): self.value=value
    def set(self,new): self.value=new
    def get(self): return self.value
class Root:
    def __init__(self): self.actions=[]
    def title(self,*a): pass
    def geometry(self,*a): pass
    def minsize(self,*a): pass
    def protocol(self,*a): pass
    def after(self,ms,callback): self.actions.append((ms,callback.__name__))

class TestAutoConnectV04(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.one=Path(self.temp.name)/"approved.xlsx"
        self.two=Path(self.temp.name)/"unapproved.xlsx"
        self.one.write_bytes(b"approved, synthetic")
        self.two.write_bytes(b"unapproved, synthetic")
    def test_only_saved_absolute_real_file_can_be_remembered(self):
        a=agent.workbook_identity_hash(str(self.one))
        b=agent.workbook_identity_hash(str(self.two))
        self.assertEqual(len(a),64)
        self.assertNotEqual(a,b)
        self.assertIsNone(agent.workbook_identity_hash("Book1"))
        self.assertIsNone(agent.workbook_identity_hash(None))
        self.assertIsNone(agent.workbook_identity_hash(str(self.one/"../missing.xlsx")))
    def test_preferences_roundtrip_and_malformed_hashes_rejected(self):
        p=Path(self.temp.name)/"settings.json"
        digest=agent.workbook_identity_hash(str(self.one))
        agent.save_settings({"gridcraft_path":"C:/GridCraft/gridcraft.exe","remote_enabled":True,
          "auto_allow_p4":True,"remembered_workbooks":[digest,digest,"nothex"]},p)
        saved=agent.load_settings(p)
        self.assertTrue(saved["auto_allow_p4"])
        self.assertTrue(saved["remote_enabled"])
        self.assertEqual(saved["remembered_workbooks"],[digest])
        self.assertNotIn(str(self.one),p.read_text())
    def test_autostart_schedules_gridcraft_and_reconnect_when_paired(self):
        root=Root()
        settings={"gridcraft_path":str(self.one),"remote_enabled":True,
           "start_gridcraft_on_login":False, "auto_allow_p4":False,
           "remembered_workbooks":[]}
        with mock.patch.object(agent,"load_settings",return_value=settings), \
             mock.patch.object(agent,"DeviceStore") as Store, \
             mock.patch.object(agent.tk,"StringVar",side_effect=lambda value=None:Variable(value)), \
             mock.patch.object(agent.tk,"BooleanVar",side_effect=lambda value=None:Variable(value)), \
             mock.patch.object(agent.AgentUI,"_create_widgets"), \
             mock.patch.object(agent.AgentUI,"refresh"), \
             mock.patch.object(agent,"startup_enabled",return_value=False):
            Store.return_value.load.return_value={"device_id":"synthetic","token":"a"*64}
            agent.AgentUI(root)
        self.assertIn((900,"start_remote"),root.actions)
        self.assertIn((1100,"launch_on_login"),root.actions)
    def test_auto_reconnect_respects_explicit_stop_preference(self):
        root=Root()
        settings={"gridcraft_path":"","remote_enabled":False,
           "start_gridcraft_on_login":False, "auto_allow_p4":False,"remembered_workbooks":[]}
        with mock.patch.object(agent,"load_settings",return_value=settings), \
             mock.patch.object(agent,"DeviceStore") as Store, \
             mock.patch.object(agent.tk,"StringVar",side_effect=lambda value=None:Variable(value)), \
             mock.patch.object(agent.tk,"BooleanVar",side_effect=lambda value=None:Variable(value)), \
             mock.patch.object(agent.AgentUI,"_create_widgets"), \
             mock.patch.object(agent.AgentUI,"refresh"), \
             mock.patch.object(agent,"startup_enabled",return_value=False):
            Store.return_value.load.return_value={"device_id":"synthetic","token":"a"*64}
            agent.AgentUI(root)
        self.assertNotIn((900,"start_remote"),root.actions)
    def test_saved_local_path_restores_only_exact_previously_approved_file(self):
        approved=agent.workbook_identity_hash(str(self.one))
        ui=agent.AgentUI.__new__(agent.AgentUI)
        ui.settings={"remembered_workbooks":[approved]}
        ui.session_grants={}
        ui.allowed_docs=set()
        class Fake:
            def __init__(self,**kwargs):pass
            def windows(self): return [
                {"doc":"1","title":"My Book"},
                {"doc":"2","title":"My Book"}]
            def inspect(self,doc):return {"path":str(self_one if doc=="1" else self_two)}
        self_one,self_two=self.one,self.two
        with mock.patch.object(agent,"GridCraftLocal",Fake):
            result=ui._verified_grants()
        self.assertEqual(result,{"1"})
        self.assertEqual(ui.allowed_docs,{"1"})
    def test_same_doc_id_reused_for_different_file_has_no_grant(self):
        approved=agent.workbook_identity_hash(str(self.one))
        ui=agent.AgentUI.__new__(agent.AgentUI)
        ui.settings={"remembered_workbooks":[approved]}
        ui.session_grants={"1":(approved,"Book1")}
        ui.allowed_docs={"1"}
        class Fake:
            def __init__(self,**kwargs):pass
            def windows(self):return [{"doc":"1","title":"Book1"}]
            def inspect(self,doc):return {"path":str(self_two)}
        self_two=self.two
        with mock.patch.object(agent,"GridCraftLocal",Fake):
            self.assertEqual(ui._verified_grants(),set())
        self.assertEqual(ui.allowed_docs,set())
    def test_unsaved_book1_only_current_session_grant_not_persisted(self):
        ui=agent.AgentUI.__new__(agent.AgentUI)
        ui.settings={"remembered_workbooks":[]}
        ui.session_grants={"1":(None,"Book1")}
        ui.allowed_docs={"1"}
        class Fake:
            def __init__(self,**kwargs):pass
            def windows(self):return [{"doc":"1","title":"Book1"}]
            def inspect(self,doc):return {"path":None}
        with mock.patch.object(agent,"GridCraftLocal",Fake):
            self.assertEqual(ui._verified_grants(),{"1"})
            ui.session_grants={}
            self.assertEqual(ui._verified_grants(),set())
    def test_worker_rechecks_grant_immediately_before_job(self):
        class Local:
            def windows(self):return [{"doc":"1","title":"test","dirty":False}]
            def read_range(self,*args,**kwargs):return {"values":[["should-not-read"]]}
        w=OutboundWorker(transport=None,local=Local(),
           approved_docs={"1"},grant_checker=lambda:set())
        books=w.execute_job({"name":"gridcraft_list_workbooks","args":{}})
        self.assertEqual(books["workbooks"],[])
        with self.assertRaisesRegex(UnsafeJob,"WORKBOOK_NOT_GRANTED"):
            w.execute_job({"name":"gridcraft_read_range",
              "args":{"doc":"1","sheet":"Sheet1","range":"A1"}})
    def test_document_inspect_id_is_numeric_and_validated_locally(self):
        local=GridCraftLocal()
        with mock.patch.object(local,"windows",return_value=[{"doc":"1"}]), \
             mock.patch.object(local,"_request",return_value={"path":"C:/test.xlsx"}) as request:
            self.assertEqual(local.inspect("1")["path"],"C:/test.xlsx")
            request.assert_called_once_with("document.inspect",{"doc":1})
        with self.assertRaisesRegex(ValueError,"invalid decimal workbook id"):
            local.inspect("../../secrets")
    def test_untrusted_methods_cannot_bypass_worker_grant_checker(self):
        w=OutboundWorker(transport=None,local=None,grant_checker=lambda:set())
        with self.assertRaisesRegex(UnsafeJob,"METHOD_DENIED"):
            w.execute_job({"name":"shell","args":{}})

if __name__=="__main__":
    unittest.main(verbosity=2)
