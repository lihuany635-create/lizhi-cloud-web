#!/usr/bin/env python3
"""《現實遊戲》拉乎迪學院 V12｜modular interior furnished scene (stage only).

Source: V11 official academy. Keep all 11,923 source nodes exactly unchanged.
Design scheme: 62 furniture types from the previously authored furniture asset list,
approximated here as reusable low-poly wood/metal parametric INSTANCES rather than
claiming the exact standalone source ZIP was embedded (ZIP is retained separately).
Furnish six newly shelled districts B,C,D,E,G,H, in 1F or selected 2F interiors,
leave A_MAIN story corridor/classrooms and F_LIBRARY originally furnished scene
STRICTLY untouched. Add only modeled floor/partitions where interior is proposed.
Keep all structure/floorplan envelopes unchanged. A01 3F vault avoided.
"""
from pathlib import Path
import json,hashlib,struct,math,sys,collections,random
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as io
SRC=Path("model-viewer/staged-output/academy-exterior-finish-v11/lahudi-academy_EXTERIOR-GOTHIC-FINISH_V11.glb")
EXPECTED="caab8cba4cbb9af22252ea2b05a35588b9529fb4af5720b787cf96b33229a9ae"
DST=Path("candidate-output/academy-interior-furniture-v12")
FILE="lahudi-academy_INTERIOR-FURNITURE-V12.glb"
TAG="RG-GAME-02-INTERIOR-FURNITURE-V12__"
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==EXPECTED
m,buf,_=io.load_glb(SRC)
assert len(m["nodes"])==11923
original_names={n.get("name") for n in m["nodes"]}
for k in ("RG-GAME-02-A1-005__open_door","RG-GAME-02-CROOM-005__open_door","RG-GAME-02-LIB-002__book"):
 assert k in original_names
frozen_nodes=json.dumps(m["nodes"],sort_keys=True,ensure_ascii=False)
frozen_roots=list(m["scenes"][m.get("scene",0)]["nodes"])
plan=json.loads(Path("model-viewer/revisions/academy-locked-plan-v9/masterplan-v1.json").read_text())
assert len(plan["zones"])==8
asset_values={}
# Unified L (X), W (Z), H (Y), all metres, source: furniture configuration v1.
raw="""ST01 .68 .50 .75;ST02 .47 .46 .82;ST03 1.35 .55 .75;TC01 1.40 .70 .75;TC02 1.65 .90 .18;TC03 3.50 .10 1.30;TC04 1.20 .45 1.90;TC05 .95 .45 1.85;TC06 1.60 .09 1.00;TC07 .36 .11 .36;CO01 1.65 .56 .95;CO02 1.30 .48 2.00;CO03 .35 .28 .55;CO04 .56 .35 1.55;CO05 .48 .40 .75;CO06 .35 .35 .65;OF01 1.55 .75 .76;OF02 .64 .60 1.18;OF03 .50 .50 .88;OF04 .90 .45 1.82;OF05 3.40 1.12 .77;OF06 1.70 .83 .90;OF07 1.10 .58 .45;OF08 1.25 .56 .87;LB01 1.10 .62 2.15;LB02 1.10 .36 2.20;LB03 2.30 .95 .77;LB04 .50 .54 .86;LB05 3.40 .90 1.05;LB06 .38 .32 .51;LB07 .72 .46 .96;LB08 .95 .65 .76;LB09 1.20 .47 1.18;LB10 1.10 .48 2.00;AS01 2.30 .62 .96;AS02 1.50 .95 1.22;AS03 8.00 4.00 .45;AS04 1.52 1.60 1.01;AS05 .47 .50 .83;AR01 1.15 .52 2.15;AR02 1.03 .48 1.30;AR03 2.40 1.16 .86;AR04 1.30 .90 .92;SP01 1.70 .95 .77;SP02 .75 .72 1.70;SP03 .58 .37 .52;SP04 .50 .46 1.22;SP05 1.20 .56 2.00;SP06 1.20 .45 1.83;SV01 3.20 .80 1.12;SV02 1.25 .65 .76;SV03 .80 .80 1.20;WC01 .58 .48 .85;WC02 .90 1.38 1.90;WC03 .60 .08 1.00;CL01 .88 .48 1.95;CL02 .82 .49 .96;DG01 2.35 .58 2.30;DG02 3.20 2.00 .02;DG03 1.20 .10 1.55;DG04 1.45 .08 1.08;DG05 .48 .48 .88"""
for r in raw.split(";"):
 parts=r.split()
 assert len(parts)==4
 asset_values[parts[0]]=tuple(map(float,parts[1:]))
