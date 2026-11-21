"""Read-only XLSX source inventory and fidelity comparison for GridCraft v0.5.4 P1.

No workbook data is changed, uploaded, recalculated, or guessed. This parser
uses the Python standard library OOXML layer so formula caches, shared formulas,
styles, and unknown package members remain visible rather than silently lost.
Only explicitly requested --show-values emits potentially private cell data.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import posixpath
import re
import sys
import zipfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PR = "http://schemas.openxmlformats.org/package/2006/relationships"
Q = lambda n: "{" + S + "}" + n
W = "xl/workbook.xml"
WB_RELS = "xl/_rels/workbook.xml.rels"
CONTENT_TYPES = "[Content_Types].xml"
MAX_ARCHIVE = 80 * 1024 * 1024
MAX_UNPACKED = 160 * 1024 * 1024
MAX_PART = 64 * 1024 * 1024
MAX_MEMBERS = 2000
# Real part paths are derived from the workbook relationship, not sheet1.xml.
CELL_RE = re.compile(r"^([A-Z]{1,3})([1-9][0-9]{0,6})$")
REF_RE = re.compile(r"(?<![A-Za-z0-9_.])(?P<sheet>(?:'(?:[^']|'')+'|[A-Za-z_][\w.]*)!)?(?P<col>\$?[A-Z]{1,3})(?P<row>\$?[1-9][0-9]{0,6})(?![A-Za-z0-9_.]|\s*\()")


class WorkbookInvalid(ValueError):
    """Invalid, unsupported, or unsafe workbook package."""


def xml(data: bytes) -> ET.Element:
    if b"<!DOCTYPE" in data.upper() or b"<!ENTITY" in data.upper():
        raise WorkbookInvalid("DTD/entity declarations are not supported")
    try:
        return ET.fromstring(data)
    except ET.ParseError as exc:
        raise WorkbookInvalid("malformed OOXML part") from exc


def canonical(el: ET.Element | None) -> str | None:
    if el is None:
        return None
    return ET.canonicalize(ET.tostring(el, encoding="unicode"), strip_text=False)


def sha(data: bytes | str) -> str:
    return hashlib.sha256(data.encode("utf-8") if isinstance(data, str) else data).hexdigest()


def valid_member(name: str) -> None:
    if (not name or name.startswith(("/", "\\")) or "\\" in name or
            any(p in ("", ".", "..") for p in name.split("/")) or ":" in name):
        raise WorkbookInvalid("unsafe ZIP member path")


def parts_from_bytes(data: bytes) -> dict[str, bytes]:
    if len(data) > MAX_ARCHIVE:
        raise WorkbookInvalid("XLSX archive exceeds size limit")
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            infos = [i for i in z.infolist() if not i.is_dir()]
            if len(infos) > MAX_MEMBERS:
                raise WorkbookInvalid("XLSX has too many parts")
            seen, total = set(), 0
            for i in infos:
                valid_member(i.filename)
                if i.filename in seen:
                    raise WorkbookInvalid("duplicate ZIP member")
                seen.add(i.filename)
                if i.file_size > MAX_PART:
                    raise WorkbookInvalid("XLSX member exceeds limit")
                total += i.file_size
                if total > MAX_UNPACKED:
                    raise WorkbookInvalid("XLSX expanded size exceeds limit")
                if i.file_size > 4096 and i.compress_size and i.file_size / i.compress_size > 1000:
                    raise WorkbookInvalid("suspicious ZIP compression ratio")
            parts = {i.filename: z.read(i.filename) for i in infos}
    except (zipfile.BadZipFile, OSError, EOFError) as exc:
        raise WorkbookInvalid("invalid ZIP archive") from exc
    if CONTENT_TYPES not in parts or W not in parts or WB_RELS not in parts:
        raise WorkbookInvalid("not a supported XLSX package")
    return parts


def rel_target(base: str, target: str) -> str:
    if not target or ":" in target or "\\" in target or target.startswith("//"):
        raise WorkbookInvalid("unsafe relationship target")
    result = posixpath.normpath(target.lstrip("/") if target.startswith("/")
                              else posixpath.join(posixpath.dirname(base), target))
    valid_member(result)
    return result


def col_number(col: str) -> int:
    n = 0
    for c in col:
        n = n * 26 + ord(c) - 64
    return n


def col_letter(n: int) -> str:
    if n < 1 or n > 16384:
        raise WorkbookInvalid("formula reference outside Excel column bounds")
    out = ""
    while n:
        n, d = divmod(n - 1, 26)
        out = chr(65 + d) + out
    return out


def address_pos(address: str) -> tuple[int, int]:
    m = CELL_RE.fullmatch(address)
    if not m:
        raise WorkbookInvalid("invalid cell reference")
    c, r = col_number(m[1]), int(m[2])
    if c > 16384 or r > 1048576:
        raise WorkbookInvalid("cell address exceeds XLSX bounds")
    return c, r


def shared_translate(expression: str, master: str, target: str) -> str:
    """Conservatively translate A1 references in a shared-formula follower.

    Handles relative/absolute refs and quoted strings; formulas with structured
    refs or external refs are marked unresolved by the caller, never guessed.
    """
    if "[" in expression or "]" in expression:
        raise WorkbookInvalid("shared formula uses structured/external reference")
    c0, r0 = address_pos(master)
    c1, r1 = address_pos(target)
    dc, dr = c1 - c0, r1 - r0
    segments = re.split(r'("(?:[^"]|"")*")', expression)

    def replace(m: re.Match[str]) -> str:
        c, r = m.group("col"), m.group("row")
        nc = col_number(c.lstrip("$")) + (0 if c.startswith("$") else dc)
        nr = int(r.lstrip("$")) + (0 if r.startswith("$") else dr)
        if not 1 <= nr <= 1048576:
            raise WorkbookInvalid("translated formula row out of bounds")
        return (m.group("sheet") or "") + ("$" if c.startswith("$") else "") + col_letter(nc) + ("$" if r.startswith("$") else "") + str(nr)

    return "".join(s if k % 2 else REF_RE.sub(replace, s) for k, s in enumerate(segments))


def text_in(si: ET.Element) -> str:
    return "".join((t.text or "") for t in list(si.findall(Q("t"))) + list(si.findall(f'{Q("r")}/{Q("t")}')))


def normalize_attrs(node: ET.Element | None, ignore: tuple[str, ...] = ()) -> tuple:
    return tuple(sorted((k, v) for k, v in node.attrib.items() if k not in ignore)) if node is not None else ()


class StyleResolver:
    def __init__(self, content: bytes | None):
        root = xml(content) if content is not None else ET.Element(Q("styleSheet"))
        self.components = {kind: (list(root.find(Q(kind))) if root.find(Q(kind)) is not None else [])
                           for kind in ("fonts", "fills", "borders", "cellXfs", "cellStyleXfs")}
        self.num_formats = {x.get("numFmtId"): x.get("formatCode")
                            for x in root.findall(f'{Q("numFmts")}/{Q("numFmt")}')}
        self.other = {x.tag.split("}")[-1]: canonical(x) for x in root
                      if x.tag.split("}")[-1] not in ("fonts", "fills", "borders", "cellXfs", "cellStyleXfs", "numFmts")}

    def signature(self, index: str | None) -> tuple:
        try:
            idx = int(index or "0")
            xf = self.components["cellXfs"][idx]
        except (ValueError, IndexError, TypeError):
            return ("INVALID_STYLE_INDEX", index)
        attrs = dict(xf.attrib)
        refs = []
        for key, pool in (("fontId", "fonts"), ("fillId", "fills"), ("borderId", "borders")):
            n = attrs.pop(key, "0")
            try:
                refs.append((key, canonical(self.components[pool][int(n)])))
            except (ValueError, IndexError):
                refs.append((key, ("INVALID_REFERENCE", n)))
        num = attrs.pop("numFmtId", "0")
        # Builtin formats are represented by their stable numeric IDs.
        refs.append(("numberFormat", self.num_formats.get(num, ("builtin", num))))
        cellxf = attrs.pop("xfId", "0")
        try:
            base = canonical(self.components["cellStyleXfs"][int(cellxf)])
        except (ValueError, IndexError):
            base = ("INVALID_REFERENCE", cellxf)
        return (tuple(sorted(attrs.items())), tuple(refs), canonical(xf.find(Q("alignment"))),
                canonical(xf.find(Q("protection"))), base)


@dataclass
class Inventory:
    path: str
    sha256: str
    stats: dict[str, Any]
    fields: dict[str, Any]
    warnings: list[str]


def inventory_bytes(data: bytes, path: str = "<memory>") -> Inventory:
    parts = parts_from_bytes(data)
    wb = xml(parts[W])
    rels = xml(parts[WB_RELS])
    relations = {x.get("Id"): x for x in rels.findall("{" + PR + "}Relationship")}
    sst: list[tuple[str, str]] = []
    for part, content in parts.items():
        if part.endswith("/sharedStrings.xml"):
            sst = [(text_in(x), canonical(x) or "") for x in xml(content).findall(Q("si"))]
    styles = StyleResolver(parts.get("xl/styles.xml"))
    fields: dict[str, Any] = {}
    warnings: list[str] = []
    recognized = {CONTENT_TYPES, W, WB_RELS, "xl/styles.xml", "xl/sharedStrings.xml"}
    stats = {"sheets": [], "cell_nodes": 0, "formula_nodes": 0,
             "shared_formula_followers": 0, "shared_formula_unresolved": 0,
             "merges": 0, "package_parts": len(parts)}
    props = wb.find(Q("workbookPr"))
    fields["workbook:date1904"] = props.get("date1904", "0") if props is not None else "0"
    fields["workbook:defined_names"] = tuple(sorted((x.get("name"), x.get("localSheetId"), x.text)
                                  for x in wb.findall(f'{Q("definedNames")}/{Q("definedName")}')))
    fields["workbook:calculation"] = canonical(wb.find(Q("calcPr")))
    seen_sheet_ids = set()
    ordered_sheets = []
    for sheet in wb.findall(f'{Q("sheets")}/{Q("sheet")}'):
        sheet_id, name, rid = sheet.get("sheetId"), sheet.get("name"), sheet.get("{" + R + "}id")
        if not sheet_id or sheet_id in seen_sheet_ids or not name or rid not in relations:
            raise WorkbookInvalid("invalid worksheet relationship")
        seen_sheet_ids.add(sheet_id)
        link = relations[rid]
        if not (link.get("Type") or "").endswith("/worksheet") or link.get("TargetMode") == "External":
            raise WorkbookInvalid("sheet relationship is not internal worksheet")
        target = rel_target(W, link.get("Target", ""))
        if target not in parts:
            raise WorkbookInvalid("worksheet part is missing")
        recognized.add(target)
        ordered_sheets.append((sheet_id, name, sheet.get("state", "visible")))
        stats["sheets"].append({"sheet_id": sheet_id, "name": name})
        key = f"sheet:{sheet_id}"
        root = xml(parts[target])
        dim = root.find(Q("dimension"))
        fields[f"{key}:dimension"] = dim.get("ref") if dim is not None else None
        fields[f"{key}:sheet_format"] = canonical(root.find(Q("sheetFormatPr")))
        fields[f"{key}:merges"] = tuple(sorted(x.get("ref") for x in root.findall(f'{Q("mergeCells")}/{Q("mergeCell")}')))
        stats["merges"] += len(fields[f"{key}:merges"])
        fields[f"{key}:columns"] = tuple(sorted((normalize_attrs(x), styles.signature(x.get("style")) if x.get("style") else None)
                                                 for x in root.findall(f'{Q("cols")}/{Q("col")}')))
        for row in root.findall(f'{Q("sheetData")}/{Q("row")}'):
            ridx = row.get("r")
            if not ridx:
                raise WorkbookInvalid("worksheet row number missing")
            attrs = normalize_attrs(row, ("r", "s"))
            if attrs or row.get("s") is not None:
                fields[f"{key}:row:{ridx}"] = (attrs, styles.signature(row.get("s")) if row.get("s") else None)
        # Record supported page/print properties separately; missing is different from empty.
        for tag in ("pageMargins", "pageSetup", "printOptions", "headerFooter", "rowBreaks",
                    "colBreaks", "sheetPr", "sheetViews", "sheetProtection", "autoFilter",
                    "conditionalFormatting", "dataValidations", "hyperlinks", "tableParts",
                    "drawing", "legacyDrawing"):
            nodes = root.findall(Q(tag))
            fields[f"{key}:{tag}"] = tuple(canonical(x) for x in nodes)
        formula_masters: dict[str, tuple[str, str]] = {}
        cells = root.findall(f'{Q("sheetData")}/{Q("row")}/{Q("c")}')
        for c in cells:
            f = c.find(Q("f"))
            if f is not None and f.get("t") == "shared" and f.text and f.get("si"):
                formula_masters[f.get("si")] = (c.get("r", ""), f.text)
        for c in cells:
            address = c.get("r")
            if not address:
                raise WorkbookInvalid("cell address missing")
            address_pos(address)
            stats["cell_nodes"] += 1
            f, v, inline = c.find(Q("f")), c.find(Q("v")), c.find(Q("is"))
            kind = c.get("t", "n")
            pfx = f"{key}:cell:{address}"
            fields[f"{pfx}:type"] = kind
            if v is not None:
                if kind == "s":
                    try:
                        stext, rich = sst[int(v.text or "")]
                    except (ValueError, IndexError):
                        raise WorkbookInvalid("shared string index out of bounds") from None
                    fields[f"{pfx}:value"] = ("shared_text", stext)
                    fields[f"{pfx}:richtext"] = rich
                else:
                    fields[f"{pfx}:value"] = ("raw", v.text)
            elif inline is not None:
                fields[f"{pfx}:value"] = ("inline_text", text_in(inline))
                fields[f"{pfx}:richtext"] = canonical(inline)
            else:
                fields[f"{pfx}:value"] = ("no_value", None)
            fields[f"{pfx}:style"] = styles.signature(c.get("s"))
            if f is not None:
                stats["formula_nodes"] += 1
                metadata = tuple(sorted((k, v) for k, v in f.attrib.items() if k not in ("si", "ref", "t")))
                fields[f"{pfx}:formula_attributes"] = metadata
                expr = f.text or ""
                if f.get("t") == "shared":
                    si = f.get("si")
                    if not si:
                        warnings.append(f"{pfx}: shared formula missing group index")
                    if not f.text:
                        stats["shared_formula_followers"] += 1
                        master = formula_masters.get(si or "")
                        if master:
                            try:
                                expr = shared_translate(master[1], master[0], address)
                            except WorkbookInvalid:
                                expr = ""
                                warnings.append(f"{pfx}: shared formula translation unsupported")
                        else:
                            warnings.append(f"{pfx}: shared formula master not found")
                        if not expr:
                            stats["shared_formula_unresolved"] += 1
                            fields[f"{pfx}:formula_unresolved"] = (si, f.get("t"))
                fields[f"{pfx}:formula"] = expr
                fields[f"{pfx}:formula_kind"] = f.get("t", "normal")
        # Correlate package parts via worksheet rels; binary drawing/print payloads remain opaque.
        relpath = posixpath.join(posixpath.dirname(target), "_rels", posixpath.basename(target) + ".rels")
        if relpath in parts:
            recognized.add(relpath)
            fields[f"{key}:relationships"] = tuple(sorted((x.get("Type"), x.get("Target"), x.get("TargetMode"))
                                      for x in xml(parts[relpath]).findall("{" + PR + "}Relationship")))
    fields["workbook:sheets"] = tuple(ordered_sheets)
    fields["styles:other"] = tuple(sorted(styles.other.items()))
    # Package fidelity guard: reveal any unknown/opaque parts through digest differences.
    # Keep docProps / drawing binaries / themes as opaque so no false full-fidelity PASS.
    fields["package:part_paths"] = tuple(sorted(parts))
    for part in sorted(set(parts) - recognized):
        fields[f"opaque:{part}"] = sha(parts[part])
    stats["opaque_parts"] = len(parts) - len(recognized)
    return Inventory(path, sha(data), stats, fields, sorted(set(warnings)))


def _category(key: str) -> str:
    if ":cell:" in key:
        return "cell_" + key.rsplit(":", 1)[-1]
    if key.startswith("opaque:"):
        return "opaque_package"
    if ":page" in key or ":headerFooter" in key or ":print" in key:
        return "page_print"
    if ":merges" in key:
        return "merge"
    if ":columns" in key or ":row:" in key:
        return "geometry"
    return "workbook_structure"


def compare(before: Inventory, after: Inventory, max_items: int = 300, show_values: bool = False) -> dict[str, Any]:
    diff, categories = [], Counter()
    missing = object()
    for key in sorted(before.fields.keys() | after.fields.keys()):
        old, new = before.fields.get(key, missing), after.fields.get(key, missing)
        if old == new:
            continue
        category = _category(key)
        categories[category] += 1
        if len(diff) < max_items:
            item: dict[str, Any] = {"key": key, "category": category,
                                    "before_present": key in before.fields,
                                    "after_present": key in after.fields}
            if show_values:
                item["before"] = "<missing>" if old is missing else str(old)[:500]
                item["after"] = "<missing>" if new is missing else str(new)[:500]
            diff.append(item)
    return {"status": "MATCH" if not categories else "DIFFERENT",
            "before": {"sha256": before.sha256, "stats": before.stats},
            "after": {"sha256": after.sha256, "stats": after.stats},
            "difference_count": sum(categories.values()),
            "categories": dict(sorted(categories.items())), "differences": diff,
            "truncated": sum(categories.values()) > max_items,
            "warnings": sorted(set(before.warnings + after.warnings)),
            "privacy": "VALUES_REDACTED" if not show_values else "VALUES_VISIBLE",
            "scope": "Read-only OOXML structural/source fidelity diff; not calculation, rendered-layout, native GridCraft save or app roundtrip proof"}


def inventory_file(path: Path) -> Inventory:
    if path.stat().st_size > MAX_ARCHIVE:
        raise WorkbookInvalid("XLSX archive exceeds size limit")
    return inventory_bytes(path.read_bytes(), str(path))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source", type=Path)
    ap.add_argument("target", type=Path)
    ap.add_argument("--json-out", type=Path)
    ap.add_argument("--show-values", action="store_true", help="Explicitly reveal private cell values in local report")
    ap.add_argument("--max-items", type=int, default=300)
    args = ap.parse_args(argv)
    if args.max_items < 0 or args.max_items > 10000:
        ap.error("max-items must be between 0 and 10000")
    try:
        result = compare(inventory_file(args.source), inventory_file(args.target), args.max_items, args.show_values)
    except (WorkbookInvalid, OSError) as exc:
        print(json.dumps({"status": "INVALID", "reason": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2
    output = json.dumps(result, ensure_ascii=False, indent=2)
    if args.json_out:
        args.json_out.write_text(output, encoding="utf-8")
    print(output)
    return 0 if result["status"] == "MATCH" and not result["warnings"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
