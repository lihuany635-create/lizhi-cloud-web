import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../../sites-migration/english-academy-p12/route.ts', import.meta.url),'utf8');

test('private Site tools/list and tools/call both require trusted native owner before relaying',()=>{
 const ownerGate=source.indexOf("if (method === 'tools/list' || method === 'tools/call')");
 const nativeIdentity=source.indexOf("identity(req, 'ai')",ownerGate);
 const ownerMatch=source.indexOf("who.id !== e.PRODUCTION_CHATGPT_OWNER",nativeIdentity);
 const call=source.indexOf("if (method === 'tools/call') {",ownerMatch);
 const list=source.indexOf("if (method === 'tools/list') {",call);
 const upstreamList=source.indexOf("const aiwb = await upstream(body)",list);
 assert.ok(ownerGate>=0 && nativeIdentity>ownerGate && ownerMatch>nativeIdentity);
 assert.ok(call>ownerMatch && list>call && upstreamList>list);
});

test('Site owner credentials remain runtime-only and English formal-card bypass is not relayed',()=>{
 assert.match(source,/e\.PRODUCTION_BRIDGE_KEY/);
 assert.match(source,/e\.PRODUCTION_CHATGPT_OWNER/);
 assert.doesNotMatch(source,/Bearer lzp_[a-zA-Z0-9_-]{20,}/);
 const relay=readFileSync(new URL('../site-relay.mjs', import.meta.url),'utf8');
 assert.match(relay,/body\.params\.name==='add_vocabulary'/);
 assert.match(relay,/WEBSITE_APPROVAL_REQUIRED/);
});