assert len(asset_values)==62
pal={
"wood":([.25,.135,.080,1],.76,.01),
"wood_hilite":([.39,.235,.145,1],.65,.01),
"dark":([.13,.085,.07,1],.78,.02),
"brass":([.69,.50,.19,1],.45,.55),
"green_leather":([.115,.215,.155,1],.72,.01),
"slate":([.21,.23,.245,1],.85,.01),
"chalk":([.055,.13,.125,1],.92,0),
"paper":([.70,.65,.49,1],.92,0),
"stone":([.45,.46,.44,1],.84,0),
"interior_floor":([.305,.21,.145,1],.79,.01),
"interior_plaster":([.57,.53,.45,1],.91,0),
"warmlight":([.95,.66,.28,1],.44,.02),
"glass":([.26,.41,.48,.70],.35,.06)}
materials={}
for name,(clr,rough,metal) in pal.items():
 idx=len(m["materials"])
 it={"name":"V12_ACADEMY_INTERIOR__"+name,"pbrMetallicRoughness":{
  "baseColorFactor":clr,"roughnessFactor":rough,"metallicFactor":metal},
  "doubleSided":True}
 if clr[3]<1:it["alphaMode"]="BLEND"
 if name=="warmlight":it["emissiveFactor"]=[.85,.44,.14]
 m["materials"].append(it); materials[name]=idx
# Build low-poly boxes, batched into meshes by zone+material to keep mobile efficient.
faces=(
 ((0,0,1),((-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1))),
 ((0,0,-1),((1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1))),
 ((1,0,0),((1,-1,1),(1,-1,-1),(1,1,-1),(1,1,1))),
 ((-1,0,0),((-1,-1,-1),(-1,-1,1),(-1,1,1),(-1,1,-1))),
 ((0,1,0),((-1,1,1),(1,1,1),(1,1,-1),(-1,1,-1))),
 ((0,-1,0),((-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1)))
)
CUBE=[];NORMAL=[];TRI=[]
for normal,corners in faces:
 k=len(CUBE)
 for corner in corners:
  CUBE.append(tuple(v*.5 for v in corner));NORMAL.append(normal)
 TRI.extend((k,k+1,k+2,k,k+2,k+3))
batch=collections.defaultdict(list);counts=collections.Counter();catalog=collections.Counter()
instances=[];rooms=[];blocks=[]
def cube(zone,id,mat,x,y,z,sx,sy,sz,kind):
 assert min(sx,sy,sz)>.008,(id,sx,sy,sz)
 batch[(zone,mat)].append((id,x,y,z,sx,sy,sz,kind))
 counts[kind]+=1
