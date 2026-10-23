#!/usr/bin/env python3
"""Check actual V16 low-poly GLB asset pack and 3D placement coordinates.

Only new greenery vs existing registered V12 furniture + V9 footprints; original
A01 and original F library excluded until native scene furniture supports a
reliable plant location. Not a physics/navmesh or animated character collision.
"""
from pathlib import Path
import json,math,collections,hashlib,struct
base=Path("candidate-output/academy-interior-greenery-v16")
m=json.loads((base/"report.json").read_text())
b=(base/m["main_school"]["file"]).read_bytes()
assert len(b)==m["main_school"]["bytes"] and hashlib.sha256(b).hexdigest()==m["candidate_sha256"]
assert b[:4]==b"glTF" and struct.unpack_from("<I",b,8)[0]==len(b)
p=json.loads((base/"plant-placements-v16.json").read_text())
plants=p["instances"];assert len(plants)==m["plant_instances"]
assets=json.loads((base/"asset-index-v16.json").read_text())["assets"]
assert len(assets)==10 and len({x["style"]["id"] for x in assets})==10
assert all(hashlib.sha256((base/"plant-assets"/a["file"]).read_bytes()).hexdigest()==a["sha256"] for a in assets)
assert all(a["bytes"]>1500 for a in assets)
assert m["source_school_nodes_preserved"]==12067
assert m["no_furniture_removal"] and m["no_library_books_modified"]
assert m["no_Bessie_hero_plant_modified"] and m["no_A01_corridor_rebuild"]
assert m["no_character_collision"]=="SKIPPED_AS_REQUESTED"
assert set(m["zone_counts"])==set("BCDEGH")
assert sum(m["zone_counts"].values())==len(plants)
assert len([x for x in plants if x["zone"] in "BC" and x["placement_type"]=="floor"])>=40
assert len([x for x in plants if x["placement_type"]=="desktop"])>=18
assert not any(x["zone"] in "AF" for x in plants)
assert m["new_plant_glb_assets"]==10 and m["source_plant_names_are_design_families_not_novel_canon"]
# each classroom pot stays on 1F or 2F and inside its mapped room
source=json.loads(Path(".academy-stage/model-viewer/staged-output/academy-interior-furniture-v12/furniture-placements.json").read_text())
rs={a["id"]:a for a in source["rooms"]}
tables={x["room"]:[] for x in source["rooms"]}
furn=collections.defaultdict(list)
for x in source["placements"]:furn[x["room"]].append(x)
seen=set();problems=[]
def intersects(a,b,padding):
 return abs(a[0]-b[0])<(a[2]+b[2])/2+padding and abs(a[1]-b[1])<(a[3]+b[3])/2+padding
for g in plants:
 assert g["instance_id"] not in seen;seen.add(g["instance_id"])
 x,y,z=g["position"];w=g["diameter_m"]
 assert x==x and y==y and z==z and w>0
 room=rs.get(g["room"])
 if room:
  x0,x1,z0,z1=room["bounding_xz"]
  assert x0+.12<=x-w/2 and x+w/2<=x1-.12
  assert z0+.12<=z-w/2 and z+w/2<=z1-.12
  origin=4.0 if room["floor"]==2 else 0.0
  if g["placement_type"]=="floor":
   assert y==origin
   for a in furn[g["room"]]:
    if a["position"][1]!=origin:continue
    if intersects((x,z,w,w),(a["position"][0],a["position"][2],a["w_m"],a["d_m"]),.11):
     problems.append((g["instance_id"],"furniture_overlap",a["id"]))
  else:
   assert g["support_furniture"] in ("LH-TC01","LH-OF01","LH-LB08","LH-SP01","LH-OF05")
   assert any(t["id"]==g["support_furniture"] and
              abs(y-t["position"][1]-t["h_m"]-.013)<.008
              for t in furn[g["room"]])
 else:
  assert g["zone"] in "DEGH"
assert not problems,problems[:10]
QA={
 "version":m["version"],"status":"PASS_REGISTERED_FURNITURE_SPATIAL_QA",
 "sha256":m["candidate_sha256"],
 "garden_v15_source_sha256":m["source_sha256"],
 "standalone_glb_assets_verified":10,
 "original_school_nodes":12067,
 "plants_verified":len(plants),
 "installed_zones":m["zone_counts"],
 "provisional_room_pots_checked":m["classroom_wall_pots"],
 "real_desk_supporting_furniture_verified":m["existing_desk_top_pots"],
 "A01_and_library_original_geometry_protected":True,
 "native_A_F_plants_pending_native_scene_location":True,
 "V15_story_hero_plant_unchanged":True,
 "static_plant_to_registered_furniture_overlap_count":len(problems),
 "character_collision":"SKIPPED_AS_REQUESTED",
 "animation_visual_qa":"PENDING",
 "limitations":[
  "Existing V12 furniture inventory is low-poly and provisional in 44 classrooms",
  "No additions in A01 narrative corridor nor F native library until exact camera/props audit",
  "Floorplan bounds and desk tabletop source positions were checked, not full triangle/navmesh clearance",
  "All plants are original Gothic school styling, not novel-verified botanical species"
 ]}
(base/"plant-v16-static-qa.json").write_text(json.dumps(QA,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(QA,ensure_ascii=False))
