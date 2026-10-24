"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {prepare,transition}=require("./cloud-cad-job.cjs");
const input={projectId:"proj1",drawingId:"draw1",baseRevision:1,operation:"modify",requestId:"req1"};
test("only the owning worker may fail a claimed or running job",()=>{
 const a=prepare(input),b=transition(a,"claimed",{expectedStatus:"queued",workerId:"worker1"});
 assert.throws(()=>transition(b,"failed",{expectedStatus:"claimed",workerId:"worker2"}),{code:"CAD_WORKER_MISMATCH"});
 assert.throws(()=>transition(b,"failed",{expectedStatus:"claimed"}),{code:"CAD_ID_INVALID"});
 const c=transition(b,"running",{expectedStatus:"claimed",workerId:"worker1"});
 assert.throws(()=>transition(c,"failed",{expectedStatus:"running",workerId:"worker2"}),{code:"CAD_WORKER_MISMATCH"});
 assert.equal(transition(c,"failed",{expectedStatus:"running",workerId:"worker1"}).status,"failed");
});
test("claim holder cannot be impersonated when requeueing",()=>{
 const a=prepare(input),b=transition(a,"claimed",{expectedStatus:"queued",workerId:"worker1"});
 assert.throws(()=>transition(b,"queued",{expectedStatus:"claimed",workerId:"worker2"}),{code:"CAD_WORKER_MISMATCH"});
 assert.equal(transition(b,"queued",{expectedStatus:"claimed",workerId:"worker1"}).status,"queued");
});
