#!/usr/bin/env python3
"""Build a walkable floor grid ("nav grid") from a canonical viewer GLB.

Output is in VIEWER coordinates (the same numbers the GitHub Pages viewer and
the cloud avatar state use): glTF world space shifted up by -minY so the lowest
vertex sits on y=0 (see model-viewer/index.html openModel()).

For every XZ cell we keep up to LEVELS walkable floor heights. A floor height
h is walkable when a floor-like triangle (normal.y > 0.55, same rule as the
viewer's pickFloor) covers the cell centre and no geometry occupies the body
band (h + STEP_UP, h + BODY_TOP] over that cell.

This is static geometry screening, not a physics engine or visual check.
Usage: python3 build_nav_grid.py <model.glb> <out.nav.json> [cell_m]
"""
import base64, hashlib, json, math, struct, sys, zlib
import numpy as np

LEVELS = 4          # max stacked floors per cell
STEP_UP = 0.35      # stair risers / thresholds that do not block the body
BODY_TOP = 1.80     # head clearance checked above the floor
NONE = -32768       # empty level marker (int16, centimetres)

COMP = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NCOMP = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def read_glb(path):
    raw = open(path, "rb").read()
    magic, ver, length = struct.unpack("<III", raw[:12])
    assert magic == 0x46546C67 and ver == 2 and length == len(raw), "not a GLB v2"
    jlen = struct.unpack("<I", raw[12:16])[0]
    gltf = json.loads(raw[20:20 + jlen])
    off = 20 + jlen
    blen, btype = struct.unpack("<II", raw[off:off + 8])
    assert btype == 0x004E4942, "missing BIN chunk"
    return raw, gltf, raw[off + 8:off + 8 + blen]


def accessor(gltf, binbuf, idx):
    acc = gltf["accessors"][idx]
    view = gltf["bufferViews"][acc["bufferView"]]
    dt = np.dtype(COMP[acc["componentType"]])
    n = NCOMP[acc["type"]]
    start = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
    stride = view.get("byteStride", 0) or dt.itemsize * n
    count = acc["count"]
    if stride == dt.itemsize * n:
        arr = np.frombuffer(binbuf, dt, count * n, start).reshape(count, n)
    else:
        arr = np.lib.stride_tricks.as_strided(
            np.frombuffer(binbuf, np.uint8, stride * (count - 1) + dt.itemsize * n, start).view(dt),
            (count, n), (stride, dt.itemsize))
    arr = arr.astype(np.float64)
    if acc.get("normalized"):
        arr /= float(np.iinfo(dt).max)
    return arr


def node_matrix(node):
    if "matrix" in node:
        return np.array(node["matrix"], dtype=np.float64).reshape(4, 4).T
    t = np.array(node.get("translation", [0, 0, 0]), dtype=np.float64)
    x, y, z, w = node.get("rotation", [0, 0, 0, 1])
    s = np.array(node.get("scale", [1, 1, 1]), dtype=np.float64)
    r = np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    m = np.eye(4)
    m[:3, :3] = r * s
    m[:3, 3] = t
    return m


