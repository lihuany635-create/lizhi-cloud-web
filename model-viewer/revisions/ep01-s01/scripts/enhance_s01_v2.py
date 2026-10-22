#!/usr/bin/env python3
"""Enhance EP01 S01 corridor with non-destructive geometric set dressing.
Builds a real binary GLB in CI. NOT a shot-matched or author-approved deliverable.
"""
import json, hashlib, math, pathlib, struct, sys
import build_s01_candidate as base

OUT=pathlib.Path("candidate-output")
PREFIX="RG-GAME-02-EP01-S01-REV2__"
ANCHOR=("RG-GAME-02-CONFESS-001__window_sill","RG-GAME-02-CONFESS-005__occlusion_wall","RG-GAME-02-CONFESS-005__tread_0")

def material(model, name, color, roughness=.7, metal=0, emissive=None):
    m={"name":name,"doubleSided":True,
       "pbrMetallicRoughness":{"baseColorFactor":[*color,1],"roughnessFactor":roughness,"metallicFactor":metal}}
    if emissive: m["emissiveFactor"]=emissive
    model.setdefault("materials",[]).append(m)
    return len(model["materials"])-1

def box(model, mesh, name, center, scale, group):
    index=len(model["nodes"])
    model["nodes"].append({
        "name":PREFIX+name,"mesh":mesh,"translation":list(center),"scale":list(scale),
        "extras":{"scene":"RG-GAME-02","episode":"EP01","shot":"S01","design_group":group,
          "source":"original EP01 animation 1000038427 00:12/02:36","approved":False,
          "camera_match":"NOT_RUN","geometry_type":"non-destructive set dressing"}
    })
    model["scenes"][model.get("scene",0)].setdefault("nodes",[]).append(index)
    return index

def rib(model, mesh, z, tag, n=14):
    out=[]
    xl,xr=-72.22,-68.94
    # A restrained pointed arch with a visibly sharper apex than circular barrel ribs.
    def height(t): return 6.06+1.11*(1-abs(2*t-1)**.90)
    for i in range(n):
        t0,t1=i/n,(i+1)/n
        a=(xl+(xr-xl)*t0,height(t0),z)
        b=(xl+(xr-xl)*t1,height(t1),z)
        out.append(base.add_beam(model,model.get("scene",0),mesh,
          PREFIX+tag+f"__rib_{i:02d}",a,b,.092,.13))
    return out

