"""HADES-v3.0 — 《現實遊戲》EP02 哈德斯家 rebuilt from the 2026-10-26 23-image package (v2).

Sources (all DRAFT / unapproved):
  A-101/A-102 R00 SVG plan coordinates (walls, doors D-01..D-09, windows), A-201..A-204 R01 sill/head heights,
  A-103 R01 roof (E-W ridge +7.700, eaves +6.100, 450 overhang), A-301/A-401 R01 stair (16 x 187.5, 7 x 260 + 900 landing),
  A-001 R00 site (15 x 18 m lot, single black car 4.3 m south of wall), I-101/I-102 furniture, mood boards for colours.
Plan units mm, X east / Y north / Z up, origin = 1F SW exterior corner (README §2 proposal).
Run:  python3 -I build_hades_v3.py <out.glb> <report_dir>
"""
import sys, json, math, hashlib, pathlib
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from glb_writer import Node, Writer, box, prism, hull_x, cyl, cyl_axis, sphere, transform, look_at_quat, to_gltf

OUT = pathlib.Path(sys.argv[1]); REP = pathlib.Path(sys.argv[2]); REP.mkdir(parents=True, exist_ok=True)
REV = 'HADES-v3.1'
W = Writer()
M = {}
for k, h, r, *rest in [
    ('ext_wall', '#EFE8DE', .85), ('int_wall', '#F4EFE6', .9), ('trim', '#D9D6D0', .7), ('roof', '#66727E', .8), ('roof_line', '#55616C', .8),
    ('frame', '#3E5468', .5), ('door_ext', '#55504A', .55), ('door_int', '#C99D66', .6), ('oak', '#C49A6C', .6), ('oak_dark', '#8E6A48', .6),
    ('floor_oak', '#D4B48A', .55), ('tile', '#E9E2D5', .35), ('wet_tile', '#D7DEDE', .3), ('concrete', '#A9A59D', .9),
    ('fabric', '#E4D9C6', .95), ('fabric_green', '#7C8B58', .95), ('fabric_blue', '#A8B6C6', .95), ('bedding', '#F3EFE7', .95), ('rug', '#D8CCB3', 1),
    ('ceramic', '#F5F5F2', .25), ('metal', '#A1A6AA', .35, .8), ('black', '#1D2125', .5), ('screen', '#101418', .2),
    ('car', '#14171B', .25, .6), ('car_glass', '#26313B', .1), ('tire', '#101010', .9), ('chrome', '#C8CCD0', .2, 1),
    ('grass', '#7EA05A', 1), ('paver', '#CDB99B', .9), ('asphalt', '#4A4D50', .95), ('kerb', '#B9B6AE', .9), ('line_paint', '#F2F0E8', .8),
    ('leaf', '#4F7B3B', .9), ('leaf_dark', '#3E6630', .9), ('trunk', '#6B4F36', .9), ('pot', '#E8E3D9', .6), ('soil', '#5A4433', 1),
    ('paper', '#F5F1E6', .9), ('uniform', '#2E3A55', .9), ('book_a', '#8A4B3C', .8), ('book_b', '#3F5F7A', .8), ('book_c', '#C8A94F', .8),
    ('mirror', '#DCE6EA', .05, 1), ('stone', '#E6DED0', .3)]:
    W.material(k, h, r, rest[0] if rest else 0.0); M[k] = k
W.material('glass', '#CFE3EC', .05, 0, alpha=.22)
W.material('glow', '#FFE9C0', .5, 0, emissive='#FFD9A0')
W.material('lens', '#F2F2EA', .1, 0, emissive='#FFFFFF')
W.material('tail', '#7A1010', .3, 0, emissive='#5A0000')

def ex(asset, **kw):
    d = {'asset_id': asset, 'revision': REV, 'status': 'CANDIDATE_DRAFT', 'author_approval': 'PENDING', 'world': 'GAME', 'units_source': 'mm plan, exported m'}
    d.update(kw); return d

root = Node('RG_EP02_HADES_HOUSE', ex('RG_EP02_HADES_HOUSE', basis='EP02 23-image package v2 (2026-10-26)'))
SITE = root.group('SITE'); SHELL = root.group('SHELL'); OPEN = root.group('OPEN'); STAIR = root.group('STAIR')
F1 = root.group('FLOOR_1'); F2 = root.group('FLOOR_2'); CAM = root.group('CAMERA'); LIG = root.group('LIGHTS')
walls_aabb = []; furn_aabb = []

def reg(lst, name, parts):
    vs = np.vstack([g[0] for g, _ in parts]); lst.append({'name': name, 'min': vs.min(0).tolist(), 'max': vs.max(0).tolist()})

# ---------------------------------------------------------------- walls with openings
def wall(parent, name, axis, line, a0, a1, z0, z1, t, side='c', openings=(), mat='int_wall', register=True):
    """axis 'x': runs along X at Y=line. side '+': occupies line..line+t, '-': line-t..line, 'c': centred."""
    lo, hi = {'+': (line, line + t), '-': (line - t, line), 'c': (line - t / 2, line + t / 2)}[side]
    ops = [(max(a, a0), min(b, a1), zs, zh) for a, b, zs, zh in openings if b > a0 and a < a1]
    br = sorted({a0, a1, *[o[0] for o in ops], *[o[1] for o in ops]})
    n = parent.obj(name, ex(name, element='wall', thickness_mm=t))
    for u0, u1 in zip(br, br[1:]):
        if u1 - u0 < 1: continue
        cuts = sorted((zs, zh) for a, b, zs, zh in ops if a <= u0 + .1 and b >= u1 - .1)
        z = z0
        for zs, zh in cuts + [(z1, z1)]:
            if zs - z > 1:
                n.add(box(u0, u1, lo, hi, z, zs) if axis == 'x' else box(lo, hi, u0, u1, z, zs), mat)
            z = max(z, zh)
    if register:
        for (v, f), m in n.parts: walls_aabb.append({'name': name, 'min': v.min(0).tolist(), 'max': v.max(0).tolist()})
    return n, (lo, hi)

def window(name, axis, wall_lo, wall_hi, a, b, zs, zh, wid):
    n = OPEN.obj(name, ex(name, element='window', provisional_id=wid, width_mm=b - a, sill_mm=zs, head_mm=zh))
    c = (wall_lo + wall_hi) / 2; d = 70; fw = 55
    def B(u0, u1, w0, w1, z0, z1, m):
        n.add(box(u0, u1, w0, w1, z0, z1) if axis == 'x' else box(w0, w1, u0, u1, z0, z1), m)
    B(a, b, c - d / 2, c + d / 2, zs, zs + fw, 'frame'); B(a, b, c - d / 2, c + d / 2, zh - fw, zh, 'frame')
    B(a, a + fw, c - d / 2, c + d / 2, zs, zh, 'frame'); B(b - fw, b, c - d / 2, c + d / 2, zs, zh, 'frame')
    m = (a + b) / 2; B(m - 22, m + 22, c - d / 2, c + d / 2, zs, zh, 'frame')
    B(a + fw, b - fw, c - 6, c + 6, zs + fw, zh - fw, 'glass')
    # exterior sill ledge on the outside face
    out = wall_lo if wall_lo in (0, 8800) else wall_hi
    sgn = -1 if out == wall_lo else 1
    if wall_lo == 0 and axis == 'x' or wall_lo == 0 and axis == 'y': out, sgn = wall_lo, -1
    if wall_hi == 8000 or wall_hi == 9000: out, sgn = wall_hi, 1
    B(a - 40, b + 40, min(out, out + sgn * 60), max(out, out + sgn * 60), zs - 40, zs, 'trim')
    return n

def door(name, axis, wall_lo, wall_hi, a, b, z0, h, hinge, tip, mat, did, note):
    n = OPEN.obj(name, ex(name, element='door', door_id=did, width_mm=b - a, height_mm=h, swing='as drawn on A-101/A-102 R00 (open position)', note=note))
    t = wall_hi - wall_lo + 30; c = (wall_lo + wall_hi) / 2
    def B(u0, u1, w0, w1, zz0, zz1, m):
        n.add(box(u0, u1, w0, w1, zz0, zz1) if axis == 'x' else box(w0, w1, u0, u1, zz0, zz1), m)
    B(a - 50, a, c - t / 2, c + t / 2, z0, z0 + h + 50, 'trim'); B(b, b + 50, c - t / 2, c + t / 2, z0, z0 + h + 50, 'trim')
    B(a - 50, b + 50, c - t / 2, c + t / 2, z0 + h, z0 + h + 50, 'trim')
    # leaf in drawn open position: from hinge point to tip (plan), thickness 40
    hx, hy = hinge; tx, ty = tip; L = math.hypot(tx - hx, ty - hy); ux, uy = (tx - hx) / L, (ty - hy) / L; px, py = -uy * 20, ux * 20
    s0 = (hx + ux * 15, hy + uy * 15); s1 = (tx - ux * 10, ty - uy * 10)
    poly = [(s0[0] - px, s0[1] - py), (s1[0] - px, s1[1] - py), (s1[0] + px, s1[1] + py), (s0[0] + px, s0[1] + py)]
    if (poly[1][0] - poly[0][0]) * (poly[2][1] - poly[0][1]) - (poly[1][1] - poly[0][1]) * (poly[2][0] - poly[0][0]) < 0: poly = poly[::-1]
    n.add(prism(poly, z0 + 10, z0 + h - 10), mat)
    hxp, hyp = tx - ux * 70, ty - uy * 70
    for sg in (-1, 1): n.add(box(hxp - 15 + sg * px * 1.6, hxp + 15 + sg * px * 1.6, hyp - 15 + sg * py * 1.6, hyp + 15 + sg * py * 1.6, z0 + 980, z0 + 1010), 'metal')
    hu = hinge[0] if axis == 'x' else hinge[1]; cu = b if abs(hu - a) < abs(hu - b) else a
    closed = (cu, hinge[1]) if axis == 'x' else (hinge[0], cu)
    return n, {'id': did, 'hinge': hinge, 'tip': tip, 'closed': closed, 'radius': L, 'z0': z0}

