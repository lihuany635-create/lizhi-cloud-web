"""Synthetic-only, read-only local GridCraft CLI probe safety tests."""
from __future__ import annotations
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

import test_p4_safe_save  # local-only shim outside the full GitHub repo
from gridcraft_p4_native_read_probe import probe_native_gridcraft
from gridcraft_p4_safe_write import P4Denied
from test_xlsx_fidelity import zipped, synthetic_parts


class ProbeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)/"P4SafeExports"
        self.root.mkdir()
        (self.root/"copy.xlsx").write_bytes(zipped(synthetic_parts()))
        self.binary = Path(self.tmp.name)/"gridcraft-cli.exe"
        self.binary.write_bytes(b"synthetic test placeholder; subprocess is mocked")
        self.calls = []

    def _run(self, args, **kwargs):
        self.calls.append(args)
        if args[1] == "version":
            return mock.Mock(returncode=0,stdout=b"gridcraft-cli 0.19.1\n",stderr=b"")
        if args[1] == "info":
            return mock.Mock(returncode=0,stdout=b'{"sheets":[]}',stderr=b"")
        return mock.Mock(returncode=0,stdout=b'{"totals":{"files":1}}',stderr=b"")

    def test_read_only_cli_roundtrip(self):
        with mock.patch("gridcraft_p4_native_read_probe.subprocess.run",side_effect=self._run):
            reply=probe_native_gridcraft(self.root,"copy.xlsx",self.binary)
        self.assertEqual(reply["status"],"NATIVE_CLI_ROUNDTRIP_PASS")
        self.assertEqual(reply["native_gui_close_reopen"],"NOT_TESTED")
        self.assertFalse(reply["source_document_saved"])
        self.assertEqual([x[1] for x in self.calls],["version","info","check"])
        for argv in self.calls:
            self.assertNotIn("app.save",argv)
            self.assertNotIn("--out",argv)

    def test_native_check_failure_cannot_be_marked_success(self):
        def bad(args,**kwargs):
            if args[1]=="check":return mock.Mock(returncode=1,stdout=b'{"totals":{"files":1}}',stderr=b'private values not logged')
            return self._run(args,**kwargs)
        with mock.patch("gridcraft_p4_native_read_probe.subprocess.run",side_effect=bad):
            result=probe_native_gridcraft(self.root,"copy.xlsx",self.binary)
        self.assertEqual(result["status"],"NATIVE_CLI_FIDELITY_DIFFERENCES")

    def test_invalid_path_not_executed(self):
        with mock.patch("gridcraft_p4_native_read_probe.subprocess.run") as run:
            for name in ("../copy.xlsx","C:\\Windows\\file.xlsx","//host/a.xlsx","CON.xlsx"):
                with self.subTest(name=name),self.assertRaises(P4Denied):
                    probe_native_gridcraft(self.root,name,self.binary)
            run.assert_not_called()

    def test_does_not_follow_symlink(self):
        outside=Path(self.tmp.name)/"outside.xlsx"
        outside.write_bytes(b"SENSITIVE")
        link=self.root/"link.xlsx"
        try:link.symlink_to(outside)
        except (OSError,NotImplementedError):self.skipTest("symlink forbidden by OS")
        with mock.patch("gridcraft_p4_native_read_probe.subprocess.run") as run:
            with self.assertRaises(P4Denied):probe_native_gridcraft(self.root,"link.xlsx",self.binary)
            run.assert_not_called()

    def test_refuses_untrusted_executable_name(self):
        wrong=Path(self.tmp.name)/"not-gridcraft.exe"
        wrong.write_bytes(b"x")
        with mock.patch("gridcraft_p4_native_read_probe.subprocess.run") as run:
            with self.assertRaisesRegex(P4Denied,"NATIVE_CLI_NAME_DENIED"):
                probe_native_gridcraft(self.root,"copy.xlsx",wrong)
            run.assert_not_called()

    def test_refuses_incorrect_native_version(self):
        with mock.patch("gridcraft_p4_native_read_probe.subprocess.run",
                        return_value=mock.Mock(returncode=0,stdout=b"gridcraft-cli 0.20.0\n",stderr=b"")):
            with self.assertRaisesRegex(P4Denied,"NATIVE_CLI_VERSION_MISMATCH"):
                probe_native_gridcraft(self.root,"copy.xlsx",self.binary)

    def test_cli_timeout_no_retry(self):
        import subprocess
        with mock.patch("gridcraft_p4_native_read_probe.subprocess.run",side_effect=subprocess.TimeoutExpired("version",5)) as run:
            with self.assertRaisesRegex(P4Denied,"NATIVE_CLI_UNAVAILABLE"):
                probe_native_gridcraft(self.root,"copy.xlsx",self.binary)
            self.assertEqual(run.call_count,1)

    def test_invalid_json_does_not_leak_contents(self):
        def invalid(args,**kwargs):
            if args[1]=="version":return mock.Mock(returncode=0,stdout=b"gridcraft-cli 0.19.1\n",stderr=b"")
            return mock.Mock(returncode=0,stdout=b"PRIVATE.xlsx VALUES ...",stderr=b"")
        with mock.patch("gridcraft_p4_native_read_probe.subprocess.run",side_effect=invalid):
            with self.assertRaisesRegex(P4Denied,"NATIVE_CLI_INVALID_JSON"):
                probe_native_gridcraft(self.root,"copy.xlsx",self.binary)

if __name__=="__main__":unittest.main(verbosity=2)
