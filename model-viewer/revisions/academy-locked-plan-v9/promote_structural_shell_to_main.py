#!/usr/bin/env python3
"""Release architect's locked-plan V9 shell into the SAME canonical Academy GLB.
Preserve exact prior V8 backup; fail closed on changed source or failed QA.
No rendering, no overwrite of any of the other four official models.
"""
from pathlib import Path
import hashlib,json,copy,shutil
root=Path("model-viewer")
base=Path(".academy-stage/model-viewer/staged-output/academy-locked-plan-v9")
report=json.loads((base/"report.json").read_text())
qa=json.loads((base/"structure-qa.json").read_text())
src=base/report["file"]
dst=root/"lahudi-academy.glb"
old="07392e83c165854c00f13fb39687253fbd185a1a5aa0d134264651a626af8c8f"
expected="ada3ae9c9e55f995b4c8c60f63655c01e572561e523e199ef1cdf298c7e668c3"
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(dst)==old,("Original canonical was modified by another task",sha(dst))
assert sha(src)==expected and report["output_sha256"]==expected
assert qa["sha256"]==expected
assert qa["review_status"]=="STRUCTURAL_STATIC_PASS_VISUAL_PENDING"
assert qa["locked_8_district_plan"] and qa["actual_passage_lowerwall_voids_verified"]
assert qa["new_connector_slabs"]==10 and qa["covered_connector_roofs"]==9
assert qa["native_mobility_nodes_preserved"]
assert not qa["author_acceptance"]
backup=root/"backups/pre-academy-locked-plan-v9/lahudi-academy.glb"
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists(),"Unique backup already exists"
shutil.copyfile(dst,backup)
shutil.copyfile(src,dst)
assert sha(backup)==old and sha(dst)==expected
current=root/"current-models.json"
manifest=json.loads(current.read_text())
assert len(manifest["models"])==5
others={e["model"]:copy.deepcopy(e) for e in manifest["models"] if e["model"]!="lahudi-academy.glb"}
school=next(e for e in manifest["models"] if e["model"]=="lahudi-academy.glb")
assert school["current_sha256"]==old
school.update({
 "version":"ACADEMY-LOCKED-PLAN-EXTERIOR-SHELL-V9",
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-locked-plan-v9/lahudi-academy_LOCKED-PLAN-SHELL_RB2_v9.glb",
 "current_sha256":expected,
 "backup":"backups/pre-academy-locked-plan-v9/lahudi-academy.glb",
 "backup_sha256":old,
 "design_book":"https://docs.google.com/document/d/1seSK9uMrnNV2_Mh1RwmG50JtjFgXqJzHOQoCqiNFTPQ/edit?usp=drivesdk",
 "integrated_contents":"Architect locked plan eight regions; retain A main and F library; B/C wing reposition; D asym entrance around clock, E north forehall in 3 gables; G chapel, H annex; 9 structural masses, thick outer walls with actual portal holes, 10 connecting floors and 9 roofed corridors. Original A01 corridor, classrooms and native stairs preserved.",
 "static_geometry_qa":"PASS: 5 intended source-wall openings, 8-region locked footprint checks, 10 connectors, 9 covered corridors, 9 gables",
 "visual_qa":"NOT_RUN_BY_USER_REQUEST",
 "animation_vs_geometry_width_conflict":"UNRESOLVED: source corridor 4.50m outer span vs proposed animation clear width 5.20m",
 "author_full_item_approval":"PENDING"
})
assert others=={e["model"]:e for e in manifest["models"] if e["model"]!="lahudi-academy.glb"}
manifest["version"]="mixed-current-academy-locked-shell-v9-20261023"
current.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
index=root/"index.html";s=index.read_text()
replaces=[
 ('"file": "lahudi-academy.glb?v=rb2-entire-campus-contrast-v8-20261023"',
  '"file": "lahudi-academy.glb?v=rb2-locked-plan-shell-v9-20261023"'),
 ('current-models.json?v=20261023-academy-rb2-v8',
  'current-models.json?v=20261023-academy-rb2-v9')
]
for oldtxt,newtxt in replaces:
 assert s.count(oldtxt)==1,("Viewer reference absent",oldtxt)
 s=s.replace(oldtxt,newtxt)
assert 'id="academyViews"' in s and "function academyView(region)" in s
assert "連線重試 " in s
index.write_text(s)
print(json.dumps({"canonical":"model-viewer/lahudi-academy.glb",
 "sha256":expected,"bytes":dst.stat().st_size,"backup":str(backup),
 "backup_sha256":old,"book_id":"1seSK9uMrnNV2_Mh1RwmG50JtjFgXqJzHOQoCqiNFTPQ",
 "static_shell_qa":"PASS","non_rendering":"YES","other_four_models_untouched":"YES"},ensure_ascii=False))
