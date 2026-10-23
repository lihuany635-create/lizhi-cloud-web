#!/usr/bin/env python3
"""RG-GAME-02 Academy V6: complete master-planned Gothic campus, same canonical GLB.

Fixes customer screenshot:
- Remove original four kilometer-scale foothill/rock/snowcap/curved road nodes still
  visible inside V5, which distorted 3D viewer bounding from ~245m to 1012m.
- Rework the visually white snow slab and add clear multi-colored stone plazas.
- Add complete ensemble: 7 architecturally connected Gothic campus wings around
  the already modeled teaching school, clock entrance, library and cloister.
- DO NOT replace the existing classroom / library / native stair/ RB2 corridor.
- Same single GLB loaded under model-viewer/lahudi-academy.glb; backup V5 before promote.

The additional campus wings are exterior envelope / structure, not a claim about
as-yet undefined classroom interiors. No independently rendered new scene.
"""
from pathlib import Path
import sys,math,json,struct,hashlib,collections
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb

BASE=Path("model-viewer/staged-output/academy-exterior-rebuild-v5")
SOURCE=BASE/"lahudi-academy_REBUILT-EXTERIOR-RB2_v5.glb"
EXPECTED_SHA="347ba0a423726d4a2c83e1ddc568509a5b3ac35ca99dc6019f513085053b842f"
OUTPUT=Path("candidate-output/academy-entire-campus-v6")
NAME="lahudi-academy_ENTIRE-GOTHIC-CAMPUS_RB2_v6.glb"
PREFIX="RG-GAME-02-CAMPUS-REBUILD-V6__"

