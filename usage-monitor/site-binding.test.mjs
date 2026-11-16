import {test} from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifySiteBridge} from '../supabase/functions/_shared/lizhi-usage-mcp-bridge-auth.mjs';
const key='synthetic-server-only-key-'.repeat(4),actor='synthetic-owner@example.invalid';
const hash=x=>createHash('sha256').update(x).digest('hex');
const config={secretDigest:hash(key),actorDigest:hash(actor)};
const headers=(k=key,a=actor)=>new Headers({'x-lizhi-usage-bridge':k,'x-lizhi-usage-actor':a});
test('pinned one-way verifiers accept the actual dedicated server secret and owner',async()=>assert.equal(await verifySiteBridge(headers(),config),true));
test('published digest cannot itself be used as a bearer credential',async()=>assert.equal(await verifySiteBridge(headers(config.secretDigest),config),false));
test('other owner, wrong key and client hash substitution fail',async()=>{
 assert.equal(await verifySiteBridge(headers(key,'other-owner@example.invalid'),config),false);
 assert.equal(await verifySiteBridge(headers('wrong-key-'.repeat(8)),config),false);
 assert.equal(await verifySiteBridge(headers(key,config.actorDigest),config),false);
});
test('partial or malformed verifier configuration does not authorize',async()=>{
 assert.equal(await verifySiteBridge(headers(),{secretDigest:config.secretDigest}),false);
 assert.equal(await verifySiteBridge(headers(),{secretDigest:'not-a-hash',actorDigest:config.actorDigest}),false);
});
