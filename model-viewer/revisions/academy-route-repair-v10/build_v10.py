#!/usr/bin/env python3
"""《現實遊戲》拉乎迪學院 V10｜P0 衝突改造，保留八區總平面與既有教室

Source: exact official V9 GLB.  Only modify the identified doorway walls,
corridor slabs, and add an independent external 1F->2F switchback stair+skywalk.
C06 (unbuilt 3F/vault) and C07 (animation width) remain OPEN, not falsely closed.
New geometry sits in E->A north gap; doesn't move existing A01 classrooms or F library.
"""
from pathlib import Path
import json,hashlib,struct,sys,math,collections
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
ROOT=Path("model-viewer/staged-output/academy-locked-plan-v9")
R=json.loads((ROOT/"report.json").read_text())
SRC=ROOT/R["file"]
SOURCE_SHA="ada3ae9c9e55f995b4c8c60f63655c01e572561e523e199ef1cdf298c7e668c3"
OUT=Path("candidate-output/academy-route-repair-v10")
NAME="lahudi-academy_LOCKED-PLAN-ACCESS-V10.glb"
V9="RG-GAME-02-PLAN-LOCK-V9__"
V10="RG-GAME-02-P0-FIX-V10__"
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==SOURCE_SHA
m,buf,_=glb.load_glb(SRC)
assert len(m["nodes"])==11775
before={n.get("name"):n for n in m["nodes"]}
ids={n["name"]:i for i,n in enumerate(m["nodes"]) if n.get("name")}
mat={
 "cold":([.30,.37,.43,1],.8,.01),
 "trim":([.54,.52,.47,1],.71,.01),
 "floor":([.24,.29,.34,1],.84,.01),
 "tread":([.34,.36,.35,1],.81,.01),
 "railing":([.17,.21,.26,1],.66,.22),
 "roof":([.07,.105,.16,1],.56,.03)
}
cube={}
for k,(clr,rough,metal) in mat.items():
 mi=len(m["materials"])
 m["materials"].append({"name":"ACADEMY_ROUTE_REPAIR_V10__"+k,
    "doubleSided":True,"pbrMetallicRoughness":{"baseColorFactor":clr,
     "roughnessFactor":rough,"metallicFactor":metal}})
 cube[k]=glb.add_cube_mesh(m,buf,mi)
scene=m["scenes"][m.get("scene",0)]["nodes"]
disabled=[];added=[];changed=[]
def disable(local,why):
 name=V9+local if not local.startswith("RG-GAME-02-") else local
 assert name in ids,("MISSING NODE",name)
 n=m["nodes"][ids[name]]
 assert "mesh" in n,("Already disabled",name)
 prev=n.pop("mesh")
 n.setdefault("extras",{})["v10_disabled_mesh"]=prev
 n["extras"]["v10_reason"]=why
 disabled.append(name)
def slab(xmin,xmax,zmin,zmax,y=.125,th=.13,kind="walk"):
 name=V10+"SLAB_"+kind
 add(name,"floor",((xmin+xmax)/2,y-th/2,(zmin+zmax)/2),
     (xmax-xmin,th,zmax-zmin),"route_floor",kind)
def add(name,key,pos,dim,kind,area,rotation=None):
 assert len(pos)==len(dim)==3 and min(dim)>.01,(name,dim)
 n={"name":name,"mesh":cube[key],"translation":[round(float(v),5) for v in pos],
    "scale":[round(float(v),5) for v in dim],
    "extras":{"kind":kind,"area":area,"revision":"V10_ROUTE_CLEARANCE",
              "construction_evidence":"collision-prevention-registry-v1.json","author_visual_acceptance":False}}
 if rotation:n["rotation"]=rotation
 m["nodes"].append(n);scene.append(len(m["nodes"])-1)
 added.append(name)
