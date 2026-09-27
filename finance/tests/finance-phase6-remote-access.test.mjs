import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const Connector=require('../ai/finance-ai-gateway-connector.js');
const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(dirname,'../..');

test('P6-T01 connector accepts a controlled remote HTTPS base URL',()=>{
  const value=Connector.normalizeSettings({baseUrl:'https://finance-ai.example.com/',timeout:30000});
  assert.equal(value.baseUrl,'https://finance-ai.example.com');
  assert.equal(value.provider,'finance-gateway');
});

test('P6-T02 connector rejects remote HTTP but keeps loopback HTTP',()=>{
  assert.throws(()=>Connector.normalizeSettings({baseUrl:'http://finance-ai.example.com'}),error=>error.code==='UNSAFE_BASE_URL');
  assert.equal(Connector.normalizeSettings({baseUrl:'http://127.0.0.1:4181'}).baseUrl,'http://127.0.0.1:4181');
});

test('P6-T03 Gateway configuration remains loopback-only',()=>{
  const source=fs.readFileSync(path.join(root,'finance/gateway/gateway-config.mjs'),'utf8');
  assert.match(source,/host!=="127\.0\.0\.1"/);
  assert.match(source,/must bind to 127\.0\.0\.1/);
  assert.doesNotMatch(source,/FINANCE_GATEWAY_HOST\|\|"0\.0\.0\.0"/);
});

test('P6-T04 Quick Tunnel script exposes only the Finance Gateway',()=>{
  const source=fs.readFileSync(path.join(root,'scripts/start-finance-ai-quick-tunnel.ps1'),'utf8');
  assert.match(source,/http:\/\/127\.0\.0\.1:4181/);
  assert.doesNotMatch(source,/tunnel\s+--url\s+[^\r\n]*11434/);
  assert.doesNotMatch(source,/tunnel\s+--url\s+[^\r\n]*0\.0\.0\.0/);
  assert.match(source,/Ollama must bind only to loopback/);
});

test('P6-T05 production browser still loads only the Gateway connector',()=>{
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(index,/finance-ai-gateway-connector\.js/);
  assert.doesNotMatch(index,/ollama-connector\.js/);
});

test('P6-T06 Cloudflare credentials and local environment files are ignored',()=>{
  const ignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8');
  assert.match(ignore,/(^|\n)\.env(\n|$)/);
  assert.match(ignore,/(^|\n)\.cloudflared\/(\n|$)/);
  assert.match(ignore,/(^|\n)cert\.pem(\n|$)/);
});

test('P6-T07 connector failure stays safe and never falls back to direct Ollama',async t=>{
  const originalFetch=globalThis.fetch;
  const originalAuth=globalThis.LizhiAuth;
  const calls=[];
  globalThis.LizhiAuth={client:{auth:{getSession:async()=>({data:{session:{access_token:'phase6-token'}}})}}};
  globalThis.fetch=async url=>{calls.push(String(url));throw new TypeError('offline');};
  t.after(()=>{globalThis.fetch=originalFetch;globalThis.LizhiAuth=originalAuth;});
  await assert.rejects(()=>Connector.generateConstrainedFinancePatch({}, {baseUrl:'https://finance-ai.example.com'}, {context:{rawText:'早餐250',draft:{},lockedFields:[],typeHints:['expense'],allowedValues:{types:['expense']}}}),error=>error.code==='CONNECTION_FAILED');
  assert.equal(calls.length,1);
  assert.match(calls[0],/^https:\/\/finance-ai\.example\.com\/finance\/parse$/);
  assert.ok(calls.every(url=>!url.includes('11434')));
});

test('P6-T08 Phase 6 keeps DB v1 and performs no transaction writes',()=>{
  const db=fs.readFileSync(path.join(root,'finance/storage/finance-db.js'),'utf8');
  const script=fs.readFileSync(path.join(root,'scripts/start-finance-ai-quick-tunnel.ps1'),'utf8');
  assert.match(db,/DB_VERSION=1/);
  assert.doesNotMatch(script,/transactions\.(?:create|update|delete)/);
});
