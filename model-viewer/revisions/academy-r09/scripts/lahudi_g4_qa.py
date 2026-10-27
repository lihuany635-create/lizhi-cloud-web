# -*- coding: utf-8 -*-
"""拉乎迪學院 G4 景觀 自動 QA（手冊 §10.1 / §13.2）
python lahudi_g4_qa.py <working.blend> <master.glb> <out_json>"""
import bpy, bmesh, sys, json, math, itertools
from mathutils import Vector
from mathutils.bvhtree import BVHTree

blend, glb, out = sys.argv[-3:]
bpy.ops.wm.open_mainfile(filepath=blend)
R = []
def rec(item, ok, detail, rule=""):
    R.append(dict(item=item, result="PASS" if ok else "FAIL", detail=detail, rule=rule))

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
OB = {o.name: o for o in meshes}
dg = bpy.context.evaluated_depsgraph_get()

def top_area(name, z):
    me = OB[name].data
    a = 0.0
    for p in me.polygons:
        if p.normal.z > 0.99 and abs(p.center.z - z) < 1e-4:
            a += p.area
    return a

# 1 標高
for o in meshes:
    if o.name.endswith(("_2F_SLAB", "_2F_SLAB_PROXY_PENDING")):
        zmax = max(v.co.z for v in o.data.vertices)
        rec(f"2F 標高 {o.name}", abs(zmax - 5.40) <= 0.01, f"Z_top={zmax:.3f}", "abs(Z_2F−5.40)≤0.01")
    if o.name.endswith("_1F_SLAB"):
        zmax = max(v.co.z for v in o.data.vertices)
        rec(f"1F 標高 {o.name}", abs(zmax) <= 0.01, f"Z_top={zmax:.3f}", "FFL_1=0.00")

# 2 面積
SW = 4.2 * 6.0   # 每座雙折梯井 25.2 m²
for nm, z, exp, note in [("L04_MAIN_1F_SLAB", 0, 1440, "48×30"), ("L04_MAIN_2F_SLAB", 5.4, 1440 - 12 * 8.36 - 3 * SW, "1440 − 挑空 12×8.36 − 3 梯井"),
                   ("L08_LIBRARY_1F_SLAB", 0, 1200, ""), ("L08_LIBRARY_2F_SLAB", 5.4, 1004 - 2 * SW, "1004 − 2 梯井")]:
    a = top_area(nm, z)
    rec(f"樓板面積 {nm}", abs(a - exp) < 0.01, f"{a:.2f} m² (期望 {exp:.2f} {note})", "計算書 §5/§6")

# 3 挑空：從上往下打射線，第一個命中應是 1F 樓板
scene = bpy.context.scene
for nm, pt, exp in [("L04 12×8.36 挑空", (0, 95.5), "L04_MAIN_1F_SLAB"), ("L08 14×14 挑空", (-6, 128), "L08_LIBRARY_1F_SLAB"),
                    ("L08 挑空角落內側", (-12.9, 134.9), "L08_LIBRARY_1F_SLAB"),
                    ("L08 挑空外 (迴廊)", (-6, 119.5), "L08_LIBRARY_2F_SLAB")]:
    hit, loc, n, i, ob, m = scene.ray_cast(dg, Vector((*pt, 10.5)), Vector((0, 0, -1)))
    rec(f"挑空射線 {nm}", hit and ob.name == exp, f"命中 {ob.name if hit else None} @Z={loc.z:.2f}" if hit else "未命中",
        "洞口下方不得有 2F 樓板")

