# -*- coding: utf-8 -*-
"""
《現實遊戲》拉乎迪學院｜建築主體 G1 產生腳本  (G0 + 手冊階段 2)
------------------------------------------------------------------
依據：建模尺寸計算書 v0.1 (2026-10-27) ＋ 3D 模型製作手冊 v1.0 第 3/4/5/8/10 章
     ＋ 119 張圖逐張判讀（圖面筆記.md）
G1 = 外牆＋尖拱窗洞、外壁柱、挑空柱梁、L05 拱廊柱、各棟樓梯與護欄、L07 旋梯 proxy
所有尺寸：MODEL_ASSUMED v0.1（非作者核定、非 CAD 實測）；圖面新增值標 G1_PROXY_ASSUMED

用法：
  A) Blender 介面 → Scripting → 開啟本檔 → Run Script
  B) 命令列：blender -b -P lahudi_g0_build.py -- --out <輸出資料夾>
  C) python（pip 版 bpy）：python lahudi_g0_build.py --out <輸出資料夾>

座標：1 unit = 1 m；+X 東、+Y 北、+Z 上；WORLD_ORIGIN=(0,0,0)
改尺寸只改下方 PARAMS／ZONES／CONNECTORS，不要改建模函式。
"""
import bpy, bmesh, math, sys, os, json
from mathutils import Vector

# ════════════════════════════════════════════════════════════════
# 1. 全域參數（尺寸計算書 §1 §3 §7；手冊 §3.3）
# ════════════════════════════════════════════════════════════════
P = dict(
    CAMPUS_X=(-76.0, 76.0), CAMPUS_Y=(0.0, 146.0),
    FFL_1=0.00, FFL_2=5.40,
    SLAB_T=0.30,
    EAVE_Z=11.00, RIDGE_RISE=6.20,           # RIDGE_Z = 17.20
    L07_TOWER_Z=22.00,
    WALL_EXT=0.45, WALL_INT=0.18,
    DOOR_SINGLE=(1.10, 2.40), DOOR_DOUBLE=(2.20, 3.20),
    RAIL_H=1.20, RAIL_T=0.10,
    STAIR_RISE=0.18, STAIR_TREAD=0.30, STAIR_RISERS_PER_FLIGHT=15, STAIR_LANDING=1.80,
    # ↓ 以下是 G0 為了能建出來而補的值，計算書沒有給 → G0_PROXY_ASSUMED（見 issue 清單）
    STAIR_WIDTH=2.00,          # 計算書未定梯寬
    TERRAIN_TOP=-0.05,         # 地形面下沉 5 cm，避免與鋪面/1F 樓板頂共面閃爍
    PAVING_T=0.05,
    GATE_PILLAR_H=6.00,        # 校門石柱高度未定，G0 視覺占位
    NARROW_ROOF_PITCH_DEG=math.degrees(math.atan(6.2 / 10.0)),  # 窄跨度屋頂沿用 L08 坡度 31.8°
    # ↓ G1 新增（計算書 §7 有窗寬/窗高/窗台/柱/梁；開間與旋梯為 G1_PROXY_ASSUMED）
    WIN_W=1.60, WIN_H=3.00, WIN_SILL=1.00,      # 計算書 §7 哥德窗；尖拱以等邊尖拱計入 3.00
    WIN_BAY=4.50,                               # 窗心距目標（E-202 約 36 m / 7 跨 ≈ 5.1；取 4.5 讓教室每間 ≥2 窗）
    COL=0.55, BEAM_W=0.35, BEAM_D=0.70,         # 計算書 §7 柱/梁代理
    PILASTER_D=0.55,                            # 外壁柱外凸深度
    SPIRAL_R_OUT=3.80, SPIRAL_R_IN=0.65, SPIRAL_CORE_R=0.60, SPIRAL_LANDING_DEG=16.0,
)
P["RIDGE_Z"] = P["EAVE_Z"] + P["RIDGE_RISE"]
STATUS = "MODEL_ASSUMED"
SRC = "尺寸計算書 v0.1 / 手冊 v1.0"
F1, F2 = P["FFL_1"], P["FFL_2"]
DD = P["DOOR_DOUBLE"]
BOTH = (F1, F2)

# ════════════════════════════════════════════════════════════════
# 2. 分區與連廊（計算書 §2、§2.1、§4、§6）
#    doors: (牆面 S/N/W/E, 沿牆中心座標, (樓層FFL...), (寬,高), 說明)
# ════════════════════════════════════════════════════════════════
ZONES = [
    dict(id="L04_MAIN", zone="L04", name="主教學樓", x=(-24, 24), y=(82, 112), top=P["EAVE_Z"], roof="gable",
         voids_2F=[dict(id="L04_2F_OPENING_VOID_001", x=(-6, 6), y=(91.5, 99.86), note="中央大廳挑空 12×8.36（F-204 中排）", rails="NS")],
         doors=[("S", 0.0, (F1,), DD, "正門→L03 中庭"),
                ("W", 90.0, BOTH, DD, "→L05 連廊"),
                ("E", 90.0, BOTH, DD, "→L07 連廊"),
                ("N", 0.0, BOTH, DD, "→L08 連廊")]),
    dict(id="L05_CLOISTER", zone="L05", name="西側主走廊", x=(-40, -32), y=(58, 100), top=P["EAVE_Z"], roof="gable",
         doors=[("E", 90.0, BOTH, DD, "→L04 連廊"),
                ("W", 85.0, BOTH, DD, "→L05 附屬空間"),
                ("W", 60.0, BOTH, DD, "→L06 西翼"),
                ("S", -36.0, (F1,), DD, "南端室外出入口")]),
    dict(id="L05_ANNEX", zone="L05", name="西側附屬空間", x=(-60, -40), y=(74, 96), top=P["EAVE_Z"], roof="gable",
         doors=[("E", 85.0, BOTH, DD, "→L05 主走廊")]),
    dict(id="L06_WEST_A", zone="L06", name="西翼教室", x=(-70, -40), y=(42, 62), top=P["EAVE_Z"], roof="gable",
         doors=[("E", 60.0, BOTH, DD, "→L05 主走廊"),
                ("E", 53.05, (F1,), DD, "走廊東端室外門")]),
    dict(id="L06_EAST_C", zone="L06", name="東翼教室", x=(40, 70), y=(42, 62), top=P["EAVE_Z"], roof="gable",
         doors=[("W", 60.0, BOTH, DD, "→L06E–L07 連廊"),
                ("W", 52.55, (F1,), DD, "告白走廊西端室外門")]),
    dict(id="L07_STAIR_TOWER", zone="L07", name="樓梯塔(占位)", x=(32, 50), y=(82, 100), top=P["L07_TOWER_Z"], roof="flat",
         pending=True,
         voids_2F=[dict(id="L07_2F_OPENING_SPIRALWELL_PROXY_PENDING", x=(37.2, 44.8), y=(87.2, 94.8),
                        note="旋梯井 proxy（F-107/A-101/A-102 圓形旋梯拓樸）；非核定尺寸", rail_skip=("S", 40.45, 41.55))],
         doors=[("W", 90.0, BOTH, DD, "→L04 連廊"),
                ("S", 36.0, BOTH, DD, "→L06E–L07 連廊")]),
    dict(id="L08_LIBRARY", zone="L08", name="北側圖書館", x=(-30, 30), y=(118, 138), top=P["EAVE_Z"], roof="gable",
         voids_2F=[dict(id="L08_2F_OPENING_VOID_001", x=(-13, 1), y=(121, 135), note="2B 中庭挑空 14×14")],
         doors=[("S", 0.0, BOTH, DD, "→L04 連廊 (L08-2F)"),
                ("N", 0.0, (F1,), DD, "北門→後花園（F-108/F-208 R00）")]),
]

# 直跑雙折樓梯（計算書 §3.2：30 級、級高 0.18、踏面 0.30、平台 1.80）
# x0,y0 = 梯井西南角；第一跑向北、第二跑向南回到 y0 抵達 2F。位置依圖面拓樸，數值 G1_PROXY_ASSUMED
STAIRS = [
    dict(id="L04_STAIR_W", zone="L04_MAIN", x0=-23.30, y0=91.5, src="F-104/F-204 兩端樓梯"),
    dict(id="L04_STAIR_E", zone="L04_MAIN", x0=19.10, y0=91.5, src="F-104/F-204 兩端樓梯"),
    dict(id="L04_STAIR_C", zone="L04_MAIN", x0=-2.10, y0=103.04, src="F-104 大廳北側大樓梯／F-204 中央樓梯往 L08／REF-L04-01"),
    dict(id="L06W_STAIR", zone="L06_WEST_A", x0=-49.50, y0=54.55, src="A-102/F-206 近 L05 端樓梯（北帶樓梯間）"),
    dict(id="L06E_STAIR", zone="L06_EAST_C", x0=45.30, y0=54.55, src="A-102/F-206 近 L07 端樓梯（北帶樓梯間）"),
    dict(id="L08_STAIR_SW", zone="L08_LIBRARY", x0=-29.30, y0=121.0, src="F-208 R00 西南樓梯／R01 西南樓梯塔"),
    dict(id="L08_STAIR_SE", zone="L08_LIBRARY", x0=25.20, y0=121.0, src="F-208 R00 東南樓梯"),
]
_ZI = {z["id"]: z for z in ZONES}
for _s in STAIRS:
    _w = 2 * P["STAIR_WIDTH"] + 0.20
    _l = (P["STAIR_RISERS_PER_FLIGHT"] - 1) * P["STAIR_TREAD"] + P["STAIR_LANDING"]
    _ZI[_s["zone"]].setdefault("voids_2F", []).append(
        dict(id=f"{_s['id']}_2F_OPENING_STAIRWELL", x=(_s["x0"], _s["x0"] + _w), y=(_s["y0"], _s["y0"] + _l),
             note=f"樓梯井 {_w:.1f}×{_l:.1f}；{_s['src']}", rail_skip=("S", _s["x0"] + P["STAIR_WIDTH"] + 0.2, _s["x0"] + _w),
             status="G1_PROXY_ASSUMED"))

# L05 拱廊柱列（E-202 柱列、L05-07 淨寬 6.0 m → 兩列柱心 X=−39.0/−33.0；Y 避開門洞）
L05_COL_X = (-39.0, -33.0)
L05_COL_Y = (63.0, 67.5, 72.0, 76.5, 81.0, 88.0, 92.5, 97.0)

CONNECTORS = [
    dict(id="CX_L05_L04", name="L05↔L04 連廊", x=(-32, -24), y=(87, 93), walls=("S", "N")),
    dict(id="CX_L04_L07", name="L04↔L07 連廊", x=(24, 32), y=(87, 93), walls=("S", "N")),
    dict(id="CX_L04_L08", name="L04↔L08 連廊 (L08-2F 南側連廊)", x=(-3, 3), y=(112, 118), walls=("W", "E")),
    dict(id="CX_L06E_L07", name="L06東翼↔L07 連廊", x=(32, 40), y=(58, 82), walls=("W", "E", "S"),
         doors=[("E", 60.0, BOTH, DD, "→L06 東翼"), ("S", 36.0, (F1,), DD, "南端室外出入口")]),
]

