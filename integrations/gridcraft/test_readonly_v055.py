"""v0.5.5 read-only candidate tests. Offline: mock localhost GridCraft and mock
relay only; an optional native probe runs when GRIDCRAFT_CLI points at an
official gridcraft-cli (headless, synthetic sample workbook, no user files)."""
from __future__ import annotations

import json
import os
import socket
import subprocess
import tempfile
import threading
import unittest
from pathlib import Path

from gridcraft_desktop_local import GridCraftLocal
from gridcraft_outbound_worker import OutboundWorker, UnsafeJob, V055_READ_TOOLS
from gridcraft_readonly_v055 import (
    ReadOnlyDenied, bound_eval_value, formula_guard, sanitize_inspect)

RAW_INSPECT = {
    "activeCell": "A1", "activeSheet": 0, "calcMode": "Automatic", "dirty": True, "mode": "Ready",
    "names": [{"name": "TaxRate", "refersTo": "=0.05", "scope": None},
              {"name": "Ext", "refersTo": "='C:\\secret\\[x.xlsx]S'!A1", "scope": None}],
    "path": "C:\\Users\\someone\\Documents\\private.xlsx",
    "redo": ["Clear"], "undo": ["Typed 'salary 99999'"], "trust": "fromFile",
    "selection": "A1", "theme": "Craft", "title": "C:\\Users\\someone\\private.xlsx",
    "sheets": [{"name": "Budget", "usedRange": "B2:F15", "cells": 61, "visibility": "Visible",
                "protected": False, "freeze": [4, 0], "merges": ["E1:F1"], "comments": 0,
                "conditionalFormats": 2, "validations": 0,
                "tables": [{"name": "Budget1", "range": "B4:D10", "columns": ["Category", "Budget"],
                            "style": "TableStyleMedium2", "totals": False}],
                "charts": [{"at": "H3", "kind": "BarClustered", "title": "Budget vs Actual", "id": 1}]}],
}


class FormulaGuardTests(unittest.TestCase):
    def test_ordinary_formulas_allowed(self):
        for f in ("=SUM(C5:C10)", "=AVERAGE(Budget!C5:C10)*2", "=IF(A1>0,\"yes\",\"no\")",
                  "=XLOOKUP(A1,B:B,C:C)", "=1/0", "=TaxRate*100"):
            self.assertEqual(formula_guard(f), f)

    def test_path_network_and_external_functions_denied(self):
        for f in ('=CELL("filename")', '=cell("filename",A1)', '=INFO("directory")',
                  '=WEBSERVICE("x.test/?"&A1)', '=_xlfn.WEBSERVICE("u")', '=FILTERXML(A1,"//a")',
                  '=INDIRECT("A"&B1)', '=HYPERLINK("u")', '=CUBEVALUE("c")', '=RTD("p",,"t")',
                  '=SUM(1,CALL("x"))', '=_xlfn._xlws.PY("x")', '=IMAGE("u")'):
            with self.assertRaises(ReadOnlyDenied, msg=f) as ctx:
                formula_guard(f)
            self.assertEqual(str(ctx.exception), "FORMULA_FUNCTION_DENIED")

    def test_external_references_and_shape_denied(self):
        for f, code in (("=[other.xlsx]Sheet1!A1", "FORMULA_EXTERNAL_DENIED"),
                        ("='C:\\x\\[a.xlsx]S'!A1", "FORMULA_EXTERNAL_DENIED"),
                        ('="http://x"', "FORMULA_EXTERNAL_DENIED"),
                        ("SUM(A1)", "FORMULA_INVALID"), ("=", "FORMULA_INVALID"),
                        ("=1+\n1", "FORMULA_INVALID"), ("=" + "1+" * 300 + "1", "FORMULA_INVALID"),
                        (None, "FORMULA_INVALID")):
            with self.assertRaises(ReadOnlyDenied) as ctx:
                formula_guard(f)
            self.assertEqual(str(ctx.exception), code)


