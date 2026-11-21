"""GridCraft v0.5.5 read-only tool candidate: workbook inspect, formula/display
read modes and side-effect-free formula evaluation.

Pure helpers shared by the local desktop adapter and the outbound worker. They
never open files, write cells or forward a local path, undo history or token.
Verified against GridCraft v0.19.1 `gridcraft-cli` headless:
- `document.inspect` returns `path` (absolute local path), `undo`/`redo` labels
  and `trust`; these are dropped here.
- `formulas.evaluate` returns a value without marking the workbook dirty or
  adding undo history.
- `=CELL("filename")` returns the absolute local file path, so information,
  web, cube and add-in functions are refused before evaluation.
"""
from __future__ import annotations

import math
import re

READ_MODES = frozenset({"values", "formulas", "formatted"})
MAX_FORMULA = 500
MAX_EVAL_CELLS = 200
MAX_TEXT = 2000
MAX_SHEETS = 50
MAX_TABLES = 20
MAX_NAMES = 50
MAX_CHARTS = 20

# Functions that can leak local paths/environment, reach the network, other
# workbooks or external data sources, or build references from text.
DENIED_FUNCTIONS = frozenset({
    "CELL", "INFO", "INDIRECT", "HYPERLINK",
    "WEBSERVICE", "FILTERXML", "ENCODEURL", "IMAGE", "STOCKHISTORY",
    "RTD", "DDE", "CALL", "REGISTER", "REGISTER.ID", "SQL.REQUEST", "EUROCONVERT",
    "CUBEKPIMEMBER", "CUBEMEMBER", "CUBEMEMBERPROPERTY", "CUBERANKEDMEMBER",
    "CUBESET", "CUBESETCOUNT", "CUBEVALUE", "PY", "COPILOT", "TRANSLATE", "DETECTLANGUAGE",
})
_FUNC = re.compile(r"([A-Za-z_][A-Za-z0-9_.]*)\s*\(")
_A1 = re.compile(r"^\$?[A-Z]{1,3}\$?[1-9][0-9]{0,5}$")


class ReadOnlyDenied(ValueError):
    """Safe, code-only refusal (never echoes workbook content)."""


def formula_guard(formula):
    if not isinstance(formula, str):
        raise ReadOnlyDenied("FORMULA_INVALID")
    if not formula.startswith("=") or len(formula) < 2 or len(formula) > MAX_FORMULA:
        raise ReadOnlyDenied("FORMULA_INVALID")
    if any(ord(c) < 32 for c in formula):
        raise ReadOnlyDenied("FORMULA_INVALID")
    # External workbook references, UNC/local paths and URLs.
    if "[" in formula or "\\" in formula or "://" in formula.lower():
        raise ReadOnlyDenied("FORMULA_EXTERNAL_DENIED")
    for raw in _FUNC.findall(formula):
        name = raw.upper()
        for prefix in ("_XLFN._XLWS.", "_XLFN.", "_XLWS."):
            if name.startswith(prefix):
                name = name[len(prefix):]
        if name in DENIED_FUNCTIONS or name.startswith("CUBE"):
            raise ReadOnlyDenied("FORMULA_FUNCTION_DENIED")
    return formula


def eval_cell_guard(cell):
    if cell is None:
        return None
    if not isinstance(cell, str) or not _A1.fullmatch(cell):
        raise ReadOnlyDenied("INVALID_CELL")
    return cell


def _scalar(v):
    if v is None or isinstance(v, bool):
        return v
    if isinstance(v, int):
        return v
    if isinstance(v, float):
        return v if math.isfinite(v) else None
    if isinstance(v, str):
        return v[:MAX_TEXT]
    if isinstance(v, dict) and set(v) == {"error"} and isinstance(v["error"], str):
        return {"error": v["error"][:32]}
    raise ReadOnlyDenied("RESULT_INVALID")


def bound_eval_value(value):
    """Scalar, error object or 2-D array of at most 200 cells."""
    if isinstance(value, list):
        rows = value if all(isinstance(r, list) for r in value) else [value]
        if sum(len(r) for r in rows) > MAX_EVAL_CELLS:
            raise ReadOnlyDenied("RESULT_LIMIT")
        return [[_scalar(c) for c in r] for r in rows]
    return _scalar(value)


def _text(v, n=100):
    return v[:n] if isinstance(v, str) else None


def _int(v):
    return v if isinstance(v, int) and not isinstance(v, bool) and 0 <= v < 10**12 else None


def sanitize_inspect(raw):
    """Allow-list a document.inspect reply. Drops path, undo/redo, trust,
    comment/link contents and any external-workbook name definition."""
    if not isinstance(raw, dict) or not isinstance(raw.get("sheets"), list):
        raise ReadOnlyDenied("RESULT_INVALID")
    sheets = []
    for s in raw["sheets"][:MAX_SHEETS]:
        if not isinstance(s, dict) or not isinstance(s.get("name"), str):
            continue
        tables = [{"name": _text(t.get("name"), 80), "range": _text(t.get("range"), 30),
                   "columns": [c[:80] for c in t.get("columns", [])[:30] if isinstance(c, str)],
                   "totals": t.get("totals") is True}
                  for t in (s.get("tables") or [])[:MAX_TABLES] if isinstance(t, dict)]
        charts = [{"kind": _text(c.get("kind"), 40), "title": _text(c.get("title"), 100),
                   "at": _text(c.get("at"), 12)}
                  for c in (s.get("charts") or [])[:MAX_CHARTS] if isinstance(c, dict)]
        freeze = s.get("freeze")
        sheets.append({
            "name": s["name"][:80],
            "used_range": _text(s.get("usedRange"), 30),
            "cells": _int(s.get("cells")),
            "visibility": _text(s.get("visibility"), 20),
            "protected": s.get("protected") is True,
            "tables": tables,
            "charts": charts,
            "merges": len(s["merges"]) if isinstance(s.get("merges"), list) else 0,
            "conditional_formats": _int(s.get("conditionalFormats")),
            "validations": _int(s.get("validations")),
            "comments": _int(s.get("comments")),
            "freeze": freeze if (isinstance(freeze, list) and len(freeze) == 2
                                 and all(_int(x) is not None for x in freeze)) else None,
        })
    names = []
    for n in (raw.get("names") or [])[:MAX_NAMES]:
        if not isinstance(n, dict) or not isinstance(n.get("name"), str):
            continue
        refers = n.get("refersTo")
        if not isinstance(refers, str) or len(refers) > 200 or "[" in refers or "\\" in refers:
            refers = None  # hide external/oversized definitions, keep the name
        names.append({"name": n["name"][:80], "refers_to": refers,
                      "scope": _text(n.get("scope"), 80)})
    active = raw.get("activeSheet")
    active_name = (sheets[active]["name"] if isinstance(active, int) and not isinstance(active, bool)
                   and 0 <= active < len(sheets) else None)
    title = _text(raw.get("title"), 100)
    if title and ("\\" in title or "/" in title):
        title = re.split(r"[\\/]", title)[-1][:100]
    return {"title": title, "dirty": raw.get("dirty") is True,
            "calc_mode": _text(raw.get("calcMode"), 30), "active_sheet": active_name,
            "sheet_count": len(raw["sheets"]), "sheets": sheets, "names": names}