# ---------------------------------------------------------------- slabs & floors
H1, SLAB_B, F2Z, CEIL2 = 2780, 2780, 3000, 5780
s = SHELL.obj('slab_1F', ex('slab_1F', note='ground slab, finish +0.000')); s.add(box(0, 9000, 0, 8000, -300, -10), 'concrete')
fin1 = SHELL.obj('floor_finish_1F', ex('floor_finish_1F'))
for r in [(2840, 8800, 200, 5160), (200, 2840, 3040, 6260), (2840, 4110, 5160, 7800), (6350, 8800, 5160, 7800)]: fin1.add(box(r[0], r[1], r[2], r[3], -10, 0), 'floor_oak')
for r in [(200, 2840, 200, 3040)]: fin1.add(box(*r, -10, 0), 'tile')
for r in [(200, 2840, 6260, 7800), (4110, 6350, 5160, 7800)]: fin1.add(box(*r, -10, 0), 'wet_tile')
STAIR_OPEN = (200, 2840, 3420, 6140)
s2 = SHELL.obj('slab_2F', ex('slab_2F', thickness_mm=220, stair_void_mm=STAIR_OPEN, note='A-301 R01 proposal; beam depth unknown'))
for r in [(200, 8800, 200, 3420), (2840, 8800, 3420, 6140), (200, 8800, 6140, 7800)]: s2.add(box(*r, SLAB_B, F2Z - 10), 'trim')
fin2 = SHELL.obj('floor_finish_2F', ex('floor_finish_2F'))
for r in [(200, 8800, 200, 3420), (2840, 8800, 3420, 6140), (2840, 8800, 6140, 7800)]: fin2.add(box(*r, F2Z - 10, F2Z), 'floor_oak')
fin2.add(box(200, 2840, 6140, 7800, F2Z - 10, F2Z), 'wet_tile')
c2 = SHELL.obj('ceiling_2F', ex('ceiling_2F', note='flat ceiling +5.780; attic above not modelled'))
c2.add(box(200, 8800, 200, 7800, CEIL2, CEIL2 + 20), 'int_wall')

# ---------------------------------------------------------------- exterior walls (outer dims 9000 x 8000, t=200)
EXT_T, WALL_TOP = 200, 6080
S_OP = [(1100, 2080, 0, 2200), (5390, 7720, 820, 2280), (1100, 2400, 3920, 5320), (6080, 8430, 3860, 5350)]
N_OP = [(660, 1790, 1550, 2240), (4610, 5760, 1175, 2330), (7350, 8390, 860, 2300), (700, 1900, 4550, 5250), (6320, 8150, 3940, 5320)]
E_OP = [(1150, 2650, 880, 2280), (5350, 6660, 880, 2280), (1180, 2500, 3870, 5360), (6000, 7070, 3940, 5310)]
wall(SHELL, 'outer_wall_S', 'x', 0, 0, 9000, 0, WALL_TOP, EXT_T, '+', S_OP, 'ext_wall')
wall(SHELL, 'outer_wall_N', 'x', 8000, 0, 9000, 0, WALL_TOP, EXT_T, '-', N_OP, 'ext_wall')
wall(SHELL, 'outer_wall_W', 'y', 0, 200, 7800, 0, WALL_TOP, EXT_T, '+', [], 'ext_wall')
wall(SHELL, 'outer_wall_E', 'y', 9000, 200, 7800, 0, WALL_TOP, EXT_T, '-', E_OP, 'ext_wall')
slope = 1600 / 4450; RT = 180
def ztop(y): return 7700 - slope * abs(y - 4000)
for nm, x0, x1 in [('gable_W', 0, 200), ('gable_E', 8800, 9000)]:
    SHELL.obj(nm, ex(nm, note='A-203/A-204 R01 gable; no west windows added')).add(hull_x([(0, WALL_TOP), (8000, WALL_TOP), (4000, ztop(4000) - RT)], x0, x1), 'ext_wall')
band = SHELL.obj('floor_band', ex('floor_band', note='A-201..204 R01 band at +3.000'))
for b in [(-20, 9020, -20, 0), (-20, 9020, 8000, 8020), (-20, 0, 0, 8000), (9000, 9020, 0, 8000)]: band.add(box(*b, 2940, 3060), 'trim')
plinth = SHELL.obj('plinth', ex('plinth'))
for b in [(-15, 9015, -15, 0), (-15, 9015, 8000, 8015), (-15, 0, 0, 8000), (9000, 9015, 0, 8000)]:
    if b[2] == -15 and b[3] == 0:  # skip front door
        plinth.add(box(-15, 1100, -15, 0, -40, 250), 'concrete'); plinth.add(box(2080, 9015, -15, 0, -40, 250), 'concrete')
    else: plinth.add(box(*b, -40, 250), 'concrete')

# windows
WIN = [('W-1F-S-LIVING', 'x', 0, 200, 5390, 7720, 820, 2280, 'W-101?'), ('W-2F-S-FATHER', 'x', 0, 200, 1100, 2400, 3920, 5320, 'W-201'),
       ('W-2F-S-PROTAGONIST', 'x', 0, 200, 6080, 8430, 3860, 5350, 'W-202'),
       ('W-1F-N-BATH', 'x', 7800, 8000, 660, 1790, 1550, 2240, 'W-10x'), ('W-1F-N-KITCHEN', 'x', 7800, 8000, 4610, 5760, 1175, 2330, 'W-10x'),
       ('W-1F-N-DINING', 'x', 7800, 8000, 7350, 8390, 860, 2300, 'W-10x'), ('W-2F-N-BATH', 'x', 7800, 8000, 700, 1900, 4550, 5250, 'W-20x'),
       ('W-2F-N-MULTI', 'x', 7800, 8000, 6320, 8150, 3940, 5320, 'W-20x'),
       ('W-1F-E-LIVING', 'y', 8800, 9000, 1150, 2650, 880, 2280, 'W-10x'), ('W-1F-E-DINING', 'y', 8800, 9000, 5350, 6660, 880, 2280, 'W-10x'),
       ('W-2F-E-PROTAGONIST', 'y', 8800, 9000, 1180, 2500, 3870, 5360, 'W-20x'), ('W-2F-E-MULTI', 'y', 8800, 9000, 6000, 7070, 3940, 5310, 'W-20x')]
for w in WIN: window(*w)

# ---------------------------------------------------------------- interior walls
IT = 120
D = 2100
wall(SHELL, 'inner_1F_foyer_stair', 'x', 3100, 200, 2840, 0, H1, IT, 'c', [(370, 1280, 0, D)])
wall(SHELL, 'inner_1F_stair_bath', 'x', 6200, 200, 2840, 0, H1, IT)
wall(SHELL, 'inner_1F_x2900', 'y', 2900, 3040, 7800, 0, H1, IT, 'c', [(6690, 7570, 0, D)])
wall(SHELL, 'inner_1F_kitchen_W', 'y', 4050, 5040, 7800, 0, H1, IT, 'c', [(6020, 6900, 0, D)])
wall(SHELL, 'inner_1F_kitchen_S', 'x', 5100, 4110, 6410, 0, H1, IT)
wall(SHELL, 'inner_1F_kitchen_E_stub_S', 'y', 6350, 5160, 5350, 0, H1, IT)
wall(SHELL, 'inner_1F_kitchen_E_stub_N', 'y', 6350, 7480, 7800, 0, H1, IT)
wall(SHELL, 'inner_2F_father_N', 'x', 3100, 200, 4110, F2Z, CEIL2, IT, 'c', [(3030, 3910, F2Z, F2Z + D)])
wall(SHELL, 'inner_2F_x2900', 'y', 2900, 3160, 7800, F2Z, CEIL2, IT, 'c', [(3310, 4190, F2Z, F2Z + D), (6680, 7560, F2Z, F2Z + D)])
wall(SHELL, 'inner_2F_stair_bath', 'x', 6200, 200, 2840, F2Z, CEIL2, IT)
wall(SHELL, 'inner_2F_x4050_S', 'y', 4050, 200, 3960, F2Z, CEIL2, IT)
wall(SHELL, 'inner_2F_x4050_N', 'y', 4050, 5040, 7800, F2Z, CEIL2, IT)
wall(SHELL, 'inner_2F_protagonist_N', 'x', 3900, 4110, 8800, F2Z, CEIL2, IT, 'c', [(4560, 5440, F2Z, F2Z + D)])
wall(SHELL, 'inner_2F_multi_S', 'x', 5100, 4110, 8800, F2Z, CEIL2, IT, 'c', [(4750, 5630, F2Z, F2Z + D)])

