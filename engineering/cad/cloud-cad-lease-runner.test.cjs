"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createLeasedCadRunner}=require("./cloud-cad-lease-runner.cjs");
const {createQueue,createMemoryStorage}=require("./cloud-cad-queue.cjs");
const {createWorker}=require("./cloud-cad-worker.cjs");
const claim={job:{idempotency_key:"a".repeat(64),worker_id:"workerA",status:"claimed",lease_token:"aabbccdd-1234-4abc-8abc-abc123456789"},lease_token:"aabbccdd-1234-4abc-8abc-abc123456789"};
const nextTick=()=>new Promise(resolve=>setImmediate(resolve));
test("heartbeats before execution, continues during work and stops after",async()=>{
 let checks=0,tick,stopped=false;
 const runner=createLeasedCadRunner({
  workerId:"workerA",leaseSeconds:30,heartbeatIntervalMs:100,
  leaseManager:{heartbeat:async args=>{checks++;assert.equal(args.leaseToken,claim.lease_token);}},
  worker:{runClaimed:async(key,token,{signal})=>{
   assert.equal(key,claim.job.idempotency_key);assert.equal(token,claim.lease_token);
   assert.equal(signal.aborted,false);
   tick();await nextTick();
   return {status:"completed"};
  }},
  schedule:callback=>{tick=callback;return {unref(){}};},
  unschedule:()=>{stopped=true;}
 });
 assert.deepEqual(await runner.runClaim(claim),{status:"completed"});
 assert.equal(checks,2);assert.equal(stopped,true);
});
test("a lost heartbeat aborts the running worker",async()=>{
 let tick,count=0,stopped=false;
 const runner=createLeasedCadRunner({
  workerId:"workerA",leaseSeconds:30,heartbeatIntervalMs:100,
  leaseManager:{heartbeat:async()=>{
   if(++count>=2)throw Object.assign(new Error("lease expired"),{code:"CAD_LEASE_LOST"});
  }},
  worker:{runClaimed:async(_key,_token,{signal})=>{
   const stoppedPromise=new Promise(resolve=>signal.addEventListener("abort",resolve,{once:true}));
   tick();await stoppedPromise;
   assert.equal(signal.aborted,true);
   throw signal.reason;
  }},
  schedule:callback=>{tick=callback;return 123;},
  unschedule:()=>{stopped=true;}
 });
 await assert.rejects(runner.runClaim(claim),{code:"CAD_LEASE_LOST"});
 assert.equal(stopped,true);assert.equal(count,2);
});
test("initial lease verification fails before CAD is started",async()=>{
 let started=false;
 const runner=createLeasedCadRunner({
  workerId:"workerA",
  leaseManager:{heartbeat:async()=>{throw Object.assign(Error("stale"),{code:"CAD_LEASE_LOST"});}},
  worker:{runClaimed:async()=>{started=true;}},
  schedule:()=>{throw Error("should not schedule");}
 });
 await assert.rejects(runner.runClaim(claim),{code:"CAD_LEASE_LOST"});
 assert.equal(started,false);
});
test("tampered owner or lease is rejected before any IO",async()=>{
 const runner=createLeasedCadRunner({workerId:"workerA",leaseManager:{heartbeat:async()=>{}},worker:{runClaimed:async()=>{}}});
 await assert.rejects(runner.runClaim({...claim,job:{...claim.job,worker_id:"workerB"}}),{code:"CAD_HEARTBEAT_CLAIM_INVALID"});
 await assert.rejects(runner.runClaim({...claim,lease_token:"different"}),{code:"CAD_HEARTBEAT_CLAIM_INVALID"});
});
test("leased worker abort does not let stale worker mark a job failed",async()=>{
 const store=createMemoryStorage(),queue=createQueue(store);
 const job=await queue.enqueue({projectId:"p",drawingId:"d",baseRevision:0,operation:"create",requestId:"r"});
 const b=await queue.change(job.idempotency_key,"claimed",{workerId:"workerA"});
 const leased={...b,lease_token:claim.lease_token};
 assert.equal(await store.compareAndSwap(job.idempotency_key,b,leased),true);
 const controller=new AbortController();
 const worker=createWorker({queue,workerId:"workerA",ports:{
  authorize:async()=>{},
  loadRevision:async()=>null,
  execute:async ({signal})=>{assert.equal(signal,controller.signal);controller.abort();return {};},
  inspect:async()=>({valid:true}),
  storeImmutable:async()=>({sha256:"f".repeat(64)}),
  publishRevision:async()=>{throw Error("MUST NOT PUBLISH");}
 }});
 await assert.rejects(worker.runClaimed(job.idempotency_key,claim.lease_token,{signal:controller.signal}),{code:"CAD_LEASE_LOST"});
 assert.equal((await queue.read(job.idempotency_key)).status,"running");
});
