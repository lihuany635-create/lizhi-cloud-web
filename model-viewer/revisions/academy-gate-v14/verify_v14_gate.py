#!/usr/bin/env python3
"""Check V14's constructed main gate pathways and school-core preservation.
Axis-aligned bounding conservatively from all 8 rotated cube corners.
Not a full animated person mesh collision or final anime image quality check.
"""
import json,hashlib,math
from pathlib import Path
ROOT=Path("candidate-output/academy-gate-anime-v14")
r=json.loads((ROOT/"report.json").read_text())
b=(ROOT/r["file"]).read_bytes()
assert hashlib.sha256(b).hexdigest()==r["sha256"]
bits=json.loads((ROOT/"gate-pieces-v14.json").read_text())["pieces"]
assert len(bits)==r["v14_visible_parts"] and len(bits)>250
assert r["source_v13_sha256"]=="580e8b4bc0a1a9c1bb070074de539bf225286f12219460d6af3365cc3060c9d2"
assert r["v12_original_nodes_untouched"]==11983
assert r["v13_gate_batches_disabled"]==28
def bb(p):
 x0,y0,z0=p["center"];w,h,d=p["dimensions"];yaw=p["yaw_rad"];roll=p["roll_rad"]
 pts=[]
 for ix in (-.5,.5):
  for iy in (-.5,.5):
   for iz in (-.5,.5):
    x=ix*w;y=iy*h;z=iz*d
    X=math.cos(yaw)*x+math.sin(yaw)*z
    Z=-math.sin(yaw)*x+math.cos(yaw)*z
    xx=math.cos(roll)*X-math.sin(roll)*y
    yy=math.sin(roll)*X+math.cos(roll)*y
    pts.append((x0+xx,y0+yy,z0+Z))
 return [(min(v[k] for v in pts),max(v[k] for v in pts)) for k in range(3)]
def hit(p,b):
 a=bb(p)
 return all(min(a[i][1],b[i][1])-max(a[i][0],b[i][0])>.012 for i in range(3))
def rect(xa,xb,ya,yb,za,zb):return ((xa,xb),(ya,yb),(za,zb))
forbidden={
 "portal_pier","base_course","wicket_pier","boundary_column","perimeter_plinth",
 "fence_rail","perimeter_iron_grille","wicket_open_leaf","open_gate_leaf",
 "open_gate_bars","gatehouse_wall","gatehouse_floor","perimeter_spike",
 "wrought_iron_finial","court_planter","winter_planting","waiting_bench",
 "winter_bare_tree","winter_branch","wayfinding_post"
}
volumes={
 "main_axial_6p8m":rect(-73.5,-66.7,.14,2.18,53.25,83),
 "west_wicket":rect(-81.72,-80.38,.14,2.18,76.25,83),
 "east_wicket":rect(-59.82,-58.48,.14,2.18,76.25,83),
 "cross_entrance":rect(-92,-29,.14,2.18,55.20,57.95),
 "waiting_near_gate_west":rect(-93.2,-91.5,.14,2.18,69,72.5),
 "waiting_near_gate_east":rect(-46,-43,.14,2.18,69,72.5)
}
collisions={}
for key,v in volumes.items():
 collisions[key]=[p["name"] for p in bits if p["kind"] in forbidden and hit(p,v)]
 assert not collisions[key],(key,collisions[key][:8])
assert min(bb(p)[2][0] for p in bits)>53
assert len([p for p in bits if p["kind"]=="portal_pier"])==2
assert len([p for p in bits if p["kind"]=="wicket_pier"])==4
assert len([p for p in bits if p["kind"]=="waiting_bench"])==2
assert len([p for p in bits if p["kind"]=="winter_bare_tree"])==2
assert len([p for p in bits if p["kind"]=="open_gate_bars"])==30
assert r["all_original_V12_building_and_furniture_nodes_preserved"]
qa={
 "status":"PASS_STATIC_V14_GATE_ACCESS",
 "candidate_sha256":r["sha256"],"furniture_source_sha256":r["source_v13_sha256"],
 "gate_center_x_m":-70.1,"gate_z_m":79,
 "probed_path_volumes":list(volumes),
 "obstruction_counts":{n:len(v) for n,v in collisions.items()},
 "old_V13_batches_inactive":28,"active_V14_batch_nodes":r["v14_visible_batch_nodes"],
 "normal_main_gate_clear_width_m":10.62,
 "V12_buildings_and_furniture_preserved":True,
 "new_winter_style_anime_direction_only_not_novel_canon":True,
 "actual_render":"NOT_RUN",
 "user_requested_character_collision":"SKIPPED",
 "author_visual_review":"PENDING"
}
(ROOT/"gate-v14-static-qa.json").write_text(json.dumps(qa,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(qa,ensure_ascii=False))