DOORS = []
for args in [
    ('D-01', 'x', 0, 200, 1100, 2080, 0, 2200, (1100, 0), (1100, 980), 'door_ext', '1F south main door 980mm'),
    ('D-02', 'x', 3040, 3160, 370, 1280, 0, D, (370, 3100), (370, 2190), 'door_int', 'DEVIATION: A-101 R00 draws leaf opening into stair (370,4010) which collides with flight-1 treads in 3D; candidate swings into foyer pending author'),
    ('D-03', 'y', 2840, 2960, 6690, 7570, 0, D, (2900, 6690), (2020, 6690), 'door_int', '1F wet area -> corridor'),
    ('D-04', 'y', 3990, 4110, 6020, 6900, 0, D, (4050, 6020), (4930, 6020), 'door_int', '1F kitchen -> corridor'),
    ('D-05', 'x', 3040, 3160, 3030, 3910, F2Z, D, (3030, 3100), (3030, 2220), 'door_int', '2F father room'),
    ('D-06', 'y', 2840, 2960, 3310, 4190, F2Z, D, (2900, 3310), (3780, 3310), 'door_int', '2F stair -> hall; opening partly beside stair void (A-402 risk)'),
    ('D-07', 'y', 2840, 2960, 6680, 7560, F2Z, D, (2900, 6680), (2020, 6680), 'door_int', '2F bathroom'),
    ('D-08', 'x', 3840, 3960, 4560, 5440, F2Z, D, (4560, 3900), (4560, 3020), 'door_int', '2F protagonist room'),
    ('D-09', 'x', 5040, 5160, 4750, 5630, F2Z, D, (4750, 5100), (4750, 5980), 'door_int', '2F multipurpose room')]:
    did = args[0]; _, info = door(did, *args[1:11], did, args[11]); info['axis'] = args[1]; DOORS.append(info)

# ---------------------------------------------------------------- roof (A-103 R01)
def roof_slab(nm, pts):
    SHELL.obj(nm, ex(nm, ridge_mm=7700, eaves_mm=6100, overhang_mm=450, pitch_deg=19.78)).add(hull_x(pts, -450, 9450), 'roof')
roof_slab('roof_S', [(-450, 6100 - RT), (4000, 7700 - RT), (4000, 7700), (-450, 6100)])
roof_slab('roof_N', [(4000, 7700 - RT), (8450, 6100 - RT), (8450, 6100), (4000, 7700)])
rl = SHELL.obj('roof_courses', ex('roof_courses', note='visual tile courses only'))
for y in np.arange(-450 + 300, 4000 - 100, 330):
    rl.add(hull_x([(y, ztop(y)), (y + 40, ztop(y + 40)), (y + 40, ztop(y + 40) + 18), (y, ztop(y) + 18)], -450, 9450), 'roof_line')
for y in np.arange(8450 - 300, 4000 + 100, -330):
    rl.add(hull_x([(y - 40, ztop(y - 40)), (y, ztop(y)), (y, ztop(y) + 18), (y - 40, ztop(y - 40) + 18)], -450, 9450), 'roof_line')
eav = SHELL.obj('eaves', ex('eaves', note='fascia, gutters, barge boards, ridge cap'))
eav.add(box(-470, 9470, -480, -440, 5880, 6110), 'trim'); eav.add(box(-470, 9470, 8440, 8480, 5880, 6110), 'trim')
eav.add(cyl_axis((-470, -530, 5950), (9470, -530, 5950), 60, 10), 'metal'); eav.add(cyl_axis((-470, 8530, 5950), (9470, 8530, 5950), 60, 10), 'metal')
for x0 in (-490, 9450):
    eav.add(hull_x([(-480, 5880), (4000, 7540), (4000, 7730), (-480, 6130)], x0, x0 + 40), 'trim')
    eav.add(hull_x([(4000, 7540), (8480, 5880), (8480, 6130), (4000, 7730)], x0, x0 + 40), 'trim')
eav.add(hull_x([(3850, ztop(3850)), (4150, ztop(4150)), (4150, ztop(4150) + 60), (4000, 7760), (3850, ztop(3850) + 60)][::-1][::-1], -470, 9470), 'roof_line')

# ---------------------------------------------------------------- stair (A-401 / A-301 R01)
R_H, TREAD, LAND = 187.5, 260, 900
Y_START = 6140 - LAND - 7 * TREAD  # 3420
FL1 = (220, 1420); FL2 = (1620, 2820)
f1 = STAIR.obj('flight_1', ex('flight_1', risers=8, riser_mm=R_H, treads=7, tread_mm=TREAD, direction='north (up)'))
for i in range(1, 8):
    y0 = Y_START + (i - 1) * TREAD; f1.add(box(*FL1, y0, y0 + TREAD, 0, i * R_H - 25), 'oak_dark'); f1.add(box(FL1[0], FL1[1], y0 - 20, y0 + TREAD, i * R_H - 25, i * R_H), 'oak')
land = STAIR.obj('landing', ex('landing', level_mm=1500, depth_mm=6140 - (Y_START + 7 * TREAD), note='landing net depth 900 by A-401; inner wall face limits to drawn 900'))
land.add(box(220, 2820, Y_START + 7 * TREAD, 6140, 1300, 1475), 'oak_dark'); land.add(box(220, 2820, Y_START + 7 * TREAD - 20, 6140, 1475, 1500), 'oak')
land.add(box(220, 1420, Y_START + 7 * TREAD, 6140, 0, 1300), 'int_wall')
land.add(box(2700, 2820, 6020, 6140, 0, 1300), 'int_wall')
f2 = STAIR.obj('flight_2', ex('flight_2', risers=8, riser_mm=R_H, treads=7, tread_mm=TREAD, direction='south (up) to 2F +3.000'))
for j in range(1, 8):
    top = 1500 + j * R_H; y1 = Y_START + 7 * TREAD - (j - 1) * TREAD; y0 = y1 - TREAD
    f2.add(box(*FL2, y0, y1, top - 250, top - 25), 'oak_dark'); f2.add(box(FL2[0], FL2[1], y0, y1 + 20, top - 25, top), 'oak')
f2.add(box(FL2[0], FL2[1], Y_START - 0, Y_START + 10, 3000 - 360, 3000), 'oak_dark')
f2.add(hull_x([(Y_START, 2500), (Y_START + 7 * TREAD, 1050), (Y_START + 7 * TREAD, 1300), (Y_START, 2750)], FL2[0], FL2[1]), 'int_wall')
spine = STAIR.obj('stair_spine_wall', ex('stair_spine_wall', note='200mm spine between flights, supports flight 2'))
spine.add(box(1420, 1620, Y_START, Y_START + 7 * TREAD, 0, 1500), 'int_wall')
gr = STAIR.obj('guardrails', ex('guardrails', height_mm=900, note='rails on flight 2 open side and 2F void edge; nosing-to-rail 900'))
x_r = FL2[0] + 30
gr.add(cyl_axis((x_r, Y_START + 7 * TREAD, 1500 + 900), (x_r, Y_START, 3000 + 900), 22), 'oak')
for j in range(0, 8):
    y = Y_START + 7 * TREAD - j * TREAD - TREAD / 2; zb = 1500 + (j + 1) * R_H if j < 7 else 3000
    if j < 7: gr.add(cyl_axis((x_r, y, zb), (x_r, y, zb + 900 - (TREAD / 2) * 1500 / 1820), 12), 'metal')
gr.add(cyl_axis((FL1[0] + 30, Y_START, R_H + 900), (FL1[0] + 30, Y_START + 7 * TREAD, 1500 + 900), 22), 'oak')
for xa in (240, 1420):
    pass
# 2F void edge guard at Y=3420 west of the stair arrival
gx0, gx1 = 200, FL2[0]
gr.add(box(gx0, gx1, Y_START - 25, Y_START + 25, F2Z + 960, F2Z + 1010), 'oak')
gr.add(box(gx0, gx1, Y_START - 6, Y_START + 6, F2Z + 100, F2Z + 940), 'glass')
for x in np.linspace(gx0 + 20, gx1 - 20, 5): gr.add(box(x - 20, x + 20, Y_START - 20, Y_START + 20, F2Z, F2Z + 960), 'oak')
# landing edge rail along north side of the 200mm slot
gr.add(box(1420, 1620, Y_START + 7 * TREAD - 20, Y_START + 7 * TREAD + 20, 1500, 1500 + 900), 'oak')
STAIR.obj('stair_void', ex('stair_void', bbox_mm=STAIR_OPEN, note='2F slab opening; empty node marker'))

# ---------------------------------------------------------------- furniture helpers
def F(parent, name, **kw):
    return parent.obj(name, ex(name, element='furniture', **kw))

