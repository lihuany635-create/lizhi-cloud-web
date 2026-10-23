#!/usr/bin/env python3
"""Upgrade SAME canonical school GLB to V7 optimized mobile batches, back up V6 first."""
from pathlib import Path
import hashlib,json,shutil,copy
r=Path("model-viewer")
srcdir=Path(".academy-stage/model-viewer/staged-output/academy-entire-campus-optimized-v7")
f=srcdir/"lahudi-academy_ENTIRE-GOTHIC-CAMPUS_OPTIMIZED_v7.glb"
report=json.loads((srcdir/"report.json").read_text())
oldsha="e3d2465807cba69ba52a3d1df2a9e3f84a77a970f94301bdeaecd26537d5a6bc"
sha="14f564dd0a2e85c40105d7565ad04a0bf1bb2949d15ec05f96aa45ebf31cdddf"
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
target=r/"lahudi-academy.glb"
assert digest(target)==oldsha and digest(f)==sha
assert report["sha256"]==sha and report["original_core_nodes_untouched"]
assert report["source_v6_sha256"]==oldsha and report["merged_campus_nodes"]==77
assert report["eliminated_draw_call_objects"]==5068
assert report["all_full_v6_campus_features_preserved_geometrically"]
backup=r/"backups/pre-academy-mobile-optimized-v7/lahudi-academy.glb"
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists()
shutil.copyfile(target,backup)
shutil.copyfile(f,target)
assert digest(backup)==oldsha and digest(target)==sha
p=r/"current-models.json"
j=json.loads(p.read_text())
oldmodels={x["model"]:copy.deepcopy(x) for x in j["models"] if x["model"]!="lahudi-academy.glb"}
school=next(x for x in j["models"] if x["model"]=="lahudi-academy.glb")
assert school["current_sha256"]==oldsha
school.update({
 "version":"ACADEMY-RB2-ENTIRE-CAMPUS-MOBILE-OPTIMIZED-V7",
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-entire-campus-optimized-v7/lahudi-academy_ENTIRE-GOTHIC-CAMPUS_OPTIMIZED_v7.glb",
 "current_sha256":sha,
 "backup":"backups/pre-academy-mobile-optimized-v7/lahudi-academy.glb",
 "backup_sha256":oldsha,
 "integrated_contents":"Same official 8-wing entire Gothic school V6 geometry and palette, preserving all native classrooms/stairs/library; 5145 new campus details baked into 77 region/material batches for mobile draw efficiency; kilometer-sized old terrain stays disabled.",
 "static_geometry_qa":"PASS: 5145 source cube surfaces baked into 77 region/material meshes, original school core geometry unchanged",
 "visual_qa":"NOT_RUN_BY_USER_REQUEST",
 "mobile_performance_note":"Reduced new campus mesh draws by 5068; device FPS unverified",
 "author_full_item_approval":"PENDING"
})
j["version"]="mixed-current-academy-rb2-campus-v7-mobile-20261023"
assert oldmodels=={x["model"]:x for x in j["models"] if x["model"]!="lahudi-academy.glb"}
p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+"\n")
html=r/"index.html"
s=html.read_text()
old='"file": "lahudi-academy.glb?v=rb2-entire-campus-20261023"'
new='"file": "lahudi-academy.glb?v=rb2-entire-campus-optimized-v7-20261023"'
assert s.count(old)==1
s=s.replace(old,new)
a="current-models.json?v=20261023-academy-rb2-v6"
b="current-models.json?v=20261023-academy-rb2-v7"
assert s.count(a)==1
s=s.replace(a,b)
assert 'id="academyViews"' in s
assert "function academyView(" in s
html.write_text(s)
print(json.dumps({"canonical_model":str(target),"bytes":target.stat().st_size,
  "sha256":sha,"previous_model_backup_sha256":oldsha,
  "campus_batch_draws":77,"eliminated_individual_new_nodes":5068,
  "native_core_preserved":True,"viewer_scope_buttons_preserved":True,
  "four_other_models_unchanged":True},ensure_ascii=False))
