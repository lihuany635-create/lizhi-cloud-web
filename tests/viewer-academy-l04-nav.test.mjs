import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeNav,findPath,STEP_UP} from '../supabase/functions/lizhi-viewer-cloud/nav.mjs';

test('academy L04 stairs connect to main hall using the canonical R09 grid', async () => {
 const doc = JSON.parse(readFileSync('model-viewer/nav/lahudi-academy.nav.json','utf8'));
 assert.equal(STEP_UP, doc.step_up_m, 'runtime threshold and grid builder must agree');
 const nav = await decodeNav(doc);
 const start = [0.125,0.35,-75.875];
 for (const z of [-77,-78,-84,-91]) {
  const result = findPath(nav, start, [0,NaN,z]);
  assert.equal(result.ok, true, 'L04 target z=' + z + ': ' + (result.code ?? 'unknown'));
  assert(result.path.some(p => p[1] >= 0.66), 'path must ascend the first sampled entrance step');
  assert(Math.abs(result.path.at(-1)[2]-z) < 0.5, 'target cell reached');
 }
});
