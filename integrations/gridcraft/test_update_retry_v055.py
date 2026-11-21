"""v0.5.5 self-update: retry a briefly locked installed EXE and never leave the
owner with no agent. Temp files and mocks only; nothing is launched."""
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import gridcraft_win_lifecycle as lc


class UpdateRetryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        d = Path(self.tmp.name)
        self.source = d / "new.exe"
        self.target = d / "installed" / "LizhiGridCraftAgent.exe"
        self.source.write_bytes(b"new")
        self.target.parent.mkdir()
        self.target.write_bytes(b"old")
        self.patches = [mock.patch.object(lc.sys, "frozen", True, create=True),
                        mock.patch.object(lc.os, "name", "nt"),
                        mock.patch.object(lc, "signal_quit_and_wait", return_value=True),
                        mock.patch.object(lc, "_sleep"),
                        mock.patch.object(lc.subprocess, "Popen")]
        for p in self.patches:
            p.start()
        self.popen = lc.subprocess.Popen

    def tearDown(self):
        for p in reversed(self.patches):
            p.stop()
        self.tmp.cleanup()

    def test_locked_target_is_retried_then_replaced(self):
        real = os.replace
        calls = {"n": 0}
        def flaky(a, b):
            calls["n"] += 1
            if calls["n"] < 4:
                raise PermissionError(32, "in use")
            return real(a, b)
        with mock.patch.object(lc.os, "replace", side_effect=flaky):
            self.assertTrue(lc.maybe_update_installed(self.source, self.target))
        self.assertEqual(self.target.read_bytes(), b"new")
        self.assertEqual(calls["n"], 4)
        self.popen.assert_called_once()
        self.assertFalse(self.target.with_suffix(".update.tmp").exists())

    def test_persistent_lock_relaunches_old_agent(self):
        with mock.patch.object(lc.os, "replace", side_effect=PermissionError(32, "in use")):
            with self.assertRaisesRegex(lc.WinLifecycleError, "AGENT_UPDATE_FAILED"):
                lc.maybe_update_installed(self.source, self.target)
        self.assertEqual(self.target.read_bytes(), b"old")
        self.popen.assert_called_once()
        self.assertEqual(self.popen.call_args.args[0], [str(self.target.resolve()), "--minimized"])
        self.assertFalse(self.target.with_suffix(".update.tmp").exists())

    def test_same_binary_needs_no_update(self):
        self.source.write_bytes(b"old")
        self.assertFalse(lc.maybe_update_installed(self.source, self.target))
        self.popen.assert_not_called()


if __name__ == "__main__":
    unittest.main()
