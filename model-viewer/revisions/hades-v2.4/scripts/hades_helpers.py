from glbkit import GLB
import numpy as np, pathlib, json, math, hashlib, copy

def extra(asset, reason='design v2.1', major=False):
    return {'asset_id': asset, 'revision': 'v2.3-recovery-20261022', 'status': 'CANDIDATE', 'author_approval': 'PENDING', 'major_architecture': major, 'source': reason}

def common(g):
    return {'paper': g.mat('RG_paper', [0.81, 0.79, 0.7]), 'blue': g.mat('RG_inkblue', [0.045, 0.085, 0.13]), 'white': g.mat('RG_ceramic', [0.78, 0.77, 0.71], rough=0.35), 'dark': g.mat('RG_rubber', [0.035, 0.04, 0.045]), 'wood': g.mat('RG_oak', [0.24, 0.14, 0.075]), 'metal': g.mat('RG_steel', [0.28, 0.31, 0.32], 0.65, 0.3), 'towel': g.mat('RG_linen', [0.36, 0.43, 0.48]), 'yellow': g.mat('RG_warning', [0.72, 0.48, 0.045]), 'wall': g.mat('RG_interior_plaster', [0.68, 0.66, 0.59]), 'floor': g.mat('RG_floor', [0.31, 0.3, 0.27]), 'green': g.mat('RG_board', [0.045, 0.09, 0.075]), 'burgundy': g.mat('RG_LA_accent', [0.18, 0.04, 0.065])}

def box(g, id, c, s, mat, major=False):
    return g.box(id, c, s, mat, extra(id.split('__')[0], major=major))

def torus(g, id, c, r, tube, mat):
    import trimesh
    t = trimesh.creation.torus(major_radius=r, minor_radius=tube, major_sections=24, minor_sections=8)
    return g.add_geom(id, t.vertices[:, [0, 2, 1]] + np.array(c), t.faces[:, ::-1], mat, extra(id.split('__')[0]))

def bowl(g, id, c, r, mat):
    v = []
    f = []
    profile = [(0, 0.002), (r * 0.55, 0.002), (r * 0.83, 0.025), (r, 0.065), (r * 0.91, 0.065), (r * 0.74, 0.026), (r * 0.48, 0.012), (0, 0.012)]
    for rr, y in profile:
        for k in range(24):
            a = 2 * math.pi * k / 24
            v.append([c[0] + rr * math.cos(a), c[1] + y, c[2] + rr * math.sin(a)])
    for i in range(len(profile) - 1):
        for k in range(24):
            a = i * 24 + k
            b = i * 24 + (k + 1) % 24
            d = (i + 1) * 24 + k
            e = (i + 1) * 24 + (k + 1) % 24
            f.extend([[a, b, e], [a, e, d]])
    return g.add_geom(id, v, f, mat, extra(id.split('__')[0]))

def mug(g, id, c, mat):
    bowl(g, id, c, 0.044, mat)
    torus(g, id + '__rim', [c[0], c[1] + 0.065, c[2]], 0.041, 0.003, mat)

def book(g, id, c, s, mat, paper):
    box(g, id + '__pages', c, s, paper)
    s = np.array(s)
    s[0] += 0.008
    s[2] += 0.008
    s[1] = 0.003
    for sign in [-1, 1]:
        box(g, id + '__cover' + str(sign), [c[0], c[1] + sign * (float(s[1]) / 2 + 0.012), c[2]], s, mat)

def desk(g, id, x, y, z, mat, metal):
    box(g, id + '__top', [x, y + 0.74, z], [0.68, 0.035, 0.5], mat)
    for dx in [-0.27, 0.27]:
        for dz in [-0.18, 0.18]:
            box(g, id + '__leg', [x + dx, y + 0.36, z + dz], [0.03, 0.72, 0.03], metal)
    box(g, id + '__chair', [x, y + 0.44, z + 0.57], [0.4, 0.04, 0.4], mat)
    box(g, id + '__back', [x, y + 0.7, z + 0.75], [0.4, 0.48, 0.035], mat)
    for dx in [-0.16, 0.16]:
        for dz in [0.41, 0.72]:
            box(g, id + '__chairleg', [x + dx, y + 0.21, z + dz], [0.025, 0.42, 0.025], metal)

def table(g, id, x, y, z, sx, sz, mat):
    box(g, id + '__top', [x, y + 0.75, z], [sx, 0.05, sz], mat)
    for dx in [-sx / 2 + 0.08, sx / 2 - 0.08]:
        for dz in [-sz / 2 + 0.08, sz / 2 - 0.08]:
            box(g, id + '__leg', [x + dx, y + 0.36, z + dz], [0.06, 0.72, 0.06], mat)

def rail(g, id, a, b, mat):
    a = np.array(a)
    b = np.array(b)
    d = b - a
    length = np.linalg.norm(d)
    import trimesh
    t = trimesh.creation.cylinder(radius=0.025, height=length, sections=10)
    T = trimesh.geometry.align_vectors([0, 0, 1], d / length)
    v = t.vertices @ T[:3, :3].T + (a + b) / 2
    g.add_geom(id, v, t.faces, mat, extra(id.split('__')[0]))

def light(g, id, pos, intensity=120, color=[1, 0.88, 0.72]):
    g.g.setdefault('extensionsUsed', [])
    if 'KHR_lights_punctual' not in g.g['extensionsUsed']:
        g.g['extensionsUsed'].append('KHR_lights_punctual')
    lights = g.g.setdefault('extensions', {}).setdefault('KHR_lights_punctual', {}).setdefault('lights', [])
    li = len(lights)
    lights.append({'name': id, 'type': 'point', 'color': color, 'intensity': intensity, 'range': 18})
    ni = len(g.g['nodes'])
    g.g['nodes'].append({'name': id, 'translation': pos, 'extensions': {'KHR_lights_punctual': {'light': li}}, 'extras': extra(id)})
    g.g['scenes'][g.g.get('scene', 0)]['nodes'].append(ni)
import trimesh