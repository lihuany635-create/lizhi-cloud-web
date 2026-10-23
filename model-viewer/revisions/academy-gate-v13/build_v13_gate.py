#!/usr/bin/env python3
"""《現實遊戲》拉乎迪學院 V13｜校園大門、前庭、主樓入口連接 V1

Directly adds true mesh geometry to canonical V12 school GLB (staged candidate).
No exterior wall/clocktower/classroom/scene element from V12 is modified.
Z>=53.05 new perimeter/paving; architecture up to Z=53 stays completely intact.
Cinematic gate proposals are not novel canon until accepted by the author.
"""
from pathlib import Path
from collections import defaultdict, Counter
import json,hashlib,math,sys,struct
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb

ROOT=Path("model-viewer")
SRC=ROOT/"lahudi-academy.glb"
EXPECTED="b975ace3cd12744621688f4f5a0a8aa27f5dff1fbed4beb7ae5b9306dbbd3a66"
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==EXPECTED,"Wrong V12 source version"
m,buf,_=glb.load_glb(SRC)
assert len(m["nodes"])==11983,"Source scene was not V12"
old_nodes=json.dumps(m["nodes"],sort_keys=True,ensure_ascii=False)
old_scene=list(m["scenes"][m.get("scene",0)]["nodes"])
s=json.loads(Path("model-viewer/revisions/academy-gate-v13/gate-masterplan-v13.json").read_text())
assert s["locks"]["gate_main_axis_x_m"]==-70.1
assert s["locks"]["existing_south_entrance_zone"]=={"x":[-98,-22],"z":[30,53]}
assert len(json.loads(Path("model-viewer/revisions/academy-locked-plan-v9/masterplan-v1.json").read_text())["zones"])==8

OUT=Path("candidate-output/academy-gate-v13")
GLB="lahudi-academy_GATE-FORECOURT_V13.glb"
TAG="RG-GAME-02-GATE-COMPLEX-V13__"
palette={
 "stone":([.48,.51,.52,1],.91,.01),
 "stone_light":([.65,.65,.59,1],.85,.02),
 "stone_trim":([.32,.38,.41,1],.78,.02),
 "iron":([.085,.115,.145,1],.43,.68),
 "iron_light":([.18,.22,.25,1],.48,.47),
 "brass":([.67,.48,.21,1],.40,.64),
 "oak":([.22,.13,.085,1],.73,.02),
 "roof":([.085,.13,.18,1],.68,.01),
 "pavement":([.33,.355,.375,1],.90,.01),
 "pavement_alt":([.24,.275,.30,1],.88,.01),
 "snow":([.71,.765,.79,1],.93,.0),
 "plant":([.185,.29,.22,1],.96,.0),
 "lamp":([1.0,.69,.37,1],.18,0),
 "glass":([.19,.31,.38,.72],.22,.06),
 "ink":([.11,.13,.14,1],.64,.05)
}
matids={}
for key,(clr,rough,metal) in palette.items():
 ix=len(m["materials"])
 r={"name":TAG+"MAT_"+key,"pbrMetallicRoughness":{"baseColorFactor":clr,
          "roughnessFactor":rough,"metallicFactor":metal},"doubleSided":True}
 if clr[3]<1:r["alphaMode"]="BLEND"
 if key=="lamp":r["emissiveFactor"]=[.95,.5,.22]
 m["materials"].append(r);matids[key]=ix

faces=(
 ((0,0,1),((-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1))),
 ((0,0,-1),((1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1))),
 ((1,0,0),((1,-1,1),(1,-1,-1),(1,1,-1),(1,1,1))),
 ((-1,0,0),((-1,-1,-1),(-1,-1,1),(-1,1,1),(-1,1,-1))),
 ((0,1,0),((-1,1,1),(1,1,1),(1,1,-1),(-1,1,-1))),
 ((0,-1,0),((-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1)))
)
C=[];N=[];I=[]
for normal,pts in faces:
 o=len(C)
 for p in pts:
  C.append(tuple(.5*v for v in p));N.append(normal)
 I.extend((o,o+1,o+2,o,o+2,o+3))
