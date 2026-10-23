#!/usr/bin/env python3
"""Real V15 winter Vitti Garden GLB appended to canonical V14 Lahudi Academy.

Location: north/rear of protected F library (z=-183.2), garden x[-44,-8],
z[-212,-184], connected via a 3m real cut at existing solid library north wall.
This edits just the one old solid north-endwall mesh; original F shelves/books,
all classrooms, all prior V14 campus nodes remain unchanged.
"""
from pathlib import Path
from collections import defaultdict,Counter
import json,hashlib,struct,math,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
SRC=Path("model-viewer/lahudi-academy.glb")
SHA="1d2ac5373a3ae9e276048aa647d3f65ef19bc01ada3ee0e0473b1154568c53b2"
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==SHA,"Official V14 changed"
m,buf,_=glb.load_glb(SRC)
assert len(m["nodes"])==12040,(len(m["nodes"]))
layout=json.loads(Path("model-viewer/revisions/academy-garden-v15/v15-garden-masterplan.json").read_text())
master=json.loads(Path("model-viewer/revisions/academy-locked-plan-v9/masterplan-v1.json").read_text())
assert len(master["zones"])==8
assert layout["new_garden"]["bounds_x"]==[-44,-8]
assert layout["new_garden"]["bounds_z"]==[-212,-184]
before={i:json.dumps(n,sort_keys=True,ensure_ascii=False) for i,n in enumerate(m["nodes"])}
old_scene=list(m["scenes"][m.get("scene",0)]["nodes"])
LIB="RG-GAME-02-EXTERIOR-REBUILD-V5__library_endwall_north"
candidate=[(i,n) for i,n in enumerate(m["nodes"]) if n.get("name")==LIB]
assert len(candidate)==1,("library rear endwall missing or renamed",len(candidate))
wall_id,wall=candidate[0]
assert "mesh" in wall, "No wall remains, door already opened?"
wall.setdefault("extras",{})["V15_previous_solid_north_endwall_mesh"]=wall.pop("mesh")
wall["extras"]["replaced_by"]="V15_LIBRARY_TRUE_BACK_PORTAL__3M"
wall["extras"]["door_portal_center_x"]=-25.7
wall["extras"]["source_solid_wall_north_z"]=-183.2
assert wall.get("mesh") is None
assert all(json.dumps(n,sort_keys=True,ensure_ascii=False)==before[i] for i,n in enumerate(m["nodes"]) if i!=wall_id)
# Keep original scene indices, no unrelated roots changed
assert m["scenes"][m.get("scene",0)]["nodes"]==old_scene

palette={
 "old_stone":([.48,.53,.56,1],.86,0),
 "limestone":([.64,.66,.64,1],.83,0),
 "paving":([.36,.40,.44,1],.87,0),
 "paving_join":([.25,.29,.34,1],.88,0),
 "grass":([.21,.315,.245,1],.97,0),
 "lawn_winter":([.28,.325,.27,1],.95,0),
 "soil":([.26,.20,.18,1],.96,0),
 "hedge":([.17,.28,.23,1],.94,0),
 "evergreen":([.13,.25,.21,1],.97,0),
 "hardy_leaf":([.27,.36,.29,1],.96,0),
 "winter_flower":([.52,.37,.35,1],.93,0),
 "bark":([.28,.27,.27,1],.91,0),
 "dark_walnut":([.28,.16,.105,1],.78,0),
 "wood_edge":([.38,.245,.16,1],.79,0),
 "wrought_iron":([.125,.17,.20,1],.64,.12),
 "warm_lamp":([1,.72,.39,1],.36,0),
 "snow":([.77,.83,.865,1],.98,0),
 "glass":([.21,.35,.39,.78],.32,.02)}
mat={}
for name,(color,rough,metal) in palette.items():
 idx=len(m["materials"])
 info={"name":"RG-GAME-02-VITTI-GARDEN-V15__MAT_"+name,
   "pbrMetallicRoughness":{"baseColorFactor":color,
      "roughnessFactor":rough,"metallicFactor":metal},"doubleSided":True}
 if color[3]<1:info["alphaMode"]="BLEND"
 if name=="warm_lamp":info["emissiveFactor"]=[.92,.49,.18]
 m["materials"].append(info);mat[name]=idx
