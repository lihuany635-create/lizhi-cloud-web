#!/usr/bin/env python3
"""V10 independent GLB geometry and walking clearance verification.

Broadphase conservative world AABBs, then disk/capsule centerline test at 0.25m.
AABB is NOT polygon-level exact testing; note that clearly in evidence.
"""
import json,struct,math,hashlib,sys
from pathlib import Path
from collections import Counter
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
ROOT=Path("model-viewer/staged-output/academy-route-repair-v10")
META=json.loads((ROOT/"report.json").read_text())
F=ROOT/META["file"]
assert hashlib.sha256(F.read_bytes()).hexdigest()==META["sha256"]
m,bin,_=glb.load_glb(F)
nodes=m["nodes"];mesh=m["meshes"];acc=m["accessors"];pref="RG-GAME-02-PLAN-LOCK-V9__"
base="RG-GAME-02-P0-FIX-V10__"
assert len(nodes)==META["result_nodes"]
pos_cache={}
def bound(n):
 mid=n["mesh"]
 if mid not in pos_cache:
  groups=[]
  for pri in mesh[mid]["primitives"]:
   key=pri.get("attributes",{}).get("POSITION")
   if key is None:continue
   a=acc[key];groups.append([a["min"],a["max"]])
  if not groups:return None
  pos_cache[mid]=[[min(g[0][i] for g in groups) for i in range(3)],
                  [max(g[1][i] for g in groups) for i in range(3)]]
 lo,hi=pos_cache[mid]
 x,y,z,w=n.get("rotation",[0,0,0,1])
 scale=n.get("scale",[1,1,1]);off=n.get("translation",[0,0,0])
 R=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
    [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
    [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
 ctr=[scale[i]*(lo[i]+hi[i])/2 for i in range(3)]
 rad=[abs(scale[i])*(hi[i]-lo[i])/2 for i in range(3)]
 wc=[off[i]+sum(R[i][j]*ctr[j] for j in range(3)) for i in range(3)]
 we=[sum(abs(R[i][j])*rad[j] for j in range(3)) for i in range(3)]
 return [[wc[i]-we[i] for i in range(3)],[wc[i]+we[i] for i in range(3)]]
visible=[]
for i,n in enumerate(nodes):
 if "mesh" not in n:continue
 bb=bound(n)
 if bb is not None:visible.append({"id":i,"name":n.get("name",""),"bounds":bb,
     "kind":n.get("extras",{}).get("kind","")})
def solid(a):
 n=a["name"];k=a["kind"]
 if n.startswith(base):
  return k in ("structural_wall","door_jamb","guardrail")
 if n.startswith(pref):
  return k in ("low_wall","real_passage_jamb","pilaster","arcade_support","party_wall_pier")
 if "RG-GAME-02-EXTERIOR-REBUILD-V5__" in n:
  return any(v in n for v in ("north_end_","south_end_","tower_front_","tower_wall_",
                             "lower_cladding","bay_pilaster_","corner_buttress_",
                             "library_plinth_","library_endwall_"))
 return False
walls=[a for a in visible if solid(a)]
def segment_test(id,points,y=.15,radius=.40,height=1.9,spacing=.25):
 # Points are path CENTERS, not entire slab extents. Probe body capsule over y..y+height.
 collisions={}
 total=0
 for (x0,z0),(x1,z1) in zip(points,points[1:]):
  distance=math.hypot(x1-x0,z1-z0)
  for step in range(max(1,math.ceil(distance/spacing))+1):
   f=step/max(1,math.ceil(distance/spacing))
   x=x0+(x1-x0)*f;z=z0+(z1-z0)*f
   total+=1
   for w in walls:
    b=w["bounds"]
    if b[0][1]>y+height or b[1][1]<y+.07:continue
    dx=max(b[0][0]-x,0,x-b[1][0]);dz=max(b[0][2]-z,0,z-b[1][2])
    if math.hypot(dx,dz)<radius-.005:
     collisions.setdefault(w["name"],{"id":w["name"],"kind":w["kind"],
       "bounds":b,"example_pos_xz":[round(x,2),round(z,2)],
       "clearance_shortfall_m":round(radius-math.hypot(dx,dz),3)})
 return {"route":id,"sample_count":total,"blocker_count":len(collisions),
         "blockers":list(collisions.values())[:20],"assumed_radius_m":radius,
         "assumed_height_m":height,"centerline":points}
raw_routes={
"WEST_TO_MAIN":[(-101,-10.2),(-90,-10.2)],
"EAST_TO_MAIN":[(-51,-10.2),(-64,-10.2)],
"MAIN_TO_E_SOUTH":[(-84,-81.5),(-84,-68.1)],
"E_NORTH_TO_LIBRARY":[(-45.2,-112.5),(-45.2,-142.4)],
"E_TO_G_CHAPEL":[(-105,-112.4),(-105,-124.6)],
"F_TO_H_ARCHIVE":[(-2,-151.5),(3.8,-151.5)],
"WEST_TO_D_WEST_Z":[(-123,24.3),(-123,37.8)],
"WEST_TO_D_WEST_X":[(-124.5,38),(-90.5,38)],
"EAST_TO_D_EAST":[(-31.5,24.35),(-31.5,29.7)],
"MAIN_TO_ENTRANCE":[(-70.1,26.4),(-70.1,39.6)]
}
routes=[segment_test(k,v) for k,v in raw_routes.items()]
# Stair lower access + balcony sampling on actual 2F, guardrails as obstacles.
upper_routes=[
 segment_test("GROUND_TO_STAIR",[(-84,-79.25),(-91.8,-79.25)],y=.15),
 segment_test("SKYBRIDGE_Z",[(-89.4,-78.85),(-89.4,-69.0)],y=4.0),
 segment_test("SKYBRIDGE_X",[(-89.4,-68.85),(-84.0,-68.85),(-84,-67.9)],y=4.0),
]
# Specific structural assertions; untouched named V5 features should still be present.
lookup={n.get("name"):n for n in nodes}
for name in ["RG-GAME-02-A1-005__open_door","RG-GAME-02-CROOM-005__open_door",
             "RG-GAME-02-CONFESS-005__tread_0","RG-GAME-02-ROOF-001__approach__tread0",
             "RG-GAME-02-LIB-002__book"]:
 assert "mesh" in lookup[name],name
assert not any("mesh" in lookup[x] for x in META["disabled_old_nodes"])
assert len([n for n in nodes if n.get("name","").startswith(base+"STAIR_") and
            n.get("extras",{}).get("kind")=="stair_tread"])==26
# Verify two historic portal corridor slabs really NARROWER than full-width V9 candidates.
north=lookup[base+"SLAB_MAIN_TO_E_SOUTH__neckdown"]["scale"][0]
south=lookup[base+"SLAB_MAIN_TO_ENTRANCE__neckdown"]["scale"][0]
assert math.isclose(north,2.9) and math.isclose(south,2.4)
assert len(routes)==10
# Record all evidence; if defects found, do not set QA PASS.
blockers=[{"route":r["route"],"blockers":r["blockers"]} for r in routes+upper_routes if r["blocker_count"]]
status="PASS" if not blockers else "FAIL"
qa={
 "version":META["version"],"sha256":META["sha256"],"check":"V10_CIRCULATION_CENTRELINE_AABB",
 "status":status,"visible_nodes_scanned":len(visible),"obstacle_meshes":len(walls),
 "assumed_actor_capsule":{"radius_m":.4,"height_m":1.9},
 "sample_spacing_m":.25,"route_results":routes,"transition_results":upper_routes,
 "unresolved_issues":["C-06","C-07","C-08","C-09","C-10","C-11"],
 "C-01_to_C-04_repaired_in_glb":True,
 "C-05_stair_and_upper_walkway_geometry_added":True,
 "stairs_count":26,"stairs_rise_m":META["fixed_routes"]["C-05"]["stair_riser_m"],
 "locked_masterplan_remains_unchanged":True,
 "visual_review":"NOT_RUN","triangle_level_collision":"NOT_RUN",
 "warnings":[
 "The broadphase uses bounding boxes; a zero route centerline collision is not an exhaustive full-building animation walk-through.",
 "Stair headroom and each tread exact polygon clearance still require 3D sampled sweep and character/animation check.",
 "No real-world structural engineering or egress compliance is claimed."
 ],
 "blocking_evidence":blockers,
 }
(ROOT/"V10-clearance-qa.json").write_text(json.dumps(qa,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"status":status,"source":qa["sha256"],
  "visible_nodes":len(visible),"obstacles":len(walls),
  "route_summary":[{"id":r["route"],"blockers":r["blocker_count"],"sample_count":r["sample_count"],
                    "examples":[b["id"] for b in r["blockers"][:3]]} for r in routes+upper_routes]},
  ensure_ascii=False))
if blockers:raise SystemExit("V10 candidate geometry walk-centreline check FAILED; DO NOT PROMOTE.")
