import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// This tests the existing main-site English route, not a synthetic Site/MCP.
// A candidate API must never replace the currently usable classroom before
// the production backup, auth, persistence and rollback gates are complete.
const app = await readFile(new URL('../../../app.js', import.meta.url), 'utf8');

test('Stage 1 defaults to the existing non-persistent English experience', () => {
  assert.match(app, /const ENGLISH_WEB_LIVE_ENABLED = false;/);
  assert.match(app, /if\(!ENGLISH_WEB_LIVE_ENABLED\)return/);
  assert.match(app, /english-academy\/experience\/\?v=1/);
  assert.match(app, /七種練習題型與入門測驗；目前為不儲存資料的體驗版/);
});

test('Future cloud route exists but cannot be enabled by user URL parameters', () => {
  assert.match(app, /english-academy\/live\//);
  assert.doesNotMatch(app, /ENGLISH_WEB_LIVE_ENABLED\s*=\s*.*(?:location|queryParams|localStorage|searchParams)/);
});
