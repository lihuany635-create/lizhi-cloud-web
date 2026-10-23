#!/usr/bin/env python3
"""Academy-wide CURRENTLY IDENTIFIED INTERIOR CORRIDOR retrofit to Gothic RB2 style.
REAL FULL-SCHOOL GLB with preserved classrooms/library/exterior, not separate hallway mockup.
No rendering, no canonical overwrite, no actor animation claims.
"""
from pathlib import Path
import json, math, struct, hashlib, copy, sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb

SOURCE=Path("model-viewer/lahudi-academy.glb")
SOURCE_SHA="33c99f530c444ddd8b48542566eebf5579d6f1f3cec9755ccd16d4d62898d324"
OUTPUT=Path("candidate-output/academy-wide-corridors")
FILE=OUTPUT/"lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v1.glb"
PREFIX="RG-GAME-02-ALLCOR-RB2__"
XLEFT=-72.5
XRIGHT=-68.0
XC=(XLEFT+XRIGHT)/2
Z0=-67.5
Z1=17.92
YF=4.0
BAYS=20
STEP=(Z1-Z0)/BAYS
A1_DOOR=-47.7
C_DOOR=-23.7

def zone(z):
    if -58.7<=z<=-52.2:return "roof_stair_lobby"
    if -49<=z<=-39:return "classroom_A1"
    if -25<=z<=-15:return "classroom_C"
    if -8.2<=z<=12.7:return "confession"
    if z>=12.7:return "entrance_lobby"
    return "connector"

def vault_y(x, high=False):
    t=(x-XLEFT)/(XRIGHT-XLEFT)
    base=7.34 if not high else 9.6
    peak=9.42 if not high else 12.2
    return base+(peak-base)*(1-abs(2*t-1)**.68)