class SanitizeTests(unittest.TestCase):
    def test_drops_path_history_trust_and_external_names(self):
        out = sanitize_inspect(RAW_INSPECT)
        text = json.dumps(out, ensure_ascii=False)
        for leaked in ("C:\\\\", "salary", "Clear", "fromFile", "secret", "someone"):
            self.assertNotIn(leaked, text)
        self.assertEqual(out["title"], "private.xlsx")
        self.assertEqual(out["active_sheet"], "Budget")
        self.assertEqual(out["sheets"][0]["used_range"], "B2:F15")
        self.assertEqual(out["sheets"][0]["merges"], 1)
        self.assertEqual(out["sheets"][0]["tables"][0]["name"], "Budget1")
        self.assertEqual([n["refers_to"] for n in out["names"]], ["=0.05", None])
        self.assertNotIn("path", out)
        self.assertNotIn("undo", out)

    def test_invalid_reply_rejected(self):
        with self.assertRaises(ReadOnlyDenied):
            sanitize_inspect({"sheets": "x"})

    def test_eval_value_bounds(self):
        self.assertEqual(bound_eval_value(3195.0), 3195.0)
        self.assertEqual(bound_eval_value({"error": "#DIV/0!"}), {"error": "#DIV/0!"})
        self.assertEqual(bound_eval_value([[1, 2], [3, 4]]), [[1, 2], [3, 4]])
        self.assertEqual(bound_eval_value([1, 2]), [[1, 2]])
        with self.assertRaises(ReadOnlyDenied):
            bound_eval_value([[0] * 20] * 11)
        self.assertEqual(len(bound_eval_value("x" * 5000)), 2000)


class MultiMock:
    """Serves several authenticated localhost connections (one request each)."""
    def __init__(self, inspect=None, eval_result=3195.0):
        self.server = socket.socket()
        self.server.bind(("127.0.0.1", 0))
        self.server.listen(8)
        self.server.settimeout(5)
        self.port = self.server.getsockname()[1]
        self.requests = []
        self.inspect = inspect or RAW_INSPECT
        self.eval_result = eval_result
        self.stop = False
        threading.Thread(target=self._serve, daemon=True).start()

    def _serve(self):
        while not self.stop:
            try:
                conn, _ = self.server.accept()
            except OSError:
                return
            with conn, conn.makefile("rwb") as f:
                hello = json.loads(f.readline())
                assert hello["method"] == "auth"
                f.write(b'{"id":0,"ok":true,"result":{"authenticated":true}}\n'); f.flush()
                cmd = json.loads(f.readline())
                self.requests.append(cmd)
                m = cmd["method"]
                result = ([{"doc": 42, "title": "Book1", "dirty": False}] if m == "window.list" else
                          self.inspect if m == "document.inspect" else
                          self.eval_result if m == "engine.execute" else
                          {"values": [["=A1*2"]]} if m == "sheet.read" else None)
                f.write(json.dumps({"id": 1, "ok": True, "result": result}).encode() + b"\n"); f.flush()

    def close(self):
        self.stop = True
        self.server.close()


