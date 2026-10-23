#!/usr/bin/env python3
"""Evidence-based EP01 S01 wall/door/stair geometry inventory from the *actual* V5 GLB.
This does NOT certify that existing solid corridor wall openings are walkable.
"""
import json, pathlib, sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
import build_s01_candidate as glb

SOURCE=pathlib.Path("model-viewer/staged-output/ep01-s01/v5/lahudi-academy_ep01_s01_corridor_v5_art_review.glb")
TARGET=pathlib.Path("candidate-output/s01-v5-wall-stair-audit.json")
model,buf,_=glb.load_glb(SOURCE)
nodes=model["nodes"];meshes=model.get("meshes",[]);accessors=model.get("accessors",[])

def box_for(n):
    p=n.get("translation",[0,0,0]);s=n.get("scale",[1,1,1])
    if not n.get("mesh") is None and n["mesh"]<len(meshes):
        xs=[];ys=[];zs=[]
        for prim in meshes[n["mesh"]].get("primitives",[]):
            pos=accessors[prim["attributes"]["POSITION"]]
            a=pos.get("min");b=pos.get("max")
            if not(a and b):continue
            lo=[min(p[i]+a[i]*s[i],p[i]+b[i]*s[i]) for i in range(3)]
            hi=[max(p[i]+a[i]*s[i],p[i]+b[i]*s[i]) for i in range(3)]
            xs.extend([lo[0],hi[0]]);ys.extend([lo[1],hi[1]]);zs.extend([lo[2],hi[2]])
        if xs:return [round(min(xs),3),round(min(ys),3),round(min(zs),3),round(max(xs),3),round(max(ys),3),round(max(zs),3)]
    return None

results=[];original_wall=[];original_stairs=[];candidates=[]
for i,n in enumerate(nodes):
    name=n.get("name","");trans=n.get("translation",[0,0,0]);s=n.get("scale",[1,1,1])
    if len(trans)!=3:continue
    x,y,z=trans;orig=i<7725
    geometry_box=box_for(n)
    near_local=(-74<x<-67 and 2.5<y<9 and -17<z<16)
    near_mesh=bool(geometry_box and geometry_box[0]<-68 and geometry_box[3]>-74
          and geometry_box[1]<8 and geometry_box[4]>3.5
          and geometry_box[2]<13 and geometry_box[5]>-9)
    check=near_local or near_mesh
    named=("CONFESS" in name or "EP01-S01" in name)
    if not(check or named):continue
    rec={"id":i,"name":name[:180],"original":orig,"t":[round(v,3) for v in trans],"s":[round(v,3) for v in s],"aabb_ignoring_rotation":box_for(n)}
    if orig and (near_mesh or check) and any(k in name.lower() for k in ["wall","occlusion","door","panel"]):
        original_wall.append(rec)
    if orig and (check or "CONFESS" in name) and any(k in name.lower() for k in ["stair","tread","landing","riser"]):
        original_stairs.append(rec)
    if ("REV2__left_door" in name or "REV4__ascending_" in name or "REV4__far_" in name or "REV4__west_stair" in name or "REV4__east_stair" in name):
        candidates.append(rec)
    if check and orig and len(results)<450:results.append(rec)
original_wall.sort(key=lambda r:r["name"])
original_stairs.sort(key=lambda r:r["name"])
report={
 "scene":"RG-GAME-02","shot":"S01",
 "source_model":str(SOURCE),"original_node_count":7725,
 "inspected_total_nodes":len(nodes),
 "aabb_note":"Bounds are an aid only: rotation/parent hierarchy not included. Do not derive reliable collision from these numbers.",
 "original_corridor_wall_or_door_nodes":original_wall[:130],
 "original_stair_nodes":original_stairs[:130],
 "candidate_facing_nodes":candidates[:200],
 "original_corridor_other_sample":results[:200],
 "search_method":"GLB mesh accessor world-coordinate AABB; original nodes often have translation=[0,0,0], so local-origin filtering alone is INVALID",
 "non_destructive":True,
 "decision":"DOOR_OPENING_UNVERIFIED_AND_ORIGINAL_SIDE_STAIR_REMAINS",
 "required_next":"Check world transforms and parent graph, then replace only targeted corridor wall geometry, or make scene-specific non-destructive visibility variants."
}
TARGET.parent.mkdir(exist_ok=True,parents=True)
TARGET.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:len(report[k]) for k in ("original_corridor_wall_or_door_nodes","original_stair_nodes","candidate_facing_nodes","original_corridor_other_sample")}))
