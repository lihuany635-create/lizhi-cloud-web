#!/usr/bin/env python3
"""Calculate original academy geometry bounds by actual glTF accessors (zero rendering)."""
import struct,json,hashlib,re,collections
from pathlib import Path
raw=Path("model-viewer/lahudi-academy.glb").read_bytes()
jlen=struct.unpack_from("<I",raw,12)[0]
j=json.loads(raw[20:20+jlen]);nodes=j["nodes"];access=j["accessors"];meshes=j["meshes"]
def bounds(meshid):
 out=[]
 for p in meshes[meshid].get("primitives",[]):
  pi=p.get("attributes",{}).get("POSITION")
  if pi is None:continue
  a=access[pi]
  if "min" in a and "max" in a:out.append((a["min"],a["max"]))
 if not out:return None
 return [[round(min(q[0][i] for q in out),3) for i in range(3)],
         [round(max(q[1][i] for q in out),3) for i in range(3)]]
selected={}
for i,n in enumerate(nodes):
 name=n.get("name","")
 if ("RG-GAME-02-" in name and any(s in name for s in ("ACOR-","CCOR-","CONFESS-","ROOF-","A1-","CROOM-","LIB-","EXT-"))) or re.match(r"^hall(?:_roof)?(?:\.\d+)?$",name):
  if n.get("mesh") is None:continue
  rec={"index":i,"name":name,"bounds_mesh":bounds(n["mesh"]),"translation":n.get("translation"),"scale":n.get("scale")}
  key=name.split("__")[0] if "__" in name else name.split(".")[0]
  selected.setdefault(key,[]).append(rec)
summary={}
for key,v in selected.items():
 bb=[x["bounds_mesh"] for x in v if x["bounds_mesh"]]
 if not bb:continue
 summary[key]={"count":len(v),"bbox":[[round(min(x[0][i] for x in bb),2) for i in range(3)],[round(max(x[1][i] for x in bb),2) for i in range(3)]],
   "names":[{"index":x["index"],"name":x["name"],"bbox":x["bounds_mesh"]} for x in v[:45]]}
dst=Path("model-viewer/staged-output/academy-corridor-audit/spatial.json")
dst.write_text(json.dumps({"source_sha256":hashlib.sha256(raw).hexdigest(),"groups":summary},ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:{"count":v["count"],"bbox":v["bbox"]} for k,v in summary.items() if ("ACOR" in k or "CCOR" in k or "CONFESS" in k or "ROOF" in k)},indent=2))