class LocalAdapterTests(unittest.TestCase):
    def setUp(self):
        self.mock = MultiMock()
        self.tmp = tempfile.TemporaryDirectory()
        token = Path(self.tmp.name) / "control.token"
        token.write_text("t" * 32, encoding="utf-8")
        self.local = GridCraftLocal(port=self.mock.port, token_path=str(token))

    def tearDown(self):
        self.mock.close()
        self.tmp.cleanup()

    def test_inspect_is_sanitized_and_uses_numeric_doc(self):
        out = self.local.inspect_summary("42")
        self.assertNotIn("path", out)
        self.assertEqual(self.mock.requests[-1], {"id": 1, "method": "document.inspect", "params": {"doc": 42}})

    def test_evaluate_uses_only_formulas_evaluate(self):
        self.assertEqual(self.local.evaluate("42", "=SUM(C5:C10)"), 3195.0)
        req = self.mock.requests[-1]
        self.assertEqual(req["method"], "engine.execute")
        self.assertEqual(req["params"], {"command": "formulas.evaluate",
                                         "params": {"formula": "=SUM(C5:C10)"}, "doc": 42})

    def test_denied_formula_never_reaches_gridcraft(self):
        with self.assertRaises(ReadOnlyDenied):
            self.local.evaluate("42", '=CELL("filename")')
        self.assertEqual(self.mock.requests, [])

    def test_other_engine_commands_refused_locally(self):
        for cmd in ("cell.set", "app.save", "formulas.calculateNow", "data.removeDuplicates"):
            with self.assertRaises(PermissionError):
                self.local._request("engine.execute", {"command": cmd, "params": {}, "doc": 42})
        with self.assertRaises(PermissionError):
            self.local._request("engine.execute", {"command": "formulas.evaluate", "params": {"formula": "=1"}})
        self.assertEqual(self.mock.requests, [])

    def test_unopened_doc_refused(self):
        with self.assertRaises(Exception):
            self.local.inspect_summary("43")
        self.assertEqual([r["method"] for r in self.mock.requests], ["window.list"])

    def test_formatted_and_formulas_are_exclusive(self):
        self.local.read_range("Budget", "A1:B2", doc="42", formatted=True)
        self.assertEqual(self.mock.requests[-1]["params"],
                         {"sheet": "Budget", "range": "A1:B2", "formatted": True, "doc": 42})
        with self.assertRaises(ValueError):
            self.local.read_range("Budget", "A1:B2", doc="42", formulas=True, formatted=True)


class FakeLocal:
    def __init__(self):
        self.calls = []

    def status(self):
        return {"status": "READY"}

    def inspect_summary(self, doc):
        self.calls.append(("inspect", doc))
        return sanitize_inspect(RAW_INSPECT)

    def evaluate(self, doc, formula, cell=None):
        formula_guard(formula)
        self.calls.append(("evaluate", doc, formula, cell))
        return [[1, 2]] if formula == "=A1:B1" else 3195.0

    def read_range(self, sheet, rng, doc=None, formulas=False, formatted=False):
        self.calls.append(("read", doc, sheet, rng, formulas, formatted))
        return {"values": [[1]]}


class Relay:
    def __init__(self, job):
        self.job = job
        self.completions = []

    def heartbeat(self, status):
        return {"state": status}

    def poll(self):
        return {"job": self.job}

    def complete(self, rid, result):
        self.completions.append(result)
        return {"accepted": True}


