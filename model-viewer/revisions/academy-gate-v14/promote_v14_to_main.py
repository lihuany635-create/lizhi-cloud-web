#!/usr/bin/env python3
"""Promote a QA-passed V14 animation-directed gate into ORIGINAL academy GLB.
Safety: strict SHA, no changes to other 4 model files, retain rollback V13.
"""
from pathlib import Path
import json,hashlib,copy,shutil
repo=Path("model-viewer")
stage=Path(".academy-stage/model-viewer/staged-output/academy-gate-anime-v14")
report=json.loads((stage/"report.json").read_text())
qa=json.loads((stage/"gate-v14-static-qa.json").read_text())
oldsha="580e8b4bc0a1a9c1bb070074de539bf225286f12219460d6af3365cc3060c9d2"
newsha="1d2ac5373a3ae9e276048aa647d3f65ef19bc01ada3ee0e0473b1154568c53b2"
source=repo/"lahudi-academy.glb"
candidate=stage/report["file"]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(source)==oldsha,("V13 main changed, refusing overwrite",sha(source))
assert sha(candidate)==report["sha256"]==newsha
assert report["source_v13_sha256"]==oldsha
assert report["v12_original_nodes_untouched"]==11983
assert report["v13_gate_batches_disabled"]==28
assert report["v14_visible_batch_nodes"]<=45
assert report["v14_visible_parts"]>=250
assert qa["status"]=="PASS_STATIC_V14_GATE_ACCESS"
assert qa["candidate_sha256"]==newsha
assert qa["V12_buildings_and_furniture_preserved"]
assert all(value==0 for value in qa["obstruction_counts"].values())
backup=repo/"backups/pre-academy-v14-animation-gate/lahudi-academy.glb"
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists()
shutil.copyfile(source,backup)
shutil.copyfile(candidate,source)
assert sha(source)==newsha and sha(backup)==oldsha
manifest_file=repo/"current-models.json"
manifest=json.loads(manifest_file.read_text())
assert len(manifest["models"])==5
other={x["model"]:copy.deepcopy(x) for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
model=next(x for x in manifest["models"] if x["model"]=="lahudi-academy.glb")
assert model["current_sha256"]==oldsha
model.update({
 "version":"ACADEMY-V14-ANIMATION-STYLE-GATE-REVIEW",
 "current_sha256":newsha,
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-gate-anime-v14/"+report["file"],
 "backup":"backups/pre-academy-v14-animation-gate/lahudi-academy.glb",
 "backup_sha256":oldsha,
 "integrated_contents":"V14 anime-directed campus main gate: cool gray-blue simplified Gothic stone, central tall entrance piers, open two wrought iron leaves, simplified low perimeter fencing, two true pedestrian wickets, subdued guardhouse, winter bare trees and snow, two waiting benches, clean main axis X=-70.1. Maintains existing asymmetric school facades, all V12 architecture/44 provisional rooms/1734 furniture placements, 2 stair cores and V11 exterior. In source V13 old 28 gate batch roots disabled, 29 new V14 gate batch roots enabled. All original V12 11983 nodes unchanged.",
 "gate_version":"V14_ANIMATION_DIRECTED_SOUTH_GATE",
 "gate_canonical_architecture_author_approval":"PENDING",
 "gate_open_geometry_static_qa":"PASS_V14_6_ACCESS_VOLUMES_ZERO_BLOCKERS",
 "gate_animated_door_open_close":"NOT_IMPLEMENTED_GATE_LEAVES_FIXED_OPEN",
 "gate_visual_qa":"PENDING_PUBLIC_BROWSER_INSPECTION",
 "visual_qa":"PENDING_AUTHOR_VISUAL_REVIEW",
 "original_V12_furniture_preserved":True,
 "character_collision":"SKIPPED_BY_USER_REQUEST",
 "wing_interiors":"PARTIALLY_MODELED_44_PROVISIONAL_BC_ROOMS_AND_SELECTED_SHARED_SPACES",
})
assert other=={x["model"]:x for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
manifest["version"]="mixed-current-academy-v14-anime-gate-20261023"
manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
viewer=repo/"index.html"
html=viewer.read_text()
old='"file": "lahudi-academy.glb?v=rb2-campus-gate-v13-20261023"'
new='"file": "lahudi-academy.glb?v=rb2-campus-gate-animation-v14-20261023"'
assert html.count(old)==1,("Expected V13 file name",html.count(old))
html=html.replace(old,new)
oldmanifest="current-models.json?v=20261023-academy-rb2-v13"
assert html.count(oldmanifest)==1,html.count(oldmanifest)
html=html.replace(oldmanifest,"current-models.json?v=20261023-academy-rb2-v14")
oldlabel='id="academyGate" type="button">學院大門</button>'
assert html.count(oldlabel)==1
html=html.replace(oldlabel,'id="academyGate" type="button">動畫校門 V14</button>')
camfind="  fit(false);\n  if(anim){camera.position.copy(anim.p);controls.target.copy(anim.t);controls.update();anim=null;}\n  document.querySelectorAll('#academyViews button')"
assert html.count(camfind)==1
html=html.replace(camfind, """  fit(false);
  if(region==='gate'){
    // South, frontal camera: preserve explicit animation establishing-shot axis.
    camera.position.set(-70.1,11+offset,129);
    controls.target.set(-70.1,4+offset,70);
    controls.update();anim=null;
  }else if(anim){camera.position.copy(anim.p);controls.target.copy(anim.t);controls.update();anim=null;}
  document.querySelectorAll('#academyViews button')""")
assert "academyInteriorView(zone)" in html
viewer.write_text(html)
print(json.dumps({
 "publish":"V14_REAL_GLTF_REVIEW_CANONICAL",
 "sha256":newsha,"backup":str(backup),"file_bytes":source.stat().st_size,
 "v14_visible_parts":report["v14_visible_parts"],"visible_meshes":report["v14_visible_batch_nodes"],
 "all_6_gate_walkway_checks":"PASS_ZERO_NEW_BLOCKERS",
 "other_4_models":"UNCHANGED","furniture":"PRESERVED","author_acceptance":"PENDING"},ensure_ascii=False))
