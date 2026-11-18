"""v0.5 one-click local agent security and auto-authorization tests (synthetic only)."""
import unittest
import threading
from unittest import mock

import gridcraft_windows_agent as agent
from gridcraft_outbound_worker import OutboundWorker, UnsafeJob

class FakeVar:
    def __init__(self,value=None):self.v=value
    def get(self):return self.v
    def set(self,v):self.v=v
class FakeTk:
    def __init__(self):self.actions=[]
    def title(self,*a):pass
    def geometry(self,*a):pass
    def minsize(self,*a):pass
    def protocol(self,*a):pass
    def after(self,ms,callback):self.actions.append((ms,callback.__name__))
class OneClickTests(unittest.TestCase):
    def makeui(self,paired=True):
        ui=agent.AgentUI.__new__(agent.AgentUI)
        ui.allowed_docs=set()
        ui.p4_write_enabled=False
        ui.remote_stop=threading.Event()
        ui.paired={"device_id":"mock","token":"a"*64} if paired else None
        ui.settings={}
        return ui
    def test_open_agent_reconnects_even_if_last_session_stopped(self):
        root=FakeTk()
        settings={"gridcraft_path":"", "remote_enabled":False,
                  "start_gridcraft_on_login":False}
        with mock.patch.object(agent,"load_settings",return_value=settings), \
            mock.patch.object(agent,"DeviceStore") as Store, \
            mock.patch.object(agent.tk,"StringVar",side_effect=lambda value=None:FakeVar(value)), \
            mock.patch.object(agent.tk,"BooleanVar",side_effect=lambda value=None:FakeVar(value)), \
            mock.patch.object(agent.AgentUI,"_create_widgets"), \
            mock.patch.object(agent.AgentUI,"refresh"), \
            mock.patch.object(agent,"startup_enabled",return_value=False):
            Store.return_value.load.return_value={"device_id":"existing","token":"a"*64}
            agent.AgentUI(root)
        self.assertIn((900,"start_remote"),root.actions)
    def test_no_unauthenticated_remote_without_existing_pairing(self):
        root=FakeTk()
        with mock.patch.object(agent,"load_settings",return_value={}), \
            mock.patch.object(agent,"DeviceStore") as Store, \
            mock.patch.object(agent.tk,"StringVar",side_effect=lambda value=None:FakeVar(value)), \
            mock.patch.object(agent.tk,"BooleanVar",side_effect=lambda value=None:FakeVar(value)), \
            mock.patch.object(agent.AgentUI,"_create_widgets"), \
            mock.patch.object(agent.AgentUI,"refresh"), \
            mock.patch.object(agent,"startup_enabled",return_value=False):
            Store.return_value.load.return_value=None
            agent.AgentUI(root)
        self.assertNotIn((900,"start_remote"),root.actions)
    def test_all_current_open_gridcraft_workbooks_auto_granted(self):
        ui=self.makeui()
        self.assertEqual(ui._verified_grants([
            {"doc":"1","title":"Book1"},{"doc":"2","title":"book.xls"}]),{"1","2"})
        self.assertTrue(ui.p4_write_enabled)
    def test_unsaved_book1_is_usable_without_manual_grant(self):
        ui=self.makeui()
        self.assertEqual(ui._verified_grants([{"doc":"1","title":"Book1"}]),{"1"})
    def test_invalid_workbook_identifier_never_granted(self):
        ui=self.makeui()
        docs=[{"doc":"0"},{"doc":"1.0"},{"doc":"../secret"},{"doc":"18446744073709551616"},
              {"doc":"1"},{"title":"missing id"}]
        self.assertEqual(ui._verified_grants(docs),{"1"})
    def test_close_book_removes_remote_authorization_and_write_switch(self):
        ui=self.makeui()
        self.assertEqual(ui._verified_grants([{"doc":"1"}]),{"1"})
        self.assertEqual(ui._verified_grants([]),set())
        self.assertFalse(ui.p4_write_enabled)
    def test_stop_remote_turns_off_write_even_with_open_book(self):
        ui=self.makeui()
        ui.remote_stop.set()
        self.assertEqual(ui._verified_grants([{"doc":"1"}]),{"1"})
        self.assertFalse(ui.p4_write_enabled)
    def test_device_unpaired_does_not_enable_write(self):
        ui=self.makeui(paired=False)
        self.assertEqual(ui._verified_grants([{"doc":"1"}]),{"1"})
        self.assertFalse(ui.p4_write_enabled)
    def test_gridcraft_offline_never_keeps_prior_grants(self):
        ui=self.makeui()
        ui.allowed_docs={"1"}
        ui.p4_write_enabled=True
        class Offline:
            def __init__(self,**kwargs):pass
            def windows(self):raise ConnectionError("offline")
        with mock.patch.object(agent,"GridCraftLocal",Offline):
            self.assertEqual(ui._verified_grants(),set())
        self.assertFalse(ui.p4_write_enabled)
    def test_worker_rechecks_local_open_doc_before_each_operation(self):
        class Local:
            def windows(self):return [{"doc":"1","title":"Book1"}]
            def read_range(self,*args,**kwargs):raise AssertionError("MUST_NOT_READ")
        w=OutboundWorker(transport=None,local=Local(),approved_docs={"1"},
           grant_checker=lambda:set())
        self.assertEqual(w.execute_job({"name":"gridcraft_list_workbooks","args":{}})["workbooks"],[])
        with self.assertRaisesRegex(UnsafeJob,"WORKBOOK_NOT_GRANTED"):
            w.execute_job({"name":"gridcraft_read_range",
                "args":{"doc":"1","sheet":"Sheet1","range":"A1"}})
    def test_invalid_method_cannot_be_executed_by_auto_grant(self):
        w=OutboundWorker(transport=None,local=None,grant_checker=lambda:{"1"})
        with self.assertRaisesRegex(UnsafeJob,"METHOD_DENIED"):
            w.execute_job({"name":"shell","args":{}})
if __name__=="__main__": unittest.main(verbosity=2)
