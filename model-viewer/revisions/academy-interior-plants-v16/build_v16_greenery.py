#!/usr/bin/env python3
"""《現實遊戲》拉乎迪學院 V16 內部植栽｜actual ten reusable 3D GLBs plus composite school.

Inputs: canonical V15 school; V12 actual furniture XYZ placement inventory;
locked V9 8-zone masterplan; V16 botanical design masterplan. Build as candidate,
not a claim of complete A01 / original F library redesign or author acceptance.
"""
from pathlib import Path
import math,hashlib,json,struct,sys,copy,collections
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as io

SRC=Path("model-viewer/lahudi-academy.glb")
OLD_SHA="e269a295159f0f7d3e82df864376579e66f4b92be204ce66667a3c78b9d3ea41"
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==OLD_SHA
m,buf,_=io.load_glb(SRC)
assert len(m["nodes"])==12067,len(m["nodes"])
furn=json.loads(Path(".academy-stage/model-viewer/staged-output/academy-interior-furniture-v12/furniture-placements.json").read_text())
design=json.loads(Path("model-viewer/revisions/academy-interior-plants-v16/greenery-masterplan-v16.json").read_text())
master=json.loads(Path("model-viewer/revisions/academy-locked-plan-v9/masterplan-v1.json").read_text())
assert len(furn["placements"])==1734 and len(furn["rooms"])==44
assert len(design["models"])==10 and len(master["zones"])==8
original_nodes=json.dumps(m["nodes"],sort_keys=True,ensure_ascii=False)
old_root=list(m["scenes"][m.get("scene",0)]["nodes"])
TAG="RG-GAME-02-INDOOR-GREENERY-V16__"
OUT=Path("candidate-output/academy-interior-greenery-v16")
ASSETS=OUT/"plant-assets"
OUT.mkdir(parents=True,exist_ok=True);ASSETS.mkdir(parents=True,exist_ok=True)

styles={p["id"]:p for p in design["models"]}
plants=[]
occupied=collections.defaultdict(list)
for x in furn["placements"]:
 occupied[x["room"]].append(x)
def intersects(a,b,margin=0.15):
 # horizontal axis-aligned proximity in real X,Z metre coordinates.
 return abs(a[0]-b[0]) < (a[2]+b[2])/2+margin and abs(a[1]-b[1]) <(a[3]+b[3])/2+margin
def candidate_ok(zone,room,x,z,w,depth,floor,exempt=None):
 zdef=next(c for c in master["zones"] if c["id"].startswith(zone+"_"))
 xa,xb=zdef["x"];za,zb=zdef["z"]
 if not(xa+.22<x-w/2 and x+w/2<xb-.22 and za+.22<z-depth/2 and z+depth/2<zb-.22):return False
 # validate with all matching-floor furniture in the zone; no cross-floor phantom collision.
 for p in furn["placements"]:
  if p["zone"]!=zone or abs(p["position"][1]-floor)>.36:continue
  if exempt and p is exempt:continue
  if intersects((x,z,w,depth),(p["position"][0],p["position"][2],p["w_m"],p["d_m"]),.15):return False
 for plant in plants:
  if plant["zone"]!=zone or abs(plant["position"][1]-floor)>.36:continue
  if plant["placement_type"]=="desktop":continue
  if intersects((x,z,w,depth),(plant["position"][0],plant["position"][2],plant["diameter_m"],plant["diameter_m"]),.1):return False
 return True
def add(zone,room,style,x,y,z,purpose,placement_type="floor",support=None):
 q=styles[style];w=q["width"]
 assert zone in "ABCDEFGH"
 n=len(plants)+1
 o={"instance_id":f"GRN-{n:03d}","asset_id":style,"zone":zone,"room":room,
    "position":[round(x,3),round(y,3),round(z,3)],"diameter_m":w,
    "height_m":q["height"],"placement_type":placement_type,
    "purpose":purpose,"support_furniture":support,"state":"INSTALLED_PROVISIONAL"}
 plants.append(o)
