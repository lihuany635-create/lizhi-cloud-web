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
    def test_archived_sequence_set_sql_matches_valid_pg_restore(self):
        sql = """-- archive sequence statements
SELECT pg_catalog.setval('public.example_id_seq', 42, true);
SELECT pg_catalog.setval('auth.identities_id_seq', 8, false);
"""
        self.assertEqual(backup.parse_archived_sequence_setvals(sql), {
            "public.example_id_seq": 42, "auth.identities_id_seq": 8})

    def test_unrelated_source_drift_is_not_waived(self):
        expected = {"objects": [("sequence", "public.myseq",
                         '[\"owner\", \"bigint\", 1, 1, 999, 1, false, 1, 10]'),
                       ("function", "public.other()", "ORIGINAL")]}
        actual = {"objects": [("sequence", "public.myseq",
                       '[\"owner\", \"bigint\", 1, 1, 999, 1, false, 1, 11]'),
                       ("function", "public.other()", "DIFFERENT")]}
        count = backup.reconcile_sequence_snapshot_with_archive(
            expected, actual, {"public.myseq": 11})
        self.assertEqual(count, 1)
        self.assertEqual(expected["objects"][0][2], actual["objects"][0][2])
        self.assertNotEqual(expected["objects"][1][2], actual["objects"][1][2])

    def test_archive_sequence_state_mismatch_fails_closed(self):
        expected = {"objects": [("sequence", "public.myseq",
                       '[\"owner\", \"bigint\", 1, 1, 999, 1, false, 1, 10]')]}
        actual = {"objects": [("sequence", "public.myseq",
                       '[\"owner\", \"bigint\", 1, 1, 999, 1, false, 1, 12]')]}
        with self.assertRaisesRegex(ValueError, "does not match"):
            backup.reconcile_sequence_snapshot_with_archive(expected, actual, {"public.myseq": 11})

    def test_sequence_schema_drift_rejected_even_if_last_value_matches(self):
        expected = {"objects": [("sequence", "public.myseq",
                       '[\"owner\", \"bigint\", 1, 1, 999, 1, false, 1, 10]')]}
        actual = {"objects": [("sequence", "public.myseq",
                       '[\"owner\", \"bigint\", 1, 1, 1000, 1, false, 1, 11]')]}
        backup.reconcile_sequence_snapshot_with_archive(expected, actual, {"public.myseq": 11})
        self.assertNotEqual(expected["objects"], actual["objects"])

    def test_missing_sequence_archive_entry_does_not_suppress_difference(self):
        expected = {"objects": [("sequence", "public.myseq",
                       '[\"owner\", \"bigint\", 1, 1, 999, 1, false, 1, 10]')]}
        actual = {"objects": [("sequence", "public.myseq",
                       '[\"owner\", \"bigint\", 1, 1, 999, 1, false, 1, 11]')]}
        self.assertEqual(backup.reconcile_sequence_snapshot_with_archive(
            expected, actual, {}), 0)
        self.assertNotEqual(expected["objects"], actual["objects"])

    def test_extra_archive_sequence_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "absent"):
            backup.reconcile_sequence_snapshot_with_archive(
                {"objects": []}, {"objects": []}, {"public.unknown_seq": 1})


    def test_restored_inventory_catalog_sql_ast_path(self):
        import ast
        source = (Path(__file__).resolve().parents[1] / "supabase_backup.py").read_text()
        tree = ast.parse(source)
        inventory = next(n for n in tree.body
                         if isinstance(n, ast.FunctionDef) and n.name == "inventory")
        assignment = next(n for n in inventory.body
                          if isinstance(n, ast.Assign)
                          and any(isinstance(t, ast.Name) and t.id == "objects"
                                  for t in n.targets))
        query = assignment.value.func.value.args[0].value
        self.assertIn("select kind, name, definition", query)
        self.assertIn("from pg_policies", query)

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
        self.assertEqual(result, {"tables": {}, "objects": [], "large_objects": []})
        self.assertEqual(len(calls), 3)
        self.assertIn("pg_get_functiondef", calls[1][0])
        self.assertTrue(all(db == "postgres" for _, db in calls))

    def test_inventory_detects_table_contents_and_rls(self):
        answers = iter([json.dumps([{"s":"public","t":"sample","r":True,"f":False}]).encode(),
                        b"abc\ndef\n", b"[]", b"[]"])
        result = backup.local_inventory(lambda *args: next(answers))
        row = result['tables']['public.sample']
        self.assertEqual(row[0], 2)
        self.assertEqual(row[2:], [True, False])

    def test_missing_secrets_stop_without_disclosing_values(self):
        for env in [{}, {"SUPABASE_DB_URL": "PRIVATE"}]:
            with self.assertRaisesRegex(ValueError, "missing") as err:
                backup.require_secrets(env)
            self.assertNotIn("PRIVATE", str(err.exception))

    def test_child_credentials_are_minimized(self):
        env = {"PATH": "safe", "SUPABASE_DB_URL": "uri", "LIZHI_BACKUP_PASSPHRASE": "key", "PGPASSWORD": "password"}
        self.assertEqual(backup.private_subprocess_env(env), {"PATH": "safe"})

    def test_large_object_content_and_permissions_are_compared(self):
        answers = iter([b"[]", b"[]", b'[{"oid":42,"octet_length":3,"md5":"abc","pg_get_userbyid":"owner","lomacl":null}]'])
        result = backup.local_inventory(lambda *args: next(answers))
        self.assertEqual(result['large_objects'], [[42, 3, 'abc', 'owner', None]])


if __name__ == "__main__":
    unittest.main()
