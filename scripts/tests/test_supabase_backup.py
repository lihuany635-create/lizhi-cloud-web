import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

MODULE = Path(__file__).resolve().parent / "supabase_backup.py"
if not MODULE.exists():
    MODULE = Path(__file__).resolve().parents[1] / "supabase_backup.py"
spec = importlib.util.spec_from_file_location("backup", MODULE)
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class BackupSafetyTests(unittest.TestCase):
    def test_only_original_session_pooler_is_accepted(self):
        valid = "postgresql://postgres.hrdzywkihfqggiwjgavi:fake%40password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
        self.assertEqual(backup.validate_url(valid).port, 5432)
        for bad in [valid.replace(":5432", ":6543"), valid.replace("hrdzywkihfqggiwjgavi", "other"),
                    valid.replace("pooler.supabase.com", "attacker.example"), valid + "?sslmode=disable",
                    valid + "#fragment", valid.replace("/postgres", "/other")]:
            with self.subTest(url=bad), self.assertRaises(ValueError):
                backup.validate_url(bad)

    def test_subprocess_error_does_not_reveal_output(self):
        with self.assertRaisesRegex(RuntimeError, "private output suppressed") as err:
            backup.run([__import__('sys').executable, "-c", "import sys; print('PRIVATE-ROW'); sys.stderr.write('PRIVATE-URI'); sys.exit(1)"])
        self.assertNotIn("PRIVATE", str(err.exception))

    def test_tar_traversal_and_links_rejected(self):
        for name, kind in [("../escape", tarfile.REGTYPE), ("/absolute", tarfile.REGTYPE),
                           ("link", tarfile.SYMTYPE)]:
            with tempfile.TemporaryDirectory() as tmp:
                archive = Path(tmp) / "bad.tar"
                with tarfile.open(archive, "w") as tf:
                    info = tarfile.TarInfo(name)
                    info.type = kind
                    info.linkname = "../escape"
                    tf.addfile(info)
                with self.assertRaises(ValueError):
                    backup.extract_checked(archive, Path(tmp) / "out")

    def test_digest_detects_changed_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "file"
            p.write_bytes(b"before")
            old = backup.digest(p)
            p.write_bytes(b"after")
            self.assertNotEqual(old, backup.digest(p))

    def test_inventory_catalog_query_extracts_as_static_sql(self):
        calls = []
        def local_sql(query, db):
            calls.append((query, db))
            return b"[]\n"
        result = backup.local_inventory(local_sql)
        self.assertEqual(result, {"tables": {}, "objects": []})
        self.assertEqual(len(calls), 2)
        self.assertIn("pg_get_functiondef", calls[1][0])
        self.assertTrue(all(db == "postgres" for _, db in calls))

    def test_inventory_detects_table_contents_and_rls(self):
        answers = iter([json.dumps([{"s":"public","t":"sample","r":True,"f":False}]).encode(),
                        b"abc\ndef\n", b"[]"])
        result = backup.local_inventory(lambda *args: next(answers))
        row = result['tables']['public.sample']
        self.assertEqual(row[0], 2)
        self.assertEqual(row[2:], [True, False])


if __name__ == "__main__":
    unittest.main()