# 44 provisional classrooms: choose physically free exterior-wall-side sites.
missing_floor=[]
for room in furn["rooms"]:
 z=room["zone"];x0,x1,z0,z1=room["bounding_xz"];floor=4.0 if room["floor"]==2 else 0.0
 if z not in ("B","C"):continue
 candidates=[]
 wallx=x0+.73 if room["door"]=="east" else x1-.73
 for zz in (z0+5.18,z0+4.0,z0+6.1,z0+7.2,z1-3.6,z1-4.4):
  candidates.append((wallx,zz))
 for xx in (x0+.80,x1-.80):
  for zz in (z0+4.3,z1-3.7):
   candidates.append((xx,zz))
 typ=("PL05" if z=="B" else "PL04")
 chosen=next(((x,zz) for x,zz in candidates if candidate_ok(z,room["id"],x,zz,styles[typ]["width"],styles[typ]["width"],floor)),None)
 if chosen:
  add(z,room["id"],typ,chosen[0],floor,chosen[1],"teacher-room sideline; non-story wall")
 else:missing_floor.append(room["id"])
 # Place restrained desktop greenery ONLY on an actually modeled tabletop in that same room.
 table=next((p for p in occupied[room["id"]] if p["id"] in
           ("LH-TC01","LH-OF01","LH-LB08","LH-SP01","LH-OF05") and
           p["w_m"]>=.95 and p["d_m"]>=.52),None)
 if table:
  typ="PL07" if z=="B" else "PL08"
  off=min(.36,table["w_m"]*.25)
  x=table["position"][0]+off
  y=table["position"][1]+table["h_m"]+.013
  zz=table["position"][2]
  # tabletop centers defined by V12 furniture registry; decorative potted plants are small.
  if off+styles[typ]["width"]/2 <= table["w_m"]/2-.06:
   add(z,room["id"],typ,x,y,zz,"on existing modeled desk","desktop",table["id"])
# Shared D / E / G / H: use furniture-assisted candidate selection, don't obstruct routes.
public_candidates={
"D":[(-95.4,39.6,"PL01"),(-25.0,39.7,"PL01"),(-95.1,51.2,"PL04"),(-24.1,50.2,"PL04"),
      (-91.6,33.0,"PL02"),(-33.3,33.0,"PL02")],
"E":[(-114.9,-86.1,"PL02"),(-104.7,-86.1,"PL04"),(-95.5,-87.0,"PL03"),(-77.8,-87.5,"PL01"),
      (-65.7,-85.8,"PL04"),(-56.3,-85.8,"PL01"),(-115.5,-109.7,"PL05"),(-57.0,-109.1,"PL05")],
"G":[(-120.6,-166.3,"PL02"),(-97.0,-166.0,"PL02"),(-121.0,-128.7,"PL01"),(-97.2,-128.8,"PL01")],
"H":[(26.1,-147.2,"PL05"),(26.0,-149.2,"PL04"),(5.4,-145.5,"PL06")]
}
public_rejected=[]
for zone,candidates in public_candidates.items():
 for x,z,style in candidates:
  w=styles[style]["width"]
  if candidate_ok(zone,zone+"_COMMON",x,z,w,w,0.0):
   add(zone,zone+"_COMMON",style,x,0,z,"side wall/quiet corner",placement_type="floor")
  else:public_rejected.append([zone,x,z,style])
# Native A_MAIN (A01 animation corridor) and F_LIBRARY original books are immutable.
# These ARE designed in the v16 spec but no interior positions are fabricated.
assert all(p["zone"] not in ("A","F") for p in plants)
assert len(plants)>=65,(len(plants),missing_floor,public_rejected)
# Plant prototype models and physical geometry: 4 materials, low-poly taper pots,
# faceted stems and matte diamond leaves, independent files and merged school form.
palette={
 "stone_pot":([.44,.465,.48,1],.86,0),
 "black_pot":([.13,.175,.18,1],.80,.10),
 "wood_pot":([.26,.175,.13,1],.83,.02),
 "rim":([.65,.59,.49,1],.76,.08),
 "soil":([.205,.16,.13,1],.95,0),
 "stem":([.17,.24,.17,1],.88,0),
 "leaf_dark":([.10,.24,.17,1],.83,0),
 "leaf_mid":([.16,.32,.22,1],.85,0),
 "leaf_light":([.265,.38,.27,1],.85,0),
 "flower_muted":([.43,.32,.35,1],.88,0),
}
def load_mat(model):
 indexes={}
 for name,(clr,rough,metal) in palette.items():
  i=len(model["materials"])
  model["materials"].append({"name":TAG+"MAT_"+name,"pbrMetallicRoughness":
   {"baseColorFactor":clr,"roughnessFactor":rough,"metallicFactor":metal},"doubleSided":True})
  indexes[name]=i
 return indexes
