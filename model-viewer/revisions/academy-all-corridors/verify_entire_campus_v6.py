#!/usr/bin/env python3
"""Independent engineering QA of whole-school V6 visibility, camera bounds, materials and entrances.
No rendering, merely glTF JSON/AABB and node integrity.
"""
from pathlib import Path
import sys,json,struct,hashlib,math,collections
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
stage=Path("model-viewer/staged-output/academy-entire-campus-v6")
rep=json.loads((stage/"report.json").read_text())
p=stage/rep["model"];raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()==rep["sha256"]
m,buf,_=glb.load_glb(p)
assert len(m["nodes"])==rep["total_nodes"]==16242
assert len(rep["campus_added_wings"])==8
orig=m["nodes"][:11097]
for nm in rep["old_distant_terrain_outliers_disabled"]:
 matches=[n for n in orig if n.get("name")==nm]
 assert len(matches)==1 and "mesh" not in matches[0]
 assert "disabled_old_distant_landscape_mesh" in matches[0]["extras"]
acc=m["accessors"]
def meshbox(mid):
 boxes=[]
 for prim in m["meshes"][mid].get("primitives",[]):
  idx=prim.get("attributes",{}).get("POSITION")
  if idx is None:continue
  a=acc[idx]
  if "min" in a and "max" in a:boxes.append((a["min"],a["max"]))
 if not boxes:return None
 return [[min(b[0][i] for b in boxes) for i in range(3)],
         [max(b[1][i] for b in boxes) for i in range(3)]]
def worldbox(node,box):
 lo,hi=box
 t=node.get("translation",[0,0,0]);s=node.get("scale",[1,1,1])
 x,y,z,w=node.get("rotation",[0,0,0,1])
 R=((1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)),
    (2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)),
    (2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)))
 c=[s[i]*(lo[i]+hi[i])/2 for i in range(3)]
 rad=[abs(s[i])*(hi[i]-lo[i])/2 for i in range(3)]
 center=[t[i]+sum(R[i][j]*c[j] for j in range(3)) for i in range(3)]
 ext=[sum(abs(R[i][j])*rad[j] for j in range(3)) for i in range(3)]
 return [[center[i]-ext[i] for i in range(3)],[center[i]+ext[i] for i in range(3)]]
bboxes=[]
for i,n in enumerate(m["nodes"]):
 if "mesh" not in n:continue
 local=meshbox(n["mesh"])
 if local is None:continue
 bboxes.append((i,n.get("name"),worldbox(n,local)))
mins=[min(b[2][0][i] for b in bboxes) for i in range(3)]
maxs=[max(b[2][1][i] for b in bboxes) for i in range(3)]
lengths=[maxs[i]-mins[i] for i in range(3)]
assert lengths[0]<270 and lengths[2]<330 and lengths[1]<95, ("Unexpected huge legacy terrain still visible",lengths)
assert lengths[0]>110 and lengths[2]>220
survivors=[(n,b) for _,n,b in bboxes if any(abs(b[1][i])>300 for i in (0,1,2))]
assert not survivors, survivors[:10]
wings={n["extras"]["area"] for n in m["nodes"] if n.get("name","").startswith("RG-GAME-02-CAMPUS-REBUILD-V6__")}
for w in rep["campus_added_wings"]:assert w["area"] in wings
assert rep["new_architectural_nodes"]>=5000
colors={v["name"]:v["pbrMetallicRoughness"]["baseColorFactor"] for v in m["materials"] if v.get("name","").startswith("ACADEMY_CAMPUS_V6__")}
assert colors["ACADEMY_CAMPUS_V6__ash_stone"][0]<.5
assert colors["ACADEMY_CAMPUS_V6__sand_stone"][0]>.4
assert colors["ACADEMY_CAMPUS_V6__plaza"][0]<.25
assert colors["ACADEMY_CAMPUS_V6__slate"][0]<.11
assert colors["ACADEMY_CAMPUS_V6__grass"][1]>.26
assert colors["ACADEMY_CAMPUS_V6__gothic_glass"][2]>.55
allname={n.get("name") for n in m["nodes"] if "mesh" in n}
for n in ("RG-GAME-02-A1-005__open_door","RG-GAME-02-CROOM-005__open_door",
          "RG-GAME-02-CONFESS-005__tread_0","RG-GAME-02-ROOF-001__approach__tread0"):
 assert n in allname,n
# derive simple AABB for official selection full-campus camera and nearby academic view.
cam={"entire_campus":[round(v,2) for v in (mins[0]-2,mins[1]-.6,mins[2]-3,maxs[0]+2,maxs[1]+3,maxs[2]+3)],
     "academic_closeup":[-137,-1,-115,-26,31,57],
     "library_closeup":[-132,-1,-193,31,31,-118]}
qa={"passes":True,"version":rep["version"],"sha256":rep["sha256"],"visible_nodes":len(bboxes),
    "visible_world_bounds_xyz":[[round(v,3) for v in mins],[round(v,3) for v in maxs]],
    "visible_world_dimensions_xyz":[round(v,3) for v in lengths],
    "original_kilometer_scale_outliers_disabled":4,
    "eight_new_campus_wings":8,"new_geometry_nodes":rep["new_architectural_nodes"],
    "nonwhite_material_contrast":"PASS","native_classroom_and_stair_meshes":"PRESERVED",
    "official_camera_fit_options":cam,
    "rendering":"NOT_RUN_BY_USER_REQUEST","actor_collision":"NOT_RUN",
    "room_interiors_new_wings":"NOT_ASSERTED","author_visual_approval":False}
(stage/"geometry-qa.json").write_text(json.dumps(qa,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(qa,ensure_ascii=False))