def done(n): reg(furn_aabb, n.name, n.parts); return n

def cabinet(p, name, x0, x1, y0, y1, z0, h, body='oak', doors=None, face='-y', top=None):
    n = F(p, name); n.add(box(x0, x1, y0, y1, z0 + 60, z0 + h), body); n.add(box(x0 + 20, x1 - 20, y0 + 20, y1 - 20, z0, z0 + 60), 'oak_dark')
    if top: n.add(box(x0 - 10, x1 + 10, y0 - 10, y1 + 10, z0 + h, z0 + h + 30), top)
    if doors:
        k = doors
        if face in ('-y', '+y'):
            yy = y0 - 8 if face == '-y' else y1
            for i in range(k):
                a = x0 + (x1 - x0) * i / k; b = x0 + (x1 - x0) * (i + 1) / k
                n.add(box(a + 6, b - 6, yy, yy + 8, z0 + 80, z0 + h - 20), 'oak'); n.add(box((a + b) / 2 - 60, (a + b) / 2 + 60, yy - 12, yy, z0 + h - 120, z0 + h - 100), 'metal')
        else:
            xx = x0 - 8 if face == '-x' else x1
            for i in range(k):
                a = y0 + (y1 - y0) * i / k; b = y0 + (y1 - y0) * (i + 1) / k
                n.add(box(xx, xx + 8, a + 6, b - 6, z0 + 80, z0 + h - 20), 'oak'); n.add(box(xx - 12 if face == '-x' else xx + 8, xx if face == '-x' else xx + 20, (a + b) / 2 - 60, (a + b) / 2 + 60, z0 + h - 120, z0 + h - 100), 'metal')
    return done(n)

def table(p, name, x0, x1, y0, y1, z0, h=740, top='oak', legs='oak_dark', round_=False):
    n = F(p, name)
    if round_:
        cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2
        n.add(cyl(cx, cy, z0 + h - 35, z0 + h, r, 28), top); n.add(cyl(cx, cy, z0, z0 + h - 35, r * .35, 16), legs)
    else:
        n.add(box(x0, x1, y0, y1, z0 + h - 35, z0 + h), top)
        for x in (x0 + 50, x1 - 50):
            for y in (y0 + 50, y1 - 50): n.add(box(x - 22, x + 22, y - 22, y + 22, z0, z0 + h - 35), legs)
    return done(n)

def chair(p, name, cx, cy, z0, facing, seat='fabric'):
    n = F(p, name); n.add(box(cx - 220, cx + 220, cy - 220, cy + 220, z0 + 420, z0 + 470), seat)
    for dx in (-190, 190):
        for dy in (-190, 190): n.add(box(cx + dx - 18, cx + dx + 18, cy + dy - 18, cy + dy + 18, z0, z0 + 420), 'oak_dark')
    bx, by = {'+y': (0, -1), '-y': (0, 1), '+x': (-1, 0), '-x': (1, 0)}[facing]
    if bx: n.add(box(cx + bx * 200 - 18, cx + bx * 200 + 18, cy - 200, cy + 200, z0 + 470, z0 + 880), 'oak')
    else: n.add(box(cx - 200, cx + 200, cy + by * 200 - 18, cy + by * 200 + 18, z0 + 470, z0 + 880), 'oak')
    return done(n)

def plant(p, name, cx, cy, z0, h=1100, r=170):
    n = F(p, name, element2='plant'); n.add(cyl(cx, cy, z0, z0 + r * 1.8, r, 16), 'pot'); n.add(cyl(cx, cy, z0 + r * 1.8 - 30, z0 + r * 1.8, r - 15, 16), 'soil')
    n.add(cyl(cx, cy, z0 + r * 1.8, z0 + h * .55, 15, 6), 'trunk')
    rng = np.random.default_rng(int(hashlib.sha256(name.encode()).hexdigest()[:8], 16))
    for k in range(6):
        a = k * 2.4; rr = r * (.6 + .5 * rng.random()); zz = z0 + h * (.55 + .07 * k)
        n.add(sphere(cx + rr * math.cos(a), cy + rr * math.sin(a), zz, r * 1.0, r * .8, r * .55, 8, 5), 'leaf' if k % 2 else 'leaf_dark')
    return done(n)

def lamp_pendant(p, name, cx, cy, ztop, drop=700):
    n = p.obj(name, ex(name, element='light_fixture')); n.add(cyl_axis((cx, cy, ztop), (cx, cy, ztop - drop), 5, 6), 'black')
    n.add(sphere(cx, cy, ztop - drop - 90, 160, 160, 120, 14, 7), 'glow'); return n

def downlight(p, name, pts, z):
    n = p.obj(name, ex(name, element='light_fixture'))
    for x, y in pts: n.add(cyl(x, y, z - 12, z, 70, 12), 'glow')
    return n

def books(n, x0, x1, y0, y1, z, axis='x', h=230):
    L = (x1 - x0) if axis == 'x' else (y1 - y0); k = max(3, int(L / 45)); mats = ['book_a', 'book_b', 'book_c', 'paper']
    for i in range(k):
        if i % 7 == 6: continue
        hh = h - (i * 37 % 60)
        if axis == 'x': n.add(box(x0 + L * i / k + 3, x0 + L * (i + 1) / k - 3, y0, y1, z, z + hh), mats[i % 4])
        else: n.add(box(x0, x1, y0 + L * i / k + 3, y0 + L * (i + 1) / k - 3, z, z + hh), mats[i % 4])

def shelf(p, name, x0, x1, y0, y1, z0, h, axis='x', rows=5):
    n = F(p, name)
    if axis == 'x':
        n.add(box(x0, x0 + 25, y0, y1, z0, z0 + h), 'oak'); n.add(box(x1 - 25, x1, y0, y1, z0, z0 + h), 'oak')
    else:
        n.add(box(x0, x1, y0, y0 + 25, z0, z0 + h), 'oak'); n.add(box(x0, x1, y1 - 25, y1, z0, z0 + h), 'oak')
    for i in range(rows + 1):
        z = z0 + 40 + (h - 60) * i / rows; n.add(box(x0, x1, y0, y1, z, z + 22), 'oak')
        if i < rows and (i + len(name)) % 3 != 0:
            if axis == 'x': books(n, x0 + 40, x1 - 40, y0 + 30, y1 - 40, z + 22, 'x', min(230, (h - 60) / rows - 50))
            else: books(n, x0 + 30, x1 - 40, y0 + 40, y1 - 40, z + 22, 'y', min(230, (h - 60) / rows - 50))
    return done(n)

def wardrobe(p, name, x0, x1, y0, y1, z0, face, h=2100):
    k = max(2, round(((x1 - x0) if face in ('-y', '+y') else (y1 - y0)) / 480))
    return cabinet(p, name, x0, x1, y0, y1, z0, h, 'oak', k, face)

def bed(p, name, x0, x1, y0, y1, z0, head='+y', duvet='bedding', accent='fabric_green', pillows=1):
    """Local frame: u = foot(0) -> head(L), v = across (0..Wd). Mattress, draped duvet with folded band, throw, round pillows."""
    n = F(p, name)
    if head == '+y': L, Wd = y1 - y0, x1 - x0
    else: L, Wd = x1 - x0, y1 - y0
    def P(u, v):
        return (x0 + v, y0 + u) if head == '+y' else (x1 - u, y0 + v)
    def Bx(u0, u1, v0, v1, za, zb, m):
        (ax, ay), (bx, by) = P(u0, v0), P(u1, v1); n.add(box(ax, bx, ay, by, z0 + za, z0 + zb), m)
    Bx(0, L, 0, Wd, 120, 320, 'oak')                         # frame
    Bx(L - 60, L, 0, Wd, 0, 1000, 'oak')                     # headboard
    Bx(L - 70, L - 60, 40, Wd - 40, 600, 950, 'fabric')      # headboard cushion
    Bx(40, L - 70, 40, Wd - 40, 320, 560, 'bedding')         # mattress
    dl = L * .68                                             # duvet length from foot
    Bx(10, dl, 10, Wd - 10, 560, 630, duvet)                 # duvet top
    Bx(10, dl, 10, 40, 380, 630, duvet); Bx(10, dl, Wd - 40, Wd - 10, 380, 630, duvet); Bx(10, 40, 10, Wd - 10, 380, 630, duvet)  # drape
    Bx(dl - 260, dl, 15, Wd - 15, 630, 660, duvet)           # folded-back band
    Bx(60, 480, 0, Wd, 630, 655, accent)                     # throw over foot
    Bx(60, 480, 0, 22, 430, 655, accent); Bx(60, 480, Wd - 22, Wd, 430, 655, accent)
    w = (Wd - 160) / pillows
    for i in range(pillows):
        cu, cv = L - 70 - 230, 80 + (i + .5) * w; cx, cy = P(cu, cv)
        rx, ry = ((w / 2 - 25), 190) if head == '+y' else (190, (w / 2 - 25))
        n.add(sphere(cx, cy, z0 + 630, rx, ry, 75, 14, 7), 'bedding')
    for u in (40, L - 40):
        for v in (40, Wd - 40):
            cx, cy = P(u, v); n.add(box(cx - 25, cx + 25, cy - 25, cy + 25, z0, z0 + 120), 'oak_dark')
    return done(n)

