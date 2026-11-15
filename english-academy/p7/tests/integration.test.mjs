import test from 'node:test';
import assert from 'node:assert/strict';
import {createWebOwnerVerifier,createSiteOwnerVerifier,consumeVerifiedApproval} from '../owner-boundary.mjs';
import {composePrivateSiteCatalog,createPrivateSiteEnglishDispatcher,
 PRIVATE_PHOTO_TOOL_NAMES} from '../site-mcp-compat.mjs';
import {createSafeP1EdgeCandidate} from '../safe-p1-edge.mjs';
import {evaluateP7Integration,P7_DEPLOY_REQUIREMENTS} from '../integration-preflight.mjs';

const O='11111111-1111-4111-8111-111111111111';
const O2='22222222-2222-4222-8222-222222222222';
const SITE='trusted-site-account-xyz';
const jwt={serverVerified:true,sessionId:'trusted-session',user:{
 id:O,email:'attacker@example.invalid',app_metadata:{provider:'google'}
}};
const webOpts={verifySupabaseAccessToken:async()=>jwt,
 ownerRegistry:async()=>({enabled:true,ownerId:O,ownerSource:'supabase-google'}),
 activeSessionRegistry:async()=>true};
const siteOpts={verifySiteIdentity:async()=>({serverVerified:true,accountId:SITE}),
 siteOwnerRegistry:async()=>({enabled:true,oauthLinkVerified:true,
   ownerId:O,chatgptAccountId:SITE,allowedScopes:['english:read','english:candidate']}),
 expectedChatgptAccount:SITE};
const req=new Request('https://example.invalid/mcp',{method:'POST',body:'{}'});

