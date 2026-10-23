#!/usr/bin/env python3
"""Publish V10 P0 portal/route/stair geometry to same five-model viewer.

Require exact staged SHA and BOTH independently passed QA reports.
V9 is preserved as immutable backup; don't touch any of the other four models.
"""
from pathlib import Path
import json,hashlib,shutil,copy
root=Path("model-viewer")
stage=Path(".academy-stage/model-viewer/staged-output/academy-route-repair-v10")
report=json.loads((stage/"report.json").read_text())
route=json.loads((stage/"V10-clearance-qa.json").read_text())
stairs=json.loads((stage/"V10-stair-headroom-qa.json").read_text())
canonical=root/"lahudi-academy.glb";new=stage/report["file"]
V9="ada3ae9c9e55f995b4c8c60f63655c01e572561e523e199ef1cdf298c7e668c3"
V10="f2b4c82a7ea3b6625a7ffef3157c56b8e7f288bf9cd2d3bbf699c7ca67ef1b5c"
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
assert sha(canonical)==V9,("Canonical school changed; fail safely",sha(canonical))
assert sha(new)==V10 and report["sha256"]==V10
assert report["source_sha256"]==V9 and report["zone_footprints_locked"] is True
assert route["sha256"]==V10 and route["status"]=="PASS"
assert len(route["route_results"])==10 and all(q["blocker_count"]==0 for q in route["route_results"])
assert len(route["transition_results"])==3 and all(q["blocker_count"]==0 for q in route["transition_results"])
assert stairs["sha256"]==V10 and stairs["geometry_stair_and_headroom_gate"]=="PASS"
assert stairs["stair_tread_count"]==26 and stairs["obstructed_tread_count"]==0
assert stairs["headroom_under_repaired_north_link_roof_m"]>=3.5
assert report["nodes_added"]>=50
backup=root/"backups/pre-academy-v10-collision-repairs/lahudi-academy.glb"
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists()
shutil.copyfile(canonical,backup)
shutil.copyfile(new,canonical)
assert sha(backup)==V9 and sha(canonical)==V10
p=root/"current-models.json"
j=json.loads(p.read_text())
assert len(j["models"])==5
others={a["model"]:copy.deepcopy(a) for a in j["models"] if a["model"]!="lahudi-academy.glb"}
ent=next(a for a in j["models"] if a["model"]=="lahudi-academy.glb")
assert ent["current_sha256"]==V9
ent.update({
 "version":"ACADEMY-LOCKED-PLAN-COLLISION-REPAIR-V10",
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-route-repair-v10/lahudi-academy_LOCKED-PLAN-ACCESS-V10.glb",
 "current_sha256":V10,
 "backup":"backups/pre-academy-v10-collision-repairs/lahudi-academy.glb",
 "backup_sha256":V9,
 "integrated_contents":"V9 locked 8-zone campus retained; actual openings now aligned for west D, C east south, E west north; old A south/north portals kept and connector slabs narrowed; added 26-tread outdoor switchback north of A, 2F skywalk, 7.55m-roofed two-level access link. No A01 corridor/classroom or F library geometry removed.",
 "static_geometry_qa":"PASS: 10 1F routes + 3 stair/upper walk centerline radius-0.4m clearance checks, 26 3D stair treads obstacle-free AABB, 3.55m modeled roof headroom",
 "P0_status":"P0 geometry route blockers repaired to centerline AABB gate; further fully articulated 3D animation character & precise triangle-level QA still required",
 "open_followups":"A01 source corridor 4.5m outer span vs 5.2m proposed net width, unbuilt 3F slab/vault relation, detailed roof intersections, character animation acceptance",
 "visual_qa":"NOT_RUN_BY_USER_REQUEST",
 "author_full_item_approval":"PENDING",
 "design_book":"https://docs.google.com/document/d/1seSK9uMrnNV2_Mh1RwmG50JtjFgXqJzHOQoCqiNFTPQ/edit?usp=drivesdk",
 "collision_book":"https://docs.google.com/document/d/1UlrxFUNmu6-3u3vPwPkSDj7EOJcXICY74ms1m34wUNc/edit?usp=drivesdk",
})
assert others=={a["model"]:a for a in j["models"] if a["model"]!="lahudi-academy.glb"}
j["version"]="mixed-current-academy-collision-repair-v10-20261023"
p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+"\n")
html=root/"index.html";s=html.read_text()
pairs=[
 ('"file": "lahudi-academy.glb?v=rb2-locked-plan-shell-v9-20261023"',
  '"file": "lahudi-academy.glb?v=rb2-locked-plan-collision-repair-v10-20261023"'),
 ('current-models.json?v=20261023-academy-rb2-v9',
  'current-models.json?v=20261023-academy-rb2-v10')]
for a,b in pairs:
 assert s.count(a)==1,a
 s=s.replace(a,b)
assert 'id="academyViews"' in s and "function academyView(region)" in s
assert "連線重試 " in s
html.write_text(s)
print(json.dumps({"official":"model-viewer/lahudi-academy.glb",
  "sha":V10,"bytes":canonical.stat().st_size,
  "backup_V9":str(backup),"qa_10_routes":"PASS","qa_3_approaches":"PASS",
  "qa_26_stair_treads":"PASS","other_models_unchanged":True},ensure_ascii=False))
