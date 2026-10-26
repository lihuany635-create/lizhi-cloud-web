"""Minimal dependency-free GLB writer for HADES v3.0 (numpy only).

Scene authored in plan millimetres: X east, Y north, Z up, origin = 1F SW exterior corner.
Exported to glTF metres, Y-up, house centred on origin: x=(X-4500)/1000, y=Z/1000, z=-(Y-4000)/1000.
"""
import json, struct, math
import numpy as np

OX, OY = 4500.0, 4000.0


def to_gltf(p):
    p = np.asarray(p, dtype=float)
    return np.stack([(p[..., 0] - OX) / 1000.0, p[..., 2] / 1000.0, -(p[..., 1] - OY) / 1000.0], axis=-1)


def srgb(h):
    h = h.lstrip('#')
    return [round((int(h[i:i + 2], 16) / 255.0) ** 2.2, 4) for i in (0, 2, 4)]


# ---------- primitive generators (plan mm, returns (verts, faces)) ----------
def box(x0, x1, y0, y1, z0, z1):
    x0, x1 = sorted((x0, x1)); y0, y1 = sorted((y0, y1)); z0, z1 = sorted((z0, z1))
    v = np.array([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
                  [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], float)
    f = np.array([[0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4],
                  [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]])
    return v, f


def prism(poly, z0, z1):
    """Vertical extrusion of a convex/simple CCW polygon (list of (x,y))."""
    poly = np.asarray(poly, float); n = len(poly)
    v = np.vstack([np.c_[poly, np.full(n, z0)], np.c_[poly, np.full(n, z1)]])
    f = []
    for i in range(1, n - 1):
        f.append([0, i + 1, i]); f.append([n, n + i, n + i + 1])
    for i in range(n):
        j = (i + 1) % n
        f.append([i, j, n + j]); f.append([i, n + j, n + i])
    return v, np.array(f)


def hull_x(profile_yz, x0, x1):
    """Extrude a CCW polygon given in (Y,Z) along X."""
    p = np.asarray(profile_yz, float); n = len(p)
    v = np.vstack([np.c_[np.full(n, x0), p], np.c_[np.full(n, x1), p]])
    f = []
    for i in range(1, n - 1):
        f.append([0, i, i + 1]); f.append([n, n + i + 1, n + i])
    for i in range(n):
        j = (i + 1) % n
        f.append([i, n + j, j]); f.append([i, n + i, n + j])
    return v, np.array(f)[:, ::-1]


def cyl(cx, cy, z0, z1, r, seg=20):
    poly = [(cx + r * math.cos(2 * math.pi * k / seg), cy + r * math.sin(2 * math.pi * k / seg)) for k in range(seg)]
    return prism(poly, z0, z1)


def cyl_axis(a, b, r, seg=12):
    """Cylinder between two 3D points (plan mm)."""
    a = np.asarray(a, float); b = np.asarray(b, float); d = b - a; L = np.linalg.norm(d); d /= L
    t = np.array([1, 0, 0]) if abs(d[0]) < .9 else np.array([0, 1, 0])
    u = np.cross(d, t); u /= np.linalg.norm(u); w = np.cross(d, u)
    ring = [u * math.cos(2 * math.pi * k / seg) * r + w * math.sin(2 * math.pi * k / seg) * r for k in range(seg)]
    v = np.array([a + q for q in ring] + [b + q for q in ring] + [a, b])
    f = []
    for i in range(seg):
        j = (i + 1) % seg
        f += [[i, j, seg + j], [i, seg + j, seg + i], [2 * seg, j, i], [2 * seg + 1, seg + i, seg + j]]
    return v, np.array(f)


def sphere(cx, cy, cz, rx, ry, rz, seg=10, rings=6):
    v = []; f = []
    for i in range(rings + 1):
        th = math.pi * i / rings
        for k in range(seg):
            ph = 2 * math.pi * k / seg
            v.append([cx + rx * math.sin(th) * math.cos(ph), cy + ry * math.sin(th) * math.sin(ph), cz + rz * math.cos(th)])
    for i in range(rings):
        for k in range(seg):
            a = i * seg + k; b = i * seg + (k + 1) % seg; c = (i + 1) * seg + k; d = (i + 1) * seg + (k + 1) % seg
            f += [[a, c, b], [b, c, d]]
    return np.array(v), np.array(f)


def transform(geom, rot_deg=0, about=(0, 0), move=(0, 0, 0)):
    v, f = geom; v = v.copy(); a = math.radians(rot_deg); c, s = math.cos(a), math.sin(a)
    x = v[:, 0] - about[0]; y = v[:, 1] - about[1]
    v[:, 0] = about[0] + c * x - s * y; v[:, 1] = about[1] + s * x + c * y
    v += np.asarray(move, float)
    return v, f


# ---------- scene graph ----------
class Node:
    def __init__(self, name, extras=None):
        self.name = name; self.children = []; self.parts = []; self.extras = extras; self.camera = None; self.light = None
        self.translation = None; self.rotation = None

    def group(self, name, extras=None):
        n = Node(name, extras); self.children.append(n); return n

    def obj(self, name, extras=None):
        return self.group(name, extras)

    def add(self, geom, mat):
        self.parts.append((geom, mat)); return self


class Writer:
    def __init__(self):
        self.mats = {}; self.mat_list = []

    def material(self, name, hexcol, rough=0.75, metal=0.0, alpha=None, emissive=None):
        col = srgb(hexcol) + [1.0 if alpha is None else alpha]
        m = {'name': name, 'pbrMetallicRoughness': {'baseColorFactor': col, 'metallicFactor': metal, 'roughnessFactor': rough}, 'doubleSided': True}
        if alpha is not None: m['alphaMode'] = 'BLEND'
        if emissive: m['emissiveFactor'] = srgb(emissive)
        self.mats[name] = len(self.mat_list); self.mat_list.append(m); return name

    def build(self, root, path, asset_extras):
        g = {'asset': {'version': '2.0', 'generator': 'lizhi hades v3.0 glb_writer'}, 'scene': 0, 'scenes': [{'name': root.name, 'nodes': []}],
             'nodes': [], 'meshes': [], 'materials': self.mat_list, 'accessors': [], 'bufferViews': [], 'buffers': [{'byteLength': 0}],
             'extras': asset_extras}
        cams = []; lights = []
        binbuf = bytearray()
        stats = {'tris': 0, 'mesh_nodes': 0}

        def acc(arr, typ, ct, target):
            nonlocal binbuf
            pad = (-len(binbuf)) % 4; binbuf += b'\0' * pad
            bv = {'buffer': 0, 'byteOffset': len(binbuf), 'byteLength': arr.nbytes, 'target': target}
            g['bufferViews'].append(bv); binbuf += arr.tobytes()
            a = {'bufferView': len(g['bufferViews']) - 1, 'componentType': ct, 'count': len(arr), 'type': typ}
            if typ == 'VEC3': a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
            g['accessors'].append(a); return len(g['accessors']) - 1

        def mesh_of(node):
            bymat = {}
            for (v, f), m in node.parts:
                bymat.setdefault(m, []).append((v, f))
            prims = []
            for m, lst in bymat.items():
                P = []; N = []
                for v, f in lst:
                    gv = to_gltf(v); tri = gv[f]
                    n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]); L = np.linalg.norm(n, axis=1)
                    ok = L > 1e-12; tri = tri[ok]; n = n[ok] / L[ok][:, None]
                    P.append(tri.reshape(-1, 3)); N.append(np.repeat(n, 3, axis=0))
                P = np.concatenate(P).astype('<f4'); N = np.concatenate(N).astype('<f4')
                stats['tris'] += len(P) // 3
                prims.append({'attributes': {'POSITION': acc(P, 'VEC3', 5126, 34962), 'NORMAL': acc(N, 'VEC3', 5126, 34962)}, 'material': self.mats[m], 'mode': 4})
            g['meshes'].append({'name': node.name, 'primitives': prims}); return len(g['meshes']) - 1

        def walk(node):
            d = {'name': node.name}
            if node.extras: d['extras'] = node.extras
            if node.parts: d['mesh'] = mesh_of(node); stats['mesh_nodes'] += 1
            if node.translation is not None: d['translation'] = node.translation
            if node.rotation is not None: d['rotation'] = node.rotation
            if node.camera:
                cams.append(node.camera); d['camera'] = len(cams) - 1
            if node.light:
                lights.append(node.light); d['extensions'] = {'KHR_lights_punctual': {'light': len(lights) - 1}}
            idx = len(g['nodes']); g['nodes'].append(d)
            kids = [walk(c) for c in node.children]
            if kids: g['nodes'][idx]['children'] = kids
            return idx

        g['scenes'][0]['nodes'].append(walk(root))
        if cams: g['cameras'] = cams
        if lights:
            g['extensionsUsed'] = ['KHR_lights_punctual']; g['extensions'] = {'KHR_lights_punctual': {'lights': lights}}
        g['buffers'][0]['byteLength'] = len(binbuf)
        j = json.dumps(g, ensure_ascii=False, separators=(',', ':')).encode(); j += b' ' * ((-len(j)) % 4)
        b = bytes(binbuf) + b'\0' * ((-len(binbuf)) % 4)
        data = struct.pack('<4sII', b'glTF', 2, 28 + len(j) + len(b)) + struct.pack('<I4s', len(j), b'JSON') + j + struct.pack('<I4s', len(b), b'BIN\0') + b
        open(path, 'wb').write(data)
        stats['bytes'] = len(data); stats['nodes'] = len(g['nodes']); stats['materials'] = len(self.mat_list)
        return stats