def sofa_seg(n, x0, x1, y0, y1, z0, back, arms=()):
    n.add(box(x0, x1, y0, y1, z0 + 80, z0 + 420), 'fabric'); n.add(box(x0 + 10, x1 - 10, y0 + 10, y1 - 10, z0, z0 + 80), 'oak')
    d = 200
    if back == '-y': n.add(box(x0, x1, y0, y0 + d, z0 + 420, z0 + 820), 'fabric')
    if back == '+y': n.add(box(x0, x1, y1 - d, y1, z0 + 420, z0 + 820), 'fabric')
    if back == '+x': n.add(box(x1 - d, x1, y0, y1, z0 + 420, z0 + 820), 'fabric')
    if back == '-x': n.add(box(x0, x0 + d, y0, y1, z0 + 420, z0 + 820), 'fabric')
    for a in arms:
        if a == '-x': n.add(box(x0, x0 + 160, y0, y1, z0 + 420, z0 + 620), 'fabric')
        if a == '+x': n.add(box(x1 - 160, x1, y0, y1, z0 + 420, z0 + 620), 'fabric')
        if a == '-y': n.add(box(x0, x1, y0, y0 + 160, z0 + 420, z0 + 620), 'fabric')
        if a == '+y': n.add(box(x0, x1, y1 - 160, y1, z0 + 420, z0 + 620), 'fabric')

def toilet(p, name, cx, cy, z0, back='+y'):
    n = F(p, name); s = 1 if back == '+y' else -1
    n.add(box(cx - 190, cx + 190, cy - s * 330, cy + s * 120, z0, z0 + 400), 'ceramic'); n.add(cyl(cx, cy - s * 150, z0 + 400, z0 + 430, 200, 18), 'ceramic')
    n.add(box(cx - 220, cx + 220, cy + s * 120, cy + s * 300, z0, z0 + 820), 'ceramic'); return done(n)

def basin(p, name, x0, x1, y0, y1, z0, mirror_side='+y'):
    n = F(p, name); n.add(box(x0, x1, y0, y1, z0, z0 + 800), 'oak'); n.add(box(x0 - 10, x1 + 10, y0 - 10, y1 + 10, z0 + 800, z0 + 830), 'stone')
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; n.add(cyl(cx, cy, z0 + 830, z0 + 900, min(170, (x1 - x0) / 2 - 25), 18), 'ceramic')
    if mirror_side == '+y': n.add(box(x0 + 30, x1 - 30, y1 - 15, y1, z0 + 1050, z0 + 1800), 'mirror'); n.add(cyl_axis((cx, y1 - 40, z0 + 830), (cx, y1 - 40, z0 + 1000), 14), 'chrome')
    if mirror_side == '-x': n.add(box(x0, x0 + 15, y0 + 30, y1 - 30, z0 + 1050, z0 + 1800), 'mirror'); n.add(cyl_axis((x0 + 40, cy, z0 + 830), (x0 + 40, cy, z0 + 1000), 14), 'chrome')
    return done(n)

def curtains(p, name, axis, line, a, b, z0, z1, inward):
    n = p.obj(name, ex(name, element='curtain'))
    for k, (u0, u1) in enumerate([(a - 250, a + 150), (b - 150, b + 250)]):
        for q in range(4):
            uu = u0 + (u1 - u0) * q / 4; off = 40 + (q % 2) * 30
            if axis == 'x': n.add(box(uu, uu + (u1 - u0) / 4, line + inward * off, line + inward * (off + 40), z0, z1), 'fabric')
            else: n.add(box(line + inward * off, line + inward * (off + 40), uu, uu + (u1 - u0) / 4, z0, z1), 'fabric')
    if axis == 'x': n.add(cyl_axis((a - 300, line + inward * 70, z1 + 30), (b + 300, line + inward * 70, z1 + 30), 15), 'black')
    else: n.add(cyl_axis((line + inward * 70, a - 300, z1 + 30), (line + inward * 70, b + 300, z1 + 30), 15), 'black')
    return n

