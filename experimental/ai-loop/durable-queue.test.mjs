import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { DurableSandboxQueue, QueueError } from './durable-queue.mjs';
const DIR = dirname(fileURLToPath(import.meta.url));
const NOW=100000, EXPECT=()=>({x:1});
function setup(t,{mode='MANUAL'}={}) {
 const dir=mkdtempSync(join(tmpdir(),'lizhi-p2-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const path=join(dir,'queue.sqlite');
 const q=new DurableSandboxQueue(path);
 t.after(()=>{try {q.close();} catch {}});
 if(mode!=='OFF') q.setMode(mode,{at:NOW});
 return {q,path};
}
function enq(q,opts={}){return q.enqueue({projectId:'P',jobId:'J',eventId:'E',kind:'manual',payload:EXPECT(),at:NOW,...opts});}
function claimBegin(q,{jobId='J',workerId='worker1',projectId='P'}={}){
 let j=q.get(jobId,projectId);j=q.claim({jobId,projectId,workerId,expectedRevision:j.revision,at:NOW+1,leaseMs:100});
 return q.begin({jobId,projectId,workerId,expectedRevision:j.revision,at:NOW+2});
}
const check=(f,code)=>assert.throws(f,e=>e instanceof QueueError&&e.code===code);

test('P2-01 fresh store defaults OFF and uses SQLite on disk',t=>{
 const {q,path}=setup(t,{mode:'OFF'});
 assert.deepEqual(q.control(),{mode:'OFF',paused:false,stopped:false,revision:1});
 check(()=>enq(q),'TRIGGER_NOT_AUTHORIZED');
 q.close();const r=new DurableSandboxQueue(path);
 assert.equal(r.control().mode,'OFF');r.close();
});
test('P2-02 manual queue and claim obey revision and single active capacity',t=>{
 const {q}=setup(t);enq(q);
 q.enqueue({projectId:'P',jobId:'J2',eventId:'E2',kind:'manual',payload:{x:2},at:NOW});
 check(()=>q.claim({jobId:'J',projectId:'P',workerId:'W',expectedRevision:999,at:NOW,leaseMs:100}),'STALE_REVISION');
 const j=q.claim({jobId:'J',projectId:'P',workerId:'W',expectedRevision:1,at:NOW,leaseMs:100});
 assert.equal(j.state,'CLAIMED');
 check(()=>q.claim({jobId:'J2',projectId:'P',workerId:'W2',expectedRevision:1,at:NOW,leaseMs:100}),'CAPACITY_REACHED');
});
test('P2-03 AUTO needs explicit mock allowlist and dedupes stable event',t=>{
 const {q}=setup(t,{mode:'AUTO'});
 check(()=>enq(q,{kind:'auto'}),'TRIGGER_NOT_AUTHORIZED');
 assert.equal(enq(q,{kind:'auto',allowlisted:true}).duplicate,false);
 assert.equal(enq(q,{kind:'auto',allowlisted:true}).duplicate,true);
 check(()=>enq(q,{kind:'auto',allowlisted:true,payload:{x:999}}),'EVENT_ID_CONFLICT');
 q.setMode('OFF',{at:NOW+1});check(()=>enq(q,{kind:'auto',eventId:'E3',jobId:'J3',allowlisted:true}),'TRIGGER_NOT_AUTHORIZED');
});
test('P2-04 disk reopen preserves mode, trigger history, lease and audits',t=>{
 const {q,path}=setup(t);enq(q);claimBegin(q);
 q.close();const restored=new DurableSandboxQueue(path);
 assert.equal(restored.control().mode,'MANUAL');
 assert.equal(restored.get('J','P').state,'RUNNING');
 assert.equal(restored.get('J','P').attemptNo,1);
 assert.equal(restored.audit().filter(a=>a.event==='RUNNING').length,1);
 assert.equal(enq(restored).duplicate,true);
 restored.close();
});
test('P2-05 heartbeat extends only active owner lease and requires CAS',t=>{
 const {q}=setup(t);enq(q);let j=claimBegin(q);
 check(()=>q.heartbeat({jobId:'J',projectId:'P',workerId:'intruder',expectedRevision:j.revision,at:NOW+3,extendMs:150}),'LEASE_OWNER_MISMATCH');
 j=q.heartbeat({jobId:'J',projectId:'P',workerId:'worker1',expectedRevision:j.revision,at:NOW+3,extendMs:150});
 assert.equal(j.leaseUntil,NOW+153);
 check(()=>q.heartbeat({jobId:'J',projectId:'P',workerId:'worker1',expectedRevision:j.revision-1,at:NOW+3,extendMs:100}),'STALE_REVISION');
 check(()=>q.heartbeat({jobId:'J',projectId:'P',workerId:'worker1',expectedRevision:j.revision,at:NOW+153,extendMs:100}),'LEASE_EXPIRED');
});
test('P2-06 expiry cannot automatically requeue or replay result',t=>{
 const {q}=setup(t);enq(q);claimBegin(q);
 check(()=>q.expire({jobId:'J',projectId:'P',at:NOW+50}),'LEASE_STILL_VALID');
 const j=q.expire({jobId:'J',projectId:'P',at:NOW+101});
 assert.equal(j.state,'RECONCILE_REQUIRED');
 check(()=>q.claim({jobId:'J',projectId:'P',workerId:'other',expectedRevision:j.revision,at:NOW+102}),'INVALID_TRANSITION');
 check(()=>q.reconcile({jobId:'J',projectId:'P',expectedRevision:j.revision,conclusion:'NO_EFFECT',readbackId:'read1',at:NOW+102}),'OWNER_APPROVAL_REQUIRED');
 assert.equal(q.get('J','P').state,'RECONCILE_REQUIRED');
});
test('P2-07 readback NO_EFFECT and explicit owner approval permits a new attempt',t=>{
 const {q}=setup(t);enq(q);claimBegin(q);let j=q.expire({jobId:'J',projectId:'P',at:NOW+101});
 j=q.reconcile({jobId:'J',projectId:'P',expectedRevision:j.revision,conclusion:'NO_EFFECT',readbackId:'verified-no-effect',ownerApproved:true,at:NOW+102});
 assert.equal(j.state,'QUEUED');assert.equal(j.attemptNo,1);
 j=q.claim({jobId:'J',projectId:'P',workerId:'worker2',expectedRevision:j.revision,at:NOW+103,leaseMs:100});
 j=q.begin({jobId:'J',projectId:'P',workerId:'worker2',expectedRevision:j.revision,at:NOW+104});
 assert.equal(j.attemptNo,2);assert.equal(q.attempts('J','P').length,2);
});
test('P2-08 verified effect uses SUBMITTED, UNKNOWN needs owner',t=>{
 for(const conclusion of ['EFFECT_PRESENT','UNKNOWN']){
  const {q}=setup(t);let j=enq(q).job;j=claimBegin(q);j=q.expire({jobId:'J',projectId:'P',at:NOW+101});
  j=q.reconcile({jobId:'J',projectId:'P',expectedRevision:j.revision,conclusion,readbackId:'test-target-readback',at:NOW+102});
  assert.equal(j.state,conclusion==='EFFECT_PRESENT'?'SUBMITTED':'NEEDS_OWNER');
 }
});
test('P2-09 request ledger is durable and denies conflicting replay',t=>{
 const {q,path}=setup(t);enq(q);let j=claimBegin(q);
 const opts={jobId:'J',projectId:'P',workerId:'worker1',expectedRevision:j.revision,requestId:'R1',result:{ok:true},at:NOW+3};
 assert.equal(q.submit(opts).duplicate,false);
 q.close();const r=new DurableSandboxQueue(path);
 assert.equal(r.submit({...opts,expectedRevision:-123}).duplicate,true);
 assert.equal(r.get('J','P').state,'SUBMITTED');
 check(()=>r.submit({...opts,result:{ok:false}}),'REQUEST_ID_CONFLICT');
 assert.equal(r.audit().filter(x=>x.event==='SUBMITTED').length,1);r.close();
});
test('P2-10 unknown write result needs owner and is not retried',t=>{
 const {q}=setup(t);enq(q);const j=claimBegin(q);
 const x=q.submit({jobId:'J',projectId:'P',workerId:'worker1',expectedRevision:j.revision,requestId:'u1',result:{status:'timeout'},uncertain:true,at:NOW+3});
 assert.equal(x.job.state,'NEEDS_OWNER');
 check(()=>q.claim({jobId:'J',projectId:'P',workerId:'worker2',expectedRevision:x.job.revision,at:NOW+4}),'INVALID_TRANSITION');
});
test('P2-11 PAUSE stops new claim without losing queued work',t=>{
 const {q}=setup(t);enq(q);q.pause({at:NOW+1});
 check(()=>q.claim({jobId:'J',projectId:'P',workerId:'W',expectedRevision:1,at:NOW+2}),'PAUSED_OR_STOPPED');
 assert.equal(q.get('J','P').state,'QUEUED');q.resume({at:NOW+3});
 assert.equal(q.claim({jobId:'J',projectId:'P',workerId:'W',expectedRevision:1,at:NOW+4}).state,'CLAIMED');
});
test('P2-12 STOP makes queued cancel and running need owner; no restart',t=>{
 const {q}=setup(t);enq(q);claimBegin(q);
 q.enqueue({projectId:'P',jobId:'J2',eventId:'E2',kind:'manual',payload:{x:2},at:NOW+3});
 q.stop({at:NOW+4});assert.equal(q.control().stopped,true);
 assert.equal(q.get('J','P').state,'NEEDS_OWNER');assert.equal(q.get('J2','P').state,'CANCELLED');
 check(()=>q.setMode('AUTO',{at:NOW+5}),'STOPPED');
});
test('P2-13 cross-project reading is denied, duplicate trigger cannot hijack',t=>{
 const {q}=setup(t);enq(q);
 check(()=>q.get('J','OTHER'),'WRONG_PROJECT');
 check(()=>enq(q,{jobId:'J-other',payload:{x:9}}),'EVENT_ID_CONFLICT');
 check(()=>q.claim({jobId:'J',projectId:'OTHER',workerId:'W',expectedRevision:1,at:NOW+2}),'WRONG_PROJECT');
});
test('P2-14 transaction rollback leaves no orphan trigger or task',t=>{
 const {q}=setup(t);enq(q);
 check(()=>enq(q,{jobId:'J',eventId:'NEW_EVENT'}),'DUPLICATE_JOB');
 assert.equal(q.audit().filter(a=>a.event==='QUEUED').length,1);
 assert.equal(q.db.prepare('SELECT COUNT(*) AS n FROM triggers').get().n,1);
});
test('P2-15 concurrent SQLite claim across two processes has exactly one winner',async t=>{
 const {q,path}=setup(t);enq(q);
 const script=join(DIR,'queue-claim-cli.mjs');
 const args=[script,path,'J','P','1','100001','60000'];
 const run=workerId=>new Promise((resolve,reject)=>{
   const p=spawn(process.execPath,['--disable-warning=ExperimentalWarning',...args,workerId]);
   let out='',error='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>error+=d);
   p.on('error',reject);p.on('close',code=>resolve({code,out,error}));
 });
 const results=await Promise.all([run('workerA'),run('workerB')]);
 assert.deepEqual(results.map(r=>r.code).sort(),[0,2],JSON.stringify(results));
 assert.equal(q.get('J','P').state,'CLAIMED');
 assert.equal(q.audit().filter(e=>e.event==='CLAIMED').length,1);
});
test('P2-16 invalid lease cannot be used after expiration or from other owner',t=>{
 const {q}=setup(t);enq(q);let j=claimBegin(q);
 check(()=>q.submit({jobId:'J',projectId:'P',workerId:'worker2',expectedRevision:j.revision,requestId:'a',result:{},at:NOW+3}),'LEASE_OWNER_MISMATCH');
 check(()=>q.submit({jobId:'J',projectId:'P',workerId:'worker1',expectedRevision:j.revision,requestId:'b',result:{},at:NOW+101}),'LEASE_EXPIRED');
 assert.equal(q.db.prepare('SELECT COUNT(*) AS n FROM effects').get().n,0);
});
test('P2-17 ambiguous event ID with different job payload cannot silently overwrite',t=>{
 const {q}=setup(t);enq(q);
 check(()=>enq(q,{payload:{x:3}}),'EVENT_ID_CONFLICT');
 assert.deepEqual(q.get('J','P').payload,{x:1});
});
test('P2-18 reviewer and real MCP integration deliberately not implemented',t=>{
 const {q}=setup(t);enq(q);const j=claimBegin(q);
 assert.equal(q.get('J','P').state,'RUNNING');
 assert.equal(typeof q.review,'undefined');
 assert.equal(typeof q.invokeMcp,'undefined');
});
test('P2-19 startup sweep marks expired work for reconciliation, never requeues',t=>{
 const {q,path}=setup(t);enq(q);claimBegin(q);q.close();
 const restored=new DurableSandboxQueue(path);
 assert.equal(restored.sweepExpired({at:NOW+101}).length,1);
 assert.equal(restored.get('J','P').state,'RECONCILE_REQUIRED');
 assert.equal(restored.sweepExpired({at:NOW+102}).length,0);
 assert.equal(restored.audit().filter(e=>e.event==='RECONCILE_REQUIRED').length,1);
 restored.close();
});
test('P2-20 sweep leaves healthy jobs untouched and protects project list filtering',t=>{
 const {q}=setup(t);enq(q);
 assert.equal(q.sweepExpired({at:NOW+100000}).length,0);
 assert.equal(q.list({projectId:'OTHER'}).length,0);
 assert.equal(q.list({projectId:'P',states:['QUEUED']}).length,1);
 assert.equal(q.list({projectId:'P',states:['RUNNING']}).length,0);
});
