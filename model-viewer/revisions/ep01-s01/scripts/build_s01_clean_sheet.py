#!/usr/bin/env python3
"""RG-GAME-02 EP01 S01: clean-sheet, physically continuous Academy confession corridor.

Author explicitly released us from preliminary school mesh geometry constraints.
Rebuilds new standalone GLB, NOT a patch onto old academy and NOT an accepted
replacement for unrelated academy classrooms/campus. Film A01 02:36 is the
visual reference: left carved doors, right high winter windows, stone ribs,
golden slanting sun, reflective dark stone, central ascending staircase.
"""
from pathlib import Path
import hashlib, json, math
import numpy as np
import trimesh
from trimesh.visual import TextureVisuals
from trimesh.visual.material import PBRMaterial

OUT=Path("candidate-output/s01-rebuild")
OUT.mkdir(parents=True,exist_ok=True)
SCENE=trimesh.Scene()
COUNTS={}
MATS={
 "limestone":((135,137,143,255),.86,.02),
 "highlight_stone":((186,179,169,255),.68,.02),
 "deep_stone":((81,85,94,255),.79,.02),
 "wood":((64,36,27,255),.57,.02),
 "wood_trim":((97,56,39,255),.48,.06),
 "wood_dark":((39,24,23,255),.60,.02),
 "brass":((178,121,56,255),.33,.78),
 "glass":((180,215,237,95),.18,.02),
 "floor":((81,84,92,255),.12,.12),
 "floor_band":((30,35,43,255),.20,.11),
 "floor_tile":((104,103,108,255),.16,.10),
 "sunlight":((254,203,133,50),.96,0.0),
 "snow":((228,235,242,255),.95,0.0),
 "pine":((58,88,87,255),.95,0.0),
 "pine_snow":((170,190,189,255),.91,0.0),
 "castle":((108,120,137,255),.81,.02),
 "light":((248,191,98,255),.30,0.0),
 "sky":((169,196,226,255),.94,0.0),
}
MATERIALS={}
for key,(rgba,rough,metal) in MATS.items():
    emissive=[0.8,0.45,0.12] if key=="light" else None
    MATERIALS[key]=PBRMaterial(name="RG-GAME-02-S01-RB__"+key,
        baseColorFactor=np.asarray(rgba,dtype=np.uint8),
        roughnessFactor=rough,metallicFactor=metal,
        emissiveFactor=emissive,
        alphaMode="BLEND" if rgba[3]<255 else "OPAQUE",
        doubleSided=True)

def put(mesh,name,mat,group):
    mesh.visual=TextureVisuals(material=MATERIALS[mat])
    SCENE.add_geometry(mesh,node_name=name,geom_name=name)
    COUNTS[group]=COUNTS.get(group,0)+1

def box(name,center,extent,mat,group):
    if any(e<=0 for e in extent):raise ValueError((name,extent))
    mesh=trimesh.creation.box(extents=extent)
    mesh.apply_translation(center)
    put(mesh,name,mat,group)

def tube(name,a,b,r,mat,group,sections=10):
    a=np.asarray(a,dtype=float);b=np.asarray(b,dtype=float)
    direction=b-a;L=np.linalg.norm(direction)
    if L<.00001:return
    mesh=trimesh.creation.cylinder(radius=r,height=L,sections=sections)
    rot=trimesh.geometry.align_vectors([0,0,1],direction/L)
    mesh.apply_transform(rot);mesh.apply_translation((a+b)/2)
    put(mesh,name,mat,group)

def cone(name,center,r,height,mat,group):
    m=trimesh.creation.cone(radius=r,height=height,sections=9)
    # trimesh cones are modeled along z by default: rotate to world Y.
    rot=trimesh.geometry.align_vectors([0,0,1],[0,1,0])
    m.apply_transform(rot)
    m.apply_translation(center)
    put(m,name,mat,group)

def quad(name,vertices,mat,group):
    p=np.asarray(vertices,dtype=float)
    if p.shape!=(4,3):raise ValueError(name)
    mesh=trimesh.Trimesh(vertices=p,faces=np.asarray([[0,1,2],[0,2,3]]),process=False)
    put(mesh,name,mat,group)