# Global positions are world X,Y,Z; shape boxes rotate yaw about Y and pitch in XY.
boxes=defaultdict(list);parts=[];counts=Counter()
TAG="RG-GAME-02-VITTI-GARDEN-V15__"
def put(group,name,material,center,dim,kind,yaw=0,pitch=0):
 assert min(dim)>.01,(name,dim)
 assert all(math.isfinite(x) for x in (*center,*dim,yaw,pitch))
 assert group in ("GARDEN_GROUND","GARDEN_PATH","GARDEN_FURNITURE","GARDEN_PLANTING","GARDEN_BOUNDARY","LIBRARY_BACKDOOR")
 q={"id":TAG+name,"region":group,"material":material,
  "center":[round(float(x),5) for x in center],
  "size":[round(float(x),5) for x in dim],
  "kind":kind,"yaw":yaw,"pitch":pitch}
 boxes[(group,material)].append(q);parts.append(q);counts[kind]+=1
def cub(g,name,ma,x,y,z,dx,dy,dz,kind,yaw=0,pitch=0):
 put(g,name,ma,(x,y,z),(dx,dy,dz),kind,yaw,pitch)
def path(name,x,z,sx,sz,kind):
 cub("GARDEN_PATH",name,"paving",x,.065,z,sx,.12,sz,kind)
 cub("GARDEN_PATH",name+"_EDGE","paving_join",x,.137,z,
     max(sx-.05,.1),.013,max(sz-.05,.1),"paving_joint_subtle")
def rail(side,label,axis,a,b,fixed):
 length=b-a;mid=(a+b)/2
 if axis=="z":
  cub("GARDEN_BOUNDARY",label+"_plinth","old_stone",fixed,.45,mid,.36,.90,length,"edge_low_stone")
  cub("GARDEN_BOUNDARY",label+"_rail","wrought_iron",fixed,1.65,mid,.18,.09,length,"edge_iron_rail")
 else:
  cub("GARDEN_BOUNDARY",label+"_plinth","old_stone",mid,.45,fixed,length,.90,.36,"edge_low_stone")
  cub("GARDEN_BOUNDARY",label+"_rail","wrought_iron",mid,1.65,fixed,length,.09,.18,"edge_iron_rail")
 n=max(1,int(length/2.2))
 for i in range(n+1):
  v=a+length*i/n
  if axis=="z":x,z=fixed,v
  else:x,z=v,fixed
  cub("GARDEN_BOUNDARY",label+"_iron_post_"+str(i),"wrought_iron",x,1.31,z,.075,1.38,.075,"edge_iron_post")
  if i%3==0:
   cub("GARDEN_BOUNDARY",label+"_stone_cap_"+str(i),"limestone",x,1.77,z,.30,.24,.30,"edge_finial")
def bench(id,x,z,axis="z",primary=False):
 # Bench facing grass (north-south orientation: long dimension along Z).
 a=2.3 if primary else 1.85
 w=.61;h=.94
 if axis=="z":sx,sz=w,a
 else:sx,sz=a,w
 cub("GARDEN_FURNITURE",id+"_seat","dark_walnut",x,.51,z,sx,.11,sz,"bench_seat")
 if axis=="z":
  cub("GARDEN_FURNITURE",id+"_back","wood_edge",x+.30,.76,z,.065,.51,sz,"bench_back")
 else:
  cub("GARDEN_FURNITURE",id+"_back","wood_edge",x,.76,z+.30,sx,.51,.07,"bench_back")
 for side in (-1,1):
  if axis=="z":xp,zp=x,z+side*sz*.43
  else:xp,zp=x+side*sx*.43,z
  cub("GARDEN_FURNITURE",id+"_leg_"+str(side),"wrought_iron",xp,.25,zp,.10,.50,.10,"bench_leg")
  cub("GARDEN_FURNITURE",id+"_arm_"+str(side),"wrought_iron",xp,.69,zp,.52,.07,.11,"bench_arm")
