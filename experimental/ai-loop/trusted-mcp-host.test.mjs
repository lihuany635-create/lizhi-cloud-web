import test from 'node:test';
import assert from 'node:assert/strict';
import {TrustedMcpHttp,OwnerScopedReadHost,HostError} from './trusted-mcp-host.mjs';

const PROJECT='61b88bec-9b3e-49e6-8780-d073fc816516';
const endpoint='https://mcp.local.example/mcp';
const ORIGIN='https://mcp.local.example';
const TOKEN='server-only-test-token-value';
const NOW=1761640000000;
const assertReject=(call,code)=>assert.rejects(call,e=>e instanceof HostError && e.code===code);
const dataFor=(name,args,rev=36)=>{
 if(name==='list_projects')return [{projectId:PROJECT,revision:rev,private:'secret-source'}];
 if(name==='get_project_context')return {projectId:args.projectId,revision:rev,tasks:[{id:'t1',key:'P3-test',status:'IN_PROGRESS'}],sourceText:'DO NOT PRINT SECRET'};
 if(name==='get_project_handoff')return {projectId:args.projectId,revision:rev,unfinished:[],lastWork:{key:'p3-read'},secrets:['SECRET']};
 throw Error('not allowed');
};
function createMock(opts={}) {
 const calls=[];let fetchCount=0,checks=0;
 const fakeFetch=async(url,options)=>{
   fetchCount++;calls.push({url,options});
   if(opts.transportError)throw Error('upstream token: private-secret');
   if(opts.httpStatus)return new Response('secret from remote',{status:opts.httpStatus,headers:opts.httpStatus===302?{Location:'https://attacker.example/mcp'}:{}});
   let req=JSON.parse(options.body);
   const actual=opts.wrongId?'not-the-request-id':req.id;
   const data=dataFor(req.params.name,req.params.arguments,req.params.name==='list_projects'?(opts.listRevision??36):(opts.revision??36));
   const rpc={jsonrpc:'2.0',id:actual,result:{content:[{type:'text',text:JSON.stringify(data)}],isError:!!opts.mcpError}};
   if(opts.protocolError)rpc.error={code:-32601,message:'secret content'};
   return new Response(opts.malformed?'not JSON':JSON.stringify(rpc),{status:200,headers:{'content-type':'application/json'}});
 };
 const trustedTransport=new TrustedMcpHttp({endpoint,trustedOrigin:ORIGIN,fetchImpl:fakeFetch,
   getBearerToken: async()=>opts.noCredential?'':TOKEN,timeoutMs:5000});
 const host=new OwnerScopedReadHost({
   projectId:PROJECT, expectedOwnerSubject:'owner-42', now:()=>NOW, transport:trustedTransport,
   verifyOwnerSession:async()=>{
      checks++;
      if(opts.sessionThrows)throw Error('do not show');
      if(opts.revokeAfter && checks>opts.revokeAfter)return {authenticated:false,subjectId:'owner-42',expiresAt:NOW+1000};
      return {authenticated:!opts.unauthorized,subjectId:opts.otherOwner?'attacker':'owner-42',
        expiresAt:opts.expired?NOW-1000:NOW+100000};
   },
 });
 return {host,trustedTransport,calls,fetchCount:()=>fetchCount,checks:()=>checks};
}
test('P3-HTTP-01 trusted owner performs five real-form HTTP JSON-RPC reads and returns draft',async()=>{
 const x=createMock();const r=await x.host.runOnce({projectId:PROJECT});
 assert.equal(r.status,'READ_ONLY_DRAFT');assert.equal(r.review.result,'READBACK_MATCH');
 assert.equal(r.snapshot.revision,36);assert.equal(r.handoffDraft.authorApproved,false);
 assert.equal(r.sessionReceipt.authorApproved,false);assert.equal(r.invokedReadCount,5);
 assert.deepEqual(x.calls.map(c=>JSON.parse(c.options.body).params.name),
 ['list_projects','get_project_context','get_project_handoff','get_project_context','get_project_handoff']);
 assert.equal(x.checks(),6); assert.equal(x.fetchCount(),5);
 assert.equal(JSON.stringify(r).includes(TOKEN),false);
 assert.equal(JSON.stringify(r).includes('SECRET'),false);
});
test('P3-HTTP-02 authorized server transport uses POST no redirect and bearer only in request',async()=>{
 const x=createMock();await x.host.runOnce({projectId:PROJECT});
 const p=x.calls[0].options; assert.equal(p.method,'POST');
 assert.equal(p.redirect,'manual');assert.equal(p.cache,'no-store');
 assert.equal(p.referrerPolicy,'no-referrer');assert.equal(p.headers.Authorization,'Bearer '+TOKEN);
 assert.equal(JSON.parse(p.body).method,'tools/call');
 assert.deepEqual(JSON.parse(p.body).params.arguments,{});
});
test('P3-HTTP-03 rejects HTTP without TLS even on loopback',()=> {
 assert.throws(()=>new TrustedMcpHttp({endpoint:'http://127.0.0.1/mcp',trustedOrigin:'http://127.0.0.1',
  fetchImpl:async()=>{},getBearerToken:()=>TOKEN}),e=>e.code==='ENDPOINT_NOT_TRUSTED');
});
test('P3-HTTP-04 rejects endpoint origin mismatch and user-supplied query',()=>{
 for(const bad of ['https://attacker.example/mcp','https://mcp.local.example/mcp?token=x',
 'https://name:pw@mcp.local.example/mcp'])assert.throws(()=>new TrustedMcpHttp({
  endpoint:bad,trustedOrigin:ORIGIN,fetchImpl:async()=>{},getBearerToken:()=>TOKEN
 }),e=>e.code==='ENDPOINT_NOT_TRUSTED');
});
test('P3-HTTP-05 refuses all write-like tool names before issuing network call',async()=>{
 const x=createMock();for(const tool of ['append_work_record','phone_tap','finance_create_transaction','tools/list'])
 await assertReject(()=>x.trustedTransport.call(tool,{projectId:PROJECT}),'WRITE_TOOL_DENIED');
 assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-06 refuses unapproved tool arguments and project substitution',async()=>{
 const x=createMock();
 await assertReject(()=>x.trustedTransport.call('get_project_context',{projectId:PROJECT,revision:5}),'ARGUMENTS_INVALID');
 await assertReject(()=>x.trustedTransport.call('list_projects',{projectId:PROJECT}),'ARGUMENTS_INVALID');
 await assertReject(()=>x.host.runOnce({projectId:'SOME_OTHER_PROJECT'}),'PROJECT_NOT_ALLOWED');
 assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-07 AUTO mode is disabled in host; manual only',async()=>{
 const x=createMock();await assertReject(()=>x.host.runOnce({projectId:PROJECT,mode:'AUTO'}),'AUTO_DISABLED');assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-08 missing authenticated owner must fail before requests',async()=>{
 const x=createMock({unauthorized:true});await assertReject(()=>x.host.runOnce({projectId:PROJECT}),'OWNER_SESSION_UNVERIFIED');
 assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-09 wrong owner subject must fail before requests',async()=>{
 const x=createMock({otherOwner:true});await assertReject(()=>x.host.runOnce({projectId:PROJECT}),'OWNER_SESSION_UNVERIFIED');assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-10 expired session denied before requests',async()=>{
 const x=createMock({expired:true});await assertReject(()=>x.host.runOnce({projectId:PROJECT}),'OWNER_SESSION_UNVERIFIED');assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-11 mid-run revoked session halts further reads',async()=>{
 const x=createMock({revokeAfter:2});await assert.rejects(()=>x.host.runOnce({projectId:PROJECT}),e=>e.code==='MCP_READ_ERROR');
 assert.equal(x.fetchCount(),1);
});
test('P3-HTTP-12 absent bearer token fails closed',async()=>{
 const x=createMock({noCredential:true});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'CREDENTIAL_UNAVAILABLE');
 assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-13 bearer secret not leaked in errors',async()=>{
 const x=createMock({transportError:true});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'MCP_TRANSPORT_FAILED');
 assert.equal(x.fetchCount(),1);
});
test('P3-HTTP-14 401 authorization rejected, no retry',async()=>{
 const x=createMock({httpStatus:401});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'MCP_AUTH_DENIED');
 assert.equal(x.fetchCount(),1);
});
test('P3-HTTP-15 redirect rejected, no second fetch',async()=>{
 const x=createMock({httpStatus:302});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'MCP_REDIRECT_DENIED');
 assert.equal(x.fetchCount(),1);
});
test('P3-HTTP-16 other HTTP failures not retried',async()=>{
 const x=createMock({httpStatus:503});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'MCP_HTTP_FAILED');
 assert.equal(x.fetchCount(),1);
});
test('P3-HTTP-17 bad JSON raises safe error without logging payload',async()=>{
 const x=createMock({malformed:true});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'MCP_RESPONSE_INVALID');
 assert.equal(x.fetchCount(),1);
});
test('P3-HTTP-18 wrong JSON-RPC correlation id rejected',async()=>{
 const x=createMock({wrongId:true});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'MCP_PROTOCOL_INVALID');
 assert.equal(x.fetchCount(),1);
});
test('P3-HTTP-19 JSON-RPC error rejected',async()=>{
 const x=createMock({protocolError:true});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'MCP_PROTOCOL_INVALID');
});
test('P3-HTTP-20 MCP tool result isError rejected',async()=>{
 const x=createMock({mcpError:true});await assertReject(()=>x.trustedTransport.call('list_projects',{}),'MCP_READ_FAILED');
});
test('P3-HTTP-21 fabricated owner flag in call arguments does not authorize',async()=>{
 const x=createMock({unauthorized:true});
 await assertReject(()=>x.host.runOnce({projectId:PROJECT,ownerApproved:true,authenticated:true}),'OWNER_SESSION_UNVERIFIED');
 assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-22 injected verification callback error does not leak original text',async()=>{
 const x=createMock({sessionThrows:true});await assertReject(()=>x.host.runOnce({projectId:PROJECT}),'OWNER_SESSION_UNVERIFIED');
 assert.equal(x.fetchCount(),0);
});
test('P3-HTTP-23 invalid host config is rejected',()=>{
 const transport=createMock().trustedTransport;
 assert.throws(()=>new OwnerScopedReadHost({projectId:PROJECT,expectedOwnerSubject:'owner-42',
   transport,verifyOwnerSession:null}),e=>e.code==='HOST_NOT_CONFIGURED');
});
test('P3-HTTP-24 project revision mismatch fails closed across host',async()=>{
 const x=createMock({revision:35,listRevision:36});
 await assert.rejects(()=>x.host.runOnce({projectId:PROJECT}),e=>e.code==='REVISION_CHANGED');
});
