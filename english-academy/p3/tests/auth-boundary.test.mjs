import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrustedMcpAuthenticator} from '../auth-boundary.mjs';
const ISSUER='https://auth.test.invalid',AUD='https://english.test.invalid/mcp';
const client='trusted-chatgpt-app';
const goodClaims={active:true,issuer:ISSUER,audience:AUD,subject:'oauth-user-001',
  verifiedClientId:client,scopes:['english:read','english:candidate','english:formal_write']};
const goodLink={enabled:true,oauthVerified:true,ownerId:'server-verified-owner',
  verifiedClientId:client,allowedScopes:['english:read','english:candidate']};
function build(c=goodClaims,l=goodLink){
 return createTrustedMcpAuthenticator({
   introspectToken:async()=>c,resolveOwnerLink:async()=>l,
   allowedClientIds:[client],issuer:ISSUER,resourceAudience:AUD,
 });
}
test('trusted token and server-side owner registry succeed with scopes intersection',async()=>{
 const actor=await build()({bearer:'secure-access-token'});
 assert.equal(actor.serverVerified,true);
 assert.equal(actor.userId,'server-verified-owner');
 assert.deepEqual(actor.scopes,['english:read','english:candidate']);
 assert.ok(!actor.scopes.includes('english:formal_write'));
});
test('reject revoked and unknown client tokens',async()=>{
 await assert.rejects(()=>build({...goodClaims,active:false})({bearer:'revoked'}));
 await assert.rejects(()=>build({...goodClaims,verifiedClientId:'unknown'})({bearer:'token'}));
});
test('reject wrong OAuth issuer or resource audience',async()=>{
 await assert.rejects(()=>build({...goodClaims,issuer:'https://impostor.invalid'})({bearer:'token'}));
 await assert.rejects(()=>build({...goodClaims,audience:'https://other.invalid'})({bearer:'token'}));
});
test('server-side linked owner, not token ownerId, controls identity',async()=>{
 const actor=await build({...goodClaims,ownerId:'forged-owner'})({bearer:'token'});
 assert.equal(actor.userId,'server-verified-owner');
});
test('linked owner revoked or app client mismatch rejects',async()=>{
 await assert.rejects(()=>build(goodClaims,{...goodLink,enabled:false})({bearer:'token'}));
 await assert.rejects(()=>build(goodClaims,{...goodLink,verifiedClientId:'other-client'})({bearer:'token'}));
 await assert.rejects(()=>build(goodClaims,{...goodLink,oauthVerified:false})({bearer:'token'}));
});
test('missing trusted introspection or metadata is a configuration error',()=>{
 assert.throws(()=>createTrustedMcpAuthenticator({}),/UNCONFIGURED/);
});