# Initial architectural parameters are lens-independent dimensional estimates.
HALF_W=4.10
HALL_NEAR=16.3
HALL_FAR=-17.8
BAYS=7
PITCH=(HALL_NEAR-HALL_FAR)/BAYS  # 4.871...
SPRING=8.15
CROWN=11.55
DOOR_W=2.38
DOOR_H=4.16
WINDOW_Y0=2.66
WINDOW_Y1=8.13
Y0=0.0

def vault(x):
    t=(x+HALF_W)/(2*HALF_W)
    return SPRING+(CROWN-SPRING)*(1.0-abs(2*t-1)**.72)

def gothic_arc(name,z,r,mat,group):
    for k in range(46):
        x0=-HALF_W+2*HALF_W*k/46
        x1=-HALF_W+2*HALF_W*(k+1)/46
        tube(f"{name}_{k:02d}",[x0,vault(x0)+r*.45,z],
             [x1,vault(x1)+r*.45,z],r,mat,group,8)

def ceiling_mesh():
    xs=np.linspace(-HALF_W,HALF_W,83)
    zs=np.linspace(HALL_FAR,HALL_NEAR,41)
    v=np.array([(x,vault(x),z) for z in zs for x in xs])
    faces=[]
    for k in range(len(zs)-1):
        for j in range(len(xs)-1):
            a=k*len(xs)+j;b=a+1;c=(k+1)*len(xs)+j;d=c+1
            faces.extend([[a,c,b],[b,c,d]])
    mesh=trimesh.Trimesh(vertices=v,faces=faces,process=False)
    # Triangle winding is authored explicitly; avoid optional SciPy dependency.
    put(mesh,"RB_VAULT__continuous_pointed_stone_surface","limestone","vault")
ceiling_mesh()
# Floor and structurally related foundations: one continuous walkable axis.
box("RB_FLOOR__continuous_masonry", (0,-.17,(HALL_NEAR+HALL_FAR)/2),
    (2*HALF_W,.34,HALL_NEAR-HALL_FAR),"floor","floor")
for x in (-3.85,3.85):
    box(f"RB_FLOOR__longitudinal_border_{x}",(x,.012,-.75),(.27,.022,33.9),
        "floor_band","floor")
for row in range(16):
    z=-16.65+row*2.07
    for ix,x in enumerate((-2.95,-1.00,1.00,2.95)):
        col="floor_tile" if (ix+row)%5==0 else "floor"
        box(f"RB_FLOOR__stone_tile_{row:02d}_{ix}",(x,.024,z),(1.82,.018,1.94),
            col,"floor_tile")