def flowerbed(id,x,z,l,w,rare=False):
 cub("GARDEN_PLANTING",id+"_border","old_stone",x,.25,z,l,.42,w,"bed_stone_border")
 cub("GARDEN_PLANTING",id+"_soil","soil",x,.48,z,l-.25,.11,w-.25,"bed_soil")
 for i in range(5):
  for j in range(2):
   qx=x-l*.40+i*l*.20;qz=z-w*.24+j*w*.48
   cub("GARDEN_PLANTING",id+f"_hardy_{i}_{j}","hardy_leaf",
        qx,.67,qz,.43,.38,.38,"winter_perennial")
   if (i+j)%3==0:
    cub("GARDEN_PLANTING",id+f"_flower_{i}_{j}","winter_flower",
        qx,.90,qz,.17,.15,.14,"winter_bloom")
 if rare:
  cub("GARDEN_PLANTING",id+"_snow_cap","snow",x,.55,z+w*.35,l*.30,.06,w*.15,"bed_snow")
def lamp(name,x,z,height=3.5):
 cub("GARDEN_FURNITURE",name+"_base","old_stone",x,.21,z,.48,.42,.48,"lamp_base")
 cub("GARDEN_FURNITURE",name+"_shaft","wrought_iron",x,height*.48,z,.14,height*.85,.14,"lamp_post")
 cub("GARDEN_FURNITURE",name+"_light","warm_lamp",x,height,z,.38,.48,.35,"lamp_glow")
 cub("GARDEN_FURNITURE",name+"_cap","wrought_iron",x,height+.34,z,.51,.22,.48,"lamp_cap")
def tree(name,x,z,scale=1):
 cub("GARDEN_PLANTING",name+"_tree_trunk","bark",x,2.85*scale,z,.42*scale,5.7*scale,.39*scale,"bare_tree_trunk")
 for i,side in enumerate((-1,1)):
  for j in range(3):
   yy=(3.7+j*.78)*scale
   xp=x+side*(.58+j*.22)*scale
   cub("GARDEN_PLANTING",name+f"_branch_{i}_{j}","bark",
       xp,yy,z+(.10 if j%2 else -.12)*scale,
       (1.48+j*.3)*scale,.16*scale,.16*scale,"bare_tree_branch",pitch=side*(.24+j*.05))
 cub("GARDEN_PLANTING",name+"_trunk_snow","snow",x,.17,z,1.12,.13,1.08,"tree_base_snow")
def planter(name,x,z,hero=False):
 sz=1.25 if hero else .92
 cub("GARDEN_PLANTING",name+"_stone_pot","old_stone",x,.43,z,sz,.82,sz,"hero_plant_pot" if hero else "planter")
 cub("GARDEN_PLANTING",name+"_rim","limestone",x,.85,z,sz+.14,.12,sz+.12,"pot_rim")
 cub("GARDEN_PLANTING",name+"_earth","soil",x,.91,z,sz*.81,.07,sz*.81,"pot_earth")
 for i in range(4 if hero else 3):
  dx=(i-1.5)*(.25 if hero else .21)
  cub("GARDEN_PLANTING",name+f"_leaf_{i}","evergreen",x+dx,
      1.34+(i%2)*.17,z+((i%3)-1)*.15,.30,.83,.36,"hero_plant_leaf" if hero else "pot_leaf")
 # The unique solitary plant is an explicit story landmark, not a fountain/statue.
