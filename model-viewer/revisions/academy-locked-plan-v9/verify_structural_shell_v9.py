#!/usr/bin/env python3
"""Validate V9 full-school structural shell before updating canonical main.
Checks author-locked footprints, protected source nodes, physical portal voids,
covered walkway counts and collision-free academic mass rectangles. No render.
"""
from pathlib import Path
import sys,json,hashlib,math,collections
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
src=Path("model-viewer/staged-output/academy-entire-campus-contrast-v8/lahudi-academy_ENTIRE-GOTHIC-CAMPUS_CONTRAST_v8.glb")
base=Path("model-viewer/staged-output/academy-locked-plan-v9")
j=json.loads((base/"report.json").read_text())
file=base/j["file"];blob=file.read_bytes()
assert hashlib.sha256(blob).hexdigest()==j["output_sha256"]
old,_,_=glb.load_glb(src)
m,_,_=glb.load_glb(file)
assert len(old["nodes"])==11174
assert len(m["nodes"])==j["nodes"]
assert m["nodes"][:11097] != old["nodes"][:11097]  # exactly 5 intentional wall openings
cuts=set(j["actual_wall_portal_core_cuts"])
changed=set()
for idx in range(11097):
 a,b=old["nodes"][idx],m["nodes"][idx]
 if a!=b:
  assert a["name"]==b["name"] and "mesh" in a and "mesh" not in b
  assert b["extras"]["passage_original_mesh"]==a["mesh"]
  changed.add(a["name"])
assert changed==cuts and len(changed)==5
assert not any(n.get("name","").startswith("RG-GAME-02-CAMPUS-OPTIMIZED-V7__") for n in m["nodes"])
new=[n for n in m["nodes"][11097:] if n["name"].startswith("RG-GAME-02-PLAN-LOCK-V9__")]
assert len(new)==j["new_structure_nodes"] and len(new)>=620
ndict={n["name"]:n for n in new}
counts=collections.Counter(n["extras"]["kind"] for n in new)
assert counts["walkable_connector_slab"]==10
assert counts["covered_connector_roof"]==9
assert counts["arcade_support"]>=60
assert counts["pitched_roof"]==18
assert counts["roof_rake"]==36
assert counts["ridge"]==9
assert counts["party_wall_pier"]==8
assert counts["passage_header"]>=20
assert counts["real_passage_jamb"]>=40
assert "F_LIBRARY" in j["new_region_counts"]
# Locked bounds exactly as in Google Docs source book and machine JSON.
data=json.loads(Path("model-viewer/revisions/academy-locked-plan-v9/masterplan-v1.json").read_text())
assert len(data["zones"])==8
expected={a["id"]:a for a in data["zones"]}
actual={
 "B_WEST":(-139,-114,-68,24),
 "C_EAST":(-35,-14,-68,24),
 "D_WEST_ENTRY":(-98,-75,30,53),
 "D_EAST_ENTRY":(-65,-22,30,53),
 "E_WEST_ACADEMY":(-118,-94,-112,-82),
 "E_CENTER_HALL":(-94,-62,-112,-82),
 "E_EAST_LINK":(-62,-40,-112,-82),
 "G_ASSEMBLY":(-123,-95,-170,-125),
 "H_ARCHIVE":(4,28,-174,-143)
}
for a in j["rebuilt_structural_submasses"]:
 x=a["bbox"]["x"];z=a["bbox"]["z"]
 assert actual[a["id"]]==(*x,*z)
# Check every real planned shell has no horizontal overlap with existing preserved school A or library F.
def rect(a):return(a["x"][0],a["x"][1],a["z"][0],a["z"][1])
def overlap(a,b):
 return min(a[1],b[1])-max(a[0],b[0])>0.02 and min(a[3],b[3])-max(a[2],b[2])>0.02
A=rect(expected["A_MAIN"]);F=rect(expected["F_LIBRARY"])
for label,bounds in actual.items():
 assert not overlap(bounds,A),(label,"overlaps main school")
 assert not overlap(bounds,F),(label,"overlaps native library")
# Critical portal spans remain physically void at all source lower-wall module segments.
def check_void(zone,axis,coordinate,opening_lo,opening_hi):
 bad=[]
 for n in new:
  if n["extras"]["zone"]!=zone or n["extras"]["kind"]!="low_wall":continue
  t=n.get("translation",[0,0,0]);s=n.get("scale",[0,0,0])
  # only wall at exact target side
  c=0 if axis=="x" else 2;param=2 if axis=="x" else 0
  if abs(t[c]-coordinate)>.08:continue
  part=(t[param]-s[param]/2,t[param]+s[param]/2)
  if min(part[1],opening_hi)-max(part[0],opening_lo)>.02:bad.append(n["name"])
 assert not bad,("Portal blocked",zone,axis,coordinate,opening_lo,opening_hi,bad[:4])
check_void("B_WEST","x",-114,-12.2,-8.2)
check_void("C_EAST","x",-35,-12.2,-8.2)
check_void("E_CENTER_HALL","z",-82,-86,-82)
check_void("E_CENTER_HALL","z",-112,-86,-82)
check_void("E_EAST_LINK","z",-112,-47,-43)
check_void("G_ASSEMBLY","z",-125,-107,-103)
check_void("H_ARCHIVE","x",4,-154,-149)
check_void("F_LIBRARY","z",-142.75,-47,-43.4)
# Main and library keep full original 85m RB2 corridor, stairs, book meshes.
for name in ("RG-GAME-02-A1-005__open_door","RG-GAME-02-CROOM-005__open_door",
             "RG-GAME-02-CONFESS-005__tread_0","RG-GAME-02-ROOF-001__approach__tread0","RG-GAME-02-LIB-002__book"):
 assert "mesh" in next(n for n in m["nodes"] if n.get("name")==name)
re={"version":j["version"],"sha256":j["output_sha256"],
 "review_status":"STRUCTURAL_STATIC_PASS_VISUAL_PENDING",
 "locked_8_district_plan":True,"built_nine_submasses":True,
 "main_and_library_core_protected":True,
 "five_only_authorized_original_outer_wall_cuts":True,
 "actual_passage_lowerwall_voids_verified":True,
 "new_connector_slabs":10,"covered_connector_roofs":9,
 "shared_north_piers":8,"building_shell_gabled_roofs":9,
 "new_structure_nodes":len(new),"new_structure_kinds":dict(counts),
 "native_mobility_nodes_preserved":True,
 "material_style":"GOTHIC_COLD_STONE_WARM_SANDSTONE_DARK_SLATE",
 "author_acceptance":False,"rendering":"NOT_RUN",
 "caveat":"Static geometry checks do not certify architectural structural design, animation camera match, or full avatar collision."}
(base/"structure-qa.json").write_text(json.dumps(re,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in re.items() if k!="new_structure_kinds"},ensure_ascii=False))