def world_triangles(gltf, binbuf):
    tris = []
    scene = gltf["scenes"][gltf.get("scene", 0)]
    stack = [(i, np.eye(4)) for i in scene["nodes"]]
    while stack:
        i, parent = stack.pop()
        node = gltf["nodes"][i]
        m = parent @ node_matrix(node)
        if "mesh" in node:
            for prim in gltf["meshes"][node["mesh"]]["primitives"]:
                if prim.get("mode", 4) != 4 or "POSITION" not in prim["attributes"]:
                    continue
                pos = accessor(gltf, binbuf, prim["attributes"]["POSITION"])
                pos = pos @ m[:3, :3].T + m[:3, 3]
                if "indices" in prim:
                    idx = accessor(gltf, binbuf, prim["indices"]).astype(np.int64).ravel()
                else:
                    idx = np.arange(len(pos))
                idx = idx[: len(idx) // 3 * 3].reshape(-1, 3)
                t = pos[idx]
                if np.linalg.det(m[:3, :3]) < 0:  # mirrored node flips winding, as three.js does
                    t = t[:, [0, 2, 1]]
                tris.append(t)
        for c in node.get("children", []):
            stack.append((c, m))
    return np.concatenate(tris) if tris else np.zeros((0, 3, 3))


def sample_triangles(tris, spacing):
    """Dense points on every triangle (vertical walls included) at <= spacing."""
    a, b, c = tris[:, 0], tris[:, 1], tris[:, 2]
    e = np.maximum(np.linalg.norm(b - a, axis=1), np.linalg.norm(c - a, axis=1))
    e = np.maximum(e, np.linalg.norm(c - b, axis=1))
    steps = np.clip(np.ceil(e / spacing).astype(np.int64), 1, 400)
    out = []
    for n in np.unique(steps):
        sel = steps == n
        i, j = np.meshgrid(np.arange(n + 1), np.arange(n + 1), indexing="ij")
        keep = i + j <= n
        u = (i[keep] / n)[None, :, None]
        v = (j[keep] / n)[None, :, None]
        aa, bb, cc = a[sel][:, None], b[sel][:, None], c[sel][:, None]
        out.append((aa + (bb - aa) * u + (cc - aa) * v).reshape(-1, 3))
    return np.concatenate(out)


def chunks_by_points(tris, spacing, budget=4_000_000):
    a, b, c = tris[:, 0], tris[:, 1], tris[:, 2]
    e = np.maximum.reduce([np.linalg.norm(b - a, axis=1), np.linalg.norm(c - a, axis=1), np.linalg.norm(c - b, axis=1)])
    n = np.clip(np.ceil(e / spacing), 1, 400)
    cost = np.cumsum((n + 1) * (n + 2) / 2)
    start = 0
    while start < len(tris):
        limit = (cost[start - 1] if start else 0) + budget
        end = max(start + 1, int(np.searchsorted(cost, limit, "right")))
        yield tris[start:end]
        start = end


def build(path, cell=0.25):
    raw, gltf, binbuf = read_glb(path)
    tris = world_triangles(gltf, binbuf)
    y_off = -tris[:, :, 1].min()
    tris = tris.copy()
    tris[:, :, 1] += y_off  # viewer coordinates

    mn = tris.reshape(-1, 3).min(0)
    mx = tris.reshape(-1, 3).max(0)
    x0, z0 = math.floor(mn[0] / cell) * cell, math.floor(mn[2] / cell) * cell
    nx = int(math.ceil((mx[0] - x0) / cell)) + 1
    nz = int(math.ceil((mx[2] - z0) / cell)) + 1

    nrm = np.cross(tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0])
    ln = np.linalg.norm(nrm, axis=1)
    ok = ln > 1e-12
    tris, nrm = tris[ok], nrm[ok] / ln[ok, None]

    # 1) floor heights at cell centres (exact barycentric hit, like a downward ray)
    fc, fh = [], []
    for t in tris[nrm[:, 1] > 0.55]:
        xs, zs = t[:, 0], t[:, 2]
        i0 = max(0, int(math.ceil((xs.min() - x0) / cell - 0.5)))
        i1 = min(nx - 1, int(math.floor((xs.max() - x0) / cell - 0.5)))
        k0 = max(0, int(math.ceil((zs.min() - z0) / cell - 0.5)))
        k1 = min(nz - 1, int(math.floor((zs.max() - z0) / cell - 0.5)))
        if i1 < i0 or k1 < k0:
            continue
        ii, kk = np.meshgrid(np.arange(i0, i1 + 1), np.arange(k0, k1 + 1), indexing="ij")
        px = x0 + (ii.ravel() + 0.5) * cell
        pz = z0 + (kk.ravel() + 0.5) * cell
        (ax, ay, az), (bx, by, bz), (cx, cy, cz) = t
        d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz)
        if abs(d) < 1e-12:
            continue
        w1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / d
        w2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / d
        w3 = 1 - w1 - w2
        inside = (w1 >= -1e-6) & (w2 >= -1e-6) & (w3 >= -1e-6)
        h = w1 * ay + w2 * by + w3 * cy
        fc.append((ii.ravel()[inside] * nz + kk.ravel()[inside]).astype(np.int64))
        fh.append(np.round(h[inside] * 100).astype(np.int64))

    # 2) occupancy: every surface sampled densely, bucketed per cell and 5 cm band
    keys = []
    for part in chunks_by_points(tris, cell / 2):  # bounded memory on large scenes
        pts = sample_triangles(part, cell / 2)
        ci = np.clip(((pts[:, 0] - x0) / cell).astype(np.int64), 0, nx - 1)
        ck = np.clip(((pts[:, 2] - z0) / cell).astype(np.int64), 0, nz - 1)
        yb = np.round(pts[:, 1] / 0.05).astype(np.int64)
        keys.append(np.unique((ci * nz + ck) * 100000 + yb))
        del pts, ci, ck, yb
    key = np.unique(np.concatenate(keys))

    # 3) vectorised walkability: floor (c, h_cm) is kept when no band lies in (h+STEP_UP, h+BODY_TOP]
    grid = np.full((nx * nz, LEVELS), NONE, dtype=np.int16)
    walk_cells = 0
    if fc:
        c = np.concatenate(fc); hcm = np.concatenate(fh)
        u = np.unique(c * 100000 + (hcm + 50000))           # dedupe, sorted by cell then height
        c, hcm = u // 100000, u % 100000 - 50000
        # drop a surface within 5 cm under the next higher surface of the same cell (coplanar overlap)
        nxt_same = np.r_[c[1:] == c[:-1], False]
        gap = np.r_[hcm[1:] - hcm[:-1], 10**6]
        keep = ~(nxt_same & (gap <= 5))
        c, hcm = c[keep], hcm[keep]
        h = hcm / 100.0
        lo = np.floor((h + STEP_UP) / 0.05 + 1e-9).astype(np.int64) + 1
        hi = np.floor((h + BODY_TOP) / 0.05 + 1e-9).astype(np.int64)
        base = c * 100000
        blocked = np.searchsorted(key, base + hi, "right") - np.searchsorted(key, base + lo, "left") > 0
        c, hcm = c[~blocked], hcm[~blocked]
        first = np.r_[True, c[1:] != c[:-1]]                # rank within cell, lowest floor first
        start = np.maximum.accumulate(np.where(first, np.arange(len(c)), 0))
        rank = np.arange(len(c)) - start
        ok = rank < LEVELS
        grid[c[ok], rank[ok]] = hcm[ok].astype(np.int16)
        walk_cells = int(first.sum())

    sha = hashlib.sha256(raw).hexdigest()
    return {
        "format": "lizhi-nav/1",
        "model_sha": sha,
        "coordinate_system": "viewer meters, +Y up; viewer_y = gltf_y + y_offset",
        "y_offset": round(float(y_off), 6),
        "cell_m": cell,
        "origin_xz": [round(x0, 6), round(z0, 6)],
        "nx": nx, "nz": nz, "levels": LEVELS,
        "step_up_m": STEP_UP, "body_top_m": BODY_TOP,
        "empty": NONE,
        "walkable_cells": walk_cells,
        "encoding": "base64(zlib(int16 little-endian)), index=(ix*nz+iz)*levels+level, centimetres",
        "limitations": "static triangle sampling; no doors opening, no dynamic objects, no visual verification",
        "data": base64.b64encode(zlib.compress(grid.astype("<i2").tobytes(), 9)).decode(),
    }


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    cell = float(sys.argv[3]) if len(sys.argv) > 3 else 0.25
    out = build(src, cell)
    out["model"] = src.split("/")[-1]
    with open(dst, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(dst, out["nx"], "x", out["nz"], "cells, walkable", out["walkable_cells"])