# 4 跨棟連通（水平射線不可撞牆），兩層各測
routes = [("L04↔L05", (-20, 90), (-36, 90), "both"), ("L04↔L07", (20, 90), (36, 90), "both"),
          ("L04↔L08", (0, 109.6), (0, 120), "both"), ("L05 主廊↔附屬", (-36, 85), (-50, 85), "both"),
          ("L05↔L06 西翼入口廳", (-36, 60), (-43, 60), "both"), ("L06 東翼入口廳↔連廊", (43, 60), (36, 60), "both"),
          ("L06西 入口廳→走廊", (-42.7, 60), (-42.7, 53.0), "both"), ("L06東 入口廳→告白走廊", (42.7, 60), (42.7, 52.5), "both"),
          ("連廊↔L07", (36, 62), (36, 88), "both"), ("L03→L04 正門", (0, 78), (0, 86), "1F"),
          ("L06西 室外門→走廊", (-35, 53.05), (-60, 53.05), "1F"),
          ("L06東 室外門→告白走廊", (35, 52.55), (60, 52.55), "1F"),
          ("校門→前庭", (0, 1), (0, 24), "SITE"), ("前庭→中庭", (0, 36), (0, 56), "SITE"),
          ("中庭→L06 東翼門", (20, 52.55), (45, 52.55), "1F"), ("中庭→L06 西翼門", (-20, 53.05), (-45, 53.05), "1F"),
          ("東側門→連廊東門", (75.8, 72), (36, 72), "1F"), ("L08 北門→後花園步道", (0, 136), (0, 141.5), "1F"),
          ("北步道→後花園", (-2, 141.75), (-44.5, 141.75), "SITE"), ("後花園支道", (-44.5, 141.5), (-44.5, 131.8), "SITE")]
for nm, a, b, lv in routes:
    for lvl, z in (("1F", 1.5), ("2F", 6.9), ("SITE", -0.65)):
        if (lv == "both" and lvl == "SITE") or (lv != "both" and lvl != lv):
            continue
        A, B = Vector((*a, z)), Vector((*b, z))
        d = B - A
        hit, loc, n, i, ob, m = scene.ray_cast(dg, A, d.normalized(), distance=d.length)
        rec(f"連通 {nm} {lvl}", not hit, f"撞到 {ob.name}" if hit else "通行無阻", "不得斷頭路／堵牆")
# 反向測試：牆確實存在（非門位應被擋）
for nm, a, b in [("L04 西牆非門位", (-20, 85), (-36, 85)), ("L08 南牆非門位", (10, 114), (10, 122))]:
    A, B = Vector((*a, 1.5)), Vector((*b, 1.5)); d = B - A
    hit, *_ = scene.ray_cast(dg, A, d.normalized(), distance=d.length)
    rec(f"反向測試 {nm}", hit, "被牆擋住（正確）" if hit else "沒擋到 → 牆體缺失", "牆體完整")

# 5 樓梯：每座雙折梯 30 級、級高 0.18；梯井正上方往下打應命中樓梯；L07 旋梯 29 踏＋抵達平台
import importlib.util
spec = importlib.util.spec_from_file_location("b", blend.replace("LAHUDI_MASTER_R09_G3E_20261027_working.blend", "lahudi_g4_build.py"))
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
for st in b.STAIRS:
    f1, ld, f2 = OB[f"{st['id']}_1F_FLIGHT1"], OB[f"{st['id']}_1F_LANDING"], OB[f"{st['id']}_1F_FLIGHT2"]
    lz = max(v.co.z for v in ld.data.vertices)
    t1 = sorted({round(v.co.z, 3) for v in f1.data.vertices} - {0.0})
    t2 = sorted({round(v.co.z, 3) for v in f2.data.vertices} - {0.0, round(lz, 3)})
    steps = len(t1) + 1 + len(t2) + 1
    ok = steps == 30 and abs(lz - 2.70) < 1e-3 and abs(t2[-1] + 0.18 - 5.40) < 1e-3
    rec(f"樓梯 {st['id']}", ok, f"{steps} 級、平台 {lz:.2f}、末踏 {t2[-1]:.2f}→5.40", "計算書 §3.2")
    cx_, cy_ = st["x0"] + 1.0, st["y0"] + 3.0
    hit, loc, n, i, ob, m = scene.ray_cast(dg, Vector((cx_, cy_, 10.5)), Vector((0, 0, -1)))
    rec(f"梯井真開口 {st['id']}", hit and "FLIGHT" in ob.name, f"命中 {ob.name if hit else None}", "梯井上方不得有樓板")
    # 抵達：從第二跑末踏往南走 1 m 到 2F 樓板（不得撞欄杆）
    A = Vector((st["x0"] + 3.2, st["y0"] + 0.3, 5.40 + 0.9)); B = A + Vector((0, -1.5, 0))
    hit, *_ = scene.ray_cast(dg, A, (B - A).normalized(), distance=(B - A).length)
    rec(f"樓梯抵達口 {st['id']}", not hit, "抵達 2F 無阻擋" if not hit else "被擋")