# Left solid wall now reconstructed from masonry pieces around six real portals.
# The preliminary school wall no longer constrains door location/height.
for k in range(BAYS):
    zn=HALL_FAR+k*PITCH
    zf=zn+PITCH
    zc=(zn+zf)/2
    # continuous upper spandrel above wood door openings
    box(f"RB_LEFT__spandrel_{k}",(-HALF_W-.15,(SPRING+DOOR_H)/2,zc),
        (.30,SPRING-DOOR_H,PITCH+.025),"limestone","left_wall")
    side=(PITCH-DOOR_W)/2
    for s,zz in [("far",(zn+zc-DOOR_W/2)/2),("near",(zf+zc+DOOR_W/2)/2)]:
        box(f"RB_LEFT__pier_{k}_{s}",(-HALF_W-.15,DOOR_H/2,zz),
            (.30,DOOR_H,side),"limestone","left_wall")
    # Actual recessed archway: framed open portal, no invisible wall across it.
    for edge,dz in [("low",-DOOR_W/2-.13),("high",DOOR_W/2+.13)]:
        box(f"RB_PORTAL_{k}__stone_jamb_{edge}",(-HALF_W,2.15,zc+dz),
            (.66,4.3,.26),"highlight_stone","door")
    box(f"RB_PORTAL_{k}__lintel",(-HALF_W,4.29,zc),(.60,.28,DOOR_W+.55),
        "highlight_stone","door")
    # Partial vestibule is visible through an ajar timber door.
    box(f"RB_PORTAL_{k}__vestibule_floor",(-5.32,-.12,zc),(2.6,.24,DOOR_W+.6),
        "deep_stone","vestibule")
    box(f"RB_PORTAL_{k}__vestibule_back",(-6.58,3.2,zc),(.15,6.4,DOOR_W+.6),
        "deep_stone","vestibule")
    for d in (-1,1):
        box(f"RB_PORTAL_{k}__vestibule_side_{d}",(-5.30,3.2,zc+d*(DOOR_W/2+.35)),
            (2.6,6.4,.15),"deep_stone","vestibule")
    # Twin real leaves, partially opened inward around local Y hinges.
    for side in (-1,1):
        leaf=trimesh.creation.box(extents=(.12,3.72,DOOR_W/2-.07))
        # Coordinate right/left along Z and hinge around its local Z edge.
        leaf.apply_translation([-HALF_W-.05,1.93,zc+side*(DOOR_W/4+.02)])
        angle=side*.30
        h=np.eye(4)
        h[:3,:3]=trimesh.transformations.rotation_matrix(angle,[0,1,0])[:3,:3]
        pivot=np.array([-HALF_W-.05,0,zc+side*(DOOR_W/2-.05)])
        leaf.apply_translation(-pivot)
        leaf.apply_transform(h)
        leaf.apply_translation(pivot)
        put(leaf,f"RB_PORTAL_{k}__open_walnut_leaf_{side}","wood","door")
        # Raised wood squares and latch read in overview shots.
        box(f"RB_PORTAL_{k}__panel_top_{side}",(-3.98,2.89,
            zc+side*.62),(.11,1.15,.74),"wood_trim","door_detail")
        box(f"RB_PORTAL_{k}__panel_bottom_{side}",(-3.98,1.05,
            zc+side*.62),(.11,1.05,.74),"wood_trim","door_detail")
    tube(f"RB_PORTAL_{k}__door_handle",[-3.78,1.85,zc+.19],
         [-3.65,1.85,zc+.19],.065,"brass","door_detail")
    # Stone ribs / applied pilasters and bronze sconces at repeated bays.
    for zz,label in ((zn,"bay_begin"),):
        box(f"RB_PILASTER_L_{k}__shaft",(-3.95,4.53,zz),
            (.55,7.18,.48),"highlight_stone","pillar")
        box(f"RB_PILASTER_L_{k}__plinth",(-3.93,.42,zz),
            (.83,.84,.82),"highlight_stone","pillar")
        box(f"RB_PILASTER_L_{k}__capital",(-3.94,8.12,zz),
            (.91,.49,.89),"highlight_stone","pillar")
    box(f"RB_SCONCE_{k}__mount",(-3.68,5.7,zc),(.15,.45,.28),
        "brass","sconce")
    tube(f"RB_SCONCE_{k}__curved_arm",[-3.62,5.63,zc],
         [-3.17,5.77,zc],.068,"brass","sconce")
    box(f"RB_SCONCE_{k}__golden_light",(-3.14,5.94,zc),
        (.19,.39,.21),"light","sconce")

