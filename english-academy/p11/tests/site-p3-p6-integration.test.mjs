import test from 'node:test';
import assert from 'node:assert/strict';
import {createExistingSiteEnglishExtension} from '../site-mcp-extension.mjs';
import {createCandidateBackend} from '../../p3/memory-backend.mjs';
import {createLedger,addCandidate} from '../../conversation/ledger.mjs';
import {proposeExistingAcademySync} from '../../conversation/p6-bridge.mjs';
import {createMcpHandler,MCP_VERSION} from '../../p3/mcp-server.mjs';

const owner='4efc178f-e255-4e87-9197-d1b286ef892e';
const actor={serverVerified:true,ownerId:owner,scopes:['english:read','english:candidate']};
const request=new Request('https://private-site.example/mcp',{method:'POST'});
const fakeBackend=createCandidateBackend({now:()=>new Date('2026-11-15T12:00:00.000Z')});
fakeBackend.registerLearningSession({ownerId:owner,sessionId:'approved-synthetic-session',confirmedByWebsite:true});
const handleP3=createMcpHandler({
 authenticate:async()=>({serverVerified:true,active:true,userId:owner,
   verifiedClientId:'synthetic-site-client',scopes:['english:read','english:candidate']}),
 backend:fakeBackend,allowedOrigins:[]
});
const invokeEnglish=async({actor:verified,toolName,arguments:args})=>{
 if(verified.ownerId!==owner)throw new Error('Owner mapping mismatch');
 const body={jsonrpc:'2.0',id:'synthetic-session-rpc',method:'tools/call',
   params:{name:toolName,arguments:args,_meta:{
     'io.modelcontextprotocol/protocolVersion':MCP_VERSION,
     'io.modelcontextprotocol/clientCapabilities':{}
   }}};
 const r=await handleP3(new Request('https://candidate-backend.example/mcp',{
  method:'POST',headers:{
   Authorization:'Bearer synthetic-runtime-token',
   'content-type':'application/json',
   'mcp-protocol-version':MCP_VERSION
  },body:JSON.stringify(body)
 }));
 const j=await r.json();
 if(r.status!==200||!j.result)throw new Error('P3 MCP unavailable');
 const content=JSON.parse(j.result.content[0].text);
 return j.result.isError?{ok:false,...content}:{ok:true,data:content};
};
const bridge=createExistingSiteEnglishExtension({
 isReady:async()=>true,verifySiteOwner:async()=>actor,
 invokeEnglish,baselineNames:['aiwb_overview','list_projects','get_project','create_project',
  'list_project_images','read_project_image','import_project_image','update_project_image']
});
async function use(name,args){
 const answer=await bridge.toolCall({request,body:{jsonrpc:'2.0',id:1,method:'tools/call',
  params:{name,arguments:args}}});
 return JSON.parse(answer.result.content[0].text);
}

test('Site English MCP -> P3 tools/call -> candidate backend records errors and pending cards',async()=>{
 const requestId='synced-chat-1234567890';
 const created=await use('english_sync_learning_session',{
  requestId,sourceSessionId:'approved-synthetic-session',
  errors:[{original:'He go to school yesterday.',
    corrected:'He went to school yesterday.',explanation:'Past tense go → went'}],
  candidates:[{term:'department store',meaningZh:'百貨公司'}]
 });
 assert.equal(created.ok,true);
 assert.equal(created.data.status,'success');
 assert.equal(created.data.pendingAdded,1);
 assert.equal(created.data.errorsAdded,1);
 const again=await use('english_sync_learning_session',{
  requestId,sourceSessionId:'approved-synthetic-session',
  errors:[{original:'He go to school yesterday.',
    corrected:'He went to school yesterday.',explanation:'Past tense go → went'}],
  candidates:[{term:'department store',meaningZh:'百貨公司'}]
 });
 assert.equal(again.data.replay,true);
 const pending=await use('english_list_card_candidates',{limit:10});
 assert.equal(pending.data.items.length,1);
 const snapshot=fakeBackend.inspectionSnapshot(owner);
 assert.equal(snapshot.errors.length,1);
 assert.equal(snapshot.cards.length,0); // A candidate is NOT an approved flashcard.
});
test('unapproved chat session is rejected by existing P3/P6-style session gate',async()=>{
 const rejected=await use('english_create_card_candidates',{
  requestId:'unapproved-request-123',
  sourceSessionId:'random-unapproved-conversation',
  candidates:[{term:'sweet',meaningZh:'甜的'}]
 });
 assert.equal(rejected.ok,false);
 assert.equal(rejected.code,'LEARNING_SESSION_NOT_AUTHORIZED');
});

test('chat evidence converter feeds original Site MCP P3/P6 candidate flow, not formal cards',async()=>{
 let l=createLedger();
 l=addCandidate(l,{kind:'sentence',original:'She has went to class.',
  correction:'She has gone to class.',meaning:'Use the past participle gone after has.',topic:'class'},
  {id:'synthetic_sentence_1',at:'2026-11-15T10:00:00.000Z'});
 l=addCandidate(l,{kind:'word',original:'musem',correction:'museum',
  meaning:'博物館',topic:'travel'},
  {id:'synthetic_word_1',at:'2026-11-15T10:01:00.000Z'});
 const batch=proposeExistingAcademySync(l);
 assert.equal(batch.status,'proposal-only');
 assert.equal(batch.userApprovedCards,false);
 let i=0;
 for(const action of batch.actions){
  const requestId='chat-proposal-'+String(++i)+'-12345678';
  const argument={requestId,sourceSessionId:'approved-synthetic-session'};
  if(action.errors)argument.errors=action.errors;
  if(action.candidates)argument.candidates=action.candidates;
  const out=await use('english_'+action.tool,argument);
  assert.equal(out.ok,true);
 }
 const data=fakeBackend.inspectionSnapshot(owner);
 assert.ok(data.errors.some(x=>x.original==='She has went to class.'));
 assert.ok(data.candidates.some(x=>x.term==='museum'));
 assert.equal(data.cards.length,0);
});
