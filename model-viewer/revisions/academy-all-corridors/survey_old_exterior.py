#!/usr/bin/env python3
"""Read-only survey of preliminary exterior and original school materials for clean-sheet rebuild."""
from pathlib import Path
import sys,json,collections,re,hashlib,math
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
src=Path("model-viewer/staged-output/academy-all-corridors-rb2-v4/lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v4.glb")
m,buf,data=glb.load_glb(src)
acc=m["accessors"];meshes=m["meshes"]
def bbox(n):
 if "mesh" not in n:return None
 lo=[];hi=[]
 for p in meshes[n["mesh"]]["primitives"]:
  pos=p.get("attributes",{}).get("POSITION")
  if pos is None:continue
  a=acc[pos]
  if "min" in a and "max" in a:
   lo.append(a["min"]);hi.append(a["max"])
 if not lo:return None
 return [[round(min(x[i] for x in lo),2) for i in range(3)],[round(max(x[i] for x in hi),2) for i in range(3)]]
first=[]
for i,n in enumerate(m["nodes"][:850]):
 b=bbox(n);first.append({"i":i,"name":n.get("name"),"mesh":n.get("mesh"),"bounds":b})
mats=[]
for i,x in enumerate(m.get("materials",[])):
 mats.append({"i":i,"name":x.get("name"),"pbr":x.get("pbrMetallicRoughness",{})})
groups=collections.defaultdict(lambda:{"count":0,"mat_counts":collections.Counter(),"samples":[]})
for n in m["nodes"][:7725]:
 name=n.get("name") or "unnamed"
 cat=re.match(r"RG-GAME-02-[A-Z0-9-]+",name)
 key=cat.group(0) if cat else name.split("_")[0].split(".")[0]
 x=groups[key];x["count"]+=1
 if "mesh" in n:
  for p in meshes[n["mesh"]]["primitives"]:
   mid=p.get("material",-1);x["mat_counts"][str(mid)]+=1
 if len(x["samples"])<6:x["samples"].append(name)
report={"total_nodes":len(m["nodes"]),"original_nodes":7725,
 "first_850":first,"original_materials":mats[:len(mats)-15],
 "groups":{k:{"count":v["count"],"mat_counts":v["mat_counts"],"samples":v["samples"]} for k,v in groups.items()},
 "source_sha256":hashlib.sha256(data).hexdigest()}
out=Path("model-viewer/staged-output/academy-exterior-rebuild/survey.json")
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("SURVEY",{k:report[k] for k in("total_nodes","original_nodes","source_sha256")})
print("original materials",[(m["i"],m["name"]) for m in report["original_materials"][:55]])
print("first 850 span",{s["name"]:s["i"] for s in first if s["i"] in (0,48,49,116,294,704,740,760,800,849)})
