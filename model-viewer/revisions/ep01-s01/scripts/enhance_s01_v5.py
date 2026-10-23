#!/usr/bin/env python3
"""EP01 S01 V5: curved stone vault + embedded winter view texture (review only).

Uses the V4 stage as input, updates ONLY stage-generated ribs/panels,
and embeds a deterministic behind-window illustration in a real GLB material.
No changes to source academy nodes, production paths, or the S06 model.
"""
import hashlib, io, json, math, re, struct
from pathlib import Path
from PIL import Image,ImageDraw
import build_s01_candidate as glb
import enhance_s01_v4 as v4

OUT=Path("candidate-output")
BASE_PREFIX="RG-GAME-02-EP01-S01-"
V5_PREFIX="RG-GAME-02-EP01-S01-REV5__"

def curve(t):
    return 6.06+1.11*(1-abs(2*t-1)**0.57)

def recurve(model):
    changed=[]
    xa,xb=-72.22,-68.94
    for index,node in enumerate(model["nodes"]):
        name=node.get("name","")
        is_orig_rib=(name.startswith("RG-GAME-02-EP01-S01-ARCH-REV__") or
                     (name.startswith("RG-GAME-02-EP01-S01-REV2__") and "__rib_" in name))
        is_vault_panel=name.startswith("RG-GAME-02-EP01-S01-REV3__vault_bay")
        if not is_orig_rib and not is_vault_panel:continue
        if is_orig_rib:
            m=re.search(r"rib_?(\d{1,2})$",name)
            if not m: continue
            i=int(m.group(1))
            if "new_bay" in name: n=14
            else:
                # legacy initial 3 bay groups are 1-based indexes
                if re.search(r"__bay\d+_rib\d+$",name):
                    i-=1
                n=12
            if i<0 or i>=n:continue
        else:
            m=re.search(r"strip(\d{1,2})$",name)
            if not m:continue
            i=int(m.group(1))-1
            n=14
        t0,t1=i/n,(i+1)/n
        x0,x1=xa+(xb-xa)*t0,xa+(xb-xa)*t1
        y0,y1=curve(t0),curve(t1)
        dx,dy=x1-x0,y1-y0
        a=math.atan2(dy,dx)
        node["translation"][1]=(y0+y1)/2+(0.065 if is_vault_panel else 0)
        node["rotation"]=[0,0,math.sin(a/2),math.cos(a/2)]
        node["scale"][0]=math.hypot(dx,dy)*(1.0 if is_vault_panel else 1.015)
        changed.append(index)
    return changed

