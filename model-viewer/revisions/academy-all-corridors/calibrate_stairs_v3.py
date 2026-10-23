#!/usr/bin/env python3
"""Accuracy pass V3 for school Gothic full-corridor GLB, no rendering.

Calibrate the side stair's decorative pilasters, arches and 2 handrails against
actual source tread extents (0.166667m rise each 0.30m run), not guessed 0.5 slope.
Move roof landing logical anchor from erroneous 8.28m to true 7.24m last-tread.
Validate new decorations do not box-intersect original moving stair footprints.
"""
from pathlib import Path
import hashlib,math,json,re,struct,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb

ROOT=Path("model-viewer/staged-output/academy-all-corridors-rb2-v2")
SOURCE=ROOT/"lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v2.glb"
EXPECT="684e558cc858cb31278cf6180f73e974675830933da7fb9446426d3ce40b1c86"
OUT=Path("candidate-output/academy-corridors-rb2-v3")
NAME="lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v3.glb"
PREF="RG-GAME-02-ALLCOR-RB2-V2__"
def old_height(x):
 return max(0,min(4,4+(x+74.5)*.5))
def actual_height(x):
 # Native tread top: at center x=-74.65, y=3.8333; x=-81.55, y=0.000.
 return max(0,min(4,4+(x+74.35)*(1/1.8)))
def decode_glb_bbox(model,n):
 if "mesh" not in n:return None
 boxes=[]
 for primitive in model["meshes"][n["mesh"]].get("primitives",[]):
  pos=primitive.get("attributes",{}).get("POSITION")
  if pos is None:continue
  acc=model["accessors"][pos]
  if "min" in acc and "max" in acc:boxes.append((acc["min"],acc["max"]))
 if not boxes:return None
 lo=[min(box[0][i] for box in boxes) for i in range(3)]
 hi=[max(box[1][i] for box in boxes) for i in range(3)]
 return(lo,hi)