def look_at_quat(eye, target):
    """glTF camera looks down -Z. eye/target in plan mm -> quaternion in glTF space."""
    e = to_gltf(eye); t = to_gltf(target); fwd = t - e; fwd /= np.linalg.norm(fwd)
    up = np.array([0, 1.0, 0]); right = np.cross(fwd, up); right /= np.linalg.norm(right); up2 = np.cross(right, fwd)
    m = np.array([right, up2, -fwd]).T  # columns = local x,y,z
    tr = m[0, 0] + m[1, 1] + m[2, 2]
    if tr > 0:
        s = math.sqrt(tr + 1) * 2; w = .25 * s; x = (m[2, 1] - m[1, 2]) / s; y = (m[0, 2] - m[2, 0]) / s; z = (m[1, 0] - m[0, 1]) / s
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = math.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2; w = (m[2, 1] - m[1, 2]) / s; x = .25 * s; y = (m[0, 1] + m[1, 0]) / s; z = (m[0, 2] + m[2, 0]) / s
    elif m[1, 1] > m[2, 2]:
        s = math.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2; w = (m[0, 2] - m[2, 0]) / s; x = (m[0, 1] + m[1, 0]) / s; y = .25 * s; z = (m[1, 2] + m[2, 1]) / s
    else:
        s = math.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2; w = (m[1, 0] - m[0, 1]) / s; x = (m[0, 2] + m[2, 0]) / s; y = (m[1, 2] + m[2, 1]) / s; z = .25 * s
    return [float(x), float(y), float(z), float(w)], e.tolist()
