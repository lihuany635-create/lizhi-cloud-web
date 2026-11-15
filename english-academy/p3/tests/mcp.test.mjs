import test from 'node:test';
import assert from 'node:assert/strict';
import {createMcpHandler,MCP_TOOLS,MCP_VERSION} from '../mcp-server.mjs';
import {createCandidateBackend} from '../memory-backend.mjs';

const A='test-owner-a',B='test-owner-b',APP='verified-english-chatgpt';
const allScopes=['english:read','english:candidate','english:formal_write'];
const ORIGIN='https://chatgpt.com';
const now=new Date('2026-11-15T05:00:00.000Z');

function testContext(options={}){
  const backend=createCandidateBackend({now:()=>now});
  const verified=async({bearer})=>{
    if(bearer==='bad')throw Error('bad token');
    const actor=bearer==='alice'?{userId:A,scopes:allScopes}:
      bearer==='bob'?{userId:B,scopes:['english:read','english:candidate']}:
      bearer==='read-only'?{userId:A,scopes:['english:read']}:
      bearer==='spoofed'?{userId:A,scopes:allScopes,serverVerified:false}:
      null;
    return actor?{...actor,serverVerified:actor.serverVerified!==false,
      verifiedClientId:APP,active:true}:null;
  };
  const auth=options.authenticate??verified;
  const verifyApproval=options.verifyApproval??(async()=>({verified:false}));
  const handle=createMcpHandler({authenticate:auth,backend,verifyApproval,
    allowedOrigins:[ORIGIN]});
  return {backend,handle};
}
let seq=0;
function req(method,params={},options={}){
  const meta={
    'io.modelcontextprotocol/protocolVersion':options.version??MCP_VERSION,
    'io.modelcontextprotocol/clientInfo':{name:'attacker-can-claim-anything'},
    'io.modelcontextprotocol/clientCapabilities':{},
    ...(options.meta??{}),
  };
  const json={jsonrpc:'2.0',id:++seq,method,params:{...params,_meta:meta}};
  const body=options.body??json;
  return new Request('https://example.invalid/english/mcp',{
    method:'POST',
    headers:{
      'content-type':options.contentType??'application/json',
      'mcp-protocol-version':options.headerVersion??MCP_VERSION,
      authorization:'Bearer '+(options.token??'alice'),
      origin:options.origin??ORIGIN,
    },
    body:typeof body==='string'?body:JSON.stringify(body),
  });
}
async function invoke(ctx,toolName,args={},options={}){
  const response=await ctx.handle(req('tools/call',{name:toolName,arguments:args},options));
  const json=await response.json();
  const entry=json.result?.content?.[0];
  return {http:response.status,rpc:json,error:json.result?.isError??false,
    content:entry?.text?JSON.parse(entry.text):null};
}
const authorizedSession='english-session-00001';
const sampleCandidates=[{term:'hungry',meaningZh:'餓的'}];
const sampleErrors=[{original:"I hasn't ate.",corrected:"I haven't eaten.",
  explanation:'Present perfect needs have/has + past participle.'}];
const syncArgs={requestId:'sync-request-000001',sourceSessionId:authorizedSession,
  candidates:sampleCandidates,errors:sampleErrors};

test('stateless server discovery advertises 2026-07-28 tools capability',async()=>{
  const ctx=testContext();
  const response=await ctx.handle(req('server/discover'));
  const data=await response.json();
  assert.equal(response.status,200);
  assert.equal(data.result.supportedVersions[0],MCP_VERSION);
  assert.equal(data.result.capabilities.tools.listChanged,false);
});

test('tools/list returns stable read and candidate/approved-write schemas',async()=>{
  const ctx=testContext();
  const data=await (await ctx.handle(req('tools/list'))).json();
  assert.equal(data.result.resultType,'complete');
  assert.deepEqual(data.result.tools.map(x=>x.name),MCP_TOOLS.map(x=>x.name));
  assert.ok(data.result.tools.every(x=>x.inputSchema.additionalProperties===false));
  assert.ok(!data.result.tools.some(x=>/delete|reset|deploy/.test(x.name)));
});

test('read-only scope hides all mutating tools',async()=>{
  const ctx=testContext();
  const data=await (await ctx.handle(req('tools/list',{}, {token:'read-only'}))).json();
  assert.equal(data.result.tools.length,4);
  assert.ok(data.result.tools.every(x=>x.annotations.readOnlyHint));
});

test('headers and per-request metadata must match protocol version',async()=>{
  const ctx=testContext();
  const r=await ctx.handle(req('tools/list',{}, {headerVersion:'2025-11-25'}));
  assert.equal(r.status,400);
  assert.match((await r.json()).error.message,/HeaderMismatch/);
});

test('unsupported version fails without dispatching tool call',async()=>{
  const ctx=testContext();
  const r=await ctx.handle(req('tools/list',{}, {headerVersion:'2025-11-25',version:'2025-11-25'}));
  assert.equal(r.status,400);
  assert.match((await r.json()).error.message,/UnsupportedProtocol/);
});

