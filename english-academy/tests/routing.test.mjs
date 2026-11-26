import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const files = await Promise.all([
 'auth.js', 'app.js', 'workspace-ui.js',
 'english-academy/preview/index.html'
].map(x=>readFile(new URL('../../'+x,import.meta.url),'utf8')));
const [auth,app,workspace,preview]=files;

test('route permitted by main cloud auth redirect allowlist',()=>{
 assert.match(auth,/allowedRoutes = new Set\([^\n]*"english"/);
});
test('main route navigation links to English candidate without removing study',()=>{
 assert.match(app,/OPEN_ROUTES=\[[^\n]*"english"/);
 assert.match(app,/\["study","✎","立之讀書室"\]/);
 assert.match(app,/\["english","英","英文學習教室 · 體驗版"\]/);
});
test('released static experience stays mounted in the existing workspace router',()=>{
 assert.match(app,/function renderEnglish\(\)/);
 assert.match(app,/english-academy\/experience\//);
 assert.doesNotMatch(app,/src="\.\/english-academy\/preview\//);
 assert.match(workspace,/state\.route === 'english'/);
 assert.match(workspace,/renderEnglish\(\)/);
});
test('cloud main app still executes existing authenticated login gate',()=>{
 assert.match(app,/if\(IS_CLOUD_SITE&&window\.LizhiAuth&&!await window\.LizhiAuth\.requireUser\(\)\)return/);
});
test('candidate preview does not embed production Supabase scripts',()=>{
 assert.doesNotMatch(preview,/supabase-config|service.role|api.key|production/i);
 assert.match(preview,/script type="module" src="\.\/app.mjs"/);
});
