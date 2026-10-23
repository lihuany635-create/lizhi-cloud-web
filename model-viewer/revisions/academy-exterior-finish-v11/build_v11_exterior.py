#!/usr/bin/env python3
"""拉乎迪學院 V11: exterior Gothic architectural finish over approved V10 layout.

Only EXTERIOR surfaces: fenestration and lancet stone frames, stone cornices,
buttress caps, roof dormers, gable bands, timber portal doors and warm lanterns,
entry/courtyard exterior paving. No interior furniture, no character collisions.
Preserve all prior GLB scene nodes and all 8 locked district locations.

All >3000 decorative cubes are batched by district + material to keep mobile
draw calls low, instead of ~3000 extra GLB nodes. Existing true openings remain.
"""
from pathlib import Path
from collections import defaultdict,Counter
import math,json,struct,hashlib,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
SOURCE=Path("model-viewer/staged-output/academy-route-repair-v10/lahudi-academy_LOCKED-PLAN-ACCESS-V10.glb")
SOURCE_SHA="f2b4c82a7ea3b6625a7ffef3157c56b8e7f288bf9cd2d3bbf699c7ca67ef1b5c"
OUT=Path("candidate-output/academy-exterior-finish-v11")
NAME="lahudi-academy_EXTERIOR-GOTHIC-FINISH_V11.glb"
P="RG-GAME-02-EXTERIOR-FINISH-V11__"
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SOURCE_SHA
m,binary,_=glb.load_glb(SOURCE)
assert len(m["nodes"])==11827
core_nodes=json.dumps(m["nodes"],sort_keys=True,ensure_ascii=False)
core_scene=list(m["scenes"][m.get("scene",0)]["nodes"])
pl=json.loads(Path("model-viewer/revisions/academy-locked-plan-v9/masterplan-v1.json").read_text())
zones={z["id"]:z for z in pl["zones"]}
assert len(zones)==8
v9_report=json.loads(Path("model-viewer/staged-output/academy-locked-plan-v9/report.json").read_text())
shells=v9_report["rebuilt_structural_submasses"]
assert len(shells)==9

palette={
 "limestone":([.59,.59,.55,1],.82,.01),
 "carved_stone":([.42,.46,.49,1],.72,.01),
 "recess":([.115,.17,.225,1],.92,0),
 "blue_glass":([.14,.35,.51,.82],.2,.02),
 "gold_glass":([.54,.32,.15,.85],.22,.03),
 "dark_oak":([.23,.113,.072,1],.68,.01),
 "bronze":([.68,.45,.19,1],.39,.64),
 "iron":([.115,.15,.19,1],.41,.66),
 "slate":([.08,.13,.19,1],.7,.03),
 "roof_copper":([.25,.34,.29,1],.65,.12),
 "warm_lamp":([1.0,.64,.27,1],.21,.01),
 "paving":([.29,.33,.36,1],.9,.01),
 "paving_dark":([.165,.20,.23,1],.88,.01),
 "planter":([.28,.32,.30,1],.94,0),
 "ivy":([.135,.22,.18,1],.97,0)
}
material={}
for key,(col,rough,metal) in palette.items():
 index=len(m["materials"])
 item={"name":"ACADEMY_GOTHIC_V11__"+key,"pbrMetallicRoughness":{
   "baseColorFactor":list(col),"roughnessFactor":rough,"metallicFactor":metal},
   "doubleSided":True}
 if col[3]<1:item["alphaMode"]="BLEND"
 if key=="warm_lamp":item["emissiveFactor"]=[.93,.46,.12]
 m["materials"].append(item)
 material[key]=index

# cube face winding consistent with primitive:
faces=(
 ((0,0,1),((-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1))),
 ((0,0,-1),((1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1))),
 ((1,0,0),((1,-1,1),(1,-1,-1),(1,1,-1),(1,1,1))),
 ((-1,0,0),((-1,-1,-1),(-1,-1,1),(-1,1,1),(-1,1,-1))),
 ((0,1,0),((-1,1,1),(1,1,1),(1,1,-1),(-1,1,-1))),
 ((0,-1,0),((-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1)))
)
CUBE=[];NORM=[];IDX=[]
for normal,points in faces:
 offset=len(CUBE)
 for xyz in points:CUBE.append(tuple(q*.5 for q in xyz));NORM.append(normal)
 IDX.extend((offset,offset+1,offset+2,offset,offset+2,offset+3))
