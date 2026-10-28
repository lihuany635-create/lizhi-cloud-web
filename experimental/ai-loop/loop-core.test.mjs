import test from 'node:test';
import assert from 'node:assert/strict';
import { SandboxLoop, LoopError } from './loop-core.mjs';
const H = 'a'.repeat(64), now = '2026-10-28T03:00:00.000Z', future = '2026-10-28T04:00:00.000Z';
function make({ mode = 'MANUAL', riskTier = 'L1', taskId = 'T1', projectId = 'P1', maxRepairCycles = 2 } = {}) {
  const l = new SandboxLoop({ maxRepairCycles }); l.plan({ taskId, projectId, goal: 'test', acceptanceCriteria: 'evidence-based acceptance', allowedTools: ['mock.write'], riskTier }); l.setMode(mode); return l;
}
function ready(l, { taskId = 'T1', projectId = 'P1', kind = 'manual', eventId = 'E1' } = {}) {
  l.trigger({ taskId, projectId, kind, eventId, allowlisted: true });
  let t = l.get(taskId, projectId);
  t = l.claim({ taskId, projectId, workerId: 'executor', expectedRevision: t.revision, leaseUntil: future });
  return l.begin({ taskId, projectId, workerId: 'executor', expectedRevision: t.revision });
}
function submit(l, req = 'req-1') {const t=l.get('T1','P1');return l.submit({taskId:'T1',projectId:'P1',workerId:t.executorId,expectedRevision:t.revision,requestId:req,result:{ok:true}})}
function review(l, accept, defects = []) {const t=l.get('T1','P1');return l.review({taskId:'T1',projectId:'P1',reviewerId:'reviewer',expectedRevision:t.revision,actualReadback:true,artifactSha256:H,scope:'sandbox-only',accept,defects})}
function err(fn, code) { assert.throws(fn, e=>e instanceof LoopError && e.code===code); }