def main():
    raw=SOURCE.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==SOURCE_SHA,"Academy canonical source unexpectedly changed"
    m,buf,_=glb.load_glb(SOURCE)
    orig_nodes=len(m["nodes"])
    assert orig_nodes==7725,("original node count",orig_nodes)
    before=copy.deepcopy(m["nodes"])
    orig_scenes=[list(s.get("nodes",[])) for s in m["scenes"]]
    assert any(n.get("name")=="RG-GAME-02-ACOR-002__floor" for n in before)
    assert any(n.get("name")=="RG-GAME-02-A1-005__open_door" for n in before)
    assert any(n.get("name")=="RG-GAME-02-CROOM-005__open_door" for n in before)
    assert not any(n.get("name","").startswith(PREFIX) for n in before)
    removed=[]
    def mesh_bbox(mesh_id):
        mins=[];maxs=[]
        for p in m["meshes"][mesh_id].get("primitives",[]):
            pa=p.get("attributes",{}).get("POSITION")
            if pa is None:continue
            a=m["accessors"][pa]
            if "min" in a:
                mins.append(a["min"]);maxs.append(a["max"])
        if not mins:return None
        return ([min(a[k] for a in mins) for k in range(3)],
                [max(a[k] for a in maxs) for k in range(3)])
    for i,n in enumerate(m["nodes"]):
        name=n.get("name","")
        if "mesh" not in n:continue
        # Rebuild only surfaces that conflict with the shared corridor look.
        # Preserve campus, external school buildings, real classrooms and stairs.
        disable=(name=="RG-GAME-02-ACOR-002__floor" or
          name.startswith("RG-GAME-02-ACOR-002__light_fixture") or
          name in ("RG-GAME-02-CONFESS-005__occlusion_wall",
                   "RG-GAME-02-CONFESS-005__end_wall",
                   "RG-GAME-02-CONFESS-005__side_header") or
          name.startswith("RG-GAME-02-CONFESS-001__"))
        if name.startswith("RG-GAME-02-EXT-002__"):
            bb=mesh_bbox(n["mesh"])
            # Only the east exterior wall/window line next to the main corridor.
            # All west classroom perimeter walls and their windows remain unchanged.
            if bb and bb[0][0]>-69.0:disable=True
        if disable:
            original_id=n.pop("mesh")
            n.setdefault("extras",{})["review_backup_mesh"]=original_id
            n["extras"]["corridor_replacement"]=PREFIX
            removed.append({"index":i,"name":name,"mesh":original_id})
    assert len(removed)>=20,("Unexpected old corridor inventory",len(removed))
    orig_disabled={x["index"] for x in removed}
    palette={
      "stone":([.40,.42,.46,1],.82,.01),
      "stone_carving":([.61,.60,.59,1],.64,.03),
      "stone_dark":([.24,.26,.30,1],.78,.01),
      "floor":([.22,.24,.29,1],.14,.10),
      "floor_border":([.09,.10,.13,1],.18,.08),
      "wood":([.19,.105,.075,1],.54,.02),
      "wood_trim":([.30,.17,.12,1],.50,.02),
      "brass":([.62,.40,.14,1],.28,.73),
      "glass":([.75,.83,.91,.29],.24,.02),
      "lamp":([.96,.68,.32,1],.36,.02),
      "snow":([.88,.91,.94,1],.91,0),
    }
    material={}
    meshes={}
    for k,(rgba,rough,metal) in palette.items():
        mat={"name":"ACADEMY_ALL_CORRIDORS_RB2__"+k,"doubleSided":True,
             "pbrMetallicRoughness":{"baseColorFactor":rgba,"roughnessFactor":rough,"metallicFactor":metal}}
        if rgba[3]<1:mat["alphaMode"]="BLEND"
        if k=="lamp":mat["emissiveFactor"]=[.45,.25,.09]
        m.setdefault("materials",[]).append(mat)
        material[k]=len(m["materials"])-1
        meshes[k]=glb.add_cube_mesh(m,buf,material[k])
    counts={}
    node_names=[]
    zones={}
    root=m["scenes"][m.get("scene",0)].setdefault("nodes",[])
    def make(group,name,style,pos,dim,zlabel,extra=None):
        assert all(math.isfinite(float(v)) for v in (*pos,*dim))
        assert min(dim)>.0005,(name,dim)
        nm=PREFIX+name
        assert nm not in node_names
        n={"name":nm,"mesh":meshes[style],
           "translation":[round(float(x),5) for x in pos],
           "scale":[round(float(x),5) for x in dim],
           "extras":{"type":group,"zone":zlabel,"style":"RB2-GOTHIC-WINTER",
                     "school":"LAHUDI","status":"CANDIDATE",
                     "author_acceptance":"PENDING"}}
        if extra:n["extras"].update(extra)
        index=len(m["nodes"])
        m["nodes"].append(n);root.append(index)
        node_names.append(nm);counts[group]=counts.get(group,0)+1
    def arch_piece(name,a,b,zdepth,style,group,zon):
        dx=b[0]-a[0];dy=b[1]-a[1];span=math.hypot(dx,dy)
        angle=math.atan2(dy,dx)
        n={"name":PREFIX+name,"mesh":meshes[style],
           "translation":[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],
           "rotation":[0,0,math.sin(angle/2),math.cos(angle/2)],
           "scale":[span*1.018,.070,zdepth],
           "extras":{"type":group,"zone":zon,"style":"RB2-GOTHIC-WINTER",
                     "school":"LAHUDI","author_acceptance":"PENDING"}}
        assert span>0
        m["nodes"].append(n);root.append(len(m["nodes"])-1)
        counts[group]=counts.get(group,0)+1
        node_names.append(n["name"])
    def arched_band(k,z,width,style,group,high,zon,parts=16):
        xs=[XLEFT+(XRIGHT-XLEFT)*i/parts for i in range(parts+1)]
        for i in range(parts):
            x0,x1=xs[i:i+2]
            a=(x0,vault_y(x0,high),z)
            b=(x1,vault_y(x1,high),z)
            arch_piece(f"bay{k:02d}_{group}_{i:02d}",a,b,width,style,group,zon)
    # Primary corridor: exact native geometry coordinates, continuous from roof approach to entrance.
    make("continuous_floor","corridor_level4_stone_slab","floor",
         (XC,3.944,(Z0+Z1)/2),(XRIGHT-XLEFT,.112,Z1-Z0),"entire_corridor")
    for x,side in ((XLEFT+.18,"left"),(XRIGHT-.18,"right")):
        make("floor_border",f"floor_border_{side}","floor_border",
             (x,4.012,(Z0+Z1)/2),(.19,.023,Z1-Z0),"entire_corridor")
    for k in range(BAYS):
        za=Z0+k*STEP;zb=Z0+(k+1)*STEP;zc=(za+zb)*.5
        typ=zone(zc);zones[typ]=zones.get(typ,0)+1
        high=typ=="roof_stair_lobby" or (za<-52.2 and zb>-58.7)
        arched_band(k,zc,STEP+.015,"stone","vault_surface",high,typ,22)
        arched_band(k,za,.16,"stone_carving","rib",high,typ,18)
        # Floor tile patterns will not block actor foot path.
        make("tile",f"floor_seam_{k:02d}","floor_border",
             (XC,4.009,za),((XRIGHT-XLEFT)-.58,.009,.023),typ)
        # Gothic pilaster capitals and continuous wood dado on both sides.
        for side,x in (("left",XLEFT+.16),("right",XRIGHT-.16)):
            make("pilaster",f"pillar_{side}_{k:02d}","stone_carving",
                 (x,5.53,za),(.31,3.05,.30),typ)
            make("capital",f"capital_{side}_{k:02d}","stone_carving",
                 (x,7.095,za),(.45,.29,.46),typ)
        make("dado",f"right_wood_base_{k:02d}","wood",
             (XRIGHT-.06,4.42,zc),(.20,.78,STEP-.25),typ)
        make("window",f"high_window_glass_{k:02d}","glass",
             (XRIGHT+.04,5.85,zc),(.055,2.18,STEP-.38),typ)
        for j,zz in enumerate((za+.16,zc,zb-.16)):
            make("tracery",f"window_stone_mullion_{k:02d}_{j}","stone_carving",
                 (XRIGHT-.045,5.82,zz),(.16,2.42,.12),typ)
        make("tracery",f"window_upper_transom_{k:02d}","stone_dark",
             (XRIGHT-.06,6.85,zc),(.18,.09,STEP-.23),typ)
        make("window",f"window_sill_{k:02d}","stone_carving",
             (XRIGHT-.16,4.75,zc),(.51,.16,STEP-.22),typ)
        # Left side: preserve native real doors of both known classrooms.
        # Also leave the CONFESS side-stair opening clear near z~10.2-12.5.
        overlaps_class=((za<-47.1 and zb>-48.3) or (za<-23.1 and zb>-24.3))
        overlaps_side_stair=(za<12.5 and zb>10.2)
        if not overlaps_class and not overlaps_side_stair:
            make("left_wall",f"left_wall_back_{k:02d}","stone",
                 (XLEFT-.03,5.59,zc),(.18,3.16,STEP-.04),typ)
            make("door_panel",f"recessed_oak_door_{k:02d}","wood",
                 (XLEFT+.074,5.22,zc),(.065,2.32,1.56),typ,
                 {"function":"decorative_until_adjacent_room_is_modeled"})
            for off,side in ((-.92,"a"),(.92,"b")):
                make("door_frame",f"oak_door_jamb_{k:02d}_{side}","wood_trim",
                     (XLEFT+.14,5.26,zc+off),(.15,2.50,.17),typ)
            make("door_frame",f"oak_door_lintel_{k:02d}","stone_carving",
                 (XLEFT+.14,6.57,zc),(.24,.21,2.09),typ)
        elif overlaps_class:
            # Real source 1.20m opening at x=-72.5; protect its threshold.
            for d,name in ((A1_DOOR,"A1"),(C_DOOR,"CROOM")):
                if za<=d<=zb:
                    for off,side in ((-.74,"minus"),(.74,"plus")):
                        make("real_classroom_jamb",f"{name}_jamb_{side}",
                             "stone_carving",(XLEFT+.17,5.13,d+off),
                             (.24,2.26,.17),typ)
                    make("real_classroom_lintel",f"{name}_lintel",
                         "stone_carving",(XLEFT+.18,6.39,d),
                         (.24,.18,1.52),typ)
        elif overlaps_side_stair:
            make("turning_lobby",f"side_stair_carved_head_{k:02d}","stone_carving",
                 (XLEFT+.12,7.14,zc),(.28,.22,STEP-.20),typ)
        # Warm sconces on the left do not depend on renderer lights.
        make("sconce",f"brass_sconce_back_{k:02d}","brass",
             (XLEFT+.32,6.73,zc),(.13,.35,.25),typ)
        make("sconce",f"brass_sconce_arm_{k:02d}","brass",
             (XLEFT+.50,6.67,zc),(.36,.065,.06),typ)
        make("sconce",f"amber_diffuser_{k:02d}","lamp",
             (XLEFT+.68,6.86,zc),(.14,.30,.18),typ)
        if typ=="confession":
            make("reflective_inlay",f"confession_floor_darkband_{k:02d}",
                 "floor_border",(XC,4.013,zc),(.14,.018,STEP-.34),typ)
    # Stage-wide Gothic entry and roof stair identity; preserve original mesh stairs.
    for st,z in (("north_roof",-53.3),("entry",17.12)):
        make("portal_header",f"{st}_gothic_entry_head","stone_carving",
             (XC,7.41,z),(3.83,.28,.20),st)
        for s,x in (("left",XLEFT+.33),("right",XRIGHT-.33)):
            make("portal_jamb",f"{st}_stone_pier_{s}","stone_carving",
                 (x,5.57,z),(.36,3.09,.32),st)
    # Non-rendering engineering proof: no changes to real school class nodes.
    assert all(m["nodes"][i]==before[i] for i in range(orig_nodes) if i not in orig_disabled)
    assert all("mesh" not in m["nodes"][i] and m["nodes"][i]["extras"]["review_backup_mesh"]==before[i]["mesh"] for i in orig_disabled)
    assert len(m["nodes"])==orig_nodes+len(node_names)
    assert m["scenes"][m.get("scene",0)]["nodes"][:len(orig_scenes[m.get("scene",0)])]==orig_scenes[m.get("scene",0)]
    assert counts["vault_surface"]==BAYS*22 and counts["rib"]==BAYS*18
    assert counts["window"]==BAYS*2
    assert counts["continuous_floor"]==1
    assert counts["real_classroom_jamb"]==4
    m["buffers"][0]["byteLength"]=len(buf)
    jb=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode("utf8")
    jb+=b" "*((-len(jb))%4)
    buf+=b"\x00"*((-len(buf))%4)
    final=b"".join((struct.pack("<4sII",glb.MAGIC,2,12+8+len(jb)+8+len(buf)),
                    struct.pack("<II",len(jb),glb.CHUNK_JSON),jb,
                    struct.pack("<II",len(buf),glb.CHUNK_BIN),bytes(buf)))
    OUTPUT.mkdir(parents=True,exist_ok=True)
    FILE.write_bytes(final)
    verify,binary,_=glb.load_glb(FILE)
    assert len(verify["nodes"])==len(m["nodes"]) and len(binary)==len(buf)
    report={
      "scene":"RG-GAME-02","name":"拉乎迪學院","version":"ACADEMY-RB2-GOTHIC-ALL-CORRIDORS-V1",
      "status":"REAL_COMPLETE_SCHOOL_GLB_REVIEW_ONLY","model":FILE.name,
      "source_canonical_glb_sha256":SOURCE_SHA,
      "output_sha256":hashlib.sha256(final).hexdigest(),"bytes":len(final),
      "source_nodes":orig_nodes,"result_nodes":len(verify["nodes"]),
      "disabled_legacy_corridor_nodes":len(removed),
      "legacy_geometry_restorable":True,
      "added_corridor_nodes":len(node_names),
      "corridor_length_m":Z1-Z0,"corridor_width_m":XRIGHT-XLEFT,
      "corridor_world_range":{"x":[XLEFT,XRIGHT],"y_floor":YF,"z":[Z0,Z1]},
      "native_classes_preserved":["RG-GAME-02-A1-005","RG-GAME-02-CROOM-005"],
      "native_staircases_preserved":["RG-GAME-02-ROOF-001","RG-GAME-02-CONFESS-005__tread_"],
      "zones":zones,"added_groups":counts,
      "disabled":removed,
      "structural_gltf_roundtrip":"PASS",
      "existing_non_corridor_node_structure_unchanged":True,
      "rendering":"NOT_RUN_BY_USER_REQUEST",
      "camera_film_overlay":"NOT_RUN",
      "actor_collision":"NOT_RUN",
      "full_school_hallway_coverage":"ALL_DISCOVERED_ACOR-002_CONTINUOUS_INTERIOR_PATH; OTHER_CAMPUS_HALL OBJECTS_REQUIRE_SEMANTIC_SURVEY",
      "separate_campus_halls":"EXTERIOR_ARCHITECTURAL_HALL_LABELS_NOT_ASSUMED_WALKABLE_INTERIOR",
      "formal_author_approval":False,"canonical_main_untouched":True,
      "notes":[
        "One integrated academy GLB, not loose detached corridor modules.",
        "Entire measured main school interior corridor from roof stair to campus entrance dressed consistently.",
        "The two confirmed classroom doorways and original entrance/roof/side stairs remain in place.",
        "Unassigned oak-door shapes are explicitly decorative, not invented passable rooms.",
        "Original exterior north/south walls and library geometry remain; distant campus exterior hall shells not classified as connected walkable corridor.",
        "No rendering was executed. Physical navigation and actor collision remain unverified."
      ]
    }
    (OUTPUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({k:v for k,v in report.items() if k not in ("disabled","notes")},ensure_ascii=False),flush=True)

if __name__=="__main__":main()
