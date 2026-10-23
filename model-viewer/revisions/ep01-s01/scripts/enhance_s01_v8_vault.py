#!/usr/bin/env python3
"""EP01 S01 V8 - taller gothic arch candidate and conservative polished-stone retone.
All changes are limited to staged S01 vault geometry and one staged floor material.
Do not modify canonical five GLBs, V7 door openings/vestibules, or S06.
Film camera overlay and author acceptance are explicitly NOT claimed.
"""
from pathlib import Path
import hashlib, json, math, re, struct
import build_s01_candidate as glb

INPUT=Path("model-viewer/staged-output/ep01-s01/v7/lahudi-academy_ep01_s01_v7_vestibules_review.glb")
INPUT_SHA="a7c6cf6f9281c2758a450c12d3c0f8c70e9167a7efaaa8a6aba68533c64e11d7"
OUT=Path("candidate-output")
NAME="lahudi-academy_ep01_s01_v8_vault_floor_review.glb"
BASE_NODES=7725
DOOR_PREFIX="RG-GAME-02-EP01-S01-REV6__"
ROOM_PREFIX="RG-GAME-02-EP01-S01-REV7__"
FLOOR_MAT="S01_REV3__reflective_gray_stone"

def height(t):
    return 6.06+1.85*(1.0-abs(2*t-1)**.75)

def is_rib(n):
    return (n.startswith("RG-GAME-02-EP01-S01-ARCH-REV__") or
          (n.startswith("RG-GAME-02-EP01-S01-REV2__") and "__rib_" in n))

def is_panel(n):
    return n.startswith("RG-GAME-02-EP01-S01-REV3__vault_bay")

def main():
    assert hashlib.sha256(INPUT.read_bytes()).hexdigest()==INPUT_SHA,"V7 source SHA mismatch"
    model,buf,_=glb.load_glb(INPUT)
    original=json.dumps(model["nodes"][:BASE_NODES],ensure_ascii=False,separators=(",",":"))
    names=[n.get("name","") for n in model["nodes"]]
    doors=[(i,json.dumps(n,ensure_ascii=False,sort_keys=True)) for i,n in enumerate(model["nodes"])
           if n.get("name","").startswith((DOOR_PREFIX,ROOM_PREFIX))]
    assert len(doors)>110 and not any(n.startswith("RG-GAME-02-EP01-S01-REV8__") for n in names)
    changed=[];xa,xb=-72.22,-68.94
    for idx,node in enumerate(model["nodes"]):
        name=node.get("name","")
        rib=is_rib(name);panel=is_panel(name)
        if not (rib or panel):continue
        if rib:
            m=re.search(r"rib_?(\\d{1,2})$",name)
            if not m:continue
            i=int(m.group(1))
            n=14 if "new_bay" in name else 12
            if re.search(r"__bay\\d+_rib\\d+$",name):i-=1
        else:
            m=re.search(r"strip(\\d{1,2})$",name)
            if not m:continue
            i=int(m.group(1))-1;n=14
        if not 0<=i<n:continue
        t0,t1=i/n,(i+1)/n
        x0,x1=xa+(xb-xa)*t0,xa+(xb-xa)*t1
        y0,y1=height(t0),height(t1)
        dx,dy=x1-x0,y1-y0
        before=(node["translation"][1],node.get("rotation"),node["scale"][0])
        node["translation"][1]=(y0+y1)/2+(.065 if panel else 0)
        a=math.atan2(dy,dx)
        node["rotation"]=[0,0,math.sin(a/2),math.cos(a/2)]
        node["scale"][0]=math.hypot(dx,dy)*(1.0 if panel else 1.015)
        if any(not math.isfinite(float(x)) for x in node["rotation"]):raise ValueError(name)
        node.setdefault("extras",{})["v8_architectural_review"]="HIGHER_POINTED_VAULT"
        changed.append({"node":idx,"name":name,"before_y":round(before[0],4),
                        "after_y":round(node["translation"][1],4)})
    assert len(changed)>=150,f"vault elements only {len(changed)}"
    target=[m for m in model["materials"] if m.get("name")==FLOOR_MAT]
    assert len(target)==1, f"Expected exactly one existing floor mat, found {len(target)}"
    mat=target[0]["pbrMetallicRoughness"]
    before_mat=dict(mat)
    mat["roughnessFactor"]=.15
    mat["metallicFactor"]=.10
    # Retone only; this does not create photographic reflections without a lighting environment.
    assert json.dumps(model["nodes"][:BASE_NODES],ensure_ascii=False,separators=(",",":"))==original
    assert all(json.dumps(model["nodes"][i],ensure_ascii=False,sort_keys=True)==s for i,s in doors)
    assert len(model["nodes"])==len(names) and all(n.get("name","")==nm for n,nm in zip(model["nodes"],names))
    model["buffers"][0]["byteLength"]=len(buf)
    jb=json.dumps(model,ensure_ascii=False,separators=(",",":")).encode("utf-8")
    jb+=b" "*((-len(jb))%4)
    buf+=b"\\x00"*((-len(buf))%4)
    raw=(struct.pack("<4sII",b"glTF",2,12+8+len(jb)+8+len(buf))+
         struct.pack("<II",len(jb),glb.CHUNK_JSON)+jb+
         struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf))
    OUT.mkdir(parents=True,exist_ok=True)
    target_path=OUT/NAME
    target_path.write_bytes(raw)
    check,bin2,_=glb.load_glb(target_path)
    assert len(bin2)==len(buf) and len(check["nodes"])==len(names)
    assert len([n for n in check["nodes"] if n.get("extras",{}).get("v8_architectural_review")])==len(changed)
    report={
      "scene":"EP01-S01","revision":"S01-V8-VAULT-FLOOR-REVIEW",
      "model":NAME,"input_v7_sha256":INPUT_SHA,"sha256":hashlib.sha256(raw).hexdigest(),
      "bytes":len(raw),"changed_vault_nodes":len(changed),
      "curved_vault_edge_m":6.06,"curved_vault_apex_m":round(height(.5),4),
      "changed_vault_index_sample":[c["node"] for c in changed[:10]],
      "floor_material":FLOOR_MAT,"floor_roughness_before":before_mat.get("roughnessFactor"),
      "floor_roughness_after":mat["roughnessFactor"],
      "base_7725_nodes_unchanged":True,"v6_v7_door_and_vestibule_nodes_unchanged":True,
      "node_count_unchanged":True,"no_new_geometry_in_S06":True,
      "structural_GLTF_reload":"PASS","film_frame_alignment":"NOT_RUN",
      "chrome_visual_qa":"NOT_RUN","real_reflection_qa":"NOT_RUN","author_approved":False,
      "known_limits":[
       "Pointed vault retone is a candidate; actual animated A01/A03 camera and height proportions remain unapproved.",
       "Floor roughness change does not bake moving/window sunlight or guarantee physical environment reflections.",
       "Existing side stair and candidate ascending front stair both remain; no route selection or actor capsule walk certified.",
       "Five production canonical models and S06 are unchanged."
      ]
    }
    (OUT/"report_v8.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\\n")
    print(json.dumps(report,ensure_ascii=False),flush=True)
if __name__=="__main__":main()
