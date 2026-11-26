import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSiteOwnerVerifier} from '../../p7/owner-boundary.mjs';
import {createMcpHandler,MCP_VERSION} from '../../p3/mcp-server.mjs';
import {createP6PersistentMcpBackend} from '../../p6/persistent-mcp-adapter.mjs';
import {createP10TrustedMcpAuthenticator,P10_IDENTITY_CONTRACT} from '../owner-contract.mjs';
import {createP10FailClosedEdge} from '../fail-closed-edge.mjs';
const OWNER='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const SITE_ID='chatgpt-account-test';
const ISS='https://auth.example.invalid',AUD='english-academy-mcp';
const CLIENT_ID='trusted-chatgpt-client';
const TOKEN='trusted-test-token-with-entropy';
const request=new Request('https://english.example.invalid/mcp',{method:'POST',body:'{}'});
function auth(overrides={}){
 const site=createSiteOwnerVerifier({
  verifySiteIdentity:async()=>({serverVerified:true,accountId:SITE_ID}),
  siteOwnerRegistry:async()=>({enabled:true,oauthLinkVerified:true,
   ownerId:OWNER,chatgptAccountId:SITE_ID,allowedScopes:['english:read','english:candidate']}),
  expectedChatgptAccount:SITE_ID
 });
 const verified={
  serverVerified:true,active:true,ownerId:OWNER,verifiedChatgptAccountId:SITE_ID,
  issuer:ISS,audience:AUD,verifiedClientId:CLIENT_ID,scopes:['english:read','english:candidate'],
  ...overrides
 };
 return createP10TrustedMcpAuthenticator({
  verifySiteOwner:site,verifyBoundAccessToken:async()=>verified,
  allowedClientIds:[CLIENT_ID],expectedIssuer:ISS,expectedAudience:AUD});
}
test('P10 dependency snapshot locks exactly P1-P9 in a single draft chain',async()=>{
 const x=JSON.parse(await readFile(new URL('../upstream-lock.json',import.meta.url),'utf8'));
 assert.equal(x.upstream.length,9);
 assert.deepEqual(x.upstream.map(r=>r.stage),Array.from({length:9},(_,i)=>'P'+(i+1)));
 assert.equal(x.upstream[0].base,'main');
 for(let i=1;i<x.upstream.length;i++){
  assert.equal(x.upstream[i].base,x.upstream[i-1].head);
  assert.equal(x.upstream[i].pr,x.upstream[i-1].pr+1+(i===8?1:0));
 }
 assert.equal(x.upstream.at(-1).head,x.p10.base);
 assert.ok(x.upstream.every(x=>x.draft===true&&x.merged===false&&
  /^[0-9a-f]{40}$/.test(x.headSha)));
 assert.equal(x.formalAcceptance.passed,0);
 assert.ok(Object.values(x.approvalScopes).every(v=>v===false));
});
test('identity contract names independent P3/P7/P6 owner fields',()=>{
 assert.equal(P10_IDENTITY_CONTRACT.siteActorField,'ownerId');
 assert.equal(P10_IDENTITY_CONTRACT.p3ActorField,'userId');
 assert.equal(P10_IDENTITY_CONTRACT.p6BackendField,'ownerId');
 assert.equal(P10_IDENTITY_CONTRACT.productionConnected,false);
});
test('MCP bridge cannot start without two independent trusted verifier callbacks',()=>{
 assert.throws(()=>createP10TrustedMcpAuthenticator({}),/VERIFIED_MCP_DEPENDENCIES_REQUIRED/);
});
test('valid P7 Site owner and independently verified token intersect scopes and yield P3 userId',async()=>{
 const actor=await auth()({bearer:TOKEN,request});
 assert.equal(actor.userId,OWNER);
 assert.equal(actor.serverVerified,true);
 assert.equal(actor.active,true);
 assert.deepEqual(actor.scopes,['english:read','english:candidate']);
 assert.equal(actor.verifiedClientId,CLIENT_ID);
 assert.equal(actor.scopes.includes('english:formal_write'),false);
});
test('different verified OAuth owner must not impersonate Site owner',async()=>{
 await assert.rejects(()=>auth({ownerId:OTHER})({bearer:TOKEN,request}),/MCP_OWNER_OR_TOKEN_MISMATCH/);
});
test('different ChatGPT Site account link, inactive token or unapproved client fail closed',async()=>{
 for(const override of [
  {verifiedChatgptAccountId:'another-site-account'},
  {active:false},
  {verifiedClientId:'unapproved-client'},
  {serverVerified:false}
 ]){
  await assert.rejects(()=>auth(override)({bearer:TOKEN,request}),/MCP_OWNER_OR_TOKEN_MISMATCH/);
 }
});
test('invalid issuer, audience or missing verified read scopes fail closed',async()=>{
 for(const override of [{issuer:'https://evil.invalid'},
  {audience:'not-english'}, {scopes:['english:candidate']}]){
  await assert.rejects(()=>auth(override)({bearer:TOKEN,request}),
   /MCP_OWNER_OR_TOKEN_MISMATCH|MCP_READ_SCOPE_REQUIRED/);
 }
});
test('Site read-only scope restricts P3 MCP even with candidate scope in token',async()=>{
 const ver=createSiteOwnerVerifier({
  verifySiteIdentity:async()=>({serverVerified:true,accountId:SITE_ID}),
  siteOwnerRegistry:async()=>({enabled:true,oauthLinkVerified:true,ownerId:OWNER,
   chatgptAccountId:SITE_ID,allowedScopes:['english:read']}),
  expectedChatgptAccount:SITE_ID
 });
 const actor=await createP10TrustedMcpAuthenticator({
  verifySiteOwner:ver,
  verifyBoundAccessToken:async()=>({serverVerified:true,active:true,ownerId:OWNER,
   verifiedChatgptAccountId:SITE_ID,issuer:ISS,audience:AUD,
   verifiedClientId:CLIENT_ID,scopes:['english:read','english:candidate']}),
  allowedClientIds:[CLIENT_ID],expectedIssuer:ISS,expectedAudience:AUD
 })({bearer:TOKEN,request});
 assert.deepEqual(actor.scopes,['english:read']);
});
test('real loopback-style P3 tools/call -> verified P7 owner -> P6 atomic RPC adapter',async()=>{
 const calls=[];
 const trustedDb={
  rpc:async(name,payload)=>{calls.push({name,payload});return{
   status:'success',requestId:payload.p_request_id,pendingAdded:1,errorsAdded:0,replay:false};},
  select:async(table,{ownerId})=>table==='english_card_candidates'?
   [{id:'pending-card',owner_id:ownerId,term:'hungry',status:'pending'}]:[]
 };
 const backend=createP6PersistentMcpBackend({trustedDb});
 const handler=createMcpHandler({authenticate:auth(),backend,
   allowedOrigins:['https://chatgpt.com']});
 let num=0;
 const call=async(method,params={})=>{
  const req=new Request('https://site.example.invalid/mcp',{
   method:'POST',headers:{
    authorization:'Bearer '+TOKEN,
    'content-type':'application/json','mcp-protocol-version':MCP_VERSION,
    origin:'https://chatgpt.com'
   },
   body:JSON.stringify({jsonrpc:'2.0',id:++num,method,params:{
    ...params,_meta:{
     'io.modelcontextprotocol/protocolVersion':MCP_VERSION,
     'io.modelcontextprotocol/clientCapabilities':{},
     'io.modelcontextprotocol/clientInfo':{name:'attacker-supplied',ownerId:OTHER}
    }
   }})
  });
  const response=await handler(req);
  assert.equal(response.status,200);
  return response.json();
 };
 const tools=await call('tools/list');
 assert.ok(tools.result.tools.some(x=>x.name==='sync_learning_session'));
 const r=await call('tools/call',{name:'sync_learning_session',arguments:{
  requestId:'p10-atomic-000001',sourceSessionId:'confirmed-practice-001',
  candidates:[{term:'hungry',meaningZh:'餓的'}],errors:[]
 }});
 assert.equal(r.result.content[0].type,'text');
 const outcome=JSON.parse(r.result.content[0].text);
 assert.equal(outcome.pendingAdded,1);
 assert.equal(calls.length,1);
 assert.equal(calls[0].name,'english_p6_ingest_batch');
 assert.equal(calls[0].payload.p_owner_id,OWNER);
 assert.equal(calls[0].payload.p_source_session_id,'confirmed-practice-001');
 const denied=await call('tools/call',{name:'sync_learning_session',arguments:{
  requestId:'p10-atomic-000002',sourceSessionId:'confirmed-practice-001',
  ownerId:OTHER,candidates:[{term:'sleepy',meaningZh:'困的'}],errors:[]
 }});
 assert.equal(denied.result.isError,true);
 assert.equal(calls.length,1);
});
test('P10 Edge candidate blocks all four direct write routes without contacting delegate',async()=>{
 let calls=0;
 const handler=createP10FailClosedEdge({delegate:async()=>{calls++;return Response.json({ok:true});}});
 for(const action of ['candidate','card','accept','ignore']){
  const response=await handler(new Request('https://edge.example.invalid/'+action,{
   method:'POST',headers:{origin:'https://lihuany635-create.github.io'},body:'{}'}),{});
  assert.equal(response.status,403);
  assert.equal((await response.json()).code,'P10_TRUSTED_ATOMIC_WRITE_NOT_READY');
 }
 assert.equal(calls,0);
});
test('P10 Edge keeps read-only authenticated delegate and OPTIONS, denies wrong origin',async()=>{
 let calls=0;
 const handler=createP10FailClosedEdge({delegate:async()=>{
  calls++;return Response.json({serverVerified:true});}});
 for(const route of ['status','candidates','cards']){
  const response=await handler(new Request('https://edge.example.invalid/'+route,{
    headers:{origin:'https://lihuany635-create.github.io'}}),{});
  assert.equal(response.status,200);
 }
 assert.equal(calls,3);
 const denied=await handler(new Request('https://edge.example.invalid/status',{
  headers:{origin:'https://evil.example.invalid'}}),{});
 assert.equal(denied.status,403);
 assert.equal(calls,3);
 const opt=await handler(new Request('https://edge.example.invalid/candidates',{
  method:'OPTIONS'}),{});
 assert.equal(opt.status,200);
 assert.equal(calls,4);
});
test('P10 gate refuses direct untrusted writes even when path or method changes',async()=>{
 let calls=0;
 const handler=createP10FailClosedEdge({delegate:async()=>{calls++;return Response.json({ok:true})}});
 const headers={origin:'https://lihuany635-create.github.io'};
 for(const [method,path] of [['PATCH','candidate'],['DELETE','cards'],['POST','status'],['POST','unknown']]){
  const res=await handler(new Request('https://example.invalid/'+path,{method,headers}),{});
  assert.equal(res.status,404);
 }
 assert.equal(calls,0);
});