batches=defaultdict(list);pieces=[];counts=Counter()
def box(group,label,mat,x,y,z,sx,sy,sz,kind,yaw=0,roll=0):
 assert group in ("GATE","BOUNDARY","FORECOURT","GATEHOUSE","SITE")
 assert min(sx,sy,sz)>.009
 assert all(math.isfinite(t) for t in (x,y,z,sx,sy,sz,yaw,roll))
 assert 53.04<=z<=91.0,(label,z)
 p={"name":TAG+label,"group":group,"material":mat,"center":[x,y,z],
  "dimensions":[sx,sy,sz],"kind":kind,"yaw_rad":yaw,"roll_rad":roll}
 batches[(group,mat)].append(p);pieces.append(p);counts[kind]+=1
def beam(group,label,mat,ax,ay,az,bx,by,bz,thick,depth,kind):
 """straight beam in XY plane at fixed Z"""
 assert abs(az-bz)<.00001
 length=math.hypot(bx-ax,by-ay)
 box(group,label,mat,(ax+bx)/2,(ay+by)/2,az,length,thick,depth,kind,
     roll=math.atan2(by-ay,bx-ax))
def stone_post(x,label,height=7.5,width=1.22):
 box("GATE",label+"_core","stone",x,height/2,79,width,height,width,"portal_pier")
 box("GATE",label+"_lower","stone_trim",x,.40,79,width+.35,.80,width+.36,"base_course")
 box("GATE",label+"_cap","stone_light",x,height-.05,79,width+.38,.35,width+.40,"capital")
 box("GATE",label+"_finial","brass",x,height+.46,79,.22,.78,.22,"spire_tip")
 for y in (1.25,4.7,height-.73):
  box("GATE",label+f"_band_{y}","stone_light",x,y,79,width+.12,.18,width+.14,"pier_stringcourse")
# Gate pier centers imply exact 10.5 m physical free passage x[-75.35,-64.85].
stone_post(-76.02,"CENTRAL_WEST")
stone_post(-64.18,"CENTRAL_EAST")
# Honor exact interval from portal faces, cross sectional clear 10.62m.
# Two upper lancet arch halves with an independently recessed central crest.
beam("GATE","LEFT_POINTED_STONE_ARCH","stone_light",-75.42,5.55,79,
     -70.1,9.18,79,.72,.83,"pointed_gate_arch")
beam("GATE","RIGHT_POINTED_STONE_ARCH","stone_light",-70.1,9.18,79,
     -64.78,5.55,79,.72,.83,"pointed_gate_arch")
box("GATE","CENTRAL_KEYSTONE","stone_light",-70.1,9.25,79,.75,.96,.96,"keystone")
box("GATE","ACADEMY_HERALDIC_CREAST","brass",-70.1,8.98,78.43,.47,.76,.18,"emblem_no_readable_text")
# open wrought-iron leaves, hinged slightly inside to guarantee CENTRAL pedestrian corridor.
# right-hand mirror leaf swings into campus toward lower Z.
def gate_leaf(label,hinge,length,angle):
 """Rigid gate turned in Y around one end (sign of local length selects side).
 Angles in Y radians; local +X on west, local -X on east.
 """
 dir=1 if label=="WEST" else -1
 ang=math.radians(angle) * (1 if dir==1 else -1)
 y=0;z=79
 # world center of gate panel after rotating local X half-length
 cx=hinge + dir*math.cos(ang)*length/2
 cz=z-dir*math.sin(ang)*length/2
 # local gate x-axis points outward from hinge and y-rot uses negative z.
 box("GATE",label+"_FRAME_TOP","iron",cx,4.57,cz,length,.12,.10,"open_gate_leaf",yaw=ang)
 box("GATE",label+"_FRAME_BOTTOM","iron",cx,.32,cz,length,.15,.12,"open_gate_leaf",yaw=ang)
 for i in range(15):
  t=(i+.5)/15
  xx=hinge+dir*math.cos(ang)*length*t
  zz=z-dir*math.sin(ang)*length*t
  box("GATE",label+"_BALUSTER_"+str(i),"iron",xx,2.4,zz,.064,4.50,.072,
      "open_gate_bars")
  if i%3==1:
   box("GATE",label+"_GOLD_TIP_"+str(i),"brass",xx,4.74,zz,.115,.27,.12,"wrought_iron_finial")
 # Two diagonal straps follow local leaf axis
 box("GATE",label+"_MID_RAIL","iron_light",cx,2.12,cz,length,.13,.12,
     "open_gate_leaf",yaw=ang)
