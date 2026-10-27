# -*- coding: utf-8 -*-
"""由建模參數直接畫分棟平面圖（牆、門洞、窗、樓梯、挑空、房名）
python3 lahudi_plan_draw.py <build_script.py> <zone_id> <out_dir>   （不需 Blender）"""
import sys, os, types, importlib.util, math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon
from matplotlib import font_manager as fm

script, zid, out = sys.argv[1:4]
# 用假 bpy 載入建模腳本，只取資料
for m in ("bpy", "bmesh", "mathutils"):
    sys.modules[m] = types.ModuleType(m)
sys.modules["mathutils"].Vector = lambda *a: a
spec = importlib.util.spec_from_file_location("b", script)
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
P = b.P
for f in fm.findSystemFonts():
    if "NotoSansCJK" in f.replace(" ", "") and ("Regular" in f or "-Regular" in f or f.endswith(".ttc")):
        fm.fontManager.addfont(f)
plt.rcParams["font.family"] = ["Noto Sans CJK TC", "Noto Sans CJK JP", "sans-serif"]

Z = {z["id"]: z for z in b.ZONES}[zid]
x, y = Z["x"], Z["y"]
TE, TI = P["WALL_EXT"], P["WALL_INT"]
os.makedirs(out, exist_ok=True)
INK, WALL, ROOM, VOID, STAIR, DOOR, WIN = "#1d2738", "#2b3a55", "#f4f1ea", "#bcd3ee", "#c99a5b", "#b48a3c", "#5b86c7"