test('AT01 Manual five-role flow reaches RECORDED only after readback handoff', ()=>{
  const l=make();ready(l);submit(l);let t=review(l,true);assert.equal(t.state,'REVIEW_PASSED');
  err(()=>l.handoff({taskId:'T1',projectId:'P1',expectedRevision:t.revision,workbenchRecordId:'W1',workbenchRevision:11,readbackVerified:false}),'HANDOFF_NOT_VERIFIED');
  t=l.handoff({taskId:'T1',projectId:'P1',expectedRevision:t.revision,workbenchRecordId:'MOCK-W1',workbenchRevision:11,readbackVerified:true});
  assert.equal(t.state,'RECORDED');assert.equal(t.handoff.scope,'sandbox-only');assert.deepEqual(l.events.filter(e=>e.event==='RECORDED').length,1);
});
test('AT02 Auto only on allowlisted events, dedupe event and OFF mode blocks', ()=>{
  const l=make({mode:'AUTO'});
  err(()=>l.trigger({taskId:'T1',projectId:'P1',kind:'auto',eventId:'E1'}),'TRIGGER_NOT_AUTHORIZED');
  assert.equal(l.trigger({taskId:'T1',projectId:'P1',kind:'auto',eventId:'E1',allowlisted:true}).duplicate,false);
  assert.equal(l.trigger({taskId:'T1',projectId:'P1',kind:'auto',eventId:'E1',allowlisted:true}).duplicate,true);
  l.setMode('OFF');err(()=>l.trigger({taskId:'T1',projectId:'P1',kind:'auto',eventId:'E2',allowlisted:true}),'TRIGGER_NOT_AUTHORIZED');
});
test('AT03 Reviewer finds defect, Repairer fixes, Reviewer rechecks', ()=>{
  const l=make();ready(l);submit(l);assert.equal(review(l,false,['wrong-size']).state,'NEEDS_REVISION');
  let t=l.get('T1','P1');t=l.repair({taskId:'T1',projectId:'P1',workerId:'repairer',expectedRevision:t.revision});
  assert.equal(t.repairCycles,1);submit(l,'req-2');assert.equal(review(l,true).state,'REVIEW_PASSED');
});
test('AT04 Exactly two repair cycles allowed, third rejected by NEEDS_OWNER', ()=>{
  const l=make();ready(l);for(let i=0;i<3;i++){
    submit(l,`req-${i}`);const t=review(l,false,['defect']);
    if(i<2){assert.equal(t.state,'NEEDS_REVISION');l.repair({taskId:'T1',projectId:'P1',workerId:'repairer',expectedRevision:t.revision});}
    else assert.equal(t.state,'NEEDS_OWNER');
  }
});
test('AT05 Unknown effect requires readback; stale revisions fail and no auto rerun', ()=>{
  const l=make();const t=ready(l);
  err(()=>l.submit({taskId:'T1',projectId:'P1',workerId:'executor',expectedRevision:t.revision-1,requestId:'r1',result:{}}),'STALE_REVISION');
  const r=l.submit({taskId:'T1',projectId:'P1',workerId:'executor',expectedRevision:t.revision,requestId:'r1',result:{},uncertain:true});
  assert.equal(r.task.state,'NEEDS_OWNER');assert.equal(l.readEffect('P1','r1').uncertain,true);
  assert.equal(l.effects.size,1);err(()=>ready(l),'INVALID_TRANSITION');
});
test('AT05 Duplicate event with same ID cannot be assigned to a different task', ()=>{
  const l=make();l.plan({taskId:'T2',projectId:'P1',goal:'second',acceptanceCriteria:'tested'});
  l.trigger({taskId:'T1',projectId:'P1',kind:'manual',eventId:'E1'});
  err(()=>l.trigger({taskId:'T2',projectId:'P1',kind:'manual',eventId:'E1'}),'EVENT_ID_CONFLICT');
});
test('AT05 Replayed identical requestId returns original result and no second effect', ()=>{
  const l=make();ready(l);const original=submit(l, 'req-repeat');
  const reread=l.submit({taskId:'T1',projectId:'P1',workerId:'executor',expectedRevision:1,requestId:'req-repeat',result:{ok:true}});
  assert.equal(reread.duplicate,true);assert.equal(l.effects.size,1);
  assert.equal(l.get('T1','P1').revision,original.task.revision);
  err(()=>l.submit({taskId:'T1',projectId:'P1',workerId:'executor',expectedRevision:1,requestId:'req-repeat',result:{ok:false}}),'REQUEST_ID_CONFLICT');
});
test('AT06 Pause and STOP prevent claim; queued tasks canceled, active effects unresolved', ()=>{
  const l=make();l.trigger({taskId:'T1',projectId:'P1',kind:'manual',eventId:'E1'});
  l.pause();err(()=>l.claim({taskId:'T1',projectId:'P1',workerId:'exec',expectedRevision:2,leaseUntil:future}),'PAUSED_OR_STOPPED');
  l.resume();l.claim({taskId:'T1',projectId:'P1',workerId:'exec',expectedRevision:2,leaseUntil:future});
  l.stop();assert.equal(l.get('T1','P1').state,'NEEDS_OWNER');
  err(()=>l.setMode('AUTO'),'STOPPED');
});
test('AT07 L0/L1 mock tools allowed, L2 protected action requires valid owner approval', ()=>{
  const l=make({riskTier:'L2'});
  err(()=>l.authorize({taskId:'T1',projectId:'P1',toolName:'mock.write'}),'OWNER_APPROVAL_REQUIRED');
  const approval={approvedBy:'owner',projectId:'P1',taskId:'T1',toolName:'mock.write',riskTier:'L2',expiresAt:future};
  assert.equal(l.authorize({taskId:'T1',projectId:'P1',toolName:'mock.write',approval,at:now}),true);
  err(()=>l.authorize({taskId:'T1',projectId:'P1',toolName:'mock.write',approval:{...approval,revokedAt:now},at:now}),'OWNER_APPROVAL_REQUIRED');
  err(()=>l.authorize({taskId:'T1',projectId:'P1',toolName:'mock.write',approval:{...approval,projectId:'P2'},at:now}),'OWNER_APPROVAL_REQUIRED');
});
test('AT07 Paid APIs and nonallowlisted tools disabled even if otherwise approved', ()=>{
  const l=make();err(()=>l.authorize({taskId:'T1',projectId:'P1',toolName:'finance_create_transaction'}),'TOOL_NOT_ALLOWLISTED');
  err(()=>l.authorize({taskId:'T1',projectId:'P1',toolName:'mock.write',paidApi:true}),'PAID_API_DISABLED');
  err(()=>new SandboxLoop({externalApiBudget:1}),'PAID_API_DISABLED');
});
test('AT08 Missing SHA, fresh readback or separate reviewer prevents PASS', ()=>{
  const l=make();ready(l);submit(l);const t=l.get('T1','P1');
  err(()=>l.review({taskId:'T1',projectId:'P1',reviewerId:'executor',expectedRevision:t.revision,actualReadback:true,artifactSha256:H,scope:'sandbox',accept:true}),'REVIEW_NOT_SEPARATED');
  err(()=>l.review({taskId:'T1',projectId:'P1',reviewerId:'reviewer',expectedRevision:t.revision,actualReadback:true,artifactSha256:'fake',scope:'sandbox',accept:true}),'MISSING_REAL_EVIDENCE');
  err(()=>l.review({taskId:'T1',projectId:'P1',reviewerId:'reviewer',expectedRevision:t.revision,actualReadback:false,artifactSha256:H,scope:'sandbox',accept:true}),'MISSING_REAL_EVIDENCE');
});
test('AT09 Snapshot restore prevents replaying past event and preserves attempt', ()=>{
  const l=make({mode:'AUTO'});ready(l,{kind:'auto'});submit(l);const snapshot=l.snapshot();const r=SandboxLoop.restore(snapshot);
  assert.equal(r.get('T1','P1').state,'SUBMITTED');assert.equal(r.get('T1','P1').attempt,1);
  assert.equal(r.trigger({taskId:'T1',projectId:'P1',kind:'auto',eventId:'E1',allowlisted:true}).duplicate,true);
  assert.equal(r.effects.size,1);assert.equal(review(r,true).state,'REVIEW_PASSED');
});
test('AT10 Cross-project read and action rejected', ()=>{
  const l=make();err(()=>l.get('T1','P2'),'WRONG_PROJECT');
  err(()=>l.trigger({taskId:'T1',projectId:'P2',kind:'manual',eventId:'E1'}),'WRONG_PROJECT');
});
test('Lease expiration never blindly retries external work', ()=>{
  const l=make();l.trigger({taskId:'T1',projectId:'P1',kind:'manual',eventId:'E1'});
  const t=l.claim({taskId:'T1',projectId:'P1',workerId:'executor',expectedRevision:2,leaseUntil:future});
  err(()=>l.expireLease({taskId:'T1',projectId:'P1',timestamp:now}),'LEASE_STILL_VALID');
  const exp=l.expireLease({taskId:'T1',projectId:'P1',timestamp:future});
  assert.equal(exp.state,'EXPIRED');assert.equal(l.effects.size,0);
  err(()=>l.claim({taskId:'T1',projectId:'P1',workerId:'executor',expectedRevision:exp.revision,leaseUntil:future}),'INVALID_TRANSITION');
});
test('Full loop never confuses review with author-approved state', ()=>{
  const l=make();ready(l);submit(l);const t=review(l,true);
  assert.equal(t.state,'REVIEW_PASSED');assert.equal(t.handoff,null);
  assert.equal(Object.hasOwn(t,'authorApproved'),false);
});