test('server-verified Supabase user is owner-bound regardless of client email',async()=>{
 const v=createWebOwnerVerifier(webOpts);
 const actor=await v({bearer:'server-token'});
 assert.equal(actor.ownerId,O);
 assert.equal(actor.identityType,'google-user');
 assert.ok(!actor.scopes.includes('english:formal_write'));
});
test('forged email, user metadata and client-supplied owner never grant access',async()=>{
 const v=createWebOwnerVerifier({...webOpts,
   verifySupabaseAccessToken:async()=>({...jwt,user:{...jwt.user,
      id:O2,email:'allowed@example.invalid',user_metadata:{role:'admin'}}})});
 await assert.rejects(()=>v({bearer:'server-token'}),/OWNER_NOT_ALLOWED/);
});
test('Google provider is required; untrusted user gets no owner scope',async()=>{
 const v=createWebOwnerVerifier({...webOpts,verifySupabaseAccessToken:async()=>({
   ...jwt,user:{...jwt.user,app_metadata:{provider:'email'}}})});
 await assert.rejects(()=>v({bearer:'server-token'}),/GOOGLE_PROVIDER_REQUIRED/);
});
test('revoked or expired web session fails closed even with otherwise valid token',async()=>{
 const v=createWebOwnerVerifier({...webOpts,activeSessionRegistry:async()=>false});
 await assert.rejects(()=>v({bearer:'server-token'}),/SESSION_INACTIVE/);
});
test('no private server token verifier configuration is never accepted',()=>{
 assert.throws(()=>createWebOwnerVerifier({}),/TRUSTED_WEB_VERIFICATION_REQUIRED/);
});
test('Site account maps to exactly one registered Google owner; no header trust',async()=>{
 const actor=await createSiteOwnerVerifier(siteOpts)({request:req});
 assert.equal(actor.ownerId,O);
 assert.equal(actor.verifiedChatgptAccountId,SITE);
 assert.deepEqual(actor.scopes,['english:read','english:candidate']);
});
test('fake headers do not bypass verified Site runtime owner identity',async()=>{
 const altered=new Request('https://example.invalid/mcp',{method:'POST',
   headers:{'x-lizhi-owner':O,'x-site-identity':SITE},body:'{}'});
 const v=createSiteOwnerVerifier({...siteOpts,
   verifySiteIdentity:async()=>({serverVerified:false,accountId:SITE})});
 await assert.rejects(()=>v({request:altered}),/CHATGPT_ACCOUNT_NOT_ALLOWED/);
});
test('unlinked Site account cannot infer account from owner email or client info',async()=>{
 const v=createSiteOwnerVerifier({...siteOpts,
   siteOwnerRegistry:async()=>({enabled:true,oauthLinkVerified:false,
     ownerId:O,chatgptAccountId:SITE,allowedScopes:['english:read']})});
 await assert.rejects(()=>v({request:req}),/SITE_OWNER_LINK_MISSING/);
});
test('revoked Site link and missing read scope fail closed',async()=>{
 const denied=createSiteOwnerVerifier({...siteOpts,
   siteOwnerRegistry:async()=>({enabled:false,oauthLinkVerified:true,
     ownerId:O,chatgptAccountId:SITE,allowedScopes:['english:read']})});
 await assert.rejects(()=>denied({request:req}),/SITE_OWNER_LINK_MISSING/);
 const noScope=createSiteOwnerVerifier({...siteOpts,
   siteOwnerRegistry:async()=>({enabled:true,oauthLinkVerified:true,
     ownerId:O,chatgptAccountId:SITE,allowedScopes:['english:formal_write']})});
 await assert.rejects(()=>noScope({request:req}),/SITE_READ_SCOPE_NOT_GRANTED/);
});
test('atomic approval consumer must match trusted owner, action and digest',async()=>{
 const actor={serverVerified:true,ownerId:O};
 const args={actor,action:'create_formal_card',requestId:'formal-action-00001',
   approvalId:'approval-record-1',payload:{term:'beam',meaningZh:'樑'}};
 const approved=await consumeVerifiedApproval({...args,
    consumeActionApproval:async({actor,action,requestId,payloadDigest})=>({
      verified:true,consumedAtomically:true,ownerId:actor.ownerId,
      action,requestId,payloadDigest
    })});
 assert.equal(approved.oneTime,true);
 await assert.rejects(()=>consumeVerifiedApproval({...args,
   consumeActionApproval:async()=>({verified:true,consumedAtomically:false,
     ownerId:O,action:args.action,requestId:args.requestId})}),/TRUSTED_OWNER_APPROVAL_REQUIRED/);
});
const baseline=[
 ...PRIVATE_PHOTO_TOOL_NAMES.map(name=>({name})),
 {name:'aiwb_overview'},{name:'aiwb_get_task'},{name:'side_list'},
 {name:'licut_status'}
];
const baselineNames=baseline.map(x=>x.name);
test('MCP catalog preserves all original tools, namespaces English and hides formal writes',()=>{
 const c=composePrivateSiteCatalog({existingTools:baseline,legacyBaselineNames:baselineNames});
 assert.deepEqual(c.tools.slice(0,baseline.length).map(x=>x.name),baselineNames);
 assert.ok(c.tools.some(x=>x.name==='english_sync_learning_session'));
 assert.ok(!c.tools.some(x=>x.name==='english_add_vocabulary'));
 assert.equal(c.originalCount,baseline.length);
 assert.equal(c.safeForProduction,false);
});
test('missing photo/workbench tool or conflicting English name blocks Site merge',()=>{
 assert.throws(()=>composePrivateSiteCatalog({existingTools:baseline.filter(x=>x.name!=='read_project_image'),
   legacyBaselineNames:baselineNames}),/LEGACY_TOOL_MISSING/);
 assert.throws(()=>composePrivateSiteCatalog({existingTools:baseline.filter(x=>!x.name.startsWith('aiwb_')),
   legacyBaselineNames:baselineNames.filter(x=>!x.startsWith('aiwb_'))}),/WORKBENCH_TOOL_MISSING/);
 assert.throws(()=>composePrivateSiteCatalog({existingTools:[...baseline,{name:'english_get_learning_profile'}],
   legacyBaselineNames:baselineNames}),/MCP_TOOL_COLLISION/);
});
test('MCP actor identity comes only from trusted Site, never request arguments',async()=>{
 let count=0;
 const dispatch=createPrivateSiteEnglishDispatcher({
   verifySiteOwner:createSiteOwnerVerifier(siteOpts),
   invokeEnglish:async({actor,toolName})=>{count++;return {ok:true,owner:actor.ownerId,toolName};}
 });
 const good=await dispatch({request:req,toolName:'english_get_learning_profile',arguments:{}});
 assert.equal(good.owner,O);
 assert.equal(count,1);
 const injected=await dispatch({request:req,toolName:'english_get_learning_profile',
  arguments:{ownerId:O2}});
 assert.equal(injected.code,'FORGED_OWNER_OR_APPROVAL');
 assert.equal(count,1);
});
test('read-only Site linkage cannot write candidates and no configured formal write is allowed',async()=>{
 const readOnly=createPrivateSiteEnglishDispatcher({
   verifySiteOwner:async()=>({serverVerified:true,ownerId:O,scopes:['english:read']}),
   invokeEnglish:async()=>({ok:true})
 });
 assert.equal((await readOnly({request:req,toolName:'english_sync_learning_session',
   arguments:{requestId:'sync-request-00001'}})).code,'SCOPE_DENIED');
 const ordinary=createPrivateSiteEnglishDispatcher({
   verifySiteOwner:createSiteOwnerVerifier(siteOpts),invokeEnglish:async()=>({ok:true})
 });
 assert.equal((await ordinary({request:req,toolName:'english_add_vocabulary',
   arguments:{requestId:'add-newword-00001',term:'rice'}})).code,'SCOPE_DENIED');
});
test('edge wrapper blocks P1 unverified direct manual card or client-confirmed promotion',async()=>{
 let reached=0;
 const safe=createSafeP1EdgeCandidate({delegate:async()=>{reached++;return Response.json({ok:true})}});
 for(const path of ['card','accept','ignore']){
   const r=await safe(new Request('https://example.invalid/functions/v1/english/'+path,
     {method:'POST',body:JSON.stringify({userConfirmed:true})}),{});
   assert.equal(r.status,403);
   assert.equal((await r.json()).code,'FORMAL_WRITE_PENDING_TRUSTED_APPROVAL');
 }
 assert.equal(reached,0);
});
test('edge wrapper still forwards owner-authenticated read and pending candidate to P1 delegate',async()=>{
 let reached=0;
 const safe=createSafeP1EdgeCandidate({delegate:async()=>{reached++;return Response.json({ready:true})}});
 const a=await safe(new Request('https://example.invalid/functions/v1/english/candidates'),{});
 const b=await safe(new Request('https://example.invalid/functions/v1/english/candidate',
    {method:'POST',body:'{}'}),{});
 assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(reached,2);
});
test('release preflight refuses mock tests, missing real integration and any deployment',()=>{
 const r=evaluateP7Integration({evidence:[{id:'test',source:'synthetic',verifiedBy:'self'}]});
 assert.equal(r.canDeploy,false);
 assert.equal(r.canMergeMain,false);
 assert.equal(r.invalidEvidence.length,1);
 assert.equal(r.blockers.length,P7_DEPLOY_REQUIREMENTS.length);
});
test('even fully asserted flags cannot trigger merge/deployment via this pure checklist',()=>{
 const all=Object.fromEntries(P7_DEPLOY_REQUIREMENTS.map(x=>[x.id,true]));
 const p=evaluateP7Integration(all);
 assert.equal(p.blockers.length,0);
 assert.equal(p.canWriteProduction,false);
 assert.equal(p.canDeploy,false);
});
