#!/usr/bin/env python3
"""RG-GAME-02 academy corridor RB2 V2: stitch its THREE verified stair transitions.
Extends the *integrated full-school GLB* from v1, no rendering, no canonical mutation.
The first-phase central north/south hall spans Z[-67.5,+17.92], X[-72.5,-68].
This pass dresses the side descent at X[-82.8,-72.5], Z[10.2,12.5],
the roof access stair at Z[-58.26,-52.99], and the entry stair Z[17.88,25.43].
Do not claim a navigable stair without actor capsule or mesh ray collision QA.
"""
from pathlib import Path
import sys,json,math,struct,hashlib
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb

ROOT=Path("model-viewer/staged-output/academy-all-corridors-rb2-v1")
SRC=ROOT/"lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v1.glb"
EXPECTED="3ba0261dffb76f277c64f88ad186203335de0b81e5ac1fa3a04cba16d7fe556c"
DST=Path("candidate-output/academy-corridors-rb2-v2")
OUTNAME="lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v2.glb"
PREFIX="RG-GAME-02-ALLCOR-RB2-V2__"
def main():
    assert hashlib.sha256(SRC.read_bytes()).hexdigest()==EXPECTED
    model,buf,_=glb.load_glb(SRC)
    before_node_count=len(model["nodes"])
    assert before_node_count==8931
    frozen_nodes=json.dumps(model["nodes"],ensure_ascii=False,separators=(",",":"))
    assert not any(n.get("name","").startswith(PREFIX) for n in model["nodes"])
    # Reuse the already implemented RB2 materials and cube geometry without adding more palettes.
    mat_ids={m["name"].removeprefix("ACADEMY_ALL_CORRIDORS_RB2__"):i
             for i,m in enumerate(model["materials"]) if m.get("name","").startswith("ACADEMY_ALL_CORRIDORS_RB2__")}
    needs={"stone","stone_carving","stone_dark","wood","wood_trim","brass","lamp","floor","floor_border"}
    assert needs.issubset(mat_ids.keys()),("material missing",needs-set(mat_ids))
    mesh_id={}
    for i,mesh in enumerate(model["meshes"]):
        p=mesh.get("primitives",[])
        if len(p)!=1:continue
        for k,mid in mat_ids.items():
            if p[0].get("material")==mid and k not in mesh_id:mesh_id[k]=i
    assert needs.issubset(mesh_id.keys())
    scene=model["scenes"][model.get("scene",0)]
    root_nodes=scene.setdefault("nodes",[])
    counts={};regions={}
    portal_anchors=[]
    def box(label,style,center,extent,kind,region,props=None):
        assert min(extent)>0 and all(math.isfinite(float(q)) for q in (*center,*extent))
        node={"name":PREFIX+label,"mesh":mesh_id[style],
              "translation":[round(float(q),5) for q in center],
              "scale":[round(float(q),5) for q in extent],
              "extras":{"scene":"RG-GAME-02","type":kind,"region":region,
                        "approved":False,"design":"RB2-GOTHIC-WINTER",
                        **(props or {})}}
        model["nodes"].append(node);root_nodes.append(len(model["nodes"])-1)
        counts[kind]=counts.get(kind,0)+1
        regions[region]=regions.get(region,0)+1
        return node
    def beam(label,style,a,b,thickness,depth,kind,region):
        dx,dy,dz=(b[i]-a[i] for i in range(3))
        assert abs(dz)<1e-6,"Beam uses XY projected orientation only"
        span=math.hypot(dx,dy)
        assert span>.001
        th=math.atan2(dy,dx)
        n=box(label,style,[(a[i]+b[i])/2 for i in range(3)],[span,thickness,depth],kind,region)
        n["rotation"]=[0,0,math.sin(th/2),math.cos(th/2)]
        return n
    def pointed_arch(label,z_center,xc,halfwidth,spring,rise,region,sections=12):
        for i in range(sections):
            t0=i/sections;t1=(i+1)/sections
            x0=xc-halfwidth+2*halfwidth*t0
            x1=xc-halfwidth+2*halfwidth*t1
            y0=spring+rise*(1-abs(2*t0-1)**.75)
            y1=spring+rise*(1-abs(2*t1-1)**.75)
            beam(f"{label}_{i:02d}","stone_carving",
                 (x0,y0,z_center),(x1,y1,z_center),.115,.16,"gothic_arch_rib",region)
    # Region 1: turn left from the confession corridor onto the EXISTING descending stair.
    # The native tread_0...tread_23 spans X -74.5...-82.8, with Z[10.3,12.4].
    # New rib arches run ACROSS the lateral branch, not across the original class door wall.
    # Only upper architecture and outer balustrades: no new floor over active steps.
    branch="confession_side_stair"
    def flight_height(x):
        return min(4.,max(0.,4.+(x+74.5)*.5))
    for k in range(7):
        x=-73.2-k*1.48
        zmid=11.35
        foot=flight_height(x)
        # A pointed roof from multiple short segments in the Y-Z cross section.
        # Use small boxes with explicit XYZ rotation around X, not pseudo beam around Z.
        for j in range(8):
            z0=10.08+2.54*j/8
            z1=10.08+2.54*(j+1)/8
            t0=j/8;t1=(j+1)/8
            y0=foot+2.83+1.05*(1-abs(2*t0-1)**.75)
            y1=foot+2.83+1.05*(1-abs(2*t1-1)**.75)
            dy=y1-y0;dz=z1-z0
            n=box(f"side_arch_{k:02d}_{j:02d}","stone_carving",
                 (x,(y0+y1)/2,(z0+z1)/2),
                 (.16,.10,math.hypot(dy,dz)),"gothic_arch_rib",branch)
            theta=-math.atan2(dy,dz)
            n["rotation"]=[math.sin(theta/2),0,0,math.cos(theta/2)]
        for side,zz in (("near",10.05),("far",12.65)):
            box(f"side_stair_pillar_{k}_{side}","stone",
                (x,foot+1.50,zz),(.32,3.0,.30),"pilaster",branch)
            box(f"side_stair_cap_{k}_{side}","stone_carving",
                (x,foot+3.05,zz),(.47,.22,.45),"capital",branch)
    # Transparent style of balustrade: slim supports outside native tread footprint.
    for side,z in (("north",10.14),("south",12.56)):
        for i in range(12):
            x=-74.60-i*.69
            y=flight_height(x)
            box(f"side_baluster_{side}_{i:02d}","stone_carving",
                (x,y+.47,z),(.10,.94,.10),"balustrade",branch)
        for i in range(11):
            x0=-74.60-i*.69;x1=x0-.69
            beam(f"side_handrail_{side}_{i:02d}","wood_trim",
                 (x0,flight_height(x0)+1.03,z),(x1,flight_height(x1)+1.03,z),
                 .115,.13,"balustrade_handrail",branch)
    # Region 2: original roof stair rises 4.09 to 8.26 in northern hall.
    # Loft-style portal: keep center x[-71.2,-69.3] free for movement.
    roof="roof_stair_lobby"
    for k,z in enumerate((-53.45,-54.75,-56.05,-57.35)):
        pointed_arch(f"roof_stair_arch_{k}",z,-70.25,1.85,10.15,2.00,roof,14)
        for side,x in (("left",-72.40),("right",-68.08)):
            box(f"roof_lobby_pier_{k}_{side}","stone_carving",
                (x,7.76,z),(.34,5.60,.28),"pilaster",roof)
            box(f"roof_lobby_cap_{k}_{side}","stone_carving",
                (x,10.51,z),(.55,.23,.43),"capital",roof)
    # Roof stair stair-head landing, above native final step. Wood dado on outskirts only.
    for x,side in ((-72.38,"left"),(-68.12,"right")):
        box(f"roof_lobby_dado_{side}","wood",
            (x,7.32,-55.35),(.16,.68,4.65),"dado",roof)
        for i,z in enumerate((-54.6,-57.1)):
            box(f"roof_brass_sconce_{side}_{i}","brass",
                (x,9.10,z),(.10,.35,.23),"sconce",roof)
            box(f"roof_amber_lamp_{side}_{i}","lamp",
                (x,9.30,z),(.13,.25,.18),"sconce",roof)
    # Region 3: original main entrance steps in south z17.88..25.43.
    # The standard corridor ended at z17.92, so provide four fully connected arcade bays.
    entry="main_entrance_arcade"
    for i,z in enumerate((18.35,20.5,22.6,24.55)):
        pointed_arch(f"entry_portal_arch_{i}",z,-70.10,1.90,7.70,1.30,entry,14)
        for side,x in (("left",-71.72),("right",-68.50)):
            box(f"entry_arcade_pier_{i}_{side}","stone",
                (x,5.85,z),(.32,3.7,.31),"pilaster",entry)
            box(f"entry_arcade_cap_{i}_{side}","stone_carving",
                (x,7.75,z),(.51,.31,.47),"capital",entry)
            box(f"entry_dado_{i}_{side}","wood",
                (x,4.42,z),(.17,.71,1.42),"dado",entry)
        for side,x in (("left",-71.48),("right",-68.75)):
            box(f"entry_sconce_{i}_{side}","brass",
                (x,6.45,z),(.12,.31,.20),"sconce",entry)
            box(f"entry_lamp_{i}_{side}","lamp",
                (x,6.65,z),(.14,.32,.18),"sconce",entry)
    # The entrance path is intentionally open: no new horizontal slab over native steps.
    # Mark actual connection anchors in the same glTF node tree (nongeometry).
    anchors=[
      ("to_roof_stair",[-70.25,8.28,-58.15],roof),
      ("to_main_corridor_north",[-70.25,4.02,-52.5],roof),
      ("to_confession_corridor",[-72.3,4.02,11.35],branch),
      ("to_confession_lower_stair",[-82.50,.16,11.35],branch),
      ("to_main_corridor_south",[-70.10,4.02,17.9],entry),
      ("to_external_entry_stair",[-70.10,.20,25.4],entry),
    ]
    for key,pos,reg in anchors:
        n={"name":PREFIX+"ANCHOR_"+key,"translation":pos,
           "extras":{"type":"connection_anchor","region":reg,"target":key,
                     "validated":"STATIC_COORDINATE_ONLY","author_approval":"PENDING"}}
        model["nodes"].append(n);root_nodes.append(len(model["nodes"])-1)
        counts["connection_anchor"]=counts.get("connection_anchor",0)+1
        regions[reg]=regions.get(reg,0)+1
        portal_anchors.append(n["name"])
    # Parent v1 is bitwise identical in all existing JSON nodes.
    assert json.dumps(model["nodes"][:before_node_count],ensure_ascii=False,separators=(",",":"))==frozen_nodes
    assert len(model["nodes"])>before_node_count+250
    assert counts["connection_anchor"]==6
    assert all("mesh" not in n for n in model["nodes"][-6:])
    assert set(regions)=={"confession_side_stair","roof_stair_lobby","main_entrance_arcade"}
    model["buffers"][0]["byteLength"]=len(buf)
    json_raw=json.dumps(model,ensure_ascii=False,separators=(",",":")).encode()
    json_raw+=b" "*((-len(json_raw))%4)
    buf+=b"\x00"*((-len(buf))%4)
    binary=b"".join((struct.pack("<4sII",glb.MAGIC,2,12+8+len(json_raw)+8+len(buf)),
                     struct.pack("<II",len(json_raw),glb.CHUNK_JSON),json_raw,
                     struct.pack("<II",len(buf),glb.CHUNK_BIN),bytes(buf)))
    DST.mkdir(parents=True,exist_ok=True)
    (DST/OUTNAME).write_bytes(binary)
    check,buf2,_=glb.load_glb(DST/OUTNAME)
    assert len(check["nodes"])==len(model["nodes"]) and len(buf2)==len(buf)
    report={
     "model":OUTNAME,"revision":"ACADEMY-RB2-GOTHIC-ALL-CORRIDORS-V2",
     "source_v1_sha256":EXPECTED,"sha256":hashlib.sha256(binary).hexdigest(),
     "bytes":len(binary),"source_v1_nodes":before_node_count,"result_nodes":len(model["nodes"]),
     "new_nodes":len(model["nodes"])-before_node_count,
     "new_groups":counts,"new_regions":regions,"anchors":portal_anchors,
     "native_roof_stair_geometry_unchanged":True,
     "native_confession_side_stair_geometry_unchanged":True,
     "native_entrance_stair_geometry_unchanged":True,
     "original_8931_nodes_identical":True,
     "base_corridor_and_classrooms_unchanged":True,
     "glb_roundtrip":"PASS","rendering":"NOT_RUN_BY_USER_REQUEST",
     "actor_continuous_collision":"NOT_RUN",
     "academy_exterior_hall_semantics":"NOT_IDENTIFIED_AS_WALKABLE_INTERIOR",
     "author_approved":False,"five_canonical_models_untouched":True,
     "notes":[
      "Side stair arch and balustrade alignment inferred from actual native tread AABB; verify nonintersections before actor rig work.",
      "A1/CROOM entrances remain in parent V1 and are not covered or modified in V2.",
      "Rooftop stair and main entrance portals now carry the same stone/wood/amber architectural vocabulary.",
      "The rest of the broad campus hall-named objects are architectural shells, not verified interior hallways.",
      "No rendering requested or executed. Static mesh-level and humanoid path validation remains required."
     ]
    }
    (DST/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({k:v for k,v in report.items() if k!="notes"},ensure_ascii=False))
if __name__=="__main__":main()
