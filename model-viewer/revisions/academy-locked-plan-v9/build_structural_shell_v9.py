#!/usr/bin/env python3
"""《現實遊戲》拉乎迪學院 V9 structural shell from LOCKED architectural book.
2026-10-23, geometry before decoration. Build as candidate; canonical promotion separate.

Inputs:
  V8 complete GLB, with 11097 preserved measured interior/building-core nodes
  (incl RB2, A1/CROOM, library, roof & side stair, V5 main envelope).
  Remove ONLY V6 77 batched campus wings+ornaments and reconstruct locked B,C,D,E,G,H.
  A original main teaching wing and F library hold their original model coords.

This is a fictional animation-architecture shell; no real structural code compliance.
Model all exterior windows as TRUE open wall bands, not glass stuck onto solid walls.
Do not render. Do not overwrite canonical here.
"""
from pathlib import Path
import sys,json,hashlib,struct,math,collections,copy
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb

SRC=Path("model-viewer/staged-output/academy-entire-campus-contrast-v8/lahudi-academy_ENTIRE-GOTHIC-CAMPUS_CONTRAST_v8.glb")
EXPECTED="07392e83c165854c00f13fb39687253fbd185a1a5aa0d134264651a626af8c8f"
DST=Path("candidate-output/academy-locked-massing-v9")
NAME="lahudi-academy_LOCKED-PLAN-SHELL_RB2_v9.glb"
PREFIX="RG-GAME-02-PLAN-LOCK-V9__"
CORE=11097
def main():
 raw=SRC.read_bytes()
 assert hashlib.sha256(raw).hexdigest()==EXPECTED
 m,buf,_=glb.load_glb(SRC)
 assert len(m["nodes"])==11174
 old=m["nodes"][:CORE]
 assert all(n.get("name","").startswith("RG-GAME-02-CAMPUS-OPTIMIZED-V7__") for n in m["nodes"][CORE:])
 assert len(m["nodes"])-CORE==77
 # Keep native school/classrooms/library/entry/corridor untouched.
 m["nodes"]=old
 for sc in m["scenes"]:
  sc["nodes"]=[v for v in sc.get("nodes",[]) if v<CORE]
 keep_sha=hashlib.sha256(json.dumps(old,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
 names={n.get("name"):n for n in old}
 for name in ("RG-GAME-02-A1-005__open_door","RG-GAME-02-CROOM-005__open_door",
              "RG-GAME-02-CONFESS-005__tread_0",
              "RG-GAME-02-ROOF-001__approach__tread0","RG-GAME-02-LIB-002__book"):
  assert "mesh" in names[name],name
 # physically cut V5 old original facade wall for real links B,C,H/F.
 opened_core=[]
 for n in old:
  name=n.get("name","")
  if ("RG-GAME-02-EXTERIOR-REBUILD-V5__lower_cladding_west_" in name or
      "RG-GAME-02-EXTERIOR-REBUILD-V5__lower_cladding_east_" in name):
   # old V5 main corridor panel bay; remove 1 outside wall module per courtyard bridge
   try:k=int(name.rsplit("_",1)[1])
   except ValueError:continue
   za=-67.85+93.99*k/22
   zb=za+93.99/22
   if za<=-12.0<=zb and "mesh" in n:
    n.setdefault("extras",{})["passage_original_mesh"]=n.pop("mesh")
    opened_core.append(name)
  if name.startswith("RG-GAME-02-EXTERIOR-REBUILD-V5__library_endwall_south") and "mesh" in n:
   # Original huge solid south library wall needs a true 3.6m passage at X≈-45.
   n.setdefault("extras",{})["passage_original_mesh"]=n.pop("mesh")
   opened_core.append(name)
  if name.startswith("RG-GAME-02-EXTERIOR-REBUILD-V5__library_plinth_east_"):
   # On east library side z ≈ -151 to annex H; leave one complete bay open.
   if "mesh" in n:
    tail=name.rsplit("_",1)[1]
    if tail.isdigit():
     k=int(tail);a=-183.2+(40.45)*k/10;b=a+40.45/10
     if k in (7,8):
      n.setdefault("extras",{})["passage_original_mesh"]=n.pop("mesh")
      opened_core.append(name)
 assert len(opened_core)==5,opened_core

 palettes={
  "cold_stone":([.30,.37,.43,1],.80,.01),
  "warm_stone":([.41,.34,.28,1],.83,.01),
  "light_stone":([.53,.52,.48,1],.72,.01),
  "deep_stone":([.19,.25,.30,1],.81,.01),
  "slate_roof":([.055,.085,.145,1],.58,.01),
  "copper_roof":([.17,.27,.23,1],.55,.13),
  "structural_floor":([.20,.25,.28,1],.78,.02),
  "passage":([.31,.34,.34,1],.73,.0),
 }
 meshes={}
 for key,(color,rough,met) in palettes.items():
  m.setdefault("materials",[]).append({"name":"ACADEMY_LOCKED_SHELL_V9__"+key,
    "doubleSided":True,"pbrMetallicRoughness":{"baseColorFactor":color,
      "roughnessFactor":rough,"metallicFactor":met}})
  meshes[key]=glb.add_cube_mesh(m,buf,len(m["materials"])-1)
 root=m["scenes"][m.get("scene",0)].setdefault("nodes",[])
 counts=collections.Counter();region_counts=collections.Counter()
 shells=[]
 protected={
 "A_MAIN":{"x":[-87.95,-67.18],"z":[-67.85,26.14],"existing":True},
 "F_LIBRARY":{"x":[-49.2,-2.2],"z":[-183.2,-142.75],"existing":True}
 }
 def box(name,mat,x,y,z,dx,dy,dz,kind,zone,rot=0,axis="z"):
  assert min(dx,dy,dz)>.008,(name,dx,dy,dz)
  assert all(math.isfinite(float(v)) for v in (x,y,z,dx,dy,dz))
  if axis=="z":q=[0,0,math.sin(rot/2),math.cos(rot/2)]
  elif axis=="x":q=[math.sin(rot/2),0,0,math.cos(rot/2)]
  else:raise ValueError(axis)
  n={"name":PREFIX+name,"mesh":meshes[mat],
     "translation":[round(v,5) for v in (x,y,z)],
     "scale":[round(v,5) for v in (dx,dy,dz)],
     "rotation":q,
     "extras":{"zone":zone,"kind":kind,"lock":"BOOK_V1.0",
               "passage_hole":"TRUE" if kind=="real_passage_jamb" else "N/A",
               "user_approved":False}}
  m["nodes"].append(n);root.append(len(m["nodes"])-1)
  counts[kind]+=1;region_counts[zone]+=1
 def segment_wall(name,zone,mat,orientation,fixed,start,end,eave,openings):
  # Full height foundation + bands, but hollow windows 2.55..3.70, 6.5..7.75.
  # Entire bottom 0..3.55 is removed for passage portals.
  assert end-start>0.1
  openings=sorted([(max(start,a),min(end,b)) for a,b in openings if b>start and a<end])
  no_pass=[]
  p=start
  for a,b in openings:
   if a>p+.01:no_pass.append((p,a))
   p=max(p,b)
  if p<end-.01:no_pass.append((p,end))
  def part(a,b,y0,y1,kind):
   if b-a<.03 or y1-y0<.03:return
   if orientation=="x":
    box(f"{name}_{kind}_{a:.2f}_{b:.2f}",mat,fixed,(y0+y1)/2,(a+b)/2,
       .45,y1-y0,b-a,kind,zone)
   else:
    box(f"{name}_{kind}_{a:.2f}_{b:.2f}",mat,(a+b)/2,(y0+y1)/2,fixed,
       b-a,y1-y0,.45,kind,zone)
  for a,b in no_pass:part(a,b,0,3.55,"low_wall")
  # Recessed structural window openings, NOT glass objects.
  for y0,y1,kind in ((3.55,6.0,"middle_spandrel"),(7.65,eave,"upper_spandrel")):
   if eave>y0:part(start,end,y0,min(eave,y1),"wall_band")
  # Framing piers divide window openings into bays approximately 4.6m.
  distance=end-start
  n=max(1,math.ceil(distance/4.6))
  for i in range(n+1):
   anchor=start+i*distance/n
   # do not put 1F piers in the centre of portals
   is_portal=any(a+.18<anchor<b-.18 for a,b in openings)
   if is_portal: continue
   if orientation=="x":box(f"{name}_baypier_{i}", "light_stone",fixed,5.2,anchor,.37,10.4,.34,"pilaster",zone)
   else:box(f"{name}_baypier_{i}","light_stone",anchor,5.2,fixed,.34,10.4,.37,"pilaster",zone)
  # Structural door lintels at 3.55m, leave lower open for humans.
  for k,(a,b) in enumerate(openings):
   mid=(a+b)/2;w=b-a
   if w<1.4:continue
   if orientation=="x":
    box(f"{name}_portal_{k}_head","light_stone",fixed,3.77,mid,.53,.42,w,"passage_header",zone)
    for side,loc in (("a",a),("b",b)):
     box(f"{name}_portal_{k}_{side}","light_stone",fixed,1.8,loc,.54,3.6,.42,"real_passage_jamb",zone)
   else:
    box(f"{name}_portal_{k}_head","light_stone",mid,3.77,fixed,w,.42,.53,"passage_header",zone)
    for side,loc in (("a",a),("b",b)):
     box(f"{name}_portal_{k}_{side}","light_stone",loc,1.8,fixed,.42,3.6,.54,"real_passage_jamb",zone)
 def roof(name,zone,x0,x1,z0,z1,eave,ridge,mat="slate_roof"):
  cx=(x0+x1)/2
  for i,(a,b) in enumerate(((x0,cx),(cx,x1))):
   ya,yb=(eave,ridge) if i==0 else (ridge,eave)
   rot=math.atan2(yb-ya,b-a)
   length=math.hypot(b-a,yb-ya)
   box(f"{name}_side_{i}",mat,(a+b)/2,(ya+yb)/2,(z0+z1)/2,length,.25,z1-z0+.5,
      "pitched_roof",zone,rot,"z")
   for end,z in (("north",z0),("south",z1)):
    box(f"{name}_gableedge_{i}_{end}","light_stone",(a+b)/2,(ya+yb)/2,z,length,.19,.35,
        "roof_rake",zone,rot,"z")
  box(f"{name}_ridge","deep_stone",cx,ridge,(z0+z1)/2,.30,.30,z1-z0,"ridge",zone)
 def wing(name,x0,x1,z0,z1,eave,ridge,mat="cold_stone",roofmat="slate_roof",
          east_doors=None,west_doors=None,north_doors=None,south_doors=None, omit_west=False, omit_east=False):
  shells.append({"id":name,"bbox":{"x":[x0,x1],"z":[z0,z1]},"eave":eave,"ridge":ridge})
  # Exterior footprint floor, not a mass filling entire building interior.
  box(name+"_ground_slab","structural_floor",(x0+x1)/2,-.12,(z0+z1)/2,
      x1-x0,.24,z1-z0,"foundation_slab",name)
  if not omit_west:segment_wall(name+"_west",name,mat,"x",x0,z0,z1,eave,west_doors or [])
  if not omit_east:segment_wall(name+"_east",name,mat,"x",x1,z0,z1,eave,east_doors or [])
  segment_wall(name+"_north",name,mat,"z",z0,x0,x1,eave,north_doors or [])
  segment_wall(name+"_south",name,mat,"z",z1,x0,x1,eave,south_doors or [])
  roof(name,name,x0,x1,z0,z1,eave,ridge,roofmat)
 # 6 NEW masses, 2 preserved original masses:
 wing("B_WEST",-139,-114,-68,24,11.6,15.8,
      east_doors=[(-12.2,-8.2)],south_doors=[(-125,-121)])
 wing("C_EAST",-35,-14,-68,24,11.6,15.6,mat="warm_stone",
      west_doors=[(-12.2,-8.2)],south_doors=[(-32,-28)])
 # South entrance D composed asymmetrically around existing x=-70.1 clock tower
 # using the exact locked bounding union x[-98,-22], z[30,53].
 wing("D_WEST_ENTRY",-98,-75,30,53,10.8,15.5,mat="warm_stone",
      east_doors=[(36,41)],south_doors=[(-90,-85)],north_doors=[(-90,-85)])
 wing("D_EAST_ENTRY",-65,-22,30,53,10.8,15.0,
      west_doors=[(36,41)],south_doors=[(-34,-29)],north_doors=[(-34,-29)])
 # Clock tower is old V5 x -74.2..-65.8, z~25.6..35.4. Keep it central to *existing* walkway x=-70.1.
 # E's 78m-wide roof cannot be one unaffordable 39m half-span; split into 3 gabled volumes
 wing("E_WEST_ACADEMY",-118,-94,-112,-82,11.6,16.0,mat="warm_stone",
      north_doors=[(-108,-104)],omit_east=True)
 wing("E_CENTER_HALL",-94,-62,-112,-82,12.8,17.6,
      north_doors=[(-86,-82)],south_doors=[(-86,-82)],
      omit_west=True,omit_east=True)
 wing("E_EAST_LINK",-62,-40,-112,-82,11.6,16.0,
      north_doors=[(-47,-43)],omit_west=True)
 # Structural shared columns between the three northern roof segments:
 for xi in (-94,-62):
  for zi in (-109,-102,-95,-85):
   box(f"E_PARTY_PIER_{xi}_{zi}","light_stone",xi,6,zi,
       .68,12.0,.68,"party_wall_pier","E_NORTH_ACADEMY")
 # G high roof
 wing("G_ASSEMBLY",-123,-95,-170,-125,12.5,19.5,
      north_doors=[(-107,-103)],mat="cold_stone",roofmat="copper_roof")
 wing("H_ARCHIVE",4,28,-174,-143,10.8,14.8,
      west_doors=[(-154,-149)],mat="warm_stone")
 # Building count physical sub-masses D=two and E=three, but eight locked project districts.
 assert len(shells)==9 # B,C,D2,E3,G,H = 2+2+3+1+1
 # main entry tower already exists and A/F envelope already exists.
 # Repair actual portal for library southern solid wall removed above.
 segment_wall("F_LIBRARY_SOUTH_REPLACEMENT","F_LIBRARY","cold_stone","z",-142.75,
              -49.2,-2.2,11.0,[(-47,-43.4)])
 # Repair rear V5 library east wall / true link opening.
 segment_wall("F_LIBRARY_EAST_PORTAL","F_LIBRARY","cold_stone","x",-2.2,
              -154.885,-146.795,4.0,[(-154,-149)])
 # Re-frame exact original V5 single-bay courtyard portals (old mesh panel 13 suppressed).
 for x,label in ((-87.95,"west"),(-67.18,"east")):
  for z,end in ((-12.2,"north"),(-8.2,"south")):
   box(f"A_MAIN_court_door_jamb_{label}_{end}","light_stone",x,1.78,z,
       .58,3.55,.28,"real_passage_jamb","A_MAIN")
  box(f"A_MAIN_court_door_header_{label}","light_stone",x,3.83,-10.2,
      .58,.32,4.0,"passage_header","A_MAIN")
 # Pathways and slabs across exact measured gaps. These do not imply full collision QA.
 def link(name,xa,xb,za,zb):
  assert xa<xb and za<zb,(name,xa,xb,za,zb)
  box(name,"passage",(xa+xb)/2,.065,(za+zb)/2,xb-xa,.13,zb-za,
      "walkable_connector_slab","LINK")
  # A structural COVERED connector, not just a decorative ground strip.
  # Keep entrances open at either end; arches/columns sit outside clear path width.
  if name.endswith("MAIN_TO_ENTRANCE"):return  # old clock portal already carries its own roof
  along_x=(xb-xa)>(zb-za)
  box(name+"_roof","slate_roof",(xa+xb)/2,5.13,(za+zb)/2,
      xb-xa+.35,.24,zb-za+.35,"covered_connector_roof","LINK")
  span=(xb-xa) if along_x else (zb-za)
  stations=max(2,math.ceil(span/4.6))
  for i in range(stations+1):
   t=i/stations
   if along_x:
    xi=xa+(xb-xa)*t
    for suffix,zi in (("a",za-.19),("b",zb+.19)):
     box(name+f"_pier_{i}_{suffix}","light_stone",xi,2.55,zi,
         .30,5.10,.30,"arcade_support","LINK")
   else:
    zi=za+(zb-za)*t
    for suffix,xi in (("a",xa-.19),("b",xb+.19)):
     box(name+f"_pier_{i}_{suffix}","light_stone",xi,2.55,zi,
         .30,5.10,.30,"arcade_support","LINK")
 links={
 "WEST_TO_MAIN":(-114,-87.95,-12.0,-8.4),
 "EAST_TO_MAIN":(-67.18,-35,-12.0,-8.4),
 "MAIN_TO_E_SOUTH":(-86,-82,-82,-67.85),
 "E_NORTH_TO_LIBRARY":(-47,-43.4,-142.75,-112),
 "E_TO_G_CHAPEL":(-107,-103,-125,-112),
 "F_TO_H_ARCHIVE":(-2.2,4,-154,-149),
 "WEST_TO_D_WEST_Z":(-125,-121,24,40),
 "WEST_TO_D_WEST_X":(-125,-90,36,40),
 "EAST_TO_D_EAST":(-34,-29,24,36),
 "MAIN_TO_ENTRANCE":(-72,-68,26.14,40),
 }
 for key,(xa,xb,za,zb) in links.items():
  link("LINK_"+key,xa,xb,za,zb)
 # Exposed courtyard boundary; leave two court yards truly open.
 courts=[
  {"id":"WEST_COURT","x":[-114,-87.95],"z":[-68,24],"area_m2":round(26.05*92,2)},
  {"id":"EAST_COURT","x":[-67.18,-35],"z":[-68,24],"area_m2":round(32.18*92,2)}
 ]
 # Final GLB file
 m["buffers"][0]["byteLength"]=len(buf)
 js=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
 js+=b" "*((-len(js))%4);buf+=b"\x00"*((-len(buf))%4)
 out=struct.pack("<4sII",glb.MAGIC,2,12+8+len(js)+8+len(buf))+struct.pack("<II",len(js),glb.CHUNK_JSON)+js+struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf)
 DST.mkdir(parents=True,exist_ok=True)
 (DST/NAME).write_bytes(out)
 parsed,bb,_=glb.load_glb(DST/NAME)
 assert len(bb)==len(buf) and len(parsed["nodes"])==len(m["nodes"])
 # Source A1/CROOM and stair protected mesh kept.
 for k in ("RG-GAME-02-A1-005__open_door","RG-GAME-02-CROOM-005__open_door",
           "RG-GAME-02-ROOF-001__approach__tread0","RG-GAME-02-CONFESS-005__tread_0"):
  assert "mesh" in next(n for n in parsed["nodes"] if n.get("name")==k),k
 report={
  "school":"拉乎迪學院","version":"ACADEMY-LOCKED-PLAN-EXTERIOR-SHELL-V9",
  "book":"《現實遊戲》拉乎迪學院｜建築總平面與外觀殼體尺寸手冊 v1.0",
  "book_url":"https://docs.google.com/document/d/1seSK9uMrnNV2_Mh1RwmG50JtjFgXqJzHOQoCqiNFTPQ/edit?usp=drivesdk",
  "source_v8_sha256":EXPECTED,"output_sha256":hashlib.sha256(out).hexdigest(),
  "file":NAME,"bytes":len(out),"nodes":len(parsed["nodes"]),
  "source_total_nodes":11174,"kept_core_nodes":CORE,
  "old_v6_external_wing_mesh_batches_removed":77,
  "locked_districts":["A_MAIN","B_WEST","C_EAST","D_SOUTH_ENTRANCE","E_NORTH_ACADEMY","F_LIBRARY","G_ASSEMBLY","H_ARCHIVE"],
  "existing_locked_districts":protected,
  "rebuilt_structural_submasses":shells,
  "new_structure_nodes":len(parsed["nodes"])-CORE,
  "material_and_feature_counts":dict(counts),
  "actual_wall_portal_core_cuts":opened_core,
  "new_real_connector_slabs":links,
  "protected_open_courts":courts,
  "main_RB2_corridor_unchanged":True,
  "native_A01_story_vault_height_conflict":"3F floor across vaulted segment NOT added; protected for section analysis",
  "new_region_counts":dict(region_counts),
  "structural_roundtrip":"PASS",
  "rendering":"NOT_RUN",
  "body_collision":"NOT_RUN",
  "author_visual_approval":"PENDING",
  "warnings":[
   "Architectural shell massing only: no code-conformant real structural design.",
   "Existing library link is an approximate corridor at X=-45, not perfect centered axes.",
   "Entrance frontage D is asymmetrical because the already existing clock tower X=-70.1 differs from locked frontage midpoint X=-60 by 10.1m.",
   "Original school 4.5m corridor width retained, while animation 5.2m proposal remains unresolved.",
   "Preserving existing main shell and library but cutting selected ground wall panels where essential for circulation.",
   "Windows are open structural wall bands; refinement of window jamb and classroom relationships still necessary."
  ]}
 (DST/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in report.items() if k not in ("material_and_feature_counts","new_region_counts","rebuilt_structural_submasses","new_real_connector_slabs","warnings")},ensure_ascii=False))
if __name__=="__main__":main()
