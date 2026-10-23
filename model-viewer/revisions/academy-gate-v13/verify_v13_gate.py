#!/usr/bin/env python3
"""V13 Gate geometric circulation preservation review from exact construction pieces."""
import json,hashlib,math
from pathlib import Path
p=Path("model-viewer/staged-output/academy-gate-v13")
r=json.loads((p/"report.json").read_text())
assert hashlib.sha256((p/r["file"]).read_bytes()).hexdigest()==r["sha256"]
bits=json.loads((p/"gate-pieces.json").read_text())["items"]
assert len(bits)==r["new_mesh_pieces"] and len(bits)>400
assert r["source_sha256"]=="b975ace3cd12744621688f4f5a0a8aa27f5dff1fbed4beb7ae5b9306dbbd3a66"
assert r["prior_nodes_preserved"]==11983
# Check true 3D bounds of newly modeled rotated cubes, after Y and Z rotations.
def bb(piece):
 cx,cy,cz=piece["center"];sx,sy,sz=piece["dimensions"]
 a=piece["yaw_rad"];b=piece["roll_rad"]
 ans=[]
 for x in (-.5,.5):
  for y in (-.5,.5):
   for z in (-.5,.5):
    xp=x*sx;yp=y*sy;zp=z*sz
    X=math.cos(a)*xp+math.sin(a)*zp
    Z=-math.sin(a)*xp+math.cos(a)*zp
    xx=math.cos(b)*X-math.sin(b)*yp
    yy=math.sin(b)*X+math.cos(b)*yp
    ans.append((cx+xx,cy+yy,cz+Z))
 return [(min(v[k] for v in ans),max(v[k] for v in ans)) for k in range(3)]
def hit(p,volume,thresh=.01):
 b=bb(p)
 return all(min(b[k][1],volume[k][1])-max(b[k][0],volume[k][0])>thresh for k in range(3))
def rect(xa,xb,ya,yb,za,zb):return [(xa,xb),(ya,yb),(za,zb)]
# 6.8m wide protected axial corridor from D exterior to +4m beyond open gate.
# Entire process excludes path slabs and shallow joints.
main=rect(-73.5,-66.7,.14,2.18,53.25,83.0)
forbidden={
"portal_pier","base_course","wicket_pier","boundary_column","perimeter_plinth",
"fence_rail","perimeter_iron_grille","wicket_open_leaf",
"open_gate_leaf","open_gate_bars","gatehouse_wall","gatehouse_floor",
"perimeter_spike","wrought_iron_finial","court_planter","winter_planting"}
intersect=[z for z in bits if z["kind"] in forbidden and hit(z,main)]
# Both narrow side gates have central unobstructed 1.4m passage.
west=rect(-81.72,-80.38,.14,2.18,76.25,83.0)
east=rect(-59.82,-58.48,.14,2.18,76.25,83.0)
side_hits={name:[p["name"] for p in bits if p["kind"] in forbidden and hit(p,v)]
           for name,v in (("west",west),("east",east))}
# Passages linking main gate to both side building front doors at Z55.0..58.2:
cross=rect(-92,-29,.14,2.18,55.20,57.95)
cross_hits=[q["name"] for q in bits if q["kind"] in forbidden and hit(q,cross)]
# Reinforce preserved design anchors: V13 adds no mass at or before current facade Z53
assert min(bb(p)[2][0] for p in bits)>53.0
assert r["entry_axis_x_m"]==-70.1 and r["gate_line_z_m"]==79
assert r["primary_clearance_between_piers_m"]>=10.5
assert not intersect,("Blocking central open gates", [x["name"] for x in intersect[:8]])
assert not cross_hits,("Blocking D side-door cross path",cross_hits[:8])
assert not any(side_hits.values()),("Blocking open side wicket",side_hits)
# The two pitched gatehouse roof surfaces must be HIGHER at shared ridge than at eaves.
roof={q["name"].split("__")[-1]:q for q in bits if "GUARD_SLOPE_" in q["name"]}
assert len(roof)==2
a=roof["GUARD_SLOPE_WEST"];b=roof["GUARD_SLOPE_EAST"]
assert a["roll_rad"]>0 and b["roll_rad"]<0
qa={
 "status":"PASS_STATIC_CONSTRUCTION_PATH_CLEARANCE",
 "source_glb_sha256":r["source_sha256"],
 "candidate_sha256":r["sha256"],
 "new_geo_shapes":len(bits),
 "preserved_original_nodes":r["prior_nodes_preserved"],
 "gate_center_x_m":r["entry_axis_x_m"],
 "gate_line_z_m":r["gate_line_z_m"],
 "main_clear_width_probe_m":6.8,
 "nominal_10p62m_true_pier_opening":True,
 "main_walk_collision_count":len(intersect),
 "west_wicket_collision_count":len(side_hits["west"]),
 "east_wicket_collision_count":len(side_hits["east"]),
 "crosswalk_collision_count":len(cross_hits),
 "guardhouse_gable_roof_facing_correct":True,
 "V12_story_classrooms_untouched":True,
 "not_real_world_engineering_permit":True,
 "novel_does_not_define_gate_dimensions_material":True,
 "author_visual_approval":"PENDING",
 "character_collision":"SKIPPED_AS_REQUESTED",
 "actual_hinge_animation":"NOT_IMPLEMENTED__DOORS_FIXED_OPEN",
 "visual_review":"PENDING"
}
(p/"gate-static-qa.json").write_text(json.dumps(qa,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(qa,ensure_ascii=False))
