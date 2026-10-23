#!/usr/bin/env python3
"""Promote checked V12 academy interior first phase to same canonical school file.

V11 backup, all other 4 models byte-preserved, 8-district masterplan locked.
Viewer adds ONE small interior selection instead of a new separate model/viewer.
No false claim of original standalone furniture GLBs being embedded.
"""
import json,hashlib,shutil,copy
from pathlib import Path
base=Path(".academy-stage/model-viewer/staged-output/academy-interior-furniture-v12")
stage=json.loads((base/"report.json").read_text())
qa=json.loads((base/"placement-qa.json").read_text())
oldsha="caab8cba4cbb9af22252ea2b05a35588b9529fb4af5720b787cf96b33229a9ae"
newsha="b975ace3cd12744621688f4f5a0a8aa27f5dff1fbed4beb7ae5b9306dbbd3a66"
dst=Path("model-viewer/lahudi-academy.glb")
new=base/stage["file"]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(dst)==oldsha,("Official school modified concurrently",sha(dst))
assert sha(new)==stage["sha256"]==newsha
assert qa["sha256"]==newsha
assert qa["status"]=="PASS_COORDINATE_AND_PRESERVATION_ONLY"
assert qa["rooms_checked"]==44 and qa["furniture_instances_checked"]==1734
assert qa["stair_count"]==2 and qa["riser_per_stair"]==26
assert qa["locked_masterplan_8_districts"]
assert qa["original_A01_and_main_library_protected"]
assert stage["floor_aware_batched_meshes"]
assert stage["source_nodes_preserved"]==11923
assert stage["districts_furnished"]==["B","C","D","E","G","H"]
assert stage["reused_original_62_glbs"] is False
backup=Path("model-viewer/backups/pre-academy-v12-interior-furniture/lahudi-academy.glb")
backup.parent.mkdir(parents=True,exist_ok=True)
assert not backup.exists(),"backup exists"
shutil.copyfile(dst,backup)
shutil.copyfile(new,dst)
assert sha(backup)==oldsha and sha(dst)==newsha
manifest_path=Path("model-viewer/current-models.json")
manifest=json.loads(manifest_path.read_text())
assert len(manifest["models"])==5
other={x["model"]:copy.deepcopy(x) for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
official=next(x for x in manifest["models"] if x["model"]=="lahudi-academy.glb")
assert official["current_sha256"]==oldsha
official.update({
 "version":"ACADEMY-V12-INTERIOR-FURNITURE-PHASE1-REVIEW",
 "current_sha256":newsha,
 "source_candidate":"rg-ep01-s01-stage-20261023:model-viewer/staged-output/academy-interior-furniture-v12/"+stage["file"],
 "backup":"backups/pre-academy-v12-interior-furniture/lahudi-academy.glb",
 "backup_sha256":oldsha,
 "integrated_contents":"V12 provisional first stage: 44 newly divided rooms and 1734 interior furniture placements in B/C teaching, D entry, E academic, G assembly, H archives; 2 north teaching-wing switchback staircases with 26 risers each; original A01/CROOM and main library untouched; exterior V11 all unchanged. 62 catalog furniture types are available as separate standalone GLBs, but 30 types are represented by procedural low-poly geometrical equivalents in this single official GLB. Not all 102 planned rooms furnished.",
 "interior_furniture_count":1734,
 "interior_rooms_provisional":44,
 "interior_furniture_types_used":stage["furniture_types_used"],
 "original_62_standalone_furniture_GLBS_directly_embedded":False,
 "furniture_generation":"PROCEDURAL_LOW_POLY_BY_DESIGN_ITEM_DIMENSIONS",
 "B_C_second_floor_access":"TWO_PROVISIONAL_26_RISER_STAIRCORES_PRESENT",
 "author_full_item_approval":"PENDING",
 "visual_qa":"NOT_YET_COMPLETED_FOR_V12",
 "character_collision":"NOT_REQUIRED_BY_USER"
})
assert other=={x["model"]:x for x in manifest["models"] if x["model"]!="lahudi-academy.glb"}
manifest["version"]="mixed-current-academy-v12-interior-phase1-20261023"
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
path=Path("model-viewer/index.html")
html=path.read_text()
old='"file": "lahudi-academy.glb?v=rb2-gothic-exterior-v11-20261023"'
newfile='"file": "lahudi-academy.glb?v=rb2-interior-v12-review-20261023"'
assert html.count(old)==1
html=html.replace(old,newfile)
oldmanifest="current-models.json?v=20261023-academy-rb2-v11"
assert html.count(oldmanifest)==1
html=html.replace(oldmanifest,"current-models.json?v=20261023-academy-rb2-v12")
html=html.replace("拉乎迪學院（校園＋教室＋告白走廊）","拉乎迪學院（校園＋V12 家具初稿）")
oldspan='<span id="academyViews" hidden style="display:inline-flex;gap:6px;flex-wrap:wrap"><button class="btn" id="academyWhole" type="button">整座學院</button><button class="btn" id="academySchool" type="button">主教學樓</button><button class="btn" id="academyLibrary" type="button">圖書館區</button></span>'
assert html.count(oldspan)==1
picker='<label id="academyInteriorPicker" hidden class="sample"><span>室內家具</span><select id="academyInteriorSelect" aria-label="查看學院室內分區"><option value="">選擇區域／樓層</option><option value="B1">西教學翼 1F</option><option value="B2">西教學翼 2F</option><option value="C1">東教學翼 1F</option><option value="C2">東教學翼 2F</option><option value="D1">南入口 1F</option><option value="E1">北學術廳 1F</option><option value="G1">禮堂 1F</option><option value="H1">檔案翼 1F</option></select></label>'
html=html.replace(oldspan,oldspan+picker)
needle="$('academyLibrary').onclick=()=>academyView('library');"
assert html.count(needle)==1
additional=r'''
// Academy V12: camera/cutaway presets for review of provisional furniture rooms.
// No separate GLB loaded; always inspect the official single school file.
function academyInteriorView(zone){
 if(!model||modelKey!=='lahudi-academy')return;
 if(pov)exitPov();
 const offset=model.position.y;
 const presets={
   B1:[-140,-1,-69,-113,3.70,25],
   B2:[-140,3.85,-69,-113,8.20,25],
   C1:[-36,-1,-69,-13,3.70,25],
   C2:[-36,3.85,-69,-13,8.20,25],
   D1:[-99,-1,29,-21,3.70,54],
   E1:[-119,-1,-113,-39,3.70,-81],
   G1:[-124,-1,-171,-94,3.70,-124],
   H1:[3,-1,-175,29,3.70,-142]
 };
 if(!presets[zone])return;
 const a=presets[zone];
 fitBox=new THREE.Box3(
  new THREE.Vector3(a[0],a[1]+offset,a[2]),
  new THREE.Vector3(a[3],a[4]+offset,a[5])
 );
 // Cut at chosen world's Y height, separating upstairs from downstairs.
 const cutWorldY=(zone.endsWith('2')?8.15:3.56)+offset;
 setCut(Math.min(.995,Math.max(.001,(cutWorldY-box.min.y)/size.y)));
 fit(true);
 if(anim){camera.position.copy(anim.p);controls.target.copy(anim.t);controls.update();anim=null;}
 document.querySelectorAll('#academyViews button').forEach(b=>b.setAttribute('aria-pressed','false'));
}
$('academyInteriorSelect').onchange=e=>academyInteriorView(e.target.value);
'''
html=html.replace(needle,needle+"\n"+additional)
oldh="$('academyViews').hidden=modelKey!=='lahudi-academy'||window.GLBPreview.active;"
assert html.count(oldh)==1
html=html.replace(oldh,oldh+"$('academyInteriorPicker').hidden=modelKey!=='lahudi-academy'||window.GLBPreview.active;if(modelKey==='lahudi-academy')$('academyInteriorSelect').value='';")
assert "academyInteriorView(zone)" in html and 'id="academyInteriorSelect"' in html
path.write_text(html)
print(json.dumps({"result":"PROMOTED_REVIEW_DRAFT_V12","sha":newsha,
 "bytes":dst.stat().st_size,"old_backup":str(backup),
 "furniture":stage["furniture_instances"],"provisional_rooms":stage["new_rooms"],
 "floor_aware_batches":stage["new_batched_meshes"],
 "original_story_interior":"PRESERVED","other_4_models":"UNCHANGED",
 "caveat":"Needs final author view; furnishings are generated equivalents not original source GLB contents"},ensure_ascii=False))