def beam(x0,x1,z0,z1,y0,y1,key,tag,kind,area):
 add(V10+tag,key,((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),
     (x1-x0,y1-y0,z1-z0),kind,area)
# -----------------------------------------------------------------------
# C01 D WEST: physically open X=-98, Z=36..40, leave proper construction jamb/lintel.
disable("D_WEST_ENTRY_west_low_wall_30.00_53.00","C01 existing full-height opaque doorway")
disable("D_WEST_ENTRY_west_baypier_2","C01 existing pilaster inside new doorway")
beam(-98.225,-97.775,30,36,0,3.55,"cold","D_WEST_FRAME_LOW_0","structural_wall","D_WEST_ENTRY")
beam(-98.225,-97.775,40,53,0,3.55,"cold","D_WEST_FRAME_LOW_1","structural_wall","D_WEST_ENTRY")
for k,z in (("A",36),("B",40)):
 beam(-98.28,-97.72,z-.23,z+.23,0,3.60,"trim","D_WEST_PORTAL_JAMB_"+k,"door_jamb","D_WEST_ENTRY")
beam(-98.30,-97.70,36,40,3.57,3.95,"trim","D_WEST_PORTAL_LINTEL","door_header","D_WEST_ENTRY")

# C02 C EAST south side: portal X[-34,-29] to match connector (previously [-32,-28]).
for nm in ("C_EAST_south_low_wall_-35.00_-32.00",
 "C_EAST_south_low_wall_-28.00_-14.00",
 "C_EAST_south_portal_0_a","C_EAST_south_portal_0_b",
 "C_EAST_south_portal_0_head"):
 disable(nm,"C02 re-center south opening X=-34..-29")
beam(-35,-34,23.775,24.225,0,3.55,"cold","C_EAST_NEW_SOUTH_LOW_0","structural_wall","C_EAST")
beam(-29,-14,23.775,24.225,0,3.55,"cold","C_EAST_NEW_SOUTH_LOW_1","structural_wall","C_EAST")
for k,x in (("A",-34),("B",-29)):
 beam(x-.23,x+.23,23.72,24.28,0,3.60,"trim","C_EAST_NEW_SOUTH_JAMB_"+k,"door_jamb","C_EAST")
beam(-34,-29,23.70,24.30,3.57,3.95,"trim","C_EAST_NEW_SOUTH_LINTEL","door_header","C_EAST")

# C03 E_WEST north door x[-107,-103] aligned to G south door and 4m corridor.
for nm in ("E_WEST_ACADEMY_north_low_wall_-118.00_-108.00",
 "E_WEST_ACADEMY_north_low_wall_-104.00_-94.00",
 "E_WEST_ACADEMY_north_portal_0_a","E_WEST_ACADEMY_north_portal_0_b",
 "E_WEST_ACADEMY_north_portal_0_head"):
 disable(nm,"C03 axis realignment without moving locked building footprint")
beam(-118,-107,-112.225,-111.775,0,3.55,"cold","E_WEST_NORTH_LOW_A","structural_wall","E_WEST_ACADEMY")
beam(-103,-94,-112.225,-111.775,0,3.55,"cold","E_WEST_NORTH_LOW_B","structural_wall","E_WEST_ACADEMY")
for k,x in (("A",-107),("B",-103)):
 beam(x-.23,x+.23,-112.30,-111.70,0,3.60,"trim","E_WEST_NORTH_JAMB_"+k,"door_jamb","E_WEST_ACADEMY")
beam(-107,-103,-112.29,-111.71,3.57,3.95,"trim","E_WEST_NORTH_LINTEL","door_header","E_WEST_ACADEMY")

# C04: keep historic A_MAIN north and south portal geometry, narrow only ground route SLABS.
narrow={
 "LINK_MAIN_TO_E_SOUTH":(-85.45,-82.55,-82,-67.85),
 "LINK_MAIN_TO_ENTRANCE":(-71.30,-68.90,26.14,40)}
for original,span in narrow.items():
 disable(original,"C04 nominal 4m slab narrower than actual historic portal")
 slab(*span,kind=original.removeprefix("LINK_")+"__neckdown")
# Do not claim main historic door has widened; it remains ~3.2m N / ~2.66m S.
# The 1F corridor model is marked 1F, and distinct from the protected 2F RB2 passage.
# C05 North covered main corridor roof lifted to make 2F exterior skywalk possible.
disable("LINK_MAIN_TO_E_SOUTH_roof","C05 upper skywalk needs clearance through 1F arcade roof")
roof_name=V10+"LINK_MAIN_TO_E_SOUTH_HIGH_ROOF"
beam(-86.20,-81.80,-82.2,-67.65,7.55,7.85,"roof","NORTH_LINK_HIGH_ROOF","covered_arcade_roof","NORTH_LINK")
for nm in list(ids):
 if nm.startswith(V9+"LINK_MAIN_TO_E_SOUTH_pier_"):
  old=m["nodes"][ids[nm]]
  y=old.get("translation",[0,0,0])[1]
  h=old.get("scale",[1,1,1])[1]
  assert abs(y-2.55)<.01 and abs(h-5.1)<.01
  # lift columns while keeping edge X/Z, do not move footprint
  old["translation"][1]=3.85
  old["scale"][1]=7.70
  old.setdefault("extras",{})["v10_modified_pier_height_m"]=7.7
  changed.append(nm)

# C05 external switchback staircase beside the link, outside preserved A_MAIN footprint:
# horizontal footprint X[-94,-88] Z[-80.0,-72.0] in north gap.
# 26 risers (2x13) × 0.149m =3.874m, from first-floor y=0.125 to y=3.999.
riser=(4.0-.126)/26
assert abs(riser-.149)<.0001
for flight in (0,1):
 xc=-92.40 if flight==0 else -89.95
 for i in range(13):
  zc=-78.85+(i+.5)*.35 if flight==0 else -74.30-(i+.5)*.35
  # top surface at landing rises one riser per step
  top=.126+riser*(i+1 if flight==0 else i+14)
  add(V10+f"STAIR_{flight}_{i:02d}","tread",(xc,top-.07,zc),
      (1.80,.14,.35),"stair_tread","NORTH_STAIR")
# halfway turnaround slab connecting two flights
beam(-93.55,-88.80,-74.60,-72.45,
     .126+13*riser-.14,.126+13*riser,
     "floor","STAIR_HALF_LANDING","stair_landing","NORTH_STAIR")
# ground access from main ground corridor to first flight
slab(-92.5,-84.0,-79.85,-78.25,kind="STAIR_GROUND_APPROACH")
# upper landing and one elevated Z bridge, then X bridge into existing north door.
beam(-90.95,-88.95,-79.9,-78.3,
     3.84,4.0,"floor","STAIR_UPPER_LANDING","skywalk_landing","NORTH_STAIR")
beam(-90.75,-88.55,-79.15,-68.8,3.84,4.0,"floor",
     "UPPER_SKYWALK_Z","skywalk_floor","NORTH_STAIR")
beam(-90.75,-83.85,-69.8,-67.85,3.84,4.0,"floor",
     "UPPER_SKYWALK_X","skywalk_floor","NORTH_STAIR")
# Simple safety barriers for exposed flights and upper elevated walk.
for x,side in ((-91.36,"first"),(-90.99,"second")):
 pass
for x,tag in ((-90.68,"left"),(-88.35,"right")):
 beam(x-.07,x+.07,-79.2,-70.25,4.08,5.14,"railing",
      "UPPER_SKYWALK_RAIL_"+tag,"guardrail","NORTH_STAIR")
# Rail on landing outer edge (not across the path to the original north door)
beam(-90.30,-88.5,-79.96,-79.84,4.05,5.07,
     "railing","UPPER_LANDING_GUARD","guardrail","NORTH_STAIR")
# Do not manufacture a 3rd-story slab across A01 vaulted upper corridor.
# C06/C07 retain OPEN state for animation measurements.

m["buffers"][0]["byteLength"]=len(buf)
js=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode("utf-8")
js+=b" "*((-len(js))%4)
buf+=b"\x00"*((-len(buf))%4)
data=(struct.pack("<4sII",glb.MAGIC,2,12+8+len(js)+8+len(buf))+
      struct.pack("<II",len(js),glb.CHUNK_JSON)+js+
      struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf))