gate_leaf("WEST",-75.27,4.78,75)
gate_leaf("EAST",-64.93,4.78,75)
# pedestrian open side gates: 2.50m net, independent of grand carriage gate.
def wicket(side,c0,c1):
 label=side+"_WICKET"
 for i,(x,n) in enumerate(((c0-.65,"LEFT"),(c1+.65,"RIGHT"))):
  box("GATE",label+"_PIER_"+n,"stone",x,2.65,79,.78,5.30,.81,"wicket_pier")
  box("GATE",label+"_CAP_"+n,"stone_light",x,5.33,79,.98,.28,1.0,"wicket_cap")
  box("GATE",label+"_LAMP_"+n,"lamp",x,5.81,78.99,.23,.35,.28,"gate_lantern")
 beam("GATE",label+"_ARCH_1","stone_light",c0,4.18,79,(c0+c1)/2,5.16,79,.34,.43,"wicket_ogive")
 beam("GATE",label+"_ARCH_2","stone_light",(c0+c1)/2,5.16,79,c1,4.18,79,.34,.43,"wicket_ogive")
 # iron gate leaf pinned open along boundary's INSIDE edge; not across wicket
 box("GATE",label+"_SWUNG_LEAF","iron",c0+.13,2.03,77.9,.11,3.9,2.07,"wicket_open_leaf")
 for k in range(7):
  box("GATE",label+"_LEAF_SPIKE_"+str(k),"brass",c0+.08,4.17,76.93+.30*k,
      .15,.18,.11,"wicket_finial")
wicket("WEST",-82.3,-79.8)
wicket("EAST",-60.4,-57.9)
# Outer campus boundary stone plinth, iron grille and rhythm piers. Leave
# 3 distinct true holes: 2 wickets + central portal.
segments=[
 (-145.0,-83.71,"WEST_LONG"),
 (-78.37,-76.67,"WEST_SHORT"),
 (-63.56,-61.81,"EAST_SHORT"),
 (-56.48,35.0,"EAST_LONG")
]
for x0,x1,label in segments:
 length=x1-x0;mid=(x0+x1)/2
 box("BOUNDARY",label+"_STONE_BASE","stone",mid,.53,79,length,1.06,.53,"perimeter_plinth")
 box("BOUNDARY",label+"_TOP_RAIL","iron_light",mid,2.55,79,length,.10,.16,"fence_rail")
 box("BOUNDARY",label+"_MID_RAIL","iron",mid,1.36,79,length,.08,.14,"fence_rail")
 count=max(1,math.floor(length/1.12))
 for i in range(count):
  x=x0+(i+.5)*length/count
  box("BOUNDARY",label+"_IRON_BAR_"+str(i),"iron",x,1.87,79,.07,1.52,.10,
      "perimeter_iron_grille")
  if i%2==0:
   box("BOUNDARY",label+"_BRASS_TIP_"+str(i),"brass",x,2.68,79,.09,.22,.09,
      "perimeter_spike")
 for i in range(1,max(1,math.floor(length/11))):
  x=x0+(i*length/max(1,math.floor(length/11)))
  box("BOUNDARY",label+"_STONE_POST_"+str(i),"stone",x,1.52,79,.80,3.04,.68,
      "boundary_column")
  box("BOUNDARY",label+"_POST_TOP_"+str(i),"stone_light",x,3.08,79,.98,.24,.89,
      "boundary_cap")