# Shapes carry vertices+flat normals+triangles; no dependency on Blender.
shape_cache=collections.defaultdict(list)
def mesh_box(dst,mat,x,y,z,l,h,d):
 dx=l/2;dy=h/2;dz=d/2
 face=[
  ((0,0,1),[(-dx,-dy,dz),(dx,-dy,dz),(dx,dy,dz),(-dx,dy,dz)]),
  ((0,0,-1),[(dx,-dy,-dz),(-dx,-dy,-dz),(-dx,dy,-dz),(dx,dy,-dz)]),
  ((1,0,0),[(dx,-dy,dz),(dx,-dy,-dz),(dx,dy,-dz),(dx,dy,dz)]),
  ((-1,0,0),[(-dx,-dy,-dz),(-dx,-dy,dz),(-dx,dy,dz),(-dx,dy,-dz)]),
  ((0,1,0),[(-dx,dy,dz),(dx,dy,dz),(dx,dy,-dz),(-dx,dy,-dz)]),
  ((0,-1,0),[(-dx,-dy,-dz),(dx,-dy,-dz),(dx,-dy,dz),(-dx,-dy,dz)])
 ]
 for n,pts in face:dst[mat].append(("quad",[(a+x,b+y,c+z) for a,b,c in pts],n))
def leaf(dst,material,x,y,z,dx,dy,dz,span):
 # 2 crossed tapered anime-style leaf triangles with stable normals
 # Shapes are native triangles (no glTF image billboard dependence).
 tip=(x+dx*span,y+dy*span,z+dz*span)
 side=(-dz,0,dx);s=.17*span
 pts=[(x,y,z),(x+side[0]*s,y+.22*span,z+side[2]*s),tip,
      (x-side[0]*s,y+.22*span,z-side[2]*s)]
 dst[material].append(("quad",pts,(0.0,1.0,0.0)))
