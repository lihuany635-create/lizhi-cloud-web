// Static walkable-floor grid for cloud avatar movement (format lizhi-nav/1).
// Built offline by model-viewer/nav/build_nav_grid.py from the canonical GLB,
// in viewer coordinates. Static screening only: no doors, no dynamic objects,
// no rendered/visual verification.
export const STEP_UP = 0.25;   // max climb between samples/cells (stair risers ~0.19 m, thresholds); beds and sofas block
export const MAX_DROP = 0.6;   // larger drops are ledges: stop instead of falling
const SAMPLE = 0.1;

export async function decodeNav(doc) {
  if (doc?.format !== 'lizhi-nav/1') throw Error('NAV_GRID_INVALID');
  const bin = Uint8Array.from(atob(doc.data), c => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate'));
  const buf = await new Response(stream).arrayBuffer();
  const expected = doc.nx * doc.nz * doc.levels * 2;
  if (buf.byteLength !== expected) throw Error('NAV_GRID_INVALID');
  return {
    sha: doc.model_sha, cell: doc.cell_m, x0: doc.origin_xz[0], z0: doc.origin_xz[1],
    nx: doc.nx, nz: doc.nz, L: doc.levels, empty: doc.empty,
    data: new Int16Array(buf),
  };
}

export function cellOf(nav, x, z) {
  const ix = Math.floor((x - nav.x0) / nav.cell), iz = Math.floor((z - nav.z0) / nav.cell);
  if (ix < 0 || iz < 0 || ix >= nav.nx || iz >= nav.nz) return -1;
  return ix * nav.nz + iz;
}

export function levelsAtCell(nav, c) {
  const out = [];
  if (c < 0) return out;
  for (let l = 0; l < nav.L; l++) {
    const v = nav.data[c * nav.L + l];
    if (v !== nav.empty) out.push(v / 100);
  }
  return out;
}
export const levelsAt = (nav, x, z) => levelsAtCell(nav, cellOf(nav, x, z));

// Pick the walkable floor nearest to y at (x,z). Used for create/teleport.
export function snap(nav, [x, y, z], maxDist = 1.5) {
  const ls = levelsAt(nav, x, z);
  if (!ls.length) return { ok: false, code: 'NO_WALKABLE_SURFACE', near: nearestWalkable(nav, x, z, y) };
  let best = ls[0];
  for (const h of ls) if (Math.abs(h - y) < Math.abs(best - y)) best = h;
  if (Math.abs(best - y) > maxDist) return { ok: false, code: 'NO_WALKABLE_SURFACE_AT_HEIGHT', levels_here: ls };
  return { ok: true, position: [x, best, z] };
}

function nextLevel(ls, cur) {
  let best = null;
  for (const h of ls) {
    if (h - cur > STEP_UP + 1e-6 || cur - h > MAX_DROP + 1e-6) continue;
    if (best === null || Math.abs(h - cur) < Math.abs(best - cur)) best = h;
  }
  return best;
}

// Walk in a straight line on the floor, climbing stairs, stopping at walls/ledges.
export function walkSegment(nav, from, toX, toZ) {
  let [x, y, z] = from;
  const dx = toX - x, dz = toZ - z, dist = Math.hypot(dx, dz);
  const n = Math.max(1, Math.ceil(dist / SAMPLE));
  let travelled = 0;
  for (let i = 1; i <= n; i++) {
    const nx = from[0] + dx * i / n, nz = from[2] + dz * i / n;
    const h = nextLevel(levelsAt(nav, nx, nz), y);
    if (h === null) {
      const ls = levelsAt(nav, nx, nz);
      const reason = !ls.length ? 'WALL_OR_NO_FLOOR' : ls.some(v => v - y > STEP_UP) ? 'STEP_TOO_HIGH' : 'LEDGE_DROP';
      return { position: [x, y, z], travelled, blocked: { reason, at: [round(nx), round(y), round(nz)] } };
    }
    travelled += Math.hypot(nx - x, nz - z);
    x = nx; z = nz; y = h;
  }
  return { position: [x, y, z], travelled, blocked: null };
}

export function nearestWalkable(nav, x, z, y = 0, radius = 3) {
  const c0 = cellOf(nav, x, z);
  const ix0 = Math.floor((x - nav.x0) / nav.cell), iz0 = Math.floor((z - nav.z0) / nav.cell);
  const r = Math.ceil(radius / nav.cell);
  let best = null, bd = Infinity;
  for (let ix = ix0 - r; ix <= ix0 + r; ix++) for (let iz = iz0 - r; iz <= iz0 + r; iz++) {
    if (ix < 0 || iz < 0 || ix >= nav.nx || iz >= nav.nz) continue;
    for (const h of levelsAtCell(nav, ix * nav.nz + iz)) {
      const px = nav.x0 + (ix + .5) * nav.cell, pz = nav.z0 + (iz + .5) * nav.cell;
      const d = Math.hypot(px - x, pz - z) + Math.abs(h - y);
      if (d < bd) { bd = d; best = [round(px), round(h), round(pz)]; }
    }
  }
  void c0;
  return best;
}

// A* over (cell, level) nodes. goalY optional: when omitted any floor at the goal cell counts.
export function findPath(nav, start, goal, maxExpand = 400000) {
  const s = snap(nav, start, 1.0);
  if (!s.ok) return { ok: false, code: 'START_NOT_ON_WALKABLE_FLOOR', near: nearestWalkable(nav, start[0], start[2], start[1]) };
  const gc = cellOf(nav, goal[0], goal[2]);
  const gls = levelsAtCell(nav, gc);
  if (!gls.length) return { ok: false, code: 'GOAL_NOT_WALKABLE', near: nearestWalkable(nav, goal[0], goal[2], goal[1] ?? s.position[1]) };
  const goalY = Number.isFinite(goal[1]) ? goal[1] : null;
  const isGoal = (c, h) => c === gc && (goalY === null || Math.abs(h - goalY) <= 1.0);
  const { nz, L, cell } = nav;
  const key = (c, l) => c * L + l;
  const levelIndex = (c, h) => { for (let l = 0; l < L; l++) if (nav.data[c * L + l] === Math.round(h * 100)) return l; return -1; };
  const sc = cellOf(nav, s.position[0], s.position[2]);
  const sl = levelIndex(sc, s.position[1]);
  const gx = Math.floor(gc / nz), gz = gc % nz;
  const hfun = c => Math.hypot(Math.floor(c / nz) - gx, c % nz - gz) * cell;
  const heap = new MinHeap();
  const g = new Map(), prev = new Map();
  const k0 = key(sc, sl);
  g.set(k0, 0); heap.push(hfun(sc), k0);
  let expanded = 0, found = -1;
  const passable = (c, h) => { const ls = levelsAtCell(nav, c); return nextLevel(ls, h) !== null; };
  while (heap.size) {
    const [, k] = heap.pop();
    const c = Math.floor(k / L), l = k % L, h = nav.data[k] / 100;
    if (isGoal(c, h)) { found = k; break; }
    if (++expanded > maxExpand) return { ok: false, code: 'PATH_SEARCH_LIMIT' };
    const ix = Math.floor(c / nz), iz = c % nz, gk = g.get(k);
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const jx = ix + dx, jz = iz + dz;
      if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nz) continue;
      const nc = jx * nz + jz;
      if (dx && dz && (!passable(ix * nz + jz, h) || !passable(jx * nz + iz, h))) continue;
      const nh = nextLevel(levelsAtCell(nav, nc), h);
      if (nh === null) continue;
      const nk = key(nc, levelIndex(nc, nh));
      const cost = gk + Math.hypot(dx, dz) * cell + Math.abs(nh - h) * 0.5;
      if (cost < (g.get(nk) ?? Infinity)) { g.set(nk, cost); prev.set(nk, k); heap.push(cost + hfun(nc), nk); }
    }
    void l;
  }
  if (found < 0) return { ok: false, code: 'NO_PATH' };
  const pts = [];
  for (let k = found; k !== undefined; k = prev.get(k)) {
    const c = Math.floor(k / L);
    pts.push([nav.x0 + (Math.floor(c / nz) + .5) * cell, nav.data[k] / 100, nav.z0 + (c % nz + .5) * cell]);
  }
  pts.reverse();
  pts[0] = s.position.slice();
  return { ok: true, path: simplify(pts).map(p => p.map(round)), length_m: round(g.get(found)) };
}

// Drop intermediate points on straight flat runs; keep height changes (stairs).
function simplify(pts) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const cross = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    if (Math.abs(cross) > 1e-6 || Math.abs(b[1] - a[1]) > 0.01 || Math.abs(c[1] - b[1]) > 0.01) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const round = n => Math.round(n * 1000) / 1000;

class MinHeap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(p, v) {
    const k = this.k, vv = this.v; let i = k.length; k.push(p); vv.push(v);
    while (i > 0) { const j = (i - 1) >> 1; if (k[j] <= p) break; k[i] = k[j]; vv[i] = vv[j]; i = j; }
    k[i] = p; vv[i] = v;
  }
  pop() {
    const k = this.k, vv = this.v, top = [k[0], vv[0]], lp = k.pop(), lv = vv.pop();
    if (k.length) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1; if (c >= k.length) break;
        if (c + 1 < k.length && k[c + 1] < k[c]) c++;
        if (k[c] >= lp) break;
        k[i] = k[c]; vv[i] = vv[c]; i = c;
      }
      k[i] = lp; vv[i] = lv;
    }
    return top;
  }
}
