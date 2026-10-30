// Cross-floor routes on the real lahudi-academy nav grid (R09). Regression for the
// 2026-10-30 patrol: at a stair foot the same cell holds the 1F floor and the first
// tread, and the pathfinder used to keep only the nearest level, so no stair could be climbed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeNav, findPath, walkSegment} from '../supabase/functions/lizhi-viewer-cloud/nav.mjs';
const nav = await decodeNav(JSON.parse(readFileSync('model-viewer/nav/lahudi-academy.nav.json', 'utf8')));
const F1 = 2.2, F2 = 7.6;   // viewer y of 1F / 2F (glTF +2.2)
// [name, start, goal, stair box {x:[a,b], north:[a,b]} the route must climb]
const ROUTES = [
  ['L04 1F hall -> L04 2F', [0, F1, -95], [-10, F2, -90], {x: [-24, 24], north: [88, 112]}],
  ['L08 1F -> L08 2F east stacks', [0.125, F1, -128.875], [22, F2, -127], {x: [-30, 30], north: [118, 130]}],
  ['L08 1F -> L08 2F west stacks', [0.125, F1, -128.875], [-20, F2, -127], {x: [-30, 30], north: [118, 130]}],
  ['L06 west -> L05 2F', [-55, F1, -52], [-31.875, F2, -89.875], null],
  ['L07 1F -> L07 2F (spiral)', [36, F1, -84], [46, F2, -97], {x: [37, 45], north: [86, 97]}],
];
for (const [name, s, g, box] of ROUTES) {
  test(`walk_to ${name}`, () => {
    const p = findPath(nav, s, g, 3000000);
    assert.equal(p.ok, true, p.code);
    const end = p.path.at(-1);
    assert(Math.abs(end[1] - F2) < 0.05, 'ends on 2F: ' + end);
    const climb = p.path.filter(q => q[1] > F1 + 0.1 && q[1] < F2 - 0.1);
    assert(climb.length >= 10, 'passes stair treads');
    if (box) assert(climb.every(q => q[0] >= box.x[0] && q[0] <= box.x[1] && -q[2] >= box.north[0] && -q[2] <= box.north[1]), 'climbs the expected stair');
    // the same route replayed as straight [x,y,z] waypoints (viewer_walk_path) also reaches 2F
    let cur = p.path[0];
    for (const w of p.path.slice(1)) { const seg = walkSegment(nav, cur, w[0], w[2], w[1]); assert.equal(seg.blocked, null, JSON.stringify(seg.blocked)); cur = seg.position; }
    assert(Math.abs(cur[1] - F2) < 0.05);
  });
}
test('same-floor walk past a stair foot stays on the floor', () => {
  const seg = walkSegment(nav, [0, F1, -95], 0, -100);
  assert.equal(seg.position[1], F1);
});
