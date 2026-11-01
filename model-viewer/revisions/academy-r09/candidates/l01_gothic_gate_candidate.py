#!/usr/bin/env python3
"""L01 Gothic twin-tower gate — isolated, unapproved R09 candidate.

Source: author's O01 aerial reference; not a measured drawing. The source
R09 GLB, navigation grid, published viewer and drawings are NEVER modified.
Coordinates: glTF Y-up, X east/west, Z = -campus plan Y. Site low-ground
Y=0.35 is derived from existing R09 reference (FFL 2.20, SITE_DZ -1.85).
The sizes below are design hypotheses, not author-approved dimensions.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import numpy as np
import trimesh

GROUND = 0.35
Z_GATE = -6.0
INNER_CLEAR = 7.90
TOWER_CENTERS = (-5.25, 5.25)
TOWER_WIDTH = 2.60
TOWER_DEPTH = 3.60
TOWER_BODY_HEIGHT = 9.00
SPIRE_HEIGHT = 5.00
ARCH_SPRING = 4.30
ARCH_APEX = 6.65
PALETTE = {
    "stone": (145, 152, 163, 255),
    "trim": (195, 198, 204, 255),
    "roof": (53, 71, 103, 255),
    "iron": (35, 42, 58, 255),
    "glass": (45, 68, 98, 255),
    "snow": (227, 233, 238, 255),
    "gold": (176, 143, 80, 255),
}
scene = trimesh.Scene()
parts = []

def add(name, mesh, material):
    mesh.visual.vertex_colors = np.tile(np.array(PALETTE[material], dtype=np.uint8), (len(mesh.vertices), 1))
    scene.add_geometry(mesh, geom_name=name, node_name=name)
    parts.append({"name": name, "material": material})

def box(name, center, extents, material):
    m = trimesh.creation.box(extents=extents)
    m.apply_translation(center)
    add(name, m, material)

def cone(name, center, radius, height, material, sections=8):
    m = trimesh.creation.cone(radius=radius, height=height, sections=sections)
    m.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
    m.apply_translation(center)
    add(name, m, material)

def vertical_cylinder(name, center, radius, height, material, sections=12):
    m = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    m.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
    m.apply_translation(center)
    add(name, m, material)

def rib(name, start, end, thickness=0.42, depth=0.72, material="trim", z=Z_GATE):
    x1, y1 = start
    x2, y2 = end
    length = math.hypot(x2 - x1, y2 - y1)
    m = trimesh.creation.box(extents=[length, thickness, depth])
    m.apply_transform(trimesh.transformations.rotation_matrix(math.atan2(y2-y1, x2-x1), [0,0,1]))
    m.apply_translation([(x1+x2)/2, (y1+y2)/2, z])
    add(name, m, material)

for side, cx in (("W", TOWER_CENTERS[0]), ("E", TOWER_CENTERS[1])):
    body_y = GROUND + TOWER_BODY_HEIGHT / 2
    box(f"L01_{side}_TOWER_STONE_CANDIDATE", (cx, body_y, Z_GATE),
        (TOWER_WIDTH, TOWER_BODY_HEIGHT, TOWER_DEPTH), "stone")
    for dx in (-1.08, 1.08):
        for dz in (-1.45, 1.45):
            box(f"L01_{side}_BUTTRESS_{'L' if dx<0 else 'R'}_{'F' if dz<0 else 'B'}",
                (cx+dx, GROUND+3.3, Z_GATE+dz), (.50, 6.60, .55), "trim")
    box(f"L01_{side}_TOWER_CORNICE", (cx, GROUND+8.78, Z_GATE), (3.05, .38, 4.05), "trim")
    box(f"L01_{side}_ROOF_BASE", (cx, GROUND+9.14, Z_GATE), (2.9, .35, 3.9), "roof")
    cone(f"L01_{side}_GOTHIC_SPIRE", (cx, GROUND+9.25, Z_GATE),
         1.92, SPIRE_HEIGHT, "roof", sections=8)
    vertical_cylinder(f"L01_{side}_SPIRE_FINIAL", (cx, GROUND+14.4, Z_GATE), .10, .9, "gold")
    for floor, y in enumerate((GROUND+3.1, GROUND+6.35), 1):
        box(f"L01_{side}_WINDOW_{floor}_GLAZING", (cx, y, Z_GATE-1.84), (.65, 1.48, .06), "glass")
        rib(f"L01_{side}_WINDOW_{floor}_POINT_L", (cx-.34,y+.70), (cx,y+1.02), .15, .15, z=Z_GATE-1.88)
        rib(f"L01_{side}_WINDOW_{floor}_POINT_R", (cx,y+1.02), (cx+.34,y+.70), .15, .15, z=Z_GATE-1.88)
    box(f"L01_{side}_SNOW_CORNICE", (cx, GROUND+9.01, Z_GATE), (2.9, .08, 3.86), "snow")

# Portal clear width = 7.90 m between tower inner faces (x ±3.95).
# Sloped ribs form a pointed opening; no central column.
rib("L01_GATE_POINTED_ARCH_W", (-3.95, GROUND+ARCH_SPRING), (0, GROUND+ARCH_APEX))
rib("L01_GATE_POINTED_ARCH_E", (0, GROUND+ARCH_APEX), (3.95, GROUND+ARCH_SPRING))
box("L01_GATE_UPPER_BRIDGE", (0, GROUND+7.75, Z_GATE), (7.90, 1.0, 1.05), "stone")
box("L01_GATE_PARAPET", (0, GROUND+8.42, Z_GATE), (7.90, .34, 1.28), "trim")
for k, x in enumerate(np.linspace(-3.45, 3.45, 9)):
    box(f"L01_GATE_BATTLEMENT_{k:02d}", (float(x), GROUND+8.85, Z_GATE), (.40, .70, .98), "stone")
box("L01_GATE_CREST_PANEL", (0, GROUND+8.11, Z_GATE-.55), (1.08, .70, .10), "roof")
vertical_cylinder("L01_GATE_CREST_ORB", (0, GROUND+8.12, Z_GATE-.64), .17, .12, "gold")
for side, x in (("W", -4.00), ("E", 4.00)):
    for k in range(5):
        box(f"L01_{side}_IRON_LEAF_BAR_{k}", (x, GROUND+1.7, Z_GATE-1.45+k*.72),
            (.06, 3.40, .05), "iron")

parser = argparse.ArgumentParser()
parser.add_argument("--out", default="L01_GOTHIC_GATE_candidate.glb")
args = parser.parse_args()
path = Path(args.out)
path.parent.mkdir(parents=True, exist_ok=True)
scene.export(path, file_type="glb")
loaded = trimesh.load(path, force="scene")
assert len(loaded.geometry) == len(parts), (len(loaded.geometry), len(parts))
assert all(m.is_watertight for m in loaded.geometry.values())
assert len(parts) >= 45
for n, m in loaded.geometry.items():
    lo, hi = m.bounds
    if lo[0] < 0 < hi[0] and lo[1] < GROUND+3.8 and hi[1] > GROUND+0.15 and lo[2] < Z_GATE < hi[2]:
        raise AssertionError(f"Central low passage occluded by {n}: {m.bounds}")
meta = {"status":"CANDIDATE_ONLY_NOT_APPROVED",
        "source":"O01 author-selected campus aerial (visual reference only)",
        "canonical_model_sha256":"80b4390068b5f78e805de7386ef53b9489d57f31f52e9a09ab1c01557fdf1c52",
        "candidate_file":str(path),"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
        "bytes":path.stat().st_size,"parts":len(parts),"portal_clear_width_m":INNER_CLEAR,
        "ground_y_m":GROUND,"tower_height_m":TOWER_BODY_HEIGHT+SPIRE_HEIGHT,
        "arch_spring_above_ground_m":ARCH_SPRING,"arch_apex_above_ground_m":ARCH_APEX,
        "limitations":["O01 not to scale","not integrated into R09","no 3D collision/capsule validation",
                       "gate/tower dimensions and appearance require author review","no formal deployment"]}
path.with_suffix(".qa.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(meta,ensure_ascii=False))