# ================================================================= FLOOR_1
foy = F1.group('foyer'); lou = F1.group('lounge'); din = F1.group('dining'); kit = F1.group('kitchen'); uti = F1.group('utility'); cor = F1.group('corridor')
cabinet(foy, 'shoe_cabinet', 215, 600, 700, 2150, 0, 1000, 'oak', 3, '+x', 'oak')
n = F(foy, 'sitting_bench'); n.add(box(1450, 2450, 2650, 3020, 0, 380), 'oak'); n.add(box(1460, 2440, 2660, 3010, 380, 460), 'fabric'); done(n)
n = F(foy, 'slat_wall', note='mood board: vertical oak slats + hooks'); [n.add(box(x, x + 45, 3000, 3040, 0, 2400), 'oak') for x in np.arange(1450, 2450, 75)]
n.add(box(1450, 2450, 2985, 3000, 1650, 1680), 'black'); [n.add(cyl_axis((x, 2990, 1665), (x, 2900, 1700), 10), 'metal') for x in np.arange(1550, 2400, 160)]; done(n)
n = F(foy, 'coat_hooks_items'); n.add(box(1680, 1980, 2880, 2960, 1050, 1650), 'uniform'); n.add(sphere(2150, 2930, 1600, 120, 90, 80, 10, 5), 'fabric'); done(n)
n = F(foy, 'full_mirror', note='v3.1: wall-mounted on south wall west of D-01 (was free-standing at open foyer edge)'); n.add(box(600, 1040, 200, 240, 100, 2050), 'oak'); n.add(box(640, 1000, 240, 246, 140, 2010), 'mirror'); done(n)
n = F(foy, 'umbrella_stand'); n.add(cyl(380, 450, 0, 450, 110, 14), 'black'); [n.add(cyl_axis((380 + dx, 450, 50), (380 + dx * 2, 450 + dx, 900), 12), 'black') for dx in (-30, 0, 30)]; done(n)
n = F(foy, 'entry_mat'); n.add(box(1150, 2050, 260, 900, 0, 12), 'rug'); done(n)
n = F(foy, 'console_lamp'); n.add(cyl(420, 1900, 1030, 1200, 45, 10), 'oak'); n.add(sphere(420, 1900, 1290, 110, 110, 100, 12, 6), 'glow'); done(n)
plant(foy, 'foyer_plant', 420, 1000, 1030, 420, 90)
# lounge (A-101 4.95 x 4.30; I-101 L-sofa + coffee table + TV console)
n = F(lou, 'l_sofa', note='I-101 L-shape; SVG 3-seat footprint X5100-7300 Y900-1600 + return')
sofa_seg(n, 5100, 7300, 700, 1600, 0, '-y', ('-x',)); sofa_seg(n, 7300, 8200, 700, 2900, 0, '+x', ('+y',))
for x in (5500, 6100, 6700): n.add(box(x, x + 420, 920, 1080, 420, 800), 'fabric_green' if x == 6100 else 'fabric')
done(n)
n = F(lou, 'rug'); n.add(box(4900, 7600, 1050, 3300, 0, 10), 'rug'); done(n)
table(lou, 'coffee_table', 5750, 6650, 1750, 2650, 10, 420, round_=True)
n = F(lou, 'armchair'); n.add(box(4500, 5200, 2300, 3000, 0, 420), 'fabric'); n.add(box(4500, 4600, 2300, 3000, 420, 850), 'oak'); n.add(box(4500, 5200, 2300, 2380, 300, 600), 'oak'); n.add(box(4500, 5200, 2920, 3000, 300, 600), 'oak'); done(n)
cabinet(lou, 'tv_console', 5000, 7700, 3950, 4350, 0, 520, 'oak', 4, '-y', 'oak')
n = F(lou, 'tv', note='v3.1: TV on console stand; free-standing feature wall removed (no wall on A-101)'); n.add(box(5700, 7000, 4150, 4200, 650, 1390), 'screen'); n.add(box(5720, 6980, 4200, 4215, 670, 1370), 'black'); n.add(box(6300, 6400, 4140, 4220, 520, 660), 'black'); n.add(box(6150, 6550, 4060, 4300, 520, 532), 'black'); done(n)
n = F(lou, 'side_table'); n.add(cyl(4750, 1000, 0, 520, 220, 18), 'oak'); n.add(cyl(4750, 1000, 520, 560, 70, 8), 'ceramic'); done(n)
plant(lou, 'lounge_plant_SE', 8330, 620, 0, 1400, 190); plant(lou, 'lounge_plant_tv', 7950, 3700, 0, 1300, 170)
curtains(lou, 'curtain_S', 'x', 200, 5390, 7720, 60, 2550, 1); curtains(lou, 'curtain_E', 'y', 8800, 1150, 2650, 60, 2550, -1)
# dining (2.65 x 3.70; table 4 + sideboard + 2 pendants)
table(din, 'table_4', 7050, 8230, 5300, 6020, 0, 740, 'oak', 'oak_dark')
for i, (cx, cy, fc) in enumerate([(7340, 5000, '+y'), (7940, 5000, '+y'), (7340, 6320, '-y'), (7940, 6320, '-y')]): chair(din, f'chair_{i+1}', cx, cy, 0, fc)
cabinet(din, 'sideboard', 8380, 8790, 4700, 5300, 0, 850, 'oak', 2, '-x', 'oak')
n = F(din, 'shelf'); n.add(box(8550, 8790, 6900, 7700, 0, 1800), 'oak'); [n.add(box(8550, 8790, 6900, 7700, z, z + 22), 'oak_dark') for z in (400, 800, 1200, 1600)]; books(n, 8580, 8760, 6950, 7650, 822, 'y', 200); done(n)
lamp_pendant(din, 'pendant_1', 7350, 5660, H1, 750); lamp_pendant(din, 'pendant_2', 7930, 5660, H1, 750)
plant(din, 'dining_plant', 8550, 7560, 1830, 450, 110)
n = F(din, 'table_setting'); [n.add(cyl(x, y, 740, 752, 110, 16), 'ceramic') for x in (7340, 7940) for y in (5450, 5870)]; n.add(cyl(7640, 5660, 740, 900, 60, 12), 'pot'); done(n)
# kitchen (2.30 x 2.90; counter along north wall, fridge, tall unit)
n = F(kit, 'counters', note='SVG counter X4170-6170 Y7430-7780; depth 600 against north wall')
n.add(box(4110, 6290, 7200, 7800, 80, 880), 'oak'); n.add(box(4130, 6270, 7220, 7780, 0, 80), 'oak_dark'); n.add(box(4110, 6290, 7180, 7800, 880, 920), 'stone')
for x in np.arange(4130, 6280, 430): n.add(box(x, x + 410, 7192, 7200, 110, 860), 'oak')
n.add(box(4110, 4560, 7450, 7800, 1500, 2200), 'oak'); n.add(box(4110, 6290, 7790, 7800, 920, 1170), 'tile'); done(n)
n = F(kit, 'sink'); n.add(box(4900, 5450, 7350, 7720, 760, 922), 'metal'); n.add(cyl_axis((5175, 7740, 920), (5175, 7740, 1180), 14), 'chrome'); n.add(cyl_axis((5175, 7740, 1180), (5175, 7560, 1180), 12), 'chrome'); done(n)
n = F(kit, 'cooktop'); n.add(box(5650, 6200, 7280, 7760, 920, 935), 'black'); [n.add(cyl(x, y, 935, 945, 85, 16), 'metal') for x in (5790, 6060) for y in (7400, 7640)]; done(n)
n = F(kit, 'rangehood'); n.add(box(5620, 6230, 7300, 7800, 1750, 1900), 'metal'); n.add(box(5800, 6050, 7550, 7800, 1900, 2780), 'metal'); done(n)
n = F(kit, 'fridge', note='v3.1: against kitchen south wall, door facing north (was free-standing mid-kitchen)'); n.add(box(5550, 6250, 5175, 5850, 0, 1800), 'ceramic'); n.add(box(5560, 6240, 5850, 5856, 1150, 1158), 'metal')
for yy in (5856,): n.add(box(5600, 5625, yy, yy + 40, 1200, 1700), 'metal'); n.add(box(5600, 5625, yy, yy + 40, 450, 1050), 'metal')
done(n)
cabinet(kit, 'counter_south', 4700, 5550, 5175, 5775, 0, 880, 'oak', 2, '+y', 'stone')
cabinet(kit, 'appliance_tower', 4110, 4700, 5160, 5900, 0, 2100, 'oak', 1, '+x')
n = F(kit, 'microwave'); n.add(box(4200, 4700, 5300, 5800, 1100, 1400), 'black'); n.add(box(4700, 4710, 5350, 5650, 1150, 1350), 'screen'); done(n)
n = F(kit, 'cutting_board_props'); n.add(box(4400, 4800, 7350, 7650, 922, 940), 'oak'); n.add(cyl(6300 - 150, 7350, 922, 1050, 60, 10), 'ceramic'); done(n)
# utility (2.90 x 1.80: washer, toilet, basin, storage)
n = F(uti, 'washing_machine'); n.add(box(280, 930, 6950, 7600, 0, 850), 'ceramic'); n.add(cyl_axis((605, 6948, 420), (605, 6935, 420), 230, 24), 'metal'); done(n)
n = F(uti, 'dryer_stack'); n.add(box(280, 930, 6950, 7600, 870, 1600), 'ceramic'); n.add(cyl_axis((605, 6948, 1230), (605, 6935, 1230), 200, 24), 'metal'); done(n)
toilet(uti, 'toilet', 1760, 7450, 0, '+y')
basin(uti, 'basin', 1000, 1480, 7320, 7780, 0, '+y')
cabinet(uti, 'storage', 300, 1000, 6275, 6600, 0, 1900, 'oak', 2, '+y')
n = F(uti, 'towel_rail'); n.add(cyl_axis((2700, 6300, 1100), (2700, 6300, 1100), 1, 4), 'metal') if False else None
n.add(box(250, 300, 6300, 6900, 1050, 1080), 'chrome'); n.add(box(220, 300, 6350, 6850, 700, 1060), 'fabric_blue'); done(n)
# corridor props
n = F(cor, 'console_corridor'); n.add(box(2980, 3300, 4300, 5400, 0, 820), 'oak'); done(n)
downlight(F1, 'downlights_1F', [(1500, 1600), (3500, 1600), (3500, 4600), (3500, 6800), (5200, 6500), (5800, 1000), (5800, 3000), (7700, 1000), (7700, 3000), (1500, 7000), (1500, 4600)], H1)