def build():
    OUT.mkdir(exist_ok=True,parents=True)
    # First: the previously tested 36-rib design, with original SHA gate.
    stage=OUT/"stage1.glb"
    sys.argv=["build_s01_candidate.py","--input","model-viewer/lahudi-academy.glb",
              "--output",str(stage),"--report",str(OUT/"stage1_report.json")]
    base.main()
    model,buf,data=base.load_glb(stage)
    existing=[x.get("name") for x in model["nodes"]]
    assert all(s in existing for s in ANCHOR)
    assert not any(n and n.startswith(PREFIX) for n in existing)
    source_count=len(model["nodes"]); source_materials=len(model.get("materials",[]))
    palette={
      "stone":material(model,"S01_REV2__bluegray_limestone",(.40,.41,.43),.86),
      "stone_trim":material(model,"S01_REV2__warm_pale_stone_trim",(.59,.57,.55),.67),
      "deepwood":material(model,"S01_REV2__deep_chestnut_doors",(.15,.095,.065),.49),
      "wooddetail":material(model,"S01_REV2__panel_recesses",(.095,.054,.037),.62),
      "wainscot":material(model,"S01_REV2__dark_wall_oak",(.21,.155,.115),.65),
      "iron":material(model,"S01_REV2__dark_window_iron",(.08,.095,.10),.39,.43),
      "brass":material(model,"S01_REV2__aged_brass",(.46,.28,.105),.37,.57),
      "glasswarm":material(model,"S01_REV2__warm_sconce_diffuser",(.95,.67,.30),.34,0,[1.0,.55,.19]),
      "floorline":material(model,"S01_REV2__floor_inlay",(.19,.20,.23),.28,.16)
    }
    mesh={k:base.add_cube_mesh(model,buf,mid) for k,mid in palette.items()}
    counts={k:0 for k in ("ribs","pilasters","doors","panel_casing","window_tracery","wainscot","floor_inlay","sconces")}
    def put(gr,mat,name,pos,scale):
        counts[gr]+=1
        return box(model,mesh[mat],name,pos,scale,gr)

    # Full S01 corridor: seven 3-m bays; three original window bays already have stage1 ribs.
    for z in (-6.04,-3.04,-.04,11.96):
        counts["ribs"]+=len(rib(model,mesh["stone_trim"],z,f"new_bay_z{z:.2f}"))

    for k,z in enumerate((-6.04,-3.04,-.04,2.96,5.96,8.96,11.96),1):
        for side,x in (("door",-72.25),("window",-68.96)):
            put("pilasters","stone",f"bay{k:02d}_{side}_shaft",(x,5.45,z),(.18,2.64,.21))
            put("pilasters","stone_trim",f"bay{k:02d}_{side}_base",(x,4.17,z),(.32,.28,.38))
            put("pilasters","stone_trim",f"bay{k:02d}_{side}_capital",(x,6.79,z),(.35,.20,.42))

    # Six carved dark timber doors: visual leaf overlays on preexisting left solid wall.
    # These are not passable doors; the end of S01 is still blocked pending camera / route QA.
    for k,z in enumerate((-5.53,-2.53,.47,3.47,6.47,9.47),1):
        put("doors","deepwood",f"left_door_{k:02d}_leaf",(-72.34,5.19,z),(.09,2.38,1.52))
        for edge,dz in (("lower",-0.80),("upper",.80)):
            put("panel_casing","wainscot",f"door{k:02d}_{edge}_jamb",(-72.25,5.21,z+dz),(.16,2.53,.105))
        put("panel_casing","wainscot",f"door{k:02d}_head",(-72.25,6.485,z),(.16,.14,1.74))
        for row,y in enumerate((4.62,5.50),1):
            put("panel_casing","wooddetail",f"door{k:02d}_recess{row}",(-72.286,y,z),(.016,.60,1.07))
            put("panel_casing","deepwood",f"door{k:02d}_raised{row}",(-72.278,y,z),(.018,.53,.98))
        put("panel_casing","brass",f"door{k:02d}_lockplate",(-72.21,5.11,z+.55),(.04,.18,.07))
        put("panel_casing","brass",f"door{k:02d}_handle",(-72.185,5.16,z+.55),(.08,.025,.16))

    # Right-side windows: original mullion positions z=2.96,5.96,8.96.
    # Two bays remain readable; do not block existing high windows.
    for k,z in enumerate((4.46,7.46),1):
        put("window_tracery","iron",f"window{k}_center_bar",(-68.80,5.80,z),(.048,1.82,.045))
        put("window_tracery","iron",f"window{k}_transom",(-68.80,5.84,z),(.048,.045,2.79))
        put("window_tracery","stone_trim",f"window{k}_sill_inner",(-68.85,4.84,z),(.25,.11,2.87))
        # A subtle pointed apex in front of the existing frame, still within the y=7.3 ceiling.
        put("window_tracery","stone_trim",f"window{k}_apex",(-68.78,6.78,z),(.07,.26,.09))

    # Wooden wall base is below the actual window sill (y = 4.79).
    put("wainscot","wainscot","right_lower_wainscot",(-68.98,4.34,1.48),(.115,.62,19.30))
    for k,z in enumerate((-6.35,-3.95,-1.55,.85,3.25,5.65,8.05,10.45),1):
        put("wainscot","wooddetail",f"right_wall_panel_{k:02d}",(-68.912,4.34,z),(.015,.38,1.72))

    # Floor line-work: no replacement or deletion of original floor geometry.
    for k,x in enumerate((-72.09,-68.30),1):
        put("floor_inlay","floorline",f"floor_side_band{k}",(x,4.009,1.9),(.07,.014,19.6))
    for k,z in enumerate((-7.0,-4.1,-1.2,1.7,4.6,7.5,10.4),1):
        put("floor_inlay","floorline",f"floor_tile_joint{k}",(-70.21,4.010,z),(2.95,.012,.025))

    # Amber bronze wall sconces, VISUAL emissive only: no added high-intensity point lights.
    for k,z in enumerate((-4.04,-1.04,1.96,4.96,7.96),1):
        put("sconces","brass",f"sconce{k}_plate",(-72.16,6.08,z),(.16,.42,.23))
        put("sconces","brass",f"sconce{k}_arm",(-71.99,6.02,z),(.34,.065,.055))
        put("sconces","glasswarm",f"sconce{k}_diffuser",(-71.83,6.22,z),(.13,.30,.17))

    model["buffers"][0]["byteLength"]=len(buf)
    raw=json.dumps(model,ensure_ascii=False,separators=(",",":")).encode()
    raw+=b" "*((-len(raw))%4);buf+=b"\x00"*((-len(buf))%4)
    result=(struct.pack("<4sII",base.MAGIC,2,12+8+len(raw)+8+len(buf))+
      struct.pack("<II",len(raw),base.CHUNK_JSON)+raw+
      struct.pack("<II",len(buf),base.CHUNK_BIN)+bytes(buf))
    path=OUT/"lahudi-academy_ep01_s01_gothic_corridor_v2_review.glb"
    path.write_bytes(result)
    rmodel,rbuf,_=base.load_glb(path)
    assert len(rmodel["nodes"])==len(model["nodes"])
    assert len(rbuf)==len(buf)
    assert all(rmodel["nodes"][i].get("name")==existing[i] for i in range(source_count))
    assert all(rmodel["nodes"][i].get("mesh")==model["nodes"][i].get("mesh") for i in range(source_count))
    assert len(rmodel["materials"])>source_materials
    assert all(x.get("name") for x in rmodel["nodes"][source_count:])
    assert counts["ribs"]==56 and sum(counts.values())>=190
    rep={
        "project":"現實遊戲","scene":"RG-GAME-02","shot":"EP01-S01","revision":"S01-REV2-REVIEW",
        "status":"REVIEW_ONLY_CAMERA_NOT_MATCHED_AUTHOR_PENDING",
        "result_glb":path.name,
        "glb_sha256":hashlib.sha256(result).hexdigest(),
        "input_stage1_sha256":hashlib.sha256(data).hexdigest(),
        "original_v23_sha256":json.loads((OUT/"stage1_report.json").read_text())["source_sha256"],
        "source_nodes_preserved":source_count,
        "added_nodes_stage2":len(model["nodes"])-source_count,
        "new_detail_groups":counts,
        "validation":{"binary_container":"PASS","all_source_nodes_preserved":"PASS",
          "existing_transforms_unchanged":"PASS","author_approval":"PENDING",
          "animation_camera_overlay":"NOT_RUN",
          "end_stair_matches_film":"NOT_VERIFIED",
          "original_staircase_modified":False,
          "S06_modified":False},
        "design_note":[
          "Stage2: visible stone pilasters/capitals, 7 pointed vault ribs across S01 bay zone.",
          "Left 6 doors are decorative leaf overlays on extant solid wall, NOT guaranteed passable.",
          "Right window tracery anchors to pre-existing 3 frames; snowy world view not yet simulated.",
          "A01 warm winter sunlight needs material/light/camera rendering test, not implied by shader.",
          "Far end staircase geometry remains side-turn descending; may differ from filmed frontal ascending stair."
        ]
    }
    (OUT/"report_v2.json").write_text(json.dumps(rep,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(rep,ensure_ascii=False))
    return rep

if __name__=="__main__": build()
