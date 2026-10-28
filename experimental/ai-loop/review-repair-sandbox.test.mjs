import test from 'node:test';
import assert from 'node:assert/strict';
import {SandboxReviewRepair,RepairLoopError} from './review-repair-sandbox.mjs';
const PROJECT='61b88bec-9b3e-49e6-8780-d073fc816516';
const input={projectId:PROJECT,taskId:'test-task',requestId:'req-1',expectedRevision:41,
  initialContent:{ready:true,proof:'SANDBOX'},mode:'MANUAL',riskTier:'L0',paidApi:false};
const check=(fn,code)=>assert.rejects(fn,e=>e instanceof RepairLoopError&&e.code===code);
function setup(opts={}) {
 let writes=0,reads=0,assessments=0,repairs=0,handoffs=0,allowed=true;
 const artifacts=new Map(),records=new Map();
 const engine=new SandboxReviewRepair({
  projectId:PROJECT,maxRepairs:opts.maxRepairs??2,
  checkStillAllowed:()=>allowed,
  writeSandboxArtifact:async d=>{
   writes++;
   if(opts.writeThrow)throw Error('UPSTREAM_WRITE_UNKNOWN');
   if(opts.uncertainWrite)return {uncertain:true};
   const a={projectId:PROJECT,artifactId:'artifact-'+writes,version:writes,content:structuredClone(d.content)};
   artifacts.set(a.artifactId,a);return {projectId:PROJECT,artifactId:a.artifactId,version:a.version};
  },
  readSandboxArtifact:async ({artifactId})=>{
   reads++;if(opts.stopAfterRead)allowed=false;
   const a=structuredClone(artifacts.get(artifactId));
   if(opts.crossProject)a.projectId='another-project';
   if(opts.staleVersion)a.version--;
   if(opts.corruptArtifact)a.content.ready=false;
   return a;
  },
  assessArtifact:async ({content})=>{assessments++;return {defects:content.ready===true?[]:['not-ready']};},
  proposeRepair:async ({content})=>{repairs++;return {content:{...content,ready:opts.neverFix?false:true}};},
  appendSandboxHandoff:async record=>{
   handoffs++;if(opts.handoffThrow)throw Error('UNKNOWN_COMMIT');
   if(opts.uncertainHandoff)return {uncertain:true};
   const v={...structuredClone(record),recordId:'record-'+handoffs};
   if(opts.fakeApproval)v.authorApproved=true;
   records.set(v.recordId,v);
   return {projectId:PROJECT,recordId:v.recordId};
  },
  readSandboxHandoff:async ({recordId})=>opts.noHandoffRead?null:structuredClone(records.get(recordId))
 });
 return {engine,counters:()=>({writes,reads,assessments,repairs,handoffs}),stop:()=>{allowed=false;},records};
}
test('P4-01 passing content uses fresh read and writes handoff once',async()=>{
 const x=setup(),r=await x.engine.run(input);assert.equal(r.status,'RECORDED');
 assert.equal(r.authorApproved,false);assert.equal(r.repairs,0);assert.deepEqual(x.counters(),{writes:1,reads:1,assessments:1,repairs:0,handoffs:1});
 assert.deepEqual(r.receipts.map(x=>x.role),['Executor','Reviewer','Handover']);
});
test('P4-02 one defective result triggers exactly one repair and re-review',async()=>{
 const x=setup(),r=await x.engine.run({...input,initialContent:{ready:false}});
 assert.equal(r.status,'RECORDED');assert.equal(r.repairs,1);
 assert.deepEqual(x.counters(),{writes:2,reads:2,assessments:2,repairs:1,handoffs:1});
 assert.deepEqual(r.receipts.map(x=>x.role),['Executor','Reviewer','Repairer','Reviewer','Handover']);
});
test('P4-03 repeated defects terminate at two repairs without handoff',async()=>{
 const x=setup({neverFix:true}),r=await x.engine.run({...input,initialContent:{ready:false}});
 assert.equal(r.status,'NEEDS_OWNER');assert.equal(r.reason,'REPAIR_LIMIT_REACHED');assert.equal(r.repairs,2);
 assert.deepEqual(x.counters(),{writes:3,reads:3,assessments:3,repairs:2,handoffs:0});
});
test('P4-04 zero repair allowance returns NEEDS_OWNER at first rejection',async()=>{
 const x=setup({maxRepairs:0}),r=await x.engine.run({...input,initialContent:{ready:false}});
 assert.equal(r.status,'NEEDS_OWNER');assert.equal(r.repairs,0);
 assert.equal(x.counters().writes,1);
});
test('P4-05 uncertain artifact write is not retried',async()=>{
 const x=setup({uncertainWrite:true}),r=await x.engine.run(input);
 assert.equal(r.status,'NEEDS_OWNER');assert.equal(r.reason,'UNCERTAIN_ARTIFACT_WRITE');
 assert.equal(x.counters().writes,1);assert.equal(x.counters().reads,0);
});
test('P4-06 thrown artifact write is unknown and not retried',async()=>{
 const x=setup({writeThrow:true}),r=await x.engine.run(input);
 assert.equal(r.reason,'UNCERTAIN_ARTIFACT_WRITE');assert.equal(x.counters().writes,1);
});
test('P4-07 uncertain handoff is not retried and never claims RECORDED',async()=>{
 const x=setup({uncertainHandoff:true}),r=await x.engine.run(input);
 assert.equal(r.status,'NEEDS_OWNER');assert.equal(r.reason,'UNCERTAIN_HANDOFF_WRITE');assert.equal(x.counters().handoffs,1);
});
test('P4-08 handoff missing actual readback must be rejected',async()=>{
 const x=setup({noHandoffRead:true});await check(()=>x.engine.run(input),'HANDOFF_READBACK_MISSING');
});
test('P4-09 forged author approval in handoff readback is detected',async()=>{
 const x=setup({fakeApproval:true});await check(()=>x.engine.run(input),'HANDOFF_READBACK_MISMATCH');
});
test('P4-10 cross-project artifact never reaches handoff',async()=>{
 const x=setup({crossProject:true});await check(()=>x.engine.run(input),'CROSS_PROJECT_RESULT');assert.equal(x.counters().handoffs,0);
});
test('P4-11 stale version cannot count as verified readback',async()=>{
 const x=setup({staleVersion:true});await check(()=>x.engine.run(input),'VERSION_CHANGED');
});
test('P4-12 corrupt content must be refused even if reviewed later',async()=>{
 const x=setup({corruptArtifact:true});await check(()=>x.engine.run(input),'SOURCE_CHANGED');
});
test('P4-13 STOP before execution prevents all writes',async()=>{
 const x=setup();x.stop();await check(()=>x.engine.run(input),'STOPPED');assert.equal(x.counters().writes,0);
});
test('P4-14 STOP after read prevents handoff',async()=>{
 const x=setup({stopAfterRead:true});await check(()=>x.engine.run(input),'STOPPED');assert.equal(x.counters().handoffs,0);
});
test('P4-15 AUTO, paid API and L2/L3 operations are rejected before any calls',async()=>{
 for(const changes of [{mode:'AUTO'},{paidApi:true},{riskTier:'L2'},{riskTier:'L3'}]){
  const x=setup();await check(()=>x.engine.run({...input,...changes}),'APPROVAL_REQUIRED');assert.equal(x.counters().writes,0);
 }
});
test('P4-16 request wrong project, missing ID or invalid revision denied',async()=>{
 for(const changes of [{projectId:'other'},{taskId:''},{requestId:''}]){
  const x=setup();await check(()=>x.engine.run({...input,...changes}),'SCOPE_DENIED');assert.equal(x.counters().writes,0);
 }
 const x=setup();await check(()=>x.engine.run({...input,expectedRevision:'41'}),'REVISION_INVALID');
});
