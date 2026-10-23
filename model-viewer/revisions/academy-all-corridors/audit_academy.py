#!/usr/bin/env python3
"""Read-only academy node audit. No rendering or GLB modification."""
from pathlib import Path
import struct,json,collections,re,hashlib
p=Path("model-viewer/lahudi-academy.glb")
raw=p.read_bytes()
assert raw[:4]==b"glTF" and struct.unpack_from("<I",raw,8)[0]==len(raw)
jlen,jtyp=struct.unpack_from("<II",raw,12)
assert jtyp==0x4e4f534a
j=json.loads(raw[20:20+jlen])
nodes=j["nodes"]
terms=("corridor","hall","stairs","stair","passage","class","library","gallery","confess","entrance","walkway","floor","door","roof","second","upper","balcony","landing","ramp","campus","courtyard","wing")
selected=[]
for i,n in enumerate(nodes):
 name=n.get("name","")
 if any(t in name.lower() for t in terms):
  selected.append({"index":i,"name":name,"mesh":n.get("mesh"),"translation":n.get("translation"),"scale":n.get("scale"),"children_count":len(n.get("children",[]))})
prefix=collections.Counter()
for n in nodes:
 s=n.get("name","(none)")
 m=re.match(r"(RG-GAME-02-[A-Z0-9-]+)__",s)
 prefix[m.group(1) if m else s.split("_")[0]][0:] if False else None
 prefix[m.group(1) if m else s.split("_")[0]]+=1
out={"source_sha256":hashlib.sha256(raw).hexdigest(),"nodes":len(nodes),"mesh":len(j.get("meshes",[])),"scene_nodes":len(j["scenes"][j.get("scene",0)].get("nodes",[])),"groups":prefix.most_common(140),"keyword_matches":selected,"node_samples":[{"index":i,"name":n.get("name"),"translation":n.get("translation")} for i,n in enumerate(nodes[:140])]}
target=Path("model-viewer/staged-output/academy-corridor-audit")
target.mkdir(parents=True,exist_ok=True)
(target/"inventory.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("keyword matches",len(selected),"unique groups",len(prefix))
print("group top",prefix.most_common(45))
print("selected examples",selected[:30])
