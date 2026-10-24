"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createQueue,createMemoryStorage}=require("./cloud-cad-queue.cjs");
const input={projectId:"p1",drawingId:"d1",baseRevision:1,operation:"modify",requestId:"r1"};
test("atomic dedupe returns one job for simultaneous requests",async()=>{
 const q=createQueue(createMemoryStorage());
 const [a,b]=await Promise.all([q.enqueue(input),q.enqueue(input)]);
 assert.equal(a.idempotency_key,b.idempotency_key);
 assert.equal((await q.read(a.idempotency_key)).attempt,0);
});
test("claim, run and publish a newer revision",async()=>{
 const q=createQueue(createMemoryStorage()),a=await q.enqueue(input);
 const b=await q.change(a.idempotency_key,"claimed",{workerId:"w1"});
 const c=await q.change(a.idempotency_key,"running",{workerId:"w1"});
 const d=await q.change(a.idempotency_key,"completed",{workerId:"w1",outputRevision:2});
 assert.deepEqual([b.status,c.status,d.status],["claimed","running","completed"]);
 assert.equal((await q.read(a.idempotency_key)).output_revision,2);
});
test("fails closed on worker mismatch or stale revision",async()=>{
 const q=createQueue(createMemoryStorage()),a=await q.enqueue(input);
 await q.change(a.idempotency_key,"claimed",{workerId:"w1"});
 await assert.rejects(q.change(a.idempotency_key,"running",{workerId:"w2"}),{code:"CAD_WORKER_MISMATCH"});
 await q.change(a.idempotency_key,"running",{workerId:"w1"});
 await assert.rejects(q.change(a.idempotency_key,"completed",{workerId:"w1",outputRevision:1}),{code:"CAD_OUTPUT_REVISION_INVALID"});
});
test("requires atomic storage primitives",()=>{
 assert.throws(()=>createQueue({get:async()=>null}),{code:"CAD_STORAGE_PORT_INVALID"});
});