for lv, ffl in (("1F", P["FFL_1"]), ("2F", P["FFL_2"])):
    fig, ax = plt.subplots(figsize=(14, 14 * (y[1] - y[0] + 10) / (x[1] - x[0] + 10)))
    ax.set_aspect("equal"); ax.axis("off")
    ax.add_patch(Rectangle((x[0], y[0]), x[1] - x[0], y[1] - y[0], fc=ROOM, ec="none"))
    # 房間
    for (zz, l2, code, name, rx, ry) in b.ROOMS:
        if zz != zid or l2 != lv: continue
        area = (rx[1] - rx[0]) * (ry[1] - ry[0])
        ax.text((rx[0] + rx[1]) / 2, (ry[0] + ry[1]) / 2, f"{name}\n{code}  {area:.0f} m²", ha="center", va="center",
                fontsize=8.5, color=INK, linespacing=1.3)
    # 挑空、梯井
    if lv == "2F":
        for v in Z.get("voids_2F", []):
            fc = VOID if "VOID" in v["id"] else "none"
            ax.add_patch(Rectangle((v["x"][0], v["y"][0]), v["x"][1] - v["x"][0], v["y"][1] - v["y"][0],
                                   fc=fc, ec=VOID, lw=1.2, ls="--", hatch="xx" if fc != "none" else None, alpha=.7))
    for st in [s for s in b.STAIRS if s["zone"] == zid]:
        W = P["STAIR_WIDTH"]; run = (P["STAIR_RISERS_PER_FLIGHT"] - 1) * P["STAIR_TREAD"]
        for xx in (st["x0"], st["x0"] + W + 0.2):
            ax.add_patch(Rectangle((xx, st["y0"]), W, run, fc="none", ec=STAIR, lw=1))
            for k in range(1, 14):
                ax.plot([xx, xx + W], [st["y0"] + k * 0.3] * 2, color=STAIR, lw=.5)
        ax.add_patch(Rectangle((st["x0"], st["y0"] + run), 2 * W + 0.2, P["STAIR_LANDING"], fc="none", ec=STAIR, lw=1))
        ax.annotate("", xy=(st["x0"] + W / 2, st["y0"] + run - .3), xytext=(st["x0"] + W / 2, st["y0"] + .3),
                    arrowprops=dict(arrowstyle="->", color=STAIR, lw=1.2))
        ax.text(st["x0"] + W / 2, st["y0"] - .5, "上", ha="center", va="top", fontsize=8, color=STAIR)
    # 外牆（含門窗洞）
    stubs = {s: [p for (bb, s_, p) in b.INTERIOR_WALL_STUBS if bb == zid and s_ == s] for s in "SNWE"}
    for side in "SNWE":
        wins, _ = b.plan_facade(zid, x, y, side, Z["doors"], b.BOTH, stubs[side])
        a, bb, line, sgn, axis = b.side_geom(x, y, side)
        cuts = [(c - P["WIN_W"] / 2, c + P["WIN_W"] / 2, "w") for c, s_ in wins if abs(s_ - ffl - P["WIN_SILL"]) < 1e-6]
        cuts += [(c - dw / 2, c + dw / 2, "d") for (s, c, lvs, (dw, dh), _) in Z["doors"] if s == side and ffl in lvs]
        cuts.sort()
        segs, cur = [], a
        for c0, c1, k in cuts:
            segs.append((cur, c0)); cur = c1
        segs.append((cur, bb))
        t0 = line if sgn > 0 else line
        for s0, s1 in segs:
            if axis == "y":
                ax.add_patch(Rectangle((s0, line - TE if sgn > 0 else line), s1 - s0, TE, fc=WALL, ec="none"))
            else:
                ax.add_patch(Rectangle((line - TE if sgn > 0 else line, s0), TE, s1 - s0, fc=WALL, ec="none"))
        for c0, c1, k in cuts:
            col = WIN if k == "w" else DOOR
            if axis == "y":
                ax.plot([c0, c1], [line - sgn * TE / 2] * 2, color=col, lw=2.2 if k == "w" else 3)
            else:
                ax.plot([line - sgn * TE / 2] * 2, [c0, c1], color=col, lw=2.2 if k == "w" else 3)
    # 內牆
    for (l2, axis, c, (a0, a1), drs) in b.INTERIOR.get(zid, []):
        if l2 != lv: continue
        cuts = sorted([(dc - dw / 2, dc + dw / 2) for dc, (dw, dh) in drs])
        cur = a0
        for c0, c1 in cuts + [(a1, a1)]:
            if c0 > cur:
                if axis == "y":
                    ax.add_patch(Rectangle((cur, c - TI / 2), c0 - cur, TI, fc=WALL, ec="none"))
                else:
                    ax.add_patch(Rectangle((c - TI / 2, cur), TI, c0 - cur, fc=WALL, ec="none"))
            cur = max(cur, c1)
        for c0, c1 in cuts:
            if axis == "y":
                ax.plot([c0, c1], [c, c], color=DOOR, lw=1.5, ls=":")
            else:
                ax.plot([c, c], [c0, c1], color=DOOR, lw=1.5, ls=":")
    # 尺寸與方位
    ax.annotate("", xy=(x[1], y[0] - 3), xytext=(x[0], y[0] - 3), arrowprops=dict(arrowstyle="<->", color=INK, lw=.8))
    ax.text((x[0] + x[1]) / 2, y[0] - 3.6, f"{x[1] - x[0]:.2f} m", ha="center", va="top", fontsize=9, color=INK)
    ax.annotate("", xy=(x[0] - 3, y[1]), xytext=(x[0] - 3, y[0]), arrowprops=dict(arrowstyle="<->", color=INK, lw=.8))
    ax.text(x[0] - 3.6, (y[0] + y[1]) / 2, f"{y[1] - y[0]:.2f} m", ha="right", va="center", fontsize=9, color=INK, rotation=90)
    ax.annotate("N", xy=(x[1] + 3, y[1]), xytext=(x[1] + 3, y[1] - 4), ha="center", fontsize=11, color=INK,
                arrowprops=dict(arrowstyle="-|>", color=INK))
    ax.set_xlim(x[0] - 6, x[1] + 5); ax.set_ylim(y[0] - 6, y[1] + 3)
    ax.set_title(f"《現實遊戲》拉乎迪學院｜{Z['zone']} {Z['name']}｜{lv} 平面（FFL {ffl:+.2f}）｜MODEL_ASSUMED／G2_PROXY_ASSUMED",
                 fontsize=11, color=INK, loc="left")
    fig.savefig(os.path.join(out, f"PLAN_{zid}_{lv}.png"), dpi=130, bbox_inches="tight", facecolor="white")
    plt.close(fig)
print("PLAN DONE")
