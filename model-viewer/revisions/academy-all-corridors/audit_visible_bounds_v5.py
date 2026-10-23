#!/usr/bin/env python3
"""Actual visible bounds and surviving artifacts in canonical-equivalent V5 school.
No renderer; bounding box from glTF POSITION accessors and node TRS.
"""
import json,struct,math,collections,hashlib
from pathlib import Path
p=Path("model-viewer/staged-output/academy-exterior-rebuild-v5/lahudi-academy_REBUILT-EXTERIOR-RB2_v5.glb")
raw=p.read_bytes()
jlen=struct.unpack_from("<I",raw,12)[0]
d=json.loads(raw[20:20+jlen]);nn=d["nodes"];meshes=d["meshes"];acc=d["accessors"]
def bbox(mesh_id):
 vals=[]
 for q in meshes[mesh_id]["primitives"]:
  pos=q.get("attributes",{}).get("POSITION")
  if pos is None:continue
  a=acc[pos]
  if "min" in a and "max" in a:vals.append((a["min"],a["max"]))
 if not vals:return None
 return ([min(v[0][i] for v in vals) for i in range(3)],
         [max(v[1][i] for v in vals) for i in range(3)])
def world(n,b):
 lo,hi=b
 t=n.get("translation",[0,0,0]);s=n.get("scale",[1,1,1]);x,y,z,w=n.get("rotation",[0,0,0,1])
 r=((1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)),
    (2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)),
    (2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)))
 mid=[(lo[i]+hi[i])/2*s[i] for i in range(3)]
 rad=[abs(hi[i]-lo[i])/2*abs(s[i]) for i in range(3)]
 ctr=[t[i]+sum(r[i][j]*mid[j] for j in range(3)) for i in range(3)]
 ext=[sum(abs(r[i][j])*rad[j] for j in range(3)) for i in range(3)]
 return ([ctr[i]-ext[i] for i in range(3)],[ctr[i]+ext[i] for i in range(3)])
records=[]
for i,n in enumerate(nn):
 if "mesh" not in n:continue
 b=bbox(n["mesh"])
 if not b:continue
 a,c=world(n,b)
 records.append({"i":i,"name":n.get("name",""),"bounds":[a,c],"center":[(a[k]+c[k])/2 for k in range(3)]})
mins=[min(z["bounds"][0][k] for z in records) for k in range(3)]
maxs=[max(z["bounds"][1][k] for z in records) for k in range(3)]
top={}
for axis,key in enumerate("xyz"):
 top[key+"_min"]=sorted(records,key=lambda v:v["bounds"][0][axis])[:10]
 top[key+"_max"]=sorted(records,key=lambda v:v["bounds"][1][axis],reverse=True)[:10]
far=[v for v in records if abs(v["center"][0])>250 or abs(v["center"][2])>280 or v["bounds"][1][1]>70]
report={"source_sha":hashlib.sha256(raw).hexdigest(),"visible_mesh_nodes":len(records),"bounds":[mins,maxs],"size":[maxs[i]-mins[i] for i in range(3)],"far":far[:70],"far_count":len(far),"top":top}
out=Path("model-viewer/staged-output/academy-exterior-rebuild-v5/bounds-audit.json")
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("V5 bounds:",report["bounds"],"size:",report["size"],"outliers",len(far))
for k,v in top.items():
 print(k,[(x["i"],x["name"],round(x["bounds"][int("xyz".index(k[0]))][0 if "min" in k else 1],2)) for x in v[:5]])