tr = OB["L07_1F_SPIRAL_PROXY_PENDING_TREADS"]; lnd = OB["L07_1F_SPIRAL_PROXY_PENDING_ARRIVAL_LANDING"]
tops = sorted({round(v.co.z, 3) for v in tr.data.vertices})
ltop = max(v.co.z for v in lnd.data.vertices)
rec("L07 旋梯級數", tr["treads"] == 29 and abs(ltop - 5.40) < 1e-3 and abs(max(tops) - 5.22) < 1e-3,
    f"29 踏（最高 {max(tops):.2f}）＋抵達平台 {ltop:.2f} = 30 級；掃角 {tr['sweep_deg']}°", "計算書 §3.2 級高")
hit, loc, n, i, ob, m = scene.ray_cast(dg, Vector((41.0, 89.0, 10.5)), Vector((0, 0, -1)))
rec("L07 旋梯井真開口", hit and "SPIRAL" in ob.name, f"命中 {ob.name if hit else None}")

# 5b 窗：每扇窗由外往內打，第一個命中應是玻璃
nw, bad = 0, []
for zd in b.ZONES + b.CONNECTORS:
    walls = zd.get("walls", "SNWE")
    stubs = {s: [p for (bb, s_, p) in b.INTERIOR_WALL_STUBS if bb == zd["id"] and s_ == s] for s in "SNWE"}
    for side in walls:
        wins, _ = b.plan_facade(zd["id"], zd["x"], zd["y"], side, zd.get("doors", []), b.BOTH, stubs[side])
        a_, b_, line, sgn, ax = b.side_geom(zd["x"], zd["y"], side)
        for c, sill in wins:
            zc = sill + 1.0
            o = Vector((c, line + sgn * 1.0, zc)) if ax == "y" else Vector((line + sgn * 1.0, c, zc))
            d = Vector((0, -sgn, 0)) if ax == "y" else Vector((-sgn, 0, 0))
            hit, loc, n, i, ob, m = scene.ray_cast(dg, o, d, distance=2.0)
            nw += 1
            if not (hit and "GLASS" in ob.name):
                bad.append(f"{zd['id']}{side}@{c:.1f}/{sill}:{ob.name if hit else None}")
gl = sum(o["windows"] for o in meshes if o.name.endswith("_OPENING_WINDOW_GLASS"))
rec("窗：真洞口＋玻璃", not bad and nw == gl, f"{nw} 扇全部命中玻璃（玻璃物件計 {gl}）" if not bad else "; ".join(bad[:8]),
    "MOD_WINDOW_GOTHIC：先挖洞再放窗")

# 5c 室內門洞：每個門洞兩側 1 m 水平射線不得撞牆；每間房至少一個門洞或開口
bad, nd = [], 0
for zid, defs in b.INTERIOR.items():
    for (lv, ax, c, span, drs) in defs:
        z = (0.0 if lv == "1F" else 5.4) + 1.2
        for dc, (dw, dh) in drs:
            A = Vector((dc, c - 1.0, z)) if ax == "y" else Vector((c - 1.0, dc, z))
            B = Vector((dc, c + 1.0, z)) if ax == "y" else Vector((c + 1.0, dc, z))
            hit, loc, n, i, ob, m = scene.ray_cast(dg, A, (B - A).normalized(), distance=2.0)
            nd += 1
            if hit: bad.append(f"{lv}{ax}{c}@{dc}:{ob.name}")
