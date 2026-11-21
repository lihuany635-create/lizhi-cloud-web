"""GridCraft Windows v0.5.2 lifetime recovery / workbook switch security tests."""
import os
import threading
import unittest
from unittest import mock
from types import SimpleNamespace
import gridcraft_windows_agent as agent
from gridcraft_p4_safe_write import P4SafeWriter

class Root:
    def __init__(self):self.scheduled=[]
    def after(self,ms,cb):self.scheduled.append((ms,cb))

class Var:
    def __init__(self,value=None):self.value=value
    def set(self,value):self.value=value
    def get(self):return self.value

class ReconnectTests(unittest.TestCase):
    def ui(self):
        u=agent.AgentUI.__new__(agent.AgentUI)
        u.running=True
        u.remote_stop=threading.Event()
        u.launch_active=False
        u.launch_attempts=0
        u.launch_polls=0
        u.launch_error=""
        u.launch_process=None
        u._offline_streak=0
        u._last_ready=False
        u._reconnect_after=0.0
        u._grant_lock=threading.RLock()
        u._last_workbook_signature=None
        u._p4_writer=None
        u.allowed_docs=set()
        u.p4_write_enabled=False
        u.paired={"device_id":"synthetic"}
        u.root=Root()
        u.status_var=Var()
        u.path_var=Var("")
        u.workbooks_var=Var()
        u.info_var=Var()
        u.remote_status="unit test"
        u.settings={}
        return u

    def test_offline_two_polls_restarts_and_ready_resets_debounce(self):
        u=self.ui()
        statuses=["READY","GRIDCRAFT_OFFLINE","GRIDCRAFT_OFFLINE","READY",
                  "GRIDCRAFT_OFFLINE","GRIDCRAFT_OFFLINE"]
        with mock.patch.object(u,"refresh",side_effect=statuses), \
             mock.patch.object(u,"launch_on_login") as launch, \
             mock.patch.object(agent.time,"monotonic",return_value=1000):
            for _ in statuses:u._poll()
        self.assertEqual(launch.call_count,2)
        self.assertEqual(u._offline_streak,2)
        self.assertTrue(u._last_ready is False)
        self.assertEqual(len(u.root.scheduled),len(statuses))

    def test_stop_disables_unwanted_restart(self):
        u=self.ui();u.remote_stop.set()
        with mock.patch.object(u,"refresh",return_value="GRIDCRAFT_OFFLINE"), \
             mock.patch.object(u,"launch_on_login") as launch:
            u._poll();u._poll();u._poll()
        launch.assert_not_called()

    def test_cooldown_prevents_restart_spin_when_old_process_crashes(self):
        u=self.ui()
        with mock.patch.object(u,"refresh",return_value="GRIDCRAFT_OFFLINE"), \
             mock.patch.object(u,"launch_on_login") as launch, \
             mock.patch.object(agent.time,"monotonic",side_effect=[1000,1000,1002,1004,1059,1061,1061]):
            for _ in range(6):u._poll()
        self.assertEqual(launch.call_count,2)

    def test_unauthorized_is_not_fixed_by_spawning_extra_gui(self):
        u=self.ui()
        with mock.patch.object(u,"refresh",return_value="UNAUTHORIZED"), \
             mock.patch.object(u,"launch_on_login") as launch:
            u._poll();u._poll();u._poll()
        launch.assert_not_called()

    def test_running_gui_without_control_listener_refuses_duplicate_instance(self):
        u=self.ui()
        local=mock.Mock()
        local.return_value.status.return_value={"status":"GRIDCRAFT_OFFLINE"}
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"gridcraft_process_running",return_value=True), \
             mock.patch.object(agent,"start_gridcraft") as launch:
            u.launch_on_login()
        launch.assert_not_called()
        self.assertFalse(u.launch_active)
        self.assertIn("控制埠未啟動",u.status_var.get())

    def test_process_inspection_failure_fails_closed(self):
        u=self.ui()
        local=mock.Mock()
        local.return_value.status.return_value={"status":"GRIDCRAFT_OFFLINE"}
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"gridcraft_process_running",return_value=None), \
             mock.patch.object(agent,"start_gridcraft") as launch:
            u.launch_on_login()
        launch.assert_not_called()
        self.assertFalse(u.launch_active)

    def test_closed_gui_process_automatically_launches_controlled_copy(self):
        u=self.ui()
        local=mock.Mock()
        local.return_value.status.side_effect=[{"status":"GRIDCRAFT_OFFLINE"},{"status":"READY"}]
        u.refresh=mock.Mock(return_value="READY")
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"gridcraft_process_running",return_value=False), \
             mock.patch.object(agent,"locate_gridcraft_exe",return_value="C:/GridCraft/gridcraft.exe"), \
             mock.patch.object(agent,"start_gridcraft",return_value=mock.Mock(poll=lambda:None)) as launch:
            u.launch_on_login()
            self.assertTrue(u.launch_active)
            self.assertEqual(launch.call_count,1)
            # Simulate Tk callback scheduled after 2 seconds.
            u.root.scheduled[-1][1]()
        self.assertFalse(u.launch_active)
        self.assertEqual(launch.call_count,1)

    def test_changed_title_same_doc_uid_drops_stale_write_preview(self):
        u=self.ui()
        writer=mock.Mock()
        u._p4_writer=writer
        u._verified_grants([{"doc":"1","title":"Book1","dirty":False}])
        writer.invalidate_previews.assert_not_called()
        u._verified_grants([{"doc":"1","title":"new-file.xlsx","dirty":False}])
        writer.invalidate_previews.assert_called_once()
        self.assertEqual(u.allowed_docs,{"1"})

    def test_window_closed_clears_allowed_docs_and_previews(self):
        u=self.ui()
        writer=mock.Mock()
        u._p4_writer=writer
        u._verified_grants([{"doc":"1","title":"Book1"}])
        u._verified_grants([])
        self.assertEqual(u.allowed_docs,set())
        self.assertFalse(u.p4_write_enabled)
        writer.invalidate_previews.assert_called_once()

    def test_disconnect_invalidates_preview_even_without_title_change(self):
        u=self.ui()
        writer=mock.Mock()
        u._p4_writer=writer
        u._verified_grants([{"doc":"1","title":"Book1"}])
        with mock.patch.object(agent,"GridCraftLocal",side_effect=OSError("offline")):
            self.assertEqual(u._verified_grants(),set())
        writer.invalidate_previews.assert_called_once()

    def test_safe_writer_invalidation_drops_only_pending_previews(self):
        writer=P4SafeWriter.__new__(P4SafeWriter)
        writer._lock=threading.RLock()
        writer._previews={"fake-preview":{"doc":"1"}}
        writer.receipts=SimpleNamespace(seen={"previous-commit"})
        writer.invalidate_previews()
        self.assertEqual(writer._previews,{})
        self.assertEqual(writer.receipts.seen,{"previous-commit"})

    @unittest.skipUnless(os.name=="nt","Windows process command")
    def test_process_detection_parses_windows_tasklist_csv_safely(self):
        with mock.patch.object(agent.subprocess,"run",return_value=SimpleNamespace(
            returncode=0,stdout='"gridcraft.exe","6000","Console","1","30,000 K"\\n')):
            self.assertTrue(agent.gridcraft_process_running())
        with mock.patch.object(agent.subprocess,"run",return_value=SimpleNamespace(
            returncode=0,stdout='"INFO: No tasks are running which match the specified criteria."')):
            self.assertFalse(agent.gridcraft_process_running())
        with mock.patch.object(agent.subprocess,"run",side_effect=OSError("missing")):
            self.assertIsNone(agent.gridcraft_process_running())

if __name__=="__main__":unittest.main(verbosity=2)
