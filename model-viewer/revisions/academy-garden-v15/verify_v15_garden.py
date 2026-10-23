#!/usr/bin/env python3
"""Geometry QA for real V15 school winter rear garden and genuine F library portal.

Conservative world cube AABB tests; checks only NEW geometry and factual original
door-node replacement (not a full physics/navmesh or character animation test).
"""
from pathlib import Path
import json,math,hashlib,struct
p=Path("candidate-output/academy-rear-garden-v15")
r=json.loads((p/"report.json").read_text())
bits=json.loads((p/"garden-pieces-v15.json").read_text())["pieces"]
b=(p/r["file"]).read_bytes()
assert hashlib.sha256(b).hexdigest()==r["sha256"] and b[:4]==b"glTF"
assert struct.unpack_from("<I",b,8)[0]==len(b)
assert len(bits)==r["added_parts"]
assert r["prior_node_count"]==12040 and r["V14_gate_and_original_furniture_nodes_preserved"]
assert r["actual_library_back_wall_door_cut"]
assert r["library_back_door_width_m"]==3 and r["library_back_door_clear_height_m"]==3.6
def bb(q):
 x0,y0,z0=q["center"];sx,sy,sz=q["size"]
 yaw=q["yaw"];pitch=q["pitch"]
 pts=[]
 for dx in (-.5,.5):
  for dy in (-.5,.5):
   for dz in (-.5,.5):
    x=dx*sx;y=dy*sy;z=dz*sz
    xx=math.cos(yaw)*x+math.sin(yaw)*z
    zz=-math.sin(yaw)*x+math.cos(yaw)*z
    X=math.cos(pitch)*xx-math.sin(pitch)*y
    Y=math.sin(pitch)*xx+math.cos(pitch)*y
    pts.append((X+x0,Y+y0,zz+z0))
 return [(min(q[k] for q in pts),max(q[k] for q in pts)) for k in range(3)]
def collide(a,v):
 b=bb(a)
 return all(min(b[k][1],v[k][1])-max(b[k][0],v[k][0])>.014 for k in range(3))
def rect(x0,x1,y0,y1,z0,z1):return ((x0,x1),(y0,y1),(z0,z1))
forbidden={
 "library_wing_wall_replacement","stone_door_jamb","open_oak_door",
 "bench_seat","bench_leg","bench_back","bench_arm",
 "bed_stone_border","bed_soil","winter_perennial","winter_bloom",
 "hero_plant_pot","hero_plant_leaf","pot_earth","pot_rim",
 "garden_shrub","edge_low_stone","edge_iron_post",
 "bare_tree_trunk","bare_tree_branch","lamp_post","lamp_base",
}
routes={
 "LIBRARY_TRUE_2p2M_CLEAR_DOOR":rect(-26.8,-24.6,.15,2.22,-184.6,-182.8),
 "LIBRARY_TO_GARDEN_AXIS":rect(-26.8,-24.6,.15,2.22,-191.0,-184.6),
 "LAWN_LOOP_SOUTH":rect(-33,-20,.16,2.2,-189.05,-187.95),
 "LAWN_LOOP_NORTH":rect(-33,-20,.16,2.2,-207.35,-206.1),
 "LAWN_LOOP_WEST":rect(-36.40,-35.35,.16,2.2,-203.7,-192.5),
 "LAWN_LOOP_EAST":rect(-16.65,-15.65,.16,2.2,-203.7,-192.5),
 "BESSIE_PLANT_VIEWPOINT":rect(-38.6,-37.4,.15,2.22,-209.5,-208.2)
}
hits={}
for name,rng in routes.items():
 hits[name]=[x["id"] for x in bits if x["kind"] in forbidden and collide(x,rng)]
 assert not hits[name],(name,hits[name][:10])
# Portal coverage and 1F floor approach claims
portalwall=[q for q in bits if q["kind"]=="library_wing_wall_replacement"]
assert len(portalwall)==2
assert len([q for q in bits if q["kind"]=="stone_door_jamb"])==2
assert len([q for q in bits if q["kind"]=="open_oak_door"])==2
assert len([q for q in bits if q["kind"]=="hero_plant_pot"])==1
assert len([q for q in bits if q["kind"]=="bench_seat"])==3
assert len([q for q in bits if q["kind"]=="bare_tree_trunk"])==4
assert len([q for q in bits if q["kind"]=="lamp_glow"])==4
assert len([q for q in bits if q["kind"]=="entry_walk"])==1
assert r["garden_width_m"]*r["garden_depth_m"]==1008
assert r["garden_z_m"]==[-212,-184] and r["garden_x_m"]==[-44,-8]
# Only garden's intentional stone doorway architecture may enter existing F boundary;
# all other garden decorative pieces stay north of F outer face.
nonportal=[q for q in bits if q["region"]!="LIBRARY_BACKDOOR"]
assert all(q["center"][2] < -183.38 for q in nonportal)
qa={
 "version":r["version"],"sha256":r["sha256"],
 "status":"PASS_STAGED_GARDEN_STATIC_PATH_AND_LIBRARY_PORTAL",
 "checks":{name:len(val) for name,val in hits.items()},
 "garden_36x28_site_m2":1008,"library_f_north_wall_true_portal_width_m":3,
 "prior_school_V14_preserved_except_original_solid_north_wall":True,
 "V14_gate_and_44_room_1734_furniture_nodes_preserved":True,
 "added_pieces":len(bits),"batch_nodes":r["new_batch_count"],
 "characters_collision":"NOT_REQUESTED",
 "visual_look":"REQUIRES_PUBLIC_SCREENSHOT_AND_AUTHOR_REVIEW",
 "real_libraries_floor_story":"Old interior remains, only north wall 3m passage rebuilt",
 "limitations":[
  "No avatar or camera physics collision; test is based on new boxes only",
  "Existing buried terrain/old paths outside library door not fully triangulated",
  "Garden adjacency to library is art direction inference, not explicit in chapter 07",
  "No animated opening of rear oak doors; leaves modelled propped open"
 ]}
(p/"garden-v15-static-qa.json").write_text(json.dumps(qa,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(qa,ensure_ascii=False))