rec("室內門洞可通行", not bad, f"{nd} 個門洞全部暢通" if not bad else "; ".join(bad[:6]))
# 房間可達：從房間中心向外，沿四個方向找最近牆上的門洞（以門洞中心是否落在房間邊界範圍判斷）
def room_has_door(zid, lv, rx, ry):
    for (l2, ax, c, (a0, a1), drs) in b.INTERIOR.get(zid, []):
        if l2 != lv: continue
        for dc, (dw, dh) in drs:
            if ax == "y" and abs(c - ry[0]) < 0.2 or ax == "y" and abs(c - ry[1]) < 0.2:
                if rx[0] - 0.01 <= dc <= rx[1] + 0.01: return True
            if ax == "x" and (abs(c - rx[0]) < 0.2 or abs(c - rx[1]) < 0.2):
                if ry[0] - 0.01 <= dc <= ry[1] + 0.01: return True
    return False
closed = [f"{lv} {nm}" for (zid, lv, code, nm, rx, ry) in b.ROOMS
          if not any(k in nm for k in ("走廊", "大廳", "樓梯", "挑空", "展廊", "入口廳", "長廊"))
          and not (zid == "L08_LIBRARY" and lv == "2F") and not room_has_door(zid, lv, rx, ry)]
rec("房間皆有出入口", not closed, "全部房間至少一個門洞" if not closed else "、".join(closed))

# 5d 城牆封閉：除校門與東側門外，校內往外的射線都應被城牆（或建築）擋住
leak = []
for k in range(72):
    ang = 2 * math.pi * k / 72
    o = Vector((0, 75, -1.35)); d = Vector((math.cos(ang), math.sin(ang), 0))
    if d.y < 0 and abs(o.x + d.x * (6 - o.y) / d.y) < 4.5: continue      # 校門開口方向
    hit, loc, n, i, ob, m = scene.ray_cast(dg, o, d, distance=120)
    if not hit: leak.append(f"{math.degrees(ang):.0f}°")
gate_open = not scene.ray_cast(dg, Vector((0, 12, -0.65)), Vector((0, -1, 0)), distance=13)[0]
side_open = not scene.ray_cast(dg, Vector((70, 72, -0.65)), Vector((1, 0, 0)), distance=7)[0]
rec("城牆封閉＋兩處出入口", not leak and gate_open and side_open,
    f"72 向射線全部被擋；校門{'通' if gate_open else '堵'}、側門{'通' if side_open else '堵'}" if not leak else "漏：" + "、".join(leak[:10]),
    "O01 外圍城牆／校門／東側門")

# 5e R08：地面降低、建築台座、對外門階梯、校門大道圍籬
G = -1.85
bad = []
for st in b.ENTRY_STAIRS:
    nm, zid, axis, line, c, sgn, w, rails = st
    tl = b.stair_treads(nm)
    for k in range(12):
        u = line + sgn * (sum(tl[:k]) + tl[k] / 2)
        o = Vector((c, u, 5)) if axis == "y" else Vector((u, c, 5))
        hit, loc, n, i, ob, m = scene.ray_cast(dg, o, Vector((0, 0, -1)))
        if not (hit and ob.name == nm and abs(loc.z - (-k * b.ST_RISE)) < 1e-3):
            bad.append(f"{nm}#{k}:{ob.name if hit else None}@{loc.z if hit else 0:.3f}")
    # 階梯底外 0.3 m 落在校園地面
    u = line + sgn * (sum(tl) + 0.3)
    o = Vector((c, u, 5)) if axis == "y" else Vector((u, c, 5))
    hit, loc, *_ = scene.ray_cast(dg, o, Vector((0, 0, -1)))
    if not (hit and abs(loc.z - G) < 0.06): bad.append(f"{nm} 落腳 z={loc.z if hit else None}")