def emit(zone,kind,x,y,z,L,W,H,orient=0,room_id=""):
 # Parametric furniture facsimile at ACTUAL design-catalogue width/depth/height.
 # orient=90 uses a rotational footprint swap in the XZ plane.
 if orient in (90,270):L,W=W,L
 assert kind in asset_values
 sx,sz=L,W;h=H
 def c(mat,dx,dy,dz,wx,hy,wz,part):
  # Coordinate offsets use oriented object x,z; no fake geometry placed outside its extents.
  cube(zone,kind+"_"+part,mat,x+dx,y+dy,z+dz,wx,hy,wz,"furniture_part")
 # top/legs low furniture
 is_desk=kind in ("ST01","ST03","TC01","OF01","OF05","OF07","LB03","LB08","AR03","SP01","SV02","SP03")
 is_chair=kind in ("ST02","OF02","OF03","LB04","AS05")
 is_bench=kind in ("CO01","AS01","OF06")
 is_shelf=kind in ("TC04","TC05","CO02","OF04","OF08","LB01","LB02","LB09","LB10","AR01","AR02","AR04","SP05","SP06","CL01")
 is_board=kind in ("TC03","TC06","DG03","DG04","WC03")
 is_small=kind in ("TC07","CO03","CO04","CO05","CO06","LB06","SV03","DG05","SP04","CL02","LB07")
 if is_desk:
  c("wood",0,h-.050,0,sx,.085,sz,"top")
  c("wood_hilite",0,h-.007,0,sx*.95,.012,sz*.92,"edge")
  for dx in (-sx*.39,sx*.39):
   for dz in (-sz*.37,sz*.37):
    c("dark",dx,(h-.09)/2,dz,max(.045,sx*.048),h-.09,max(.045,sz*.10),"leg")
  c("brass",0,h*.72,sz*.40,sx*.61,.025,.018,"trim")
  if kind in ("TC01","OF01","LB03","AR03"):
   c("green_leather",0,h+.003,0,sx*.63,.012,sz*.57,"leather_inset")
 elif is_chair:
  seat=h*.53 if kind!="OF02" else h*.41
  c("wood",0,seat,0,sx,.070,sz*.90,"seat")
  for dx in (-sx*.37,sx*.37):
   for dz in (-sz*.34,sz*.34):
    c("dark",dx,seat*.48,dz,.048,seat*.98,.055,"leg")
  c("wood",0,(seat+h)/2,sz*.34,sx*.94,h-seat,.065,"gothic_back")
  c("brass",0,h-.036,sz*.34,sx*.72,.045,.078,"back_crest")
 elif is_bench:
  seat=h*.50
  c("wood",0,seat,0,sx,.075,sz*.76,"seat")
  c("wood",0,(seat+h)/2,sz*.35,sx*.95,h-seat,.072,"arched_back")
  for dx in (-sx*.45,sx*.45):
   c("dark",dx,seat*.48,0,.095,seat*.98,sz*.76,"end_frame")
  for col in range(max(3,round(sx/.33))):
   u=-sx*.41+(col+.5)*sx*.82/max(3,round(sx/.33))
   c("brass",u,h*.79,sz*.40,.015,h*.16,.021,"back_tracery")
 elif is_shelf:
  c("dark",0,h*.50,0,sx,h,sz,"body")
  c("wood",0,h*.50,sz*.50,sx*.93,h*.93,.045,"back_plate")
  for j in range(1,5):
   c("wood_hilite",0,j*h/5,0,sx*.92,.042,sz*.94,"shelf")
  for dx in (-sx*.46,sx*.46):
   c("brass",dx,h*.50,sz*.47,.025,h*.74,.022,"pillar_trim")
  for j in range(2):
   c("paper",sx*(-.24+.24*j),h*(.33+j*.24),sz*.33,
      sx*.26,h*.14,sz*.25,"bookstack")
  if kind in ("CO02","LB10"):
   c("glass",0,h*.55,sz*.51,sx*.78,h*.72,.024,"glass_front")
 elif is_board:
  c("dark",0,h*.50,0,sx,h,sz,"frame")
  c("chalk" if kind=="TC03" else "paper",0,h*.51,sz*.48,sx*.92,h*.86,.012,"face")
  c("brass",0,h*.96,sz*.51,sx*.92,.025,.027,"top_trim")
 elif is_small:
  if kind in ("CO03","LB06","TC07"):
   c("brass",0,h*.40,0,sx*.24,h*.75,sz*.27,"lamp_stem")
   c("warmlight",0,h*.84,0,sx*.46,h*.25,sz*.52,"glow")
  elif kind in ("DG05","CO05","CO06"):
   c("dark",0,h*.35,0,sx*.72,h*.70,sz*.72,"base")
   c("brass",0,h*.70,0,sx*.85,.06,sz*.85,"rim")
  else:
   c("wood",0,h*.49,0,sx*.72,h*.96,sz*.70,"case")
   c("brass",0,h*.83,sz*.37,sx*.46,.036,.027,"ornament")
 elif kind in ("AS02","SV01","LB05"):
  c("dark",0,h*.48,0,sx*.9,h*.91,sz*.8,"podium")
  c("wood_hilite",0,h-.03,0,sx,.070,sz,"countertop")
  c("brass",0,h*.52,sz*.45,sx*.65,.08,.025,"front_relief")
 elif kind=="AS03":
  c("interior_floor",0,h*.5,0,sx,h,sz,"stage")
 elif kind=="AS04":
  c("dark",0,h*.52,0,sx*.94,h*.58,sz*.85,"piano")
  for i in range(18):
   u=-sx*.38+(i+.5)*sx*.76/18
   c("paper",u,h*.83,sz*.35,sx*.76/18*.88,.035,sz*.16,"key")
 elif kind=="WC02":
  c("interior_plaster",-sx*.45,h*.50,0,.09,h,sz,"partition")
  c("interior_plaster",sx*.45,h*.50,0,.09,h,sz,"partition")
  c("interior_plaster",0,h*.50,-sz*.44,sx,h,.09,"back")
 else:
  c("wood",0,h*.5,0,sx*.85,h,sz*.82,"body")
  c("brass",0,h*.70,sz*.45,sx*.60,.025,.022,"rim")
 instances.append({"id":"LH-"+kind,"zone":zone,"room":room_id,
                   "position":[round(x,3),round(y,3),round(z,3)],
                   "w_m":round(sx,3),"d_m":round(sz,3),"h_m":round(h,3),
                   "furniture_source":"62-item catalog; V12 uses lightweight parametric look-alike geometry"})
 catalog[kind]+=1