# Forecourt ground behind gate, level 0.0 and true approach width >=8m.
box("FORECOURT","CENTRAL_AXIAL_WALK","pavement",-70.1,.018,66.2,8.50,.064,26.0,
    "main_axial_paving")
# Crosswalk reaches both D side doors x[-90,-85] & [-34,-29], Z between55 and59.
box("FORECOURT","BUILDING_FRONT_TRANSVERSE_WALK","pavement",-60.5,.020,56.60,
    68.0,.058,3.40,"crosswalk_paving")
# Fine centerline stone tile joints, no blocking objects
for i in range(10):
 z=54.3+i*2.5
 box("FORECOURT","CENTRAL_PAVING_JOINT_"+str(i),"pavement_alt",-70.1,.054,z,
     8.45,.014,.075,"stone_path_joint")
for i in range(25):
 x=-94.1+i*2.7
 if abs(x+70.1)<5:continue
 box("FORECOURT","CROSS_WALK_JOINT_"+str(i),"pavement_alt",x,.049,56.6,
     .07,.015,3.3,"stone_path_joint")
# Gentle angled walk axis toward west/east wickets; no garden inside principal alley.
for x,z,span,label in ((-81,72,6.1,"W_WICKET_ACCESS"),(-59.1,72,6.1,"E_WICKET_ACCESS")):
 box("FORECOURT",label,"pavement",x,.021,z,3.2,.058,span,"pedestrian_gate_paving")
# Boundary snow edging NOT across passage or door wells
for x,side in ((-87,"W"),(-50,"E")):
 box("FORECOURT",side+"_WINTER_PLANTER_L","stone_trim",x,.30,65.9,3.0,.60,3.0,
     "court_planter")
 box("FORECOURT",side+"_SHRUB","plant",x,.84,65.9,2.05,.82,2.08,
     "winter_planting")
 for i in range(3):
  box("FORECOURT",side+"_SNOW_PATCH_"+str(i),"snow",x-.8+i*.8,.55,
      65.9+(.4 if i%2 else -.3),.65,.13,.65,"snow_cap")
# Off-site curb staging front of gate, distinguish this as animation approximation.
box("SITE","DROP_OFF_CURB","stone_trim",-70.1,.11,85.6,23.5,.22,.55,
    "dropoff_curb_not_full_road")
box("SITE","ARRIVAL_PAVEMENT","pavement_alt",-70.1,.01,84,21.0,.042,8.0,
    "arrival_square_not_public_road")

# Small manned gatehouse to western side of pedestrian route; non-canonical proposed.
# New geometry doesn't touch x[-98,-22],z<=53 D entrance shell.
ghx0,ghx1=-103.0,-97.0
ghz0,ghz1=67.5,75.5
box("GATEHOUSE","GUARD_FLOOR","pavement_alt",-100,0.05,71.5,6.0,.15,8.0,"gatehouse_floor")
box("GATEHOUSE","GUARD_WEST_WALL","stone",-103,1.70,71.5,.26,3.4,8.0,"gatehouse_wall")
# True pedestrian door opening in gatehouse east wall between z71 and73
for i,za,zb in ((0,67.5,71),(1,73,75.5)):
 box("GATEHOUSE","GUARD_EAST_WALL_"+str(i),"stone",-97.0,1.70,(za+zb)/2,
      .26,3.40,zb-za,"gatehouse_wall")
box("GATEHOUSE","GUARD_DOOR_LINTEL","stone_light",-97.0,3.16,72,.31,.48,2.0,
    "gatehouse_door_header")
box("GATEHOUSE","GUARD_NORTH_WALL","stone",-100,1.70,67.5,6.0,3.40,.27,"gatehouse_wall")
for i,x0,x1 in ((0,-103,-101.7),(1,-98.3,-97)):
 box("GATEHOUSE","GUARD_FRONT_WALL_"+str(i),"stone",(x0+x1)/2,1.70,75.5,
      x1-x0,3.40,.27,"gatehouse_wall")
box("GATEHOUSE","GUARD_WINDOW_SILL","stone_light",-100,1.05,75.50,3.35,.18,.46,
    "gatehouse_window_sill")
