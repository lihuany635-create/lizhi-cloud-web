#!/usr/bin/env python3
"""No-render, pure structural QA of Academy RB2 V4 exterior style pass."""
from pathlib import Path
import sys,json,hashlib,math
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
A=Path("model-viewer/staged-output/academy-all-corridors-rb2-v3")
B=Path("model-viewer/staged-output/academy-all-corridors-rb2-v4")
base,buf0,_=glb.load_glb(A/"lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v3.glb")
final,buf1,_=glb.load_glb(B/"lahudi-academy_ALL-CORRIDORS_RB2-GOTHIC_v4.glb")
manifest=json.loads((B/"report.json").read_text())
assert len(base["nodes"])==9245
assert len(final["nodes"])==14360
assert len(final["nodes"])-len(base["nodes"])==5115
assert buf0==buf1,"No geometry buffers were meant to change"
assert base["nodes"]==final["nodes"][:9245],"Preexisting Academy structures changed"
assert base["meshes"]==final["meshes"],"Facade only uses existing geometry"
assert len(final["materials"])==len(base["materials"])
new=final["nodes"][9245:]
assert all(n["name"].startswith("RG-GAME-02-ALLCOR-RB2-V4__") for n in new)
type_counts={}
roots=set()
low=99999.
for n in new:
 extras=n["extras"]
 roots.add(extras["source_shell"])
 type_counts[extras["kind"]]=type_counts.get(extras["kind"],0)+1
 assert extras["corridor_walkability"]=="NOT_INFERRED"
 sy=n["scale"][1]
 x,y,z,w=n.get("rotation",[0,0,0,1])
 # local cuboid bounds [-.5,+.5], conservative Y half-extent from rotation.
 ryx=2*(x*y+z*w)
 ryy=1-2*(x*x+z*z)
 ryz=2*(y*z-x*w)
 sy_extent=(abs(ryx)*n["scale"][0]+abs(ryy)*n["scale"][1]+abs(ryz)*n["scale"][2])/2
 below=n["translation"][1]-sy_extent
 low=min(low,below)
 assert below>=3.49,("New facade would encroach into lower door zone",n["name"],below)
assert len(roots)==28
assert type_counts["high_glazed_facade_panel"]==325
assert type_counts["facade_gothic_window_arch"]==2600
assert manifest["rendering"]=="NOT_RUN_BY_USER_REQUEST"
result={"version":manifest["version"],"v4_sha256":manifest["sha256"],
        "source_v3_first_9245_nodes_unchanged":True,
        "source_materials_and_meshes_unchanged":True,
        "source_mesh_binary_bytes_unchanged":True,
        "hall_shells_dressed":len(roots),"new_nodes":len(new),
        "minimum_new_geometry_y_m":round(low,4),
        "all_new_geometry_above_y_3_49_m":True,
        "new_types":type_counts,
        "render":"NOT_RUN","interior_corridor_validation":"NOT_RUN",
        "facade_GLASS_THROUGH_MASONRY":"NO_DECOY_PANEL_ONLY",
        "author_approved":False}
(B/"geometry-qa.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(result,ensure_ascii=False))