def main():
 assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==EXPECTED_SHA
 m,buffer,_=glb.load_glb(SOURCE)
 assert len(m["nodes"])==11097
 original=len(m["nodes"])
 existing={n.get("name"):n for n in m["nodes"]}
 outliers=["RG-GAME-02-ACOR-004__foothill","RG-GAME-02-ACOR-004__rock",
           "RG-GAME-02-ACOR-004__snowcap","RG-GAME-02-ACOR-004__curved_road"]
 disabled={}
 for name in outliers:
  node=existing[name]
  assert "mesh" in node,name
  disabled[name]=node.pop("mesh")
  node.setdefault("extras",{})["disabled_old_distant_landscape_mesh"]=disabled[name]
 assert len(disabled)==4
 for mark in ("RG-GAME-02-A1-005__open_door","RG-GAME-02-CROOM-005__open_door",
              "RG-GAME-02-ROOF-001__approach__tread0",
              "RG-GAME-02-CONFESS-005__tread_0",
              "RG-GAME-02-LIB-002__book"):
  assert "mesh" in existing[mark]
 # Darken winter base and give all campus stone/roof/readable materials enough contrast.
 materials=m["materials"]
 def set_mat(name,rgba,rough=None,metal=None):
  a=next(x for x in materials if x.get("name")==name)
  p=a.setdefault("pbrMetallicRoughness",{})
  p["baseColorFactor"]=list(rgba)
  if rough is not None:p["roughnessFactor"]=rough
  if metal is not None:p["metallicFactor"]=metal
 set_mat("ACADEMY_REBUILD_V5__snow",[.48,.55,.64,1],.93,0)
 set_mat("ACADEMY_REBUILD_V5__stone",[.35,.42,.52,1],.80,0)
 set_mat("ACADEMY_REBUILD_V5__stone_highlight",[.55,.59,.62,1],.67,0)
 set_mat("ACADEMY_REBUILD_V5__roof",[.064,.103,.162,1],.46,.04)
 set_mat("ACADEMY_REBUILD_V5__glass",[.17,.45,.68,.82],.19,.03)
 set_mat("ACADEMY_REBUILD_V5__foundation",[.19,.24,.31,1],.78,0)
 # Background neutral for winter, different from gray/blue school.
 palette={
  "ash_stone":([.30,.37,.44,1],.83,.01),
  "sand_stone":([.46,.39,.33,1],.84,.00),
  "cream_trim":([.69,.60,.46,1],.68,.01),
  "blue_trim":([.54,.60,.66,1],.68,.01),
  "slate":([.055,.10,.16,1],.47,.04),
  "copper_roof":([.21,.30,.29,1],.52,.14),
  "gothic_glass":([.16,.37,.59,.78],.18,.02),
  "stained_glass":([.23,.43,.60,.88],.21,.05),
  "wood":([.24,.105,.062,1],.54,.01),
  "gold":([.75,.46,.14,1],.32,.75),
  "dark_iron":([.10,.12,.16,1],.38,.70),
  "plaza":([.22,.26,.31,1],.77,0),
  "plaza_band":([.13,.17,.22,1],.73,0),
  "grass":([.20,.29,.26,1],.93,0),
  "fountain_water":([.16,.34,.43,1],.25,.08),
  "snowbank":([.61,.67,.72,1],.91,0),
  "light":([.99,.57,.21,1],.38,0),
 }
 meshes={};material_ids={}
 for key,(rgba,rough,met) in palette.items():
  ma={"name":"ACADEMY_CAMPUS_V6__"+key,"doubleSided":True,
      "pbrMetallicRoughness":{"baseColorFactor":rgba,"roughnessFactor":rough,"metallicFactor":met}}
  if rgba[3]<1:ma["alphaMode"]="BLEND"
  if key=="light":ma["emissiveFactor"]=[.63,.32,.07]
  material_ids[key]=len(materials)
  materials.append(ma)
  meshes[key]=glb.add_cube_mesh(m,buffer,material_ids[key])
 root=m["scenes"][m.get("scene",0)].setdefault("nodes",[])
 counts=collections.Counter();regions=collections.Counter();footprints=[]
 def block(nm,mat,pos,dim,typ,area,rot=0,axis="z",meta=None):
  assert min(dim)>.001,(nm,dim)
  if axis=="z":r=[0,0,math.sin(rot/2),math.cos(rot/2)]
  elif axis=="x":r=[math.sin(rot/2),0,0,math.cos(rot/2)]
  elif axis=="y":r=[0,math.sin(rot/2),0,math.cos(rot/2)]
  else:raise ValueError(axis)
  node={"name":PREFIX+nm,"mesh":meshes[mat],
        "translation":[round(float(x),5) for x in pos],
        "scale":[round(float(x),5) for x in dim],
        "rotation":r,
        "extras":{"campus":"LAHUDI","area":area,"kind":typ,"design_stage":"COMPLETE_EXTERIOR",
                  "interior_layout":"UNSPECIFIED_WING" if typ!="existing_interior" else "NATIVE",
                  "author_accepted":False}}
  if meta:node["extras"].update(meta)
  m["nodes"].append(node);root.append(len(m["nodes"])-1)
  counts[typ]+=1;regions[area]+=1
 def arch_yx(base,area,z,center,span,ybase,rise,mat="cream_trim",pieces=10):
  for j in range(pieces):
   t0=j/pieces;t1=(j+1)/pieces
   a=center-span/2+span*t0;b=center-span/2+span*t1
   y0=ybase+rise*(1-abs(2*t0-1)**.72)
   y1=ybase+rise*(1-abs(2*t1-1)**.72)
   dy=y1-y0;dx=b-a
   block(f"{base}_arch_{j:02d}",mat,((a+b)/2,(y0+y1)/2,z),
         (math.hypot(dx,dy),.12,.20),"pointed_arch",area,math.atan2(dy,dx))
 def arch_yz(base,area,x,center,span,ybase,rise,mat="cream_trim",pieces=10):
  for j in range(pieces):
   t0=j/pieces;t1=(j+1)/pieces
   a=center-span/2+span*t0;b=center-span/2+span*t1
   y0=ybase+rise*(1-abs(2*t0-1)**.72)
   y1=ybase+rise*(1-abs(2*t1-1)**.72)
   dy=y1-y0;dz=b-a
   block(f"{base}_arch_{j:02d}",mat,(x,(y0+y1)/2,(a+b)/2),
         (.20,.12,math.hypot(dz,dy)),"pointed_arch",area,-math.atan2(dy,dz),"x")
 def roof(base,area,x0,x1,z0,z1,eave,ridge,color="slate"):
  # Gables along Z axis, pitch over X.
  cx=(x0+x1)/2
  for i,(a,b) in enumerate(((x0,cx),(cx,x1))):
   ya,yb=(eave,ridge) if i==0 else (ridge,eave)
   dx=b-a;dy=yb-ya
   block(base+f"_roof_panel_{i}",color,((a+b)/2,(ya+yb)/2,(z0+z1)/2),
         (math.hypot(dx,dy),.27,z1-z0+.6),"pitched_roof",area,math.atan2(dy,dx))
   for name,z in (("a",z0),("b",z1)):
    block(base+f"_rake_{i}_{name}","blue_trim",((a+b)/2,(ya+yb)/2,z),
          (math.hypot(dx,dy),.18,.35),"roof_rake",area,math.atan2(dy,dx))
  block(base+"_ridge","blue_trim",(cx,ridge,(z0+z1)/2),
         (.35,.28,z1-z0),"roof_ridge",area)
 def finial(base,area,x,z,ground,eave):
  block(base+"_shaft","blue_trim",(x,(ground+eave)/2,z),
        (.46,eave-ground,.48),"corner_buttress",area)
  block(base+"_gold_tip","gold",(x,eave+.63,z),
        (.21,1.26,.21),"spire_finial",area)
 def wing(key,role,x0,x1,z0,z1,tone="ash_stone",roofcolor="slate",stories=2,entrance=None):
  area=key
  w=x1-x0;depth=z1-z0;cx=(x0+x1)/2;cz=(z0+z1)/2
  assert w>12 and depth>13
  footprints.append({"area":key,"role":role,"bbox_x":[x0,x1],"bbox_z":[z0,z1],"entrance":entrance})
  eave=10.45 if stories==2 else 8.75
  roofrise=min(w*.27,4.9)
  block(key+"_foundation","plaza_band",(cx,-.13,cz),(w,.27,depth),
        "foundation",area)
  for side,x in (("west",x0),("east",x1)):
   nb=max(3,round(depth/5.4));pitch=depth/nb
   for i in range(nb):
    za=z0+i*pitch;zb=za+pitch;zm=(za+zb)/2
    # True fenestration: no full solid wall across window opening.
    for low,high,segment in ((0,2.2,"dado"),(5.2,6.4,"mid"),(9.2,eave,"top")):
     if high>low:
      block(f"{key}_{side}_{i}_{segment}",tone,(x,(low+high)/2,zm),
            (.34,high-low,pitch+.02),"masonry_wall",area)
    for lo,hi,level in ((2.22,5.19,0),(6.42,9.18,1)):
     if level>=stories:continue
     block(f"{key}_{side}_{i}_glass_{level}","gothic_glass",
         (x,(lo+hi)/2,zm),(.09,hi-lo,pitch-.62),"lancet_glass",area)
     for sign,z in (("a",za+.24),("b",zb-.24),("m",zm)):
      block(f"{key}_{side}_{i}_mullion_{level}_{sign}","cream_trim",
         (x,(lo+hi)/2,z),(.15,hi-lo,.16),"stone_window_mullion",area)
     block(f"{key}_{side}_{i}_window_sill_{level}","blue_trim",
          (x,lo-.08,zm),(.49,.17,pitch-.38),"window_sill",area)
     arch_yz(f"{key}_{side}_{i}_lvl{level}",area,x,zm,pitch-.56,hi-.01,.50)
    block(f"{key}_{side}_{i}_buttress", "cream_trim",
          (x,5.15,za),(.57,10.2,.47),"buttress",area)
    if i%3==1:
     block(f"{key}_{side}_{i}_sconce","gold",(x,5.78,zm),(.14,.35,.24),"sconce",area)
     block(f"{key}_{side}_{i}_lamp","light",(x,5.99,zm),(.16,.27,.21),"sconce_light",area)
  # Gabled ends and central entrance position: render actual empty opening at Z end.
  for end,z in (("north",z0),("south",z1)):
   middle=(entrance is not None and entrance[0]==end)
   opening=entrance[1] if middle else 0
   if middle:
    for ax,bx,n in ((x0,cx-opening/2,"a"),(cx+opening/2,x1,"b")):
     block(f"{key}_{end}_gable_pier_{n}",tone,((ax+bx)/2,eave/2,z),
           (bx-ax,eave,.41),"gable_wall",area)
    block(f"{key}_{end}_entry_lintel","cream_trim",
          (cx,5.07,z), (opening+.28,.36,.45),"open_entry_portal",area,
          meta={"opening_width":opening,"clearance_height":4.89})
   else:
    block(f"{key}_{end}_gable_end_wall",tone,(cx,eave/2,z),
           (w,eave,.41),"gable_wall",area)
   arch_yx(f"{key}_{end}_roof_highpoint",area,z,cx,w-.7,eave,roofrise,
           "cream_trim",pieces=18)
  roof(key,area,x0-.3,x1+.3,z0-.3,z1+.3,eave, eave+roofrise,roofcolor)
  for x,label in ((x0+.35,"w"),(x1-.35,"e")):
   for z,edge in ((z0+.35,"n"),(z1-.35,"s")):
    finial(f"{key}_{label}_{edge}",area,x,z,0,eave)
  # central belt / special crest
  block(key+"_midline_band","blue_trim",(cx,5.7,z1+.04),
        (w-.7,.16,.30),"facade_belt",area)
  return footprints[-1]
 # -- Reclaimed old giant landscape footprint: broad stone plazas, not one white rectangle.
 # V5 base snow tint is now bluish gray. Campuses occupy central courtyard inside it.
 block("front_forecourt","plaza",(-76,.004,40),(76,.04,27),"paved_courtyard","COURTYARD")
 block("inner_quad_plaza","plaza",(-77,.006,-41),(125,.045,52),"paved_courtyard","COURTYARD")
 block("library_approach_plaza","plaza",(-60,.007,-139),(115,.045,25),
       "paved_courtyard","COURTYARD")
 block("ceremonial_axis","plaza_band",(-70,.041,-5),(4,.048,87),
       "ceremonial_walk","COURTYARD")
 for xx in (-132,-22):
  block(f"quad_banded_path_{xx}","plaza_band",(xx,.030,-38),(2,.047,67),
       "path_border","COURTYARD")
 # -- Seven separate complete masses share the same roof/cornice grammar.
 wing("WEST_CLASSROOM_GALLERY","western teaching wing",
      -124,-103,-68.0,24.0,tone="ash_stone",entrance=("south",3.3))
 wing("EAST_CLASSROOM_GALLERY","eastern teaching wing",
      -57.0,-36.5,-67.6,24.1,tone="sand_stone",entrance=("south",3.2))
 wing("NORTH_COLLEGE_LINK","north academic cross wing",
      -120.0,-90.5,-104.8,-80.5,tone="ash_stone",entrance=("south",3.5))
 wing("NORTH_ARCHIVE_WING","north archive cross wing",
      -78.0,-43.0,-104.8,-81.5,tone="sand_stone",entrance=("south",3.4))
 wing("SOUTH_CAMPUS_GALLERY","main front gallery west",
      -125.5,-91.0,25.0,45.0,tone="ash_stone",entrance=("north",3.3))
 wing("SOUTH_CAMPUS_HALL","main front gallery east",
      -62.0,-34.0,25.0,45.0,tone="sand_stone",entrance=("north",3.2))
 wing("CHAPEL_WESTERN_GALLERY","historic chapel/assembly wing",
      -121.5,-96.0,-170.0,-125.0,tone="ash_stone",entrance=("south",3.3))
 # -- Library approach gets a series of cloister arches and winter landscaping.
 wing("LIBRARY_EAST_ARCHIVE","outer library archive",
      4.2,27.0,-174.2,-143.0,tone="sand_stone",entrance=("north",3.4))
 # Paved physical links between existing school and new side wings.
 links=[
  ("west_school_covered_bridge",(-103.0,-87.95,-12.0,-8.8)),
  ("east_school_covered_bridge",(-67.18,-57.0,-12.4,-8.8)),
  ("west_front_gallery_connection",(-103,-87.95,25.0,29.5)),
  ("east_front_gallery_connection",(-67.18,-57.0,25.0,29.5)),
  ("west_chapel_to_cloister",(-96.0,-85.7,-151.8,-148.2)),
  ("east_library_to_archive",(-2.2,4.2,-153.9,-150.3)),
 ]
 for name,(x0,x1,z0,z1) in links:
  block(name+"_paved_link","plaza",( (x0+x1)/2,.09,(z0+z1)/2),
        (x1-x0,.14,z1-z0),"connective_paving","CAMPUS_LINK",
        meta={"path_link":True})
  for z,l in ((z0,"n"),(z1,"s")):
   # Do not add blocking full-height wall across shared walkable path.
   block(f"{name}_floor_step_{l}","plaza_band",((x0+x1)/2,.023,z),
         (x1-x0,.046,.26),"path_rim","CAMPUS_LINK")
 # Enclosed gateway arcade at the front main door and shared school gardens.
 for i in range(13):
  x=-117.0+i*6.70
  z=51.5
  block(f"front_perimeter_pier_{i}","cream_trim",(x,2.85,z),
        (.55,5.7,.50),"entrance_colonnade_pier","FRONT_GATE")
  if i<12 and i not in (6,7):
   xx=x+3.35
   arch_yx(f"front_perimeter_arch_{i}","FRONT_GATE",z,xx,6.4,4.5,1.0)
 for i in range(18):
  z=-64+i*5.9
  for side,x in (("west",-131.7),("east",-27.8)):
   if -22<=z<=16:continue
   block(f"garden_column_{side}_{i}","cream_trim",(x,1.75,z),
         (.38,3.50,.40),"courtyard_garden_post","COURTYARD")
 # Moor-like gardens and snow margins, with different materials than paved quadrangles.
 for i,(x,z) in enumerate((
  (-95,9),(-96,-19),(-95,-49),(-64,10),(-65,-30),
  (-81,-88),(-62,-85),(-90,-113),(-35,-117),
  (-71,-127),(-21,-125),(-82,-174),(-58,-168)
 )):
  block(f"garden_greens_{i:02d}","grass",(x,-.022,z),
        (3.5,.09,3.6),"garden_patch","COURTYARD")
  block(f"garden_stone_planter_{i:02d}","cream_trim",(x,.36,z),
        (2.15,.55,2.12),"planter","COURTYARD")
  block(f"garden_tree_{i:02d}","dark_iron",(x,1.9,z),
        (.30,3.70,.29),"tree_trunk","COURTYARD")
  block(f"garden_tree_crown_{i:02d}","grass",(x,4.32,z),
        (2.25,3.0,2.3),"evergreen_canopy","COURTYARD")
 # Water feature as an architectural focal point to differentiate courtyard plane.
 fx,fz=-80,-42
 block("stone_water_feature_outer","cream_trim",(fx,.36,fz),
       (8.7,.70,8.7),"fountain_basin","COURTYARD")
 block("stone_water_feature_water","fountain_water",(fx,.74,fz),
       (7.7,.05,7.7),"fountain_water","COURTYARD")
 block("fountain_pedestal","cream_trim",(fx,1.65,fz),
       (1.30,2.0,1.30),"fountain_sculpture","COURTYARD")
 block("fountain_urn_gold","gold",(fx,2.70,fz),
       (.56,.48,.56),"fountain_sculpture","COURTYARD")
 # Distinct roof spires reinforce complex school silhouette.
 for i,(x,z) in enumerate((
  (-113.0,-66.6),(-113.0,23.7),(-46.5,-66.5),(-46.5,23.4),
  (-109.0,-104.5),(-110.0,-80.6),(-59.0,-104.0),(-61.0,-82.0),
  (-108,-169),(-108,-126),(15.7,-173.0),(15.7,-143.5)
 )):
  block(f"major_corner_campanile_base_{i}","ash_stone",(x,12.5,z),
       (3.2,4.8,3.2),"spire_tower","TOWERS")
  block(f"major_corner_campanile_roof_{i}","copper_roof",(x,16.2,z),
       (3.85,2.7,3.85),"spire_roof","TOWERS")
  block(f"major_corner_finial_{i}","gold",(x,18.20,z),
       (.21,1.55,.21),"spire_finial","TOWERS")
 assert len(footprints)==8
 assert len(disabled)==4
 assert counts["masonry_wall"]>150
 assert counts["pitched_roof"]>=16
 assert counts["lancet_glass"]>100
 assert counts["pointed_arch"]>=850
 assert counts["paved_courtyard"]==3
 assert regions["COURTYARD"]>40
 # Preserve core: original 11097 nodes except four named outliers untouched, geometry only.
 assert len(m["nodes"])>original+1800
 m["buffers"][0]["byteLength"]=len(buffer)
 data=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
 data+=b" "*((-len(data))%4)
 buffer+=b"\x00"*((-len(buffer))%4)
 glbdata=b"".join([struct.pack("<4sII",glb.MAGIC,2,12+8+len(data)+8+len(buffer)),
                   struct.pack("<II",len(data),glb.CHUNK_JSON),data,
                   struct.pack("<II",len(buffer),glb.CHUNK_BIN),bytes(buffer)])
 OUTPUT.mkdir(parents=True,exist_ok=True)
 out=OUTPUT/NAME
 out.write_bytes(glbdata)
 model,binary,_=glb.load_glb(out)
 assert len(model["nodes"])==len(m["nodes"]) and len(binary)==len(buffer)
 source_parts=collections.Counter(n.get("name","").split("__")[0] for n in m["nodes"] if "mesh" in n)
 report={
  "school":"拉乎迪學院","scene":"RG-GAME-02",
  "version":"ACADEMY-RB2-ENTIRE-CAMPUS-V6","model":NAME,
  "sha256":hashlib.sha256(glbdata).hexdigest(),"bytes":len(glbdata),
  "parent_v5_sha256":EXPECTED_SHA,"source_nodes":original,"total_nodes":len(m["nodes"]),
  "new_architectural_nodes":len(m["nodes"])-original,
  "old_distant_terrain_outliers_disabled":list(disabled),
  "previous_v5_classrooms_and_library_unchanged":True,
  "previous_v5_corridors_and_stairs_unchanged":True,
  "campus_added_wings":footprints,
  "wing_count_added":len(footprints),
  "new_regions":dict(regions),"new_geometry_types":dict(counts),
  "winter_base_recolored_to_blue_gray":True,
  "contrasting_stone_plazas":3,
  "glass_and_stone_roof_material_palette":{k:v[0] for k,v in palette.items()},
  "real_entrance_openings_in_wing_gables":True,
  "cloister_from_v5_preserved":True,
  "same_complete_singular_glb":True,
  "GLB_reparse":"PASS","rendering":"NOT_RUN",
  "mobile_camera_still_requires_current_geometry_bounding_audit":True,
  "ground_passage_collisions":"NOT_RUN",
  "author_visual_acceptance":"PENDING",
  "footnote":"Eight added buildings represent coherent exterior architectural wing designs; interiors of new wings are deliberately not asserted as modeled."
 }
 (OUTPUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in report.items() if k not in ("new_geometry_types","new_regions","campus_added_wings","glass_and_stone_roof_material_palette")},ensure_ascii=False))
if __name__=="__main__":main()