# L08 二樓分帶（計算書 §4）；G1 依 F-208 R01／L08-2D/2E 圖改為 2D 研究室在北、2E 資料室在南
L08_BANDS = [
    ("L08_2F_ZONE_2A_WEST_STACKS", (-30, -13), (118, 138)),
    ("L08_2F_ZONE_2B_ATRIUM_GALLERY", (-13, 1), (118, 138)),
    ("L08_2F_ZONE_2C_EAST_STACKS", (1, 18), (118, 138)),
    ("L08_2F_ZONE_2D_RESEARCH", (18, 30), (128, 138)),
    ("L08_2F_ZONE_2E_ARCHIVE", (18, 30), (118, 128)),
]
# ── 室內隔間（G2）：("y", y, (x0,x1)) = 東西向牆；("x", x, (y0,y1)) = 南北向牆；中心線、厚 WALL_INT
#    doors: [(沿牆中心, (寬,高))]；依圖面拓樸配置，數值 G2_PROXY_ASSUMED
_SD, _OP = (1.10, 2.40), (3.00, 3.20)
INTERIOR = {"L04_MAIN": [
    # 1F（F-104：中央大廳貫穿南北；西列 教職員辦公室/會議室/健康室/檔案室；東列 等候區/行政辦公室/男女廁）
    ("1F", "y", 88.41, (-23.55, -6.18), [(-15.0, _SD)]),
    ("1F", "y", 88.41, (6.18, 23.55), [(15.0, (4.0, 3.2))]),
    ("1F", "y", 91.59, (-18.72, -6.18), [(-12.5, _SD)]),
    ("1F", "y", 91.59, (6.18, 18.72), [(12.5, _SD)]),
    ("1F", "y", 99.77, (-23.55, -6.18), []),
    ("1F", "y", 99.77, (6.18, 23.55), []),
    ("1F", "y", 102.95, (-23.55, -6.18), [(-18.0, _SD), (-9.0, _SD)]),
    ("1F", "y", 102.95, (6.18, 23.55), [(10.5, _SD), (19.0, _SD)]),
    ("1F", "x", -6.09, (82.45, 111.55), [(90.0, _OP), (101.36, _OP)]),
    ("1F", "x", 6.09, (82.45, 111.55), [(85.4, (4.0, 3.2)), (90.0, _OP), (101.36, _OP)]),
    ("1F", "x", -18.81, (91.50, 99.68), []),
    ("1F", "x", 18.81, (91.50, 99.68), []),
    ("1F", "x", -12.00, (103.04, 111.55), []),
    ("1F", "x", 14.80, (103.04, 111.55), []),
    # 2F（F-204 R00/R01：北排 201–204｜中央樓梯廳；北走廊；中排 備課/教材｜大廳挑空｜會議/休息；南走廊；南排 研究1/教師自習｜南展廊｜學生自習/研究2）
    ("2F", "y", 88.41, (-23.55, -6.18), [(-20.5, _SD), (-11.8, _SD)]),
    ("2F", "y", 88.41, (6.18, 23.55), [(11.8, _SD), (20.5, _SD)]),
    ("2F", "y", 91.59, (-18.72, -6.18), [(-15.6, _SD), (-9.3, _SD)]),
    ("2F", "y", 91.59, (6.18, 18.72), [(9.3, _SD), (15.6, _SD)]),
    ("2F", "y", 99.77, (-23.55, -6.18), []),
    ("2F", "y", 99.77, (6.18, 23.55), []),
    ("2F", "y", 102.95, (-23.55, -6.18), [(-19.2, _SD), (-10.5, _SD)]),
    ("2F", "y", 102.95, (6.18, 23.55), [(10.5, _SD), (19.2, _SD)]),
    ("2F", "x", -6.09, (91.50, 99.86), []),
    ("2F", "x", 6.09, (91.50, 99.86), []),
    ("2F", "x", -18.81, (91.50, 99.68), []),
    ("2F", "x", 18.81, (91.50, 99.68), []),
    ("2F", "x", -12.50, (91.68, 99.68), []),
    ("2F", "x", 12.50, (91.68, 99.68), []),
    ("2F", "x", -6.09, (103.04, 111.55), []),
    ("2F", "x", 6.09, (103.04, 111.55), []),
    ("2F", "x", -14.86, (103.04, 111.55), []),
    ("2F", "x", 14.86, (103.04, 111.55), []),
    ("2F", "x", -6.09, (82.45, 88.32), []),
    ("2F", "x", 6.09, (82.45, 88.32), []),
    ("2F", "x", -17.50, (82.45, 88.32), []),
    ("2F", "x", 17.50, (82.45, 88.32), []),
]}
# L06 兩翼（A-101 走廊在北側接 L05/L07 → 改為：北帶 入口廳/樓梯間/支援室；中間走廊；南帶 3 間教室）
#   西翼走廊 3.0 m（L06-11）；東翼 4.0 m 告白走廊（L06-12）
def _wing(sgn, corr_s, corr_n):
    X = lambda v: sgn * v
    rng = lambda a, b_: (min(X(a), X(b_)), max(X(a), X(b_)))
    w = []
    for lv in ("1F", "2F"):
        cls_d = [(X(64.7), _SD), (X(55.0), _SD), (X(45.3), _SD)]
        w.append((lv, "y", corr_s - 0.09, rng(69.55, 40.45), cls_d))
        nd = [(X(66.3), _SD), (X(59.7), _SD), (X(53.1), _SD)] if lv == "1F" else [(X(64.7), _SD), (X(54.8), _SD)]
        w.append((lv, "y", corr_n + 0.09, rng(69.55, 49.73), nd))
        for xc in (59.85, 50.15):
            w.append((lv, "x", X(xc), (42.45, corr_s - 0.18), []))
        for xc in (49.82, 45.09):
            w.append((lv, "x", X(xc), (corr_n + 0.18, 61.55), []))
        for xc in ((63.0, 56.4) if lv == "1F" else (59.73,)):
            w.append((lv, "x", X(xc), (corr_n + 0.18, 61.55), []))
    return w
INTERIOR["L06_WEST_A"] = _wing(-1, 51.55, 54.55)
INTERIOR["L06_EAST_C"] = _wing(+1, 50.55, 54.55)
# L05 附屬棟：中央東西走廊接主走廊門（Y=85），南北各兩間
INTERIOR["L05_ANNEX"] = [r for lv in ("1F", "2F") for r in (
    (lv, "y", 83.41, (-59.55, -40.45), [(-55.0, _SD), (-45.0, _SD)]),
    (lv, "y", 86.59, (-59.55, -40.45), [(-55.0, _SD), (-45.0, _SD)]),
    (lv, "x", -50.0, (74.45, 83.32), []),
    (lv, "x", -50.0, (86.68, 95.55), []))]
# L08 一樓（F-108）：典藏室(西北)、研究室(東北)、小組閱覽室；其餘開放（書架區、閱覽大廳、參考書區、借還/服務台）
INTERIOR["L08_LIBRARY"] = [
    ("1F", "y", 129.91, (-29.55, -19.91), [(-25.0, _SD)]),
    ("1F", "x", -20.00, (130.00, 137.55), [(134.0, _SD)]),
    ("1F", "y", 127.91, (17.91, 29.55), [(23.0, _SD)]),
    ("1F", "x", 18.00, (128.00, 137.55), [(133.0, _SD)]),
    ("1F", "y", 129.91, (7.91, 17.91), [(13.0, _SD)]),
    ("1F", "x", 8.00, (130.00, 137.55), [(133.5, _SD)]),
]
def _wing_rooms(zid, sgn, corr_s, corr_n, cls1, cls2, sup1, sup2, cname):
    X = lambda a, b_: (min(sgn * a, sgn * b_), max(sgn * a, sgn * b_))
    out = []
    for lv, cl, sp in (("1F", cls1, sup1), ("2F", cls2, sup2)):
        for (a, b_), nm in zip(((69.55, 59.94), (59.76, 50.24), (50.06, 40.45)), cl):
            out.append((zid, lv, "L06-01", nm, X(a, b_), (42.45, corr_s - 0.18)))
        out.append((zid, lv, "L06-11" if sgn < 0 else "L06-12", cname if lv == "2F" else "走廊／置物櫃區（L06-08）", X(69.55, 40.45), (corr_s, corr_n)))
        out.append((zid, lv, "EN", "入口廳（接 L05／連廊）", X(45.0, 40.45), (corr_n, 61.55)))
        out.append((zid, lv, "ST", "樓梯間", X(49.73, 45.18), (corr_n, 61.55)))
        bands = ((69.55, 63.09), (62.91, 56.49), (56.31, 49.91)) if lv == "1F" else ((69.55, 59.82), (59.64, 49.91))
        for (a, b_), (code, nm) in zip(bands, sp):
            out.append((zid, lv, code, nm, X(a, b_), (corr_n + 0.18, 61.55)))
    return out
# 房間表（給報告與檢視器；x0,x1,y0,y1 為淨空間）
ROOMS = [
    ("L04_MAIN", "1F", "L04-01", "大廳（含 L04-02 接待櫃台、北側大樓梯）", (-6.0, 6.0), (82.45, 111.55)),
    ("L04_MAIN", "1F", "L04-04", "教職員辦公室", (-23.55, -6.18), (82.45, 88.32)),
    ("L04_MAIN", "1F", "L04-08", "等候區", (6.18, 23.55), (82.45, 88.32)),
    ("L04_MAIN", "1F", "C1-S", "南走廊（接 L05／L07）", (-23.55, 23.55), (88.50, 91.50)),
    ("L04_MAIN", "1F", "ST-W", "西樓梯廳", (-23.55, -18.90), (91.50, 99.68)),
    ("L04_MAIN", "1F", "L04-05", "會議室", (-18.72, -6.18), (91.68, 99.68)),
    ("L04_MAIN", "1F", "L04-03", "行政辦公室", (6.18, 18.72), (91.68, 99.68)),
    ("L04_MAIN", "1F", "ST-E", "東樓梯廳", (18.90, 23.55), (91.50, 99.68)),
    ("L04_MAIN", "1F", "C1-N", "北走廊", (-23.55, 23.55), (99.86, 102.86)),
    ("L04_MAIN", "1F", "L04-07", "健康室", (-23.55, -12.09), (103.04, 111.55)),
    ("L04_MAIN", "1F", "L04-06", "檔案室", (-11.91, -6.18), (103.04, 111.55)),
    ("L04_MAIN", "1F", "L04-09", "男子廁所", (6.18, 14.71), (103.04, 111.55)),
    ("L04_MAIN", "1F", "L04-10", "女子廁所", (14.89, 23.55), (103.04, 111.55)),
    ("L04_MAIN", "2F", "L04-01", "教室 201", (-23.55, -14.95), (103.04, 111.55)),
    ("L04_MAIN", "2F", "L04-01", "教室 202", (-14.77, -6.18), (103.04, 111.55)),
    ("L04_MAIN", "2F", "ST-C", "中央樓梯廳（往 L08）", (-6.0, 6.0), (103.04, 111.55)),
    ("L04_MAIN", "2F", "L04-01", "教室 203", (6.18, 14.77), (103.04, 111.55)),
    ("L04_MAIN", "2F", "L04-01", "教室 204", (14.95, 23.55), (103.04, 111.55)),
    ("L04_MAIN", "2F", "L04-13", "北側二樓走廊", (-23.55, 23.55), (99.86, 102.86)),
    ("L04_MAIN", "2F", "ST-W", "西樓梯廳", (-23.55, -18.90), (91.50, 99.68)),
    ("L04_MAIN", "2F", "L04-05", "教師備課室", (-18.72, -12.59), (91.68, 99.68)),
    ("L04_MAIN", "2F", "L04-06", "教材室", (-12.41, -6.18), (91.68, 99.68)),
    ("L04_MAIN", "2F", "L04-13", "中央大廳挑空", (-6.0, 6.0), (91.50, 99.86)),
    ("L04_MAIN", "2F", "L04-11", "教職員會議室", (6.18, 12.41), (91.68, 99.68)),
    ("L04_MAIN", "2F", "L04-12", "教師休息室", (12.59, 18.72), (91.68, 99.68)),
    ("L04_MAIN", "2F", "ST-E", "東樓梯廳", (18.90, 23.55), (91.50, 99.68)),
    ("L04_MAIN", "2F", "L04-13", "南側二樓走廊（接 L05／L07）", (-23.55, 23.55), (88.50, 91.50)),
    ("L04_MAIN", "2F", "L04-09", "研究室 1", (-23.55, -17.59), (82.45, 88.32)),
    ("L04_MAIN", "2F", "L04-07", "教師自習室", (-17.41, -6.18), (82.45, 88.32)),
    ("L04_MAIN", "2F", "—", "南側展廊（面向 L03）", (-6.0, 6.0), (82.45, 88.32)),
    ("L04_MAIN", "2F", "L04-08", "學生自習室", (6.18, 17.41), (82.45, 88.32)),
    ("L04_MAIN", "2F", "L04-10", "研究室 2", (17.59, 23.55), (82.45, 88.32)),
]
ROOMS += _wing_rooms("L06_WEST_A", -1, 51.55, 54.55, ("教室 101", "教室 102", "教室 103"), ("A-1 教室", "A-2 教室", "A-3 教室"),
                     (("L06-02", "小組討論室"), ("L06-04", "教員休息室"), ("L06-05", "教具儲藏室")),
                     (("L06-07", "課後討論室"), ("L06-08", "教師備課室")), "西翼走廊／置物區")
