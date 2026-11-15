import test from 'node:test';
import assert from 'node:assert/strict';
import {createP11WebCardApi} from '../web-card-api.mjs';

const owner='4efc178f-e255-4e87-9197-d1b286ef892e';
const foreign='655c257f-cfef-45dc-a67e-9c37be81713e';
const cardId='2d809dfb-4081-43a3-83e6-fc6849be71be';
const candidateId='a756ac18-6742-48a2-8c78-c6802482bfa1';
const origin='https://lihuany635-create.github.io';
const endpoint='https://english.example/functions/v1/lizhi-english-academy/';
const actor={serverVerified:true,identityType:'google-user',ownerId:owner,
 sessionId:'b02bef33-e271-4639-993b-6176d4d04968',
 scopes:['english:read','english:candidate']};

function fixture({user=actor,verifyThrows=false,leak=false}={}){
 const calls=[],candidates=[],cards=[],errors=[];
 const db={
  async select(table,{ownerId,filters,limit}){
   calls.push({action:'select',table,ownerId,filters,limit});
   const entries={'english_cards':cards,
     'english_card_candidates':candidates,
     'english_error_records':errors}[table];
   return leak?[{owner_id:foreign,id:'injected'}]:
     entries.filter(x=>x.owner_id===ownerId&&
       (!filters.status||x.status===filters.status));
  },
  async rpc(name,payload){
   calls.push({action:'rpc',name,payload});
   assert.equal(payload.p_owner_id,owner);
   if(name==='english_web_create_candidate'){
     const c={id:candidateId,owner_id:owner,term:payload.p_term,
       meaning_zh:payload.p_meaning_zh,status:'pending'};
     candidates.push(c);
     return {status:'pending',id:c.id};
   }
   if(name==='english_web_promote_candidate'){
     const c=candidates.find(x=>x.id===payload.p_candidate_id);
     if(!c||c.status!=='pending')throw {code:'CANDIDATE_NOT_PENDING'};
     assert.match(payload.p_payload_digest,/^[a-f0-9]{64}$/);
     c.status='accepted';
     cards.push({id:cardId,owner_id:owner,term:c.term,meaning_zh:c.meaning_zh});
     return {status:'accepted',card_id:cardId};
   }
   if(name==='english_web_ignore_candidate'){
     const c=candidates.find(x=>x.id===payload.p_candidate_id);
     if(!c||c.status!=='pending')throw {code:'CANDIDATE_NOT_PENDING'};
     c.status='ignored';return {status:'ignored',candidate_id:c.id};
   }
   throw Error('unrecognized RPC');
  }
 };
 const api=createP11WebCardApi({
  verifyOwner:async()=>{if(verifyThrows)throw Error('revoked');return user;},
  trustedDb:db,allowedOrigin:origin
 });
 return {api,calls,cards,candidates,errors};
}
async function ask(api,action,{method='GET',body,token='test-token',
 requestOrigin=origin,headers={}}={}){
 const req=new Request(endpoint+action,{
  method,headers:{...requestOrigin?{origin:requestOrigin}:{},
   ...token?{authorization:'Bearer '+token}:{},
   ...(body?{'content-type':'application/json'}:{}),...headers},
  body:body?JSON.stringify(body):undefined
 });
 const response=await api(req);
 return {status:response.status,data:response.status===204?null:await response.json(),
  headers:response.headers};
}
const newCandidate={requestId:'new-candidate-0001',term:'museum',meaningZh:'博物館'};
test('Google owner can create a pending card then explicitly promote using atomic RPC',async()=>{
 const f=fixture();
 assert.equal((await ask(f.api,'status')).data.ownerVerified,true);
 const pending=await ask(f.api,'candidate',{method:'POST',body:newCandidate});
 assert.equal(pending.status,201);
 assert.equal(pending.data.status,'pending');
 assert.equal(f.cards.length,0,'candidate must not silently become formal card');
 assert.equal((await ask(f.api,'candidates')).data.items.length,1);
 const accepted=await ask(f.api,'accept',{method:'POST',body:{
  requestId:'promotion-request-01',candidateId
 }});
 assert.equal(accepted.status,200);
 assert.equal(accepted.data.status,'accepted');
 assert.equal(f.cards.length,1);
 assert.equal((await ask(f.api,'cards')).data.items[0].term,'museum');
 assert.equal((await ask(f.api,'candidates')).data.items.length,0);
 assert.equal(f.calls.filter(x=>x.action==='rpc').length,2);
});
test('ignoring candidate leaves it off the formal card list',async()=>{
 const f=fixture();
 await ask(f.api,'candidate',{method:'POST',body:newCandidate});
 const ignored=await ask(f.api,'ignore',{method:'POST',body:{
  requestId:'ignore-request-1234',candidateId
 }});
 assert.equal(ignored.data.status,'ignored');
 assert.equal(f.cards.length,0);
 assert.equal((await ask(f.api,'candidates')).data.items.length,0);
});
test('invalid origin and missing bearer fail before touching DB',async()=>{
 const f=fixture();
 assert.equal((await ask(f.api,'candidate',{method:'POST',body:newCandidate,
  requestOrigin:'https://attacker.example'})).status,403);
 assert.equal((await ask(f.api,'candidate',{method:'POST',body:newCandidate,
  token:''})).status,401);
 assert.equal(f.calls.length,0);
});
test('revoked auth or unverified actor never writes',async()=>{
 for(const options of [{verifyThrows:true},{user:{...actor,serverVerified:false}},
   {user:{...actor,identityType:'chatgpt-site'}},
   {user:{...actor,scopes:['english:read']}}]){
  const f=fixture(options);
  const response=await ask(f.api,'candidate',{method:'POST',body:newCandidate});
  assert.ok([401,403].includes(response.status));
  assert.equal(f.calls.length,0);
 }
});
test('body cannot spoof owner, approval or add formal cards directly',async()=>{
 const f=fixture();
 for(const body of [{...newCandidate,ownerId:foreign},
  {...newCandidate,approved:true},{...newCandidate,userConfirmed:true},
  {...newCandidate,requestId:'short'}]){
  assert.equal((await ask(f.api,'candidate',{method:'POST',body})).status,400);
 }
 assert.equal((await ask(f.api,'card',{method:'POST',body:newCandidate})).status,404);
 assert.equal(f.calls.length,0);
});
test('cross-owner backend row causes a private fail-closed response',async()=>{
 const f=fixture({leak:true});
 const res=await ask(f.api,'cards');
 assert.equal(res.status,503);
 assert.equal(res.data.code,'ENGLISH_BACKEND_UNAVAILABLE');
 assert.doesNotMatch(JSON.stringify(res.data),new RegExp(foreign));
});
test('unknown candidate and conflicting action return stable error without DB details',async()=>{
 const f=fixture();
 const res=await ask(f.api,'accept',{method:'POST',body:{
  requestId:'request-for-unknown',candidateId
 }});
 assert.equal(res.status,409);
 assert.equal(res.data.code,'CANDIDATE_NOT_PENDING');
});
test('CORS preflight does not authenticate or mutate, and no local fallback',async()=>{
 const f=fixture({verifyThrows:true});
 const res=await ask(f.api,'candidate',{method:'OPTIONS',token:''});
 assert.equal(res.status,204);
 assert.equal(res.headers.get('access-control-allow-origin'),origin);
 assert.equal(f.calls.length,0);
});
