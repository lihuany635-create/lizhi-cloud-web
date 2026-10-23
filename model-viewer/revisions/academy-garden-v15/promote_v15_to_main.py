#!/usr/bin/env python3
"""Promote V15 built and verified Vitti rear garden into ONE existing school GLB.

Back up V14, preserve other four models, original 8 district envelopes, school
gate and furniture. Add a library-north actual 3m passage only; label new garden
link/location an author-approval-pending animation inference.
"""
from pathlib import Path
import json,hashlib,copy,shutil
root=Path("model-viewer")
stage=Path(".academy-stage/model-viewer/staged-output/academy-rear-garden-v15")
meta=json.loads((stage/"report.json").read_text())
qa=json.loads((stage/"garden-v15-static-qa.json").read_text())
OLD="1d2ac5373a3ae9e276048aa647d3f65ef19bc01ada3ee0e0473b1154568c53b2"
NEW="e269a295159f0f7d3e82df864376579e66f4b92be204ce66667a3c78b9d3ea41"
def hashfile(p):return hashlib.sha256(p.read_bytes()).hexdigest()
official=root/"lahudi-academy.glb";new=stage/meta["file"]
assert hashfile(official)==OLD,("Official V14 was modified independently",hashfile(official))
assert hashfile(new)==meta["sha256"]==NEW
assert meta["source_v14_sha256"]==OLD
assert meta["prior_node_count"]==12040
assert meta["new_batch_count"]==27
assert meta["added_parts"]==261
assert meta["only_prior_model_change"]=="DISABLE_ORIGINAL_F_LIBRARY_NORTH_SOLID_ENDWALL"
assert meta["previous_library_wall_mesh_saved_in_extras"]
assert meta["V14_gate_and_original_furniture_nodes_preserved"]
assert qa["status"]=="PASS_STAGED_GARDEN_STATIC_PATH_AND_LIBRARY_PORTAL"
assert qa["sha256"]==NEW
assert len(qa["checks"])==7 and all(x==0 for x in qa["checks"].values())
assert qa["V14_gate_and_44_room_1734_furniture_nodes_preserved"]
backup=root/"backups/pre-academy-v15-vitti-rear-garden/lahudi-academy.glb"
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists()
shutil.copyfile(official,backup)
shutil.copyfile(new,official)
assert hashfile(official)==NEW and hashfile(backup)==OLD
mp=root/"current-models.json"
manifest=json.loads(mp.read_text())
assert len(manifest["models"])==5
others={x["model"]:copy.deepcopy(x) for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
model=next(x for x in manifest["models"] if x["model"]=="lahudi-academy.glb")
assert model["current_sha256"]==OLD
model.update({
 "version":"ACADEMY-V15-VITTI-REAR-GARDEN-REVIEW",
 "current_sha256":NEW,
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-rear-garden-v15/"+meta["file"],
 "backup":"backups/pre-academy-v15-vitti-rear-garden/lahudi-academy.glb",
 "backup_sha256":OLD,
 "integrated_contents":"One official academy V15 GLB. All existing V14 anime gate, V12 44 provisional school rooms and 1734 procedural furniture, V11 exterior, original A01 and library furniture preserved. The former F_LIBRARY solid north-end wall is replaced by 3m actual back door, adjoining Vitti winter rear garden 36m × 28m with central lawn, loop stone walks, 3 wooden benches, 6 hardy flowerbeds, 4 leafless trees, 4 lamps, one story-marked potted plant for Bessie, and low garden perimeter stone-and-iron railings. Placement behind library is cinema-design inference, not explicitly specified by source novel.",
 "rear_garden_version":"V15_VITTI_WINTER_GARDEN",
 "garden_footprint_rect_m2":1008,
 "garden_built_mesh_components":261,
 "library_true_rear_exit_portal_m":[3.0,3.6],
 "garden_path_qa":"PASS_STATIC_7_APPROACHES_ZERO_BLOCKERS",
 "garden_story_grounding":"NOVEL_CH07 winter garden, isolated corner pot, hardy plants, solitary Bessie",
 "garden_library_adjacency":"DESIGN_INFERENCE_PENDING_AUTHOR_APPROVAL",
 "garden_visual_qa":"PENDING_PUBLIC_RENDER",
 "author_full_item_approval":"PENDING",
 "visual_qa":"V15_STATIC_GEOMETRY_QA_PASS__PUBLIC_VISUAL_PENDING",
 "character_collision":"SKIPPED_BY_USER_REQUEST"
})
assert others=={x["model"]:x for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
manifest["version"]="mixed-current-academy-v15-vitti-garden-20261023"
mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
index=root/"index.html"
html=index.read_text()
link='"file": "lahudi-academy.glb?v=rb2-campus-gate-animation-v14-20261023"'
assert html.count(link)==1
html=html.replace(link,'"file": "lahudi-academy.glb?v=rb2-vitti-winter-garden-v15-20261023"')
old="current-models.json?v=20261023-academy-rb2-v14"
assert html.count(old)==1
html=html.replace(old,"current-models.json?v=20261023-academy-rb2-v15")
label='<button class="btn" id="academyGate" type="button">動畫校門 V14</button>'
assert html.count(label)==1
html=html.replace(label,label+'<button class="btn" id="academyGarden" type="button">薇媞後花園 V15</button>')
oldpreset="    whole:[-146,-1.5,-202.5,36,28.34,91.5],"
assert html.count(oldpreset)==1
html=html.replace(oldpreset,"    whole:[-146,-1.5,-221.5,36,28.34,91.5],")
oldlibrary="    library:[-132,-1,-193,31,30,-118]"
assert html.count(oldlibrary)==1
html=html.replace(oldlibrary,oldlibrary+",\n    garden:[-47.5,-.6,-216.5,-4.5,20,-181.0]")
# Use a distinct garden view without changing standard academy camera controls.
needle="  if(region==='gate'){\n    // South, frontal camera"
assert html.count(needle)==1
html=html.replace(needle,"""  if(region==='garden'){
    // North/rear camera looking inward toward existing F_LIBRARY back facade.
    camera.position.set(-26.0,10.5+offset,-247);
    controls.target.set(-26.0,2.1+offset,-197);
    controls.update();anim=null;
  }else if(region==='gate'){
    // South, frontal camera""")
press="(region==='gate'&&b.id==='academyGate'))));"
assert html.count(press)==1
html=html.replace(press,"(region==='gate'&&b.id==='academyGate')||\n      (region==='garden'&&b.id==='academyGarden'))));")
handler="$('academyGate').onclick=()=>academyView('gate');"
assert html.count(handler)==1
html=html.replace(handler,handler+"\n$('academyGarden').onclick=()=>academyView('garden');")
sourcefit='"fit": [\n      -146,\n      -1.5,\n      -202.5,\n      36,\n      28.34,\n      91.5\n    ]'
assert html.count(sourcefit)==1
html=html.replace(sourcefit,'"fit": [\n      -146,\n      -1.5,\n      -221.5,\n      36,\n      28.34,\n      91.5\n    ]')
index.write_text(html)
assert 'id="academyGarden"' in html and "academyView('garden')" in html
print(json.dumps({"status":"PROMOTED_MAIN_V15_REAR_GARDEN",
 "candidate_sha256":NEW,"backup_v14":str(backup),
 "model_bytes":official.stat().st_size,"garden_parts":261,
 "original_school_nodes_preserved_except_solid_north_wall":True,
 "other_four_models_unchanged":True,"true_backdoor_3m":True,
 "author_review":"PENDING"},ensure_ascii=False))