test('wrong origin refused before identity check',async()=>{
  let touched=false;
  const ctx=testContext({authenticate:async()=>{touched=true;return null}});
  const r=await ctx.handle(req('tools/list',{}, {origin:'https://evil.invalid'}));
  assert.equal(r.status,403);
  assert.equal(touched,false);
});

test('missing or revoked bearer fails closed',async()=>{
  const ctx=testContext();
  const a=req('tools/list',{}, {token:'bad'});
  assert.equal((await ctx.handle(a)).status,401);
  const b=req('tools/list');
  b.headers.delete('authorization');
  assert.equal((await ctx.handle(b)).status,401);
});

test('fake clientInfo and unverified actor cannot claim owner identity',async()=>{
  const ctx=testContext();
  const r=await ctx.handle(req('tools/list',{}, {token:'spoofed',
    meta:{'io.modelcontextprotocol/clientInfo':{name:APP,userId:B,ownerId:B}}}));
  assert.equal(r.status,403);
});

test('arbitrary reset/delete tools cannot be called',async()=>{
  const ctx=testContext();
  for(const name of ['delete_learning_record','reset_learning_progress','arbitrary_sql']){
    const r=await ctx.handle(req('tools/call',{name,arguments:{}}));
    assert.equal((await r.json()).error.code,-32601);
  }
});

test('candidate writes require a previously website-approved learning session',async()=>{
  const ctx=testContext();
  const result=await invoke(ctx,'sync_learning_session',syncArgs);
  assert.equal(result.error,true);
  assert.equal(result.content.code,'LEARNING_SESSION_NOT_AUTHORIZED');
  assert.equal(ctx.backend.inspectionSnapshot(A).candidates.length,0);
});

test('authorized sync writes candidate+error and both are scoped to owner',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  const r=await invoke(ctx,'sync_learning_session',syncArgs);
  assert.equal(r.error,false);
  assert.equal(r.content.pendingAdded,1);
  assert.equal(r.content.errorsAdded,1);
  const list=await invoke(ctx,'list_card_candidates',{}, {token:'alice'});
  assert.equal(list.content.items.length,1);
  assert.equal(list.content.items[0].ownerId,A);
  const b=await invoke(ctx,'list_card_candidates',{}, {token:'bob'});
  assert.equal(b.content.items.length,0);
  const privateErrors=ctx.backend.inspectionSnapshot(A).errors;
  assert.equal(privateErrors[0].original,"I hasn't ate.");
  assert.equal(ctx.backend.inspectionSnapshot(B).errors.length,0);
});

test('idempotent retry returns replay and does not duplicate candidate or error',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  const first=await invoke(ctx,'sync_learning_session',syncArgs);
  const second=await invoke(ctx,'sync_learning_session',syncArgs);
  assert.equal(first.content.replay,false);
  assert.equal(second.content.replay,true);
  assert.equal(ctx.backend.inspectionSnapshot(A).candidates.length,1);
  assert.equal(ctx.backend.inspectionSnapshot(A).errors.length,1);
});

test('same requestId with changed payload fails and does not mutate data',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  await invoke(ctx,'sync_learning_session',syncArgs);
  const change=await invoke(ctx,'sync_learning_session',{...syncArgs,
    candidates:[{term:'sleepy',meaningZh:'想睡的'}]});
  assert.equal(change.error,true);
  assert.equal(change.content.code,'IDEMPOTENCY_CONFLICT');
  assert.equal(ctx.backend.inspectionSnapshot(A).candidates.length,1);
});

test('transient failure can be retried with same request, and is queryable',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  ctx.backend.setTransientFailure({ownerId:A,requestId:syncArgs.requestId});
  const first=await invoke(ctx,'sync_learning_session',syncArgs);
  assert.equal(first.error,true);
  assert.equal(first.content.retryable,true);
  assert.equal(ctx.backend.inspectionSnapshot(A).candidates.length,0);
  const during=await invoke(ctx,'get_sync_status',{requestId:syncArgs.requestId});
  assert.equal(during.content.status,'retryable');
  const second=await invoke(ctx,'sync_learning_session',syncArgs);
  assert.equal(second.error,false);
  assert.equal(second.content.pendingAdded,1);
  const after=await invoke(ctx,'get_sync_status',{requestId:syncArgs.requestId});
  assert.equal(after.content.status,'success');
  assert.equal(after.content.attempts,2);
});

test('candidate and error tools accept their own scoped payloads',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  const one=await invoke(ctx,'create_card_candidates',{
    requestId:'only-candidate-00001',sourceSessionId:authorizedSession,
    candidates:[{term:'rice',meaningZh:'米飯'}]});
  assert.equal(one.error,false);
  const two=await invoke(ctx,'record_language_errors',{
    requestId:'only-error-0000001',sourceSessionId:authorizedSession,
    errors:sampleErrors});
  assert.equal(two.error,false);
  assert.equal(ctx.backend.inspectionSnapshot(A).candidates.length,1);
  assert.equal(ctx.backend.inspectionSnapshot(A).errors.length,1);
});

