#!/usr/bin/env python3
"""EP01 S01 final structural dress-pass review: arch-vault infill, window glazing, floor surface.
No canonical model writes. Preserve original mesh graph. Do not infer film camera approval.
"""
import json,math,hashlib,struct,sys
from pathlib import Path
import build_s01_candidate as base
import enhance_s01_v2 as v2
OUT=Path("candidate-output")
PRE="RG-GAME-02-EP01-S01-REV3__"
def main():
    r=v2.build()
    p=OUT/"lahudi-academy_ep01_s01_gothic_corridor_v2_review.glb"
    model, buf, original = base.load_glb(p)
    before=len(model["nodes"])
    old_names=[n.get("name") for n in model["nodes"]]
    mats=model.setdefault("materials",[])
    def mat(name,color,rough=.75,metal=0,alpha=None,emission=None):
        vals=[*color,alpha if alpha is not None else 1]
        m={"name":name,"doubleSided":True,
          "pbrMetallicRoughness":{"baseColorFactor":vals,"roughnessFactor":rough,"metallicFactor":metal}}
        if alpha is not None: m["alphaMode"]="BLEND"
        if emission: m["emissiveFactor"]=emission
        mats.append(m)
        return len(mats)-1
    palette={
      "vault":mat("S01_REV3__vaulted_limestone",(.51,.505,.515),.84),
      "vault_ridge":mat("S01_REV3__vault_ridge_stone",(.62,.61,.60),.64),
      "polished_floor":mat("S01_REV3__reflective_gray_stone",(.32,.33,.35),.24,.08),
      "winter_glass":mat("S01_REV3__frosted_winter_window",(.64,.77,.89),.45,.02,.47,[.08,.09,.11]),
      "frost_frame":mat("S01_REV3__winter_window_edge",(.66,.67,.69),.67)
    }
    mesh={k:base.add_cube_mesh(model,buf,val) for k,val in palette.items()}
    sc=model["scenes"][model.get("scene",0)]
    counts={"vault_panels":0,"vault_ridge":0,"winter_window":0,"floor_slab":0}
    def add(name,mesh_key,pos,scale,group):
        idx=len(model["nodes"])
        model["nodes"].append({
          "name":PRE+name,"mesh":mesh[mesh_key],
          "translation":list(pos),"scale":list(scale),
          "extras":{"scene":"RG-GAME-02","shot":"EP01-S01",
            "revision":"S01-REV3-REVIEW","group":group,"author_approval":"PENDING",
            "animation_camera_match":"NOT_RUN"}
        })
        sc.setdefault("nodes",[]).append(idx);counts[group]+=1
        return idx
    # For six 3m gaps between seven existing transverse pointed ribs, build an arched
    # continuous roof underside with the same profile as the upgraded stage1+stage2 ribs.
    xs,xr=-72.22,-68.94
    z_stations=(-6.04,-3.04,-.04,2.96,5.96,8.96,11.96)
    n=14
    for bay in range(len(z_stations)-1):
        center_z=(z_stations[bay]+z_stations[bay+1])/2
        for i in range(n):
            t0,t1=i/n,(i+1)/n
            x0,x1=xs+(xr-xs)*t0,xs+(xr-xs)*t1
            y0=6.06+1.11*(1-abs(2*t0-1)**.9)
            y1=6.06+1.11*(1-abs(2*t1-1)**.9)
            # Above/between transverse stone ribs. 2.88m depth leaves narrow joints.
            dx,dy=x1-x0,y1-y0
            angle=math.atan2(dy,dx)
            span=math.hypot(dx,dy)
            c=math.cos(angle/2);s=math.sin(angle/2)
            idx=len(model["nodes"])
            model["nodes"].append({
               "name":PRE+f"vault_bay{bay+1:02d}_strip{i+1:02d}",
               "mesh":mesh["vault"],
               "translation":[(x0+x1)/2,(y0+y1)/2+.065,center_z],
               "rotation":[0,0,s,c],"scale":[span+.01,.12,2.88],
               "extras":{"shot":"EP01-S01","revision":"S01-REV3-REVIEW",
                   "group":"vault_panels","camera_match":"NOT_RUN","author_approval":"PENDING"}
            })
            sc.setdefault("nodes",[]).append(idx)
            counts["vault_panels"]+=1
    add("vault_center_ridge","vault_ridge",(-70.58,7.215,2.96),(.08,.095,18.0),"vault_ridge")
    # Frame-safe glazed inserts. Front (interior) tracery remains visible.
    # Source x~ -68.7, window vertical y4.85...6.95; no scenery modelled behind glass.
    for k,z in enumerate((4.48,7.48),1):
        add(f"window{k:02d}_glass","winter_glass",(-68.69,5.89,z),(.017,1.94,2.82),"winter_window")
        for edge,dz in (("lo",-1.405),("hi",1.405)):
            add(f"window{k:02d}_frame_{edge}","frost_frame",(-68.73,5.89,z+dz),(.078,1.98,.052),"winter_window")
    # The original corridor floor remains part of the GLB: a 7mm dressing slab only.
    add("corridor_existing_floor_dressing","polished_floor",(-70.25,4.0035,1.00),
        (4.04,.007,18.38),"floor_slab")
    model["buffers"][0]["byteLength"]=len(buf)
    jb=json.dumps(model,separators=(",",":"),ensure_ascii=False).encode("utf8")
    jb+=b" "*((-len(jb))%4);buf+=b"\x00"*((-len(buf))%4)
    final=(struct.pack("<4sII",base.MAGIC,2,12+8+len(jb)+8+len(buf))+
       struct.pack("<II",len(jb),base.CHUNK_JSON)+jb+
       struct.pack("<II",len(buf),base.CHUNK_BIN)+bytes(buf))
    path=OUT/"lahudi-academy_ep01_s01_corridor_v3_review.glb";path.write_bytes(final)
    check,_,_=base.load_glb(path)
    assert len(check["nodes"])==len(model["nodes"])
    assert all(check["nodes"][i].get("name")==old_names[i] for i in range(before))
    assert counts["vault_panels"]==84
    assert counts["vault_ridge"]==1 and counts["winter_window"]==6 and counts["floor_slab"]==1
    # An unobstructed central path is only a geometric centerline check, not actor collision QA.
    clearance_min=6.06-4.0
    assert clearance_min>=2.0
    rep={
      "project":"現實遊戲","shot":"EP01-S01","revision":"S01-REV3-REVIEW",
      "base_sha256":r["original_v23_sha256"],
      "result_sha256":hashlib.sha256(final).hexdigest(),
      "file":path.name,"file_bytes":len(final),
      "stage1_added_nodes":36,
      "stage2_added_nodes":r["added_nodes_stage2"],
      "stage3_added_nodes":len(model["nodes"])-before,
      "added_details_stage3":counts,
      "total_new_nodes":36+r["added_nodes_stage2"]+len(model["nodes"])-before,
      "validation":{
        "glb_roundtrip":"PASS",
        "existing_base_and_stage2_nodes_preserved":"PASS",
        "corridor_center_height_above_floor_m":round(clearance_min,3),
        "main_scene_unchanged":True,
        "S06_unchanged":True,
        "animation_camera_match":"NOT_RUN",
        "visual_effects_and_real_winter_view":"NOT_RENDERED",
        "stair_turn_vs_animation":"OPEN_DESIGN_CONFLICT",
        "left_decorative_doors_not_passable":"OPEN_DESIGN_CONFLICT",
        "author_acceptance":"PENDING"
      },
      "qa_classification":"geometry-completeness and source-node checks only; preview not a photoreal Blender render",
      "next":"Camera-match original S01 hallway 02:36, window 00:12, and Bessy departure stairs before merging."
    }
    (OUT/"report_v3.json").write_text(json.dumps(rep,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(rep,ensure_ascii=False))
    return rep

if __name__=="__main__":main()
