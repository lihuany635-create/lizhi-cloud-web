#!/usr/bin/env python3
"""V14 anime-art-directed Lahudi Academy gate. The source is the V13 official GLB.

Creates a real glTF/GLB candidate (not a painted image). Existing V12 architecture,
its original 11,983 nodes, furniture and footprints stay bitwise-identical in
glTF JSON. Old V13 gate batches are retained as dormant rollback source but
removed from scene roots. One V14 set takes their place.
"""
from pathlib import Path
from collections import defaultdict,Counter
import math,sys,json,struct,hashlib
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
SOURCE=Path("model-viewer/lahudi-academy.glb")
SOURCE_SHA="580e8b4bc0a1a9c1bb070074de539bf225286f12219460d6af3365cc3060c9d2"
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SOURCE_SHA,"V13 official gate changed; stop, do not overwrite"
m,buf,_=glb.load_glb(SOURCE)
assert len(m["nodes"])==12011
master=json.loads(Path("model-viewer/revisions/academy-locked-plan-v9/masterplan-v1.json").read_text())
assert len(master["zones"])==8
source_content=json.dumps(m["nodes"][:11983],sort_keys=True,ensure_ascii=False)
original_root=[i for i in m["scenes"][m.get("scene",0)]["nodes"] if i<11983]
gate_old=[i for i in m["scenes"][m.get("scene",0)]["nodes"] if m["nodes"][i].get("name","").startswith("RG-GAME-02-GATE-COMPLEX-V13__")]
assert len(gate_old)==28
scene=m["scenes"][m.get("scene",0)]
scene["nodes"]=[i for i in scene["nodes"] if i not in gate_old]
assert len(original_root)==len([i for i in scene["nodes"] if i<11983])
inputpath=Path(".academy-stage/model-viewer/staged-output/academy-gate-v13/gate-pieces.json")
items=json.loads(inputpath.read_text())["items"]
assert len(items)==408
TAG="RG-GAME-02-GATE-ANIME-V14__"
# Restrained winter painted-animation palette. Low metallic/low gloss, warm
# lamp contrast. Does not alter any existing V12 building material.
palette={
 "stone":([.50,.54,.565,1],.90,.0),
 "stone_light":([.68,.69,.675,1],.86,.0),
 "stone_trim":([.35,.41,.46,1],.89,.0),
 "iron":([.085,.115,.15,1],.78,.10),
 "iron_light":([.16,.205,.24,1],.76,.10),
 "brass":([.58,.45,.26,1],.68,.20),
 "oak":([.22,.15,.115,1],.81,.01),
 "roof":([.11,.17,.23,1],.86,.01),
 "pavement":([.37,.40,.44,1],.85,.01),
 "pavement_alt":([.29,.33,.38,1],.84,.01),
 "snow":([.77,.83,.87,1],.96,.0),
 "plant":([.18,.26,.22,1],.91,.0),
 "lamp":([1.,.72,.39,1],.34,.0),
 "glass":([.23,.35,.45,.77],.35,.05),
 "ink":([.13,.16,.20,1],.91,.0),
 "tree_bark":([.245,.255,.27,1],.95,.0)
}
mats={}
for name,(color,rough,metal) in palette.items():
 idx=len(m["materials"])
 obj={"name":TAG+"MAT_"+name,"pbrMetallicRoughness":{
  "baseColorFactor":color,"roughnessFactor":rough,"metallicFactor":metal},
  "doubleSided":True}
 if color[3]<1:obj["alphaMode"]="BLEND"
 if name=="lamp":obj["emissiveFactor"]=[.82,.44,.15]
 m["materials"].append(obj);mats[name]=idx