box("GATEHOUSE","GUARD_WINDOW_PANEL","glass",-100,2.05,75.51,3.0,1.35,.08,
    "gatehouse_glazing")
box("GATEHOUSE","GUARD_WINDOW_MULLION","iron",-100,2.05,75.66,.08,1.35,.18,
    "gatehouse_window_frame")
box("GATEHOUSE","GUARD_SOUTH_HEADER","stone_light",-100,3.21,75.5,6.20,.38,.42,
    "gatehouse_front_header")
# Gothic slate two-pitch roof
roofrise=1.30
roofspan=math.hypot(3.4,roofrise)
pitch=math.atan2(roofrise,3.4)
box("GATEHOUSE","GUARD_SLOPE_WEST","roof",-101.57,4.15,71.5,
     roofspan,.20,8.55,"gatehouse_roof_slope",roll=-pitch)
box("GATEHOUSE","GUARD_SLOPE_EAST","roof",-98.43,4.15,71.5,
     roofspan,.20,8.55,"gatehouse_roof_slope",roll=pitch)
box("GATEHOUSE","GUARD_RIDGE","iron",-100,4.82,71.5,.22,.28,8.60,"gatehouse_ridge")
# Interior simple check-in desk, not a blocking route
box("GATEHOUSE","GUARD_DESK","oak",-100.8,.79,70.5,1.40,.13,.74,
    "guard_worktop")
for x in (-101.36,-100.24):
 box("GATEHOUSE","GUARD_DESK_LEG_"+str(x),"oak",x,.35,70.5,.12,.70,.53,
     "guard_worktop_leg")
box("GATEHOUSE","LANTERN_OUTSIDE","lamp",-97.45,3.63,73.65,.24,.44,.30,
    "gatehouse_lantern")

# Metal detail on main gate arch emphasizes identity, no invented readable text.
for k,x in enumerate((-72.7,-67.5)):
 box("GATE",f"ARCH_HANGING_BANNER_{k}","ink",x,6.32,78.48,.44,1.13,.07,
     "gate_hanging_banner")
 box("GATE",f"ARCH_BANNER_GOLD_{k}","brass",x,6.79,78.41,.22,.16,.06,
     "gate_banner_trim")

# Batch as one mesh per zone/material, preserving old GLB nodes exactly.
def transf(v,p,normal=False):
 x,y,z=v
 if not normal:
  sx,sy,sz=p["dimensions"];x*=sx;y*=sy;z*=sz
 # Apply XZ yaw then XY roll (in radians)
 yaw=p["yaw_rad"];roll=p["roll_rad"]
 c=math.cos(yaw);s=math.sin(yaw)
 X=c*x+s*z;Z=-s*x+c*z
 c=math.cos(roll);s=math.sin(roll)
 X,Y=c*X-s*y,s*X+c*y
 if normal:return (X,Y,Z)
 q=p["center"];return (X+q[0],Y+q[1],Z+q[2])
