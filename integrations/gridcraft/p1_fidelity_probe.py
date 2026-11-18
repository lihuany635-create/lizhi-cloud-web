#!/usr/bin/env python3
"""P1: real GridCraft v0.19.1 import -> modify single cell -> save -> reopen; synthetic only."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import posixpath
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PKG = "{http://schemas.openxmlformats.org/package/2006/relationships}"
EXPECTED_SHA256 = "372da585170c730613e5c83cf78cf027a5815403a3d979eff57a6587fc3fec7f"

def invoke(cli, *args):
    p = subprocess.run([cli, *map(str, args)], capture_output=True, text=True, timeout=100)
    if p.returncode:
        raise RuntimeError(f"GridCraft exit {p.returncode}: {' '.join(args)}\n{p.stdout[-900:]}\n{p.stderr[-500:]}")
    return p.stdout

def load_sheet_info(path):
    with zipfile.ZipFile(path) as z:
        parts = set(z.namelist())
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        rmap = {r.get("Id"):r.get("Target") for r in rels.findall(PKG+"Relationship")}
        shared = []
        if "xl/sharedStrings.xml" in parts:
            sr = ET.fromstring(z.read("xl/sharedStrings.xml"))
            shared = ["".join(n.text or "" for n in si.iter(MAIN+"t")) for si in sr.findall(MAIN+"si")]
        output = {}
        titles = []
        for x in wb.find(MAIN+"sheets").findall(MAIN+"sheet"):
            title = x.get("name")
            titles.append(title)
            loc = rmap[x.get(REL+"id")]
            f = loc.lstrip("/") if loc.startswith("/") else posixpath.normpath(posixpath.join("xl",loc))
            root = ET.fromstring(z.read(f))
            vals = {}
            for c in root.iter(MAIN+"c"):
                v = c.find(MAIN+"v")
                fmla = c.find(MAIN+"f")
                inline = c.find(MAIN+"is")
                val = v.text if v is not None else None
                if inline is not None:
                    val = "".join(t.text or "" for t in inline.iter(MAIN+"t"))
                if c.get("t")=="s" and val is not None:
                    val = shared[int(val)]
                vals[c.get("r")]={"v":val, "f":fmla.text if fmla is not None else None, "t":c.get("t","")}
            merges = sorted(el.get("ref") for el in root.iter(MAIN+"mergeCell"))
            output[title]={"cells":vals,"merges":merges}
        return {"sheets":titles,"data":output,"parts":parts}

def check_gridcraft(cli, path, tag):
    info = json.loads(invoke(cli,"check",path,"--json"))
    t = info.get("totals",{})
    if t.get("opened",0)!=1 or t.get("failedToOpen",0)!=0:
        raise RuntimeError(f"{tag}: GridCraft could not open workbook: {t}")
    if t.get("roundTripDiffering",1)!=0:
        raise RuntimeError(f"{tag}: GridCraft reports round-trip differences: {t.get('categoriesDiffering')} (roundTripDiffering={t.get('roundTripDiffering')})")
    if t.get("mismatched",0)!=0:
        raise RuntimeError(f"{tag}: GridCraft cached formula result differs: {t}")
    print(f"PASS: {tag} GridCraft check --json: opened=1, roundTripDiffering=0, mismatched=0")

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--cli", required=True)
    p.add_argument("--fixture-b64", required=True)
    a=p.parse_args()
    raw=base64.b64decode(Path(a.fixture_b64).read_text().strip(),validate=True)
    digest=hashlib.sha256(raw).hexdigest()
    if digest!=EXPECTED_SHA256:
        raise RuntimeError(f"fixture SHA256 mismatch {digest}")
    with tempfile.TemporaryDirectory(prefix="lizhi-gridcraft-p1-") as tmp:
        source=Path(tmp)/"source.xlsx"
        output=Path(tmp)/"candidate.xlsx"
        source.write_bytes(raw)
        baseline=load_sheet_info(source)
        if baseline["sheets"] != ["估價清單","說明"]:
            raise RuntimeError(f"unexpected source sheets: {baseline['sheets']}")
        print("PASS: independent, artifact_tool-created XLSX fixture SHA256, names and layout")
        check_gridcraft(a.cli,source,"original input")
        invoke(a.cli,"run","--in",source,"--cmd",'cell.set={"cell":"B3","input":"2500"}',"--out",output)
        if not output.exists():
            raise RuntimeError("GridCraft run did not save candidate.xlsx")
        changed=load_sheet_info(output)
        if baseline["sheets"]!=changed["sheets"] or baseline["data"]["估價清單"]["merges"]!=changed["data"]["估價清單"]["merges"]:
            raise RuntimeError("workbook sheets or merged areas changed unexpectedly")
        missing=baseline["parts"]-changed["parts"]
        if missing:
            raise RuntimeError(f"source OOXML parts disappeared: {sorted(missing)}")
        unexpected=[]
        required_b3=False
        recalculated_d3=False
        for title,part in baseline["data"].items():
            old=part["cells"]
            new=changed["data"][title]["cells"]
            for cell in set(old)|set(new):
                before=old.get(cell)
                after=new.get(cell)
                if before==after:
                    continue
                if (title,cell)==("估價清單","B3") and (after or {}).get("v") in ("2500","2500.0") and (after or {}).get("f") is None:
                    required_b3=True
                elif (title,cell)==("估價清單","D3") and before and after and before["f"]==after["f"] and (after["v"] in ("75000","75000.0")):
                    recalculated_d3=True
                else:
                    unexpected.append(f"{title}!{cell}: {before} => {after}")
        if not required_b3 or not recalculated_d3 or unexpected:
            raise RuntimeError(f"specified edit/recalculation did not preserve other cells: B3={required_b3}, D3={recalculated_d3}, unexpected={unexpected[:15]}")
        print("PASS: real GridCraft reimport/write/export: only B3 requested, D3 formula recalculated, no other cell changed")
        check_gridcraft(a.cli,output,"edited candidate")
    print("PASS: P1 narrow T01/T02/T03 GridCraft engine checks (complex Excel fidelity T04–T08 NOT_TESTED)")

if __name__=="__main__":
    main()