def furniture(zone,room,x,z,y=0,id=""):
 L,W,H=asset_values[id]
 emit(zone,id,x,y,z,L,W,H,room_id=room)
# Build an internal room with open door on the central corridor wall; does not move exterior shell.
def rect_room(zone,label,x0,x1,z0,z1,door_side="east",level=0,kind="classroom"):
 assert x1-x0>=3.5 and z1-z0>=3.8,(label,x0,x1,z0,z1)
 assert zone in ("B","C","D","E","G","H")
 y=4.0 if level==2 else 0.0
 # every selected 2F room has real floor; shaft stair blocks are distinct
 if level==2:
  cube(zone,label+"_level2_floor","interior_floor",(x0+x1)/2,3.96,(z0+z1)/2,
       x1-x0,.16,z1-z0,"second_floor")
 mid=(z0+z1)/2
 # partition walls split into two around 1.85m door on corridor face
 span=1.95
 for side,xwall in (("west",x0),("east",x1)):
  if side==door_side:
   for name,za,zb in (("low",z0,mid-span/2),("high",mid+span/2,z1)):
    if zb-za>.22:cube(zone,label+"_partition_"+side+"_"+name,
       "interior_plaster",xwall,y+1.69,(za+zb)/2,.16,3.38,zb-za,"door_partition")
   cube(zone,label+"_door_head","wood",xwall,y+3.17,mid,.18,.40,span,"door_lintel")
  else:
   # Only walls between same floors and neighboring occupied slot. This is a thin
   # partition, not a full new exterior facade.
   cube(zone,label+"_partition_"+side,"interior_plaster",xwall,y+1.69,mid,.16,3.38,z1-z0,"room_partition")
 for zwall,side in ((z0,"north"),(z1,"south")):
  cube(zone,label+"_partition_"+side,"interior_plaster",(x0+x1)/2,y+1.69,zwall,
       x1-x0,3.38,.15,"room_partition")
 rooms.append({"id":label,"zone":zone,"floor":level or 1,
               "bounding_xz":[round(x0,3),round(x1,3),round(z0,3),round(z1,3)],
               "door":door_side,"type":kind,"status":"PROVISIONAL_DIVISION"})
 return (x0,x1,z0,z1,y)
def classroom(room,kind,students=24):
 zone=room["zone"];x0,x1,z0,z1=room["bounding_xz"];y=4 if room["floor"]==2 else 0
 label=room["id"];width=x1-x0;length=z1-z0
 # Corridor faces are x0 or x1. Put teacher north, row of desks south.
 mid=(x0+x1)/2
 furniture(zone,label,mid,z0+1.1,y,"TC01")
 furniture(zone,label,mid,z0+.36,y,"TC03")
 furniture(zone,label,mid,z0+2.05,y,"TC02")
 capacity=min(students,28)
 for n in range(capacity):
  col=n%4;row=n//4
  x=mid+(col-1.5)*min(1.05,width/5)
  z=z0+2.7+row*min(.89,(length-3.2)/8)
  if z>z1-.60:continue
  furniture(zone,label,x,z,y,"ST01")
  furniture(zone,label,x,z+.37,y,"ST02")
 for z in (z0+.85,z1-.85):
  furniture(zone,label,x0+.76 if room["door"]=="east" else x1-.76,z,y,"TC05")
 furniture(zone,label,x1-.9 if room["door"]=="east" else x0+.9,z0+.8,y,"TC04")
