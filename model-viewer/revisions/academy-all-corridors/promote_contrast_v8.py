#!/usr/bin/env python3
"""Publish V8 high-contrast materials into same official Academy GLB, preserve full V7 backup."""
from pathlib import Path
import json,hashlib,shutil,copy
root=Path("model-viewer")
dir=Path(".academy-stage/model-viewer/staged-output/academy-entire-campus-contrast-v8")
file=dir/"lahudi-academy_ENTIRE-GOTHIC-CAMPUS_CONTRAST_v8.glb"
r=json.loads((dir/"report.json").read_text())
prior="14f564dd0a2e85c40105d7565ad04a0bf1bb2949d15ec05f96aa45ebf31cdddf"
current="07392e83c165854c00f13fb39687253fbd185a1a5aa0d134264651a626af8c8f"
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
f=root/"lahudi-academy.glb"
assert sha(f)==prior and sha(file)==current
assert r["sha256"]==current and r["source_v7_sha256"]==prior
assert r["same_eight_wing_building_geometry"] and r["source_mesh_geometry_buffer_unchanged"]
assert len(r["pbr_color_revisions"])==18
bak=root/"backups/pre-academy-v8-color-contrast/lahudi-academy.glb"
bak.parent.mkdir(parents=True,exist_ok=True)
assert not bak.exists()
shutil.copyfile(f,bak);shutil.copyfile(file,f)
assert sha(f)==current and sha(bak)==prior
manifest=root/"current-models.json"
m=json.loads(manifest.read_text())
others={x["model"]:copy.deepcopy(x) for x in m["models"] if x["model"]!="lahudi-academy.glb"}
s=next(x for x in m["models"] if x["model"]=="lahudi-academy.glb")
assert s["current_sha256"]==prior
s.update({
 "version":"ACADEMY-RB2-ENTIRE-CAMPUS-OPTIMIZED-CONTRAST-V8",
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-entire-campus-contrast-v8/lahudi-academy_ENTIRE-GOTHIC-CAMPUS_CONTRAST_v8.glb",
 "current_sha256":current,
 "backup":"backups/pre-academy-v8-color-contrast/lahudi-academy.glb",
 "backup_sha256":prior,
 "integrated_contents":"Eight-wing complete external Gothic school, original 85m corridor and library/classrooms/stairs preserved; 77 mobile batches for new campus; darkened charcoal courtyard, sandstone facades, blue-gray main school and slate roofs to address white-out.",
 "visual_qa":"DARK_CAMPUS_MOBILE_FIT_V7_PASS; V8_MATERIAL_CONTRAST_EXACT_VALIDATION_PASS; V8_SCREENSHOT_PENDING",
 "author_full_item_approval":"PENDING"
})
m["version"]="mixed-current-academy-rb2-v8-contrast-20261023"
assert {x["model"]:x for x in m["models"] if x["model"]!="lahudi-academy.glb"}==others
manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n")
html=root/"index.html"
shtml=html.read_text()
old='"file": "lahudi-academy.glb?v=rb2-entire-campus-optimized-v7-20261023"'
new='"file": "lahudi-academy.glb?v=rb2-entire-campus-contrast-v8-20261023"'
assert shtml.count(old)==1
shtml=shtml.replace(old,new)
a="current-models.json?v=20261023-academy-rb2-v7"
b="current-models.json?v=20261023-academy-rb2-v8"
assert shtml.count(a)==1
shtml=shtml.replace(a,b)
assert 'id="academyViews"' in shtml
assert "camera.position.copy(anim.p)" in shtml
assert "連線重試 " in shtml
html.write_text(shtml)
print(json.dumps({"canonical_model":"model-viewer/lahudi-academy.glb",
"sha256":current,"size":f.stat().st_size,"former_v7_backup":str(bak),
"colors_changed":18,"campus_and_interiors_preserved":True,
"viewer_camera_and_503_retry_preserved":True,
"other_four_models_unchanged":True},ensure_ascii=False))
