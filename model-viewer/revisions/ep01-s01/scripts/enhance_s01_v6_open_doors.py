#!/usr/bin/env python3
"""EP01 S01 V6: replace one known solid source corridor wall with six real door apertures.
Does not alter canonical GLB, remote stair, other buildings, or S06.
Based on audited source node #7675 and pinned SHA256 of reviewed V5.
"""
from pathlib import Path
import hashlib,json,math,struct,re,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_s01_candidate as glb

SOURCE=Path("model-viewer/staged-output/ep01-s01/v5/lahudi-academy_ep01_s01_corridor_v5_art_review.glb")
DEST=Path("candidate-output/lahudi-academy_ep01_s01_v6_open_doors_review.glb")
REP=Path("candidate-output/report_v6.json")
EXPECTED_V5="c875ba7f00814840723615942a523e9617d55457f3943216325b61343461e66e"
PREFIX="RG-GAME-02-EP01-S01-REV6__"
WALL="RG-GAME-02-CONFESS-005__occlusion_wall"
DOOR_CENTERS=(-5.53,-2.53,.47,3.47,6.47,9.47)
WALL_LEFT,WALL_RIGHT=-8.2,10.2
LOWER,TALL=4.0,7.3
HALF_DOOR=.79
DOOR_TOP=6.40

