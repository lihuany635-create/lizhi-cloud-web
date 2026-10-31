import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeNav, findPath, walkSegment, STEP_UP, MAX_DROP, levelsAt } from '../supabase/functions/lizhi-viewer-cloud/nav.mjs';

// The canonical private-R09-compatible grid is committed in the repo.
// This tests only a *static floor grid*, not GLB collision or real building safety.
const doc = JSON.parse(readFileSync('model-viewer/nav/lahudi-academy.nav.json', 'utf8'));
const nav = await decodeNav(doc);
assert.equal(STEP_UP, doc.step_up_m, 'runtime and builder thresholds must match');

const stairs = [
  ['L08 southwest', [-28.125,2.2,-120.625], [-26.125,7.6,-120.625]],
  ['L08 southeast', [26.125,2.2,-120.625], [28.125,7.6,-120.625]],
  ['L06 west', [-48.5,2.2,-53.125], [-46.125,7.6,-53.625]],
  ['L06 east', [48.5,2.2,-53.125], [46.125,7.6,-53.625]],
  ['L07 spiral', [43.125,2.2,-92.375], [43.125,7.6,-86.125]],
];

for (const [label, ground, top] of stairs) {
  test(`${label}: uphill and downhill path preserve configured static step limits`, () => {
    for (const [direction, a, b] of [['up', ground, top], ['down', top, ground]]) {
      const path = findPath(nav, a, b);
      assert.equal(path.ok, true, `${label} ${direction}: ${path.code}`);
      assert(path.path.length >= 3);
      assert(Math.abs(path.path.at(-1)[1] - b[1]) < 0.01);
      for (let i = 1; i < path.path.length; i++) {
        const dy = path.path[i][1] - path.path[i-1][1];
        assert(dy <= STEP_UP + 1e-5, `${label} ${direction}: climb ${dy}`);
        assert(-dy <= MAX_DROP + 1e-5, `${label} ${direction}: drop ${-dy}`);
      }
    }
  });
}

test('overlapping stair cell keeps the low floor and the first safe tread', () => {
  const h = levelsAt(nav, -28.125, -121.125);
  assert(h.some(v => Math.abs(v-2.20) < 0.01));
  assert(h.some(v => Math.abs(v-2.38) < 0.01));
});

test('3D waypoints guide the 0.18m stair tread; 2D retains safe legacy behavior', () => {
  const from = [-28.125,2.2,-120.625];
  const withHeight = walkSegment(nav, from, -28.125, -121.625, 2.74);
  assert.equal(withHeight.blocked, null, JSON.stringify(withHeight.blocked));
  assert(Math.abs(withHeight.position[1] - 2.74) < 0.01);
  const withoutHeight = walkSegment(nav, from, -28.125, -121.625);
  assert.equal(withoutHeight.blocked?.reason, 'STEP_TOO_HIGH');
});

test('L08 atrium void has no second-floor walkable surface at its center', () => {
  const heights = levelsAt(nav, -6.125, -128.125);
  assert(heights.length > 0, 'first floor remains represented');
  assert(!heights.some(h => Math.abs(h - 7.6) <= 0.35), 'atrium must not have a floor near 2F height');
});

test('L08 1F furniture tops are not valid explicit floor-level destinations', () => {
  const from = [-5.125, 2.2, -134.125];
  for (const [label, target] of [
    ['archive shelf', [-25.125,2.2,-134.125]],
    ['group reading furniture', [13.125,2.2,-134.125]]
  ]) {
    const levels = levelsAt(nav, target[0], target[2]);
    assert(!levels.some(h => Math.abs(h - 2.2) <= 0.05), label);
    const blocked = findPath(nav, from, target);
    assert.equal(blocked.ok, false, label);
    assert.equal(blocked.code, 'GOAL_HEIGHT_NOT_WALKABLE', label);
  }
  for (const [label, target] of [
    ['archive aisle', [-23.125,2.2,-132.125]],
    ['group reading aisle', [16.125,2.2,-134.125]]
  ]) {
    const result = findPath(nav, from, target);
    assert.equal(result.ok, true, label + ': ' + result.code);
    assert(Math.abs(result.path.at(-1)[1]-2.2) <= 0.05, label);
  }
});
