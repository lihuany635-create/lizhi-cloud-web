"""GridCraft v0.5.1 auto-launch recovery tests, synthetic local process only."""
from __future__ import annotations
import os
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock

import gridcraft_windows_agent as agent

from gridcraft_test_isolation import isolate_app_directory, restore_app_directory


def setUpModule():
    isolate_app_directory()


def tearDownModule():
    restore_app_directory()

class Var:
    def __init__(self, value=""): self.value=value
    def set(self, value): self.value=value
    def get(self): return self.value

class Root:
    def __init__(self): self.scheduled=[]
    def after(self, ms, callback): self.scheduled.append((ms,callback))
    def tick(self):
        delay,fn=self.scheduled.pop(0)
        fn()
        return delay

class Process:
    def __init__(self, exit_code=None): self.exit_code=exit_code
    def poll(self): return self.exit_code

class StartupTests(unittest.TestCase):
    def setUp(self):
        # Synthetic CI must never change the runner's real saved agent settings.
        patch=mock.patch.object(agent,"save_settings")
        patch.start()
        self.addCleanup(patch.stop)

    def agent(self,path=""):
        ui=agent.AgentUI.__new__(agent.AgentUI)
        ui.root=Root()
        ui.path_var=Var(path)
        ui.status_var=Var()
        ui.settings={}
        ui.remote_stop=threading.Event()
        ui.running=True
        ui.launch_active=False
        ui.launch_attempts=0
        ui.launch_polls=0
        ui.launch_process=None
        ui.launch_error=""
        return ui

    def local(self, statuses):
        values=list(statuses)
        class Local:
            def __init__(self,**kwargs):pass
            def status(self):
                if values: self.last=values.pop(0)
                return {"status":self.last}
            last="GRIDCRAFT_OFFLINE"
        return Local

    def test_auto_locate_known_install_location_only(self):
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/"ArtCraft"/"GridCraft"/"gridcraft.exe"
            target.parent.mkdir(parents=True)
            target.write_bytes(b"synthetic executable")
            with mock.patch.dict(os.environ,{"PROGRAMFILES":directory,"ProgramW6432":directory}):
                self.assertEqual(agent.locate_gridcraft_exe(""),target.resolve())
                self.assertEqual(agent.locate_gridcraft_exe("C:/missing/gridcraft.exe"),target.resolve())

    def test_start_once_then_detect_ready_without_more_launches(self):
        ui=self.agent()
        local=self.local(["GRIDCRAFT_OFFLINE","READY"])
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"locate_gridcraft_exe",return_value=Path("gridcraft.exe")), \
             mock.patch.object(agent,"start_gridcraft",return_value=Process()) as launch, \
             mock.patch.object(agent.AgentUI,"refresh") as refresh:
            ui.launch_on_login()
            self.assertTrue(ui.launch_active)
            self.assertEqual(ui.launch_attempts,1)
            self.assertEqual(ui.root.scheduled[0][0],agent.LAUNCH_POLL_MS)
            ui.root.tick()
            self.assertFalse(ui.launch_active)
            self.assertEqual(ui.launch_attempts,1)
            launch.assert_called_once()
            refresh.assert_called_once()

    def test_no_duplicate_spawn_when_first_process_is_running(self):
        ui=self.agent()
        local=self.local(["GRIDCRAFT_OFFLINE"]*5)
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"locate_gridcraft_exe",return_value=Path("gridcraft.exe")), \
             mock.patch.object(agent,"start_gridcraft",return_value=Process(None)) as launch:
            ui.launch_on_login()
            for _ in range(4):ui.root.tick()
            self.assertEqual(ui.launch_attempts,1)
            launch.assert_called_once()

    def test_exited_child_can_restart_but_only_up_to_three_attempts(self):
        ui=self.agent()
        local=self.local(["GRIDCRAFT_OFFLINE"]*40)
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"locate_gridcraft_exe",return_value=Path("gridcraft.exe")), \
             mock.patch.object(agent,"start_gridcraft",side_effect=lambda _path:Process(1)) as launch:
            ui.launch_on_login()
            for _ in range(25):
                if ui.root.scheduled: ui.root.tick()
            self.assertEqual(ui.launch_attempts,agent.LAUNCH_MAX_ATTEMPTS)
            self.assertEqual(launch.call_count,agent.LAUNCH_MAX_ATTEMPTS)
            self.assertFalse(ui.launch_active)
            self.assertIn("自動啟動未成功",ui.status_var.get())

    def test_control_error_while_initializing_does_not_create_second_instance(self):
        ui=self.agent()
        local=self.local(["CONTROL_ERROR","CONTROL_ERROR","GRIDCRAFT_OFFLINE","READY"])
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"locate_gridcraft_exe",return_value=Path("gridcraft.exe")), \
             mock.patch.object(agent,"start_gridcraft",return_value=Process()) as launch, \
             mock.patch.object(agent.AgentUI,"refresh"):
            ui.launch_on_login()
            self.assertEqual(ui.launch_attempts,0)
            ui.root.tick()
            self.assertEqual(ui.launch_attempts,0)
            ui.root.tick()
            self.assertEqual(ui.launch_attempts,1)
            ui.root.tick()
            self.assertFalse(ui.launch_active)
            launch.assert_called_once()

    def test_unauthorized_control_is_not_auto_overwritten(self):
        ui=self.agent()
        local=self.local(["UNAUTHORIZED"])
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"start_gridcraft") as launch:
            ui.launch_on_login()
            self.assertFalse(ui.launch_active)
            self.assertEqual(ui.root.scheduled,[])
            launch.assert_not_called()
            self.assertIn("認證失效",ui.status_var.get())

    def test_missing_executable_is_reported_without_launch(self):
        ui=self.agent()
        local=self.local(["GRIDCRAFT_OFFLINE"])
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"locate_gridcraft_exe",return_value=None), \
             mock.patch.object(agent,"start_gridcraft") as launch:
            ui.launch_on_login()
            self.assertFalse(ui.launch_active)
            self.assertIn("找不到 GridCraft.exe",ui.status_var.get())
            launch.assert_not_called()

    def test_stop_agent_cancels_pending_auto_launch(self):
        ui=self.agent()
        local=self.local(["CONTROL_ERROR","GRIDCRAFT_OFFLINE"])
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"start_gridcraft") as launch:
            ui.launch_on_login()
            ui.remote_stop.set()
            ui.root.tick()
            self.assertFalse(ui.launch_active)
            launch.assert_not_called()

    def test_existing_ready_instance_is_not_restarted(self):
        ui=self.agent()
        local=self.local(["READY"])
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"start_gridcraft") as launch, \
             mock.patch.object(agent.AgentUI,"refresh") as refresh:
            ui.launch_on_login()
            self.assertFalse(ui.launch_active)
            self.assertEqual(ui.root.scheduled,[])
            launch.assert_not_called()
            refresh.assert_called_once()

    def test_failed_spawn_reports_but_bounded_retries(self):
        ui=self.agent()
        local=self.local(["GRIDCRAFT_OFFLINE"]*50)
        with mock.patch.object(agent,"GridCraftLocal",local), \
             mock.patch.object(agent,"locate_gridcraft_exe",return_value=Path("gridcraft.exe")), \
             mock.patch.object(agent,"start_gridcraft",side_effect=OSError("synthetic failure")) as launch:
            ui.launch_on_login()
            for _ in range(20):
                if ui.root.scheduled: ui.root.tick()
            self.assertEqual(launch.call_count,agent.LAUNCH_MAX_ATTEMPTS)
            self.assertFalse(ui.launch_active)
            self.assertIn("OSError",ui.status_var.get())

if __name__ == "__main__":
    unittest.main(verbosity=2)