def main():
    original=SOURCE.read_bytes()
    assert hashlib.sha256(original).hexdigest()==EXPECTED_V5,"Unexpected V5 base changed"
    model,buf,_=glb.load_glb(SOURCE)
    before_names=[n.get("name") for n in model["nodes"]]
    before_len=len(before_names)
    assert len(before_names)==8121,("Unexpected V5 node count",before_len)
    # Audited model has mesh vertices baked to actual world coordinates; its node
    # translation is zero. The source wall must be restored from mesh index later.
    source_index=next(i for i,n in enumerate(model["nodes"]) if n.get("name")==WALL)
    assert source_index==7675,source_index
    old_wall=model["nodes"][source_index]
    saved_mesh=old_wall.pop("mesh")
    original_props=old_wall.setdefault("extras",{})
    original_props.update({"S01_V6_replaced_by_segmentation":True,
        "S01_original_mesh_archived_index":saved_mesh,
        "source_scene_unmodified_in_canonical":True,
        "replacement_scope":"EP01-S01 test candidate only"})
    # Mark any closed leaf/panel/cup handles as visually hidden: replace with
    # real hinged open leaves. Retain frame jambs and arch header.
    disabled=[]
    for i,n in enumerate(model["nodes"]):
        name=n.get("name","")
        if not name.startswith("RG-GAME-02-EP01-S01-REV2__"):continue
        is_leaf=bool(re.search(r"__left_door_\d+_leaf$",name))
        is_closed_detail=bool(re.search(r"__door\d+_(recess\d+|raised\d+|lockplate|handle)$",name))
        if is_leaf or is_closed_detail:
            assert "mesh" in n,name
            idx=n.pop("mesh")
            n.setdefault("extras",{})["S01_V6_open_door_replaced"]=True
            n["extras"]["previous_mesh_idx"]=idx
            disabled.append(name)
    leaves=[x for x in disabled if "left_door" in x]
    assert len(leaves)==6,("door leaf count mismatch",len(leaves),leaves)
    assert len(disabled)==42,("Unexpected closed door details",len(disabled))
    def mat(name,rgba,rough):
        a=model.setdefault("materials",[])
        a.append({"name":name,"doubleSided":True,"pbrMetallicRoughness":{
          "baseColorFactor":[*rgba,1],"metallicFactor":0,"roughnessFactor":rough}})
        return len(a)-1
    masonry=glb.add_cube_mesh(model,buf,mat("S01_V6__reconstructed_corridor_masonry",(.43,.435,.45),.8))
    oak=glb.add_cube_mesh(model,buf,mat("S01_V6__working_wooden_door",(.18,.10,.064),.58))
    trim=glb.add_cube_mesh(model,buf,mat("S01_V6__structural_door_lintel",(.56,.55,.54),.78))
    scene=model["scenes"][model.get("scene",0)]
    new_nodes=[]
    def put(name,mesh,pos,scale,kind,rot=None):
        n={"name":PREFIX+name,"mesh":mesh,"translation":list(pos),"scale":list(scale),
          "extras":{"stage":"S01-V6", "model_scope":"RG-GAME-02",
            "geom_role":kind, "author_approval":"PENDING",
            "render_qa":"NOT_RUN","collision_qa":"GEOMETRY_GAP_ONLY"}}
        if rot:n["rotation"]=list(rot)
        model["nodes"].append(n);i=len(model["nodes"])-1
        scene.setdefault("nodes",[]).append(i)
        new_nodes.append(i)
    # Six continuous apertures; z intervals clipped to the actually audited
    # solid wall [-8.2,10.2]. Each opening must span y=4..6.40.
    doors=[];cursor=WALL_LEFT;segments=[]
    for k,c in enumerate(DOOR_CENTERS,1):
        left=max(WALL_LEFT,c-HALF_DOOR);right=min(WALL_RIGHT,c+HALF_DOOR)
        assert left>cursor and right>left,(k,left,right,cursor)
        seg_len=left-cursor
        put(f"wall_segment_before_door{k:02d}",masonry,(-72.55,5.65,(cursor+left)/2),
            (.18,3.3,seg_len),"solid_wall_between_doors")
        segments.append((cursor,left))
        if right-left>0.7:
            lintel_h=TALL-DOOR_TOP
            put(f"lintel_above_door{k:02d}",trim,(-72.55,(DOOR_TOP+TALL)/2,(left+right)/2),
                (.2,lintel_h,right-left),"door_header")
        # Make actual door leaf open 90 degrees into the room (west of x=-72.64).
        # Former flush decorations + panels were disabled above.
        q=[0,math.sin(-math.pi/4),0,math.cos(-math.pi/4)]
        put(f"open_door{k:02d}_leaf",oak,(-73.32,5.19,c-.755),
            (.065,2.38,1.49),"open_door_leaf",rot=q)
        doors.append({"door":k,"z":c,"opening":[round(left,3),round(right,3)],
            "clear_width_m":round(right-left,3),"open_leaf_inside_room":True})
        cursor=right
    if cursor<WALL_RIGHT-.0001:
        put("wall_segment_after_last_door",masonry,(-72.55,5.65,(cursor+WALL_RIGHT)/2),
            (.18,3.3,WALL_RIGHT-cursor),"solid_wall_between_doors")
        segments.append((cursor,WALL_RIGHT))
    # Record verifiable silhouette geometry constraints; rendering / collision
    # are separate QC gates and not automatically declared successful.
    assert len(doors)==6
    assert all(d["clear_width_m"]>=1.45 for d in doors)
    assert sum(1 for x in model["nodes"] if x.get("name","").startswith(PREFIX))>=18
    assert model["nodes"][source_index].get("mesh") is None
    # Preserve all original scene geometry except explicitly identified wall.
    for i in range(7725):
        if i==source_index: continue
        assert model["nodes"][i].get("name")==before_names[i]
    for i in range(7725,before_len):
        assert model["nodes"][i].get("name")==before_names[i]
    assert all(model["nodes"][i].get("name") for i in range(len(model["nodes"])))
    model["buffers"][0]["byteLength"]=len(buf)
    jb=json.dumps(model,separators=(",",":"),ensure_ascii=False).encode()
    jb+=b" "*((-len(jb))%4);buf+=b"\x00"*((-len(buf))%4)
    result=(struct.pack("<4sII",glb.MAGIC,2,12+8+len(jb)+8+len(buf))+
        struct.pack("<II",len(jb),glb.CHUNK_JSON)+jb+
        struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf))
    DEST.parent.mkdir(exist_ok=True,parents=True)
    DEST.write_bytes(result)
    verify,_,_=glb.load_glb(DEST)
    assert len(verify["nodes"])==len(model["nodes"])
    assert verify["nodes"][7675].get("mesh") is None
    stairs=[n for n in verify["nodes"] if n.get("name","").startswith("RG-GAME-02-CONFESS-005__tread_")]
    assert len(stairs)>=20
    report={
        "scene":"EP01-S01","version":"S01-V6-OPEN-DOORS-REVIEW",
        "status":"REAL_GLB_BUILT_REVIEW_ONLY",
        "model":DEST.name,"bytes":len(result),
        "input_v5_sha256":EXPECTED_V5,"sha256":hashlib.sha256(result).hexdigest(),
        "original_long_solid_wall_node":WALL,"source_wall_mesh_backed_up_idx":saved_mesh,
        "source_wall_node_id":source_index,
        "original_wall_render_disabled":True,
        "corridor_wall_segments":len(segments),
        "functional_open_door_apertures":doors,
        "new_mesh_nodes":len(new_nodes),
        "disabled_decorative_leaf_and_panel_nodes":len(disabled),
        "original_side_stair_treads_preserved":len(stairs),
        "v4_front_stair_preserved":True,"S06_untouched":True,
        "original_canonical_model_untouched":True,
        "geometry_checks":"PASS",
        "visual_render":"NOT_RUN",
        "actual_player_collision_walk":"NOT_RUN",
        "film_camera_match":"NOT_RUN",
        "author_approval":"PENDING",
        "known_limits":[
          "Openings exist in S01 wall only; adjoining room interiors and route colliders not yet audited.",
          "Open doors rotate outside the corridor; animation of swinging doors is not authored.",
          "Original side stair remains as existing school geometry; alternative front stair still unapproved.",
          "3D design requires actual renderer and film frame match before replacing published V5."
        ]
    }
    REP.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()
