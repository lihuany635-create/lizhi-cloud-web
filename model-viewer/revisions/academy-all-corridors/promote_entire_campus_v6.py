#!/usr/bin/env python3
"""Publish proven eight-wing Academy V6 to SAME canonical model, backup V5, modern mobile zoom."""
from pathlib import Path
import hashlib,json,shutil,copy
root=Path("model-viewer")
source_dir=Path(".academy-stage/model-viewer/staged-output/academy-entire-campus-v6")
candidate=source_dir/"lahudi-academy_ENTIRE-GOTHIC-CAMPUS_RB2_v6.glb"
report=json.loads((source_dir/"report.json").read_text())
qa=json.loads((source_dir/"geometry-qa.json").read_text())
target=root/"lahudi-academy.glb"
oldsha="347ba0a423726d4a2c83e1ddc568509a5b3ac35ca99dc6019f513085053b842f"
sha="e3d2465807cba69ba52a3d1df2a9e3f84a77a970f94301bdeaecd26537d5a6bc"
def sh(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sh(target)==oldsha,("Canonical source changed; refuse overwrite",sh(target))
assert sh(candidate)==sha
assert qa["passes"] and qa["sha256"]==sha
assert qa["original_kilometer_scale_outliers_disabled"]==4
assert qa["eight_new_campus_wings"]==8
assert qa["visible_world_dimensions_xyz"][0]<270
assert qa["visible_world_dimensions_xyz"][2]<330
assert qa["nonwhite_material_contrast"]=="PASS"
assert report["sha256"]==sha and report["bytes"]==candidate.stat().st_size
back=root/"backups/pre-academy-complete-campus-v6/lahudi-academy.glb"
back.parent.mkdir(parents=True,exist_ok=True)
assert not back.exists(),"Do not overwrite unique original V5 backup"
shutil.copyfile(target,back)
shutil.copyfile(candidate,target)
assert sh(back)==oldsha and sh(target)==sha
p=root/"current-models.json"
manifest=json.loads(p.read_text())
models=manifest["models"]
assert len(models)==5
others={x["model"]:copy.deepcopy(x) for x in models if x["model"]!="lahudi-academy.glb"}
ent=next(x for x in models if x["model"]=="lahudi-academy.glb")
assert ent["current_sha256"]==oldsha
ent.update({
 "version":"ACADEMY-RB2-ENTIRE-CAMPUS-V6",
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-entire-campus-v6/lahudi-academy_ENTIRE-GOTHIC-CAMPUS_RB2_v6.glb",
 "current_sha256":sha,
 "backup":"backups/pre-academy-complete-campus-v6/lahudi-academy.glb",
 "backup_sha256":oldsha,
 "integrated_contents":"Single official school GLB: preserved native classrooms/library/85m RB2 Gothic corridor/stairs, rebuilt main and library envelopes, eight new exterior college wings, paved quadrangle, arches, fountains, front school colonnade; disabled four kilometer-scale outliers.",
 "static_geometry_qa":"PASS: world visible 166.852 x 253.0 x 26.24m; verified nonwhite material contrasts and old huge terrain gone",
 "visual_qa":"NOT_RUN_BY_USER_REQUEST",
 "author_full_item_approval":"PENDING",
 "wing_interiors":"NOT_MODELED: only exterior architectural shell and connected campus ground paths",
 })
manifest["version"]="mixed-current-academy-rb2-entire-campus-v6-20261023"
assert others=={x["model"]:x for x in models if x["model"]!="lahudi-academy.glb"}
p.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
hfile=root/"index.html"
h=hfile.read_text()
old_file='"file": "lahudi-academy.glb?v=rb2-exterior-rebuilt-20261023"'
new_file='"file": "lahudi-academy.glb?v=rb2-entire-campus-20261023"'
assert h.count(old_file)==1
h=h.replace(old_file,new_file)
old_fit='"cut": 1,\n    "fit": [\n      -123,\n      -1,\n      -201,\n      25,\n      27,\n      54\n    ]'
new_fit='"cut": 1,\n    "fit": [\n      -141.5,\n      -1.5,\n      -202.5,\n      29.35,\n      28.34,\n      56.5\n    ]'
assert h.count(old_fit)==1
h=h.replace(old_fit,new_fit)
cache='current-models.json?v=20261023-academy-rb2-v5'
assert h.count(cache)==1
h=h.replace(cache,'current-models.json?v=20261023-academy-rb2-v6')
# Main model vs old isolated test option:
opt='<option value="lahudi-academy-s01-v5">S01 V5｜拉乎迪告白走廊（測試版・尚未驗收）</option>'
assert h.count(opt)==1
h=h.replace(opt,'')
# Existing model archive paths are still retained; do not expose old V5 double quick-links in top navigation.
links=[
 '<a class="btn" href="s01-preview/?v=20261023-v5" title="S01 告白走廊 V5 未驗收測試版，正式 GLB 不受影響">S01 V5 模型測試版</a>',
 '<a class="btn" href="./index.html?v=20261023-s01-v5#lahudi-academy-s01-v5" title="獨立 S01 V5 模型測試版，原拉乎迪學院正式模型不變">S01 V5 測試模型</a>'
]
for item in links:
 assert h.count(item)==1
 h=h.replace(item,'')
# Add scope selector to the official viewer (no extra copy of GLB).
needle='<span id="houseViews" hidden'
assert needle in h
controls='<span id="academyViews" hidden style="display:inline-flex;gap:6px;flex-wrap:wrap"><button class="btn" id="academyWhole" type="button">整座學院</button><button class="btn" id="academySchool" type="button">主教學樓</button><button class="btn" id="academyLibrary" type="button">圖書館區</button></span>\n  '
h=h.replace(needle,controls+needle,1)
needle2="if(modelKey==='hades-house')houseView(2);"
assert h.count(needle2)==1
h=h.replace(needle2,needle2+"$('academyViews').hidden=modelKey!=='lahudi-academy'||window.GLBPreview.active;",1)
# Use the actual measured V6 school floor and two region bounding presets.
needle3="$('house1F').onclick=()=>houseView(1);"
assert h.count(needle3)==1
func=r'''
function academyView(region){
  if(!model||modelKey!=='lahudi-academy')return;
  if(pov)exitPov();
  const offset=model.position.y;
  const presets={
    whole:[-141.5,-1.5,-202.5,29.35,28.34,56.5],
    school:[-133,-1,-115,-26,29,58],
    library:[-132,-1,-193,31,30,-118]
  };
  const q=presets[region]||presets.whole;
  fitBox=new THREE.Box3(
    new THREE.Vector3(q[0],q[1]+offset,q[2]),
    new THREE.Vector3(q[3],q[4]+offset,q[5]));
  setCut(1);
  fit(false);
  document.querySelectorAll('#academyViews button').forEach(b=>b.setAttribute('aria-pressed',
    String((region==='whole'&&b.id==='academyWhole')||
      (region==='school'&&b.id==='academySchool')||
      (region==='library'&&b.id==='academyLibrary'))));
}
$('academyWhole').onclick=()=>academyView('whole');
$('academySchool').onclick=()=>academyView('school');
$('academyLibrary').onclick=()=>academyView('library');
'''
h=h.replace(needle3,func+"\n"+needle3,1)
assert h.count("function academyView(")==1
assert h.count(new_file)==1
assert h.count("academyViews")==3
hfile.write_text(h)
print(json.dumps({"canonical":str(target),"sha256":sha,"bytes":target.stat().st_size,
 "backup_sha256":oldsha,"backup_file":str(back),
 "scene_selector_count":len(models),"school_scope_buttons":3,
 "browser_model_cache_v6":True,
 "old_screen_km_size_removed":True,
 "source_exterior_wings":8,
 "other_scene_manifests_unchanged":True,
 "rendering":"NOT_RUN"},ensure_ascii=False))
