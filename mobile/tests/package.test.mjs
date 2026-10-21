import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
const root = new URL('../../',import.meta.url), asset=p=>new URL('dist-mobile/'+p,root);
test('Packaged main page has every local stylesheet/script and a bundled auth SDK',async()=>{
  const html=await readFile(asset('index.html'),'utf8');
  assert.match(html,/mobile\/native.js/);assert.doesNotMatch(html,/cdn.jsdelivr.net\/npm\/@supabase/);
  for(const match of html.matchAll(/(?:src|href)="\.\/([^"?]+)(?:\?[^"]*)?"/g)) await access(asset(match[1]));
  assert.match(await readFile(asset('mobile/native.js'),'utf8'),/exchangeCodeForSession/);
});
test('Android loads bundled assets without remote navigation or cleartext exceptions',async()=>{
  const config=JSON.parse(await readFile(new URL('capacitor.config.json',root),'utf8'));
  assert.equal(config.webDir,'dist-mobile');assert.equal(config.server.androidScheme,'https');assert.equal(config.server.cleartext,false);assert.equal(config.server.url,undefined);assert.equal(config.server.allowNavigation,undefined);
  for(const path of ['finance/pages/home.js','engineering/engineering.js','licut/index.html','image-graph/index.html','a4-editor/index.html','model-viewer/index.html'])await access(asset(path));
});
test('Package excludes server code and local credentials',async()=>{
  for(const path of ['.env','package.json','server.mjs','supabase','finance/gateway','finance/tests','engineering/tests'])await assert.rejects(access(asset(path)),path);
});
test('Native manifest matches the strict authentication callback',async()=>{
  const manifest=await readFile(new URL('android/app/src/main/AndroidManifest.xml',root),'utf8');
  assert.match(manifest,/android:scheme="lizhi-cloud" android:host="auth" android:path="\/callback"/);
  assert.match(manifest,/android:usesCleartextTraffic="false"/);
});