# Ground footprint 36m x 28m, separate from locked 8 school building zones.
cub("GARDEN_GROUND","REAR_SITE_GRAVEL","soil",-26,-.11,-198,36,.18,28,"garden_ground")
cub("GARDEN_GROUND","QUIET_WINTER_LAWN","lawn_winter",-26,.035,-197.5,16,.055,13,"central_lawn")
# Loop circulation: two side paths and north/south segments.
path("LOOP_WEST",-35.9,-197.2,2.2,18.2,"loop_west")
path("LOOP_EAST",-16.1,-197.2,2.2,18.2,"loop_east")
path("LOOP_NORTH",-26,-206.7,21.9,2.2,"loop_north")
path("LOOP_SOUTH",-26,-188.4,21.9,2.2,"loop_south")
# Line of sight from the new F rear door to lawn and bench; clear 2.8m.
path("REAR_DOOR_MAIN_WALK",-25.7,-185.98,2.80,6.10,"entry_walk")
path("TRANSVERSE_TO_HERO_PLANT",-38.15,-206.7,3.1,1.65,"quiet_spur")
# Garden veranda 8.8m along wall, flush with north exit and no new stairs needed.
cub("GARDEN_PATH","LIBRARY_REAR_TERRACE","paving",-25.7,.085,-184.55,8.9,.17,2.75,"entry_terrace")
cub("GARDEN_PATH","LIBRARY_REAR_THRESHOLD","limestone",-25.7,.11,-183.45,3.0,.19,.75,"entry_threshold")
# Existing 47m wide FULL north endwall was disabled above. Rebuild same 11m-high
# outer wall, except actual 3.0m wide, 3.6m-high opening.
L,R=-49.2,-2.2;z=-183.2
cx=-25.7;gap=3.0;lo=cx-gap/2;hi=cx+gap/2
for label,x0,x1 in (("WEST",L,lo),("EAST",hi,R)):
 cub("LIBRARY_BACKDOOR","TRUE_REAR_ENDWALL_"+label,"old_stone",
     (x0+x1)/2,5.5,z,x1-x0,11,.41,"library_wing_wall_replacement")
cub("LIBRARY_BACKDOOR","TRUE_REAR_ENDWALL_ABOVE_DOOR","old_stone",
    cx,(3.60+11)/2,z,gap,11-3.60,.41,"library_north_lintel_wall")
for i,x in enumerate((lo-.17,hi+.17)):
 cub("LIBRARY_BACKDOOR","BACK_DOOR_JAMB_"+str(i),"limestone",x,1.86,z-.16,.32,3.72,.52,"stone_door_jamb")
cub("LIBRARY_BACKDOOR","BACK_DOOR_STONE_TOP","limestone",
    cx,3.68,z-.15,3.6,.22,.58,"stone_door_lintel")
# Timber leaves displayed open against side walls, not covering real aperture.
for label,x in (("W",lo-.54),("E",hi+.54)):
 cub("LIBRARY_BACKDOOR","BACK_OAK_LEAF_OPEN_"+label,"dark_walnut",
     x,1.57,z-.58,.62,3.15,.11,"open_oak_door")
 cub("LIBRARY_BACKDOOR","BACK_DOOR_BRASS_"+label,"wood_edge",
     x,1.58,z-.65,.09,2.6,.04,"oak_rail")
# Conversation main point, an unobstructed 2.8m waiting area in front.
bench("MAIN_TALK_BENCH",-12.4,-196.8,axis="z",primary=True)
bench("QUIET_LEFT_BENCH",-40.4,-197.9,axis="z")
bench("NORTH_CORNER_BENCH",-13.0,-209.3,axis="x")
# Plant as canonical story emotional landmark.
planter("BESSIE_CORNER_PLANT",-40.1,-208.5,hero=True)
# Back garden flowerbeds remain cold-season plants, not spring flowers.
for i,(x,z,l,w) in enumerate((
    (-40.8,-191.9,2.5,4.0),(-12.3,-191.9,2.5,4.0),
    (-40.6,-203.5,2.7,2.9),(-11.7,-204.1,2.6,2.8),
    (-30,-209.6,3.5,1.8),(-20,-209.6,3.5,1.8))):
 flowerbed(f"COLD_SEASON_BED_{i}",x,z,l,w,rare=(i%2==0))
