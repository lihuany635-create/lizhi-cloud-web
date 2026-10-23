#!/usr/bin/env python3
"""No-render geometry gates for integrated Academy corridor GLB."""
from pathlib import Path
import sys, json, hashlib, math
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
base=Path("model-viewer/staged-output/academy-all-corridors-rb2-v1")
manifest=json.loads((base/"report.json").read_text())
path=base/manifest["model"]
raw=path.read_bytes()
assert hashlib.sha256(raw).hexdigest()==manifest["output_sha256"]
model,binary,_=glb.load_glb(path)
nodes=model["nodes"]
pref="RG-GAME-02-ALLCOR-RB2__"
named={n.get("name"):n for n in nodes}
# 100% of actual known school corridor 85.42 m covered by one walkable slab.
floor=named[pref+"corridor_level4_stone_slab"]
assert math.isclose(floor["translation"][0],-70.25,abs_tol=.001)
assert math.isclose(floor["translation"][1]+floor["scale"][1]/2,4.0,abs_tol=.001)
assert math.isclose(floor["scale"][2],85.42,abs_tol=.001)
assert len(nodes)==8931
# New class portal cosmetics must not intrude into actual door openings.
openings=[(-47.7,1.2,"RG-GAME-02-A1-005__open_door"),
          (-23.7,1.2,"RG-GAME-02-CROOM-005__open_door")]
for z,width,old in openings:
    assert "mesh" in named[old],old
    assert any(pref+"A1_jamb_" in k or pref+"CROOM_jamb_" in k for k in named)
    for name,node in named.items():
        if name.startswith(pref) and (("left_wall_back_" in name) or ("recessed_oak_door_" in name)):
            center=node["translation"][2]
            extent=node["scale"][2]
            if abs(center-z)<width*.5+extent*.5-.0001:
                raise AssertionError("New corridor wall overlaps real classroom opening: "+name)
# Side-stair branch remains accessible, with original steps intact.
for name,n in named.items():
    if name.startswith(pref) and "left_wall_back_" in name:
        lo=n["translation"][2]-n["scale"][2]/2
        hi=n["translation"][2]+n["scale"][2]/2
        assert hi<=10.2 or lo>=12.5,("side stair blocked",name,lo,hi)
assert sum(n.get("name","").startswith("RG-GAME-02-CONFESS-005__tread_") and "mesh" in n for n in nodes)>=24
assert sum(n.get("name","").startswith("RG-GAME-02-ROOF-001__approach__tread") and "mesh" in n for n in nodes)>=12
# Dense architecture: twenty connected bay intervals exactly cover the source Z span.
for k in range(20):
    expectedZ=-67.5+(k+.5)*85.42/20
    n=named[pref+f"high_window_glass_{k:02d}"]
    assert abs(n["translation"][2]-expectedZ)<.003
    assert any(x.startswith(pref+f"bay{k:02d}_vault_surface_") for x in named)
    assert any(x.startswith(pref+f"bay{k:02d}_rib_") for x in named)
assert sum(n.get("name","").startswith(pref) for n in nodes)==manifest["added_corridor_nodes"]
# Source school remains; old meshes backed up for staging, no irreversible delete.
for disabled in manifest["disabled"]:
    n=nodes[disabled["index"]]
    assert "mesh" not in n and n["extras"]["review_backup_mesh"]==disabled["mesh"]
checks={"sha_check":True,"one_continuous_floor":True,"source_classroom_entrances_clear":True,
        "stair_bifurcation_clear":True,"original_stair_nodes_preserved":True,
        "twenty_bays_connected_z":True,"source_mesh_backup_reversible":True,
        "no_render_executed":True,"full_body_collision_certified":False,
        "author_approved":False}
out=base/"geometry-qa.json"
out.write_text(json.dumps({"scene":"RG-GAME-02","revision":manifest["version"],
    "model_sha256":manifest["output_sha256"],"checks":checks,
    "QA_LIMIT":"Static axis-aligned module geometry only; no animated person navigation/continuous collision or visual approval."},
    ensure_ascii=False,indent=2)+"\n")
print("GEOMETRY QA PASS",json.dumps(checks,ensure_ascii=False))