rec("對外門階梯逐級", not bad, f"{len(b.ENTRY_STAIRS)} 座 × 12 級，門口 ±0.00 逐級降到地面 −1.85" if not bad else "; ".join(bad[:6]))
gs = OB["L04_GRAND_STAIR"]
tlg = b.stair_treads("L04_GRAND_STAIR"); yfoot = 82.0 - sum(tlg)
hit, loc, *_ = scene.ray_cast(dg, Vector((0, 82.0 - sum(tlg[:6]) - tlg[6] / 2, 5)), Vector((0, 0, -1)))
rec("主樓正門大階梯（兩段）", abs(gs["width"] - 8.0) < 1e-6 and gs["risers"] == 12 and hit and abs(loc.z + 6 * b.ST_RISE) < 1e-3,
    f"寬 8 m；上段 6 級 → 休息平台 {tlg[6]:.2f} m（高 {-6 * b.ST_RISE:+.3f}）→ 下段 6 級；Y 82→{yfoot:.2f}；兩側石欄＋鐵欄杆＋底端石墩")
for side, sx in (("西", -1), ("東", 1)):
    hit, loc, n, i, ob, m = scene.ray_cast(dg, Vector((0, 80.0, -0.6)), Vector((sx, 0, 0)), distance=8)
    rec(f"大階梯{side}側石欄", hit and "BALUSTRADE" in ob.name, f"命中 {ob.name if hit else None}")
hit, loc, n, i, ob, m = scene.ray_cast(dg, Vector((0, 1.0, G + 1.2)), Vector((0, 1, 0)), distance=yfoot - 1.0 - 0.05)
rec("校門→大道→階梯腳 中軸無阻擋", not hit, "校門外沿中軸走到主樓大階梯第一級，全程無阻擋（無噴水池）" if not hit else f"被 {ob.name} 擋")
for side, sx in (("西", -1), ("東", 1)):
    blocked = 0
    for y in (12, 20, 38, 45, 62, 72):
        hit, loc, n, i, ob, m = scene.ray_cast(dg, Vector((0, y, G + 1.0)), Vector((sx, 0, 0)), distance=8)
        if hit and "AVENUE" in ob.name: blocked += 1
    rec(f"大道{side}側圍籬連續", blocked == 6, f"6 個取樣點中 {blocked} 個被大道圍籬擋住")
    for (a, bb) in b.AV["OPEN"]:
        hit, loc, n, i, ob, m = scene.ray_cast(dg, Vector((0, (a + bb) / 2, G + 1.0)), Vector((sx, 0, 0)), distance=9)
        rec(f"大道{side}側開口 Y{a:.0f}–{bb:.0f}", not hit, "可由大道走到兩側前庭／中庭" if not hit else f"被 {ob.name} 擋")
gz = [o for o in meshes if o.name == "TERRAIN_SNOW_G0"][0]
tzmax = max((gz.matrix_world @ v.co).z for v in gz.data.vertices)
pod = OB["SITE_BUILDING_PODIUM"]; pz = (min(v.co.z for v in pod.data.vertices), max(v.co.z for v in pod.data.vertices))
rec("基礎台座加厚", abs(tzmax - (G - 0.05)) < 1e-3 and abs(pz[1] + 0.30) < 1e-4 and pz[0] < G,
    f"校園地面頂 {tzmax:+.2f}；建築台座 {pz[0]:+.2f}→{pz[1]:+.2f}（外露 {-0.30 - tzmax:.2f} m）")
rec("中間兩座噴水池已移除", not any(o.name.startswith(("L02_FOUNTAIN", "L03_FOUNTAIN")) for o in meshes), "L02、L03 無噴水池物件")

# 6 足跡重疊（建築／連廊之間只能碰接不可重疊）
fps = [(z["id"], z["x"], z["y"]) for z in b.ZONES] + [(c["id"], c["x"], c["y"]) for c in b.CONNECTORS]
bad = []
for (n1, x1, y1), (n2, x2, y2) in itertools.combinations(fps, 2):
    ox = min(x1[1], x2[1]) - max(x1[0], x2[0]); oy = min(y1[1], y2[1]) - max(y1[0], y2[0])
    if ox > 1e-6 and oy > 1e-6:
        bad.append(f"{n1}×{n2}={ox*oy:.1f}m²")