ROOMS += _wing_rooms("L06_EAST_C", +1, 50.55, 54.55, ("教室 104", "教室 105", "教室 106"), ("C-1 教室", "C-2 教室", "C-3 教室"),
                     (("L06-03", "自習角"), ("L06-06", "教材準備室"), ("L06-07", "設備間")),
                     (("L06-09", "小組自習室"), ("L06-10", "學生自習室")), "東翼走廊／告白走廊")
ROOMS += [
    ("L05_ANNEX", "1F", "L05-05", "小型討論角", (-59.55, -50.09), (86.68, 95.55)),
    ("L05_ANNEX", "1F", "L05-07", "管理儲藏室", (-49.91, -40.45), (86.68, 95.55)),
    ("L05_ANNEX", "1F", "L05-02", "附屬走廊／長椅區", (-59.55, -40.45), (83.50, 86.50)),
    ("L05_ANNEX", "1F", "L05-06", "展示櫃區", (-59.55, -50.09), (74.45, 83.32)),
    ("L05_ANNEX", "1F", "L05-03", "休憩座席 A", (-49.91, -40.45), (74.45, 83.32)),
    ("L05_ANNEX", "2F", "L05-01", "自習室", (-59.55, -50.09), (86.68, 95.55)),
    ("L05_ANNEX", "2F", "L05-02", "小組討論室", (-49.91, -40.45), (86.68, 95.55)),
    ("L05_ANNEX", "2F", "L05-08", "附屬走廊／窗邊休憩帶", (-59.55, -40.45), (83.50, 86.50)),
    ("L05_ANNEX", "2F", "L05-06", "閱覽休憩區", (-59.55, -50.09), (74.45, 83.32)),
    ("L05_ANNEX", "2F", "L05-05", "教師諮詢室", (-49.91, -40.45), (74.45, 83.32)),
    ("L05_CLOISTER", "1F", "L05-01", "長廊主走道（含 L05-04 休憩座席 B）", (-39.55, -32.45), (58.45, 99.55)),
    ("L05_CLOISTER", "2F", "L05-07", "哥德主走廊（含 L05-03 閱讀角、L05-04 展示區）", (-39.55, -32.45), (58.45, 99.55)),
    ("L08_LIBRARY", "1F", "L08-05", "典藏室", (-29.55, -20.09), (130.00, 137.55)),
    ("L08_LIBRARY", "1F", "L08-03", "書架區（含 L08-09 借還櫃台）", (-29.55, -13.0), (118.45, 129.82)),
    ("L08_LIBRARY", "1F", "L08-02", "閱覽大廳（含 L08-04 參考書區、L08-01 入口門廳）", (-13.0, 1.0), (118.45, 137.55)),
    ("L08_LIBRARY", "1F", "L08-08", "個人閱覽席（含 L08-10 服務台）", (1.0, 17.91), (118.45, 129.82)),
    ("L08_LIBRARY", "1F", "L08-07", "小組閱覽室", (8.09, 17.91), (130.00, 137.55)),
    ("L08_LIBRARY", "1F", "L08-06", "研究室", (18.09, 29.55), (128.00, 137.55)),
    ("L08_LIBRARY", "1F", "ST", "東南樓梯／服務區", (18.0, 29.55), (118.45, 127.82)),
    ("L08_LIBRARY", "2F", "L08-2A", "西側書庫區", (-29.55, -13.0), (118.45, 137.55)),
    ("L08_LIBRARY", "2F", "L08-2B", "中庭挑空迴廊", (-13.0, 1.0), (118.45, 137.55)),
    ("L08_LIBRARY", "2F", "L08-2C", "東側書庫區", (1.0, 17.91), (118.45, 137.55)),
    ("L08_LIBRARY", "2F", "L08-2D", "研究室", (18.09, 29.55), (128.09, 137.55)),
    ("L08_LIBRARY", "2F", "L08-2E", "資料室", (18.09, 29.55), (118.45, 127.91)),
]
# 內隔牆位置（窗不得落在隔牆端點）
INTERIOR_WALL_STUBS = [("L08_LIBRARY", "N", 18.0), ("L08_LIBRARY", "S", 18.0), ("L08_LIBRARY", "E", 128.0)]
for _zid, _defs in INTERIOR.items():
    _z = {z["id"]: z for z in ZONES}[_zid]
    for (_lv, _ax, _c, (_a, _b), _d) in _defs:
        if _ax == "y":
            for _side, _edge in (("W", _z["x"][0] + P["WALL_EXT"]), ("E", _z["x"][1] - P["WALL_EXT"])):
                if abs(_a - _edge) < 1e-6 or abs(_b - _edge) < 1e-6:
                    INTERIOR_WALL_STUBS.append((_zid, _side, _c))
        else:
            for _side, _edge in (("S", _z["y"][0] + P["WALL_EXT"]), ("N", _z["y"][1] - P["WALL_EXT"])):
                if abs(_a - _edge) < 1e-6 or abs(_b - _edge) < 1e-6:
                    INTERIOR_WALL_STUBS.append((_zid, _side, _c))

OPEN_AREAS = [
    dict(id="L01_GATE_PAVING", zone="L01", x=(-4, 4), y=(4, 8)),
    dict(id="L01_APPROACH_PATH", zone="L01", x=(-3, 3), y=(0, 4)),
    dict(id="L02_FORECOURT_PAVING", zone="L02", x=(-22, 22), y=(18, 42)),
    dict(id="L03_COURTYARD_PAVING", zone="L03", x=(-22, 22), y=(45, 77)),
    dict(id="PATH_L01_L02", zone="L02", x=(-3, 3), y=(8, 18)),
    dict(id="PATH_L02_L03", zone="L03", x=(-3, 3), y=(42, 45)),
    dict(id="PATH_L03_L04", zone="L03", x=(-3, 3), y=(77, 82)),
]

