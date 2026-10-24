"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createPostgresStorage,SQL}=require("./cloud-cad-postgres-storage.cjs");
const {createQueue}=require("./cloud-cad-queue.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789",other="bbccddee-1234-4abc-8abc-abc123456789";
const input={projectId:"proj1",drawingId:"draw1",baseRevision:1,operation:"modify",requestId:"req1"};
function fakeDb(){
 const map=new Map();
 return {async query(sql,params){const [uid,key,...rest]=params,k=uid+":"+key;
  if(sql===SQL.insert){if(map.has(k))return {rowCount:0,rows:[]};map.set(k,JSON.parse(rest[0]));return {rowCount:1,rows:[{idempotency_key:key}]};}
  if(sql===SQL.get)return {rowCount:map.has(k)?1:0,rows:map.has(k)?[{job_data:structuredClone(map.get(k))}]:[]};
  if(sql===SQL.cas){if(JSON.stringify(map.get(k))!==rest[0])return {rowCount:0,rows:[]};map.set(k,JSON.parse(rest[1]));return {rowCount:1,rows:[{idempotency_key:key}]};}
  throw Error("Unrecognized SQL");
 }};
}
test("saved rows survive a new queue instance; duplicate submit is idempotent",async()=>{
 const db=fakeDb(),a=createQueue(createPostgresStorage({db,ownerId:owner}));
 const [j1,j2]=await Promise.all([a.enqueue(input),a.enqueue(input)]);
 assert.equal(j1.idempotency_key,j2.idempotency_key);
 const b=createQueue(createPostgresStorage({db,ownerId:owner}));
 const claimed=await b.change(j1.idempotency_key,"claimed",{workerId:"worker1"});
 assert.equal(claimed.attempt,1);
 assert.equal((await a.read(j1.idempotency_key)).status,"claimed");
});
test("two authenticated owners have separate job records",async()=>{
 const db=fakeDb(),a=createQueue(createPostgresStorage({db,ownerId:owner})),b=createQueue(createPostgresStorage({db,ownerId:other}));
 const j=await a.enqueue(input);
 assert.equal(await b.read(j.idempotency_key),null);
 await b.enqueue(input);
 await a.change(j.idempotency_key,"claimed",{workerId:"worker1"});
 assert.equal((await b.read(j.idempotency_key)).status,"queued");
});
test("compare-and-swap refuses stale job states",async()=>{
 const db=fakeDb(),store=createPostgresStorage({db,ownerId:owner}),q=createQueue(store),j=await q.enqueue(input);
 const old=await store.get(j.idempotency_key);
 await q.change(j.idempotency_key,"claimed",{workerId:"worker1"});
 assert.equal(await store.compareAndSwap(j.idempotency_key,old,{...old,status:"cancelled"}),false);
});
test("rejects invalid owner identity and key",async()=>{
 const db=fakeDb();
 assert.throws(()=>createPostgresStorage({db,ownerId:"../other"}),{code:"CAD_OWNER_INVALID"});
 const store=createPostgresStorage({db,ownerId:owner});
 await assert.rejects(store.get("../bad"),{code:"CAD_KEY_INVALID"});
});
