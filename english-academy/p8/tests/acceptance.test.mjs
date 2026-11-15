import test from 'node:test';
import assert from 'node:assert/strict';
import {GATES,evaluateIsolatedChecks,buildFormalAcceptanceMatrix,reviewFormalProofs,
 reviewReleaseConsent,evaluatePreflight,createP8Defect,appendP8Defect}
from '../acceptance-matrix.mjs';
import {createWebOwnerVerifier,createSiteOwnerVerifier} from '../../p7/owner-boundary.mjs';
import {composePrivateSiteCatalog,createPrivateSiteEnglishDispatcher,PRIVATE_PHOTO_TOOL_NAMES}
from '../../p7/site-mcp-compat.mjs';
import {createP6PersistentMcpBackend} from '../../p6/persistent-mcp-adapter.mjs';
import {createCandidateBackend} from '../../p3/memory-backend.mjs';
const sha='a'.repeat(40), OWNER='11111111-1111-4111-8111-111111111111';
const CLIENT='known-chatgpt-account';
const origin=new Request('https://site.example.invalid/mcp',{method:'POST',body:'{}'});
const parsed=(data)=>JSON.stringify(data);

test('G01 through G12 map exactly to P5 required formal acceptance IDs',()=>{
 assert.equal(GATES.length,12);
 assert.deepEqual(GATES.map(x=>x.id),Array.from({length:12},(_,i)=>
  'G'+String(i+1).padStart(2,'0')));
 assert.equal(new Set(GATES.map(x=>x.requirement)).size,12);
 assert.ok(GATES.every(x=>x.mustHaveIndependentEvidence));
});
test('synthetic unit, browser, database and Edge PASS never imply production approval',()=>{
 const r=evaluateIsolatedChecks({commitSha:sha,
 checks:['unit','browser','postgres','edge','mcp-legacy'].map(id=>({id,status:'passed'}))});
 assert.equal(r.isolatedPassed,true);assert.equal(r.productionAccepted,0);assert.equal(r.canDeploy,false);
 const matrix=buildFormalAcceptanceMatrix({commitSha:sha,
   isolated:r.checks.map(x=>({...x,coveredGates:['G01','G02']}))});
 assert.equal(matrix.formalStatus,'BLOCKED');
 assert.equal(matrix.formalVerified,0);assert.equal(matrix.rows.length,12);
 assert.ok(matrix.rows.every(x=>x.status==='NOT_TESTED'));
});
test('caller attempting to mark formal G12 passed cannot create real acceptance',()=>{
 const m=buildFormalAcceptanceMatrix({commitSha:sha,formalStatus:{G12:'PASSED',G03:'FAILED'}});
 assert.equal(m.rows.find(x=>x.id==='G12').status,'BLOCKED');
 assert.equal(m.rows.find(x=>x.id==='G03').status,'FAILED');
 assert.equal(m.formalVerified,0);
});
test('unknown gate ID and duplicate isolated test ID are rejected',()=>{
 assert.throws(()=>buildFormalAcceptanceMatrix({commitSha:sha,formalStatus:{G99:'PASSED'}}),
 /INVALID_GATE_STATE/);
 assert.throws(()=>evaluateIsolatedChecks({commitSha:sha,
 checks:[{id:'unit',status:'passed'},{id:'unit',status:'passed'}]}),/INVALID_ISOLATED_CHECK/);
});
test('formal review without independent trust verifier fails closed',async()=>{
 const r=await reviewFormalProofs({commitSha:sha,proofs:[]});
 assert.equal(r.state,'BLOCKED');
 assert.equal(r.verifiedChecks.length,0);
 assert.equal(r.canDeploy,false);
});
test('synthetic URLs or self-check cannot substitute real independent proof',async()=>{
 const x=GATES.map(g=>({
  requirement:g.requirement,commitSha:sha,status:'passed',
  environment:'synthetic',checkedBy:'self',
  evidenceUrl:'https://ci.example.invalid/synthetic'
 }));
 const r=await reviewFormalProofs({commitSha:sha,proofs:x},
    {verifyEvidence:async()=>true});
 assert.equal(r.state,'BLOCKED');
 assert.equal(r.verifiedChecks.length,0);
 assert.equal(r.canDeploy,false);
});
test('stale SHA, tokenized URL and invalid environment evidence are rejected',async()=>{
 const entries=GATES.map(g=>({
  requirement:g.requirement,commitSha:sha,status:'passed',
  environment:'production-verified',checkedBy:'independent-reviewer',
  evidenceUrl:'https://qa.example.invalid/proof'
 }));
 entries[0].commitSha='b'.repeat(40);
 entries[1].evidenceUrl='https://qa.example.invalid/proof?token=sensitive';
 entries[2].environment='staging-mock';
 const r=await reviewFormalProofs({commitSha:sha,proofs:entries},
  {verifyEvidence:async()=>true});
 assert.equal(r.state,'BLOCKED');assert.ok(r.rejected.length>=3);
});
test('even a simulated complete independent review never performs deployment',async()=>{
 const entries=GATES.map(g=>({
  requirement:g.requirement,commitSha:sha,status:'passed',
  environment:'production-verified',checkedBy:'independent-reviewer',
  evidenceUrl:'https://qa.example.invalid/proof'
 }));
 const hypothetical=await reviewFormalProofs({commitSha:sha,proofs:entries},
  {verifyEvidence:async()=>true});
 assert.equal(hypothetical.state,'READY_FOR_OWNER_APPROVAL');
 assert.equal(hypothetical.canDeploy,false);
 const unauthorized=await reviewReleaseConsent(hypothetical,{scope:'github_pages',
  approvalToken:'fake',verifyReleaseReview:async()=>false,
  verifyOwnerApproval:async()=>true});
 assert.equal(unauthorized.authorized,false);
 assert.equal(unauthorized.performedDeployment,false);
});
test('every P7 preflight gate flagged true still does not authorize deployment',()=>{
 const p=evaluatePreflight({commitSha:sha,envSnapshot:Object.fromEntries([
  'englishMainRoute','englishSchema','englishEdge','oauthOwnerLink','siteCompatibility',
  'independentSecurity','formalApproval','backupRollback','androidVerified','mcpEndToEnd'
 ].map(id=>[id,true]))});
 assert.equal(p.p7.blockers.length,0);
 assert.equal(p.canDeploy,false);
 assert.equal(p.gate,'NOT_AUTHORIZED_FOR_PRODUCTION');
});
test('defect records are append-only, scoped to known gates and HTTPS evidence',()=>{
 const defect=createP8Defect({id:'P8-001',title:'Mock OAuth unverified',
  severity:'high',gate:'G01',source:'synthetic',
  evidenceUrl:'https://github.com/example/testing/runs/1'});
 const hist=appendP8Defect([],defect);
 assert.equal(hist.length,1);assert.equal(hist[0].status,'open');
 assert.throws(()=>appendP8Defect(hist,defect),/INVALID_APPEND_ONLY_DEFECT/);
 assert.throws(()=>createP8Defect({id:'P8-002',title:'secret',severity:'high',
  gate:'G09',source:'synthetic',evidenceUrl:'https://example.invalid/proof?token=abc'}),
  /INVALID_DEFECT_RECORD/);
});
test('P8 mock Site dispatch preserves legacy inventory and scopes English owner',async()=>{
 const previous=[...PRIVATE_PHOTO_TOOL_NAMES.map(name=>({name})),
  {name:'aiwb_get_task'},{name:'aiwb_overview'},{name:'licut_status'},
  {name:'side_list_projects'}];
 const combined=composePrivateSiteCatalog({existingTools:previous,
   legacyBaselineNames:previous.map(x=>x.name)});
 assert.deepEqual(combined.tools.slice(0,previous.length).map(x=>x.name),
   previous.map(x=>x.name));
 const verifier=createSiteOwnerVerifier({
  verifySiteIdentity:async()=>({serverVerified:true,accountId:CLIENT}),
  siteOwnerRegistry:async()=>({enabled:true,oauthLinkVerified:true,ownerId:OWNER,
    chatgptAccountId:CLIENT,allowedScopes:['english:read','english:candidate']}),
  expectedChatgptAccount:CLIENT
 });
 const backend=createCandidateBackend({now:()=>new Date('2026-11-15T00:00:00Z')});
 backend.registerLearningSession({ownerId:OWNER,sessionId:'approved-session-001',
  confirmedByWebsite:true});
 const dispatch=createPrivateSiteEnglishDispatcher({verifySiteOwner:verifier,
  invokeEnglish:async({actor,toolName,arguments:args})=>{
   if(toolName==='create_card_candidates')return backend.syncCandidate({
    ownerId:actor.ownerId,action:toolName,requestId:args.requestId,
    sourceSessionId:args.sourceSessionId,candidates:args.candidates,errors:[]});
   return {ok:false,code:'NOT_IMPLEMENTED'};
  }
 });
 const success=await dispatch({request:origin,toolName:'english_create_card_candidates',
  arguments:{requestId:'p8-sync-0000000001',sourceSessionId:'approved-session-001',
   candidates:[{term:'eaten',meaningZh:'eat 的過去分詞'}]}});
 assert.equal(success.ok,true);
 assert.equal((await backend.listCandidates(OWNER)).items.length,1);
 const forged=await dispatch({request:origin,toolName:'english_create_card_candidates',
  arguments:{requestId:'p8-sync-0000000002',sourceSessionId:'approved-session-001',
   ownerId:'another-person',candidates:[{term:'sleepy',meaningZh:'想睡'}]}});
 assert.equal(forged.code,'FORGED_OWNER_OR_APPROVAL');
 assert.equal((await backend.listCandidates(OWNER)).items.length,1);
});
test('cross-owner backend leakage rejects rather than displaying other learner records',async()=>{
 const store=createP6PersistentMcpBackend({trustedDb:{
  rpc:async()=>({status:'success'}),
  select:async()=>[{owner_id:'other-user',term:'private'}]
 }});
 await assert.rejects(()=>store.listCandidates(OWNER),/BACKEND_OWNER_SCOPE_VIOLATION/);
});
test('missing Google trusted session and revoked Site link are denied',async()=>{
 const web=createWebOwnerVerifier({
  verifySupabaseAccessToken:async()=>({serverVerified:true,sessionId:'s',
   user:{id:OWNER,app_metadata:{provider:'google'}}}),
  ownerRegistry:async()=>({enabled:true,ownerId:OWNER,ownerSource:'supabase-google'}),
  activeSessionRegistry:async()=>false
 });
 await assert.rejects(()=>web({bearer:'fake'}),/SESSION_INACTIVE/);
 const site=createSiteOwnerVerifier({
  verifySiteIdentity:async()=>({serverVerified:true,accountId:CLIENT}),
  siteOwnerRegistry:async()=>({enabled:false,oauthLinkVerified:true,ownerId:OWNER,
    chatgptAccountId:CLIENT,allowedScopes:['english:read']}),
  expectedChatgptAccount:CLIENT
 });
 await assert.rejects(()=>site({request:origin}),/SITE_OWNER_LINK_MISSING/);
});