# restrained shrubs at garden corners; no object on center grass loop.
for i,(x,z) in enumerate(((-41.8,-196),(-10.6,-196),(-39.6,-210),(-12.1,-210))):
 cub("GARDEN_PLANTING","LOW_HEDGE_"+str(i),"hedge",x,.64,z,1.35,1.06,1.25,"garden_shrub")
# Back line + two sides; open on library facade side.
rail("N","NORTH_EDGE","x",-44,-8,-212)
rail("W","WEST_EDGE","z",-211.7,-185.4,-44)
rail("E","EAST_EDGE","z",-211.7,-185.4,-8)
for i,(x,z) in enumerate(((-41.9,-209.1),(-10.9,-209.1),(-41.8,-188.4),(-10.8,-188.6))):
 tree(f"BARE_WINTER_TREE_{i}",x,z,scale=.78 if i%2 else 1)
for i,(x,z) in enumerate(((-39,-187.7),(-13,-187.7),(-39,-211),(-13,-211))):
 lamp("WARM_PATH_LAMP_"+str(i),x,z,height=3.2)
# Light snow at exterior edges, no walk obstruction.
for i,(x,z,sx,sz) in enumerate(((-43,-198,.62,10.0),(-9,-198,.62,10.0),
    (-26,-211.55,25,.64),(-24,-209.5,3.2,.4))):
 cub("GARDEN_GROUND",f"EDGE_SNOW_{i}","snow",x,.015,z,sx,.065,sz,"edge_snow")

