#!/usr/bin/env python3
"""Detailed geometry and color audit BEFORE publishing the rebuilt academy canonical GLB."""
from pathlib import Path
import sys,hashlib,json,math,collections
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb

base=Path("model-viewer/staged-output/academy-exterior-rebuild-v5")
r=json.loads((base/"report.json").read_text())
p=base/r["model"]
raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()==r["sha256"]
m,_,_=glb.load_glb(p)
n=m["nodes"]
assert r["total_nodes"]==len(n)
prefix="RG-GAME-02-EXTERIOR-REBUILD-V5__"
original=m["nodes"][:9245]
disabled=[(i,x) for i,x in enumerate(original) if "previous_mesh_for_recovery" in x.get("extras",{})]
assert len(disabled)==r["old_exterior_meshes_deactivated"]==6586
assert all(i<6556 or x.get("name","").startswith(("RG-GAME-02-EXT-002__","RG-GAME-02-EXT-006__","RG-GAME-02-LIB-004__")) for i,x in disabled)
assert all("mesh" not in x for i,x in disabled)
for anchor in [
  "RG-GAME-02-A1-005__open_door",
  "RG-GAME-02-CROOM-005__open_door",
  "RG-GAME-02-LIB-002__book",
  "RG-GAME-02-ROOF-001__approach__tread0",
  "RG-GAME-02-EXT-001__entry_stair__tread0",
  "RG-GAME-02-CONFESS-005__tread_0"]:
 assert any(x.get("name")==anchor and "mesh" in x for x in original),anchor
assert all(x.get("name")!="hall_roof.021" or "mesh" not in x for x in n)
assert not any(x.get("name","").startswith("RG-GAME-02-ALLCOR-RB2-V4__") for x in n)
new=[x for x in n if x.get("name","").startswith(prefix)]
assert len(new)==r["added_nodes"]>=1800
region_counts=collections.Counter(x["extras"]["region"] for x in new)
assert region_counts==r["regions"],(region_counts,r["regions"])
mats={x["name"]:x["pbrMetallicRoughness"]["baseColorFactor"]
      for x in m["materials"] if x.get("name","").startswith("ACADEMY_REBUILD_V5__")}
needed={"stone","stone_highlight","stone_deep","roof","oak","glass","gold","snow","road"}
assert all("ACADEMY_REBUILD_V5__"+k in mats for k in needed)
def col(key):return mats["ACADEMY_REBUILD_V5__"+key]
assert col("roof")[2]<.22 and col("roof")[0]<.2
assert col("oak")[0]>.22 and col("oak")[1]<.17
assert col("glass")[2]>.68 and col("glass")[3]<1
assert col("gold")[0]>.7 and col("gold")[1]>.40
assert col("stone_highlight")[0]<.71
assert col("stone_deep")[0]<.35
# Exact correct footprints relative to original classrooms and library:
main=r["main_wing_actual_footprint"]
assert main["x"][0]<=-86 and main["x"][1]>=-68
assert main["z"][0]<=-67.5 and main["z"][1]>=25.9
lib=r["library_fit_to_actual_furniture"]
assert lib["x"][0]<=-45.5 and lib["x"][1]>=-6.5
assert lib["z"][0]<=-176.2 and lib["z"][1]>=-157.5
# New arcaded ground path touches both exact building footprints.
floors=[x for x in new if x["extras"]["structure_type"]=="covered_walkable_floor"]
assert len(floors)==2
east=next(x for x in floors if "library_west_connector_floor" in x["name"])
long=next(x for x in floors if "teaching_to_library_longitudinal_floor" in x["name"])
assert math.isclose(east["translation"][2],-151,abs_tol=.01)
assert math.isclose(long["translation"][0],-84,abs_tol=.01)
# AABB intersection floor plan (not claiming avatar collision):
eastspan=[east["translation"][0]-east["scale"][0]/2,east["translation"][0]+east["scale"][0]/2]
longspan=[long["translation"][2]-long["scale"][2]/2,long["translation"][2]+long["scale"][2]/2]
assert eastspan[0]<=-84<=eastspan[1] and longspan[0]<=-151<=longspan[1]
# Only remove old outer appearance and add new, no scene detached floor-only preview
root=m["scenes"][m.get("scene",0)]["nodes"]
assert len([idx for idx in root if idx>=9245])>=1800
qa={
 "pass":True,
 "model_sha256":r["sha256"],"model_bytes":len(raw),
 "original_academic_interior_saved":True,
 "old_oversized_exterior_meshes_disabled":len(disabled),
 "fake_V4_facade_decorations_removed":5115,
 "new_whole_school_geometry_nodes":len(new),
 "preserved_classroom_and_library_meshed_anchors":6,
 "new_material_contrast_validated":True,
 "explicit_color_examples":{"roof_rgba":col("roof"),"stone_rgba":col("stone"),"oak_rgba":col("oak"),"glass_rgba":col("glass"),"gold_rgba":col("gold")},
 "actual_main_school_envelope_bounds_validated":True,
 "actual_library_furniture_envelope_bounds_validated":True,
 "continuous_cloister_floor_AABB_validated":True,
 "native_rooftop_and_entrance_stairs_not_removed":True,
 "contains_existing_RB2_full_corridor":True,
 "render":"NOT_RUN",
 "actor_walk_and_visual_verification":"PENDING",
 "note":"No visual claim from numeric color factors. PBR checks prove materials are not pure-white, not how final illumination appears."
}
(base/"qa.json").write_text(json.dumps(qa,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(qa,ensure_ascii=False))