def rotated_box_bounds(n):
 # only newly added RB2 geometry, a shared [-.5,.5] cuboid with local scale
 p=n["translation"]; s=n["scale"]
 q=n.get("rotation",[0,0,0,1])
 x,y,z,w=q
 rot=[
  [1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
  [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
  [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
 half=[sum(abs(rot[i][j])*s[j]/2 for j in range(3)) for i in range(3)]
 return ([p[i]-half[i] for i in range(3)],[p[i]+half[i] for i in range(3)])
def overlap(a,b,eps=.002):
 return all(min(a[1][i],b[1][i])-max(a[0][i],b[0][i])>eps for i in range(3))
def main():
 assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==EXPECT
 model,buf,_=glb.load_glb(SOURCE)
 nodes=model["nodes"]
 assert len(nodes)==9245
 changed=[]
 rail_count=0
 for n in nodes:
  name=n.get("name","")
  if not name.startswith(PREF):continue
  if n.get("extras",{}).get("region")=="confession_side_stair" and "mesh" in n:
   x=n["translation"][0]
   rail=re.search(r"side_handrail_(north|south)_(\d+)$",name)
   if rail:
    i=int(rail.group(2))
    x0=-74.60-i*.69
    x1=x0-.69
    y0=actual_height(x0)+1.03
    y1=actual_height(x1)+1.03
    diffx=x1-x0;diffy=y1-y0
    ang=math.atan2(diffy,diffx)
    n["translation"][1]=(y0+y1)/2
    n["scale"][0]=math.hypot(diffx,diffy)
    n["rotation"]=[0,0,math.sin(ang/2),math.cos(ang/2)]
    rail_count+=1
   else:
    n["translation"][1]=round(n["translation"][1]+actual_height(x)-old_height(x),6)
   n.setdefault("extras",{})["stair_tread_calibration"]="SOURCE_TREAD_TOP_Y"
   changed.append(name)
  elif name==PREF+"ANCHOR_to_roof_stair":
   n["translation"][1]=7.26
   n.setdefault("extras",{})["stair_tread_calibration"]="SOURCE_ROOF_LAST_TREAD_Y_7.24"
   changed.append(name)
  elif name==PREF+"ANCHOR_to_confession_lower_stair":
   n["translation"][1]=.03
   changed.append(name)
 assert rail_count==22,rail_count
 assert len(changed)>125
 # Entire pre-V2 core including original classroom positions remains exact.
 # Only nodes owned by stair transition v2 are allowed to change in V3.
 original_v2,_buf,_raw=glb.load_glb(SOURCE)
 for i in range(8931):
  assert nodes[i]==original_v2["nodes"][i],i
 for i in range(8931,len(nodes)):
  if nodes[i].get("name") not in changed:
   assert nodes[i]==original_v2["nodes"][i],i
 originals={
  "confession_side_stair":"RG-GAME-02-CONFESS-005__tread_",
  "roof_stair_lobby":"RG-GAME-02-ROOF-001__approach__tread",
  "main_entrance_arcade":"RG-GAME-02-EXT-001__entry_stair__tread"}
 stair_bounds={}
 for region,tag in originals.items():
  vals=[decode_glb_bbox(model,n) for n in nodes[:8931] if n.get("name","").startswith(tag) and "mesh" in n]
  vals=[v for v in vals if v]
  assert len(vals)>=18,(region,len(vals))
  stair_bounds[region]=vals
 # Check only new V2 architecture against original static step mesh boxes.
 checks={}
 strikes=[]
 for region,boxes in stair_bounds.items():
  relevant=[n for n in nodes[8931:] if n.get("extras",{}).get("region")==region and "mesh" in n]
  clashes=[]
  for n in relevant:
   bb=rotated_box_bounds(n)
   for i,stair in enumerate(boxes):
    if overlap(bb,stair):
     clashes.append({"new_node":n["name"],"source_stair_step":i})
     break
  checks[region]={"original_native_steps":len(boxes),
                  "new_decorative_geometry":len(relevant),
                  "aabb_possible_step_intersections":len(clashes)}
  strikes+=clashes
 assert not strikes,("New staircase decoration overlaps original stair treads",strikes[:12])
 # Source native stair geometry itself is unchanged.
 for tag in originals.values():
  src=[n for n in original_v2["nodes"] if n.get("name","").startswith(tag)]
  new=[n for n in nodes if n.get("name","").startswith(tag)]
  assert src==new
 model["buffers"][0]["byteLength"]=len(buf)
 jb=json.dumps(model,ensure_ascii=False,separators=(",",":")).encode()
 jb+=b" "*((-len(jb))%4)
 buf+=b"\x00"*((-len(buf))%4)
 data=b"".join([struct.pack("<4sII",glb.MAGIC,2,12+8+len(jb)+8+len(buf)),
               struct.pack("<II",len(jb),glb.CHUNK_JSON),jb,
               struct.pack("<II",len(buf),glb.CHUNK_BIN),bytes(buf)])
 OUT.mkdir(parents=True,exist_ok=True)
 (OUT/NAME).write_bytes(data)
 verify,binary,_=glb.load_glb(OUT/NAME)
 assert len(verify["nodes"])==9245 and len(binary)==len(buf)
 report={
  "name":"RG-GAME-02","version":"ACADEMY-RB2-GOTHIC-ALL-CORRIDORS-V3",
  "file":NAME,"sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data),
  "parent_v2_sha256":EXPECT,"nodes":len(nodes),
  "v2_decorations_recalibrated":len(changed),"handrails_recalibrated":rail_count,
  "roof_anchor_y_before":8.28,"roof_anchor_y_after":7.26,
  "side_stair_rise_per_m":round(1/1.8,6),
  "static_original_stair_aabb_checks":checks,
  "AABB_step_intersections":0,"all_8931_existing_nodes_unmodified":True,
  "GLB_roundtrip":"PASS","rendering":"NOT_RUN_BY_USER_REQUEST",
  "full_body_swept_actor_navigation":"NOT_RUN",
  "all_campus_ext_hall_names_classified":"NOT_YET",
  "main_five_models_untouched":True,"author_approval":"PENDING",
  "limitations":[
   "Axis-aligned bounding boxes are conservative geometric checks, not triangle collision or animated avatar navigation.",
   "Side-stair arch and balustrades kept outside native step boxes and calibrated to original rise/run.",
   "This model continues to include only the measured continuous academy interior school wing, not invented corridor interiors of 29 exterior hall-shell buildings."
  ]
 }
 (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()
