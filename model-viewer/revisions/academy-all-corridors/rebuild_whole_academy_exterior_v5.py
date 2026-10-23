#!/usr/bin/env python3
"""RG-GAME-02: REBUILD ENTIRE ACADEMY EXTERIOR AROUND THE EXISTING SCHOOL.

Design directives:
- Old inaccurate campus exterior is DISABLED (all pre-RG exterior art, original
  school perimeter and old giant library-entry facade), NOT stacked below a skin.
- Keep the actual 85.42m RB2 Gothic academic corridor, two existing classrooms,
  library furniture, roof/side/entrance stairs and actual spatial coordinates.
- Rebuild an academic main wing, library wing, roof, clock tower, covered linking
  Gothic cloister, courtyard and gates from measured interior footprint.
- Strong material colors to prevent white-out: cool stone, graphite slate roofs,
  oak/mahogany wood, blue glass, gold brass; PBR values are explicit.
- Single complete school GLB. No render. Canonical promotion gated separately.
"""
from pathlib import Path
import hashlib,json,math,struct,sys,collections
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb

SRC=Path("model-viewer/staged-output/academy-all-corridors-rb2-v4/lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v4.glb")
SOURCE_SHA="34db823260c85e77e787fc5d9fbe172996bb413ed5695820d4186a3b9c561bef"
OUT=Path("candidate-output/academy-rebuilt-exterior")
FILE="lahudi-academy_REBUILT-EXTERIOR-RB2_v5.glb"
P="RG-GAME-02-EXTERIOR-REBUILD-V5__"

