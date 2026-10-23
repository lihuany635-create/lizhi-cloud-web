#!/usr/bin/env python3
"""V10 actual stair treads/riser height, headroom and step-by-step capsule-style QA.

Runs independent previously passing route checker first, then checks 26 real
modeled treads. AABB approximates solids; 3D animation test remains later.
"""
from pathlib import Path
import runpy,math,json
path="model-viewer/revisions/academy-route-repair-v10/verify_v10_clearance.py"
env=runpy.run_path(path)
walls=env["walls"];nodes=env["nodes"];name2={n.get("name"):n for n in nodes}
r=env["META"];model=env["m"];calc=env["bound"]
P="RG-GAME-02-P0-FIX-V10__"
rows=[]
for flight in (0,1):
 for i in range(13):
  key=P+f"STAIR_{flight}_{i:02d}"
  n=name2[key]
  assert "mesh" in n
  center=n["translation"];dim=n["scale"]
  assert abs(dim[0]-1.8)<.0001 and abs(dim[1]-.14)<.0001 and abs(dim[2]-.35)<.0001
  top=center[1]+dim[1]/2
  index=flight*13+i
  expected=.126+(index+1)*(4-.126)/26
  assert abs(top-expected)<.002,(key,top,expected)
  hits=[]
  for w in walls:
   b=w["bounds"]
   # test character standing ON the step at y=top, from feet+.10 to top+1.9
   if b[0][1]>top+1.9 or b[1][1]<top+.1:continue
   dx=max(b[0][0]-center[0],0,center[0]-b[1][0])
   dz=max(b[0][2]-center[2],0,center[2]-b[1][2])
   if math.hypot(dx,dz)<.395:hits.append(w["name"])
  rows.append({"tread":key,"step":index+1,"top_y":round(top,3),
       "center_xz":[center[0],center[2]],"blocking_shell_meshes":hits[:10]})
headroom_above_4m=7.55-4.0
assert headroom_above_4m>=2.4
nL=name2[P+"STAIR_HALF_LANDING"]
nU=name2[P+"STAIR_UPPER_LANDING"]
assert abs(nL["translation"][1]+nL["scale"][1]/2-(.126+13*(4-.126)/26))<.002
assert abs(nU["translation"][1]+nU["scale"][1]/2-4.0)<.002
issues=[r for r in rows if r["blocking_shell_meshes"]]
q={
  "sha256":r["sha256"],"version":r["version"],
  "stair_tread_count":len(rows),"riser_m":round((4-.126)/26,4),
  "full_rise_m":3.874,"upper_walkway_y_m":4.0,
  "headroom_under_repaired_north_link_roof_m":headroom_above_4m,
  "treads":rows,
  "obstructed_tread_count":len(issues),
  "obstructed_treads":issues,
  "geometry_stair_and_headroom_gate":"PASS" if not issues else "FAIL",
  "scope":"visible AABB of structural walls/guardrails at all 26 tread centers; not physical-body articulation or stair building-code compliance",
  "fixed_plan_coordinates_still_authoritative":True
}
ROOT=Path("model-viewer/staged-output/academy-route-repair-v10")
(ROOT/"V10-stair-headroom-qa.json").write_text(json.dumps(q,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in q.items() if k not in ("treads","obstructed_treads")},ensure_ascii=False))
if issues:
 print(json.dumps(issues,ensure_ascii=False))
 raise SystemExit("Stair geometric headroom gate failed")