test('profile never invents CEFR, speaking or listening evidence',async()=>{
  const ctx=testContext();
  const r=await invoke(ctx,'get_learning_profile');
  assert.equal(r.error,false);
  assert.equal(r.content.skills.speaking.state,'not-tested');
  assert.equal(r.content.skills.listening.cefrLevel,null);
  assert.equal(Object.keys(r.content.skills).length,6);
});

test('review summary reads due dates from persisted learning state',async()=>{
  const ctx=testContext();
  ctx.backend.seedReview({ownerId:A,cardId:'demo-one',dueAt:'2026-11-14T00:00:00.000Z'});
  ctx.backend.seedReview({ownerId:A,cardId:'demo-two',dueAt:'2026-11-16T00:00:00.000Z'});
  ctx.backend.seedReview({ownerId:B,cardId:'other-one',dueAt:'2026-11-14T00:00:00.000Z'});
  const a=await invoke(ctx,'get_review_summary');
  const b=await invoke(ctx,'get_review_summary',{}, {token:'bob'});
  assert.equal(a.content.dueCount,1);
  assert.equal(a.content.trackedCards,2);
  assert.equal(b.content.dueCount,1);
  assert.equal(b.content.trackedCards,1);
});

test('explicit formal card is refused even with model-supplied userConfirmed',async()=>{
  const ctx=testContext();
  const r=await invoke(ctx,'add_vocabulary',{requestId:'add-approved-0000001',
    term:'banana',meaningZh:'香蕉',userConfirmed:true});
  assert.equal(r.error,true);
  assert.equal(r.content.code,'UNEXPECTED_ARGUMENT');
  const clean=await invoke(ctx,'add_vocabulary',{requestId:'add-approved-0000001',
    term:'banana',meaningZh:'香蕉'});
  assert.equal(clean.error,true);
  assert.equal(clean.content.code,'EXPLICIT_APPROVAL_REQUIRED');
  assert.equal(ctx.backend.inspectionSnapshot(A).cards.length,0);
});

test('server-verified action-specific approval admits formal card and replay is safe',async()=>{
  const ctx=testContext({verifyApproval:async({actor,action,requestId})=>({
    verified:requestId==='add-approved-0000001',
    ownerId:actor.userId,action,requestId
  })});
  const args={requestId:'add-approved-0000001',term:'banana',meaningZh:'香蕉'};
  const one=await invoke(ctx,'add_vocabulary',args);
  const two=await invoke(ctx,'add_vocabulary',args);
  assert.equal(one.error,false);
  assert.equal(two.content.replay,true);
  assert.equal(ctx.backend.inspectionSnapshot(A).cards.length,1);
});

test('different owner account sees no other sync status',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  await invoke(ctx,'sync_learning_session',syncArgs);
  const b=await invoke(ctx,'get_sync_status',{requestId:syncArgs.requestId},{token:'bob'});
  assert.equal(b.content.status,'not-found');
});

test('read-only scope cannot write candidate cards',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  const r=await invoke(ctx,'sync_learning_session',syncArgs,{token:'read-only'});
  assert.equal(r.error,true);
  assert.equal(r.content.code,'SCOPE_DENIED');
});

test('input schema rejects unexpected ownerId, excessive candidates, empty error',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  const injected=await invoke(ctx,'sync_learning_session',{...syncArgs,ownerId:B});
  assert.equal(injected.content.code,'UNEXPECTED_ARGUMENT');
  const massive=await invoke(ctx,'sync_learning_session',{...syncArgs,
    candidates:Array.from({length:11},(_,i)=>({term:'word'+i,meaningZh:'詞'}))});
  assert.equal(massive.content.code,'INVALID_CANDIDATES');
  const invalid=await invoke(ctx,'record_language_errors',{
    requestId:'error-no-body-000001',sourceSessionId:authorizedSession,
    errors:[{original:'a',corrected:'b',explanation:''}]});
  assert.equal(invalid.content.code,'INVALID_ERROR');
});

test('JSON request rejects unknown methods, invalid batch, malformed JSON',async()=>{
  const ctx=testContext();
  const unknown=await ctx.handle(req('session/delete'));
  assert.equal((await unknown.json()).error.code,-32601);
  const invalid=req('tools/list',{}, {body:[{jsonrpc:'2.0',id:1,method:'tools/list'}]});
  assert.equal(invalid.status??null,undefined);
  const r=await ctx.handle(invalid);
  assert.equal(r.status,400);
  const malformed=await ctx.handle(req('tools/list',{}, {body:'{not-json'}));
  assert.equal(malformed.status,400);
});

test('audit does not echo original sensitive sentence or auth bearer',async()=>{
  const ctx=testContext();
  ctx.backend.registerLearningSession({ownerId:A,sessionId:authorizedSession,confirmedByWebsite:true});
  await invoke(ctx,'sync_learning_session',syncArgs);
  const audit=JSON.stringify(ctx.backend.inspectionSnapshot(A).audit);
  assert.ok(!audit.includes("hasn't"));
  assert.ok(!audit.includes('alice'));
});