def seminar(room):
 label=room["id"];zone=room["zone"];x0,x1,z0,z1=room["bounding_xz"];y=4 if room["floor"]==2 else 0
 cx=(x0+x1)/2;cz=(z0+z1)/2
 furniture(zone,label,cx,cz,y,"OF05")
 for j in range(12):
  z=cz-2.6+(j//3)*1.65
  x=cx-2.1+(j%3)*2.05
  furniture(zone,label,x,z,y,"OF03")
 furniture(zone,label,cx,z0+.45,y,"TC03")
def specialty(room,kind):
 label=room["id"];zone=room["zone"];x0,x1,z0,z1=room["bounding_xz"];y=4 if room["floor"]==2 else 0
 cx=(x0+x1)/2
 if kind=="art":
  for j in range(6):
   x=cx+((j%2)-.5)*2.0;z=z0+2.5+(j//2)*1.7
   furniture(zone,label,x,z,y,"SP01")
   furniture(zone,label,x+.4,z+.50,y,"ST02")
  for j in range(5):furniture(zone,label,cx-2.4+(j%3)*1.1,z1-1.5-(j//3)*1.0,y,"SP02")
 elif kind=="music":
  furniture(zone,label,cx,z0+1.3,y,"AS04")
  for j in range(20):
   furniture(zone,label,cx+(j%4-1.5)*1.0,z0+3+(j//4)*.84,y,"OF03")
 elif kind in ("study","archive"):
  for j in range(6):
   x=cx+((j%2)-.5)*2.0;z=z0+1.4+(j//2)*1.7
   furniture(zone,label,x,z,y,"LB08" if kind=="study" else "AR01")
   if kind=="study":furniture(zone,label,x,z+.48,y,"LB04")
  for j in range(3):
   furniture(zone,label,x0+.72,z0+1.2+j*1.8,y,"LB02" if kind=="study" else "AR02")
 elif kind=="office":
  for j in range(5):
   x=cx+((j%2)-.5)*2.15;z=z0+2+(j//2)*1.8
   furniture(zone,label,x,z,y,"OF01")
   furniture(zone,label,x,z+.55,y,"OF02")
  furniture(zone,label,x0+.85,z1-1.0,y,"OF04")
 elif kind=="meeting":
  furniture(zone,label,cx,(z0+z1)/2,y,"OF05")
  for j in range(10):
   x=cx-2.0+(j%2)*4.0;z=z0+1.3+(j//2)*1.0
   furniture(zone,label,x,z,y,"OF03")
 else:
  for j in range(5):
   furniture(zone,label,cx+((j%2)-.5)*2,z0+2+(j//2)*1.6,y,"OF04")
# B standard teaching wing x[-139,-114], interior corridor x [-128.0,-124.0].
# Room banks have 9m depth each and length 8m with 0.5m walls.
for level in (1,2):
 for j in range(6):
  z0=-64+j*13.0;z1=z0+10.4
  for bank,(xa,xb,door) in enumerate(((-138.55,-128.2,"east"),(-123.8,-114.45,"west"))):
   rr=rect_room("B",f"B-{level}F-{j:02d}-{bank}",xa,xb,z0,z1,door,level)
   if level==1 and j in (2,5) and bank==0:seminar(rooms[-1])
   elif level==2 and j==5 and bank==1:specialty(rooms[-1],"office")
   else:classroom(rooms[-1],"ordinary",24)
 # New upper corridor floor supported by building inside; keep 1F aisle open.
 if level==2:cube("B","B_SECOND_CENTRAL_AISLE","interior_floor",-126.0,3.96,-19.0,4.3,.16,89,"corridor_floor")
# C specialty wing x [-35,-14]; side banks each 7.65m, 4.1m central aisle.
for level in (1,2):
 for j in range(5):
  z0=-64+j*16.8;z1=z0+12.5
  for bank,(xa,xb,door) in enumerate(((-34.55,-27.25,"east"),(-22.7,-14.45,"west"))):
   rr=rect_room("C",f"C-{level}F-{j:02d}-{bank}",xa,xb,z0,z1,door,level)
   kind=["art","music","study","office","ordinary"][j]
   if kind=="ordinary":classroom(rooms[-1],"ordinary",20)
   else:specialty(rooms[-1],kind)
 if level==2:cube("C","C_SECOND_CENTRAL_AISLE","interior_floor",-24.95,3.96,-19,4.35,.16,89,"corridor_floor")
# D entrance wings: reserve existing central clock gate and main routes; furniture near perimeter
# (no internal all-width separation across front door).
for side,xs in (("WEST",[-93,-87,-81]),("EAST",[-59,-50,-40,-30])):
 for j,x in enumerate(xs):
  label=f"D_{side}_OFFICE_{j}"
  # Place small signed furniture groups away from door Z=36..40 and central portal
  for k in range(2):
   z=43+3*k
   furniture("D",label,x,z,0,"OF01" if (j+k)%2 else "OF04")
  furniture("D",label,x,49.4,0,"OF03")
for i,x in enumerate((-90,-43)):
 furniture("D","D_VISITOR",x,35,0,"CO01")
 furniture("D","D_VISITOR",x,43,0,"CO02")
for x in (-90,-50,-31):
 furniture("D","D_ENTRY",x,50.4,0,"SV03")
# E north academic forehall, don't block true axial passages X=-84 & X=-45.
for side,x0,x1 in (("W",-117,-95),("CENTER",-93,-63),("E",-61,-41)):
 for level in (1,2):
  y=4 if level==2 else 0
  for j in range(3):
   x=x0+2.5+(x1-x0-5)*(j+.5)/3
   z=-105 if level==1 else -92
   # skip actual axial circulation centers -84, -45
   if min(abs(x+84),abs(x+45))<3.0:continue
   label=f"E_{side}_{level}F_{j}"
   furniture("E",label,x,z,y,"OF06" if level==1 else "OF01")
   furniture("E",label,x+.9,z+.95,y,"OF07" if level==1 else "OF02")
   furniture("E",label,x-1.05,z+1.7,y,"LB02")
 # No full 2F slab here until north academic circulation layout is approved.
# G assembly: stage at north end Z -163; audience from -154 to -131.
furniture("G","G_HALL",-109,-162,0,"AS03")
furniture("G","G_HALL",-109,-161,0,"AS02")
for row in range(8):
 z=-153+row*2.28
 for col in range(4):
  x=-116.6+col*4.9
  furniture("G","G_HALL",x,z,0,"AS01")
furniture("G","G_HALL",-99,-159,0,"AS04")
for i in range(12):furniture("G","G_BACKSTAGE",-116+(i%4)*1.65,-168+(i//4)*1.2,0,"AS05")
# H archive: racks with 1.5m aisles; avoid south entry Z=-151.
for row in range(5):
 z=-171+row*4.6
 for col in range(4):
  x=7+col*5.0
  if abs(z+151)<2.5:continue
  furniture("H","H_STACKS",x,z,0,"AR01")
for j in range(3):
 furniture("H","H_RESTORATION",7+j*4,-147,0,"AR03")
 furniture("H","H_RESTORATION",7+j*4,-145.7,0,"AR04")
for j in range(3):
 furniture("H","H_INTAKE",19+j*2.5,-153.8,0,"LB08")
# B/C interior 2F stairs are not yet modeled or certified; mark gate explicitly.
# DO NOT falsely mark the new upper floor classrooms as publicly accessible.

# bake merged meshes like V11; keep original GLB nodes immutable, attach editable
# instance-placement manifest and original 62 reusable standalone GLBs externally.
baked=[]
for (area,mat),parts in sorted(batch.items()):
 pos=[];nor=[];inds=[];mi=[float("inf")]*3;ma=[-float("inf")]*3
 for name,x,y,z,sx,sy,sz,kind in parts:
  off=len(pos)//3
  for p,n in zip(CUBE,NORMAL):
   xyz=(x+p[0]*sx,y+p[1]*sy,z+p[2]*sz)
   for k in range(3):mi[k]=min(mi[k],xyz[k]);ma[k]=max(ma[k],xyz[k])
   pos.extend(xyz);nor.extend(n)
  inds.extend(off+i for i in TRI)
 v=len(pos)//3
 assert v==len(parts)*24
 pv=io.add_buffer_view(m,buf,struct.pack("<%sf"%len(pos),*pos),34962)
 nv=io.add_buffer_view(m,buf,struct.pack("<%sf"%len(nor),*nor),34962)
 iv=io.add_buffer_view(m,buf,struct.pack("<%sI"%len(inds),*inds),34963)
 acc=m.setdefault("accessors",[])
 pa=len(acc);acc.append({"bufferView":pv,"componentType":5126,"count":v,"type":"VEC3","min":mi,"max":ma})
 na=len(acc);acc.append({"bufferView":nv,"componentType":5126,"count":v,"type":"VEC3"})
 ia=len(acc);acc.append({"bufferView":iv,"componentType":5125,"count":len(inds),"type":"SCALAR","min":[0],"max":[v-1]})
 m["meshes"].append({"name":TAG+area+"_"+mat,"primitives":[{"attributes":{"POSITION":pa,"NORMAL":na},"indices":ia,"material":materials[mat],"mode":4}]})
 m["nodes"].append({"name":TAG+area+"_"+mat,"mesh":len(m["meshes"])-1,"extras":{
  "area":area,"material":mat,"baked_parts":len(parts),
  "version":"V12_PROVISIONAL_FURNITURE","actual_individual_GLBs_embedded":False,
  "all_previous_nodes_preserved":True,"author_approval":"PENDING"}})
 m["scenes"][m.get("scene",0)]["nodes"].append(len(m["nodes"])-1)
 baked.append(m["nodes"][-1]["name"])
assert json.dumps(m["nodes"][:11923],sort_keys=True,ensure_ascii=False)==frozen_nodes
assert m["scenes"][m.get("scene",0)]["nodes"][:len(frozen_roots)]==frozen_roots
assert len(instances)>900,(len(instances))
assert len(rooms)>=40
assert set(catalog).issubset(set(asset_values))
assert all(z not in ("A","F") for z in [r["zone"] for r in rooms])
m["buffers"][0]["byteLength"]=len(buf)
js=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
js+=b" "*((-len(js))%4)
buf+=b"\x00"*((-len(buf))%4)
payload=(struct.pack("<4sII",io.MAGIC,2,12+8+len(js)+8+len(buf))+
 struct.pack("<II",len(js),io.CHUNK_JSON)+js+struct.pack("<II",len(buf),io.CHUNK_BIN)+bytes(buf))
DST.mkdir(parents=True,exist_ok=True)
(DST/FILE).write_bytes(payload)
reloaded,rbuf,_=io.load_glb(DST/FILE)
assert len(reloaded["nodes"])==len(m["nodes"]) and len(rbuf)==len(buf)
report={
 "version":"ACADEMY-INTERIOR-FURNITURE-V12-PHASE1","file":FILE,
 "sha256":hashlib.sha256(payload).hexdigest(),"bytes":len(payload),
 "source_v11_sha256":EXPECTED,
 "source_nodes_preserved":11923,"nodes":len(m["nodes"]),
 "new_batched_meshes":len(baked),"new_cubes":sum(counts.values()),
 "new_rooms":len(rooms),"furniture_instances":len(instances),
 "furniture_types_used":len(catalog),"catalog_max_types":62,
 "districts_furnished":sorted({x["zone"] for x in instances}),
 "untouched_story_districts":["A_MAIN","F_LIBRARY"],
 "reused_original_62_glbs":False,
 "true_furniture_geometry":"LOWPOLY_PARAMETRIC_EQUIVALENTS_FROM_SAME_ASSET_ID_DIMENSIONS",
 "original_standalone_asset_zip":"拉乎迪學院_62款3D家具模型庫_v1.zip (preserved separately; not injected)",
 "source_plan_rooms":102,"original_plan_objects":2774,
 "rooms_are_provisional":True,
 "no_3f_floor_over_A01":True,
 "2f_access_BC":"NOT_COMPLETE__UPPER_STAIR_REQUIRED",
 "single_school_glb":True,
 "author_approval":"PENDING",
 "rendering":"NOT_RUN",
 "no_character_collision":"SKIPPED_AS_REQUESTED",
 "box_counts":dict(counts),"catalog_counts":dict(catalog),
 "warnings":[
  "Floor/room dividers are provisional where the school had only outer shell.",
  "First floor and part of second floor only in new wings; not all 102 spaces.",
  "62 original standalone furniture GLBs were not copied byte for byte into the single school GLB, geometry is algorithmically equivalent in style/ID/dimensions.",
  "A01, original A/C classrooms and native library untouched; no unverified duplicate furniture.",
  "B/C 2F stairs not yet modeled and no user/animation visual acceptance; candidate only until stair access resolved."
 ]}
(DST/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
(DST/"furniture-placements.json").write_text(json.dumps({"version":report["version"],"source_catalog_62_types":asset_values,
 "source_original_furniture_glbs":"user local independent GLBs","rooms":rooms,"placements":instances},ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k not in ("box_counts","catalog_counts","warnings")},ensure_ascii=False))