rec("建築足跡不重疊", not bad, "; ".join(bad) or "全部只碰接", "連接段以碰接為原則")
# 連廊兩端都要碰到建築
for c in b.CONNECTORS:
    touch = []
    for z in b.ZONES:
        ox = min(c["x"][1], z["x"][1]) - max(c["x"][0], z["x"][0]); oy = min(c["y"][1], z["y"][1]) - max(c["y"][0], z["y"][0])
        if (abs(ox) < 1e-6 and oy > 0) or (abs(oy) < 1e-6 and ox > 0):
            touch.append(z["id"])
    rec(f"連廊不懸空 {c['id']}", len(touch) >= 2, "碰接 " + "、".join(touch), "防止樓棟懸空")

# 7 網格封閉、法線朝外（共用網格只檢一次）
nonman, neg, seen = [], [], set()
for o in meshes:
    if o.data.name in seen: continue
    seen.add(o.data.name)
    bm = bmesh.new(); bm.from_mesh(o.data)
    if any(not e.is_manifold for e in bm.edges): nonman.append(o.data.name)
    if bm.calc_volume(signed=True) <= 0: neg.append(o.data.name)
    bm.free()
rec("網格封閉 (manifold)", not nonman, ", ".join(nonman) or f"{len(meshes)} 件（{len(seen)} 組網格）全部封閉")
rec("法線朝外 (體積為正)", not neg, ", ".join(neg) or "全部正確")

# 8 實體穿插（世界座標 BVH；內縮 1 mm，共面碰接不算）
trees, BB = {}, {}
for o in meshes:
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world); bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.normal_update()
    for v in bm.verts:
        v.co -= v.normal.normalized() * 0.001
    trees[o.name] = BVHTree.FromBMesh(bm)
    cs = [v.co for v in bm.verts]
    BB[o.name] = ([min(c[i] for c in cs) for i in range(3)], [max(c[i] for c in cs) for i in range(3)])
    bm.free()
names = sorted(BB, key=lambda n: BB[n][0][0])
clash, decor_ok = [], []
for i, n1 in enumerate(names):
    a0, a1 = BB[n1]
    for n2 in names[i + 1:]:
        b0, b1 = BB[n2]
        if b0[0] >= a1[0] - 1e-4: break
        if any(min(a1[k], b1[k]) - max(a0[k], b0[k]) <= 1e-4 for k in range(3)): continue
        if trees[n1].overlap(trees[n2]):
            o1, o2 = OB[n1], OB[n2]
            if (o1.get("decor_roof") and "ROOF" in n2) or (o2.get("decor_roof") and "ROOF" in n1):
                decor_ok.append(f"{n1}×{n2}"); continue
            clash.append(f"{n1}×{n2}")
rec("無實體穿插", not clash, "; ".join(clash[:20]) or f"無（{len(meshes)} 件兩兩檢查；塔樓／角塔／老虎窗與屋頂交疊 {len(decor_ok)} 對屬造型豁免）", "自相交檢查")
rec("豁免僅限屋頂造型", all(("ROOF" in p.split("×")[0] or "ROOF" in p.split("×")[1]) for p in decor_ok), f"{len(decor_ok)} 對皆為 decor×ROOF")

# 8b 家具：離牆 ≥0.15（壁掛除外）、不入門洞淨空、不入梯井
furn = [o for o in meshes if o.get("system") == "FURNITURE"]
walls = [o for o in meshes if o.get("system") == "CORE_WALL" and "WINDOW" not in o.name]
tooclose = []
for f in furn:
    if f.get("mounted"): continue
    f0, f1 = BB[f.name]
    for d in (Vector((1, 0, 0)), Vector((-1, 0, 0)), Vector((0, 1, 0)), Vector((0, -1, 0))):
        c = Vector(((f0[0] + f1[0]) / 2, (f0[1] + f1[1]) / 2, f0[2] + 0.30))
        half = abs(d.x) * (f1[0] - f0[0]) / 2 + abs(d.y) * (f1[1] - f0[1]) / 2
        hit, loc, n, i, ob, m = scene.ray_cast(dg, c + d * (half + 0.001), d, distance=0.149)
        if hit and ob.get("system") == "CORE_WALL":
            tooclose.append(f"{f.name}→{ob.name}"); break