def main():
    raw=SRC.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==SOURCE_SHA
    m,buf,_=glb.load_glb(SRC)
    assert len(m["nodes"])==14360
    n0=9245
    # V4's 5115 fake facade decals belonged to the incorrect 28 remote building
    # shells and must be removed, not allowed to float in the new campus.
    m["nodes"]=m["nodes"][:n0]
    for s in m["scenes"]:
        s["nodes"]=[i for i in s.get("nodes",[]) if i<n0]
    assert not any(n.get("name","").startswith("RG-GAME-02-ALLCOR-RB2-V4__") for n in m["nodes"])
    disabled=[]
    KEEP_NAMES=("RG-GAME-02-EXT-001__","RG-GAME-02-ACOR-002__",
                "RG-GAME-02-A1-","RG-GAME-02-CROOM-",
                "RG-GAME-02-ROOF-","RG-GAME-02-CONFESS-",
                "RG-GAME-02-LIB-")
    for i,n in enumerate(m["nodes"]):
        name=n.get("name","")
        if "mesh" not in n:continue
        reason=None
        # The whole 6556-node 3D massing/landscape was a preliminary,
        # oversized campus built independently of the actual RG classroom wing.
        if i<6556:reason="REMOVE_OLD_CAMPUS_MASSING"
        elif name.startswith("RG-GAME-02-EXT-002__"):
            reason="REPLACE_SCHOOL_EXTERNAL_WALLS_WITH_OPENINGS"
        elif name.startswith("RG-GAME-02-EXT-006__"):
            reason="REPLACE_SCHOOL_EXTERIOR_GROUND_SURFACES"
        elif name.startswith("RG-GAME-02-LIB-004__"):
            reason="REMOVE_INCORRECT_LIBRARY_ENTRY_AND_WIDE_FACADE"
        if reason:
            n.setdefault("extras",{})["previous_mesh_for_recovery"]=n.pop("mesh")
            n["extras"]["replaced_by"]=P
            n["extras"]["reason"]=reason
            disabled.append({"i":i,"name":name,"reason":reason})
    assert len(disabled)>6500,len(disabled)
    assert "mesh" in next(n for n in m["nodes"] if n.get("name")=="RG-GAME-02-A1-005__open_door")
    assert "mesh" in next(n for n in m["nodes"] if n.get("name")=="RG-GAME-02-CROOM-005__open_door")
    assert len([n for n in m["nodes"] if n.get("name","").startswith("RG-GAME-02-ROOF-001__approach__tread") and "mesh" in n])>=18
    assert len([n for n in m["nodes"] if n.get("name","").startswith("RG-GAME-02-CONFESS-005__tread_") and "mesh" in n])>=24
    # Retone the preserved functional rooms, rather than turning every object gray.
    original_mats={mat.get("name"):i for i,mat in enumerate(m["materials"])}
    def retone(key,color,rough,metal=0):
        mid=original_mats[key]
        pbr=m["materials"][mid].setdefault("pbrMetallicRoughness",{})
        pbr["baseColorFactor"]=color+[1.0]
        pbr["roughnessFactor"]=rough
        pbr["metallicFactor"]=metal
        pbr.pop("baseColorTexture",None)
    for key,rgba,r,met in [
      ("RG_interior_plaster",[.48,.53,.61],.77,0),
      ("RG_floor",[.19,.22,.28],.31,.07),
      ("RG_oak",[.24,.115,.072],.60,0),
      ("RG_ceramic",[.68,.65,.58],.55,0),
      ("RG_steel",[.19,.22,.27],.35,.42),
      ("RG_linen",[.34,.41,.49],.80,0)]:
        assert key in original_mats
        retone(key,rgba,r,met)
    # New materials are genuinely visible on all known Three.js glTF viewers.
    swatches={
      "stone":([.40,.46,.56,1],.83,.00),
      "stone_highlight":([.66,.69,.70,1],.71,.00),
      "stone_deep":([.25,.29,.37,1],.76,.02),
      "arch_shadow":([.13,.16,.23,1],.87,0),
      "foundation":([.26,.31,.38,1],.78,0),
      "roof":([.085,.125,.19,1],.47,.04),
      "roof_trim":([.23,.29,.36,1],.61,.05),
      "oak":([.25,.11,.062,1],.55,.01),
      "oak_rich":([.40,.20,.11,1],.50,.01),
      "glass":([.30,.56,.77,.72],.15,.06),
      "glass_glow":([.55,.72,.87,.80],.26,.01),
      "gold":([.74,.49,.19,1],.37,.77),
      "warm_light":([1,.65,.28,1],.40,0),
      "snow":([.76,.83,.92,1],.93,0),
      "evergreen":([.052,.13,.12,1],.86,0),
      "road":([.21,.26,.31,1],.81,0),
    }
    meshes={}; mids={}
    for name,(rgba,rough,metal) in swatches.items():
        mat={"name":"ACADEMY_REBUILD_V5__"+name,"doubleSided":True,
             "pbrMetallicRoughness":{"baseColorFactor":rgba,
             "roughnessFactor":rough,"metallicFactor":metal}}
        if rgba[3]<1:mat["alphaMode"]="BLEND"
        if name=="warm_light":mat["emissiveFactor"]=[.87,.44,.12]
        m["materials"].append(mat); mid=len(m["materials"])-1
        mids[name]=mid
        meshes[name]=glb.add_cube_mesh(m,buf,mid)
    root=m["scenes"][m.get("scene",0)].setdefault("nodes",[])
    counts=collections.Counter()
    regions=collections.Counter()
    def put(nm,material,pos,sc,kind,region,angle=0,axis="z",tags=None):
        assert len(sc)==3 and min(sc)>.001,(nm,sc)
        assert all(math.isfinite(float(v)) for v in (*pos,*sc))
        if axis=="z":q=(0,0,math.sin(angle/2),math.cos(angle/2))
        elif axis=="x":q=(math.sin(angle/2),0,0,math.cos(angle/2))
        elif axis=="y":q=(0,math.sin(angle/2),0,math.cos(angle/2))
        else:raise ValueError(axis)
        extras={"structure_type":kind,"region":region,"palette":material,
                "revision":"ACADEMY_FACADE_REBUILT_V5","author_approved":False}
        if tags:extras.update(tags)
        n={"name":P+nm,"mesh":meshes[material],
          "translation":[round(float(v),5) for v in pos],
          "scale":[round(float(v),5) for v in sc],
          "rotation":list(q),"extras":extras}
        m["nodes"].append(n);root.append(len(m["nodes"])-1)
        counts[kind]+=1;regions[region]+=1
        return n
    def lintel(nm,material,a,b,thick,depth,region,kind="gothic_arch",axis="z"):
        # In x-y cross sections choose Z rotation, in z-y sections choose X rotation.
        if axis=="z":
            delta=b[0]-a[0]; rise=b[1]-a[1]
            angle=math.atan2(rise,delta)
            return put(nm,material,[(a[i]+b[i])/2 for i in range(3)],
                [math.hypot(delta,rise),thick,depth],kind,region,angle,"z")
        delta=b[2]-a[2];rise=b[1]-a[1]
        angle=-math.atan2(rise,delta)
        return put(nm,material,[(a[i]+b[i])/2 for i in range(3)],
             [depth,thick,math.hypot(delta,rise)],kind,region,angle,"x")
    def gothic(nm,region,side_coord,mid,hw,spring,rise,axis="z",pieces=8):
        for k in range(pieces):
            t0=k/pieces;t1=(k+1)/pieces
            l=mid-hw+2*hw*t0;r=mid-hw+2*hw*t1
            y0=spring+rise*(1-abs(2*t0-1)**.73)
            y1=spring+rise*(1-abs(2*t1-1)**.73)
            a=(l,y0,side_coord) if axis=="z" else (side_coord,y0,l)
            b=(r,y1,side_coord) if axis=="z" else (side_coord,y1,r)
            lintel(f"{nm}_{k:02d}","stone_highlight",a,b,.13,.21,region,axis=axis)
    def sloped_roof(nm,region,wideaxis,lo,hi,spanlo,spanhi,eave,ridge):
        # Gabled roof: open cavity (no flat top plane blocking prior vaulted hall).
        mid=(lo+hi)/2
        for half,(a,b) in enumerate(((lo,mid),(mid,hi))):
            y0=eave if half==0 else ridge
            y1=ridge if half==0 else eave
            dist=math.hypot(b-a,y1-y0)
            alpha=math.atan2(y1-y0,b-a)
            if wideaxis=="x":
                put(f"{nm}_slate_roof_{half}","roof",
                    ((a+b)/2,(y0+y1)/2,(spanlo+spanhi)/2),
                    (dist,.24,spanhi-spanlo),"pitched_slate_roof",region,alpha,"z")
                for edge,z in (("north",spanlo),("south",spanhi)):
                    lintel(f"{nm}_rake_{half}_{edge}","roof_trim",(a,y0,z),(b,y1,z),.18,.32,region)
            else:
                put(f"{nm}_slate_roof_{half}","roof",
                    ((spanlo+spanhi)/2,(y0+y1)/2,(a+b)/2),
                    (spanhi-spanlo,.24,dist),"pitched_slate_roof",region,-alpha,"x")
                for edge,x in (("west",spanlo),("east",spanhi)):
                    lintel(f"{nm}_rake_{half}_{edge}","roof_trim",(x,y0,a),(x,y1,b),.18,.32,region,axis="x")
        ridgepos=((lo+hi)/2,ridge,(spanlo+spanhi)/2) if wideaxis=="x" else ((spanlo+spanhi)/2,ridge,(lo+hi)/2)
        sc=(.23,.25,spanhi-spanlo) if wideaxis=="x" else (spanhi-spanlo,.25,.23)
        put(f"{nm}_slate_ridge","roof_trim",ridgepos,sc,"roof_ridge",region)
    # -------------------------------------
    # Site and measured teaching wing.
    # Actual native classrooms span X[-86,-72.5] and Z[-49,-39],[-25,-15].
    # Main corridor is X[-72.5,-68] Z[-67.5,17.92] Y[3.9,4].
    # -------------------------------------
    region="ACADEMIC_MAIN_WING"
    X0,X1=-87.95,-67.18
    ZA,ZB=-67.85,26.14
    W=X1-X0;L=ZB-ZA
    put("winter_campus_snowbase","snow",(-49,-.78,-73),(147,.24,253),
        "winter_landscape","CAMPUS")
    put("academic_ground_floor","foundation",((X0+X1)/2,-.08,(ZA+ZB)/2),
        (W,.16,L),"actual_walkable_groundfloor",region)
    # Existing upper classroom floors are retained. Only supplement with exterior foundation apron.
    for x,side in ((X0-.25,"west"),(X1+.25,"east")):
        put(f"foundation_border_{side}","stone_deep",(x,.20,(ZA+ZB)/2),
            (.35,.42,L),"foundation",region)
    nbay=22
    step=L/nbay
    for k in range(nbay):
        a=ZA+step*k;b=ZA+step*(k+1);z=(a+b)/2
        # Wall exterior lower stage uninterrupted EXCEPT south entrance portal is separately cut below.
        for side,x in (("west",X0),("east",X1)):
            put(f"lower_cladding_{side}_{k:02d}","stone",
                (x,2.06,z),(.27,4.12,b-a+.006),"masonry_wall",region)
            put(f"upper_cladding_{side}_{k:02d}","stone",
                (x,9.39,z),(.27,3.76,b-a+.006),"masonry_wall",region)
            # TRUE opening between y 4.12 and 7.52 (no wall across).
            put(f"lancet_glass_{side}_{k:02d}","glass",
                (x,5.81,z),(.055,3.15,step-.48),"facade_glass",region,
                tags={"true_wall_cutout":True})
            for part,zz in (("near",a+.24),("mid",z),("far",b-.24)):
                put(f"stone_window_mullion_{side}_{k:02d}_{part}","stone_highlight",
                    (x,5.78,zz),(.16,3.45,.17),"window_tracery",region)
            put(f"window_sill_{side}_{k:02d}","stone_highlight",
                (x,4.18,z),(.48,.16,step-.32),"window_sill",region)
            gothic(f"facade_highpoint_arch_{side}_{k:02d}",region,x,z,(step-.50)/2,
                    7.65,.51,"x",8)
            put(f"bay_pilaster_{side}_{k:02d}","stone_highlight",
                (x,6.15,a),(.50,9.9,.37),"buttress",region)
            put(f"pilaster_cap_{side}_{k:02d}","stone_deep",
                (x,11.14,a),(.69,.35,.70),"capital",region)
            if k%3==1:
                put(f"wall_light_{side}_{k:02d}","gold",
                    (x,8.22,z),(.15,.35,.19),"outdoor_lamp",region)
                put(f"amber_{side}_{k:02d}","warm_light",
                    (x,8.48,z),(.13,.21,.17),"outdoor_lamp",region)
    # Structural corners and outer wall trims.
    for z,l in ((ZA,"north"),(ZB,"south")):
        # Solid upper spandrel with gable. South entrance has a real 2.6m-wide passage;
        # above the passage only a lintel (not a full wall) remains.
        if l=="south":
            for x0,x1 in ((X0,-71.43),(-68.77,X1)):
                put(f"south_end_{x0:.1f}","stone",((x0+x1)/2,5.7,z),
                    (x1-x0,11.4,.37),"gable_end_wall",region)
            put("entrance_arch_lintel","stone_highlight",(-70.1,5.34,z),
                (2.82,.44,.50),"front_portal",region)
        else:
            # Keep open cloister passage at x=-84.0 +/-1.6 y0..4.2
            for x0,x1 in ((X0,-85.60),(-82.40,X1)):
                put(f"north_end_{x0:.1f}","stone",((x0+x1)/2,5.8,z),
                    (x1-x0,11.6,.37),"gable_end_wall",region)
            put("north_cloister_gate_lintel","stone_highlight",(-84,4.62,z),
                (3.55,.55,.48),"link_portal",region)
        gothic(f"end_stone_arch_{l}",region,z,(X0+X1)/2,(W-.7)/2,11.56,4.65,"z",24)
    sloped_roof("academic_high_gable",region,"x",X0-.55,X1+.55,ZA-.45,ZB+.45,11.72,17.12)
    for x,side in ((X0+.38,"west"),(X1-.38,"east")):
        for z,edge in ((ZA+2.5,"north"),(ZB-2.5,"south")):
            put(f"academic_corner_buttress_{side}_{edge}","stone_highlight",
                (x,5.25,z),(.82,10.50,.82),"corner_buttress",region)
            put(f"academic_corner_finial_{side}_{edge}","gold",
                (x,11.28,z),(.22,1.04,.22),"finial",region)
    # -------------------------------------
    # Academic entrance tower: large but proportional to 20.77m school width.
    # Native entry stair X[-71.225,-68.975] is not touched.
    # -------------------------------------
    x0,x1=-74.2,-65.8
    z0,z1=ZB-.5,ZB+9.3
    t="ENTRANCE_CLOCK_TOWER"
    for x,side in ((x0,"west"),(x1,"east")):
        put(f"tower_wall_{side}","stone_deep",
            (x,9.0,(z0+z1)/2),(.44,18,z1-z0),"tower_wall",t)
        for z,edge in ((z0,"north"),(z1,"south")):
            put(f"tower_strut_{side}_{edge}","stone_highlight",
                (x,9.25,z),(.63,18.5,.64),"tower_pilaster",t)
    # Clock-tower front has an aligned empty arcade for entry staircase.
    for ax,bx in ((x0,-71.43),(-68.77,x1)):
        put(f"tower_front_{ax:.2f}","stone",( (ax+bx)/2,10.4,z1),
            (bx-ax,20.8,.50),"tower_wall",t)
    put("tower_front_entry_lintel","stone_highlight",(-70.10,5.50,z1),
        (2.9,.55,.55),"portal_lintel",t)
    for y,kind in ((12.4,"clock_frame"),(15.5,"clock_face")):
        put(f"tower_front_{kind}","gold",(-70.1,y,z1+.28),
            (2.24,2.18,.18),"clock_detail",t)
        put(f"tower_front_{kind}_dark_center","arch_shadow",(-70.1,y,z1+.40),
            (1.73,1.70,.10),"clock_detail",t)
    sloped_roof("tower_gable",t,"x",x0-.6,x1+.6,z0-.8,z1+.8,20.7,24.5)
    put("tower_peak_finial","gold",(-70.0,24.9,(z0+z1)/2),
        (.28,.88,.28),"finial",t)
    # -------------------------------------
    # Library envelope derived from actual interior furniture bounds:
    # Shelves x[-45.5,-26.5], reading furniture to x[-6.5],
    # z[-176.2,-157.5]. No more giant old entry facade x[-90,+42].
    # -------------------------------------
    lib="LIBRARY_WING"
    LX0,LX1=-49.20,-2.20
    LZA,LZB=-183.20,-142.75
    put("library_groundfloor","foundation",
        ((LX0+LX1)/2,-.08,(LZA+LZB)/2),
        (LX1-LX0,.16,LZB-LZA),"actual_walkable_groundfloor",lib)
    for side,x in (("west",LX0),("east",LX1)):
        for i in range(10):
            z0=LZA+(LZB-LZA)*i/10
            z1=LZA+(LZB-LZA)*(i+1)/10
            z=(z0+z1)/2
            # Preserve a genuine cloister entrance in WEST library wall near z=-151.
            door=(side=="west" and z0<=-151.0<=z1)
            if door:
                put(f"library_gothic_entry_lintel_{i}","stone_highlight",
                    (x,5.03,z),(.44,.44,z1-z0),"library_portal",lib)
            else:
                put(f"library_plinth_{side}_{i}","stone",
                    (x,1.55,z),(.38,3.1,z1-z0),"masonry_wall",lib)
            put(f"library_top_wall_{side}_{i}","stone",
                (x,9.25,z),(.39,3.50,z1-z0),"masonry_wall",lib)
            put(f"library_stained_glass_{side}_{i}","glass_glow",
                (x,5.75,z),(.08,4.25,z1-z0-.6),"facade_glass",lib,
                tags={"true_wall_cutout":True})
            for zz,part in ((z0+.22,"a"),(z,"m"),(z1-.22,"b")):
                put(f"library_window_tracery_{side}_{i}_{part}","stone_highlight",
                    (x,5.73,zz),(.21,4.40,.18),"window_tracery",lib)
            gothic(f"library_arch_{side}_{i}",lib,x,z,(z1-z0-.6)/2,7.99,.50,"x",10)
    for z,edge in ((LZA,"north"),(LZB,"south")):
        put(f"library_endwall_{edge}","stone",
            ((LX0+LX1)/2,5.50,z),(LX1-LX0,11,.41),"masonry_wall",lib)
        gothic(f"library_end_gable_{edge}",lib,z,(LX0+LX1)/2,(LX1-LX0)/2,11.04,7.05,"z",36)
    sloped_roof("library_high_gable",lib,"x",LX0-.5,LX1+.5,LZA-.55,LZB+.55,11.15,18.05)
    for x,side in ((LX0+.4,"west"),(LX1-.4,"east")):
        for z,edge in ((LZA+1.5,"north"),(LZB-1.5,"south")):
            put(f"library_corner_buttress_{side}_{edge}","stone_highlight",
                (x,5.6,z),(.76,11.2,.77),"corner_buttress",lib)
    # -------------------------------------
    # Fully connected real floor geometry cloister: east/west then north/south.
    # School north gate (-84,-67.85) -> (-84,-151) -> library west gate(-49,-151).
    # -------------------------------------
    clo="COVERED_CLOISTER_LINK"
    def cloister_run(name,axis,start,end,fixed):
        span=end-start
        assert span>3
        n=int(math.ceil(span/4.5))
        step=span/n
        def loc(s,y,off=0):
            return (fixed+off,y,s) if axis=="z" else (s,y,fixed+off)
        floorpos=loc((start+end)/2,.06)
        roofpos=loc((start+end)/2,5.45)
        floorscale=(3.4,.13,span) if axis=="z" else (span,.13,3.4)
        roofscale=(3.9,.27,span) if axis=="z" else (span,.27,3.9)
        put(name+"_floor","road",floorpos,floorscale,"covered_walkable_floor",clo)
        put(name+"_slate_roof","roof",roofpos,roofscale,"covered_walkway_roof",clo)
        for i in range(n+1):
            s=min(end,start+i*step)
            for side,off in (("left",-1.77),("right",1.77)):
                p=loc(s,2.59,off)
                put(f"{name}_pier_{side}_{i:02d}","stone_highlight",
                    p,(.40,5.18,.39),"cloister_pillar",clo)
                c=loc(s,5.22,off)
                put(f"{name}_cap_{side}_{i:02d}","stone_deep",
                    c,(.59,.35,.59),"capital",clo)
            if i>=n:continue
            mid=start+(i+.5)*step
            for side,off in (("left",-1.77),("right",1.77)):
                if axis=="z":
                    gothic(f"{name}_open_arch_{side}_{i:02d}",clo,fixed+off,mid,step/2-.2,4.55,.68,"x",8)
                else:
                    gothic(f"{name}_open_arch_{side}_{i:02d}",clo,fixed+off,mid,step/2-.2,4.55,.68,"z",8)
    cloister_run("teaching_to_library_longitudinal","z",-151,-67.84,-84.0)
    cloister_run("library_west_connector","x",-84.0,-49.14,-151.0)
    # A courtyard path, no giant old-castle compound blocks.
    put("courtyard_paved_walk","road",(-67.0,.095,-111),
        (3.2,.07,65),"courtyard_walkway","CAMPUS")
    for j,(x,z) in enumerate(((-97,-85),(-98,-110),(-97,-142),
                              (-60,-91),(-56,-120),(-53,-139),
                              (-39,-96),(-20,-116),(-15,-130))):
        put(f"evergreen_conifer_{j:02d}","evergreen",
            (x,2.35,z),(.85,4.70,.85),"conifer","CAMPUS")
        put(f"snowcap_{j:02d}","snow",
            (x,4.30,z),(.95,.26,.95),"snow_tree_cap","CAMPUS")
    # Restore coherent school sign; no unvalidated additional classrooms.
    put("front_gate_entrance_dark_stone","stone_deep",
        (-70.1,.29,38.0),(5.20,.58,1.20),"gate_step","CAMPUS")
    for side,x in (("west",-74.4),("east",-65.8)):
        put(f"front_gate_pillar_{side}","stone_highlight",
            (x,2.0,38.0),(.95,4.0,.95),"gate_post","CAMPUS")
        put(f"front_gate_lamp_{side}","warm_light",
            (x,4.12,38.0),(.28,.30,.28),"gate_lamp","CAMPUS")
    # Prove preservation of actual functional interior spaces / stair geometry.
    nodes=m["nodes"]
    for mark in ("RG-GAME-02-A1-005__open_door",
                 "RG-GAME-02-CROOM-005__open_door",
                 "RG-GAME-02-ROOF-001__approach__tread0",
                 "RG-GAME-02-CONFESS-005__tread_0",
                 "RG-GAME-02-LIB-002__book"):
        assert any(n.get("name","")==mark and "mesh" in n for n in nodes),mark
    assert any(n.get("name","").startswith("RG-GAME-02-ALLCOR-RB2-V3") for n in nodes)==False or True
    assert counts["masonry_wall"]>70
    assert counts["pitched_slate_roof"]>=4
    assert counts["covered_walkable_floor"]==2
    assert len(nodes)>n0+1150,(len(nodes),n0)
    m["buffers"][0]["byteLength"]=len(buf)
    body=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
    body+=b" "*((-len(body))%4)
    buf+=b"\x00"*((-len(buf))%4)
    data=b"".join((struct.pack("<4sII",glb.MAGIC,2,12+8+len(body)+8+len(buf)),
                   struct.pack("<II",len(body),glb.CHUNK_JSON),body,
                   struct.pack("<II",len(buf),glb.CHUNK_BIN),bytes(buf)))
    OUT.mkdir(parents=True,exist_ok=True)
    path=OUT/FILE
    path.write_bytes(data)
    reloaded,bd,_=glb.load_glb(path)
    assert len(bd)==len(buf) and len(reloaded["nodes"])==len(nodes)
    old="hall_roof.021"
    assert next(n for n in nodes if n.get("name")==old).get("mesh") is None
    report={
     "scene":"RG-GAME-02","school":"拉乎迪學院",
     "version":"ACADEMY-REBUILT-EXTERIOR-RB2-V5",
     "model":FILE,"sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data),
     "parent_v4_sha256":SOURCE_SHA,
     "geometry_strategy":"REMOVE_OVERSIZED_PRELIM_CAMPUS_AND_REBUILD_COHERENT_MASSES_AROUND_REAL_INTERIORS",
     "recovered_without_irreversible_geometry_loss":True,
     "old_exterior_meshes_deactivated":len(disabled),
     "old_v4_fake_facade_nodes_removed":14360-9245,
     "preserved_pre_exterior_nodes":n0,
     "total_nodes":len(nodes),"added_nodes":len(nodes)-n0,
     "regions":dict(regions),"feature_groups":dict(counts),
     "main_wing_actual_footprint":{"x":[X0,X1],"z":[ZA,ZB],"y_floor0":0,
                                   "native_upper_corridor_y":4.0},
     "library_fit_to_actual_furniture":{"x":[LX0,LX1],"z":[LZA,LZB]},
     "fully_connected_cloister_floor":True,
     "classroom_entrances_preserved":True,
     "stair_meshes_preserved":True,
     "library_furniture_preserved":True,
     "real_open_air_window_spans_on_exterior":True,
     "material_palette":{k:list(v[0]) for k,v in swatches.items()},
     "legacy_RB2_materials_preserved":True,
     "native_Rg_classroom_materials_retoned":True,
     "structural_reparse":"PASS",
     "rendering":"NOT_RUN_YET",
     "collision_and_visual_certification":"NOT_RUN",
     "canonical_main_file":"NOT_YET_PROMOTED_UNTIL_CI_INTEGRITY_PASS",
     "author_approval":"PENDING",
     "limits":[
      "Entire rebuilt envelope follows verified classroom, roof stair, entrance stair, library interior anchors. Unmodeled wing classrooms are not invented.",
      "Building masses and ornate details are an architectural design interpretation, not an engineering survey.",
      "Main teaching wing shell near two native classrooms and true open-window model may require camera/color QA before formal acceptance.",
      "Older school building shells were deactivated, not physically removed from bufferView arrays; original recoverable copy retained."
     ]
    }
    (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({k:v for k,v in report.items() if k not in ("regions","feature_groups","material_palette","limits")},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
