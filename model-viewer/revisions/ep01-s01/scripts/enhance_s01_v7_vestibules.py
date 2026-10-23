#!/usr/bin/env python3
"""EP01-S01 V7: doorway vestibule dress and passage checks, not finished classrooms.
Source is already generated V6; exact hash guard prevents accidental overwrites.
This is a non-destructive, stage-only GLB candidate. No edits to canonical model or S06.
"""
from pathlib import Path
import hashlib, json, math, struct, sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_s01_candidate as glb

ROOT=Path("model-viewer/staged-output/ep01-s01/v6")
INPUT=ROOT/"lahudi-academy_ep01_s01_v6_open_doors_review.glb"
V6_HASH="d062b88d2553d9ef0bbbce5da77980460ba65ad993cbcaf41c77112af27ec069"
OUT=Path("candidate-output")
OUTPUT=OUT/"lahudi-academy_ep01_s01_v7_vestibules_review.glb"
REPORT=OUT/"report_v7.json"
PREFIX="RG-GAME-02-EP01-S01-REV7__"
DOORS=(-5.53,-2.53,.47,3.47,6.47,9.47)
FLOOR=4.0

def main():
    data=INPUT.read_bytes()
    assert hashlib.sha256(data).hexdigest()==V6_HASH,"V6 hash changed"
    prior=json.loads((ROOT/"report_v6.json").read_text())
    assert prior["sha256"]==V6_HASH and prior["geometry_checks"]=="PASS"
    assert len(prior["functional_open_door_apertures"])==6
    model,buf,_=glb.load_glb(INPUT)
    old_nodes=len(model["nodes"])
    old_node_data=json.dumps(model["nodes"],ensure_ascii=False,separators=(",",":"))
    old_scenes=[list(s.get("nodes",[])) for s in model["scenes"]]
    assert not any(n.get("name","").startswith(PREFIX) for n in model["nodes"])
    def mat(name,rgb,rough=.8,metal=.0,emissive=None):
        obj={"name":name,"doubleSided":True,
             "pbrMetallicRoughness":{"baseColorFactor":[*rgb,1.0],
             "roughnessFactor":rough,"metallicFactor":metal}}
        if emissive is not None:obj["emissiveFactor"]=emissive
        mats=model.setdefault("materials",[])
        mats.append(obj);return len(mats)-1
    colors={
       "limestone":mat("S01_REV7__shadowed_niche_wall",(.375,.38,.40),.88),
       "floor":mat("S01_REV7__worn_niche_floor",(.34,.34,.35),.45),
       "oak":mat("S01_REV7__inside_door_oak",(.24,.16,.10),.62),
       "edge":mat("S01_REV7__door_stone_edge",(.57,.56,.55),.68),
       "books":mat("S01_REV7__deep_oxblood_books",(.23,.11,.14),.75),
       "glass":mat("S01_REV7__dark_teal_interior_glass",(.22,.34,.35),.34,.05),
       "light":mat("S01_REV7__warm_niche_lamp",(.75,.52,.25),.48,0,[.18,.09,.025]),
    }
    meshes={name:glb.add_cube_mesh(model,buf,mid) for name,mid in colors.items()}
    active=model["scenes"][model.get("scene",0)]
    groups={k:0 for k in ["threshold","side_wall","back_wall","roof","bookshelf","scenery","light","jamb","skirting"]}
    node_ids=[]
    def put(name,style,c,sc,group):
        assert group in groups and all(v>0 for v in sc), (name,sc)
        n={"name":PREFIX+name,"mesh":meshes[style],"translation":list(c),"scale":list(sc),
           "extras":{"revision":"S01-V7-VESTIBULES-REVIEW","role":group,
             "shooting_scene":"EP01-S01","camera_qa":"PENDING",
             "collision_qa":"OPENING_AXIS_GEOMETRY_ONLY","author_approval":"PENDING",
             "not_complete_room":True}}
        node_ids.append(len(model["nodes"]));model["nodes"].append(n)
        active.setdefault("nodes",[]).append(node_ids[-1]);groups[group]+=1
    # Each of the six 1.52-1.58m clear openings stays unobstructed at doorway x=-72.55.
    # Vestibules are shallow screen-visible alcoves, not six invented full classrooms.
    # Last door borders an original staircase area; depth is reduced to avoid the
    # known stairwell x<-74.5 at z>=10.2 (legacy geometry remains untouched).
    room_depths=(2.35,2.35,2.35,2.35,2.35,1.28)
    vestibules=[]
    for k,(z,depth,door) in enumerate(zip(DOORS,room_depths,prior["functional_open_door_apertures"]),1):
        gap=door["clear_width_m"]
        assert gap>=1.50
        x_front=-72.65
        x_back=x_front-depth
        x_mid=(x_front+x_back)/2
        # Interior occupancy is behind the S01 west wall; threshold at x=-72.80
        # leaves a continuous 1.50m+ aperture in Z and no horizontal obstruction.
        put(f"door{k:02d}_step_slab","floor",(-72.82,FLOOR-.046,z),
            (.44,.090,gap-.045),"threshold")
        put(f"door{k:02d}_floor","floor",(x_mid,FLOOR-.047,z),
            (depth,.090,2.54),"threshold")
        put(f"door{k:02d}_rear_wall","limestone",(x_back-.025,5.50,z),
            (.11,3.02,2.56),"back_wall")
        put(f"door{k:02d}_return_wall_low_z","limestone",(x_mid,5.50,z-1.285),
            (depth,.0+3.02,.10),"side_wall")
        put(f"door{k:02d}_return_wall_high_z","limestone",(x_mid,5.50,z+1.285),
            (depth,3.02,.10),"side_wall")
        put(f"door{k:02d}_roof","limestone",(x_mid,7.03,z),(depth,.14,2.58),"roof")
        for z_dir,sgn in (("minus",-1),("plus",1)):
            put(f"door{k:02d}_{z_dir}_baseboard","oak",(x_mid,4.12,z+sgn*1.224),
                (depth,.21,.07),"skirting")
        # Restrained room set dressing at back x; NOT at corridor entry or within doorway clear width.
        put(f"door{k:02d}_wood_cabinet","oak",(x_back+.31,4.63,z-.62),
            (.33,1.16,.39),"bookshelf")
        for shelf in range(3):
            put(f"door{k:02d}_book_shelf_{shelf}","books",
                (x_back+.13,4.39+shelf*.31,z-.63),(.08,.13,.30),"bookshelf")
        put(f"door{k:02d}_rear_glazed_panel","glass",
            (x_back+.090,5.55,z+.48),(.025,1.31,.92),"scenery")
        put(f"door{k:02d}_glass_top_trim","oak",
            (x_back+.107,6.26,z+.48),(.05,.09,1.02),"scenery")
        put(f"door{k:02d}_wall_lamp","light",
            (x_back+.158,6.55,z-.48),(.12,.22,.14),"light")
        # Frame-depth reveal along +/−Z jamb, lateral outside aperture so clear width is not reduced.
        for label,side in (("minus",-1),("plus",1)):
            put(f"door{k:02d}_reveal_{label}","edge",
                (-72.76,5.16,z+side*(gap/2+.065)),
                (.33,2.36,.07),"jamb")
        vestibules.append({"door":k,"center_z_m":z,"depth_m":depth,
          "clear_width_m":gap,"threshold_m":FLOOR,
          "has_back_wall":True,"has_side_walls":True,"has_floor":True,
          "room_purpose":"UNASSIGNED_BEYOND_CAMERA_FRUSTUM"})
    assert len(model["nodes"])==old_nodes+len(node_ids)
    assert len(vestibules)==6 and groups["threshold"]==12
    assert all(v["clear_width_m"]>=1.50 for v in vestibules)
    # Verify original V6 node set is byte-for-byte identical at JSON node level.
    assert json.dumps(model["nodes"][:old_nodes],ensure_ascii=False,separators=(",",":"))==old_node_data
    assert active["nodes"][:len(old_scenes[model.get("scene",0)])]==old_scenes[model.get("scene",0)]
    model["buffers"][0]["byteLength"]=len(buf)
    raw=json.dumps(model,ensure_ascii=False,separators=(",",":")).encode("utf-8")
    raw+=b" "*((-len(raw))%4)
    buf+=b"\x00"*((-len(buf))%4)
    out=(struct.pack("<4sII",b"glTF",2,12+8+len(raw)+8+len(buf))+
         struct.pack("<II",len(raw),glb.CHUNK_JSON)+raw+
         struct.pack("<II",len(buf),glb.CHUNK_BIN)+bytes(buf))
    OUT.mkdir(exist_ok=True,parents=True)
    OUTPUT.write_bytes(out)
    m,bin2,_=glb.load_glb(OUTPUT)
    assert len(m["nodes"])==len(model["nodes"])
    assert len(bin2)==len(buf)
    assert all("mesh" in m["nodes"][i] for i in node_ids)
    report={
      "scene":"EP01-S01","version":"S01-V7-VESTIBULES-REVIEW",
      "status":"REAL_GLB_BUILT_REVIEW_ONLY",
      "input_v6_sha256":V6_HASH,"sha256":hashlib.sha256(out).hexdigest(),
      "bytes":len(out),"model":OUTPUT.name,"source_nodes_preserved":old_nodes,
      "added_nodes":len(node_ids),"groups":groups,
      "vestibules":vestibules,
      "validation":{"glb_reparse":"PASS","V6_node_graph_unchanged":True,
        "scene_roots_preserved":True,"six_openings_preserved":True,
        "all_six_have_screen_depth":True,"no_new_geometry_in_S06":True,
        "source_side_stairs_preserved":True,
        "3d_browser_render":"NOT_RUN","full_mesh_collision":"NOT_RUN",
        "camera_overlay":"NOT_RUN","author_approved":False},
      "known_limits":[
        "Vestibules are 1.28–2.35m deep partial rooms only; unseen Academy classrooms are not fully specified.",
        "Existing legacy geometry behind doorways was not exhaustively collision-tested.",
        "Room purpose and furniture beyond shallow camera-visible zone remain unassigned.",
        "Front and side stairs both exist in this rehearsal asset; filmed staircase route not accepted.",
        "This is a separate candidate. Public V5 and five canonical models remain unchanged."
      ]}
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