# ════════════════════════════════════════════════════════════════
# 3. 幾何工具：格狀分割 → 焊接面 → 擠出（產生乾淨、真正有洞的實體）
# ════════════════════════════════════════════════════════════════
def _plate_bm(u, v, holes, w0, w1, mapping):
    """u,v=(min,max) 外框；holes=[(u0,u1,v0,v1)]；在 w0..w1 擠出厚度。
    mapping(u,v,w)->(x,y,z)。回傳 bmesh。"""
    us = sorted({u[0], u[1], *[h[0] for h in holes], *[h[1] for h in holes]})
    vs = sorted({v[0], v[1], *[h[2] for h in holes], *[h[3] for h in holes]})
    us = [a for a in us if u[0] <= a <= u[1]]
    vs = [a for a in vs if v[0] <= a <= v[1]]
    bm = bmesh.new()
    vert = {}
    def gv(a, b):
        k = (round(a, 5), round(b, 5))
        if k not in vert:
            vert[k] = bm.verts.new(mapping(a, b, w0))
        return vert[k]
    for i in range(len(us) - 1):
        for j in range(len(vs) - 1):
            cu, cv = (us[i] + us[i + 1]) / 2, (vs[j] + vs[j + 1]) / 2
            if any(h[0] < cu < h[1] and h[2] < cv < h[3] for h in holes):
                continue
            bm.faces.new([gv(us[i], vs[j]), gv(us[i + 1], vs[j]), gv(us[i + 1], vs[j + 1]), gv(us[i], vs[j + 1])])
    # 格點全域共用 → 無 T 形接縫；格與格焊接，擠出後只有外輪廓與洞口邊有側面
    d =Vector(mapping(0, 0, w1)) - Vector(mapping(0, 0, w0))
    ret = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    bmesh.ops.translate(bm, vec=d, verts=[e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

MAP_XY = lambda a, b, w: (a, b, w)          # 水平板：u=x v=y w=z
MAP_XZ = lambda a, b, w: (a, w, b)          # 東西向牆：u=x v=z w=y
MAP_YZ = lambda a, b, w: (w, a, b)          # 南北向牆：u=y v=z w=x

COLL = {}
def coll(path):
    """path 如 'LAHUDI_ACADEMY_MASTER/L04_MAIN/1F'"""
    if path in COLL:
        return COLL[path]
    parts = path.split("/")
    parent = bpy.context.scene.collection
    acc = ""
    for p in parts:
        acc = p if not acc else acc + "/" + p
        if acc not in COLL:
            c = bpy.data.collections.new(p)
            parent.children.link(c)
            COLL[acc] = c
        parent = COLL[acc]
    return COLL[path]

def make_obj(name, bm, collection, **props):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    collection.objects.link(ob)
    ob["status"] = props.pop("status", STATUS)
    ob["source"] = props.pop("source", SRC)
    ob["grade"] = "G0"
    for k, v in props.items():
        ob[k] = v
    if MAT.get(props.get("system")):
        me.materials.append(MAT[props["system"]])
    return ob

def box(name, x, y, z, collection, **props):
    return make_obj(name, _plate_bm(x, y, [], z[0], z[1], MAP_XY), collection, **props)

def plate(name, x, y, holes, z, collection, **props):
    h = [(a[0], a[1], b[0], b[1]) for a, b in holes]
    return make_obj(name, _plate_bm(x, y, h, z[0], z[1], MAP_XY), collection, **props)

def gable(name, x, y, z0, collection, rise=None, **props):
    """雙坡屋頂：屋脊沿長邊，跨距=短邊"""
    sx, sy = x[1] - x[0], y[1] - y[0]
    span = min(sx, sy)
    if rise is None:
        rise = P["RIDGE_RISE"] if span >= 20 else (span / 2) * math.tan(math.radians(P["NARROW_ROOF_PITCH_DEG"]))
    bm = bmesh.new()
    if sx >= sy:   # 屋脊沿 X
        ym = (y[0] + y[1]) / 2
        v = [bm.verts.new(c) for c in [(x[0], y[0], z0), (x[1], y[0], z0), (x[1], y[1], z0), (x[0], y[1], z0),
                                         (x[0], ym, z0 + rise), (x[1], ym, z0 + rise)]]
        faces = [(0, 3, 2, 1), (0, 1, 5, 4), (3, 4, 5, 2), (0, 4, 3), (1, 2, 5)]
    else:          # 屋脊沿 Y
        xm = (x[0] + x[1]) / 2
        v = [bm.verts.new(c) for c in [(x[0], y[0], z0), (x[1], y[0], z0), (x[1], y[1], z0), (x[0], y[1], z0),
                                         (xm, y[0], z0 + rise), (xm, y[1], z0 + rise)]]
        faces = [(0, 3, 2, 1), (0, 1, 4), (3, 5, 2), (0, 4, 5, 3), (1, 2, 5, 4)]
    for f in faces:
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return make_obj(name, bm, collection, roof_rise_m=round(rise, 3), roof_span_m=span,
                    roof_pitch_deg=round(math.degrees(math.atan(rise / (span / 2))), 2), **props)

def wall_lifts(top):
    """牆在 2F 樓板處斷開（樓板貫通外框），避免牆板互穿"""
    return [(F1, F2 - P["SLAB_T"]), (F2, top)]

def perimeter_walls(prefix, x, y, top, doors, collection, walls=("S", "N", "W", "E"), t=None, windows=None, **props):
    """windows: {side: [(u_center, sill_z), ...]} → 牆上挖 WIN_W × WIN_H 真洞口"""
    t = t or P["WALL_EXT"]
    windows = windows or {}
    out = []
    spans = {"S": (x, (y[0], y[0] + t), MAP_XZ), "N": (x, (y[1] - t, y[1]), MAP_XZ),
             "W": ((y[0] + t, y[1] - t), (x[0], x[0] + t), MAP_YZ), "E": ((y[0] + t, y[1] - t), (x[1] - t, x[1]), MAP_YZ)}
    if "S" not in walls:
        spans["W"] = ((y[0], spans["W"][0][1]), spans["W"][1], MAP_YZ); spans["E"] = ((y[0], spans["E"][0][1]), spans["E"][1], MAP_YZ)
    if "N" not in walls:
        spans["W"] = ((spans["W"][0][0], y[1]), spans["W"][1], MAP_YZ); spans["E"] = ((spans["E"][0][0], y[1]), spans["E"][1], MAP_YZ)
    for side in walls:
        u, w, mp = spans[side]
        for li, (z0, z1) in enumerate(wall_lifts(top)):
            holes = []
            for (s, c, levels, (dw, dh), note) in doors:
                if s != side:
                    continue
                for ffl in levels:
                    if z0 - 1e-6 <= ffl < z1:
                        holes.append((c - dw / 2, c + dw / 2, ffl, min(ffl + dh, z1)))
            for (c, sill) in windows.get(side, []):
                if z0 < sill and sill + P["WIN_H"] < z1:
                    holes.append((c - P["WIN_W"] / 2, c + P["WIN_W"] / 2, sill, sill + P["WIN_H"]))
            nm =f"{prefix}_{'1F' if li == 0 else '2F'}_CORE_WALL_{side}"
            bm = _plate_bm(u, (z0, z1), holes, w[0], w[1], mp)
            out.append(make_obj(nm, bm, collection, system="CORE_WALL", openings=len(holes), **props))
    return out

def rails_around(prefix, vx, vy, z, collection, skip=None, **props):
    """沿挑空洞口邊緣閉合欄杆（放在樓板上、洞口外側）"""
    t, h = P["RAIL_T"], P["RAIL_H"]
    segs = {"S": [((vx[0] - t, vx[1] + t), (vy[0] - t, vy[0]))], "N": [((vx[0] - t, vx[1] + t), (vy[1], vy[1] + t))],
            "W": [((vx[0] - t, vx[0]), (vy[0], vy[1]))], "E": [((vx[1], vx[1] + t), (vy[0], vy[1]))]}
    if skip:  # 樓梯抵達口：在該邊挖掉一段
        side, a, b = skip
        (xr, yr), = segs[side]
        segs[side] = [((xr[0], a), yr), ((b, xr[1]), yr)]
    obs = []
    for side, lst in segs.items():
        for i, (xr, yr) in enumerate(lst):
            if xr[1] - xr[0] < 1e-3:
                continue
            obs.append(box(f"{prefix}_RAIL_{side}{i}", xr, yr, (z, z + h), collection, system="RAIL_STAIR",
                           note="欄杆高 1.20 m（暫定）", **props))
    return obs

def stair_flight(name, x, y_start, y_dir, z_start, n_treads, collection, **props):
    """實心階梯 proxy：側面輪廓 → 沿 X 擠出；底部落到 z=0"""
    r, tr = P["STAIR_RISE"], P["STAIR_TREAD"]
    pts = [(y_start, 0.0), (y_start, z_start)]
    yy, zz = y_start, z_start
    for i in range(n_treads):
        zz += r; pts.append((yy, zz)); yy += y_dir * tr; pts.append((yy, zz))
    pts.append((yy, 0.0))
    bm = bmesh.new()
    vs = [bm.verts.new((x[0], a, b)) for a, b in pts]
    f = bm.faces.new(vs if y_dir > 0 else list(reversed(vs)))
    ret = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=Vector((x[1] - x[0], 0, 0)), verts=[e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return make_obj(name, bm, collection, system="RAIL_STAIR", **props)

def cylinder(name, cx, cy, r, z, collection, seg=48, **props):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=z[1] - z[0])
    bmesh.ops.translate(bm, vec=Vector((cx, cy, (z[0] + z[1]) / 2)), verts=bm.verts)
    return make_obj(name, bm, collection, **props)

# ════════════════════════════════════════════════════════════════
# 3b. G1 模組：任意多邊形稜柱、尖拱窗、外壁柱、挑空柱梁、樓梯
# ════════════════════════════════════════════════════════════════
def add_prism(bm, pts, w0, w1, mapping):
    """pts=[(u,v)...] 在平面上的多邊形，沿 w 由 w0 擠到 w1（多個稜柱可放同一 bmesh）"""
    vs = [bm.verts.new(mapping(u, v, w0)) for u, v in pts]
    f = bm.faces.new(vs)
    ret = bmesh.ops.extrude_face_region(bm, geom=[f])
    d = Vector(mapping(0, 0, w1)) - Vector(mapping(0, 0, w0))
    bmesh.ops.translate(bm, vec=d, verts=[e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)])

def pointed_arch_parts(c, sill, n_seg=8):
    """等邊尖拱：寬 WIN_W、總高 WIN_H（含拱）。回傳 (左拱肩, 右拱肩, 玻璃輪廓) 的 (u,v) 多邊形"""
    W, H = P["WIN_W"], P["WIN_H"]
    x0, x1 = c - W / 2, c + W / 2
    rise = W * math.sin(math.radians(60))
    zs, top = sill + H - rise, sill + H
    arcR = [(x0 + W * math.cos(math.radians(a)), zs + W * math.sin(math.radians(a)))
            for a in [60 * k / n_seg for k in range(n_seg + 1)]]          # 右側弧：圓心(x0,zs) 0°→60°
    arcL = [(x1 + W * math.cos(math.radians(a)), zs + W * math.sin(math.radians(a)))
            for a in [120 + 60 * k / n_seg for k in range(n_seg + 1)]]    # 左側弧：圓心(x1,zs) 120°→180°
    arcR[-1] = arcL[0] = (c, top)                                          # 拱頂同一點
    left = [(x0, top)] + arcL                      # (x0,top)→拱頂→…→(x0,zs)
    right = [(x1, zs), (x1, top)] + list(reversed(arcR))[:-1]   # (x1,zs)→(x1,top)→拱頂→…（不含起點）
    glass = [(x0, sill), (x1, sill)] + arcR + arcL[1:]
    return left, right, glass

FOOT = lambda: [(z["id"], z["x"], z["y"]) for z in ZONES] + [(c["id"], c["x"], c["y"]) for c in CONNECTORS]
FOOT_ALL = lambda: FOOT() + [(o["id"], o["x"], o["y"]) for o in OPEN_AREAS]

def side_geom(x, y, side):
    """回傳 (外框沿牆區間 a,b, 牆線座標, 法向 ±1, 軸)"""
    return {"S": (x[0], x[1], y[0], -1, "y"), "N": (x[0], x[1], y[1], +1, "y"),
            "W": (y[0], y[1], x[0], -1, "x"), "E": (y[0], y[1], x[1], +1, "x")}[side]

def touch_intervals(owner, x, y, side):
    a, b, line, _, ax = side_geom(x, y, side)
    out = []
    for oid, ox, oy in FOOT():
        if oid == owner:
            continue
        if ax == "y":
            if (abs(oy[0] - line) < 1e-6 or abs(oy[1] - line) < 1e-6) and min(b, ox[1]) > max(a, ox[0]):
                out.append((max(a, ox[0]), min(b, ox[1])))
        else:
            if (abs(ox[0] - line) < 1e-6 or abs(ox[1] - line) < 1e-6) and min(b, oy[1]) > max(a, oy[0]):
                out.append((max(a, oy[0]), min(b, oy[1])))
    return out

def plan_facade(owner, x, y, side, doors, levels, stubs=()):
    """依開間 WIN_BAY 均分；避開碰接段、門洞、內牆端點與轉角 → 窗位與外壁柱位"""
    a, b, *_ = side_geom(x, y, side)
    L = b - a
    n = max(1, int(L // P["WIN_BAY"])) if L >= 4.0 else 0
    tch = touch_intervals(owner, x, y, side)
    hw = P["WIN_W"] / 2
    wins, pils = [], []
    for ffl in levels:
        blk = [(s - 1.0, e + 1.0) for s, e in tch] + [(a, a + 1.3), (b - 1.3, b)]
        blk += [(c - dw / 2 - 0.9, c + dw / 2 + 0.9) for (s, c, lv, (dw, dh), _) in doors if s == side and ffl in lv]
        blk += [(p - 1.1, p + 1.1) for p in stubs]
        for i in range(n):
            c = a + (i + 0.5) * L / n
            if all(c + hw <= s or c - hw >= e for s, e in blk):
                wins.append((c, ffl + P["WIN_SILL"]))
    blkp = [(s - 0.6, e + 0.6) for s, e in tch]
    blkp += [(c - dw / 2 - 0.3, c + dw / 2 + 0.3) for (s, c, lv, (dw, dh), _) in doors if s == side]
    for i in range(1, n):
        p = a + i * L / n
        if all(p + P["COL"] / 2 <= s or p - P["COL"] / 2 >= e for s, e in blkp):
            pils.append(p)
    return wins, pils

def window_objects(prefix, x, y, plan, collection, t=None, **props):
    """尖拱拱肩（石）＋玻璃，兩個合併物件"""
    t = t or P["WALL_EXT"]
    bm_s, bm_g = bmesh.new(), bmesh.new()
    n = 0
    for side, lst in plan.items():
        if side in ("S", "N"):
            w = (y[0], y[0] + t) if side == "S" else (y[1] - t, y[1]); mp = MAP_XZ
        else:
            w = (x[0], x[0] + t) if side == "W" else (x[1] - t, x[1]); mp = MAP_YZ
        wm = (w[0] + w[1]) / 2
        for (c, sill) in lst:
            left, right, glass = pointed_arch_parts(c, sill)
            add_prism(bm_s, left, w[0], w[1], mp)
            add_prism(bm_s, right, w[0], w[1], mp)
            add_prism(bm_g, glass, wm - 0.02, wm + 0.02, mp)
            n += 1
    if n == 0:
        bm_s.free(); bm_g.free(); return 0
    for bm in (bm_s, bm_g):
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    make_obj(f"{prefix}_OPENING_WINDOW_ARCH", bm_s, collection, system="CORE_WALL", windows=n,
             note="等邊尖拱拱肩；窗 1.60×3.00、窗台 1.00（計算書 §7）", **props)
    make_obj(f"{prefix}_OPENING_WINDOW_GLASS", bm_g, collection, system="GLASS", windows=n, **props)
    return n

def pilaster_boxes(prefix, x, y, side, positions, top, collection, **props):
    D, C = P["PILASTER_D"], P["COL"]
    a, b, line, sgn, ax = side_geom(x, y, side)
    bm = bmesh.new(); n = 0
    for p in positions:
        if ax == "y":
            bx, by = (p - C / 2, p + C / 2), ((line - D, line) if sgn < 0 else (line, line + D))
        else:
            bx, by = ((line - D, line) if sgn < 0 else (line, line + D)), (p - C / 2, p + C / 2)
        if any(min(bx[1], ox[1]) - max(bx[0], ox[0]) > 1e-6 and min(by[1], oy[1]) - max(by[0], oy[0]) > 1e-6
               for _, ox, oy in FOOT_ALL()):
            continue
        add_prism(bm, [(bx[0], by[0]), (bx[1], by[0]), (bx[1], by[1]), (bx[0], by[1])], P["TERRAIN_TOP"], top, MAP_XY)
        n += 1
    if n:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        make_obj(f"{prefix}_COLUMN_PILASTER_{side}", bm, collection, system="COLUMN_BEAM", count=n,
                 note="外壁柱 0.55×0.55（計算書 §7 柱代理）", **props)
    else:
        bm.free()
    return n

def atrium_frame(prefix, vx, vy, collection, ns_only=False, **props):
    """挑空四周：1F 柱列（≤5 m 一支）＋ 2F 樓板下環梁。ns_only：東西側為牆，只做南北兩側柱梁"""
    C, BW, BD, T = P["COL"], P["BEAM_W"], P["BEAM_D"], P["SLAB_T"]
    zb = F2 - T - BD
    rect = lambda bx, by: [(bx[0], by[0]), (bx[1], by[0]), (bx[1], by[1]), (bx[0], by[1])]
    if ns_only:
        bm = bmesh.new(); n = 0
        nx = math.ceil((vx[1] - vx[0]) / 5.0)
        for k in range(1, nx):
            xk = vx[0] + k * (vx[1] - vx[0]) / nx
            for by in ((vy[0] - C, vy[0]), (vy[1], vy[1] + C)):
                add_prism(bm, rect((xk - C / 2, xk + C / 2), by), F1, zb, MAP_XY); n += 1
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        make_obj(f"{prefix}_1F_COLUMN_ATRIUM", bm, collection, system="COLUMN_BEAM", count=n, level="1F", **props)
        bm = bmesh.new()
        for by in ((vy[0] - BW, vy[0]), (vy[1], vy[1] + BW)):
            add_prism(bm, rect(vx, by), zb, F2 - T, MAP_XY)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        make_obj(f"{prefix}_1F_BEAM_ATRIUM_NS", bm, collection, system="COLUMN_BEAM", level="1F", **props)
        return n
    bm = bmesh.new(); n = 0
    nx = math.ceil((vx[1] - vx[0]) / 5.0); ny = math.ceil((vy[1] - vy[0]) / 5.0)
    for k in range(nx + 1):
        xk = vx[0] + k * (vx[1] - vx[0]) / nx
        bx = (vx[0] - C, vx[0]) if k == 0 else (vx[1], vx[1] + C) if k == nx else (xk - C / 2, xk + C / 2)
        for by in ((vy[0] - C, vy[0]), (vy[1], vy[1] + C)):
            add_prism(bm, rect(bx, by), F1, zb, MAP_XY); n += 1
    for k in range(1, ny):
        yk = vy[0] + k * (vy[1] - vy[0]) / ny
        for bx in ((vx[0] - C, vx[0]), (vx[1], vx[1] + C)):
            add_prism(bm, rect(bx, (yk - C / 2, yk + C / 2)), F1, zb, MAP_XY); n += 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    make_obj(f"{prefix}_1F_COLUMN_ATRIUM", bm, collection, system="COLUMN_BEAM", count=n, level="1F", **props)
    bm = bmesh.new()
    for bx, by in [((vx[0] - C, vx[1] + C), (vy[0] - BW, vy[0])), ((vx[0] - C, vx[1] + C), (vy[1], vy[1] + BW)),
                   ((vx[0] - BW, vx[0]), (vy[0], vy[1])), ((vx[1], vx[1] + BW), (vy[0], vy[1]))]:
        add_prism(bm, rect(bx, by), zb, F2 - T, MAP_XY)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    make_obj(f"{prefix}_1F_BEAM_ATRIUM_RING", bm, collection, system="COLUMN_BEAM", level="1F",
             note="梁 0.35×0.70（計算書 §7）", **props)
    return n

def two_flight_stair(prefix, x0, y0, collection, **props):
    n = P["STAIR_RISERS_PER_FLIGHT"] - 1
    run, W, half = n * P["STAIR_TREAD"], P["STAIR_WIDTH"], P["STAIR_RISERS_PER_FLIGHT"] * P["STAIR_RISE"]
    stair_flight(f"{prefix}_FLIGHT1", (x0, x0 + W), y0, +1, 0.0, n, collection, **props)
    box(f"{prefix}_LANDING", (x0, x0 + 2 * W + 0.2), (y0 + run, y0 + run + P["STAIR_LANDING"]), (0.0, half),
        collection, system="RAIL_STAIR", **props)
    stair_flight(f"{prefix}_FLIGHT2", (x0 + W + 0.2, x0 + 2 * W + 0.2), y0 + run, -1, half, n, collection, **props)

def spiral_stair(prefix, cx, cy, collection, **props):
    """圓形旋梯 proxy：29 個楔形踏階＋1 個抵達平台（第 30 級＝+5.40），朝南抵達。中心柱 r=0.60"""
    ro, ri, rise = P["SPIRAL_R_OUT"], P["SPIRAL_R_IN"], P["STAIR_RISE"]
    mid = (ro + ri) / 2
    dth = P["STAIR_TREAD"] / mid
    land = math.radians(P["SPIRAL_LANDING_DEG"])
    th_end = -math.pi / 2 - land / 2
    th0 = th_end - 29 * dth
    def wedge(bm, a0, a1, z0, z1):
        k = max(2, int(math.degrees(a1 - a0) / 2) + 1)
        outer = [(cx + ro * math.cos(a0 + (a1 - a0) * i / k), cy + ro * math.sin(a0 + (a1 - a0) * i / k)) for i in range(k + 1)]
        inner = [(cx + ri * math.cos(a1 - (a1 - a0) * i / k), cy + ri * math.sin(a1 - (a1 - a0) * i / k)) for i in range(k + 1)]
        add_prism(bm, outer + inner, z0, z1, MAP_XY)
    bm = bmesh.new()
    for i in range(29):
        top = (i + 1) * rise
        wedge(bm, th0 + i * dth, th0 + (i + 1) * dth, max(0.0, top - 0.40), top)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    make_obj(f"{prefix}_TREADS", bm, collection, system="RAIL_STAIR", treads=29, rise=rise,
             sweep_deg=round(math.degrees(29 * dth), 1), **props)
    bm = bmesh.new()
    wedge(bm, th_end, th_end + land, F2 - P["SLAB_T"], F2)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    make_obj(f"{prefix}_ARRIVAL_LANDING", bm, collection, system="RAIL_STAIR", **props)
    cylinder(f"{prefix}_CORE_COLUMN", cx, cy, P["SPIRAL_CORE_R"], (F1, F2), collection, seg=32, system="COLUMN_BEAM", **props)

def pyramid(name, x, y, z0, rise, collection, **props):
    bm = bmesh.new()
    xm, ym = (x[0] + x[1]) / 2, (y[0] + y[1]) / 2
    v = [bm.verts.new(c) for c in [(x[0], y[0], z0), (x[1], y[0], z0), (x[1], y[1], z0), (x[0], y[1], z0), (xm, ym, z0 + rise)]]
    for f in [(0, 3, 2, 1), (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)]:
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return make_obj(name, bm, collection, **props)

# ════════════════════════════════════════════════════════════════
# 4. 材質（G0 只用來區分系統顏色）
# ════════════════════════════════════════════════════════════════
MAT = {}
def setup_materials():
    spec = {"SLAB": (0.62, 0.60, 0.56), "CORE_WALL": (0.80, 0.78, 0.72), "ROOF_TURRET": (0.20, 0.25, 0.36),
            "RAIL_STAIR": (0.55, 0.38, 0.20), "TERRAIN": (0.90, 0.92, 0.95), "PAVING": (0.68, 0.68, 0.70),
            "PENDING": (0.85, 0.40, 0.30), "WATER": (0.45, 0.65, 0.80), "ZONE_MARK": (0.75, 0.70, 0.55),
            "GLASS": (0.42, 0.58, 0.78), "COLUMN_BEAM": (0.70, 0.68, 0.62)}
    for k, c in spec.items():
        m = bpy.data.materials.new(f"MAT_G0_{k}")
        m.diffuse_color = (*c, 1.0)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (*c, 1.0)
            bsdf.inputs["Roughness"].default_value = 0.9
        MAT[k] = m

# ════════════════════════════════════════════════════════════════
# 5. 建置
# ════════════════════════════════════════════════════════════════
ROOT = "LAHUDI_ACADEMY_MASTER"

def build():
    # 清空場景
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    COLL.clear(); MAT.clear()
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"; sc.unit_settings.scale_length = 1.0; sc.unit_settings.length_unit = "METERS"
    setup_materials()
    coll(f"{ROOT}/00_REFERENCE")  # 參考圖放這（不匯出）
    for k in ["01_TERRAIN_SNOW", "02_BOUNDARY", "L01_GATE", "L02_FORECOURT", "L03_COURTYARD"]:
        coll(f"{ROOT}/{k}")

    T, S = P["SLAB_T"], P["SLAB_T"]
    # ── 建築
    for zd in ZONES:
        zid, x, y, top = zd["id"], zd["x"], zd["y"], zd["top"]
        base = f"{ROOT}/{zid}"
        pend = zd.get("pending", False)
        st = "PENDING_AUTHOR_REPLACEMENT" if pend else STATUS
        common = dict(zone=zd["zone"], building=zid)
        c1, c2, cr = coll(f"{base}/1F"), coll(f"{base}/{'PROXY_2F_PENDING' if pend else '2F'}"), coll(f"{base}/ROOF")
        box(f"{zid}_1F_SLAB", x, y, (F1 - T, F1), c1, system="SLAB", level="1F", status=st, **common)
        voids = zd.get("voids_2F", [])
        plate(f"{zid}_2F_SLAB{'_PROXY_PENDING' if pend else ''}", x, y, [(v["x"], v["y"]) for v in voids],
              (F2 - T, F2), c2, system="SLAB", level="2F", status=st, **common)
        for v in voids:
            # 洞口記錄用 Empty（非網格，不會在 GLB 形成假樓板）
            e = bpy.data.objects.new(v["id"], None)
            e.empty_display_type = "CUBE"
            e.location = ((v["x"][0] + v["x"][1]) / 2, (v["y"][0] + v["y"][1]) / 2, F2 - T / 2)
            e.scale = ((v["x"][1] - v["x"][0]) / 2, (v["y"][1] - v["y"][0]) / 2, T / 2)
            c2.objects.link(e)
            e["system"] = "OPENING_VOID"; e["note"] = v["note"]; e["status"] = st if pend else STATUS
            if v.get("rails") == "NS":   # 東西兩側為 2F 房間牆，只在南北走廊側設欄杆
                for sd_, yr in (("S", (v["y"][0] - P["RAIL_T"], v["y"][0])), ("N", (v["y"][1], v["y"][1] + P["RAIL_T"]))):
                    box(f"{v['id'].replace('_OPENING', '')}_RAIL_{sd_}0", v["x"], yr, (F2, F2 + P["RAIL_H"]), c2,
                        system="RAIL_STAIR", level="2F", status=st, note="欄杆高 1.20 m（暫定；L04-13 圖 1.10–1.20）", **common)
            else:
                rails_around(v["id"].replace("_OPENING", ""), v["x"], v["y"], F2, c2, skip=v.get("rail_skip"),
                             level="2F", status=st, **common)
        cw = coll(f"{base}/CORE")
        cwin = coll(f"{base}/OPENING_DOOR_WINDOW")
        ccol = coll(f"{base}/COLUMN_BEAM")
        stubs = {s: [p for (b_, s_, p) in INTERIOR_WALL_STUBS if b_ == zid and s_ == s] for s in "SNWE"}
        wplan, n_pil = {}, 0
        for side in "SNWE":
            wins, pils = plan_facade(zid, x, y, side, zd["doors"], BOTH, stubs[side])
            wplan[side] = wins
            n_pil += pilaster_boxes(zid, x, y, side, pils, top, ccol, status=st if pend else "G1_PROXY_ASSUMED", **common)
        perimeter_walls(zid, x, y, top, zd["doors"], cw, windows=wplan, status=st, **common)
        window_objects(zid, x, y, wplan, cwin, status=st if pend else "G1_PROXY_ASSUMED", **common)
        if zd["roof"] == "gable":
            gable(f"{zid}_ROOF_GABLE", x, y, top, cr, system="ROOF_TURRET", **common)
        else:
            box(f"{zid}_ROOF_FLAT_PROXY", x, y, (top, top + T), cr, system="ROOF_TURRET", status=st,
                note="塔頂輪廓預留 +22.00", **common)
            pyramid(f"{zid}_ROOF_SPIRE_PROXY_PENDING", x, y, top + T, P["RIDGE_RISE"], cr, system="ROOF_TURRET",
                    status=st, note="O01 塔樓尖頂意向；高度沿用屋頂上升 6.20，待作者核定", **common)
        # 樓梯
        for s_ in [s for s in STAIRS if s["zone"] == zid]:
            two_flight_stair(f"{s_['id']}_1F", s_["x0"], s_["y0"], coll(f"{base}/RAIL_STAIR"),
                             status="G1_PROXY_ASSUMED", level="1F", source=s_["src"], **common)
        # 挑空柱梁（真挑空：L04、L08）
        for v in voids:
            if "OPENING_VOID" in v["id"]:
                atrium_frame(v["id"].replace("_2F_OPENING_VOID_001", ""), v["x"], v["y"], ccol,
                             ns_only=v.get("rails") == "NS", status="G1_PROXY_ASSUMED", **common)
        if pend:
            # L07：圓形旋梯 proxy（F-107 主樓梯核心、A-101/A-102 圓形旋梯；R02 二樓圖待作者確認）
            spiral_stair("L07_1F_SPIRAL_PROXY_PENDING", 41.0, 91.0, coll(f"{base}/RAIL_STAIR"),
                         status=st, level="1F", **common)

    # 室內隔間牆（G2）
    LV = {"1F": (F1, F2 - T), "2F": (F2, P["EAVE_Z"])}
    for zid, defs in INTERIOR.items():
        cin = coll(f"{ROOT}/{zid}/INTERIOR")
        zone = {z["id"]: z for z in ZONES}[zid]["zone"]
        for i, (lv, ax, c, (a0, a1), drs) in enumerate(defs):
            z0, z1 = LV[lv]; h = P["WALL_INT"] / 2
            holes = [(dc - dw / 2, dc + dw / 2, z0, z0 + dh) for dc, (dw, dh) in drs]
            bm = _plate_bm((a0, a1), (z0, z1), holes, c - h, c + h, MAP_XZ if ax == "y" else MAP_YZ)
            make_obj(f"{zid}_{lv}_WALL_INT_{ax.upper()}{c:+.2f}_{i:02d}", bm, cin, system="CORE_WALL", zone=zone,
                     building=zid, level=lv, doors=len(drs), status="G2_PROXY_ASSUMED", note="室內隔間（依 F 系列拓樸）")
    for (zid, lv, code, name, rx, ry) in ROOMS:   # 房間標記（Empty，不匯出網格）
        e = bpy.data.objects.new(f"ROOM_{zid}_{lv}_{name}", None)
        e.empty_display_type = "PLAIN_AXES"
        e.location = ((rx[0] + rx[1]) / 2, (ry[0] + ry[1]) / 2, LV[lv][0] + 0.05)
        coll(f"{ROOT}/{zid}/INTERIOR").objects.link(e)
        e["code"] = code; e["area_m2"] = round((rx[1] - rx[0]) * (ry[1] - ry[0]), 2)

    # L05 拱廊柱列（兩層）
    c5 = coll(f"{ROOT}/L05_CLOISTER/COLUMN_BEAM")
    for li, (z0, z1) in enumerate(((F1, F2 - T), (F2, P["EAVE_Z"]))):
        bm = bmesh.new()
        for cx_ in L05_COL_X:
            for cy_ in L05_COL_Y:
                h = P["COL"] / 2
                add_prism(bm, [(cx_ - h, cy_ - h), (cx_ + h, cy_ - h), (cx_ + h, cy_ + h), (cx_ - h, cy_ + h)], z0, z1, MAP_XY)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        make_obj(f"L05_CLOISTER_{'1F' if li == 0 else '2F'}_COLUMN_ARCADE", bm, c5, system="COLUMN_BEAM",
                 zone="L05", building="L05_CLOISTER", status="G1_PROXY_ASSUMED", count=len(L05_COL_X) * len(L05_COL_Y),
                 note="E-202 柱列；L05-07 淨寬 6.0 m")

    # L08 2F 內隔間：2C | 2D/2E（X=18）、2D | 2E（Y=122）
    cl8 = coll(f"{ROOT}/L08_LIBRARY/2F")
    ti, te = P["WALL_INT"], P["WALL_EXT"]
    sd = P["DOOR_SINGLE"]
    bm = _plate_bm((118 + te, 138 - te), (F2, P["EAVE_Z"]),
                   [(123 - sd[0] / 2, 123 + sd[0] / 2, F2, F2 + sd[1]), (133 - sd[0] / 2, 133 + sd[0] / 2, F2, F2 + sd[1])],
                   18 - ti / 2, 18 + ti / 2, MAP_YZ)
    make_obj("L08_2F_CORE_WALL_INT_X18", bm, cl8, system="CORE_WALL", zone="L08", level="2F",
             note="2C 與 2D/2E 分隔；門位待 F-208 對照")
    bm = _plate_bm((18 + ti / 2, 30 - te), (F2, P["EAVE_Z"]), [], 128 - ti / 2, 128 + ti / 2, MAP_XZ)
    make_obj("L08_2F_CORE_WALL_INT_Y128", bm, cl8, system="CORE_WALL", zone="L08", level="2F",
             note="2D 研究室(北)/2E 資料室(南) 分隔；依 F-208 R01")
    for nm, bx, by in L08_BANDS:   # 分帶標記：Empty，不產生網格
        e = bpy.data.objects.new(nm, None)
        e.empty_display_type = "CUBE"
        e.location = ((bx[0] + bx[1]) / 2, (by[0] + by[1]) / 2, F2 + 0.05)
        e.scale = ((bx[1] - bx[0]) / 2, (by[1] - by[0]) / 2, 0.05)
        cl8.objects.link(e)
        e["area_m2"] = (bx[1] - bx[0]) * (by[1] - by[0]); e["status"] = STATUS

    # ── 連廊（雙層，樓板與主樓同為 0.00 / +5.40，平屋頂）
    for cd in CONNECTORS:
        cid, x, y = cd["id"], cd["x"], cd["y"]
        c = coll(f"{ROOT}/90_CONNECTORS/{cid}")
        common = dict(zone="CONNECTOR", building=cid)
        box(f"{cid}_1F_SLAB", x, y, (F1 - T, F1), c, system="SLAB", level="1F", **common)
        box(f"{cid}_2F_SLAB", x, y, (F2 - T, F2), c, system="SLAB", level="2F", **common)
        wplan = {}
        for side in cd["walls"]:
            wplan[side], _ = plan_facade(cid, x, y, side, cd.get("doors", []), BOTH)
        perimeter_walls(cid, x, y, P["EAVE_Z"], cd.get("doors", []), c, walls=cd["walls"], windows=wplan, **common)
        window_objects(cid, x, y, wplan, c, status="G1_PROXY_ASSUMED", **common)
        box(f"{cid}_ROOF_FLAT", x, y, (P["EAVE_Z"], P["EAVE_Z"] + T), c, system="ROOF_TURRET", **common)

    # ── 開放空間、校門、地形
    for oa in OPEN_AREAS:
        z = oa["zone"]
        cc = coll(f"{ROOT}/{dict(L01='L01_GATE', L02='L02_FORECOURT', L03='L03_COURTYARD')[z]}")
        box(oa["id"], oa["x"], oa["y"], (-P["PAVING_T"], 0.0), cc, system="PAVING", zone=z)
    cg = coll(f"{ROOT}/L01_GATE")
    for side, xr in (("W", (-6, -4)), ("E", (4, 6))):
        box(f"L01_GATE_PILLAR_{side}_PROXY", xr, (4, 8), (0.0, P["GATE_PILLAR_H"]), cg, system="CORE_WALL", zone="L01",
            status="G0_PROXY_ASSUMED", note="石柱高度未定，依 O01 修形")
    cylinder("L02_FOUNTAIN_PROXY", 0, 30, 5.0, (0.0, 0.6), coll(f"{ROOT}/L02_FORECOURT"), system="WATER", zone="L02",
             status="G0_PROXY_ASSUMED", note="迎賓環形噴泉位置標記；半徑未定")
    cylinder("L03_FOUNTAIN_PROXY", 0, 61, 7.0, (0.0, 0.6), coll(f"{ROOT}/L03_COURTYARD"), system="WATER", zone="L03",
             status="G0_PROXY_ASSUMED", note="中央噴泉位置標記；半徑未定")
    # 地形：工作框減去所有建築/連廊/鋪面足跡（真開孔，不和樓板疊面）
    holes = [(z["x"], z["y"]) for z in ZONES] + [(c["x"], c["y"]) for c in CONNECTORS] + [(o["x"], o["y"]) for o in OPEN_AREAS]
    plate("TERRAIN_SNOW_G0", P["CAMPUS_X"], P["CAMPUS_Y"], holes, (P["TERRAIN_TOP"] - 0.30, P["TERRAIN_TOP"]),
          coll(f"{ROOT}/01_TERRAIN_SNOW"), system="TERRAIN", note="工作框 152×136，非地籍；外圍不規則邊界依 O01 後補")

    # ── 測試相機（手冊 §10.2 巡檢路線；不匯出）
    cams = coll(f"{ROOT}/99_CAMERAS_TEST")
    route = [("CAM_01_L01_to_L02", (0, 2, 1.6), (0, 40, 4)), ("CAM_02_L02_to_L03", (0, 20, 1.6), (0, 70, 3)),
             ("CAM_03_L03_to_L04", (0, 68, 1.6), (0, 82, 3)), ("CAM_04_L04_atrium_up", (0, 86, 1.6), (0, 95, 11)),
             ("CAM_05_L05_cloister", (-36, 60, 1.6), (-36, 99, 1.6)), ("CAM_06_L06_wings", (-55, 30, 6), (55, 52, 4)),
             ("CAM_07_L07_entry", (20, 90, 1.6), (45, 90, 3)), ("CAM_08_L08_atrium_up", (-6, 119, 1.6), (-6, 128, 11))]
    for nm, loc, tgt in route:
        cd = bpy.data.cameras.new(nm); cd.lens = 18
        co = bpy.data.objects.new(nm, cd); co.location = loc
        co.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        cams.objects.link(co)
    furnish()
    return P


# ════════════════════════════════════════════════════════════════
# 5b. G2 家具：共用模組庫（MOD_WOOD_FURNITURE 等）＋依房間類型自動配置
#     同一模組只建一份網格，各擺放物件共用（GLB 內為 mesh 共用）
#     尺寸：計算書 §5.4（書架 0.35/0.90、大桌 1.80×0.90）與房間卡；其餘 G2_PROXY_ASSUMED
# ════════════════════════════════════════════════════════════════
FURN_CLEAR = 0.15        # 計算書 §7：家具與柱牆至少 0.15 m
DOOR_KEEP = 1.30         # 門洞兩側淨空深度
# (x0,x1,y0,y1,z0,z1, 材質)；局部座標：+Y 為「使用者面向」方向
_W, _F, _B, _M, _G, _P = "WOOD", "FABRIC", "BOARD", "METAL", "GLASS", "PLANT"
def _chair(cx, cy, face=+1):
    s = face
    seat = (cx - .22, cx + .22, cy - .20, cy + .20, .42, .47, _F)
    back = (cx - .22, cx + .22, cy - .20 * s - .05 if s > 0 else cy + .20, cy - .20 if s > 0 else cy + .25, .47, .95, _W)
    legs = [(cx - .22, cx - .18, cy - .20, cy + .20, 0, .42, _W), (cx + .18, cx + .22, cy - .20, cy + .20, 0, .42, _W)]
    return [seat, back] + legs
def _table(x0, x1, y0, y1, h=.76, t=.05):
    return [(x0, x1, y0, y1, h - t, h, _W), (x0, x0 + .06, y0, y1, 0, h - t, _W), (x1 - .06, x1, y0, y1, 0, h - t, _W)]
MODULES = {
    # 名稱: (box 清單, 足跡 x0,x1,y0,y1, 說明)
    "DESK_SET_STUDENT": (_table(-.6, .6, .05, .55, .75) + _chair(-.3, -.25) + _chair(.3, -.25), "雙人課桌＋2 椅（L04-01/L06-01 四人一排→兩組）"),
    "DESK_SET_OFFICE": (_table(-.7, .7, .05, .75, .76) + _chair(0, -.25), "辦公／個人閱覽桌 1.40×0.70＋椅"),
    "TEACHER_SET": ([(-1.5, 1.5, -.6, .6, 0, .15, _W), (-.8, .8, -.35, .35, .15, .93, _W)], "講台 3.0×1.2＋講桌"),
    "BLACKBOARD": ([(-2.0, 2.0, 0, .06, .9, 2.1, _B), (-2.05, 2.05, 0, .10, .86, .90, _W)], "黑板 4.0 m（壁掛）"),
    "SHELF_DOUBLE": ([(-1.5, 1.5, -.45, .45, 0, 2.2, _W)], "雙面書架 3.0×0.90×2.2（計算書 §5.4）"),
    "SHELF_WALL": ([(-1.0, 1.0, 0, .35, 0, 2.2, _W)], "靠牆書櫃 2.0×0.35×2.2（計算書 §5.4）"),
    "TABLE_READING": (_table(-2.0, 2.0, -.6, .6, .76) + [c for k in (-1.5, -.5, .5, 1.5) for c in _chair(k, -.85) + _chair(k, .85, -1)],
                      "閱覽長桌 4.0×1.2＋8 椅（L08-02）"),
    "TABLE_LONG": (_table(-.9, .9, -.45, .45, .76) + _chair(-.45, -.70) + _chair(.45, -.70) + _chair(-.45, .70, -1) + _chair(.45, .70, -1),
                   "大桌 1.80×0.90＋4 椅（計算書 §5.4）"),
    "CONF_SET": (_table(-2.5, 2.5, -.8, .8, .76) + [c for k in (-2.0, -1.2, -.4, .4, 1.2, 2.0) for c in _chair(k, -1.05) + _chair(k, 1.05, -1)],
                 "會議長桌 5.0×1.6＋12 椅（L04-11 可容 14 人）"),
    "DISCUSS_SET": (_table(-1.2, 1.2, -.6, .6, .76) + [c for k in (-.75, 0, .75) for c in _chair(k, -.85) + _chair(k, .85, -1)],
                    "討論桌 2.4×1.2＋6 椅（L05-02/L06-07）"),
    "SOFA_SET": ([(-1.1, 1.1, -1.6, -.7, 0, .45, _F), (-1.1, 1.1, -1.6, -1.4, .45, .85, _F),
                  (-.6, .6, -.3, .3, 0, .45, _W),
                  (-1.1, 1.1, .7, 1.6, 0, .45, _F), (-1.1, 1.1, 1.4, 1.6, .45, .85, _F)], "沙發組（L04-12/L05-06）"),
    "BENCH": ([(-.9, .9, 0, .45, .40, .45, _W), (-.9, .9, .40, .45, .45, .85, _W), (-.9, -.85, 0, .40, 0, .40, _W), (.85, .9, 0, .40, 0, .40, _W)],
              "長椅 1.8 m（E-202/L05-08）"),
    "LOCKER": ([(-.5, .5, 0, .5, 0, 1.9, _W)], "學生置物櫃 1.0×0.5×1.9（L06-11）"),
    "DISPLAY": ([(-.75, .75, -.3, .3, 0, .85, _W), (-.72, .72, -.27, .27, .85, 1.25, _G)], "展示櫃 1.5×0.6（L05-06/L07-04）"),
    "COUNTER": ([(-1.8, 1.8, -.4, .4, 0, 1.05, _W)], "接待／借還櫃台 3.6×0.8（L04-02/L08-09/L08-10）"),
    "BED": ([(-.45, .45, -1.0, 1.0, 0, .55, _F)], "休養床（L04-07）"),
    "CABINET": ([(-.4, .4, 0, .6, 0, 2.0, _M)], "設備／檔案櫃"),
}
for _k, (_bx, _nt) in list(MODULES.items()):
    xs = [b[0] for b in _bx] + [b[1] for b in _bx]; ys = [b[2] for b in _bx] + [b[3] for b in _bx]
    MODULES[_k] = (_bx, (min(xs), max(xs), min(ys), max(ys)), _nt)
MOUNTED = {"BLACKBOARD"}

def _mod_mesh(name):
    me = bpy.data.meshes.get(f"MOD_{name}")
    if me:
        return me
    boxes, fp, note = MODULES[name]
    mats = []
    bm = bmesh.new()
    for (x0, x1, y0, y1, z0, z1, mt) in boxes:
        if mt not in mats: mats.append(mt)
        n0 = len(bm.faces)
        add_prism(bm, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z1, MAP_XY)
        bm.faces.ensure_lookup_table()
        for f in bm.faces[n0:]:
            f.material_index = mats.index(mt)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(f"MOD_{name}")
    bm.to_mesh(me); bm.free()
    for mt in mats:
        me.materials.append(MAT[f"F_{mt}"])
    return me

def _rot_fp(fp, rot):
    x0, x1, y0, y1 = fp
    pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    c, s = round(math.cos(math.radians(rot))), round(math.sin(math.radians(rot)))
    rp = [(c * x - s * y, s * x + c * y) for x, y in pts]
    return (min(p[0] for p in rp), max(p[0] for p in rp), min(p[1] for p in rp), max(p[1] for p in rp))

def _ov(a, b, g=0.0):
    return min(a[1], b[1]) - max(a[0], b[0]) > -g + 1e-6 and min(a[3], b[3]) - max(a[2], b[2]) > -g + 1e-6

# ── 房間邊界上的門（內牆＋外牆）
def _all_doors():
    out = []   # (building, level, axis, c, dc, w)
    for zid, defs in INTERIOR.items():
        for (lv, ax, c, span, drs) in defs:
            for dc, (dw, dh) in drs:
                out.append((zid, lv, ax, c, dc, dw))
    for z in ZONES:
        for (s, c, lvs, (dw, dh), _) in z["doors"]:
            a, b_, line, sgn, ax = side_geom(z["x"], z["y"], s)
            for ffl in lvs:
                out.append((z["id"], "1F" if ffl < 1 else "2F", ax, line - sgn * P["WALL_EXT"] / 2, c, dw))
    # L08 2F 自訂內牆門（X=18 牆）
    for yc in (123.0, 133.0):
        out.append(("L08_LIBRARY", "2F", "x", 18.0, yc, P["DOOR_SINGLE"][0]))
    return out

def _keepouts(zid, lv):
    ko = []
    for (z, l, ax, c, dc, dw) in _all_doors():
        if z != zid or l != lv: continue
        ko.append((dc - dw / 2 - .3, dc + dw / 2 + .3, c - DOOR_KEEP, c + DOOR_KEEP) if ax == "y"
                  else (c - DOOR_KEEP, c + DOOR_KEEP, dc - dw / 2 - .3, dc + dw / 2 + .3))
    for st in STAIRS:
        if st["zone"] == zid:
            ko.append((st["x0"] - .4, st["x0"] + 4.6, st["y0"] - 1.8, st["y0"] + 6.4))
    z = {q["id"]: q for q in ZONES}[zid]
    for v in z.get("voids_2F", []):
        (vx, vy) = v["x"], v["y"]
        if lv == "2F":
            ko.append((vx[0] - .5, vx[1] + .5, vy[0] - .5, vy[1] + .5))
        elif "OPENING_VOID" in v["id"]:     # 1F 挑空邊柱列帶
            ko += [(vx[0] - 1.0, vx[1] + 1.0, vy[0] - 1.0, vy[0] + .2), (vx[0] - 1.0, vx[1] + 1.0, vy[1] - .2, vy[1] + 1.0),
                   (vx[0] - 1.0, vx[0] + .2, vy[0], vy[1]), (vx[1] - .2, vx[1] + 1.0, vy[0], vy[1])]
    if zid == "L05_CLOISTER":
        ko += [(cx - .6, cx + .6, cy - .6, cy + .6) for cx in L05_COL_X for cy in L05_COL_Y]
    if zid in ("L06_WEST_A", "L06_EAST_C"):   # 入口廳／樓梯間面向走廊的開口：走廊對應段保持淨空
        sx = -1 if zid == "L06_WEST_A" else 1
        ko.append((min(sx * 40.45, sx * 49.9), max(sx * 40.45, sx * 49.9), 50.0, 55.0))
    return ko

def _room_doors(zid, lv, rx, ry):
    sides = set()
    for (z, l, ax, c, dc, dw) in _all_doors():
        if z != zid or l != lv: continue
        if ax == "y" and rx[0] - .1 <= dc <= rx[1] + .1:
            if abs(c - ry[0]) < .35: sides.add("S")
            if abs(c - ry[1]) < .35: sides.add("N")
        if ax == "x" and ry[0] - .1 <= dc <= ry[1] + .1:
            if abs(c - rx[0]) < .35: sides.add("W")
            if abs(c - rx[1]) < .35: sides.add("E")
    return sides

# ── 各類房間的配置產生器：回傳 [(模組, x, y, 旋轉)]
ROT_FACE = {"N": 0, "S": 180, "E": 270, "W": 90}   # 使用者面向
def _grid(x0, x1, y0, y1, px, py):
    nx, ny = max(1, int((x1 - x0) // px)), max(1, int((y1 - y0) // py))
    ox, oy = x0 + ((x1 - x0) - (nx - 1) * px) / 2, y0 + ((y1 - y0) - (ny - 1) * py) / 2
    return [(ox + i * px, oy + j * py) for j in range(ny) for i in range(nx)]

def gen_classroom(rx, ry, doors):
    front = {"S": "N", "N": "S", "E": "W", "W": "E"}[sorted(doors)[0]] if doors else "N"
    out = []
    cx, cy = (rx[0] + rx[1]) / 2, (ry[0] + ry[1]) / 2
    if front in "NS":
        fy = ry[1] if front == "N" else ry[0]; s = 1 if front == "N" else -1
        out.append(("BLACKBOARD", cx, fy - s * .03, 180 if front == "N" else 0))
        out.append(("TEACHER_SET", cx, fy - s * 1.0, 0))
        y_far = ry[0] + .9 if front == "N" else ry[1] - .9
        y_near = fy - s * 2.4
        for (x, y) in _grid(rx[0] + .8, rx[1] - .8, min(y_far, y_near), max(y_far, y_near), 1.75, 1.30):
            out.append(("DESK_SET_STUDENT", x, y, ROT_FACE[front]))
    else:
        fx = rx[1] if front == "E" else rx[0]; s = 1 if front == "E" else -1
        out.append(("BLACKBOARD", fx - s * .03, cy, 90 if front == "E" else 270))
        out.append(("TEACHER_SET", fx - s * 1.0, cy, 90))
        x_far = rx[0] + .9 if front == "E" else rx[1] - .9
        for (x, y) in _grid(min(x_far, fx - s * 2.4), max(x_far, fx - s * 2.4), ry[0] + .8, ry[1] - .8, 1.30, 1.75):
            out.append(("DESK_SET_STUDENT", x, y, ROT_FACE[front]))
    return out

def gen_wall_shelves(rx, ry, doors, sides="NSEW"):
    out = []
    for sd in sides:
        if sd in doors: continue
        if sd in "NS":
            y = ry[1] - .15 if sd == "N" else ry[0] + .15
            for x in [p[0] for p in _grid(rx[0] + .3, rx[1] - .3, 0, 0, 2.05, 1)]:
                out.append(("SHELF_WALL", x, y, 180 if sd == "N" else 0))
        else:
            x = rx[1] - .15 if sd == "E" else rx[0] + .15
            for y in [p[1] for p in _grid(0, 0, ry[0] + .3, ry[1] - .3, 1, 2.05)]:
                out.append(("SHELF_WALL", x, y, 90 if sd == "E" else 270))
    return out

def gen_stacks(rx, ry, doors, along="y"):
    out = []
    if along == "y":
        for x in [p[0] for p in _grid(rx[0] + 1.6, rx[1] - 1.6, 0, 0, 2.4, 1)]:
            for y in [p[1] for p in _grid(0, 0, ry[0] + 1.6, ry[1] - 1.6, 1, 3.0)]:
                out.append(("SHELF_DOUBLE", x, y, 90))
    else:
        for y in [p[1] for p in _grid(0, 0, ry[0] + 1.6, ry[1] - 1.6, 1, 2.4)]:
            for x in [p[0] for p in _grid(rx[0] + 1.6, rx[1] - 1.6, 0, 0, 3.0, 1)]:
                out.append(("SHELF_DOUBLE", x, y, 0))
    return out

def gen_tables(rx, ry, mod, px, py, rot=0, m=1.0):
    return [(mod, x, y, rot) for (x, y) in _grid(rx[0] + m, rx[1] - m, ry[0] + m, ry[1] - m, px, py)]

def gen_center(rx, ry, mod):
    w, h = rx[1] - rx[0], ry[1] - ry[0]
    return [(mod, (rx[0] + rx[1]) / 2, (ry[0] + ry[1]) / 2, 0 if w >= h else 90)]

def gen_corridor(rx, ry, doors, mod="BENCH", step=4.5):
    out = []
    w, h = rx[1] - rx[0], ry[1] - ry[0]
    if w >= h:
        for x in [p[0] for p in _grid(rx[0] + 1.5, rx[1] - 1.5, 0, 0, step, 1)]:
            out.append((mod, x, ry[1] - .15, 180))
    else:
        for y in [p[1] for p in _grid(0, 0, ry[0] + 1.5, ry[1] - 1.5, 1, step)]:
            out.append((mod, rx[0] + .15, y, 270))
            out.append((mod, rx[1] - .15, y + step / 2, 90))
    return out

def plan_room(zid, lv, code, name, rx, ry):
    d = _room_doors(zid, lv, rx, ry)
    n = name
    if "廁所" in n or any(k in n for k in ("樓梯廳", "樓梯間", "樓梯／")) or "挑空" in n or zid == "L07_STAIR_TOWER":
        return []
    if "教室" in n:
        return gen_classroom(rx, ry, d)
    if "書庫" in n:
        return gen_stacks(rx, ry, d, "y")
    if "書架區" in n:
        return gen_stacks((rx[0], rx[1]), (ry[0], ry[1]), d, "y") + [("COUNTER", (rx[0] + rx[1]) / 2, ry[0] + 1.6, 0)]
    if "閱覽大廳" in n:
        return gen_tables(rx, ry, "TABLE_READING", 4.4, 6.0, 90, 2.2)
    if "個人閱覽" in n:
        return [("COUNTER", rx[1] - 4.0, ry[0] + 1.6, 0)] + gen_tables(rx, ry, "DESK_SET_OFFICE", 2.2, 2.2, 0, 1.6)
    if "大廳" in n:   # L04 1F
        return [("COUNTER", (rx[0] + rx[1]) / 2, ry[0] + 3.2, 180)] + gen_corridor(rx, (ry[0] + 4.5, ry[0] + 14), d)
    if ("置物" in n and "西翼" in n) or "置物櫃" in n:
        return gen_corridor(rx, ry, d, "LOCKER", 1.6)
    if any(k in n for k in ("走廊", "長廊", "入口廳", "展廊", "主走道")):
        return gen_corridor(rx, ry, d)
    if "小組閱覽" in n:
        return gen_tables(rx, ry, "DISCUSS_SET", 3.4, 2.8, 0, 1.6)
    if "會議" in n:
        return gen_center(rx, ry, "CONF_SET") + gen_wall_shelves(rx, ry, d, "EW")
    if "討論" in n:
        return gen_center(rx, ry, "DISCUSS_SET") + gen_wall_shelves(rx, ry, d, "N")
    if any(k in n for k in ("休息", "休憩", "等候", "座席")):
        return gen_tables(rx, ry, "SOFA_SET", 3.8, 4.2, 0, 1.8)
    if "健康" in n:
        return [("BED", x, (ry[0] + ry[1]) / 2, 0) for x in (rx[0] + 1.2, rx[0] + 2.6, rx[0] + 4.0)] + \
               [("DESK_SET_OFFICE", rx[1] - 2.0, (ry[0] + ry[1]) / 2, 0)] + gen_wall_shelves(rx, ry, d, "N")
    if "設備" in n:
        return [("CABINET", x, ry[1] - .15 - .6, 0) for x in [p[0] for p in _grid(rx[0] + .5, rx[1] - .5, 0, 0, 1.0, 1)]]
    if any(k in n for k in ("檔案", "典藏", "儲藏", "教材", "教具", "資料室")):
        return gen_stacks(rx, ry, d, "x" if rx[1] - rx[0] >= ry[1] - ry[0] else "y") + gen_wall_shelves(rx, ry, d, "EW")
    if "展示" in n:
        return gen_tables(rx, ry, "DISPLAY", 2.6, 2.4, 0, 1.4)
    if any(k in n for k in ("研究", "諮詢")):
        return gen_tables(rx, ry, "DESK_SET_OFFICE", 2.4, 2.4, 0, 1.8) + gen_wall_shelves(rx, ry, d, "EW")
    if any(k in n for k in ("自習", "辦公", "備課", "自習角")):
        return gen_tables(rx, ry, "DESK_SET_OFFICE", 2.0, 2.0, 0, 1.4) + gen_wall_shelves(rx, ry, d, "EW")
    return []

FURN_LOG = []
def furnish():
    for k, c in {"WOOD": (0.30, 0.18, 0.10), "FABRIC": (0.16, 0.24, 0.48), "BOARD": (0.10, 0.17, 0.15),
                 "METAL": (0.35, 0.36, 0.38), "GLASS": (0.70, 0.82, 0.88), "PLANT": (0.20, 0.40, 0.22)}.items():
        m = bpy.data.materials.new(f"MAT_F_{k}"); m.diffuse_color = (*c, 1.0); m.use_nodes = True
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        if bsdf: bsdf.inputs["Base Color"].default_value = (*c, 1.0); bsdf.inputs["Roughness"].default_value = .7
        MAT[f"F_{k}"] = m
    placed = {}   # (zid, lv) -> [fp]
    seen_rect = []
    for (zid, lv, code, name, rx, ry) in ROOMS:
        key = (zid, lv)
        placed.setdefault(key, [])
        ko = _keepouts(zid, lv)
        inner = (rx[0] + FURN_CLEAR, rx[1] - FURN_CLEAR, ry[0] + FURN_CLEAR, ry[1] - FURN_CLEAR)
        ok_n = rej = 0
        cfur = coll(f"{ROOT}/{zid}/FURNITURE")
        for (mod, x, y, rot) in plan_room(zid, lv, code, name, rx, ry):
            f = _rot_fp(MODULES[mod][1], rot); fp = (x + f[0], x + f[1], y + f[2], y + f[3])
            lim = (rx[0] + .02, rx[1] - .02, ry[0] + .02, ry[1] - .02) if mod in MOUNTED else inner
            if not (fp[0] >= lim[0] - 1e-6 and fp[1] <= lim[1] + 1e-6 and fp[2] >= lim[2] - 1e-6 and fp[3] <= lim[3] + 1e-6):
                rej += 1; continue
            if mod not in MOUNTED and any(_ov(fp, k) for k in ko):
                rej += 1; continue
            if any(_ov(fp, q, 0.05) for q in placed[key]):
                rej += 1; continue
            placed[key].append(fp)
            ob = bpy.data.objects.new(f"FURN_{zid}_{lv}_{mod}_{len(placed[key]):03d}", _mod_mesh(mod))
            ob.location = (x, y, (F1 if lv == "1F" else F2))
            ob.rotation_euler = (0, 0, math.radians(rot))
            cfur.objects.link(ob)
            ob["status"] = "G2_PROXY_ASSUMED"; ob["grade"] = "G2"; ob["system"] = "FURNITURE"; ob["module"] = mod
            ob["zone"] = {q["id"]: q for q in ZONES}[zid]["zone"]; ob["building"] = zid; ob["level"] = lv
            ob["room"] = name; ob["source"] = MODULES[mod][2]; ob["mounted"] = mod in MOUNTED
            ok_n += 1
        FURN_LOG.append(dict(building=zid, level=lv, code=code, room=name, placed=ok_n, rejected=rej))

# ════════════════════════════════════════════════════════════════
# 6. 匯出
# ════════════════════════════════════════════════════════════════
NO_EXPORT = ("00_REFERENCE", "99_CAMERAS_TEST")

def export_glb(path, collection_names=None):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in bpy.context.scene.objects:
        if ob.type != "MESH":
            continue
        names = [c.name for c in ob.users_collection]
        if any(n in NO_EXPORT for n in names):
            continue
        if collection_names:
            chain = set()
            for c in ob.users_collection:
                for k, v in COLL.items():
                    if v == c:
                        chain.update(k.split("/"))
            if not chain & set(collection_names):
                continue
        ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_extras=True,
                              export_yup=True, export_apply=False, export_cameras=False, export_lights=False)
    return path

def main(out_dir):
    build()
    os.makedirs(out_dir, exist_ok=True)
    tag = "R03_G2F_20261027"
    d_src = os.path.join(out_dir, "01_working_source"); os.makedirs(d_src, exist_ok=True)
    d_bld = os.path.join(out_dir, "02_building_glb"); os.makedirs(d_bld, exist_ok=True)
    d_mst = os.path.join(out_dir, "03_master_glb"); os.makedirs(d_mst, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(d_src, f"LAHUDI_MASTER_{tag}_working.blend"))
    export_glb(os.path.join(d_mst, f"LAHUDI_MASTER_{tag}.glb"))
    for zid in ["L04_MAIN", "L05_CLOISTER", "L05_ANNEX", "L06_WEST_A", "L06_EAST_C", "L07_STAIR_TOWER", "L08_LIBRARY"]:
        export_glb(os.path.join(d_bld, f"LAHUDI_{zid}_{tag}.glb"), [zid])
    export_glb(os.path.join(d_bld, f"LAHUDI_CONNECTORS_{tag}.glb"), ["90_CONNECTORS"])
    export_glb(os.path.join(d_bld, f"LAHUDI_SITE_L01_L02_L03_{tag}.glb"),
               ["L01_GATE", "L02_FORECOURT", "L03_COURTYARD", "01_TERRAIN_SNOW"])
    with open(os.path.join(d_src, "furniture_log.json"), "w", encoding="utf-8") as f:
        json.dump(FURN_LOG, f, ensure_ascii=False, indent=1)
    with open(os.path.join(d_src, "rooms.json"), "w", encoding="utf-8") as f:
        json.dump([dict(building=z, level=l, code=c, name=n, x=list(x), y=list(y), area_m2=round((x[1] - x[0]) * (y[1] - y[0]), 2))
                   for (z, l, c, n, x, y) in ROOMS], f, ensure_ascii=False, indent=1)
    with open(os.path.join(d_src, "params_used.json"), "w", encoding="utf-8") as f:
        json.dump(dict(P=P, ZONES=ZONES, CONNECTORS=CONNECTORS, OPEN_AREAS=OPEN_AREAS), f, ensure_ascii=False, indent=1, default=str)
    print("DONE", out_dir)

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    out = argv[argv.index("--out") + 1] if "--out" in argv else None
    if out is None:
        # 在 Blender 介面直接執行：只建場景，不匯出
        if bpy.data.filepath or bpy.app.background is False:
            build()
        else:
            main(os.path.join(os.getcwd(), "LAHUDI_ACADEMY"))
    else:
        main(out)
