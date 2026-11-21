#!/usr/bin/env python3
"""P1 complex XLSX test: chart, validation, CF and merge preservation; all fixtures synthetic."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

SHA256 = "5284b551cd3fe48e8594d428e864115abdd9dc6ef191087666f30773ebb077aa"
MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

def parts(path):
    with zipfile.ZipFile(path) as z:
        names=z.namelist()
        sheet=ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        return {
            "charts":sum("/charts/" in p and p.endswith(".xml") for p in names),
            "drawings":sum("/drawings/drawing" in p and p.endswith(".xml") for p in names),
            "merges":sorted(x.get("ref") for x in sheet.iter(MAIN+"mergeCell")),
            "cond_formats":len(list(sheet.iter(MAIN+"conditionalFormatting"))),
            "validations":len(list(sheet.iter(MAIN+"dataValidation"))),
        }

def run(cli,*args):
    p=subprocess.run([cli,*map(str,args)],capture_output=True,text=True,timeout=95)
    return p

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--cli",required=True)
    a.add_argument("--fixture-b64",required=True)
    v=a.parse_args()
    b=base64.b64decode(Path(v.fixture_b64).read_text().strip(),validate=True)
    if hashlib.sha256(b).hexdigest()!=SHA256:
        raise RuntimeError("synthetic complex fixture checksum mismatch")
    with tempfile.TemporaryDirectory(prefix="gridcraft-p1-complex-") as tmp:
        before=Path(tmp)/"source.xlsx"
        after=Path(tmp)/"converted.xlsx"
        before.write_bytes(b)
        original=parts(before)
        if not original["charts"] or not original["cond_formats"] or not original["validations"] or not original["merges"]:
            raise RuntimeError(f"complex fixture missing key features: {original}")
        print("PASS: independent complex XLSX fixture structure verified",json.dumps(original))
        checked=run(v.cli,"check",before,"--json")
        try:
            report=json.loads(checked.stdout)
            totals=report.get("totals",{})
            differences=report.get("files",[{}])[0].get("roundTrip",{}).get("differing",[])
        except ValueError as e:
            raise RuntimeError(f"CLI check did not return JSON: {checked.stderr[-400:]}") from e
        print("GridCraft complex check returncode:",checked.returncode,"totals:",json.dumps(totals),"differences:",differences)
        converted=run(v.cli,"convert",before,after)
        if converted.returncode or not after.exists():
            raise RuntimeError(f"GridCraft convert complex fixture failed: {converted.stderr[-500:]}")
        result=parts(after)
        changed={k:{"source":original[k],"output":result[k]} for k in original if original[k]!=result[k]}
        if changed or totals.get("roundTripDiffering",1)!=0 or totals.get("failedToOpen",1)!=0:
            raise RuntimeError(f"FAIL: complex XLSX fidelity loss or GridCraft check mismatch; features={changed}; check={totals.get('categoriesDiffering')} ")
        print("PASS: real GridCraft complex XLSX reimport/convert retained chart, drawing, merge, CF, validation counts; T04 tested only for this fixture")
if __name__=="__main__":
    main()