class WorkerRouteTests(unittest.TestCase):
    def worker(self, docs=("42",)):
        self.local = FakeLocal()
        return OutboundWorker(transport=None, local=self.local, approved_docs=set(docs))

    def test_tool_names(self):
        self.assertEqual(V055_READ_TOOLS, {"gridcraft_inspect_workbook", "gridcraft_evaluate_formula"})

    def test_inspect_requires_grant(self):
        w = self.worker()
        out = w.execute_job({"name": "gridcraft_inspect_workbook", "args": {"doc": "42"}})
        self.assertTrue(out["ok"])
        self.assertEqual(out["workbook"]["sheets"][0]["name"], "Budget")
        with self.assertRaisesRegex(UnsafeJob, "WORKBOOK_NOT_GRANTED"):
            w.execute_job({"name": "gridcraft_inspect_workbook", "args": {"doc": "43"}})
        with self.assertRaisesRegex(UnsafeJob, "INVALID_ARGS"):
            w.execute_job({"name": "gridcraft_inspect_workbook", "args": {"doc": "42", "path": "C:\\x"}})

    def test_evaluate_routes_and_bounds(self):
        w = self.worker()
        out = w.execute_job({"name": "gridcraft_evaluate_formula", "args": {"doc": "42", "formula": "=SUM(C5:C10)"}})
        self.assertEqual((out["value"], out["sheet_changed"]), (3195.0, False))
        out = w.execute_job({"name": "gridcraft_evaluate_formula", "args": {"doc": "42", "formula": "=A1:B1"}})
        self.assertEqual(out["value"], [[1, 2]])
        with self.assertRaisesRegex(UnsafeJob, "WORKBOOK_NOT_GRANTED"):
            w.execute_job({"name": "gridcraft_evaluate_formula", "args": {"doc": "43", "formula": "=1"}})

    def test_denied_formula_returns_safe_code_via_run_once(self):
        w = self.worker()
        w.transport = Relay({"id": "req-12345678", "name": "gridcraft_evaluate_formula",
                             "args": {"doc": "42", "formula": '=CELL("filename")'},
                             "expiresAt": 10**15})
        w.run_once()
        self.assertEqual(w.transport.completions[-1], {"ok": False, "error": "FORMULA_FUNCTION_DENIED"})

    def test_read_modes_and_legacy_shape(self):
        w = self.worker()
        legacy = w.execute_job({"name": "gridcraft_read_range", "args": {"doc": "42", "sheet": "S", "range": "A1:B2"}})
        self.assertNotIn("mode", legacy)
        self.assertEqual(self.local.calls[-1], ("read", "42", "S", "A1:B2", False, False))
        w.execute_job({"name": "gridcraft_read_range", "args": {"doc": "42", "sheet": "S", "range": "A1", "mode": "formulas"}})
        self.assertEqual(self.local.calls[-1][-2:], (True, False))
        out = w.execute_job({"name": "gridcraft_read_range", "args": {"doc": "42", "sheet": "S", "range": "A1", "mode": "formatted"}})
        self.assertEqual((self.local.calls[-1][-2:], out["mode"]), ((False, True), "formatted"))
        with self.assertRaisesRegex(UnsafeJob, "INVALID_MODE"):
            w.execute_job({"name": "gridcraft_read_range", "args": {"doc": "42", "sheet": "S", "range": "A1", "mode": "raw"}})
        with self.assertRaisesRegex(UnsafeJob, "RANGE_LIMIT"):
            w.execute_job({"name": "gridcraft_read_range", "args": {"doc": "42", "sheet": "S", "range": "A1:Z100", "mode": "formulas"}})


@unittest.skipUnless(os.environ.get("GRIDCRAFT_CLI"), "set GRIDCRAFT_CLI to an official gridcraft-cli")
class NativeHeadlessProbe(unittest.TestCase):
    """Official engine, synthetic sample only: evaluate leaves no undo/dirty, and
    the real inspect reply is fully sanitized."""
    def run_script(self, lines, workdir):
        script = Path(workdir) / "s.jsonl"
        script.write_text("\n".join(lines) + "\n", encoding="utf-8")
        out = subprocess.run([os.environ["GRIDCRAFT_CLI"], "run", "--sample", "budget", "--script", str(script)],
                             capture_output=True, text=True, timeout=120, check=True).stdout
        return [json.loads(l) for l in out.splitlines() if l.startswith("{")]

    def test_evaluate_is_side_effect_free_and_inspect_sanitized(self):
        with tempfile.TemporaryDirectory() as d:
            res = self.run_script(['formulas.evaluate={"formula":"=SUM(C5:C10)"}',
                                   'formulas.evaluate={"formula":"=C5*2","cell":"H20"}',
                                   'document.inspect={}'], d)
        self.assertEqual(res[0]["result"], 3195.0)
        raw = res[-1]["result"]
        self.assertEqual((raw["dirty"], raw["undo"]), (False, []))
        clean = sanitize_inspect(raw)
        self.assertNotIn("path", clean)
        self.assertEqual(clean["sheets"][0]["name"], "Budget")


if __name__ == "__main__":
    unittest.main()