# Type specific 2D silhouette/height/ornament simplification, preserving locked
# physical gate footprint, camera axes, original entry/exit corridors.
removed=Counter(); retained=Counter(); replacements=[]
def adapt(item):
 p=dict(item);p["center"]=list(p["center"]);p["dimensions"]=list(p["dimensions"])
 name=p["name"];k=p["kind"];mat=p["material"]
 def setbaseheight(height):
  old=p["dimensions"][1]
  p["center"][1]-=(old-height)*.5
  p["dimensions"][1]=height
 if k in ("perimeter_iron_grille","perimeter_spike","wrought_iron_finial","wicket_finial"):
  # Remove high-frequency elements that shimmer in 1080p anime background
  try:i=int(name.rsplit("_",1)[1])
  except ValueError:i=0
  if i%2==1 or (k=="perimeter_spike" and (i//2)%2==1):
   removed[k]+=1;return None
 if k in ("stone_path_joint","pier_stringcourse","boundary_column","boundary_cap"):
  if "JOINT" in name:
   try:i=int(name.rsplit("_",1)[1])
   except ValueError:i=0
   if i%2==1:removed[k]+=1;return None
 if k in ("gate_hanging_banner","gate_banner_trim"):
  removed[k]+=1;return None
 if k in ("perimeter_plinth",):
  setbaseheight(.74)
 elif k=="perimeter_iron_grille":
  p["center"][1]=1.63;p["dimensions"][1]=1.28
 elif k=="perimeter_spike":
  p["center"][1]=2.36
 elif k=="fence_rail":
  p["center"][1]=min(p["center"][1],2.27)
 elif k=="boundary_column":
  setbaseheight(2.46)
 elif k=="boundary_cap":
  p["center"][1]=2.52
 elif k=="portal_pier":
  setbaseheight(8.2);p["dimensions"][0]*=1.04
 elif k=="spire_tip":
  p["center"][1]=8.42;p["dimensions"][1]=.67
 elif k=="capital":
  p["center"][1]=8.01
 elif k=="pier_stringcourse":
  p["dimensions"][1]=.15;p["dimensions"][0]*=.96
 elif k=="pointed_gate_arch":
  # Slim, graphic stone-line arch, nonphotorealistic, remains above open portal
  p["dimensions"][1]=.49;p["dimensions"][2]=.56
 elif k=="keystone":
  p["dimensions"][0]*=.75;p["dimensions"][2]*=.75
 elif k=="open_gate_bars":
  # Screen readability: thinner bars, foreground silhouette matters more
  p["dimensions"][0]*=.78;p["dimensions"][2]*=.78
 elif k=="open_gate_leaf":
  p["dimensions"][1]*=.90
 elif k=="wicket_pier":
  setbaseheight(4.35)
 elif k=="wicket_cap":
  p["center"][1]=4.37
 elif k=="gate_lantern":
  p["center"][1]=4.85
 elif k=="wicket_ogive":
  p["center"][1]-=.60
 elif k=="gatehouse_wall":
  setbaseheight(p["dimensions"][1]*.78)
 elif k=="gatehouse_floor":
  pass
 elif p["group"]=="GATEHOUSE" and k not in ("gatehouse_floor","guard_worktop","guard_worktop_leg"):
  p["center"][1]*=.79
  if k in ("gatehouse_window_frame","gatehouse_glazing"):
   p["dimensions"][1]*=.8
 elif k=="winter_planting":
  # save walkways and make planted shrubs subtler
  p["dimensions"][1]*=.64;p["center"][1]-=.10
 elif k=="stone_path_joint":
  p["dimensions"][1]=.012
 elif k=="dropoff_curb_not_full_road":
  p["dimensions"][1]=.15
 # overall muted finishes by material mapping, no mirrorlike pavement
 p["name"]=name.replace("RG-GAME-02-GATE-COMPLEX-V13__","RG-GAME-02-GATE-ANIME-V14__")
 retained[k]+=1
 return p
for raw in items:
 p=adapt(raw)
 if p:replacements.append(p)
def extra(n,group,material,center,dims,kind,roll=0):
 assert len(center)==3 and len(dims)==3 and min(dims)>.011
 obj={"name":TAG+n,"group":group,"material":material,
  "center":center,"dimensions":dims,"kind":kind,"yaw_rad":0,"roll_rad":roll}
 replacements.append(obj);retained[kind]+=1
# 2 waiting spots near school gate; quiet landmarks, no fountain in center.
for label,x,z in (("WEST",-88.8,73.1),("EAST",-51.4,73.1)):
 extra(label+"_WAIT_SEAT","FORECOURT","oak",[x,.51,z],[2.0,.16,.52],"waiting_bench")
 for dx in (-.79,.79):
  extra(label+"_BENCH_LEG_"+str(dx),"FORECOURT","oak",[x+dx,.25,z],[.11,.5,.43],"waiting_bench_leg")
 extra(label+"_WAYFINDING","FORECOURT","stone_trim",[x,1.46,z+2.1],[.23,2.92,.23],"wayfinding_post")
 extra(label+"_WAYFINDING_SIGN","FORECOURT","oak",[x,2.48,z+2.1],[.80,.52,.10],"wayfinding_sign_no_text")
# Two stylized leafless campus trees, clear of central axis and two wicket paths
for j,(x,z) in enumerate(((-106,63),(-35,64))):
 extra("TREE_"+str(j)+"_TRUNK","FORECOURT","tree_bark",[x,2.9,z],[.34,5.8,.37],"winter_bare_tree")
 for side,dx,dz in (("L",-1.3,-.4),("R",1.3,.5)):
  extra("TREE_"+str(j)+"_BRANCH_"+side,"FORECOURT","tree_bark",
        [x+dx*.48,4.35,z+dz*.5],[1.65,.15,.14],
        "winter_branch",roll=(.44 if dx>0 else -.44))
 extra("TREE_"+str(j)+"_SNOW_AT_FOOT","FORECOURT","snow",
       [x,.17,z],[2.05,.17,2.13],"snow_ground")
# Main gate lower piers no solid lintel over vertical movement, preserve 10.62m opening
# Arrival forecourt gets subtly darker central cinematic centerline without adding
# obstacles or overly busy tiles.
extra("CENTRAL_AXIS_LIGHT_STRIP","FORECOURT","pavement_alt",
      [-70.1,.058,66.5],[.12,.013,21.5],"subtle_paving_axis")
# Re-batch cube geometry (flat normals, robust in webGL mobile viewer).
faces=[
 ((0,0,1),[(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),
 ((0,0,-1),[(1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1)]),
 ((1,0,0),[(1,-1,1),(1,-1,-1),(1,1,-1),(1,1,1)]),
 ((-1,0,0),[(-1,-1,-1),(-1,-1,1),(-1,1,1),(-1,1,-1)]),
 ((0,1,0),[(-1,1,1),(1,1,1),(1,1,-1),(-1,1,-1)]),
 ((0,-1,0),[(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1)])
]
C=[];N=[];IDX=[]
for normal,points in faces:
 off=len(C)
 for corner in points:C.append(tuple(q*.5 for q in corner));N.append(normal)
 IDX.extend((off,off+1,off+2,off,off+2,off+3))
def rotate(a,p,normal=False):
 x,y,z=a
 if not normal:
  w,h,d=p["dimensions"];x*=w;y*=h;z*=d
 yaw=p.get("yaw_rad",0);cr=math.cos(yaw);sr=math.sin(yaw)
 x,z=x*cr+z*sr,-x*sr+z*cr
 roll=p.get("roll_rad",0);cr=math.cos(roll);sr=math.sin(roll)
 x,y=x*cr-y*sr,x*sr+y*cr
 if normal:return(x,y,z)
 bx,by,bz=p["center"];return x+bx,y+by,z+bz
groups=defaultdict(list)
for p in replacements:
 assert p["material"] in mats
 groups[(p["group"],p["material"])].append(p)
added=[]
for (area,material),ps in sorted(groups.items()):
 pos=[];nor=[];inds=[];low=[float("inf")]*3;high=[float("-inf")]*3
 for p in ps:
  off=len(pos)//3
  for c,n in zip(C,N):
   pt=rotate(c,p)
   pos.extend(pt);nor.extend(rotate(n,p,True))
   for k in range(3):low[k]=min(low[k],pt[k]);high[k]=max(high[k],pt[k])
  inds.extend(off+i for i in IDX)
 vc=len(pos)//3
 pv=glb.add_buffer_view(m,buf,struct.pack("<%sf"%len(pos),*pos),34962)
 nv=glb.add_buffer_view(m,buf,struct.pack("<%sf"%len(nor),*nor),34962)
 iv=glb.add_buffer_view(m,buf,struct.pack("<%sI"%len(inds),*inds),34963)
 acc=m.setdefault("accessors",[])
 pi=len(acc);acc.append({"bufferView":pv,"componentType":5126,"count":vc,"type":"VEC3","min":low,"max":high})
 ni=len(acc);acc.append({"bufferView":nv,"componentType":5126,"count":vc,"type":"VEC3"})
 ii=len(acc);acc.append({"bufferView":iv,"componentType":5125,"count":len(inds),"type":"SCALAR","min":[0],"max":[vc-1]})
 m["meshes"].append({"name":TAG+area+"_"+material,"primitives":[{"attributes":{"POSITION":pi,"NORMAL":ni},"indices":ii,"material":mats[material],"mode":4}]})
 node={"name":TAG+area+"_"+material,"mesh":len(m["meshes"])-1,
  "extras":{"v14":"anime_campus_gate","region":area,"material":material,
            "shapes":len(ps),"author_approved":False}}
 m["nodes"].append(node)
 scene["nodes"].append(len(m["nodes"])-1)
 added.append(len(m["nodes"])-1)
assert json.dumps(m["nodes"][:11983],sort_keys=True,ensure_ascii=False)==source_content
assert all(i in scene["nodes"] for i in original_root)
assert all(i not in scene["nodes"] for i in gate_old)
assert 12<=len(added)<=60
assert len(replacements)>=250
m["buffers"][0]["byteLength"]=len(buf)
js=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
js+=b" "*((-len(js))%4)
buf+=b"\0"*((-len(buf))%4)
data=(struct.pack("<4sII",glb.MAGIC,2,12+8+len(js)+8+len(buf))+
 struct.pack("<II",len(js),glb.CHUNK_JSON)+js+
 struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf))
OUT=Path("candidate-output/academy-gate-anime-v14")
OUT.mkdir(parents=True,exist_ok=True)
file="lahudi-academy_ANIMATION-STYLE-GATE_V14.glb"
(OUT/file).write_bytes(data)
test,_,_=glb.load_glb(OUT/file)
assert len(test["nodes"])==len(m["nodes"])
report={
 "version":"ACADEMY-V14-ANIME-STYLE-GATE-REVIEW",
 "source_v13_sha256":SOURCE_SHA,
 "sha256":hashlib.sha256(data).hexdigest(),
 "file":file,"bytes":len(data),
 "source_nodes":12011,"v12_original_nodes_untouched":11983,
 "v13_gate_batches_disabled":len(gate_old),
 "v14_visible_batch_nodes":len(added),
 "v14_visible_parts":len(replacements),
 "removed_old_fine_detail_counts":dict(removed),
 "visible_categories":dict(retained),
 "authored_style_changes":[
  "Blue-gray cool painted-animation limestone and slate, warm lantern focal points",
  "Kept gate at X=-70.1 Z=79 and open side pedestrian wickets",
  "Improved stone pier silhouette, simplified iron grille/detail density",
  "Reduced boundary wall visual mass, simplified guardhouse",
  "Clear cinematic central path with optional quiet waiting benches and bare trees",
  "No fictional cathedral rebuild; existing asymmetric school remains intact"
 ],
 "scope":"ONE_CANONICAL_SCHOOL_GLB_CANDIDATE",
 "novel_gate_style_exact_match":"NOT_PROVEN__NOVEL_DOES_NOT_DEFINE_THE_GATE_APPEARANCE",
 "A01_visual_palette_relation":"ART_DIRECTION_INFERENCE__NOT_FRAME_PIXEL_SAMPLED",
 "all_original_V12_building_and_furniture_nodes_preserved":True,
 "user_character_collision":"SKIPPED_AS_REQUESTED",
 "static_gate_clearance":"PENDING_V14_GEOMETRY_QA",
 "visual_browser_check":"PENDING",
 "author_final_acceptance":"PENDING"
}
(OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
(OUT/"gate-pieces-v14.json").write_text(json.dumps({"version":report["version"],"pieces":replacements},ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k not in ("visible_categories","removed_old_fine_detail_counts")},ensure_ascii=False))
