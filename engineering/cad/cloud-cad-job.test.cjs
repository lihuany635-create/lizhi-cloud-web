"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {prepare,transition}=require("./cloud-cad-job.cjs");
const args={projectId:"proj1",drawingId:"draw1",baseRevision:2,operation:"modify",requestId:"request1"};
test("cloud job idempotency is stable and tied to revision",()=>{
 const a=prepare(args);assert.equal(a.idempotency_key,prepare(args).idempotency_key);
 assert.notEqual(a.idempotency_key,prepare({...args,baseRevision:3}).idempotency_key);
 assert.equal(a.status,"queued");
});
test("claim run finish with new immutable revision",()=>{
 const a=prepare(args),b=transition(a,"claimed",{expectedStatus:"queued",workerId:"workerA"});
 const c=transition(b,"running",{expectedStatus:"claimed",workerId:"workerA"});
 const d=transition(c,"completed",{expectedStatus:"running",workerId:"workerA",outputRevision:3});
 assert.equal(d.status,"completed");assert.equal(d.attempt,1);assert.equal(d.output_revision,3);
 assert.equal(a.status,"queued");assert.equal(b.status,"claimed");
});
test("stale status, old revision and wrong worker fail closed",()=>{
 const a=prepare(args),b=transition(a,"claimed",{expectedStatus:"queued",workerId:"workerA"});
 assert.throws(()=>transition(b,"running",{expectedStatus:"queued",workerId:"workerA"}),{code:"CAD_JOB_CONFLICT"});
 assert.throws(()=>transition(b,"running",{expectedStatus:"claimed",workerId:"workerB"}),{code:"CAD_WORKER_MISMATCH"});
 const c=transition(b,"running",{expectedStatus:"claimed",workerId:"workerA"});
 assert.throws(()=>transition(c,"completed",{expectedStatus:"running",workerId:"workerA",outputRevision:2}),{code:"CAD_OUTPUT_REVISION_INVALID"});
});
test("user cannot inject arbitrary CAD or shell commands",()=>{
 assert.throws(()=>prepare({...args,operation:"shell"}),{code:"CAD_OPERATION_DENIED"});
 assert.throws(()=>prepare({...args,projectId:"../escape"}),{code:"CAD_ID_INVALID"});
});
