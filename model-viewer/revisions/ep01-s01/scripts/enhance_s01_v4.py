#!/usr/bin/env python3
"""EP01 S01 V4 non-destructive CAMERA-REVERSED, ascending far stair candidate.

IMPORTANT: Stage-only proof of composition. Existing academy remains structurally
unaltered; existing side-stair remains, with a new frontal staircase at far -Z.
The old side-stair may need scene-specific removal after camera and walk QC.
Left doors remain decorative and not passable.
"""
import json,math,hashlib,struct
from pathlib import Path
import build_s01_candidate as core
import enhance_s01_v3 as v3

OUT=Path("candidate-output")
PRE="RG-GAME-02-EP01-S01-REV4__"
SCRIPT_VERSION="S01-REV4-20261023A"

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    prev=v3.main()
    inp=OUT/"lahudi-academy_ep01_s01_corridor_v3_review.glb"
    model,buf,blob=core.load_glb(inp)
    names=[n.get("name") for n in model["nodes"]]
    before_nodes=len(names)
    before_scenes=[list(s.get("nodes",[])) for s in model.get("scenes",[])]
    assert len(before_scenes)>=1 and not any(str(n).startswith(PRE) for n in names)
    def mat(name,color,rough=.72,metal=0,alpha=None,glow=None):
        c=[*color,1.0 if alpha is None else alpha]
        v={"name":name,"doubleSided":True,"pbrMetallicRoughness":
            {"baseColorFactor":c,"roughnessFactor":rough,"metallicFactor":metal}}
        if alpha is not None:v["alphaMode"]="BLEND"
        if glow:v["emissiveFactor"]=glow
        model.setdefault("materials",[]).append(v)
        return len(model["materials"])-1
    mats={
     "limestone":mat("S01_REV4__cool_bluegray_limestone",(.51,.50,.52),.75),
     "step":mat("S01_REV4__old_stair_stone",(.38,.36,.365),.46),
     "edge":mat("S01_REV4__stair_edge",(.63,.61,.58),.45),
     "baluster":mat("S01_REV4__balustrade",(.63,.60,.56),.66),
     "frame":mat("S01_REV4__tall_lancet_frame",(.64,.63,.63),.69),
     "glow":mat("S01_REV4__winter_sky_frost_blue",(.53,.70,.87),.29,0,1.0,[.12,.16,.19]),
     "wood":mat("S01_REV4__back_wall_panel",(.22,.15,.11),.62),
    }
    meshes={k:core.add_cube_mesh(model,buf,v) for k,v in mats.items()}
    groups={k:0 for k in ("ascending_treads","stair_balustrades","rear_walls","stair_landing","rear_lancet","stair_extension_floor")}
    def add(name,mesh,center,scale,group,rot=None):
        idx=len(model["nodes"])
        n={"name":PRE+name,"mesh":meshes[mesh],"translation":list(center),"scale":list(scale),
           "extras":{"scene":"RG-GAME-02","episode":"EP01","shot":"S01","revision":SCRIPT_VERSION,
                "design_group":group,"camera_direction":"+Z -> -Z",
                "approval":"PENDING","filmed_1_to_1_match":"NOT_RUN",
                "collision_qa":"NOT_RUN"}}
        if rot:n["rotation"]=rot
        model["nodes"].append(n)
        model["scenes"][model.get("scene",0)].setdefault("nodes",[]).append(idx)
        groups[group]+=1
        return idx
    # Existing hallway from z=-8.2 through z=+12.5 (glTF coordinate frame).
    # The film image sees doors LEFT/windows RIGHT; camera must look from +Z toward -Z.
    # To preserve pre-existing side staircase in canonical model, construct a NEW far
    # scene-state stair that goes straight up at negative z, on the same y=4.0 floor.
    # "New" is not "correct" until compared with Bessy's exit shot.
    y0=4.00
    stair_cx=-71.05
    width=1.62
    first_z=-8.18
    step_d=.290
    riser=.165
    steps=14
    for i in range(steps):
        # Solid riser volume plus a separate pale nosing strip.
        z=first_z-(i+.5)*step_d
        height=(i+1)*riser
        add(f"ascending_tread_{i:02d}","step",(stair_cx,y0+height/2,z),
            (width,height,step_d+.012),"ascending_treads")
        add(f"ascending_nosing_{i:02d}","edge",
            (stair_cx,y0+height-.008,z+.113),
            (width+.09,.023,.036),"ascending_treads")
    top_y=y0+steps*riser
    last_z=first_z-steps*step_d
    add("upper_landing","step",(stair_cx,top_y-.075,last_z-.48),
        (2.4,.15,1.03),"stair_landing")
    # Two railings, on EITHER side of ascending flight, roughly waist height.
    for edge,x in (("L",stair_cx-width/2-.125),("R",stair_cx+width/2+.125)):
        for i in (0,2,4,6,8,10,12):
            z=first_z-(i+.5)*step_d
            foot=y0+(i+1)*riser
            add(f"baluster_{edge}_{i:02d}","baluster",(x,foot+.45,z),
                (.09,.9,.09),"stair_balustrades")
        # Rail length oriented from beginning to end via quaternion about X
        start=(x,y0+.95,first_z+.05)
        end=(x,top_y+.95,last_z-.05)
        dy,dz=end[1]-start[1],end[2]-start[2]
        theta=math.atan2(-dy,dz)
        distance=math.hypot(dz,dy)
        add(f"ascending_handrail_{edge}","edge",
           (x,(start[1]+end[1])/2,(start[2]+end[2])/2),
           (.11,.11,distance),"stair_balustrades",
           [math.sin(theta/2),0,0,math.cos(theta/2)])
        for i in (0,3,6,9,12):
            z=first_z-(i+.5)*step_d
            y=y0+(i+1)*riser+.96
            add(f"baluster_cap_{edge}_{i:02d}","edge",
                (x,y,z),(.19,.09,.19),"stair_balustrades")

    # Extend stone enclosure down the original hall axis. Ends at a wall behind
    # the upper landing; no opaque solid wall across the entire new stair flight.
    for side,x in (("west",-72.54),("east",-68.63)):
        add(f"{side}_stairwell_outerwall","limestone",(x,5.60,-10.55),
            (.19,3.24,5.12),"rear_walls")
    # Back wall / high pointed-lancet window is a VISUAL end-of-flight backdrop,
    # positioned behind the stair. Gap is framed by masonry jambs and high glass.
    end_z=last_z-1.05
    # end center around -13.295 ; place wall columns and upper/lower spandrels
    for label,x in (("left",-72.0),("right",-69.35)):
        add(f"far_wall_{label}_pier","limestone",(x,5.25,end_z),(.90,2.60,.25),"rear_walls")
    add("backwall_base","limestone",(-70.68,4.67,end_z),(2.05,1.20,.25),"rear_walls")
    add("backwall_arch_header","limestone",(-70.68,7.55,end_z),(2.25,.33,.27),"rear_walls")
    add("lancet_tall_window_glass","glow",(-70.68,6.42,end_z+.14),
        (1.53,1.95,.045),"rear_lancet")
    for side,x in (("left",-71.46),("right",-69.90)):
        add(f"window_jamb_{side}","frame",(x,6.35,end_z+.12),
            (.10,2.10,.15),"rear_lancet")
    add("window_mullion","frame",(-70.68,6.37,end_z+.16),
        (.064,1.92,.07),"rear_lancet")
    add("window_transom","frame",(-70.68,6.68,end_z+.17),
        (1.57,.09,.07),"rear_lancet")
    add("window_lancet_crest","frame",(-70.68,7.55,end_z+.18),
        (1.66,.12,.14),"rear_lancet")
    # Floor extension beyond existing z=-8.2 under ascending stair (for collision image).
    add("hall_to_new_flight_subfloor","step",(-70.61,3.91,-10.41),
        (3.73,.18,5.00),"stair_extension_floor")

    model["buffers"][0]["byteLength"]=len(buf)
    jb=json.dumps(model,ensure_ascii=False,separators=(",",":")).encode("utf8")
    jb+=b" "*((-len(jb))%4);buf+=b"\x00"*((-len(buf))%4)
    total=12+8+len(jb)+8+len(buf)
    glb=struct.pack("<4sII",core.MAGIC,2,total)+struct.pack("<II",len(jb),core.CHUNK_JSON)+jb+struct.pack("<II",len(buf),core.CHUNK_BIN)+bytes(buf)
    dest=OUT/"lahudi-academy_ep01_s01_corridor_v4_stair_review.glb"
    dest.write_bytes(glb)
    parsed,binary,_=core.load_glb(dest)
    assert len(parsed["nodes"])==len(model["nodes"])
    assert all(parsed["nodes"][i].get("name")==names[i] for i in range(before_nodes))
    assert all(parsed["nodes"][i].get("mesh")==model["nodes"][i].get("mesh") for i in range(before_nodes))
    assert parsed["scenes"][model.get("scene",0)]["nodes"][:len(before_scenes[model.get("scene",0)])]==before_scenes[model.get("scene",0)]
    assert sum(groups.values())==len(model["nodes"])-before_nodes
    assert groups["ascending_treads"]==28
    report={
      "revision":SCRIPT_VERSION,"status":"REVIEW_ONLY_FAR_STAIR_DIRECTION_CANDIDATE",
      "source_sha256":prev["result_sha256"],"output_sha256":hashlib.sha256(glb).hexdigest(),
      "bytes":len(glb),"added_nodes_stage4":len(model["nodes"])-before_nodes,
      "added_groups":groups,"left_doors_right_windows_view":"+Z looking -Z",
      "far_stair_floor":y0,"far_stair_top":top_y,"tread_count":steps,
      "stair_center_x":stair_cx,"stair_origin_z":first_z,"stair_far_z":last_z,
      "validation":{"glb_reparse":"PASS","preexisting_nodes_untouched":"PASS",
        "all_existing_scene_roots_retained":"PASS","S06_untouched":True,
        "author_acceptance":"PENDING","original_film_camera_match":"NOT_RUN",
        "film_stair_geometry_match":"NOT_VERIFIED","actor_path":"NOT_TESTED",
        "original_side_stair_unchanged":True,"production_model_untouched":True},
      "notes":[
        "Makes a new straight ascending far-end flight for positive-Z looking negative-Z camera composition.",
        "The original side-descending staircase at z~10.2 remains in the GLB; this is a scenario-specific design variant, not a single verified circulation system.",
        "Decorative six door leaves remain not-passable because the underlying source wall is solid.",
        "Winter glass is a placeholder; warm sun beams, snowy exterior, and photoreal material remain pending.",
        "No automatic production merge; S01 A01/A02/A03 camera overlay required."
      ]
    }
    (OUT/"report_v4.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False))
    return report

if __name__=="__main__": build()
