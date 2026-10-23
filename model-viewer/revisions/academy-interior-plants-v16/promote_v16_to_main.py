#!/usr/bin/env python3
"""Promote verified V16 low-poly botanical first pass to original academy GLB.

Exact hash, 10 source assets, 105 plant placements, 44-classroom wall pots,
40 desk accents, 21 shared-zone pots. Original A01/F and V15 garden unchanged.
"""
from pathlib import Path
import hashlib,json,copy,shutil
root=Path("model-viewer")
st=Path(".academy-stage/model-viewer/staged-output/academy-interior-greenery-v16")
report=json.loads((st/"report.json").read_text())
qa=json.loads((st/"plant-v16-static-qa.json").read_text())
OLD="e269a295159f0f7d3e82df864376579e66f4b92be204ce66667a3c78b9d3ea41"
NEW="aa1f5778f9d87672d0df1c7ba36b6202108eb14bbc4aeb4bb322504c7dbf2dc0"
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
official=root/"lahudi-academy.glb";asset=st/report["main_school"]["file"]
assert sha(official)==OLD,("Official V15 changed; no overwrite",sha(official))
assert sha(asset)==NEW==report["candidate_sha256"]==qa["sha256"]
assert report["source_sha256"]==OLD
assert report["plant_instances"]==105
assert report["new_plant_glb_assets"]==10
assert report["source_school_nodes_preserved"]==12067
assert report["main_school"]["nodes"]==12122
assert report["classroom_wall_pots"]==44
assert report["existing_desk_top_pots"]==40
assert report["zone_counts"]=={"B":48,"C":36,"D":6,"E":8,"G":4,"H":3}
assert report["A_and_F_planted_interior_nodes"]==0
assert report["no_library_books_modified"] and report["no_Bessie_hero_plant_modified"]
assert qa["status"]=="PASS_REGISTERED_FURNITURE_SPATIAL_QA" and qa["static_plant_to_registered_furniture_overlap_count"]==0
assert qa["standalone_glb_assets_verified"]==10
assets=json.loads((st/"asset-index-v16.json").read_text())["assets"]
assert len(assets)==10
assert all(sha(st/"plant-assets"/a["file"])==a["sha256"] for a in assets)
backup=root/"backups/pre-academy-v16-indoor-plants/lahudi-academy.glb"
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists(),"Previous V16 attempt? Stop."
shutil.copyfile(official,backup)
shutil.copyfile(asset,official)
assert sha(official)==NEW and sha(backup)==OLD
mp=root/"current-models.json"
manifest=json.loads(mp.read_text())
assert len(manifest["models"])==5
others={m["model"]:copy.deepcopy(m) for m in manifest["models"] if m["model"]!="lahudi-academy.glb"}
m=next(m for m in manifest["models"] if m["model"]=="lahudi-academy.glb")
assert m["current_sha256"]==OLD
m.update({
 "version":"ACADEMY-V16-INDOOR-GREENERY-PHASE1-REVIEW",
 "current_sha256":NEW,
 "backup":"backups/pre-academy-v16-indoor-plants/lahudi-academy.glb",
 "backup_sha256":OLD,
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-interior-greenery-v16/"+report["main_school"]["file"],
 "integrated_contents":"V16 105 original Gothic indoor plant placements installed in B/C 44 provisional teaching rooms, D entrance, E northern public academic, G assembly and H archive; 10 standalone botanical reusable source GLB files on stage. 44 floor pots in classrooms, 40 actual desk tabletop pots, 21 shared-room floor pots. Original A01 and F_NATIVE_LIBRARY interior not planted yet pending native geometry/camera mapping. Old V15 Bessie garden pot, all V14 entry and 1734 prior furniture preserved; no character collision required by author. Plant models are batched low-poly matte Gothic styling, not story-canonical species and not final photoreal assets.",
 "interior_plants_version":"V16_LOW_POLY_PHASE1",
 "interior_plants_total":105,
 "interior_plants_source_glb_types":10,
 "interior_plants_by_zone":report["zone_counts"],
 "interior_A01_native_F_plants_status":"NOT_INSTALLED__NATIVE_STORY_SCENE_PROTECTED",
 "interior_greenery_registered_furniture_qa":"PASS_NO_REGISTERED_FURNITURE_OVERLAP",
 "interior_greenery_render_qa":"PENDING_PUBLIC_SCREENSHOT",
 "interior_plant_approval":"PENDING_AUTHOR_ANIMATION_REVIEW",
 "V15_Bessie_back_garden_plant_preserved":True,
 "character_collision":"SKIPPED_BY_USER_REQUEST"
})
assert others=={x["model"]:x for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
manifest["version"]="mixed-current-academy-v16-indoor-greenery-20261024"
mp.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n")
viewer=root/"index.html"
s=viewer.read_text()
a='"file": "lahudi-academy.glb?v=rb2-vitti-winter-garden-v15-20261023"'
b='"file": "lahudi-academy.glb?v=rb2-indoor-greenery-v16-20261024"'
assert s.count(a)==1,s.count(a)
s=s.replace(a,b)
old="current-models.json?v=20261023-academy-rb2-v15"
assert s.count(old)==1
s=s.replace(old,"current-models.json?v=20261024-academy-rb2-v16")
needle='<button class="btn" id="academyGarden" type="button">薇媞後花園 V15</button>'
assert s.count(needle)==1
s=s.replace(needle,needle+'<button class="btn" id="academyPlants" type="button">室內植栽 V16</button>')
handler="$('academyGarden').onclick=()=>academyView('garden');"
assert s.count(handler)==1
block="""
function academyPlantFocus(){
  if(!model||modelKey!=='lahudi-academy')return;
  if(pov)exitPov();
  const offset=model.position.y;
  fitBox=new THREE.Box3(new THREE.Vector3(-138.9,offset-0.5,-64.2),
     new THREE.Vector3(-127.85,offset+3.7,-53.4));
  // Only the 1F classroom so the plant is visible and 2F is not above it.
  const top=3.59+offset;
  setCut(Math.min(.995,Math.max(.001,(top-box.min.y)/size.y)));
  fit(true);
  if(anim){camera.position.copy(anim.p);controls.target.copy(anim.t);controls.update();anim=null;}
  document.querySelectorAll('#academyViews button').forEach(b=>b.setAttribute('aria-pressed','false'));
  $('academyPlants').setAttribute('aria-pressed','true');
}
$('academyPlants').onclick=academyPlantFocus;
"""
s=s.replace(handler,handler+"\n"+block)
# lower kitchen? no, existing A01 and library unaffected.
viewer.write_text(s)
assert 'id="academyPlants"' in s and "academyPlantFocus" in s
print(json.dumps({"released":"ACADEMY-V16-GREENERY-INTEGRATED",
 "sha256":NEW,"V15_backup":str(backup),"bytes":official.stat().st_size,
 "real_source_plants":10,"interior_plant_instances":105,
 "registered_overlap":0,"other_school_GLBS":"UNCHANGED",
 "A01_F_native_rooms":"NOT_MODIFIED", "visual_author_status":"PENDING"},ensure_ascii=False))
