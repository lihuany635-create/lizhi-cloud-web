#!/usr/bin/env python3
"""Atomic promote V11 Gothic EXTERIOR ONLY to canonical main with V10 backup."""
from pathlib import Path
import hashlib,json,shutil,copy
root=Path("model-viewer")
stage=Path(".academy-stage/model-viewer/staged-output/academy-exterior-finish-v11")
meta=json.loads((stage/"report.json").read_text())
candidate=stage/meta["file"]
source_sha="f2b4c82a7ea3b6625a7ffef3157c56b8e7f288bf9cd2d3bbf699c7ca67ef1b5c"
target_sha="caab8cba4cbb9af22252ea2b05a35588b9529fb4af5720b787cf96b33229a9ae"
def hashfile(p):return hashlib.sha256(p.read_bytes()).hexdigest()
original=root/"lahudi-academy.glb"
assert hashfile(original)==source_sha,"Another process changed original GLB; refusal to overwrite"
assert hashfile(candidate)==meta["sha256"]==target_sha
assert meta["source_model_sha256"]==source_sha
assert meta["all_previous_V10_nodes_and_access_routes_unchanged"]
assert meta["eight_district_locked_positions_preserved"]
assert meta["A01_original_interior_and_stairs_preserved"]
assert meta["baked_decorative_shapes"]>=3400
assert meta["batched_decorative_nodes"]<=110
assert meta["character_collision"]=="SKIPPED_AS_USER_REQUESTED"
back=root/"backups/pre-academy-v11-exterior-finish/lahudi-academy.glb"
back.parent.mkdir(parents=True,exist_ok=True)
assert not back.exists(),"Refuse overwrite existing model backup"
shutil.copyfile(original,back)
shutil.copyfile(candidate,original)
assert hashfile(back)==source_sha and hashfile(original)==target_sha
manifest_file=root/"current-models.json"
manifest=json.loads(manifest_file.read_text())
assert len(manifest["models"])==5
others={x["model"]:copy.deepcopy(x) for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
academy=next(x for x in manifest["models"] if x["model"]=="lahudi-academy.glb")
assert academy["current_sha256"]==source_sha
academy.update({
 "version":"ACADEMY-LOCKED-PLAN-GOTHIC-EXTERIOR-FINISH-V11",
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-exterior-finish-v11/lahudi-academy_EXTERIOR-GOTHIC-FINISH_V11.glb",
 "current_sha256":target_sha,
 "backup":"backups/pre-academy-v11-exterior-finish/lahudi-academy.glb",
 "backup_sha256":source_sha,
 "integrated_contents":"Official single GLB Gothic exterior only: 3505 decorative shapes in 96 combined standard meshes; 274 second-floor blue lancet glass bays, carved stone frames and tracery, 62 roof dormers, copper gutters, gable crests and finials, clocktower cornices and clock panel, glowing lamps, courtyard stone paths and shrubs. Existing V10 geometry / doors / stair / classrooms and locked 8-district campus coords unchanged.",
 "exterior_decoration_qa":"PASS - geometric source checks, batched material groups, GLB roundtrip, 3505 shapes",
 "character_collision":"SKIPPED_BY_USER_REQUEST",
 "visual_qa":"PENDING_REAL_MOBILE_PREVIEW",
 "author_full_item_approval":"PENDING"
})
assert others=={x["model"]:x for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
manifest["version"]="mixed-current-academy-gothic-exterior-v11-20261023"
manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
viewer=root/"index.html"
text=viewer.read_text()
old='"file": "lahudi-academy.glb?v=rb2-locked-plan-collision-repair-v10-20261023"'
new='"file": "lahudi-academy.glb?v=rb2-gothic-exterior-v11-20261023"'
assert text.count(old)==1
text=text.replace(old,new)
cache="current-models.json?v=20261023-academy-rb2-v10"
assert text.count(cache)==1
text=text.replace(cache,"current-models.json?v=20261023-academy-rb2-v11")
assert 'id="academyViews"' in text
assert "function academyView(region)" in text
viewer.write_text(text)
print(json.dumps({"status":"PROMOTED_CANONICAL","model":"model-viewer/lahudi-academy.glb",
 "sha256":target_sha,"bytes":original.stat().st_size,
 "backup":str(back),"previous_sha256":source_sha,
 "styles":meta["baked_decorative_shapes"],"new_batch_nodes":meta["batched_decorative_nodes"],
 "no_other_models_modified":True,"user_requested_exterior_only":True},ensure_ascii=False))