new_nodes=[]
for (area,material),ps in sorted(batches.items()):
 pos=[];nor=[];idx=[];mi=[float("inf")]*3;ma=[float("-inf")]*3
 for p in ps:
  offset=len(pos)//3
  for v,n in zip(C,N):
   xyz=transf(v,p)
   pos.extend(xyz);nor.extend(transf(n,p,True))
   for k in range(3):mi[k]=min(mi[k],xyz[k]);ma[k]=max(ma[k],xyz[k])
  idx.extend(offset+i for i in I)
 vc=len(pos)//3
 assert vc==len(ps)*24
 pv=glb.add_buffer_view(m,buf,struct.pack("<%sf"%len(pos),*pos),34962)
 nv=glb.add_buffer_view(m,buf,struct.pack("<%sf"%len(nor),*nor),34962)
 iv=glb.add_buffer_view(m,buf,struct.pack("<%sI"%len(idx),*idx),34963)
 acc=m.setdefault("accessors",[])
 pi=len(acc);acc.append({"bufferView":pv,"componentType":5126,"count":vc,
    "type":"VEC3","min":mi,"max":ma})
 ni=len(acc);acc.append({"bufferView":nv,"componentType":5126,"count":vc,"type":"VEC3"})
 ii=len(acc);acc.append({"bufferView":iv,"componentType":5125,"count":len(idx),"type":"SCALAR",
    "min":[0],"max":[vc-1]})
 mesh_id=len(m["meshes"])
 m["meshes"].append({"name":TAG+"BATCH_"+area+"_"+material,
  "primitives":[{"attributes":{"POSITION":pi,"NORMAL":ni},"indices":ii,
    "material":matids[material],"mode":4}]})
 node={"name":TAG+"BATCH_"+area+"_"+material,"mesh":mesh_id,"extras":{
  "revision":"V13-SOUTH-CAMPUS-GATE-PROPOSED","zone":area,
  "material":material,"shapes":len(ps),"triangles":len(idx)//3,
  "plot_footprint_changes":False,"author_approval":"PENDING"}}
 m["nodes"].append(node);m["scenes"][m.get("scene",0)]["nodes"].append(len(m["nodes"])-1)
 new_nodes.append(node)

assert json.dumps(m["nodes"][:11983],sort_keys=True,ensure_ascii=False)==old_nodes
assert m["scenes"][m.get("scene",0)]["nodes"][:len(old_scene)]==old_scene
assert len(new_nodes)<65 and len(pieces)>300
assert counts["open_gate_bars"]==30
assert all(p["center"][2]>53 for p in pieces)
assert all(p["kind"]!="wall_across_main_walkway" for p in pieces)

m["buffers"][0]["byteLength"]=len(buf)
data=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
data+=b" "*((-len(data))%4)
buf+=b"\0"*((-len(buf))%4)
out=(struct.pack("<4sII",glb.MAGIC,2,12+8+len(data)+8+len(buf))+
 struct.pack("<II",len(data),glb.CHUNK_JSON)+data+
 struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf))
OUT.mkdir(parents=True,exist_ok=True)
(OUT/GLB).write_bytes(out)
m2,bin2,_=glb.load_glb(OUT/GLB)
assert len(m2["nodes"])==len(m["nodes"]) and len(bin2)==len(buf)
record={
 "version":"ACADEMY-V13-SOUTH-GATE-FORECOURT-REVIEW",
 "source_sha256":EXPECTED,
 "sha256":hashlib.sha256(out).hexdigest(),"file":GLB,
 "bytes":len(out),"prior_nodes_preserved":11983,
 "node_count":len(m2["nodes"]),
 "new_batched_nodes":len(new_nodes),
 "new_mesh_pieces":len(pieces),
 "building_8_district_footprints_unchanged":True,
 "novel_gate_is_real":True,
 "gate_appearance_is_new_art_direction":True,
 "entry_axis_x_m":-70.1,
 "new_geometry_min_z_m":min(round(p["center"][2],3) for p in pieces),
 "front_building_wall_z_m":53,
 "gate_line_z_m":79,
 "forecourt_length_m":26,
 "primary_clearance_between_piers_m":round((-64.18-.61)-(-76.02+.61),3),
 "primary_walking_core_x_m":[-73.5,-66.7],
 "wickets_count":2,
 "gate_state":"BOTH_MAIN_LEAVES_OPEN_AT_75_DEGREES__NOT_ANIMATED",
 "guardhouse":True,
 "preserve_A01_original_and_library":True,
 "protect_V12_furniture_and_2_staircores":True,
 "door_centerline_sweep":"CHECK_IN_INDEPENDENT_QA",
 "render":"PENDING",
 "author_approved":False,
 "counts":dict(counts),
 "noncanonical_additions":["perimeter position","guardhouse","gate sculpture and emblems","iron gate detail","arrival curb"]
}
(OUT/"report.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
(OUT/"gate-pieces.json").write_text(json.dumps({"scene":record["version"],"items":pieces},ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in record.items() if k not in ("counts","noncanonical_additions")},ensure_ascii=False))
