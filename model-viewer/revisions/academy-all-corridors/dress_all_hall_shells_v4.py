#!/usr/bin/env python3
"""RG Academy full-campus RB2 Gothic clerestory exterior pass, zero rendering.

We DO NOT invent interior corridors for the 28 *hall* meshes, which spatial
audit identifies only as exterior building shells. Dress upper facades
above native door level (Y >= 3.5) without disabling ANY preexisting geometry.
Input is fully integrated V3 school GLB, not a detached set of walls.
"""
from pathlib import Path
import sys,math,json,hashlib,struct
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
SRC=Path("model-viewer/staged-output/academy-all-corridors-rb2-v3/lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v3.glb")
EXPECTED="b89c8c80f6c8d02fd95b97c9ac8cc39f7a7418598a45f272177f9e37476a88df"
SPATIAL=Path("model-viewer/staged-output/academy-corridor-audit/spatial.json")
OUT=Path("candidate-output/academy-corridors-rb2-v4")
OUTNAME="lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v4.glb"
PREFIX="RG-GAME-02-ALLCOR-RB2-V4__"
def main():
 assert hashlib.sha256(SRC.read_bytes()).hexdigest()==EXPECTED
 model,buf,_=glb.load_glb(SRC)
 old=len(model["nodes"]);assert old==9245
 geo=json.loads(SPATIAL.read_text())
 assert geo["source_sha256"]=="33c99f530c444ddd8b48542566eebf5579d6f1f3cec9755ccd16d4d62898d324"
 named=geo["groups"]["hall"]["names"]
 assert len(named)==28,len(named)
 # Only full building-shell meshes, never the 29 roofs or hall.005 empty facade node.
 assert all(g["name"].startswith("hall") and g.get("bbox") for g in named)
 palette={}
 for i,m in enumerate(model["materials"]):
  n=m.get("name","")
  if n.startswith("ACADEMY_ALL_CORRIDORS_RB2__"):
   palette[n.split("__",1)[1]]=i
 needed={"stone","stone_carving","stone_dark","wood","brass","lamp","glass"}
 assert needed.issubset(palette)
 mesh={}
 for k,mid in palette.items():
  for i,g in enumerate(model["meshes"]):
   p=g.get("primitives",[])
   if len(p)==1 and p[0].get("material")==mid:
    mesh[k]=i;break
 assert needed.issubset(mesh)
 scene=model["scenes"][model.get("scene",0)]
 root=scene.setdefault("nodes",[])
 count={}
 regions={}
 def add(label,mat,pos,scale,kind,region,angle=0,axis="z"):
  assert min(scale)>.001
  if axis=="z":rot=(0,0,math.sin(angle/2),math.cos(angle/2))
  elif axis=="x":rot=(math.sin(angle/2),0,0,math.cos(angle/2))
  else:raise ValueError(axis)
  n={"name":PREFIX+label,"mesh":mesh[mat],
      "translation":[round(float(v),5) for v in pos],
      "scale":[round(float(v),5) for v in scale],
      "rotation":list(rot),
      "extras":{"academy":"LAHUDI","structure":"EXTERIOR_HALL_SHELL_CLERESTORY",
        "style":"RB2_GOTHIC_WINTER","corridor_walkability":"NOT_INFERRED",
        "source_shell":region,"author_approved":False,"kind":kind}}
  model["nodes"].append(n);root.append(len(model["nodes"])-1)
  count[kind]=count.get(kind,0)+1
  regions[region]=regions.get(region,0)+1
 def arc(label,region,cent,panel_halfspan,normal,side,zlong,ybase=7.85):
  # Small pointed arches are high clerestory ornaments, not fake doors.
  for j in range(8):
   t0=j/8;t1=(j+1)/8
   s0=-panel_halfspan+panel_halfspan*2*t0
   s1=-panel_halfspan+panel_halfspan*2*t1
   y0=ybase+.62*(1-abs(2*t0-1)**.8)
   y1=ybase+.62*(1-abs(2*t1-1)**.8)
   if zlong:
    a=(normal,y0,cent+s0);b=(normal,y1,cent+s1)
    dz=b[2]-a[2];dy=b[1]-a[1]
    length=math.hypot(dz,dy)
    theta=-math.atan2(dy,dz)
    add(f"{label}_rib_{j:02d}","stone_carving",
        (normal,(y0+y1)/2,(a[2]+b[2])/2),(.11,.11,length),
        "facade_gothic_window_arch",region,theta,"x")
   else:
    a=(cent+s0,y0,normal);b=(cent+s1,y1,normal)
    dx=b[0]-a[0];dy=b[1]-a[1]
    length=math.hypot(dx,dy)
    theta=math.atan2(dy,dx)
    add(f"{label}_rib_{j:02d}","stone_carving",
        ((a[0]+b[0])/2,(y0+y1)/2,normal),(length,.11,.11),
        "facade_gothic_window_arch",region,theta,"z")
 for shell in named:
  name=shell["name"]
  (x0,y0,z0),(x1,y1,z1)=shell["bbox"]
  dx=x1-x0;dz=z1-z0
  # Long exposed face, outside the native facade bounding box; avoid 0-3.5m doors.
  zlong=dz>=dx
  span=dz if zlong else dx
  if span<10:continue
  n=max(2,int(round(span/5.8)))
  pitch=span/n
  region=name
  for i in range(n):
   center=(z0+(i+.5)*pitch) if zlong else (x0+(i+.5)*pitch)
   border=(z0+i*pitch) if zlong else (x0+i*pitch)
   normal=(x0-.11) if zlong else (z0-.11)
   high=min(y1-.65,8.85)
   # Keep facade decoration ABOVE standard classroom doors; some halls are only 10 m.
   lower=4.15;upper=min(high-.55,7.78)
   if upper<lower+1.8:continue
   mid=(lower+upper)/2
   ht=upper-lower
   panel_w=max(.9,min(pitch-1.25,3.85))
   shape=(.09,ht,panel_w) if zlong else (panel_w,ht,.09)
   pos=(normal,mid,center) if zlong else (center,mid,normal)
   add(f"{name}_{i:02d}_clerestory","glass",pos,shape,
       "high_glazed_facade_panel",region)
   # Two vertical side jambs and mid-mullion, all floating over known door height.
   for side,off in (("a",-panel_w/2-.11),("b",panel_w/2+.11),("mid",0)):
    pos=(normal,mid,center+off) if zlong else (center+off,mid,normal)
    dim=(.17,ht+.18,.16) if zlong else (.16,ht+.18,.17)
    add(f"{name}_{i:02d}_jamb_{side}","stone_carving",pos,dim,
        "high_window_stone_mullion",region)
   bottom=lower-.03
   cap=(normal,bottom,center) if zlong else (center,bottom,normal)
   capscale=(.31,.16,panel_w+.45) if zlong else (panel_w+.45,.16,.31)
   add(f"{name}_{i:02d}_sill","stone_carving",cap,capscale,
       "window_sill",region)
   arc(f"{name}_{i:02d}",region,center,panel_w/2,normal,"west" if zlong else "south",zlong,ybase=upper+.13)
   # Distinctive rhythmic RB2 buttress high-capitals away from ground portals.
   p=(normal,6.02,border) if zlong else (border,6.02,normal)
   sc=(.34,4.65,.36) if zlong else (.36,4.65,.34)
   add(f"{name}_{i:02d}_upper_pilaster","stone",p,sc,
       "facade_upper_pilaster",region)
   p=(normal,8.39,border) if zlong else (border,8.39,normal)
   sc=(.51,.22,.51)
   add(f"{name}_{i:02d}_capital","stone_carving",p,sc,
       "facade_upper_capital",region)
   if i%3==1:
    p=(normal,4.83,border+pitch*.12) if zlong else (border+pitch*.12,4.83,normal)
    add(f"{name}_{i:02d}_lantern_plate","brass",p,(.13,.25,.22),
        "facade_brass_wall_lamp",region)
    p=(p[0],5.03,p[2])
    add(f"{name}_{i:02d}_amber","lamp",p,(.14,.25,.18),
        "facade_amber_lamp",region)
  # High cornice on every long hall shell, not an upper-floor walkable gallery.
  normal=(x0-.11) if zlong else (z0-.11)
  p=(normal,min(y1-.32,9.7),(z0+z1)/2) if zlong else ((x0+x1)/2,min(y1-.32,9.7),normal)
  dims=(.43,.24,span) if zlong else (span,.24,.43)
  add(f"{name}_gothic_cornice","stone_carving",p,dims,
      "upper_facade_cornice",region)
 assert len(regions)==28,(len(regions),regions.keys())
 assert count["high_glazed_facade_panel"]>=260,count
 assert count["facade_gothic_window_arch"]>=2000,count
 assert not any(n.get("name","").startswith(PREFIX) for n in model["nodes"][:old])
 # Existing all-academy mesh nodes and previous corridor V3 geometry untouched.
 model["buffers"][0]["byteLength"]=len(buf)
 jb=json.dumps(model,ensure_ascii=False,separators=(",",":")).encode()
 jb+=b" "*((-len(jb))%4)
 buf+=b"\x00"*((-len(buf))%4)
 data=b"".join((struct.pack("<4sII",glb.MAGIC,2,12+8+len(jb)+8+len(buf)),
                struct.pack("<II",len(jb),glb.CHUNK_JSON),jb,
                struct.pack("<II",len(buf),glb.CHUNK_BIN),bytes(buf)))
 OUT.mkdir(parents=True,exist_ok=True)
 (OUT/OUTNAME).write_bytes(data)
 test,outbuf,_=glb.load_glb(OUT/OUTNAME)
 assert len(test["nodes"])==len(model["nodes"]) and len(outbuf)==len(buf)
 assert len(test["nodes"][:old])==9245
 report={
 "project":"現實遊戲","area":"拉乎迪學院",
 "version":"ACADEMY-RB2-GOTHIC-ALL-CORRIDORS-V4",
 "model":OUTNAME,
 "parent_v3_sha256":EXPECTED,"sha256":hashlib.sha256(data).hexdigest(),
 "bytes":len(data),"original_v3_nodes":old,"result_nodes":len(model["nodes"]),
 "new_nodes":len(model["nodes"])-old,
 "hall_exterior_shells_dressed":len(regions),
 "hall_shell_names":list(regions),
 "new_detail_types":count,"new_details_per_hall":regions,
 "architectural_consistency":"RB2_GOTHIC_STONE_CLERESTORY_MULLION",
 "all_prev_9245_nodes_unchanged":True,"interior_hall_passages_inferred":False,
 "default_ground_floor_door_clear_zone_m":[0,3.5],
 "source_ground_floor_unchanged":True,
 "GLB_reparse":"PASS","rendering":"NOT_RUN_BY_USER_REQUEST",
 "main_five_models_untouched":True,"author_approved":False,
 "limitations":[
  "This pass unifies the exterior architectural style of 28 source hall-shell masses, not unverified interior corridors.",
  "Decorative high clerestory glass sits over source wall surfaces; native exterior masonry not cut into real through-window apertures.",
  "The 28 buildings are distributed over large campus; their internal rooms and walkable corridors are unmodeled/unknown.",
  "No rendering or character navigation performed. Further wing-by-wing interior floor plan needed before claiming full-campus path completion."
 ]
 }
 (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in report.items() if k not in("new_details_per_hall","hall_shell_names","limitations")},ensure_ascii=False))
if __name__=="__main__":main()