OUT.mkdir(parents=True,exist_ok=True)
f=OUT/NAME;f.write_bytes(data)
parsed,binary,_=glb.load_glb(f)
assert len(parsed["nodes"])==len(m["nodes"]) and len(binary)==len(buf)
assert len(disabled)==(2+5+5+2+1)
assert len(changed)>=8
sha=hashlib.sha256(data).hexdigest()
report={
 "version":"ACADEMY-LOCKED-PLAN-COLLISION-REPAIR-V10","file":NAME,
 "sha256":sha,"bytes":len(data),"source_sha256":SOURCE_SHA,
 "original_nodes":11775,"result_nodes":len(m["nodes"]),
 "nodes_added":len(added),"disabled_old_nodes":disabled,
 "modified_old_columns":changed,
 "zone_footprints_locked":True,
 "fixed_routes":{
   "C-01":{"west_D_opening_x":-98,"z":[36,40],"status":"REPLACED_SOLID_WALL_WITH_TRUE_OPENING"},
   "C-02":{"C_east_south_door_x":[-34,-29],"status":"ALIGNED_TO_ROUTE"},
   "C-03":{"E_west_north_door_x":[-107,-103],"status":"ALIGNED_TO_ROUTE_AND_G_DOOR"},
   "C-04":{"north_effective_slab_x":[-85.45,-82.55],"south_effective_slab_x":[-71.3,-68.9],
           "status":"PRESERVED_HISTORIC_PORTAL__NARROWED_WALKWAY"},
   "C-05":{"stair_riser_m":riser,"steps":26,
           "lower_level_y_m":.126,"upper_level_y_m":4.0,
           "switchback_region_x":[-93.55,-88.8],"switchback_region_z":[-79.9,-72.45],
           "upper_skywalk_slab_y_m":4.0,
           "old_covered_link_roof_raised_bottom_y_m":7.55,
           "status":"EXTERIOR_STAIR_AND_TWO_UPPER_SKYWALKS_MODELED__COLLISION_QA_PENDING"}
 },
 "unresolved_animation_requirements":["C-06 proposed upper A01 vault vs 3F slab",
     "C-07 source corridor X span4.50 vs animation proposed net width5.20"],
 "design_scope":"fictional animation set, not a code-conformant staircase design",
 "character_continuous_collision":"NOT_YET_TESTED",
 "model_visual_qa":"NOT_RUN",
 "author_final_acceptance":"PENDING"
}
(OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k not in ("disabled_old_nodes","modified_old_columns")},ensure_ascii=False))
