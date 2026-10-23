#!/usr/bin/env python3
"""Guarded V13 academy entrance review release to one existing canonical school GLB.

V12 official exact SHA required, 11,983 prior nodes preserved, 8-district plot unchanged.
Rev is new architectural proposal; author's actual art approval still pending.
"""
from pathlib import Path
import json,hashlib,copy,shutil
root=Path("model-viewer")
stage=Path(".academy-stage/model-viewer/staged-output/academy-gate-v13")
report=json.loads((stage/"report.json").read_text())
qa=json.loads((stage/"gate-static-qa.json").read_text())
before="b975ace3cd12744621688f4f5a0a8aa27f5dff1fbed4beb7ae5b9306dbbd3a66"
after="580e8b4bc0a1a9c1bb070074de539bf225286f12219460d6af3365cc3060c9d2"
def shafile(path):return hashlib.sha256(path.read_bytes()).hexdigest()
src=root/"lahudi-academy.glb"
model=stage/report["file"]
assert shafile(src)==before,("Canonical academy GLB changed",shafile(src))
assert shafile(model)==report["sha256"]==after
assert qa["candidate_sha256"]==after and qa["source_glb_sha256"]==before
assert qa["status"]=="PASS_STATIC_CONSTRUCTION_PATH_CLEARANCE"
assert all(qa[k]==0 for k in ("main_walk_collision_count","west_wicket_collision_count",
  "east_wicket_collision_count","crosswalk_collision_count"))
assert report["prior_nodes_preserved"]==11983 and report["node_count"]==12011
assert report["building_8_district_footprints_unchanged"]
assert report["protect_V12_furniture_and_2_staircores"]
assert report["entry_axis_x_m"]==-70.1 and report["gate_line_z_m"]==79
assert report["new_batched_nodes"]==28 and report["new_mesh_pieces"]==408
backup=root/"backups/pre-academy-v13-campus-gate/lahudi-academy.glb"
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists(),"previous V12 backup would be overwritten"
shutil.copyfile(src,backup)
shutil.copyfile(model,src)
assert shafile(backup)==before and shafile(src)==after
manpath=root/"current-models.json"
manifest=json.loads(manpath.read_text())
assert len(manifest["models"])==5
others={e["model"]:copy.deepcopy(e) for e in manifest["models"] if e["model"]!="lahudi-academy.glb"}
entry=next(e for e in manifest["models"] if e["model"]=="lahudi-academy.glb")
assert entry["current_sha256"]==before
entry.update({
 "version":"ACADEMY-V13-GOTHIC-ENTRANCE-FORECOURT-REVIEW",
 "current_sha256":after,
 "backup":"backups/pre-academy-v13-campus-gate/lahudi-academy.glb",
 "backup_sha256":before,
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-gate-v13/"+report["file"],
 "integrated_contents":"Original V12 furnished school (1734 provisional furniture placements in B/C/D/E/G/H, two upper teaching-wing stairs) plus V13 south campus wrought iron gate, stone pointed portal, 2 side wicket gates, perimeter fence, 26m entry forecourt with two D-wing crosspaths, winter planting, gatehouse and curb. All 11983 prior GLB nodes and building footprints unchanged. Main entry aligned to existing clock axis X=-70.1, entrance fence at Z=79. Novel supports gate presence but exact architecture is proposed not canonical.",
 "gate_version":"V13_SOUTH_GATE_PROPOSAL",
 "gate_canonical_architecture_author_approval":"PENDING",
 "gate_axial_coordinate_x_m":-70.1,
 "gate_south_boundary_z_m":79,
 "gate_open_geometry_static_qa":"PASS_MAIN_AND_2_SIDE_GATE_WICKET_AND_D_CROSSWALK",
 "gate_animated_door_open_close":"NOT_IMPLEMENTED_GATE_LEAVES_FIXED_OPEN",
 "original_V12_furniture_preserved":True,
 "visual_qa":"PENDING_V13_VIEWER_INSPECTION",
 "character_collision":"SKIPPED_BY_USER_REQUEST"
})
assert others=={e["model"]:e for e in manifest["models"] if e["model"]!="lahudi-academy.glb"}
manifest["version"]="mixed-current-academy-v13-gate-20261023"
manpath.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
page=root/"index.html"
s=page.read_text()
orig='"file": "lahudi-academy.glb?v=rb2-interior-v12-review-20261023"'
replace='"file": "lahudi-academy.glb?v=rb2-gothic-entrance-v13-20261023"'
assert s.count(orig)==1
s=s.replace(orig,replace)
cache="current-models.json?v=20261023-academy-rb2-v12"
assert s.count(cache)==1
s=s.replace(cache,"current-models.json?v=20261023-academy-rb2-v13")
old='whole:[-141.5,-1.5,-202.5,29.35,28.34,56.5],'
assert s.count(old)==1
s=s.replace(old,'whole:[-146,-1.5,-202.5,36,28.34,91.5],\n    gate:[-112,-1,51,-19,13,89],')
old='[\n      -141.5,\n      -1.5,\n      -202.5,\n      29.35,\n      28.34,\n      56.5'
assert s.count(old)==1,("V13 default fit not found")
s=s.replace(old,'[\n      -146,\n      -1.5,\n      -202.5,\n      36,\n      28.34,\n      91.5')
button='<button class="btn" id="academyLibrary" type="button">圖書館區</button>'
assert s.count(button)==1
s=s.replace(button,button+'<button class="btn" id="academyGate" type="button">學院大門</button>')
base="$('academyLibrary').onclick=()=>academyView('library');"
assert s.count(base)==1
s=s.replace(base,base+"\n$('academyGate').onclick=()=>academyView('gate');")
highlight="(region==='library'&&b.id==='academyLibrary')"
assert s.count(highlight)==1
s=s.replace(highlight,highlight+"||\n      (region==='gate'&&b.id==='academyGate')")
# Preview viewer declaration tracks one canonical model not separate test id.
assert "academyInteriorView(zone)" in s
assert "academyGate" in s
page.write_text(s)
print(json.dumps({"version":"V13_RELEASE_PROPOSAL","sha256":after,
 "backup":str(backup),"bytes":src.stat().st_size,
 "main_axis_x_m":-70.1,"gate_line_z_m":79,
 "former_scene_preserved_nodes":11983,"new_nodes":28,
 "other_four_models":"UNCHANGED",
 "public_viewer_gate_button":True,
 "author_art_approval":"PENDING"},ensure_ascii=False))
