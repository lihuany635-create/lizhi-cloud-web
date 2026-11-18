"""Portable Windows GridCraft agent tests; no real registry or user workbook touched."""
from __future__ import annotations

from contextlib import nullcontext
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main
from unittest import mock
import json
import os

import gridcraft_windows_agent as agent


class FakeRegistry:
    HKEY_CURRENT_USER = object()
    KEY_SET_VALUE = 1
    REG_SZ = 1

    def __init__(self):
        self.values = {}

    def CreateKeyEx(self, *_args):
        return nullcontext(self)

    def OpenKey(self, *_args):
        return nullcontext(self)

    def SetValueEx(self, _key, name, _reserved, _type, value):
        self.values[name] = value

    def QueryValueEx(self, _key, name):
        if name not in self.values:
            raise FileNotFoundError
        return self.values[name], self.REG_SZ

    def DeleteValue(self, _key, name):
        if name not in self.values:
            raise FileNotFoundError
        del self.values[name]


class WindowsAgentTests(TestCase):
    def test_packed_binary_diagnostic_safe(self):
        self.assertEqual(agent.diagnostic(), 0)

    def test_settings_are_local_and_roundtrip(self):
        with TemporaryDirectory() as d:
            target = Path(d) / "settings.json"
            agent.save_settings({"gridcraft_path": "C:/GridCraft/gridcraft.exe",
                                 "start_gridcraft_on_login": True,
                                 "secret": "never-stored"}, target)
            raw = target.read_text(encoding="utf-8")
            self.assertNotIn("never-stored", raw)
            self.assertNotIn("secret", raw)
            setting = agent.load_settings(target)
            self.assertTrue(setting["start_gridcraft_on_login"])
            self.assertEqual(setting["gridcraft_path"], "C:/GridCraft/gridcraft.exe")
            target.write_text("broken json", encoding="utf-8")
            self.assertEqual(agent.load_settings(target), {})

    def test_launch_only_user_selected_gridcraft_executable(self):
        with TemporaryDirectory() as d:
            exe = Path(d) / "gridcraft.exe"
            exe.write_bytes(b"fake-test-only-no-execution")
            with mock.patch.object(agent.subprocess, "Popen") as popen:
                agent.start_gridcraft(exe)
                popen.assert_called_once()
                args, kwargs = popen.call_args
                self.assertEqual(args[0], [str(exe.resolve()), "--control", "7979"])
                self.assertFalse(kwargs["shell"])
                self.assertEqual(Path(kwargs["cwd"]).resolve(), exe.resolve().parent)
            other = Path(d) / "powershell.exe"
            other.write_bytes(b"test")
            with self.assertRaises(ValueError):
                agent.start_gridcraft(other)

    def test_missing_exe_rejected(self):
        with self.assertRaises(FileNotFoundError):
            agent.safe_gridcraft_exe("x:\\no\\such\\gridcraft.exe")

    def test_hkcu_run_optin_install_and_revoke_mocked(self):
        if os.name != "nt":
            self.skipTest("Windows-specific HKCU semantics; CI runs on windows-2022")
        with TemporaryDirectory() as d:
            repo = Path(d)
            src = repo / "Download.exe"
            src.write_bytes(b"synthetic exe content")
            fake = FakeRegistry()
            with mock.patch.object(agent, "winreg", fake), mock.patch.object(agent, "app_directory", return_value=repo / "install"):
                self.assertFalse(agent.startup_enabled())
                target = agent.enable_startup(executable=src)
                self.assertEqual(target.read_bytes(), b"synthetic exe content")
                self.assertEqual(target.name, agent.APP_EXE_NAME)
                self.assertTrue(agent.startup_enabled())
                self.assertTrue(fake.values[agent.AUTOSTART_NAME].endswith('" --minimized'))
                agent.disable_startup()
                self.assertFalse(agent.startup_enabled())

    def test_no_startup_by_default_without_user_action(self):
        with mock.patch.object(agent, "enable_startup") as start:
            agent.load_settings(Path("nonexisting-for-test.json"))
            agent.diagnostic()
            start.assert_not_called()

    def test_agent_contains_no_remote_endpoint(self):
        content = (Path(__file__).parent / "gridcraft_windows_agent.py").read_text(encoding="utf-8")
        self.assertNotIn("https://", content)
        self.assertNotIn("http://", content)
        self.assertNotIn("service_role", content)


if __name__ == "__main__":
    main(verbosity=2)
