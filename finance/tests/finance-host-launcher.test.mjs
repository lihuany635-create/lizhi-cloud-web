import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const Launcher=require('../remote/finance-ai-host-launcher.js');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('HOST-LAUNCH-01 Windows desktop may open the registered Host protocol',()=>{
  const calls=[];
  const result=Launcher.launch({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',platform:'Win32',navigate:url=>calls.push(url)});
  assert.equal(result.launched,true);
  assert.deepEqual(calls,['lizhi-finance-ai://start']);
});

test('HOST-LAUNCH-02 mobile never pretends to launch another computer',()=>{
  const calls=[];
  const result=Launcher.launch({userAgent:'Mozilla/5.0 (Linux; Android 15; Mobile)',platform:'Linux armv8l',navigate:url=>calls.push(url)});
  assert.equal(result.launched,false);
  assert.equal(result.reason,'mobile_device');
  assert.deepEqual(calls,[]);
});

test('HOST-LAUNCH-03 installer registers only a custom protocol and current-user startup',()=>{
  const script=read('scripts/install-finance-ai-host-integration.ps1');
  assert.match(script,/HKCU:\\Software\\Classes/);
  assert.match(script,/URL Protocol/);
  assert.match(script,/GetFolderPath\('Startup'\)/);
  assert.doesNotMatch(script,/HKLM|service-role|cloudflared|tunnel/i);
});

test('HOST-LAUNCH-04 production loads launcher before Finance home',()=>{
  const index=read('index.html');
  assert.ok(index.indexOf('finance-ai-host-launcher.js?v=1')<index.indexOf('finance/pages/home.js?v=67'));
  assert.match(read('sw.js'),/finance\/remote\/finance-ai-host-launcher\.js\?v=1/);
});

test('HOST-LAUNCH-05 mobile guidance is explicit and Gateway stays loopback-only',()=>{
  const home=read('finance/pages/home.js'),gateway=read('finance/gateway/gateway-config.mjs');
  assert.match(home,/手機網頁無法直接啟動家中電腦/);
  assert.match(gateway,/127\.0\.0\.1/);
  assert.doesNotMatch(gateway,/host.*0\.0\.0\.0/i);
});