# Batch cuboid components by material and zone in <=60 draw calls.
faces=[
 ((0,0,1),[(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),
 ((0,0,-1),[(1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1)]),
 ((1,0,0),[(1,-1,1),(1,-1,-1),(1,1,-1),(1,1,1)]),
 ((-1,0,0),[(-1,-1,-1),(-1,-1,1),(-1,1,1),(-1,1,-1)]),
 ((0,1,0),[(-1,1,1),(1,1,1),(1,1,-1),(-1,1,-1)]),
 ((0,-1,0),[(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1)])
]
C=[];N=[];IDX=[]
for norm,points in faces:
 off=len(C)
 for point in points:C.append(tuple(v*.5 for v in point));N.append(norm)
 IDX.extend((off,off+1,off+2,off,off+2,off+3))
def pose(v,p,normal=False):
 x,y,z=v
 if not normal:
  sx,sy,sz=p["size"];x*=sx;y*=sy;z*=sz
 yaw=p["yaw"];cs=math.cos(yaw);ss=math.sin(yaw)
 x,z=x*cs+z*ss,-x*ss+z*cs
 a=p["pitch"];cs=math.cos(a);ss=math.sin(a)
 x,y=x*cs-y*ss,x*ss+y*cs
 if normal:return(x,y,z)
 q=p["center"];return(x+q[0],y+q[1],z+q[2])
newroots=[]
for (region,material),ps in sorted(boxes.items()):
 pos=[];normal=[];index=[];mn=[float("inf")]*3;mx=[float("-inf")]*3
 for p in ps:
  off=len(pos)//3
  for v,n in zip(C,N):
   xyz=pose(v,p)
   pos.extend(xyz);normal.extend(pose(n,p,True))
   for k in range(3):mn[k]=min(mn[k],xyz[k]);mx[k]=max(mx[k],xyz[k])
  index.extend(off+i for i in IDX)
 vc=len(pos)//3
 pv=glb.add_buffer_view(m,buf,struct.pack("<%sf"%len(pos),*pos),34962)
 nv=glb.add_buffer_view(m,buf,struct.pack("<%sf"%len(normal),*normal),34962)
 iv=glb.add_buffer_view(m,buf,struct.pack("<%sI"%len(index),*index),34963)
 a=m.setdefault("accessors",[])
 pi=len(a);a.append({"bufferView":pv,"componentType":5126,"count":vc,"type":"VEC3","min":mn,"max":mx})
 ni=len(a);a.append({"bufferView":nv,"componentType":5126,"count":vc,"type":"VEC3"})
 ii=len(a);a.append({"bufferView":iv,"componentType":5125,"count":len(index),"type":"SCALAR","min":[0],"max":[vc-1]})
 m["meshes"].append({"name":TAG+"BATCH_"+region+"_"+material,
   "primitives":[{"attributes":{"POSITION":pi,"NORMAL":ni},"indices":ii,
    "material":mat[material],"mode":4}]})
 node={"name":TAG+"BATCH_"+region+"_"+material,"mesh":len(m["meshes"])-1,
  "extras":{"revision":"V15_VITTI_REAR_GARDEN","region":region,"material":material,
   "decorated_boxes":len(ps),"novel_basis":"07_發現女主",
   "room_acceptance":"PENDING"}}
 m["nodes"].append(node)
 m["scenes"][m.get("scene",0)]["nodes"].append(len(m["nodes"])-1)
 newroots.append(node["name"])
# Assert source nodes except disabled north wall untouched
assert len(before)==12040
assert all(json.dumps(n,sort_keys=True,ensure_ascii=False)==before[i]
 for i,n in enumerate(m["nodes"][:12040]) if i!=wall_id)
assert m["scenes"][m.get("scene",0)]["nodes"][:len(old_scene)]==old_scene
assert len(newroots)<65 and len(parts)>=145
assert counts["hero_plant_pot"]==1
assert counts["bench_seat"]==3
assert counts["library_north_lintel_wall"]==1
assert counts["library_wing_wall_replacement"]==2
assert counts["open_oak_door"]==2
m["buffers"][0]["byteLength"]=len(buf)
js=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
js+=b" "*((-len(js))%4)
buf+=b"\x00"*((-len(buf))%4)
out=struct.pack("<4sII",glb.MAGIC,2,12+8+len(js)+8+len(buf))+struct.pack("<II",len(js),glb.CHUNK_JSON)+js+struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf)
DIR=Path("candidate-output/academy-rear-garden-v15")
DIR.mkdir(parents=True,exist_ok=True)
FILE="lahudi-academy_VITTI-REAR-GARDEN_V15.glb"
(DIR/FILE).write_bytes(out)
test,bb,_=glb.load_glb(DIR/FILE)
assert len(test["nodes"])==len(m["nodes"]) and len(bb)==len(buf)
report={
 "version":"ACADEMY-V15-VITTI-REAR-GARDEN-REVIEW",
 "source_v14_sha256":SHA,"file":FILE,"bytes":len(out),
 "sha256":hashlib.sha256(out).hexdigest(),
 "prior_node_count":12040,"new_node_count":len(m["nodes"]),
 "new_batch_count":len(newroots),"added_parts":len(parts),
 "only_prior_model_change":"DISABLE_ORIGINAL_F_LIBRARY_NORTH_SOLID_ENDWALL",
 "previous_library_wall_mesh_saved_in_extras":True,
 "actual_library_back_wall_door_cut":True,
 "library_back_door_width_m":3.0,"library_back_door_clear_height_m":3.6,
 "garden_x_m":[-44,-8],"garden_z_m":[-212,-184],
 "garden_width_m":36,"garden_depth_m":28,
 "novel_canon":"薇媞後花園, 冬季少人, 耐寒植物, 貝西角落盆栽",
 "garden_library_north_adjacency":"ANIMATION_BLOCKING_PROPOSAL_NOT_EXPLICIT_IN_NOVEL",
 "V14_gate_and_original_furniture_nodes_preserved":True,
 "scene_model_count":"ONE_SCHOOL_GLB",
 "bench_count":3,"solitary_plant_count":1,
 "tree_count":4,"lamp_count":4,
 "flow_paths":["F north real rear door","terrace","west/east courtyard loop","private flowerpot corner"],
 "visual_validation":"NOT_RUN",
 "garden_route_qa":"NOT_RUN",
 "user_character_collision":"SKIPPED",
 "author_approval":"PENDING",
 "kind_counts":dict(counts)
}
(DIR/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
(DIR/"garden-pieces-v15.json").write_text(json.dumps({"design_version":report["version"],"pieces":parts},ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k!="kind_counts"},ensure_ascii=False))