# Right-hand gothic fenestration; REAL openings in the spandrel.
for k in range(BAYS):
    zn=HALL_FAR+k*PITCH;zf=zn+PITCH;zc=(zn+zf)/2
    box(f"RB_RIGHT__lower_wood_panel_{k}",(HALF_W+.12,1.17,zc),
        (.29,2.34,PITCH+.025),"wood","right_wall")
    box(f"RB_RIGHT__wood_dado_cap_{k}",(HALF_W-.03,2.41,zc),
        (.50,.16,PITCH+.02),"wood_trim","right_wall")
    for edge,zz in ((0,zn),(1,zf)):
        box(f"RB_RIGHT__stone_pier_{k}_{edge}",(HALF_W+.03,5.1,zz),
            (.65,5.97,.48),"highlight_stone","pillar")
        box(f"RB_RIGHT__pier_cap_{k}_{edge}",(HALF_W+.025,8.16,zz),
            (.82,.49,.78),"highlight_stone","pillar")
    # glass panel permits winter exterior to be seen in renderer
    quad(f"RB_WINDOW_{k}__bluewinter_glass",
         [(HALF_W+.01,WINDOW_Y0,zn+.25),(HALF_W+.01,WINDOW_Y0,zf-.25),
          (HALF_W+.01,WINDOW_Y1,zf-.25),(HALF_W+.01,WINDOW_Y1,zn+.25)],
         "glass","window")
    for zz,j in [(zn+.24,0),(zc,1),(zf-.24,2)]:
        box(f"RB_WINDOW_{k}__mullion_{j}",(HALF_W-.095,5.39,zz),
            (.14,5.46,.090),"deep_stone","window")
    for h,y in enumerate((4.14,7.13)):
        box(f"RB_WINDOW_{k}__transom_{h}",(HALF_W-.105,y,zc),
            (.16,.105,PITCH-.44),"highlight_stone","window")
    box(f"RB_WINDOW_{k}__sill",(HALF_W-.095,WINDOW_Y0,zc),
        (.66,.21,PITCH-.42),"highlight_stone","window")
    box(f"RB_WINDOW_{k}__upper_arch_header",
        (HALF_W+.055,8.3,zc),(.55,.34,PITCH-.4),"highlight_stone","window")
    # diffuse diagonal sun beams and reflected patches are separate overlays,
    # not a claim of physically traced sunlight.
    if k in (1,2,3,5):
        z=zc
        quad(f"RB_GOLDEN_LIGHT__floor_pool_{k}",
             [(1.05,.048,z-1.25),(3.97,.048,z-1.72),
              (3.97,.048,z-.77),(1.05,.048,z+.65)],
             "sunlight","sunlight")

# Longitudinal moulding and deeply pointed rib bays: all part of same roof.
for side,x in [("left",-HALF_W),("right",HALF_W)]:
    box(f"RB_MOLDING__{side}_vault_spring",(x,8.12,-.75),
        (.42,.27,HALL_NEAR-HALL_FAR),"highlight_stone","moulding")
for k in range(BAYS+1):
    z=HALL_FAR+k*PITCH
    gothic_arc(f"RB_GOTHIC_RIB__bay_{k}",z,.092,"highlight_stone","arch_rib")
    # Midbay diagonal thin secondary vault ribs add depth to masonry.
    if k<BAYS:
        mid=z+PITCH*.5
        gothic_arc(f"RB_GOTHIC_RIB__inner_{k}",mid,.047,"deep_stone","arch_rib")

# Central far staircase (not inherited from the original misplaced lateral stairs).
STAIR_FIRST=-17.65;TREAD_H=.185;TREAD_RUN=.405;N_STEPS=16
for i in range(N_STEPS):
    y=(i+1)*TREAD_H
    z=STAIR_FIRST-(i+.5)*TREAD_RUN
    box(f"RB_STAIRS__tread_{i:02d}",(0,y/2,z),
        (3.42,y,TREAD_RUN+.008),"highlight_stone","stair")
    box(f"RB_STAIRS__dark_nosing_{i:02d}",(0,y+.012,z+TREAD_RUN*.43),
        (3.47,.025,.065),"deep_stone","stair")
box("RB_STAIRS__upper_gallery",(0,N_STEPS*TREAD_H-.13,-24.7),
    (5.6,.26,2.3),"highlight_stone","stair")
