import test from 'node:test';
import assert from 'node:assert/strict';
import {createP6PersistentMcpBackend} from '../persistent-mcp-adapter.mjs';
const owner='test-owner';
function setup(overrides={}){
 const calls=[];
 const db={
   rpc:async(name,args)=>{calls.push({name,args});return {
     status:'success',requestId:args.p_request_id,pendingAdded:1,
     candidatesDuplicated:0,errorsAdded:0,replay:false};},
   select:async(table,{ownerId,filters,limit})=>{
     calls.push({table,ownerId,filters,limit});
     if(table==='english_card_candidates')return [{owner_id:ownerId,term:'rice',status:'pending'}];
     if(table==='english_p6_sync_requests')return [{owner_id:ownerId,status:'success',
        result_json:{pendingAdded:1}}];
     if(table==='english_review_states')return [{owner_id:ownerId,due_at:'2026-11-14T00:00:00Z'}];
     if(table==='english_skill_evidence')return [{
       owner_id:ownerId,skill:'vocabulary',evidence_state:'observed'
     }];
     return [];
   },...overrides
 };
 const instance=createP6PersistentMcpBackend({trustedDb:db,clock:()=>new Date('2026-11-15T00:00:00Z')});
 return {calls,instance};
}
const args={ownerId:owner,action:'sync_learning_session',requestId:'request-sync-000001',
 sourceSessionId:'approved-session-001',candidates:[{term:'hungry',meaningZh:'飢餓的'}],errors:[]};
test('backend only accepts a trusted SQL rpc adapter',()=>{
 assert.throws(()=>createP6PersistentMcpBackend({}),/SERVER_ONLY/);
});
test('P3 sync delegates to P6 atomic RPC with verified server-supplied owner',async()=>{
 const {instance,calls}=setup();
 const r=await instance.syncCandidate(args);
 assert.equal(r.ok,true);
 assert.equal(r.data.pendingAdded,1);
 assert.equal(calls[0].name,'english_p6_ingest_batch');
 assert.equal(calls[0].args.p_owner_id,owner);
 assert.equal(calls[0].args.p_source_session_id,'approved-session-001');
});
test('empty or excessive payload and extra private fields rejected before DB',async()=>{
 const {instance,calls}=setup();
 const empty=await instance.syncCandidate({...args,candidates:[]});
 assert.equal(empty.code,'EMPTY_SYNC');
 const huge=await instance.syncCandidate({...args,candidates:Array.from({length:11},()=>args.candidates[0])});
 assert.equal(huge.ok,false);
 const bad=await instance.syncCandidate({...args,candidates:[{...args.candidates[0],ownerId:'attack'}]});
 assert.equal(bad.ok,false);
 assert.equal(calls.length,0);
});
test('idempotency conflict and unauthorized session are surfaced without raw SQL details',async()=>{
 const {instance}=setup({rpc:async()=>{throw {code:'IDEMPOTENCY_CONFLICT',message:'database secret'}}});
 const r=await instance.syncCandidate(args);
 assert.equal(r.code,'IDEMPOTENCY_CONFLICT');
 assert.ok(!r.message.includes('database secret'));
 const second=setup({rpc:async()=>{throw {code:'LEARNING_SESSION_NOT_AUTHORIZED'}}});
 const y=await second.instance.syncCandidate(args);
 assert.equal(y.code,'LEARNING_SESSION_NOT_AUTHORIZED');
});
test('database outages are retryable but not falsely marked success',async()=>{
 const {instance}=setup({rpc:async()=>{throw Error('secret connection string')}});
 const r=await instance.syncCandidate(args);
 assert.equal(r.ok,false);
 assert.equal(r.retryable,true);
 assert.equal(r.code,'BACKEND_UNAVAILABLE');
});
test('private read methods filter per owner and never invent six-skill CEFR',async()=>{
 const {instance,calls}=setup();
 const c=await instance.listCandidates(owner,10);
 assert.equal(c.items[0].ownerId,owner);
 assert.equal(calls[0].filters.status,'pending');
 const s=await instance.getSyncStatus(owner,args.requestId);
 assert.equal(s.status,'success');
 const due=await instance.getReviewSummary(owner);
 assert.equal(due.dueCount,1);
 const profile=await instance.getProfile(owner);
 assert.equal(profile.skills.vocabulary.state,'observed');
 assert.equal(profile.skills.speaking.state,'not-tested');
 assert.equal(profile.skills.speaking.cefrLevel,null);
});
test('unexpected cross-owner DB result is treated as a hard error',async()=>{
 const {instance}=setup({select:async()=>[{owner_id:'another-user',term:'private'}]});
 await assert.rejects(()=>instance.listCandidates(owner),/BACKEND_OWNER_SCOPE_VIOLATION/);
});
test('formal card creation fails closed until approved service RPC is integrated',async()=>{
 const {instance}=setup();
 const r=await instance.addVocabulary({ownerId:owner,term:'apple'});
 assert.equal(r.ok,false);
 assert.equal(r.code,'FORMAL_WRITE_NOT_CONFIGURED');
});