def skyline_texture():
    # Matte painting only, deliberately not a physically surveyed castle plan.
    w,h=1024,512
    im=Image.new("RGB",(w,h))
    px=im.load()
    for y in range(h):
        t=y/(h-1)
        c=tuple(int(a*(1-t)+b*t) for a,b in zip((131,158,192),(217,230,238)))
        for x in range(w):px[x,y]=c
    d=ImageDraw.Draw(im)
    d.polygon([(0,315),(90,238),(162,298),(290,180),(412,292),(554,225),(695,325),(835,190),(1024,284),(1024,512),(0,512)],fill=(215,223,232))
    d.polygon([(0,348),(127,287),(284,339),(413,278),(613,349),(787,267),(1024,310),(1024,512),(0,512)],fill=(180,192,205))
    # Castle silhouettes with snow-dusted roofs and slender spires
    for k,(x,y,wid,ht) in enumerate([(112,259,92,135),(275,230,67,166),(429,274,128,122),(618,219,85,180),(807,259,116,135)]):
        d.rectangle((x,y,x+wid,y+ht),fill=(117,127,146))
        d.polygon([(x-11,y),(x+wid//2,y-int(wid*.5)),(x+wid+11,y)],fill=(96,108,131))
        d.line((x-11,y,x+wid//2,y-int(wid*.5),x+wid+11,y),fill=(236,238,242),width=7)
        for col in range(1,4):
            xx=x+col*wid/4
            d.rectangle((xx-3,y+35,xx+3,y+64),fill=(58,67,93))
        if k in (1,3):
            cx=x+wid//2
            d.line((cx,y-int(wid*.5),cx,y-int(wid*.5)-56),fill=(63,66,81),width=5)
    # foreground conifers
    for k,x in enumerate(range(6,1050,57)):
        tw=29+(k%4)*5; top=314+(k%3)*13
        d.polygon([(x-tw,468),(x,top),(x+tw,468)],fill=(62,89,102))
        d.polygon([(x-tw*.70,419),(x,top),(x+tw*.7,419)],fill=(80,111,120))
        d.line((x-tw*.55,420,x,top,x+tw*.45,421),fill=(228,234,238),width=4)
    d.rectangle((0,468,1024,512),fill=(227,234,240))
    return im

def add_tex_plane(model,buf):
    im=skyline_texture();f=io.BytesIO();im.save(f,"PNG",optimize=True)
    png=f.getvalue()
    img_view=glb.add_buffer_view(model,buf,png,0)
    # target 0 is legal to omit for image; glb helper sets target, remove it
    model["bufferViews"][img_view].pop("target",None)
    images=model.setdefault("images",[])
    images.append({"name":"S01_REV5__winter_academy_matte","mimeType":"image/png","bufferView":img_view})
    samplers=model.setdefault("samplers",[])
    samplers.append({"magFilter":9729,"minFilter":9729,"wrapS":33071,"wrapT":33071})
    textures=model.setdefault("textures",[])
    textures.append({"source":len(images)-1,"sampler":len(samplers)-1})
    materials=model.setdefault("materials",[])
    materials.append({"name":"S01_REV5__winter_matte_texture","doubleSided":True,
     "emissiveFactor":[.12,.14,.17],
     "pbrMetallicRoughness":{"baseColorTexture":{"index":len(textures)-1},
       "baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1.0}})
    # Vertical rectangle in Y/Z, outward-facing toward camera (-X).
    p=[0,-.5,-.5, 0,-.5,.5, 0,.5,.5, 0,.5,-.5]
    n=[-1,0,0]*4
    uv=[0,1,1,1,1,0,0,0]
    inds=[0,1,2,0,2,3]
    pv=glb.add_buffer_view(model,buf,struct.pack("<12f",*p),34962)
    nv=glb.add_buffer_view(model,buf,struct.pack("<12f",*n),34962)
    uvv=glb.add_buffer_view(model,buf,struct.pack("<8f",*uv),34962)
    iv=glb.add_buffer_view(model,buf,struct.pack("<6H",*inds),34963)
    accessor=model.setdefault("accessors",[])
    pa=len(accessor);accessor.append({"bufferView":pv,"componentType":5126,"count":4,"type":"VEC3","min":[0,-.5,-.5],"max":[0,.5,.5]})
    na=len(accessor);accessor.append({"bufferView":nv,"componentType":5126,"count":4,"type":"VEC3"})
    ua=len(accessor);accessor.append({"bufferView":uvv,"componentType":5126,"count":4,"type":"VEC2"})
    ia=len(accessor);accessor.append({"bufferView":iv,"componentType":5123,"count":6,"type":"SCALAR","min":[0],"max":[3]})
    mesh=model.setdefault("meshes",[])
    mesh.append({"name":"S01_REV5__snowy_castle_matte_plane",
      "primitives":[{"attributes":{"POSITION":pa,"NORMAL":na,"TEXCOORD_0":ua},
                     "indices":ia,"material":len(materials)-1,"mode":4}]})
    index=len(model["nodes"])
    model["nodes"].append({"name":V5_PREFIX+"winter_castle_scenic_backdrop",
       "mesh":len(mesh)-1,"translation":[-66.72,6.08,2.10],"scale":[1,3.25,21.5],
       "extras":{"scene":"EP01-S01","art_direction":"winter castle skyline matte reference",
                 "narrative_canon":"NOT_CONFIRMED","author_approval":"PENDING",
                 "film_match":"NOT_RUN"}})
    model["scenes"][model.get("scene",0)].setdefault("nodes",[]).append(index)
    return len(png),index

def main():
    r4=v4.build()
    inp=OUT/"lahudi-academy_ep01_s01_corridor_v4_stair_review.glb"
    model,buf,binary=glb.load_glb(inp)
    orig_count=len(model["nodes"])
    orig_nodes=[(n.get("name"),n.get("translation"),n.get("rotation")) for n in model["nodes"][:7725]]
    recurve_ids=recurve(model)
    if len(recurve_ids)<150: raise RuntimeError(f"Not enough vault nodes updated: {len(recurve_ids)}")
    texture_bytes,plane_idx=add_tex_plane(model,buf)
    model["buffers"][0]["byteLength"]=len(buf)
    jb=json.dumps(model,separators=(",",":"),ensure_ascii=False).encode()
    jb+=b" "*((-len(jb))%4);buf+=b"\x00"*((-len(buf))%4)
    out=(struct.pack("<4sII",glb.MAGIC,2,12+8+len(jb)+8+len(buf))+
         struct.pack("<II",len(jb),glb.CHUNK_JSON)+jb+
         struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf))
    dest=OUT/"lahudi-academy_ep01_s01_corridor_v5_art_review.glb";dest.write_bytes(out)
    check,_,_=glb.load_glb(dest)
    assert len(check["nodes"])==orig_count+1
    assert [(n.get("name"),n.get("translation"),n.get("rotation")) for n in check["nodes"][:7725]]==orig_nodes
    assert len(check.get("images",[]))>=1
    assert all("bufferView" in x for x in check["images"] if x["name"]=="S01_REV5__winter_academy_matte")
    rep={"revision":"S01-V5-ART-REVIEW","status":"REAL_GLB_CANDIDATE_UNAPPROVED",
         "source_v4_sha256":r4["output_sha256"],"sha256":hashlib.sha256(out).hexdigest(),
         "bytes":len(out),"source_7725_nodes_unchanged":True,
         "stage_curved_vault_pieces_adjusted":len(recurve_ids),
         "embedded_winter_matte_png_bytes":texture_bytes,
         "scenic_backdrop_node":plane_idx,
         "original_stair_untouched":True,"new_v4_front_stair_retained":True,"S06_untouched":True,
         "original_animation_camera_match":"NOT_RUN","winter_scene":"ART_REFERENCE_NOT_STORY_CANON",
         "daylight_render":"NOT_RUN","author_acceptance":"PENDING",
         "critical_open":["decorative_left_doors_not_passable","original_side_descending_stair_remains",
                          "Gothic-vault physical continuity and Blender shade render need review"]}
    (OUT/"report_v5.json").write_text(json.dumps(rep,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(rep,ensure_ascii=False))
    return rep

if __name__=="__main__": main()
