"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createQueue,createMemoryStorage}=require("./cloud-cad-queue.cjs");
const {createWorker}=require("./cloud-cad-worker.cjs");
const input={projectId:"p1",drawingId:"d1",baseRevision:1,operation:"modify",requestId:"r1"};
function ports(events,options={}){
 return {
 async authorize(){events.push("authorize");},
 async loadRevision(){events.push("load");return {revision:1};},
 async execute(){events.push("execute");return {bytes:Buffer.from("dxf")};},
 async inspect(){events.push("inspect");return {valid:options.invalidInspection!==true};},
 async storeImmutable(){events.push("store");return {sha256:"a".repeat(64)};},
 async publishRevision(){events.push("publish");return {revision:2};}
 };
}
test("authorized workflow reads old version, inspects and publishes new version",async()=>{
 const q=createQueue(createMemoryStorage()),j=await q.enqueue(input),events=[];
 const result=await createWorker({queue:q,ports:ports(events),workerId:"worker1"}).run(j.idempotency_key);
 assert.deepEqual(events,["authorize","load","execute","inspect","store","publish"]);
 assert.equal(result.revision,2);assert.equal((await q.read(j.idempotency_key)).status,"completed");
});
test("invalid geometry fails before storage and publication",async()=>{
 const q=createQueue(createMemoryStorage()),j=await q.enqueue(input),events=[];
 await assert.rejects(createWorker({queue:q,ports:ports(events,{invalidInspection:true}),workerId:"worker1"}).run(j.idempotency_key),{code:"CAD_INSPECTION_FAILED"});
 assert.equal(events.includes("publish"),false);assert.equal(events.includes("store"),false);
 assert.equal((await q.read(j.idempotency_key)).status,"failed");
});
test("non queued job cannot be executed twice",async()=>{
 const q=createQueue(createMemoryStorage()),j=await q.enqueue(input),w=createWorker({queue:q,ports:ports([]),workerId:"worker1"});
 await w.run(j.idempotency_key);
 await assert.rejects(w.run(j.idempotency_key),{code:"CAD_JOB_NOT_QUEUED"});
});
