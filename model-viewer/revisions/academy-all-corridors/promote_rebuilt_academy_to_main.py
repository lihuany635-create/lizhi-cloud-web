#!/usr/bin/env python3
"""Promote the already built and validated Academy V5 GLB into canonical model-viewer.

Must run from fresh MAIN branch checkout; source is a separate
read-only checkout of staging branch at .academy-stage/.
One atomic Git commit updates GLB + current-models.json + index.html,
saves the previous canonical GLB in a durable backup folder.
Do not alter other four GLBs or their manifest entries.
"""
from pathlib import Path
import hashlib, json, shutil, copy
root=Path("model-viewer")
stage=Path(".academy-stage/model-viewer/staged-output/academy-exterior-rebuild-v5")
source=stage/"lahudi-academy_REBUILT-EXTERIOR-RB2_v5.glb"
report=json.loads((stage/"report.json").read_text())
qa=json.loads((stage/"qa.json").read_text())
prior=root/"lahudi-academy.glb"
prior_sha="33c99f530c444ddd8b48542566eebf5579d6f1f3cec9755ccd16d4d62898d324"
expected="347ba0a423726d4a2c83e1ddc568509a5b3ac35ca99dc6019f513085053b842f"
def hash_file(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert hash_file(prior)==prior_sha,"Academy canonical changed since source survey. Refuse overwrite."
assert hash_file(source)==expected
assert qa["pass"] and qa["model_sha256"]==expected
assert report["sha256"]==expected and report["bytes"]==source.stat().st_size
assert report["old_exterior_meshes_deactivated"]==6586
assert report["fully_connected_cloister_floor"]
assert report["classroom_entrances_preserved"] and report["library_furniture_preserved"]
assert report["stair_meshes_preserved"] and report["native_Rg_classroom_materials_retoned"]
backup=root/"backups/pre-academy-rb2-exterior-v5/lahudi-academy.glb"
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists(),"Backup name already exists; refuse to overwrite"
shutil.copyfile(prior,backup)
shutil.copyfile(source,prior)
assert hash_file(backup)==prior_sha and hash_file(prior)==expected
index=root/"index.html"
s=index.read_text()
old_file='"file": "lahudi-academy.glb?v=2.3-merged-20261022"'
new_file='"file": "lahudi-academy.glb?v=rb2-exterior-rebuilt-20261023"'
old_fit='"cut": 0.018,\n    "fit": [\n      -90,\n      0,\n      -68,\n      -65,\n      16,\n      27\n    ]'
new_fit='"cut": 1,\n    "fit": [\n      -123,\n      -1,\n      -201,\n      25,\n      27,\n      54\n    ]'
old_cache="current-models.json?v=20261022-2"
assert s.count(old_file)==1 and s.count(old_fit)==1 and s.count(old_cache)==1
s=s.replace(old_file,new_file).replace(old_fit,new_fit)
s=s.replace(old_cache,"current-models.json?v=20261023-academy-rb2-v5")
assert s.count(new_file)==1 and s.count(new_fit)==1
index.write_text(s)
manifest=root/"current-models.json"
j=json.loads(manifest.read_text())
assert len(j["models"])==5
old_others={x["model"]:copy.deepcopy(x) for x in j["models"] if x["model"]!="lahudi-academy.glb"}
a=next(x for x in j["models"] if x["model"]=="lahudi-academy.glb")
assert a["current_sha256"]==prior_sha
a.update({
 "version":"ACADEMY-RB2-EXTERIOR-REBUILT-V5",
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-exterior-rebuild-v5/lahudi-academy_REBUILT-EXTERIOR-RB2_v5.glb",
 "current_sha256":expected,
 "backup":"backups/pre-academy-rb2-exterior-v5/lahudi-academy.glb",
 "backup_sha256":prior_sha,
 "integrated_contents":"Main 85.42m RB2 Gothic corridor, preserved classrooms and stairs, removed oversized old campus, replaced exterior main teaching wing and library, connected cloister, blue-gray masonry, slate roofs, gold and oak.",
 "static_geometry_qa":"PASS",
 "visual_qa":"NOT_RUN",
 "author_full_item_approval":"PENDING",
})
a["git_blob_sha"]="fa1eded139fcd7dff0794208067550db71d05344"
j["version"]="mixed-current-academy-rb2-v5-20261023"
assert old_others=={x["model"]:x for x in j["models"] if x["model"]!="lahudi-academy.glb"}
manifest.write_text(json.dumps(j,ensure_ascii=False,indent=2)+"\n")
assert json.loads(manifest.read_text())["models"][-1]["current_sha256"]==expected or \
       next(x["current_sha256"] for x in json.loads(manifest.read_text())["models"] if x["model"]=="lahudi-academy.glb")==expected
print(json.dumps({"promoted_canonical":str(prior),"sha256":expected,
    "bytes":prior.stat().st_size,"prior_backup":str(backup),
    "prior_sha256":prior_sha,"manifest":str(manifest),
    "viewer_cache_busted":True,"viewer_default_cut":"OFF",
    "viewer_fit":"ENTIRE_REBUILT_CAMPUS",
    "other_four_glbs_untouched":True},ensure_ascii=False))
