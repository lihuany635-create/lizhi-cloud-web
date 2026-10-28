/**
 * AUTH01–AUTH10 isolated SECURITY PREFLIGHT only. All HTTP responses,
 * sessions and tokens below are local fakes, NOT real owner authorization.
 * No network, actual secrets, deployment, or production MCP writes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {TrustedMcpHttp,OwnerScopedReadHost,HostError} from './trusted-mcp-host.mjs';

const P='61b88bec-9b3e-49e6-8780-d073fc816516';
const ORIGIN='https://sandbox.invalid';
const TOKEN='TEST_ONLY_NOT_REAL_CREDENTIAL_00000';
const NOW=1800000000000;
const deny=(fn,code)=>assert.rejects(fn,e=>e?.code===code);
const result=(name,args,rev=60)=>{
  if(name==='list_projects')return [{projectId:P,revision:rev}];
  if(name==='get_project_context')return {projectId:args.projectId,revision:rev,
    tasks:[{id:'task-01',key:'P3-auth',status:'IN_PROGRESS'}],
    sources:[{snapshot:'NEVER_INCLUDE_PRIVATE_SOURCE'}]};
  if(name==='get_project_handoff')return {projectId:args.projectId,revision:rev,
    unfinished:[],lastWork:{key:'auth-preflight'},private:'NEVER_INCLUDE_PRIVATE_SOURCE'};
  throw new Error('not authorized');
};
function sandbox({owner=true,subject='owner-test',expire=false,revokedAfter=Infinity,
                  httpStatus=200,flip=false,token=TOKEN,throwFetch=false,badJson=false,
                  wrongId=false,delay=false}={}){
 const seen=[];let checks=0,reads=0,tokenReads=0;
 const transport=new TrustedMcpHttp({endpoint:ORIGIN+'/mcp',trustedOrigin:ORIGIN,
   getBearerToken:()=>{tokenReads++;return token;},timeoutMs:1000,
   fetchImpl:async (url,opts)=>{
     seen.push({url,opts});
     if(throwFetch)throw Error('PRIVATE TOKEN MUST NOT BE EXPOSED');
     if(delay)throw Object.assign(new Error('timeout'),{name:'AbortError'});
     if(httpStatus!==200)return new Response('PRIVATE TOKEN',{status:httpStatus,
        headers:httpStatus===302?{Location:'https://attacker.invalid/mcp'}:{}});
     const call=JSON.parse(opts.body);
     reads++;
     const revision=flip&&reads>=4?61:60;
     const rpc={jsonrpc:'2.0',id:wrongId?'wrong':call.id,
       result:{content:[{type:'text',text:JSON.stringify(result(call.params.name,call.params.arguments,revision))}],isError:false}};
     return new Response(badJson?'invalid json':JSON.stringify(rpc),{status:200});
   }});
 const host=new OwnerScopedReadHost({projectId:P,expectedOwnerSubject:'owner-test',now:()=>NOW,
   transport,verifyOwnerSession:()=>{
     checks++;
     return {authenticated:owner&&checks<=revokedAfter,subjectId:subject,
       expiresAt:expire?NOW-1:NOW+1000};
   }});
 return {host,transport,seen,checks:()=>checks,reads:()=>reads,tokenReads:()=>tokenReads};
}

test('AUTH01 no trusted owner session cannot call any MCP tool or fetch token',async()=>{
 const s=sandbox({owner:false});
 await deny(()=>s.host.runOnce({projectId:P}),'OWNER_SESSION_UNVERIFIED');
 assert.equal(s.seen.length,0);assert.equal(s.tokenReads(),0);
});
test('AUTH02 authenticated owner reads three allowlisted methods, independent revision-consistent review',async()=>{
 const s=sandbox(); const r=await s.host.runOnce({projectId:P});
 assert.equal(r.status,'READ_ONLY_DRAFT');assert.equal(r.review.freshRead,true);
 assert.equal(r.snapshot.revision,60);assert.equal(r.sessionReceipt.authorApproved,false);
 assert.equal(s.seen.length,5);
 assert.deepEqual(s.seen.map(x=>JSON.parse(x.opts.body).params.name),
 ['list_projects','get_project_context','get_project_handoff','get_project_context','get_project_handoff']);
 assert.equal(JSON.stringify(r).includes(TOKEN),false);
});
test('AUTH03 wrong owner, expired owner and unauthorized project all fail before MCP request',async()=>{
 const wrong=sandbox({subject:'other-user'});
 await deny(()=>wrong.host.runOnce({projectId:P}),'OWNER_SESSION_UNVERIFIED');
 const expired=sandbox({expire:true});await deny(()=>expired.host.runOnce({projectId:P}),'OWNER_SESSION_UNVERIFIED');
 const foreign=sandbox();await deny(()=>foreign.host.runOnce({projectId:'another-project'}),'PROJECT_NOT_ALLOWED');
 assert.deepEqual([wrong.seen.length,expired.seen.length,foreign.seen.length],[0,0,0]);
});
test('AUTH04 dangerous tools and cross-project substitution blocked by transport before network',async()=>{
 const s=sandbox();for(const name of ['append_work_record','finance_create_transaction','phone_tap','cad_delete','tool_name_from_document']){
   await deny(()=>s.transport.call(name,{projectId:P}),'WRITE_TOOL_DENIED');
 }
 await deny(()=>s.transport.call('get_project_context',{projectId:'other',revision:1}),'ARGUMENTS_INVALID');
 assert.equal(s.seen.length,0);
});
test('AUTH05 401, 403, 503, timeout, redirects, invalid JSON and RPC IDs fail closed without retry',async()=>{
 const cases=[[{httpStatus:401},'MCP_AUTH_DENIED'],[{httpStatus:403},'MCP_AUTH_DENIED'],
 [{httpStatus:503},'MCP_HTTP_FAILED'],[{delay:true},'MCP_TRANSPORT_FAILED'],
 [{httpStatus:302},'MCP_REDIRECT_DENIED'],[{badJson:true},'MCP_RESPONSE_INVALID'],
 [{wrongId:true},'MCP_PROTOCOL_INVALID']];
 for(const [opts,code] of cases){const s=sandbox(opts);
   await deny(()=>s.transport.call('list_projects',{}),code);
   assert.equal(s.seen.length,1,code+' must not retry');
 }
});
test('AUTH06 reviewer source revision drift stops before any handoff',async()=>{
 const s=sandbox({flip:true});
 await assert.rejects(()=>s.host.runOnce({projectId:P}),e=>e?.code==='REVISION_CHANGED'||e?.code==='REVIEW_SOURCE_CHANGED');
 assert.equal(s.seen.length,5);
});
test('AUTH07 session revoked mid-work blocks next read without replay',async()=>{
 const s=sandbox({revokedAfter:2});
 await assert.rejects(()=>s.host.runOnce({projectId:P}),e=>e?.code==='MCP_READ_ERROR'||e?.code==='OWNER_SESSION_UNVERIFIED');
 assert.equal(s.seen.length,1);
});
test('AUTH08 two manual runs have different receipts, no author acceptance or persisted session reuse',async()=>{
 const s=sandbox();const a=await s.host.runOnce({projectId:P});const b=await s.host.runOnce({projectId:P});
 assert.notEqual(a.sessionReceipt.sessionId,b.sessionReceipt.sessionId);
 for(const r of [a,b]){assert.equal(r.handoffDraft.authorApproved,false);
   assert.equal(r.handoffDraft.kind,'LOCAL_DRAFT_ONLY');}
 assert.equal(s.seen.length,10);
});
test('AUTH09 AUTO and caller fake approval cannot purchase service or enable automatic job',async()=>{
 const s=sandbox();await deny(()=>s.host.runOnce({projectId:P,mode:'AUTO',ownerApproved:true,paidApi:true}),'AUTO_DISABLED');
 assert.equal(s.seen.length,0);assert.equal(s.tokenReads(),0);
});
test('AUTH10 receipt/audit only retain project, revision, role and safe digest (no bearer or private source)',async()=>{
 const s=sandbox();const r=await s.host.runOnce({projectId:P});
 const exported=JSON.stringify({receipt:r.sessionReceipt,review:r.review,audit:s.host.bridge.audit});
 for(const bad of [TOKEN,'NEVER_INCLUDE_PRIVATE_SOURCE','Authorization','Bearer '])
   assert.equal(exported.includes(bad),false,bad);
 assert.equal(r.sessionReceipt.projectId,P);
 assert.equal(s.host.bridge.audit.length,2);
 assert.match(r.sessionReceipt.ownerDigest,/^[a-f0-9]{64}$/);
 // Limit: mock audit has no durable server-side requestId; live AUTH10 remains NOT_TESTED.
});
