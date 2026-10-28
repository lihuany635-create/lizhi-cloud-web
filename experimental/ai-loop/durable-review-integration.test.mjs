import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DurableReviewSandbox,IntegrationError} from './durable-review-integration.mjs';

const P='61b88bec-9b3e-49e6-8780-d073fc816516';
const start=1000;
const err=(fn,code)=>assert.rejects(fn,e=>e.code===code);
const temp=()=>{const dir=mkdtempSync(join(tmpdir(),'loop-integration-'));return {dir,file:join(dir,'queue.sqlite'),clean:()=>rmSync(dir,{recursive:true,force:true})};};
const make=(filename,opts={})=>new DurableReviewSandbox({
 filename,projectId:opts.projectId??P,at:()=>opts.now?.value??start,
 assess:async ({content})=>({defects:content.ready?[]:['not-ready']}),
 repair:async ({content})=>({content:{...content,ready:opts.neverFix?false:true}}),
 onArtifact:opts.onArtifact??(()=>{})
});
const push=(x,suffix='1',ready=true)=>x.enqueue({
 jobId:'job-'+suffix,eventId:'evt-'+suffix,taskId:'task-'+suffix,requestId:'req-'+suffix,
 expectedRevision:46,initialContent:{ready,scope:'sandbox'},at:start
});
async function fixture(fn,opts={}){const t=temp();let a=make(t.file,opts);try{a.initManual();await fn(a,t);}finally{try{a.close();}catch(e){if(e.code!=='ERR_INVALID_STATE')throw e;}t.clean();}}
test('INT-01 P2 queue to P4 review/handoff to P2 submission survives SQLite reopen',async()=>{
 await fixture(async(a,t)=>{
  push(a);const res=await a.runOnce({jobId:'job-1',workerId:'worker-A'});
  assert.equal(res.verdict.status,'RECORDED');assert.equal(res.submission.job.state,'SUBMITTED');
  assert.equal(res.evidence.handoffs.length,1);assert.equal(res.evidence.handoffs[0].authorApproved,false);
  a.close();const b=make(t.file);try{assert.equal(b.queue.get('job-1',P).state,'SUBMITTED');
   assert.equal(b.evidence('job-1').artifacts.length,1);assert.equal(b.evidence('job-1').handoffs.length,1);
   await err(()=>b.runOnce({jobId:'job-1',workerId:'worker-B'}),'RECONCILE_BEFORE_RETRY');
  }finally{b.close();} a=make(t.file);
 });
});
test('INT-02 defects trigger one durable sandbox repair and one handoff',async()=>{
 await fixture(async a=>{push(a,'1',false);
   const r=await a.runOnce({jobId:'job-1',workerId:'worker-A'});
   assert.equal(r.verdict.repairs,1);assert.equal(r.evidence.artifacts.length,2);
   assert.equal(r.evidence.handoffs.length,1);assert.equal(r.submission.job.state,'SUBMITTED');
 });
});
test('INT-03 unrepaired defects stop after maximum repairs and never make handoff',async()=>{
 await fixture(async a=>{a.repair=async ({content})=>({content:{...content,ready:false}});
  push(a,'1',false);const r=await a.runOnce({jobId:'job-1',workerId:'worker-A'});
  assert.equal(r.verdict.status,'NEEDS_OWNER');assert.equal(r.verdict.repairs,2);
  assert.equal(r.submission.job.state,'NEEDS_OWNER');assert.equal(r.evidence.handoffs.length,0);
  assert.equal(r.evidence.artifacts.length,3);
 });
});
test('INT-04 same eventId does not enqueue duplicate jobs',async()=>{
 await fixture(async a=>{const first=push(a);const second=push(a);
  assert.equal(first.duplicate,false);assert.equal(second.duplicate,true);
  assert.equal(a.queue.list({projectId:P}).length,1);
 });
});
test('INT-05 re-execution of a committed job cannot create duplicate artifact or handoff',async()=>{
 await fixture(async a=>{push(a);await a.runOnce({jobId:'job-1',workerId:'worker-A'});
  await err(()=>a.runOnce({jobId:'job-1',workerId:'worker-B'}),'RECONCILE_BEFORE_RETRY');
  assert.equal(a.evidence('job-1').artifacts.length,1);
  assert.equal(a.evidence('job-1').handoffs.length,1);
 });
});
test('INT-06 artifact replay with different payload is rejected, no overwrite',async()=>{
 await fixture(async a=>{push(a);await a.runOnce({jobId:'job-1',workerId:'worker-A'});
  const j=a.queue.get('job-1',P);
  assert.throws(()=>a._artifact(j,'req-1',{attempt:1,content:{ready:false}}),e=>e.code==='ARTIFACT_REPLAY_CONFLICT');
  assert.equal(a.evidence('job-1').artifacts[0].verifiedHash,true);
 });
});
test('INT-07 handoff replay with altered scope is rejected',async()=>{
 await fixture(async a=>{push(a);await a.runOnce({jobId:'job-1',workerId:'worker-A'});
  const job=a.queue.get('job-1',P);
  assert.throws(()=>a._handoff(job,{projectId:P,taskId:'task-1',requestId:'req-1',
   authorApproved:false,scope:'wrong'}),e=>e.code==='HANDOFF_REPLAY_CONFLICT');
 });
});
test('INT-08 unapproved L2/paid API rejected before enqueue',async()=>{
 await fixture(async a=>{
  assert.throws(()=>a.enqueue({jobId:'X',eventId:'Y',taskId:'T',requestId:'R',
    initialContent:{},expectedRevision:1,riskTier:'L2'}),e=>e.code==='APPROVAL_REQUIRED');
  assert.throws(()=>a.enqueue({jobId:'X',eventId:'Y',taskId:'T',requestId:'R',
    initialContent:{},expectedRevision:1,paidApi:true}),e=>e.code==='APPROVAL_REQUIRED');
  assert.equal(a.queue.list().length,0);
 });
});
test('INT-09 AUTO remains disabled as initial state',async()=>{
 const t=temp();const a=make(t.file);
 try{assert.equal(a.queue.control().mode,'OFF');
  assert.throws(()=>push(a),e=>e.code==='PAUSED_OR_STOPPED'||e.code==='TRIGGER_NOT_AUTHORIZED');
 }finally{a.close();t.clean();}
});
test('INT-10 PAUSE prevents new work, and STOP closes in-flight job',async()=>{
 await fixture(async a=>{push(a);a.queue.pause({at:start});
  await err(()=>a.runOnce({jobId:'job-1',workerId:'worker-A'}),'PAUSED_OR_STOPPED');
  a.queue.resume({at:start});
  const prior=a.queue.get('job-1',P);const c=a.queue.claim({jobId:'job-1',projectId:P,workerId:'A',
    expectedRevision:prior.revision,at:start,leaseMs:500});
  a.queue.begin({jobId:'job-1',projectId:P,workerId:'A',expectedRevision:c.revision,at:start});
  a.queue.stop({at:start});assert.equal(a.queue.get('job-1',P).state,'NEEDS_OWNER');
  await err(()=>a.runOnce({jobId:'job-1',workerId:'B'}),'RECONCILE_BEFORE_RETRY');
 });
});
test('INT-11 cross-project job never exposed',async()=>{
 await fixture(async a=>{push(a);
  assert.throws(()=>a.queue.get('job-1','OTHER'),e=>e.code==='WRONG_PROJECT');
 });
});
test('INT-12 unknown claim expiry is fenced and needs readback, never auto-resubmitted',async()=>{
 await fixture(async(a,t)=>{push(a);
  const j=a.queue.get('job-1',P);
  const c=a.queue.claim({jobId:'job-1',projectId:P,workerId:'A',
    expectedRevision:j.revision,at:start,leaseMs:100});
  a.queue.begin({jobId:'job-1',projectId:P,workerId:'A',expectedRevision:c.revision,at:start});
  a.close();
  const now={value:start+500};const b=make(t.file,{now});
  try{const swept=b.sweepExpired();assert.equal(swept.length,1);
    assert.equal(swept[0].state,'RECONCILE_REQUIRED');
    await err(()=>b.runOnce({jobId:'job-1',workerId:'B'}),'RECONCILE_BEFORE_RETRY');
    const r=b.reconcileAfterInspection({jobId:'job-1',readbackId:'checked-1',conclusion:'UNKNOWN'});
    assert.equal(r.state,'NEEDS_OWNER');
  }finally{b.close();}
  a=make(t.file);
 });
});
test('INT-13 recorded sandbox handoff can be independently reconciled after crash',async()=>{
 await fixture(async(a,t)=>{push(a);
  await err(()=>a.runOnce({jobId:'job-1',workerId:'A',leaseMs:100,crashAfterHandoff:true}),
    'SIMULATED_PROCESS_CRASH');
  assert.equal(a.queue.get('job-1',P).state,'RUNNING');
  a.close();const now={value:start+101};const b=make(t.file,{now});
  try{b.sweepExpired();const proof=b.evidence('job-1');
    assert.equal(proof.handoffs.length,1);assert.equal(proof.handoffs[0].confirmedHash,true);
    assert.equal(proof.artifacts.every(x=>x.verifiedHash),true);
    await err(()=>b.runOnce({jobId:'job-1',workerId:'B'}),'RECONCILE_BEFORE_RETRY');
    const r=b.reconcileAfterInspection({jobId:'job-1',readbackId:'confirmed-sandbox-1',
      conclusion:'EFFECT_PRESENT'});
    assert.equal(r.state,'SUBMITTED');
    assert.equal(b.evidence('job-1').handoffs.length,1);
  }finally{b.close();}a=make(t.file);
 });
});
test('INT-14 sandbox crash in a separate node process persists and fences recovery',async()=>{
 const t=temp();try {
  let a=make(t.file);a.initManual();push(a);a.close();
  const moduleUrl=new URL('./durable-review-integration.mjs',import.meta.url).href;
  const program=`import {DurableReviewSandbox} from ${JSON.stringify(moduleUrl)};
    const p=${JSON.stringify(P)},file=process.argv[1];
    const a=new DurableReviewSandbox({filename:file,projectId:p,at:()=>1000,
      assess:async ({content})=>({defects:content.ready?[]:['not-ready']}),
      repair:async({content})=>({content:{...content,ready:true}})});
    await a.runOnce({jobId:'job-1',workerId:'child',leaseMs:100,crashAfterHandoff:true});`;
  const child=spawnSync(process.execPath,['--disable-warning=ExperimentalWarning','--input-type=module','-e',program,t.file],
    {encoding:'utf8'});
  assert.notEqual(child.status,0);assert.equal(child.stdout.includes('SECRET'),false);
  a=make(t.file,{now:{value:start+101}});
  try {
    assert.equal(a.queue.get('job-1',P).state,'RUNNING');
    assert.equal(a.sweepExpired().length,1);
    assert.equal(a.evidence('job-1').handoffs.length,1);
    await err(()=>a.runOnce({jobId:'job-1',workerId:'parent'}),'RECONCILE_BEFORE_RETRY');
  }finally{a.close();}
 }finally{t.clean();}
});
test('INT-15 handoff stored record has authorApproved false, no workbench write',async()=>{
 await fixture(async a=>{push(a);const r=await a.runOnce({jobId:'job-1',workerId:'A'});
  assert.equal(r.verdict.authorApproved,false);
  const row=a.db.prepare('SELECT payload_json FROM integration_handoffs').get();
  assert.equal(JSON.parse(row.payload_json).authorApproved,false);
  assert.equal(JSON.parse(row.payload_json).scope,'sandbox-only');
 });
});
test('INT-16 missing handoff cannot falsely reconcile as an effect',async()=>{
 await fixture(async a=>{push(a);const j=a.queue.get('job-1',P);
  const c=a.queue.claim({jobId:'job-1',projectId:P,workerId:'A',expectedRevision:j.revision,at:start,leaseMs:100});
  a.queue.begin({jobId:'job-1',projectId:P,workerId:'A',expectedRevision:c.revision,at:start});
  a.queue.expire({jobId:'job-1',projectId:P,at:start+101});
  assert.throws(()=>a.reconcileAfterInspection({jobId:'job-1',readbackId:'proof',conclusion:'EFFECT_PRESENT'}),
    e=>e.code==='EVIDENCE_INCOMPLETE');
 });
});