# ================================================================= FLOOR_2
pr = F2.group('protagonist_room'); fa = F2.group('father_room'); mu = F2.group('multifunction_room'); ba = F2.group('bathroom'); ha = F2.group('hall')
Z = F2Z
bed(pr, 'bed', 5800, 7250, 820, 2890, Z, '-x' if False else '+y', 'bedding', 'fabric_green', 1)
for nd in pr.children[-1:]: nd.extras.update({'source': 'A-102 SVG X5800-7250 Y820-2890 (4x6.2ft single, head to north per I-102)'})
cabinet(pr, 'nightstand', 5300, 5700, 2450, 2850, Z, 520, 'oak', 1, '+x', 'oak')
n = F(pr, 'nightstand_lamp'); n.add(cyl(5500, 2650, Z + 550, Z + 700, 50, 10), 'oak'); n.add(sphere(5500, 2650, Z + 780, 110, 110, 100, 12, 6), 'glow'); done(n)
wardrobe(pr, 'wardrobe', 4360, 5010, 650, 2550, Z, '+x')
n = F(pr, 'desk', note='A-102 desk X8140-8690 Y2100-3300 against east wall')
n.add(box(8140, 8790, 2100, 3300, Z + 720, Z + 750), 'oak'); n.add(box(8160, 8790, 2120, 2160, Z, Z + 720), 'oak'); n.add(box(8160, 8790, 3240, 3280, Z, Z + 720), 'oak')
n.add(box(8740, 8790, 2550, 3300, Z + 750, Z + 1700), 'oak'); [n.add(box(8500, 8790, 2550, 3300, Z + zz, Z + zz + 22), 'oak') for zz in (1150, 1500)]
books(n, 8520, 8770, 2600, 3250, Z + 1172, 'y', 230); done(n)
chair(pr, 'desk_chair', 7750, 2700, Z, '+x', 'fabric_blue')
n = F(pr, 'student_items', story='學生證／制服 (A-102 tag)', note='uniform folded on desk + student ID card')
n.add(box(8250, 8600, 2250, 2600, Z + 750, Z + 800), 'uniform'); n.add(box(8300, 8385, 2750, 2804, Z + 750, Z + 753), 'paper')
n.add(box(8250, 8550, 2900, 3150, Z + 750, Z + 770), 'paper'); done(n)
shelf(pr, 'bookshelf_low', 8550, 8790, 300, 1100, Z, 820, 'y', 2)
n = F(pr, 'study_storage_rack'); n.add(box(8550, 8790, 3350, 3780, Z, Z + 1100), 'oak'); [n.add(box(8560, 8780, 3360, 3770, Z + zz, Z + zz + 20), 'oak_dark') for zz in (350, 720)]; done(n)
n = F(pr, 'round_rug'); n.add(cyl(6550, 2500, Z, Z + 10, 950, 32), 'rug'); done(n)
plant(pr, 'protagonist_plant', 8500, 3600, Z + 1100, 400, 100)
curtains(pr, 'curtain_S', 'x', 200, 6080, 8430, Z + 60, Z + 2550, 1)
# father room 4.05 x 3.10
bed(fa, 'bed', 650, 2000 + 200, 600, 2520, Z, '-x', 'fabric', 'oak_dark', 2)
fa.children[-1].extras.update({'source': 'A-102 SVG X650-2000 Y600-2520 widened to 6ft double per I-102'})
cabinet(fa, 'bedside_N', 250, 600, 2600, 2950, Z, 520, 'oak', 1, '+x', 'oak'); cabinet(fa, 'bedside_S', 250, 600, 230, 560, Z, 520, 'oak', 1, '+x', 'oak')
wardrobe(fa, 'wardrobe', 3380, 3980, 400, 2100, Z, '-x')
n = F(fa, 'rug'); n.add(box(500, 2700, 400, 2800, Z, Z + 10), 'rug'); done(n)
curtains(fa, 'curtain_S', 'x', 200, 1100, 2400, Z + 60, Z + 2550, 1)
# multifunction 4.95 x 2.90
n = F(mu, 'sofa_bed'); sofa_seg(n, 4300, 6000, 6950, 7780, Z, '+y', ('-x', '+x')); n.add(box(4900, 5300, 7400, 7560, Z + 420, Z + 760), 'fabric_green'); done(n)
table(mu, 'side_round_table', 5150, 5700, 6250, 6800, Z, 450, round_=True)
table(mu, 'desk', 6400, 8400, 7250, 7790, Z, 740)
chair(mu, 'desk_chair', 7400, 6800, Z, '+y', 'fabric_blue')
n = F(mu, 'hobby_items'); n.add(box(6600, 7000, 7450, 7700, Z + 740, Z + 1000), 'black'); n.add(box(7600, 8000, 7400, 7650, Z + 740, Z + 760), 'paper'); done(n)
shelf(mu, 'bookshelf', 8500, 8790, 5250, 5950, Z, 1900, 'y', 5)
cabinet(mu, 'storage_low', 5800, 7500, 5175, 5560, Z, 900, 'oak', 4, '+y', 'oak')
plant(mu, 'multi_plant', 8330, 6350, Z, 900, 140)
# bathroom 2F 2.90 x 1.80
n = F(ba, 'shower'); n.add(box(250, 1130, 6800, 7780, Z, Z + 60), 'ceramic'); n.add(box(1120, 1140, 6800, 7780, Z + 60, Z + 2000), 'glass'); n.add(box(250, 1130, 6790, 6810, Z + 60, Z + 2000), 'glass')
n.add(cyl_axis((400, 7600, Z + 2000), (400, 7600, Z + 1100), 14), 'chrome'); n.add(cyl(500, 7600, Z + 1950, Z + 1970, 110, 14), 'chrome'); done(n)
toilet(ba, 'toilet', 1400, 7450, Z, '+y')
basin(ba, 'basin', 1660, 2010, 7340, 7780, Z, '+y')
cabinet(ba, 'storage', 2380, 2780, 6300, 6600, Z, 900, 'oak', 1, '-x')
# hall
cabinet(ha, 'hall_storage', 7600, 8700, 4660, 5025, Z, 850, 'oak', 3, '-y', 'oak')
plant(ha, 'hall_plant', 8450, 4800, Z + 880, 420, 90)
n = F(ha, 'hall_art', note='v3.1: framed print with depth (was 2mm coplanar frame -> z-fighting outline)')
for a_, b_, c_, d_ in [(5780, 7220, Z + 1280, Z + 1330), (5780, 7220, Z + 1970, Z + 2020), (5780, 5830, Z + 1280, Z + 2020), (7170, 7220, Z + 1280, Z + 2020)]: n.add(box(a_, b_, 3960, 3995, c_, d_), 'oak')
n.add(box(5830, 7170, 3960, 3975, Z + 1330, Z + 1970), 'paper'); n.add(box(5950, 7050, 3975, 3980, Z + 1450, Z + 1700), 'fabric_green'); n.add(box(5950, 7050, 3975, 3980, Z + 1700, Z + 1850), 'fabric_blue'); n.add(box(5950, 7050, 3975, 3980, Z + 1380, Z + 1450), 'rug'); done(n)
downlight(F2, 'downlights_2F', [(2000, 1600), (3500, 4500), (6000, 4500), (8000, 4500), (6500, 1900), (6500, 6500), (1500, 7000), (1500, 4700)], CEIL2)

# ================================================================= SITE (A-001 R00 proposal)
g = SITE.obj('ground', ex('ground', lot_mm=[15000, 18000], note='lot X-3000..12000, Y-8000..10000 proposed'))
g.add(box(-3000, 12000, -8000, 10000, -60, -6), 'grass')
r = SITE.obj('road', ex('road', note='south residential street (proposal)'))
r.add(box(-6000, 15000, -14800, -8300, -80, -12), 'asphalt'); r.add(box(-6000, 15000, -8300, -8000, -60, 60), 'kerb')
for x in np.arange(-5500, 15000, 3000): r.add(box(x, x + 1500, -11610, -11490, -12, -8), 'line_paint')
r.add(box(-6000, 15000, -14800, -14500, -60, 60), 'kerb')
fy = SITE.obj('front_yard', ex('front_yard'))
for y in np.arange(-7900, -1000, 560): fy.add(box(1150, 2100, y, y + 500, -10, 15), 'paver')
fy.add(box(900, 2350, -1000, -10, -40, -20 + 20), 'concrete')
fy.add(box(2750, 5300, -5900, -3100, -10, 60), 'soil')
for i, (x, y) in enumerate([(3100, -3500), (3600, -4400), (4200, -3600), (4900, -4900), (3300, -5500), (4600, -5600)]):
    fy.add(sphere(x, y, 250, 330, 330, 260, 10, 6), 'leaf' if i % 2 else 'leaf_dark')
fy.add(cyl(4000, -4300, 0, 1500, 70, 8), 'trunk'); fy.add(sphere(4000, -4300, 2200, 900, 900, 800, 12, 7), 'leaf')
pk = SITE.obj('parking', ex('parking', stall_mm=[2700, 5500], note='A-001 R00 stall 2.7 x 5.5 m; car centre 4.3 m south of wall'))
pk.add(box(6150, 8850, -7040, -1540, -10, 10), 'concrete')
for x in (6150, 8790): pk.add(box(x, x + 60, -7040, -1540, 10, 14), 'line_paint')
ey = SITE.obj('east_side_yard', ex('east_side_yard'))
ey.add(box(9500, 10750, 0, 7000, -10, 40), 'soil')
for y in np.arange(500, 7000, 900): ey.add(sphere(10120, y, 420, 520, 430, 450, 10, 6), 'leaf_dark' if int(y) % 2 else 'leaf')
by = SITE.obj('back_yard', ex('back_yard', note='待定 / pending'))
for x in np.arange(-2500, 11800, 1100): by.add(sphere(x, 9700, 450, 560, 300, 480, 10, 6), 'leaf_dark')
by.add(cyl(-1500, 9000, 0, 2000, 90, 8), 'trunk'); by.add(sphere(-1500, 9000, 2900, 1200, 1200, 1100, 12, 7), 'leaf')
hd = SITE.obj('boundary_hedge', ex('boundary_hedge'))
hd.add(box(-3000, -2600, -7800, 10000, 0, 1000), 'leaf_dark'); hd.add(box(11600, 12000, -7800, 10000, 0, 1000), 'leaf_dark')
hd.add(box(-3000, 900, -8000, -7700, 0, 700), 'leaf_dark'); hd.add(box(2350, 6000, -8000, -7700, 0, 700), 'leaf_dark'); hd.add(box(9000, 12000, -8000, -7700, 0, 700), 'leaf_dark')
mb = SITE.obj('mailbox', ex('mailbox')); mb.add(box(2450, 2600, -7600, -7450, 0, 1000), 'black'); mb.add(box(2380, 2670, -7680, -7370, 1000, 1250), 'black')
# the single black car (A-001 / V-002: roof +1.40 m, 4.3 m from south wall)
CX, CY = 7500, -4300
car = SITE.obj('black_car_01', ex('black_car_01', story='唯一黑車 — only one black car exists', roof_mm=1400, centre_from_south_wall_mm=4300, length_mm=4600, width_mm=1800))
car.add(hull_x([(CY - 2300, 330), (CY + 2300, 330), (CY + 2300, 760), (CY + 1500, 830), (CY - 2050, 800), (CY - 2300, 650)], CX - 900, CX + 900), 'car')
car.add(hull_x([(CY - 1000, 800), (CY + 1350, 820), (CY + 900, 1385), (CY - 350, 1385)], CX - 790, CX + 790), 'car_glass')
car.add(hull_x([(CY - 330, 1370), (CY + 880, 1370), (CY + 870, 1400), (CY - 320, 1400)], CX - 770, CX + 770), 'car')
car.add(hull_x([(CY - 980, 800), (CY - 940, 800), (CY - 300, 1380), (CY - 340, 1380)], CX - 795, CX + 795), 'car')
for y in (CY - 1450, CY + 1400):
    for x0, x1 in ((CX - 930, CX - 700), (CX + 700, CX + 930)):
        car.add(cyl_axis((x0, y, 330), (x1, y, 330), 330, 18), 'tire'); car.add(cyl_axis((x0 - 3 if x0 < CX else x1 + 3, y, 330), (x0 - 4 if x0 < CX else x1 + 4, y, 330), 200, 14), 'chrome')