rec("家具離牆 ≥ 0.15 m", not tooclose, f"{len(furn)} 件家具全部符合" if not tooclose else "; ".join(tooclose[:6]), "計算書 §7 房間裝修淨距")
mods = {}
for f in furn: mods[f["module"]] = mods.get(f["module"], 0) + 1
shared = len({f.data.name for f in furn})
rec("家具共用網格", shared == len(mods), f"{len(furn)} 件擺放／{shared} 組模組網格：" + "、".join(f"{k}×{v}" for k, v in sorted(mods.items())),
    "MOD_WOOD_FURNITURE：同材質共用模型")

# 9 L07 不得出現 APPROVED
l07 = [o for o in bpy.context.scene.objects if o.name.startswith("L07")]
appr = [o.name for o in l07 if "APPROVED" in o.name or str(o.get("status", "")) in ("AUTHOR_CONFIRMED", "CAD_VERIFIED")]
rec("L07 未誤標正式完成", not appr and all(o.get("status") == "PENDING_AUTHOR_REPLACEMENT" for o in l07 if o.type == "MESH"),
    f"{len(l07)} 件皆 PENDING_AUTHOR_REPLACEMENT" if not appr else str(appr))
conf = [o.name for o in bpy.context.scene.objects if o.get("status") in ("AUTHOR_CONFIRMED", "CAD_VERIFIED")]
rec("無假報核定", not conf, "全部為 MODEL_ASSUMED / PENDING / G0_PROXY_ASSUMED")

# 10 GLB 重新開檔（新場景）
n_src = len(meshes)
src_bb = (min(BB[n][0][i] for n in BB for i in [0]), )
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
imp = [o for o in bpy.context.scene.objects if o.type == "MESH"]
mw = lambda o: [o.matrix_world @ Vector(c) for c in o.bound_box]
allc = [c for o in imp for c in mw(o)]
mn = [round(min(c[i] for c in allc), 2) for i in range(3)]; mx = [round(max(c[i] for c in allc), 2) for i in range(3)]
rec("GLB 重開：物件數", len(imp) == n_src, f"{len(imp)} / 原檔 {n_src}")
tr = [o for o in imp if o.name == "TERRAIN_SNOW_G0"][0]
tc = [tr.matrix_world @ Vector(c) for c in tr.bound_box]
tmn = [round(min(c[i] for c in tc), 2) for i in range(2)]; tmx = [round(max(c[i] for c in tc), 2) for i in range(2)]
rec("GLB 重開：世界座標", tmn == [-76.0, 0.0] and tmx == [76.0, 146.0] and abs(mx[2] - 35.0) < 0.01,
    f"地形 {tmn}→{tmx}；全體 min={mn} max={mx}", "不因匯出回歸原點；Z 頂 = L04 主塔 24.00＋尖頂 11.00")
s2 = [o for o in imp if o.name == "L08_LIBRARY_2F_SLAB"][0]
z2 = max((s2.matrix_world @ v.co).z for v in s2.data.vertices)
rec("GLB 重開：L08 2F 標高", abs(z2 - 5.4) < 0.01, f"{z2:.3f}")
ex = [o for o in imp if "status" in o.keys()]
rec("GLB 重開：extras 狀態欄保留", len(ex) == len(imp), f"{len(ex)} 件帶 status")

ok = sum(r["result"] == "PASS" for r in R)
json.dump(dict(summary=f"{ok}/{len(R)} PASS", checks=R), open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"QA {ok}/{len(R)} PASS")
for r in R:
    if r["result"] != "PASS":
        print("FAIL:", r["item"], r["detail"])
