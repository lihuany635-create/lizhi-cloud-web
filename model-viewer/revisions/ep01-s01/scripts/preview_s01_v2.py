#!/usr/bin/env python3
"""Draw geometrically projected candidate components, NOT an anime camera render."""
import json,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import build_s01_candidate as glb

P=Path("candidate-output")
model, buf, raw=glb.load_glb(P/"lahudi-academy_ep01_s01_corridor_v3_review.glb")
W,H=1700,950
im=Image.new("RGB",(W,H),(239,242,245)); d=ImageDraw.Draw(im)
fontpath="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def f(s):
 try:return ImageFont.truetype(fontpath,s)
 except:return ImageFont.load_default()
f_title=f(29);f_body=f(19);f_small=f(15)
d.text((35,24),"EP01 S01  |  Gothic corridor V3 - geometric review",font=f_title,fill=(34,42,58))
d.text((36,66),"Engineering camera projection; not an original-animation camera match",font=f_body,fill=(86,96,107))
d.rounded_rectangle((30,105,1185,855),radius=14,fill=(225,229,235))
d.rounded_rectangle((1210,105,1672,855),radius=14,fill=(250,251,253),outline=(202,207,215),width=2)

cam=(-70.32,5.5,-15.0)
F=1300
def project(p):
 x,y,z=p
 depth=z-cam[2]
 if depth<=0.1:return None
 return (round(596+(x-cam[0])*F/depth),round(495-(y-cam[1])*F/depth),depth)
def shade(rgb,k):
 return tuple(min(255,max(0,int(v*k))) for v in rgb)

def corners(center,scale,q=None):
 x,y,z=center; sx,sy,sz=scale
 pts=[]
 for a in (-.5,.5):
  for b in (-.5,.5):
   for c in (-.5,.5):
    v=[a*sx,b*sy,c*sz]
    if q:
     ux,uy,uz,w=q
     tx=2*(uy*v[2]-uz*v[1]);ty=2*(uz*v[0]-ux*v[2]);tz=2*(ux*v[1]-uy*v[0])
     v=[v[0]+w*tx+(uy*tz-uz*ty),v[1]+w*ty+(uz*tx-ux*tz),v[2]+w*tz+(ux*ty-uy*tx)]
    pts.append((v[0]+x,v[1]+y,v[2]+z))
 return pts
# Corner indexing: 000,001,010,011,100,101,110,111.
faces=((0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3))
items=[]
def cube(pos,scale,col,q=None,priority=0):
 pts=corners(pos,scale,q)
 for face_i,inds in enumerate(faces):
  p=[project(pts[i]) for i in inds]
  if any(x is None for x in p): continue
  depth=sum(v[2] for v in p)/4
  xy=[(v[0],v[1]) for v in p]
  items.append((depth,priority,xy,shade(col,[1.04,.87,1.0,.90,.75,.81][face_i])))
# Ground and left wall are scene-outline references from source GLB world AABB.
cube((-70.25,3.94,1.2),(4.50,.10,22.2),(154,161,168))
cube((-72.55,5.65,1.1),(.18,3.30,18.4),(180,181,183))
cube((-68.70,4.32,1.1),(.12,.60,18.4),(173,154,141))
# End slab is schematic only, and deliberately not treated as verified stair geometry.
cube((-70.85,5.64,12.61),(3.1,3.20,.18),(177,179,184))
# Iterate actual appended nodes and glTF material colors
start=next(i for i,n in enumerate(model["nodes"]) if n.get("name","").startswith("RG-GAME-02-EP01-S01-ARCH-REV__"))
for n in model["nodes"][start:]:
 name=n.get("name","")
 if not (name.startswith("RG-GAME-02-EP01-S01-")):continue
 meshid=n.get("mesh"); 
 if meshid is None:continue
 m=model["meshes"][meshid]["primitives"][0].get("material")
 mat=model["materials"][m] if m is not None else {}
 rgba=mat.get("pbrMetallicRoughness",{}).get("baseColorFactor",[.6,.6,.6,1])
 col=tuple(int(x*255) for x in rgba[:3])
 cube(n.get("translation",[0,0,0]),n.get("scale",[1,1,1]),col,n.get("rotation"),priority=1)
for depth,priority,poly,col in sorted(items,key=lambda x:(-x[0],x[1])):
 d.polygon(poly,fill=col)
 d.line(poly+[poly[0]],fill=shade(col,.65),width=1)
# Schematic top view precise world XY coords.
d.text((1240,132),"TOP PLAN  /  SOURCE AXES",font=f_body,fill=(46,56,69))
scale=17; origin=(1436,510)
def pt(x,z):return round(origin[0]+(x+70.4)*scale),round(origin[1]-(z-1.3)*scale)
# Rotate to horizontal z axis for easier spatial reading
# map Z to horizontal and X to vertical
def pp(x,z):return int(1235+(z+9)*21),int(450+(x+72.6)*80)
d.rectangle((*pp(-72.55,-8.2),*pp(-68.50,12.5)),outline=(110,114,125),width=4)
# each left door
for z in (-5.53,-2.53,.47,3.47,6.47,9.47):
 u,v=pp(-72.36,z-.76);U,V=pp(-72.31,z+.76)
 d.rectangle((min(u,U),min(v,V),max(u,U),max(v,V)),fill=(112,71,48))
for z in (3,6,9):
 u,v=pp(-68.81,z);d.ellipse((u-7,v-7,u+7,v+7),fill=(89,140,198))
for z in (-6.04,-3.04,-.04,2.96,5.96,8.96,11.96):
 u,v=pp(-70.45,z);d.line((u-9,v,u+9,v),fill=(134,130,115),width=3)
d.text((1240,735),"Doors: visually staged, not yet passable",font=f_small,fill=(128,85,58))
d.text((1240,762),"Far stair: original geometry unchanged",font=f_small,fill=(128,85,58))
d.text((1240,790),"S06 and canonical GLB untouched",font=f_small,fill=(70,102,78))
d.text((36,886),"REVIEW ONLY  |  no 1:1 animation overlay  |  verify left doors / right windows / end stair before merge",font=f_body,fill=(84,63,54))
dest=P/"s01_corridor_v3_geometry_preview.png";im.save(dest)
print(f"Saved {dest} size={dest.stat().st_size} projected_faces={len(items)}")