for sx in (-1, 1):
    car.add(box(CX + sx * 650 - 180, CX + sx * 650 + 180, CY - 2310, CY - 2295, 600, 700), 'lens'); car.add(box(CX + sx * 650 - 180, CX + sx * 650 + 180, CY + 2295, CY + 2310, 620, 720), 'tail')
    car.add(box(CX + sx * 905, CX + sx * 960, CY - 900, CY - 750, 900, 980), 'car')
car.add(box(CX - 300, CX + 300, CY - 2310, CY - 2300, 380, 520), 'chrome')
reg(furn_aabb, 'black_car_01', car.parts)

# ================================================================= cameras (fixed shots C01-C08, eye heights 1.55 m standing / 1.20 m seated)
CAMS = [
    ('C01_EXT_FRONT', (4500, -15500, 3200), (4500, 2000, 3600), 50, 'Establishing exterior from south street'),
    ('C02_BLACK_CAR_WINDOW_VIEW', (7255, 750, 4550), (7500, -4300, 1400), 50, 'V-002 R01 eye 0.75 m from south wall, +4.55 m; looks at car roof'),
    ('C03_ENTRY_TO_STAIRS', (1700, 600, 1550), (800, 4200, 1300), 60, 'Inside D-01 looking at D-02 and stair'),
    ('C04_STAIR_UP', (800, 3300, 1550), (2200, 5200, 2600), 65, 'Foot of flight 1 looking up to landing'),
    ('C05_ROOM_TO_HALL', (7200, 2800, 4200), (4900, 4300, 4100), 60, 'Protagonist room toward D-08 / hall'),
    ('C06_LIVING_SOFA', (7750, 1700, 1150), (5200, 4300, 1050), 65, 'Seated on sofa return toward TV wall and dining'),
    ('C07_DINING_KITCHEN', (8450, 4600, 1550), (5000, 7400, 1100), 65, 'Dining corner looking into kitchen'),
    ('C08_PROTAGONIST_DESK', (7300, 1300, 4200), (8600, 2900, 3800), 60, 'Desk with student ID / uniform')]
cam_json = []
for nm, eye, tgt, fov, note in CAMS:
    q, pos = look_at_quat(eye, tgt); n = CAM.obj(nm, ex(nm, element='camera', eye_mm=eye, target_mm=tgt, vfov_deg=fov, note=note))
    n.translation = [round(v, 4) for v in pos]; n.rotation = q
    n.camera = {'type': 'perspective', 'name': nm, 'perspective': {'yfov': math.radians(fov), 'znear': .05, 'zfar': 200, 'aspectRatio': 16 / 9}}
    cam_json.append({'name': nm, 'eye_gltf_m': pos, 'target_gltf_m': to_gltf(tgt).tolist(), 'eye_plan_mm': eye, 'target_plan_mm': tgt, 'vfov_deg': fov, 'note': note})
for nm, p, c, I in [('daylight_sun_proxy', (4500, -6000, 14000), [1, .97, .9], 0), ('warm_living', (6000, 2000, 2600), [1, .85, .65], 40), ('warm_dining', (7600, 5700, 2500), [1, .85, .65], 30),
                    ('warm_foyer', (1500, 1600, 2600), [1, .85, .65], 25), ('warm_protagonist', (6500, 1900, 5600), [1, .86, .7], 30), ('warm_hall_2F', (5500, 4500, 5600), [1, .86, .7], 20)]:
    n = LIG.obj(nm, ex(nm, element='light')); n.translation = to_gltf(p).tolist()
    n.light = {'name': nm, 'type': 'directional', 'color': c, 'intensity': 2.0} if I == 0 else {'name': nm, 'type': 'point', 'color': c, 'intensity': I, 'range': 9}

# ================================================================= write + checks
asset = {'revision': REV, 'project': 'Reality Game EP02 Hades House', 'status': 'CANDIDATE_DRAFT_NOT_APPROVED', 'author_full_approval': 'PENDING',
         'source_package': 'HADES_EP02 23-image package v2 (2026-10-26)', 'workbench_projectId': '134dad4c-c9d3-48b3-82f5-6f7506fdad21',
         'plan_origin': '1F SW exterior corner = plan (0,0,0) mm -> glTF (-4.5, 0, +4.0) m', 'axes': 'glTF +X east, +Y up, -Z north',
         'levels_mm': {'1F': 0, '2F': 3000, 'slab_underside': 2780, 'ceiling_2F': CEIL2, 'eaves': 6100, 'ridge': 7700},
         'supersedes': 'HADES-v2.4 (22 x 14 m inferred layout) kept in revisions/hades-v2.4 and backups/pre-hades-v3.0'}
stats = W.build(root, OUT, asset)

# ---- automated checks
def inter(a, b, tol=1):
    return all(a['min'][i] < b['max'][i] - tol and b['min'][i] < a['max'][i] - tol for i in range(3))
clash = []
for f in furn_aabb:
    for w in walls_aabb:
        if inter(f, w, 5): clash.append({'object': f['name'], 'wall': w['name'], 'note': 'AABB overlap >5mm'})
swing = []
for d in DOORS:
    hx, hy = d['hinge']; R = d['radius']; tx, ty = d['tip']
    closed = d['closed']
    qx = sorted((hx, tx, closed[0])); qy = sorted((hy, ty, closed[1]))
    zone = {'min': [qx[0], qy[0], d['z0'] + 50], 'max': [qx[2], qy[2], d['z0'] + 2000]}
    hits = [f['name'] for f in furn_aabb if inter(zone, f, 5)]
    swing.append({'door': d['id'], 'swing_zone_mm': [zone['min'][:2], zone['max'][:2]], 'furniture_in_zone': hits})
eye = np.array([7255, 750, 4550.]); roof = np.array([7500, -4300 + 2300 - 900, 1400.])  # nearest roof edge of cabin toward house
def wall_hit(e, p):
    t = (e[1] - 0) / (e[1] - p[1]); return e + (p - e) * t
v_eye = wall_hit(eye, np.array([7500, -4300, 1400.]))
bed_eye = np.array([6500, 2500, 3000 + 1550 - 400.])  # seated on bed edge ~1.15 m above floor
v_bed = wall_hit(bed_eye, np.array([7500, -4300, 1400.]))
report = {
    'revision': REV, 'glb': OUT.name, 'sha256': hashlib.sha256(OUT.read_bytes()).hexdigest(), 'stats': stats,
    'envelope_mm': [9000, 8000], 'levels_mm': asset['levels_mm'],
    'stair': {'risers': 16, 'riser_mm': R_H, 'total_rise_mm': 16 * R_H, 'tread_mm': TREAD, 'treads_per_flight': 7, 'landing_net_mm': 6140 - (Y_START + 7 * TREAD),
              'run_check_mm': f'7x260 + 900 = 2720 within inner 2980 (Y3160..6140); start Y={Y_START}', 'flight_width_mm': FL1[1] - FL1[0],
              'headroom_flight1_first_tread_mm': SLAB_B - R_H, 'headroom_flight2_top_mm': CEIL2 - 3000, 'headroom_landing_mm': CEIL2 - 1500,
              'arrival_strip_2F_mm': Y_START - 3160, 'status': 'GEOMETRY_STATIC_CHECK_ONLY — riser/tread/headroom arithmetic passes; arrival strip 260 mm before D-06 is too short for real use (A-402 flag kept)'},
    'black_car_sightline': {'eye_window_mm': eye.tolist(), 'line_hits_south_wall_at_z_mm': round(float(v_eye[2])), 'sill_mm': 3860, 'head_mm': 5350,
                            'visible_from_window_eye': bool(3860 < v_eye[2] < 5350), 'bedside_eye_mm': bed_eye.tolist(), 'bedside_hit_z_mm': round(float(v_bed[2])),
                            'visible_from_bedside': bool(3860 < v_bed[2] < 5350), 'horizontal': 'car X6600..8400 inside window X6080..8430 — aligned in plan',
                            'status': 'NOT_TESTED in rendered camera beyond C02 still; matches V-002 R01 (window yes, bedside no)'},
    'furniture_wall_overlaps': clash, 'door_swing_conflicts': [s for s in swing if s['furniture_in_zone']], 'door_swing_all': swing,
    'cameras': cam_json,
    'open_issues': ['Stair top arrival vs D-06 (only ~260 mm landing at +3.000 before void edge)', 'D-02 leaf swings over first treads of flight 1',
                    'Window IDs W-101..W-206 numbering not in package (A-402 R00 table missing) — named by location', 'Site/lot/road distances are A-001 R00 proposals',
                    'S-101 structure not validated; 2F slab 220 mm without beams', 'Attic/roof structure not modelled; flat 2F ceiling at +5.780 assumed',
                    'Interior wall thickness 120 mm and exterior 200 mm assumed (plans say 待校核)'],
    'author_approval': 'PENDING'}
(REP / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
(REP / 'cameras.json').write_text(json.dumps(cam_json, ensure_ascii=False, indent=2))
print(json.dumps({k: report[k] for k in ('sha256', 'stats')}, indent=1)); print('overlaps', len(clash), 'swing conflicts', len(report['door_swing_conflicts']))
print('car sightline window z', report['black_car_sightline']['line_hits_south_wall_at_z_mm'], 'bed z', report['black_car_sightline']['bedside_hit_z_mm'])