for side in (-1,1):
    x=side*1.83
    for i in range(N_STEPS//2+1):
        y=(i*2+1)*TREAD_H+.80
        z=STAIR_FIRST-(i*2+.5)*TREAD_RUN
        tube(f"RB_STAIRS__baluster_{side}_{i}",[x,y-.72,z],[x,y+.25,z],
             .065,"highlight_stone","stair_rail")
    tube(f"RB_STAIRS__handrail_{side}",[x,1.05,STAIR_FIRST],
         [x,N_STEPS*TREAD_H+1.05,STAIR_FIRST-N_STEPS*TREAD_RUN],
         .115,"wood_trim","stair_rail")
# End architecture and tall lancet window, visible beyond stair landing.
box("RB_FAR__back_wall",(0,6.1,-26.0),(8.2,12.2,.33),
    "limestone","far_wall")
box("RB_FAR__window_glow",(0,7.74,-25.76),(2.1,5.15,.1),
    "glass","far_window")
for x in (-1.24,1.24):
    box(f"RB_FAR__window_pier_{x}",(x,7.74,-25.58),
        (.33,5.6,.33),"highlight_stone","far_window")
box("RB_FAR__window_crossbar",(0,8.25,-25.52),(2.83,.15,.20),
    "highlight_stone","far_window")
# Distant gallery rail over the central landing.
for i in range(11):
    z=-25.32+i*.39
    if z>STAIR_FIRST-16*TREAD_RUN+.3:continue
    tube(f"RB_GALLERY__post_{i}",[-2.7,3.0,z],[-2.7,4.0,z],
         .06,"highlight_stone","gallery")
# Cold exterior beyond the transparent glazing: outdoor stage props only.
box("RB_EXTERIOR__winter_ground",(17,-.55,-.75),
    (26,.18,43),"snow","outdoor")
box("RB_EXTERIOR__distant_blue_sky",(28,10,-.75),
    (.20,27,53),"sky","outdoor")
for i in range(35):
    z=-17.5+(i%18)*1.95
    x=6.2+(i//18)*4.4+(.32 if i%2 else 0)
    h=2.5+(i%5)*.48
    tube(f"RB_FOREST__trunk_{i}",[x,0,z],[x,.84,z],
         .105,"wood_dark","forest")
    cone(f"RB_FOREST__spruce_{i}",(x,1.6+h*.34,z),.62+(i%3)*.12,h,
         "pine","forest")
    cone(f"RB_FOREST__snowcap_{i}",(x,1.6+h*.68,z),.31,h*.25,
         "pine_snow","forest")
# Far-off castle skyline should read through the right windows.
for k,z in enumerate((-14.5,-6.5,3.2,11.1)):
    bx=21.2+(k%2)*2.6
    box(f"RB_CASTLE__keep_{k}",(bx,5.65,z),(3.2,11.3,3.1),"castle","castle")
    cone(f"RB_CASTLE__spire_{k}",(bx,12.0,z),2.15,4.5,
         "deep_stone","castle")

# Validate new scene is independent; avoid any legacy school source nodes.
binary=SCENE.export(file_type="glb")
if not binary.startswith(b"glTF"):raise RuntimeError("Invalid glTF magic")
path=OUT/"lahudi-academy_ep01_s01_REBUILT_v1.glb"
path.write_bytes(binary)
loaded=trimesh.load(path,force="scene",process=False)
b=loaded.bounds
assert b.shape==(2,3) and np.isfinite(b).all()
assert len(loaded.geometry)>300
assert COUNTS["stair"]==33
report={
 "project":"現實遊戲","scene":"RG-GAME-02","episode":"EP01","shot":"S01",
 "version":"S01-CLEAN-SHEET-RB1","model":path.name,
 "source_policy":"NEW_GEOMETRY__NOT_BOUND_TO_PRELIMINARY_ACADEMY_MODEL",
 "reference":"1000038427.mp4 02:36 A01 frame and 00:12 A02",
 "model_bytes":len(binary),"sha256":hashlib.sha256(binary).hexdigest(),
 "mesh_count":len(loaded.geometry),"groups":COUNTS,
 "hall_width_m":HALF_W*2,
 "hall_length_m":HALL_NEAR-HALL_FAR,
 "vault_spring_m":SPRING,"vault_crown_m":CROWN,
 "door_count":BAYS,"door_clearance_nominal_m":DOOR_W,
 "window_count":BAYS,"central_stair_steps":N_STEPS,
 "bounding_box":b.tolist(),
 "GLB_reparse":"PASS","S06_modified":False,"five_canonical_GLBS_modified":False,
 "camera_film_overlay":"NOT_RUN","actor_swept_collision":"NOT_RUN",
 "physically_based_golden_sun":"NOT_RUN","author_approved":False,
 "next":"Render A01 perspective from NEW local axis and inspect against original, then optimize proportion; do not merge into entire academy before school-wide interfaces checked.",
 "limits":[
   "Standalone corridor rebuilt, not entire Academy campus/classrooms.",
   "Approximate architecture from 2D animation, not exact surveyed world coordinates.",
   "Sun pools represented by separate translucent geometry, not traced dynamic sunlight.",
   "Door leaf raised panels remain simplified in this candidate; geometry is not final cinematic.",
   "No automatic 1:1 camera or character blocking claim."
 ]
}
(OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(report,ensure_ascii=False),flush=True)