groups=defaultdict(list);count=Counter();zone_count=Counter();qa_points={}
def block(zone,name,material_name,xyz,dim,kind,angle=0,axis="z"):
 assert min(dim)>.025,("dim",name,dim)
 assert all(math.isfinite(v) for v in (*xyz,*dim,angle))
 assert abs(xyz[0])<220 and abs(xyz[2])<260 and xyz[1]<45
 groups[(zone,material_name)].append((name,tuple(xyz),tuple(dim),angle,axis,kind))
 count[kind]+=1;zone_count[zone]+=1
def line(zone,name,mat,a,b,thick,depth,kind,axis="z"):
 # z axis -> rotate beams along XY at fixed Z; x -> rotate along ZY fixed X
 if axis=="z":
  dx=b[0]-a[0];dy=b[1]-a[1]
  length=math.hypot(dx,dy)
  block(zone,name,mat,((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),
        (length,thick,depth),kind,math.atan2(dy,dx),"z")
 else:
  dz=b[2]-a[2];dy=b[1]-a[1]
  length=math.hypot(dz,dy)
  block(zone,name,mat,((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),
        (depth,thick,length),kind,-math.atan2(dy,dz),"x")
def pointed_arch(zone,name,orientation,fixed,center,width,y0,height=.57,stone="limestone"):
 # double-sided pointed arch: each half rises sharply toward center.
 steps=4
 for i in range(steps):
  t0=i/steps;t1=(i+1)/steps
  p0=center-width/2+width*t0;p1=center-width/2+width*t1
  y_a=y0+height*(1-abs(2*t0-1));y_b=y0+height*(1-abs(2*t1-1))
  if orientation=="x":
   a=(fixed,y_a,p0);b=(fixed,y_b,p1)
   line(zone,name+f"_{i}",stone,a,b,.115,.17,"pointed_window_arch","x")
  else:
   a=(p0,y_a,fixed);b=(p1,y_b,fixed)
   line(zone,name+f"_{i}",stone,a,b,.115,.17,"pointed_window_arch","z")
def win(zone,side,anchor,p,width,bayid,style):
 # side "west"/"east": wall at X anchor and windows progress in Z p.
 # side "north"/"south": wall at Z anchor and windows progress in X p.
 fixed_axis="x" if side in ("west","east") else "z"
 sg= -1 if side in ("west","north") else 1
 f=anchor+sg*.24
 ylow=6.07;yhigh=7.63
 window=min(2.1,width*.58)
 # exterior glazing lies in open band Y6.0..7.65, not on a full lower wall.
 # Do not add 1F fake glass on an uncut masonry wall.
 if fixed_axis=="x":
  block(zone,bayid+"_blue", "blue_glass",(f-sg*.085,6.82,p),(.07,1.31,window),
        "upper_clear_glazing")
  for end,z in (("A",p-window/2),("B",p+window/2)):
   block(zone,bayid+"_stone_jamb_"+end,"limestone",(f,6.82,z),(.25,1.65,.16),"window_stone_jamb")
  block(zone,bayid+"_transom","carved_stone",(f,6.92,p),(.19,.09,window),"window_tracery")
  block(zone,bayid+"_central","limestone",(f,6.82,p),(.17,1.50,.12),"window_mullion")
  block(zone,bayid+"_sill","carved_stone",(f,5.96,p),(.41,.17,window+.37),"window_sill")
  pointed_arch(zone,bayid+"_head","x",f,p,window,7.62,.72)
 else:
  block(zone,bayid+"_blue","blue_glass",(p,6.82,f-sg*.085),(window,1.31,.07),
        "upper_clear_glazing")
  for end,x in (("A",p-window/2),("B",p+window/2)):
   block(zone,bayid+"_stone_jamb_"+end,"limestone",(x,6.82,f),(.16,1.65,.25),"window_stone_jamb")
  block(zone,bayid+"_transom","carved_stone",(p,6.92,f),(window,.09,.19),"window_tracery")
  block(zone,bayid+"_central","limestone",(p,6.82,f),(.12,1.50,.17),"window_mullion")
  block(zone,bayid+"_sill","carved_stone",(p,5.96,f),(window+.37,.17,.41),"window_sill")
  pointed_arch(zone,bayid+"_head","z",f,p,window,7.62,.72)
 # blind lower-story recess only, NOT advertised as actual open window
 if style=="blind" and bayid.endswith(("02","05")):
  if fixed_axis=="x":
   block(zone,bayid+"_blind","recess",(f+sg*.08,2.20,p),(.055,1.52,window*.85),"blind_window_inset")
  else:
   block(zone,bayid+"_blind","recess",(p,2.20,f+sg*.08),(window*.85,1.52,.055),"blind_window_inset")
def face(zone,label,side,anchor,start,end,eave,style):
 span=end-start
 n=max(2,round(span/4.65))
 pitch=span/n
 for i in range(n):
  p=start+(i+.5)*pitch
  name=f"{label}_{side}_{i:02d}"
  win(zone,side,anchor,p,pitch,name,style)
  # Avoid overcrowded double buttresses: every ~third bay
  if i%3==0:
   if side in ("west","east"):
    sg=-1 if side=="west" else 1
    block(zone,name+"_buttress_cap","limestone",(anchor+sg*.48,eave-.2,p-pitch/2),
        (.95,.36,.75),"buttress_cap")
   else:
    sg=-1 if side=="north" else 1
    block(zone,name+"_buttress_cap","limestone",(p-pitch/2,eave-.2,anchor+sg*.48),
        (.75,.36,.95),"buttress_cap")
  # 1F warm lamp at every 4th bay ONLY if no near door
  if i%4==2 and abs(p-start)>5 and abs(end-p)>5:
   if side in ("west","east"):
    sg=-1 if side=="west" else 1
    block(zone,name+"_sconce","bronze",(anchor+sg*.39,4.33,p),(.29,.36,.26),"wall_sconce")
    block(zone,name+"_light","warm_lamp",(anchor+sg*.49,4.57,p),(.20,.27,.20),"warm_lantern")
   else:
    sg=-1 if side=="north" else 1
    block(zone,name+"_sconce","bronze",(p,4.33,anchor+sg*.39),(.26,.36,.29),"wall_sconce")
    block(zone,name+"_light","warm_lamp",(p,4.57,anchor+sg*.49),(.20,.27,.20),"warm_lantern")
 # continuous cornice/rain gutter, intentionally only external face
 if side in ("west","east"):
  sg=-1 if side=="west" else 1
  block(zone,f"{label}_{side}_cornice","limestone",(anchor+sg*.32,eave-.28,(start+end)/2),
        (.61,.23,span),"eave_stone_cornice")
  block(zone,f"{label}_{side}_gutter","roof_copper",(anchor+sg*.40,eave+.04,(start+end)/2),
        (.25,.17,span),"copper_gutter")
 else:
  sg=-1 if side=="north" else 1
  block(zone,f"{label}_{side}_cornice","limestone",((start+end)/2,eave-.28,anchor+sg*.32),
        (span,.23,.61),"gable_eave_band")
def dormer(zone,name,x,z,eave,ridge,west,width):
 span=width*.29
 t=.56
 y=eave+(ridge-eave)*t
 block(zone,name+"_base","carved_stone",(x,y+.38,z),(2.14,1.28,1.85),"roof_dormer_mass")
 block(zone,name+"_window","recess",(x,y+.43,z+(0.94 if west else -0.94)),
       (1.20,.83,.07),"dormer_window")
 block(zone,name+"_ridge","roof_copper",(x,y+1.29,z),(2.50,.26,2.10),"dormer_copper_roof")
def gable_crest(zone,name,xcenter,z,roofheight,width):
 block(zone,name+"_base","carved_stone",(xcenter,roofheight+.34,z),
      (1.95,.66,.60),"gable_crest")
 block(zone,name+"_gold_tip","bronze",(xcenter,roofheight+1.03,z),
      (.21,.87,.21),"gable_finial")
 # Decorative bargeboard stones follow roof line, existing structural gable still untouched.
 for dx in (-2.4,2.4):
  block(zone,name+f"_small_finial_{dx}","limestone",(xcenter+dx,roofheight-.65,z),
      (.23,.62,.23),"gable_boss")
def roofline(zone,label,x0,x1,z0,z1,eave,ridge,style):
 xcenter=(x0+x1)/2
 for z,edge in ((z0-.25,"N"),(z1+.25,"S")):
  gable_crest(zone,label+"_"+edge,xcenter,z,ridge,x1-x0)
 # Sparse dormers for visual rhythm; avoid thousands of repetitive objects
 n=max(1,round((z1-z0)/17))
 for i in range(n):
  z=z0+(i+.5)*(z1-z0)/n
  for side,sg in (("W",-1),("E",1)):
   x=xcenter+sg*(x1-x0)*.29
   dormer(zone,label+"_dormer_"+side+str(i),x,z,eave,ridge,sg<0,x1-x0)
 # dark roof ridge crest clips, repeat every 7m
 k=max(1,round((z1-z0)/7))
 for i in range(k+1):
  z=z0+(z1-z0)*i/k
  block(zone,label+"_ridge_iron_"+str(i),"iron",(xcenter,ridge+.20,z),
       (.14,.28,.20),"roof_ridge_crest")
def porch(zone,name,cx,z,doorwidth=3.4):
 # No solid block in front of door; the door leaf is abstracted as closed wood leaves
 # and marked nonstructural, not validated as through-portal.
 block(zone,name+"_wood_leaf_left","dark_oak",(cx-doorwidth/4,2.02,z),
       (doorwidth/2-.09,3.12,.12),"exterior_timber_door")
 block(zone,name+"_wood_leaf_right","dark_oak",(cx+doorwidth/4,2.02,z),
       (doorwidth/2-.09,3.12,.12),"exterior_timber_door")
 for i,x in enumerate((cx-doorwidth/2-.22,cx+doorwidth/2+.22)):
  block(zone,name+"_pier_"+str(i),"limestone",(x,2.45,z),
       (.36,4.9,.39),"entry_stone_portal")
 block(zone,name+"_portal_lintel","limestone",(cx,4.93,z),
       (doorwidth+.6,.32,.58),"entry_stone_lintel")
 pointed_arch(zone,name+"_portal_arch","z",z,cx,doorwidth+.34,5.1,.81,"carved_stone")
 for x,tag in ((cx-doorwidth/2-.48,"L"),(cx+doorwidth/2+.48,"R")):
  block(zone,name+"_bronze_light_"+tag,"warm_lamp",(x,3.58,z+.33),
       (.23,.49,.23),"entry_lantern")

# Architecture: locked nine exterior shell segments.
for sh in shells:
 name=sh["id"];x0,x1=sh["bbox"]["x"];z0,z1=sh["bbox"]["z"]
 eave=sh["eave"];ridge=sh["ridge"]
 assert x1>x0 and z1>z0
 for side,anchor,start,end in (
  ("west",x0,z0,z1),("east",x1,z0,z1),
  ("north",z0,x0,x1),("south",z1,x0,x1)):
  face(name,name,side,anchor,start,end,eave,"blind")
 roofline(name,name,x0,x1,z0,z1,eave,ridge,"standard")
# Pre-existing main building A & library F are already functional; enrich outside only:
A=zones["A_MAIN"]; F=zones["F_LIBRARY"]
for zone,description,height,rh in ((A,"A_MAIN",11.0,15.3),(F,"F_LIBRARY",12.5,17.8)):
 x0,x1=zone["x"];z0,z1=zone["z"]
 # stone stringcourses on perimeter without glazing over original real window holes.
 for x,side in ((x0,"W"),(x1,"E")):
  sg=-1 if side=="W" else 1
  for y in (3.92,8.18,height-.39):
   block(description,description+f"_string_{side}_{y}","carved_stone",
    (x+sg*.40,y,(z0+z1)/2),(.24,.18,z1-z0),"historic_masonry_stringcourse")
 for z,side in ((z0,"N"),(z1,"S")):
  sg=-1 if side=="N" else 1
  for y in (3.92,height-.39):
   block(description,description+f"_band_{side}_{y}","carved_stone",
    ((x0+x1)/2,y,z+sg*.38),(x1-x0,.18,.24),"historic_masonry_stringcourse")
 roofline(description,description,x0,x1,z0,z1,height,rh,"historic")
# Historical clock tower at x about -70.1, y nominal max ~24 from earlier V5 design.
for y in (8.0,14.2,18.8):
 for z,suffix in ((26.7,"front"),(35.0,"back")):
  block("D_ENTRANCE",f"clock_tower_band_{suffix}_{y}","limestone",(-70.1,y,z),
        (9.3,.26,.40),"clock_tower_cornice")
for x,side in ((-74.2,"W"),(-66.0,"E")):
 for y in (8.0,14.2,18.8):
  block("D_ENTRANCE",f"clock_tower_cap_{side}_{y}","limestone",(x,y,30.9),
        (.46,.26,8.5),"clock_tower_cornice")
# Clock face as dark circular suggestion: square backing, four directional markers.
# Do not pretend to have generated a round curved dial using cubes.
block("D_ENTRANCE","CLOCK_FACE_BACK","recess",(-70.1,16.6,25.83),
    (3.5,3.5,.18),"clock_face_panel")
for i,(x,y) in enumerate(((-70.1,17.95),(-70.1,15.25),(-71.45,16.6),(-68.75,16.6))):
 block("D_ENTRANCE","CLOCK_MARK_"+str(i),"bronze",(x,y,25.69),
       (.18,.35,.13),"clock_hour_mark")
# Exterior portal reliefs at the two D-wing public gates: no opaque wooden leaf
# is placed in any real route opening. Work above or outside walkable clear span.
for cx,gate,zone in ((-87.5,"WEST_GATE","D_WEST_ENTRY"),(-31.5,"EAST_GATE","D_EAST_ENTRY")):
 z=53.28
 pointed_arch(zone,gate+"_carved_crown","z",z,cx,4.30,4.10,.80)
 block(zone,gate+"_keystone","bronze",(cx,5.06,z),(.25,.43,.24),"entrance_keystone")
 for i,x in enumerate((cx-2.8,cx+2.8)):
  block(zone,gate+"_lamp_"+str(i),"warm_lamp",(x,3.55,z),(.22,.44,.23),
        "entry_lantern")
  block(zone,gate+"_lamp_mount_"+str(i),"bronze",(x,3.27,z+.08),(.29,.14,.30),
        "entry_lamp_mount")

# Main entry axial stair kept intact: decorate sides, NOT stair treads.
for x,label in ((-74.90,"west"),(-65.20,"east")):
 block("D_ENTRANCE","STAIR_ENTRY_BUTTRESS_"+label,"carved_stone",(x,1.05,45.5),
       (.72,2.1,2.5),"entry_stair_parapet")
# Place only garden paving along perimeter (no terrain color takeover).
for area,x0,x1,z0,z1 in (
 ("WEST_COURTYARD",-113,-90,-63,20),
 ("EAST_COURTYARD",-65,-37,-63,20)):
 block(area,"PAVED_MAIN_AXIS","paving",((x0+x1)/2,.018,(z0+z1)/2),
       (2.85,.06,z1-z0),"courtyard_axis")
 for z in range(-59,20,11):
  block(area,"PAVED_CROSS_"+str(z),"paving_dark",((x0+x1)/2,.022,z),
       (x1-x0,.055,1.2),"courtyard_cross_paving")
# Winter planting in walled corner of courtyards, no furniture or obstructed doors.
for area,x,z in (("WEST_COURTYARD",-108,-47),("WEST_COURTYARD",-96,-50),
                 ("EAST_COURTYARD",-61,-47),("EAST_COURTYARD",-40,-50)):
 block(area,f"GARDEN_PLANTER_{x}_{z}","planter",(x,.38,z),(2.4,.7,2.4),"exterior_planter")
 block(area,f"SHRUB_{x}_{z}","ivy",(x,1.15,z),(1.35,1.5,1.3),"winter_evergreen")

# Bake standard independent cube primitives per district and material.
def rotate(v,angle,axis):
 c=math.cos(angle);s=math.sin(angle)
 if axis=="z":return (c*v[0]-s*v[1],s*v[0]+c*v[1],v[2])
 if axis=="x":return (v[0],c*v[1]-s*v[2],s*v[1]+c*v[2])
 raise ValueError(axis)
total_shapes=sum(map(len,groups.values()))
new_nodes=[]
for (zone,mat),shapes in sorted(groups.items()):
 positions=[];normals=[];indices=[]
 mn=[float("inf")]*3;mx=[-float("inf")]*3
 for label,t,scale,angle,axis,kind in shapes:
  offset=len(positions)//3
  for pt,normal in zip(CUBE,NORM):
   rp=rotate([pt[k]*scale[k] for k in range(3)],angle,axis)
   pos=[t[k]+rp[k] for k in range(3)]
   for k in range(3):mn[k]=min(mn[k],pos[k]);mx[k]=max(mx[k],pos[k])
   positions.extend(pos)
   normals.extend(rotate(normal,angle,axis))
  indices.extend(offset+i for i in IDX)
 vcount=len(positions)//3
 assert vcount==24*len(shapes)
 pv=glb.add_buffer_view(m,binary,struct.pack("<%sf"%len(positions),*positions),34962)
 nv=glb.add_buffer_view(m,binary,struct.pack("<%sf"%len(normals),*normals),34962)
 iv=glb.add_buffer_view(m,binary,struct.pack("<%sI"%len(indices),*indices),34963)
 a=m.setdefault("accessors",[])
 pi=len(a);a.append({"bufferView":pv,"componentType":5126,"type":"VEC3","count":vcount,
   "min":[round(v,4) for v in mn],"max":[round(v,4) for v in mx]})
 ni=len(a);a.append({"bufferView":nv,"componentType":5126,"type":"VEC3","count":vcount})
 ii=len(a);a.append({"bufferView":iv,"componentType":5125,"type":"SCALAR","count":len(indices),
   "min":[0],"max":[vcount-1]})
 m["meshes"].append({"name":P+zone+"_"+mat,"primitives":[{
   "attributes":{"POSITION":pi,"NORMAL":ni},"indices":ii,"material":material[mat],"mode":4}]})
 n={"name":P+zone+"_"+mat,"mesh":len(m["meshes"])-1,"extras":{
    "revision":"V11_GOTHIC_EXTERIOR_FINISH","zone":zone,"material":mat,
    "shapes_baked":len(shapes),"triangles":12*len(shapes),
    "not_interior":True,"not_structural_claim":True,"author_approval":"PENDING"}}
 m["nodes"].append(n)
 m["scenes"][m.get("scene",0)]["nodes"].append(len(m["nodes"])-1)
 new_nodes.append(n)
assert json.dumps(m["nodes"][:11827],sort_keys=True,ensure_ascii=False)==core_nodes
assert m["scenes"][m.get("scene",0)]["nodes"][:len(core_scene)]==core_scene
assert len(new_nodes)<165 and len(new_nodes)>35
assert count["upper_clear_glazing"]>150
assert count["pointed_window_arch"]>500
assert count["eave_stone_cornice"]>=18
assert count["pitched_roof"]==0 # preserved original V9 roof meshes
assert sum(zone_count.values())==total_shapes

m["buffers"][0]["byteLength"]=len(binary)
js=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
js+=b" "*((-len(js))%4)
binary+=b"\x00"*((-len(binary))%4)
payload=(struct.pack("<4sII",glb.MAGIC,2,12+8+len(js)+8+len(binary))+
   struct.pack("<II",len(js),glb.CHUNK_JSON)+js+
   struct.pack("<II",len(binary),glb.CHUNK_BIN)+bytes(binary))
OUT.mkdir(parents=True,exist_ok=True)
(OUT/NAME).write_bytes(payload)
test,buf,_=glb.load_glb(OUT/NAME)
assert len(test["nodes"])==len(m["nodes"]) and len(buf)==len(binary)
report={"version":"ACADEMY-LOCKED-PLAN-EXTERIOR-GOTHIC-FINISH-V11",
 "source_model_sha256":SOURCE_SHA,"file":NAME,"sha256":hashlib.sha256(payload).hexdigest(),
 "bytes":len(payload),"source_nodes":11827,"result_nodes":len(test["nodes"]),
 "baked_decorative_shapes":total_shapes,"batched_decorative_nodes":len(new_nodes),
 "exterior_decorations":dict(count),"region_counts":dict(zone_count),
 "color_palette":{k:v[0] for k,v in palette.items()},
 "all_previous_V10_nodes_and_access_routes_unchanged":True,
 "eight_district_locked_positions_preserved":True,
 "A01_original_interior_and_stairs_preserved":True,
 "special_features":["Gothic pointed upper lancet stone frames","deep-blue glazing in actual upper open-wall bands",
                     "copper gutters and limestone cornices","dark-slate roof dormers",
                     "gable crests and bronze finials","clock-tower stone stringcourses and clock dial",
                     "ornamental main-gate arch crowns and warm brass lanterns without blocking portals",
                     "courtyard paving and small winter shrubs"],
 "lower_opaque_wall_windows_are_blind_architectural_insets":"YES, do NOT call them openings",
 "visual_render":"NOT_RUN",
 "character_collision":"SKIPPED_AS_USER_REQUESTED",
 "main_version_write":"NOT_PROMOTED_AT_BUILD_STAGE",
 "approval":"PENDING"}
(OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k not in ("exterior_decorations","region_counts","color_palette")},ensure_ascii=False))
