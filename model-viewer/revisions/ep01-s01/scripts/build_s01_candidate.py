#!/usr/bin/env python3
"""EP01 S01: additive gothic vault-rib prototype, preserving source GLB geometry.

Only creates a review candidate. Camera matching and author approval are NOT done.
Expected source: RG-GAME-02 / lahudi-academy v2.3.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import pathlib
import struct

MAGIC = b"glTF"
CHUNK_JSON = 0x4E4F534A
CHUNK_BIN = 0x004E4942
ANCHORS = (
    "RG-GAME-02-CONFESS-001__window_sill",
    "RG-GAME-02-CONFESS-005__occlusion_wall",
    "RG-GAME-02-CONFESS-005__end_wall",
)


def load_glb(path: pathlib.Path):
    data = path.read_bytes()
    if len(data) < 20 or data[:4] != MAGIC:
        raise ValueError("Not a binary glTF")
    magic, version, size = struct.unpack_from("<4sII", data, 0)
    if version != 2 or size != len(data):
        raise ValueError("Invalid GLB version or length")
    offset, chunks = 12, []
    while offset < size:
        n, typ = struct.unpack_from("<II", data, offset)
        payload = data[offset+8:offset+8+n]
        if len(payload) != n: raise ValueError("GLB chunk truncated")
        chunks.append((typ, payload))
        offset += 8+n
    if len(chunks) != 2 or [x[0] for x in chunks] != [CHUNK_JSON, CHUNK_BIN]:
        raise ValueError("Expected exactly JSON + BIN chunks; refuse lossy conversion")
    model = json.loads(chunks[0][1].decode("utf-8").rstrip(" \t\r\n\x00"))
    if len(model.get("buffers", [])) != 1:
        raise ValueError("Expected one internal GLB buffer")
    return model, bytearray(chunks[1][1]), data


def add_buffer_view(model, buf, raw: bytes, target: int) -> int:
    while len(buf) % 4: buf.append(0)
    start = len(buf)
    buf.extend(raw)
    arr = model.setdefault("bufferViews", [])
    arr.append({"buffer":0,"byteOffset":start,"byteLength":len(raw),"target":target})
    return len(arr)-1


def add_cube_mesh(model, buf, material_id):
    # A 24-vertex cube provides explicit flat normals and predictable face lighting.
    faces = [
        ((0,0,1),[(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),
        ((0,0,-1),[(1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1)]),
        ((1,0,0),[(1,-1,1),(1,-1,-1),(1,1,-1),(1,1,1)]),
        ((-1,0,0),[(-1,-1,-1),(-1,-1,1),(-1,1,1),(-1,1,-1)]),
        ((0,1,0),[(-1,1,1),(1,1,1),(1,1,-1),(-1,1,-1)]),
        ((0,-1,0),[(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1)]),
    ]
    positions, normals, indices = [], [], []
    for normal, corners in faces:
        b = len(positions)//3
        for pt in corners:
            positions.extend(c*.5 for c in pt)
            normals.extend(normal)
        indices.extend((b,b+1,b+2,b,b+2,b+3))
    pv=add_buffer_view(model,buf,struct.pack("<%sf"%len(positions),*positions),34962)
    nv=add_buffer_view(model,buf,struct.pack("<%sf"%len(normals),*normals),34962)
    iv=add_buffer_view(model,buf,struct.pack("<%sH"%len(indices),*indices),34963)
    ac=model.setdefault("accessors",[])
    pi=len(ac); ac.append({"bufferView":pv,"componentType":5126,"count":24,"type":"VEC3","min":[-.5]*3,"max":[.5]*3})
    ni=len(ac); ac.append({"bufferView":nv,"componentType":5126,"count":24,"type":"VEC3"})
    ii=len(ac); ac.append({"bufferView":iv,"componentType":5123,"count":36,"type":"SCALAR","min":[0],"max":[23]})
    meshes=model.setdefault("meshes",[])
    meshes.append({"name":"RG-EP01-S01__stone_arch_moulding","primitives":[{"attributes":{"POSITION":pi,"NORMAL":ni},"indices":ii,"material":material_id,"mode":4}]})
    return len(meshes)-1


def add_beam(model, scene_id, mesh_id, name, a, b, thickness=.085, depth=.16):
    dx,dy=b[0]-a[0],b[1]-a[1]
    span=math.hypot(dx,dy)
    theta=math.atan2(dy,dx)
    nodes=model.setdefault("nodes",[])
    nodes.append({
        "name":name, "mesh":mesh_id,
        "translation":[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],
        "rotation":[0,0,math.sin(theta/2),math.cos(theta/2)],
        "scale":[span*1.015,thickness,depth],
        "extras":{
            "asset_id":"RG-GAME-02-EP01-S01-ARCH-REV",
            "revision":"EP01-S01-PREVIEW-20261023",
            "status":"CANDIDATE_UNVERIFIED",
            "author_approval":"PENDING",
            "camera_overlay":"NOT_RUN",
            "source":"EP01 existing animation S01 02:36 and design booklet v1.0",
        }
    })
    idx=len(nodes)-1
    model["scenes"][scene_id].setdefault("nodes",[]).append(idx)
    return idx


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input",default="model-viewer/lahudi-academy.glb")
    p.add_argument("--output",default="candidate-output/lahudi-academy_ep01_s01_arch_preview.glb")
    p.add_argument("--report",default="candidate-output/report.json")
    opt=p.parse_args()
    original=pathlib.Path(opt.input)
    model, buf, data=load_glb(original)
    manifest=json.loads(pathlib.Path("model-viewer/current-models.json").read_text())
    expected=next(x["current_sha256"] for x in manifest["models"] if x["model"]=="lahudi-academy.glb")
    sha=hashlib.sha256(data).hexdigest()
    if sha!=expected: raise ValueError("Source SHA256 differs from reviewed model. Refuse changes: "+sha)
    names={x.get("name") for x in model["nodes"]}
    missing=[x for x in ANCHORS if x not in names]
    if missing: raise ValueError("Scene anchors missing: "+str(missing))
    if any("RG-GAME-02-EP01-S01-ARCH-REV" in (x.get("name") or "") for x in model["nodes"]):
        raise ValueError("Prototype already applied; refuse duplicate")
    if "scenes" not in model: raise ValueError("Scene missing")
    materials=model.setdefault("materials",[])
    materials.append({
        "name":"EP01-S01__muted_warm_gray_arch_stone",
        "doubleSided":True,
        "pbrMetallicRoughness":{"baseColorFactor":[.40,.38,.36,1],"metallicFactor":0,"roughnessFactor":.78}
    })
    mid=len(materials)-1
    cube=add_cube_mesh(model,buf,mid)
    added=[]
    # The checked GLB places corridor window line at x~-68.7, occlusion wall at x~-72.55,
    # with three window bays at z≈3,6,9 and y≈4-7.3.
    # Add only ceiling rib moulding prototypes; no doors, windows, floor or staircase altered.
    x_start,x_end=-72.22,-68.94
    base,rise=6.52,.56
    for bay,z in enumerate((2.96,5.96,8.96),1):
        points=[]
        for j in range(13):
            t=j/12
            points.append((x_start+(x_end-x_start)*t,base+rise*math.sin(math.pi*t),z))
        for j in range(12):
            a,b=points[j:j+2]
            added.append(add_beam(model,model.get("scene",0),cube,
                   f"RG-GAME-02-EP01-S01-ARCH-REV__bay{bay:02}_rib{j+1:02}",
                   a,b))
    model["buffers"][0]["byteLength"]=len(buf)
    payload=json.dumps(model,separators=(",",":"),ensure_ascii=False).encode("utf8")
    payload+=b" " * ((-len(payload))%4)
    buf+=b"\x00"*((-len(buf))%4)
    final=b"".join([
        struct.pack("<4sII",MAGIC,2,12+8+len(payload)+8+len(buf)),
        struct.pack("<II",len(payload),CHUNK_JSON),payload,
        struct.pack("<II",len(buf),CHUNK_BIN),bytes(buf)
    ])
    output=pathlib.Path(opt.output)
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_bytes(final)
    # Parsing the new GLB back catches malformed container and corrupt JSON/BIN sizes.
    reread,bin2,_=load_glb(output)
    if len(reread["nodes"])!=len(model["nodes"]) or len(bin2)!=len(buf):
        raise RuntimeError("GLB round-trip mismatch")
    report={
        "revision":"EP01-S01-PREVIEW-20261023",
        "status":"CANDIDATE_NOT_AUTHOR_APPROVED",
        "source_sha256":sha,"output_sha256":hashlib.sha256(final).hexdigest(),
        "scene":"RG-GAME-02","source_nodes":len(model["nodes"])-len(added),
        "result_nodes":len(model["nodes"]),"added_rib_nodes":len(added),
        "preserved_scene":"Yes: additive-only, no original node transforms or mesh edits",
        "s01_only":True,"S06_touched":False,"camera_overlay":"NOT_RUN",
        "render_validation":"NOT_RUN","glb_container_validation":"PASS",
        "notes":[
          "Concept geometry: three modest ceiling ribs aligned with three existing window bays.",
          "A01 left deep wood doors, right windows and end stair remain in their prior location.",
          "No light/material overrides of existing geometry; confirm visual matching before considering merge.",
          "Do not deploy or overwrite canonical model before actual video camera QA."
        ]
    }
    rp=pathlib.Path(opt.report);rp.parent.mkdir(parents=True,exist_ok=True)
    rp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False))


if __name__=="__main__":
    main()