def stem(dst,x0,y0,z0,x1,y1,z1,thick):
 # Small faceted box between stem endpoints; leaves drive silhouette
 length=math.dist((x0,y0,z0),(x1,y1,z1))
 mesh_box(dst,"stem",(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,thick,max(.03,abs(y1-y0)),thick)
def prototype(style,x,y,z):
 a=styles[style];size=a["width"];height=a["height"];typ=a["leaf"]
 p=collections.defaultdict(list)
 pot=hpot=min(.46,max(.18,height*.31))
 r=size*.28
 pmat={"stone":"stone_pot","dark-stone":"black_pot","dark-wood":"wood_pot","iron":"black_pot"}[a["pot"]]
 # Stone pot/core/rim, soil level and gothic brass highlight
 mesh_box(p,pmat,x,y+pot/2,z,r*1.70,pot,r*1.70)
 mesh_box(p,"rim",x,y+pot-.035,z,r*1.89,.08,r*1.89)
 mesh_box(p,"soil",x,y+pot+.005,z,r*1.47,.025,r*1.47)
 tail=max(.09,height-pot)
 nleaf=7 if typ in ("fine","low","round","bloom") else 11 if typ in ("broad","bush") else 9
 if typ=="branch":nleaf=10
 for k in range(nleaf):
  t=k/nleaf;theta=2*math.pi*t
  vertical=(.42+(.5 if typ in ("upright","narrow") else .27)*((k%5)/4))*tail
  radius=(.18 if typ in ("upright","narrow") else .33 if typ in ("broad","branch") else .31)*size
  ax=x+math.cos(theta)*radius
  az=z+math.sin(theta)*radius
  # stems arise from the soil; leaf fans do not exceed 1.87m room height.
  stem(p,x,y+pot, z,x+math.cos(theta)*radius*.5,y+pot+vertical*.46,z+math.sin(theta)*radius*.5,.026)
  for j in (0,1):
   uy=(.33+j*.19)*tail+vertical*.43
   leaf(p,"leaf_mid" if (k+j)%3 else "leaf_dark",
       x+math.cos(theta)*radius*.32,y+pot+uy,z+math.sin(theta)*radius*.32,
       math.cos(theta),.54 if typ in ("upright","narrow") else .22,
       math.sin(theta),min(.64*size,.34+size*.23)*(1 if j else .72))
  if typ=="bloom" and k%3==0:
   mesh_box(p,"flower_muted",ax,y+pot+vertical,az,.10,.09,.10)
 if typ=="trailing":
  # Hanging form remains a standalone library prototype, NOT placed without ceiling anchor.
  for i in range(5):
   theta=i*math.tau/5
   leaf(p,"leaf_dark",x+math.cos(theta)*r,y+pot*.9,z+math.sin(theta)*r,
        math.cos(theta),-.95,math.sin(theta),.23)
 return p
def bake_meshes(model,buffer,materials,batches,rootname,extras=None):
 added=0
 for (loc,layer,material),parts in sorted(batches.items()):
  pos=[];nor=[];idx=[];mini=[float("inf")]*3;maxi=[-float("inf")]*3
  for kind,vertices,normal in parts:
   assert kind=="quad" and len(vertices)==4
   k=len(pos)//3
   for vertex in vertices:
    pos.extend(vertex);nor.extend(normal)
    for d in range(3):mini[d]=min(mini[d],vertex[d]);maxi[d]=max(maxi[d],vertex[d])
   idx.extend((k,k+1,k+2,k,k+2,k+3))
  vc=len(pos)//3
  assert vc<=1000000
  pv=io.add_buffer_view(model,buffer,struct.pack("<%sf"%len(pos),*pos),34962)
  nv=io.add_buffer_view(model,buffer,struct.pack("<%sf"%len(nor),*nor),34962)
  iv=io.add_buffer_view(model,buffer,struct.pack("<%sI"%len(idx),*idx),34963)
  ac=model.setdefault("accessors",[])
  pi=len(ac);ac.append({"bufferView":pv,"componentType":5126,"count":vc,"type":"VEC3","min":mini,"max":maxi})
  ni=len(ac);ac.append({"bufferView":nv,"componentType":5126,"count":vc,"type":"VEC3"})
  ii=len(ac);ac.append({"bufferView":iv,"componentType":5125,"count":len(idx),"type":"SCALAR","min":[0],"max":[vc-1]})
  model["meshes"].append({"name":f"{rootname}{loc}_{layer}_{material}",
      "primitives":[{"attributes":{"POSITION":pi,"NORMAL":ni},"indices":ii,
                     "material":materials[material],"mode":4}]})
  node={"name":f"{rootname}{loc}_{layer}_{material}","mesh":len(model["meshes"])-1,
        "extras":{"zone":loc,"floor":layer,"material":material,
                  "component_polygons":len(parts),"author_approval":"PENDING"}}
  if extras:node["extras"].update(extras)
  model["nodes"].append(node)
  model["scenes"][model.get("scene",0)]["nodes"].append(len(model["nodes"])-1)
  added+=1
 return added
def save_glb(model,buffer,path):
 model["buffers"][0]["byteLength"]=len(buffer)
 body=json.dumps(model,ensure_ascii=False,separators=(",",":")).encode()
 body+=b" "*((-len(body))%4)
 buffer+=b"\0"*((-len(buffer))%4)
 full=(struct.pack("<4sII",io.MAGIC,2,12+8+len(body)+8+len(buffer))+
       struct.pack("<II",len(body),io.CHUNK_JSON)+body+
       struct.pack("<II",len(buffer),io.CHUNK_BIN)+bytes(buffer))
 path.write_bytes(full)
 rr,bb,_=io.load_glb(path)
 assert len(bb)==len(buffer) and len(rr["nodes"])==len(model["nodes"])
 return {"file":path.name,"bytes":len(full),"sha256":hashlib.sha256(full).hexdigest(),
         "nodes":len(rr["nodes"])}
# Export all 10 editable independent reusable full 3D geometries.
asset_reports=[]
for p in design["models"]:
 model={"asset":{"version":"2.0","generator":"RG Academy procedural Gothic greenery v16"},
        "scene":0,"scenes":[{"nodes":[]}],"nodes":[],"buffers":[{"byteLength":0}],
        "meshes":[],"accessors":[],"bufferViews":[],"materials":[]}
 tmp=bytearray();mm=load_mat(model)
 shape=prototype(p["id"],0,0,0)
 ba={("ASSET","1F",mat):items for mat,items in shape.items()}
 meshes=bake_meshes(model,tmp,mm,ba,TAG+"STANDALONE_"+p["id"]+"__",
  {"asset_id":p["id"],"standalone":True})
 info=save_glb(model,tmp,ASSETS/(p["id"]+".glb"))
 asset_reports.append({**info,"style":p,"meshes":meshes})
# Integrate actual plants, batch by zone/floor/material for fast phone loading.
mat=load_mat(m)
batches=collections.defaultdict(list)
for t in plants:
 x,y,z=t["position"]
 b=prototype(t["asset_id"],x,y,z)
 layer="2F" if y>=3.95 and t["placement_type"]=="floor" else "2F" if y>=4.0 else "1F"
 for material,items in b.items():batches[(t["zone"],layer,material)].extend(items)
new_meshes=bake_meshes(m,buf,mat,batches,TAG,{"installed_plant_copies":True})
assert json.dumps(m["nodes"][:12067],sort_keys=True,ensure_ascii=False)==original_nodes
assert m["scenes"][m.get("scene",0)]["nodes"][:len(old_root)]==old_root
assert new_meshes<=80
final=save_glb(m,buf,OUT/"lahudi-academy_INDOOR-GREENERY-V16.glb")
byzone=dict(collections.Counter(q["zone"] for q in plants))
report={
 "version":"ACADEMY-V16-INTERIOR-GREENERY-PHASE1",
 "source_sha256":OLD_SHA,
 "candidate_sha256":final["sha256"],
 "main_school":final,
 "source_school_nodes_preserved":12067,
 "new_plant_glb_assets":10,
 "plant_instances":len(plants),
 "zone_counts":byzone,
 "classroom_wall_pots":len([x for x in plants if x["room"].startswith(("B-","C-")) and x["placement_type"]=="floor"]),
 "existing_desk_top_pots":len([x for x in plants if x["placement_type"]=="desktop"]),
 "no_furniture_removal":True,
 "no_A01_corridor_rebuild":True,
 "no_library_books_modified":True,
 "no_Bessie_hero_plant_modified":True,
 "original_8_zones_unchanged":True,
 "A_and_F_planted_interior_nodes":0,
 "A_F_design_status":"DESIGNED_NOT_INSTALLED__SOURCE_ORIGINAL_STORY_SCENE_SAFE_PLACEMENT_REQUIRES_SEPARATE_REVIEW",
 "not_all_102_planned_rooms_built":True,
 "unplaced_classroom_walls":missing_floor,
 "rejected_public_candidates":public_rejected,
 "rendering":"NOT_RUN",
 "no_character_collision":"SKIPPED_AS_REQUESTED",
 "source_plant_names_are_design_families_not_novel_canon":True,
 "author_approval":"PENDING"
}
(OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
(OUT/"plant-placements-v16.json").write_text(json.dumps({"version":report["version"],"models":design["models"],
    "instances":plants,"statusA":design["zones"][0],"statusF":design["zones"][5]},ensure_ascii=False,indent=2)+"\n")
(OUT/"asset-index-v16.json").write_text(json.dumps({"version":report["version"],"assets":asset_reports},ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k not in ("unplaced_classroom_walls","rejected_public_candidates")},ensure_ascii=False))
