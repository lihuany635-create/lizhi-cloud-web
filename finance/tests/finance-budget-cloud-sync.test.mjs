import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const Sync=require("../budget/budget-sync.js");
const Cloud=require("../budget/budget-cloud-store.js");
const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const stamp="2026-11-17T12:00:00.000Z";
let n=0;
const scope=row=>JSON.stringify([row.month,row.currency,row.categoryId??row.category_id??null]);
function localDevice(ownerId=A){
  const rows=new Map();
  return {
    rows,
    async list(){return [...rows.values()].filter(r=>r.ownerId===ownerId).map(r=>({...r}));},
    async applyRemote(row){
      if(row.user_id!==ownerId)throw Object.assign(new Error("BUDGET_OWNER_CONFLICT"),{code:"BUDGET_OWNER_CONFLICT"});
      const current=rows.get(row.id);
      if(current?.dirty)throw new Error("BUDGET_DIRTY_CONFLICT");
      if([...rows.values()].some(x=>x.id!==row.id&&scope(x)===scope(row)&&!x.deletedAt))
        throw new Error("BUDGET_SCOPE_CONFLICT");
      rows.set(row.id,{id:row.id,ownerId,month:row.month,currency:row.currency,
        categoryId:row.category_id??null,amount:row.amount,version:row.version,dirty:false,
        deletedAt:row.deleted_at??null,updatedAt:row.updated_at,createdAt:row.created_at});
    },
    async markSynced(id,expectedTimestamp,row){
      const current=rows.get(id);
      if(!current||current.ownerId!==ownerId)throw new Error("BUDGET_OWNER_CONFLICT");
      rows.set(id,{...current,version:row.version,dirty:current.updatedAt!==expectedTimestamp,
        amount:current.updatedAt===expectedTimestamp?row.amount:current.amount,
        deletedAt:current.updatedAt===expectedTimestamp?row.deleted_at:current.deletedAt});
    },
    set({id="device-"+(++n),month="2026-11",categoryId=null,amount,version=0,deletedAt=null}){
      const old=rows.get(id),updatedAt="2026-11-17T12:00:"+String((++n)%60).padStart(2,"0")+".000Z";
      const record={id,ownerId,month,currency:"TWD",categoryId,amount,version:old?.version??version,
        dirty:true,deletedAt,createdAt:old?.createdAt??stamp,updatedAt};
      rows.set(id,record);
      return record;
    }
  };
}
function cloudDb(){
  const rows=new Map();
  const metrics={lists:0,writes:0};
  return {
    rows,metrics,
    async list({client,month}){
      metrics.lists++;
      return [...rows.values()].filter(r=>r.user_id===client.ownerId&&(!month||r.month===month))
        .map(r=>({...r}));
    },
    async create({client,record}){
      metrics.writes++;
      if(record.ownerId!==client.ownerId)throw new Error("BUDGET_OWNER_CONFLICT");
      if([...rows.values()].some(r=>r.user_id===client.ownerId&&scope(r)===scope(record)))
        throw Object.assign(new Error("BUDGET_SCOPE_CONFLICT"),{code:"BUDGET_SCOPE_CONFLICT"});
      if(rows.has(record.id))throw new Error("BUDGET_DUPLICATE_ID");
      const row={id:record.id,user_id:client.ownerId,month:record.month,category_id:record.categoryId,
        currency:record.currency,amount:record.amount,version:1,created_at:stamp,
        updated_at:stamp,deleted_at:null};
      rows.set(row.id,row);
      return {...row};
    },
    async update({client,record}){
      metrics.writes++;
      const old=rows.get(record.id);
      if(!old||old.user_id!==client.ownerId||old.version!==record.version)
        throw Object.assign(new Error("BUDGET_VERSION_CONFLICT"),{code:"BUDGET_VERSION_CONFLICT"});
      const row={...old,amount:record.amount,version:old.version+1,
        deleted_at:record.deletedAt??null,updated_at:stamp};
      rows.set(row.id,row);
      return {...row};
    }
  };
}
const owner=id=>({requireOwner:async()=>id});
const sync=(device,cloud,ownerId=A)=>Sync.create({local:device,cloud,owner:owner(ownerId)});
test("SYNC2-01 two devices create and pull an owner-scoped monthly budget",async()=>{
  const cloud=cloudDb(),first=localDevice(),second=localDevice();
  first.set({id:"shared",amount:10000});
  const push=await sync(first,cloud).sync({client:{ownerId:A}});
  assert.equal(push.ok,true);
  assert.equal(push.uploaded,1);
  const pull=await sync(second,cloud).sync({client:{ownerId:A}});
  assert.equal(pull.ok,true);
  assert.equal(pull.applied,1);
  assert.equal(second.rows.get("shared").amount,10000);
  assert.equal(second.rows.get("shared").ownerId,A);
});
test("SYNC2-02 clean device receives remote edit, no duplicate rows",async()=>{
  const cloud=cloudDb(),one=localDevice(),two=localDevice();
  one.set({id:"shared",amount:8000});
  await sync(one,cloud).sync({client:{ownerId:A}});
  await sync(two,cloud).sync({client:{ownerId:A}});
  one.set({id:"shared",amount:9800});
  assert.equal((await sync(one,cloud).sync({client:{ownerId:A}})).uploaded,1);
  assert.equal((await sync(two,cloud).sync({client:{ownerId:A}})).applied,1);
  assert.equal(two.rows.size,1);
  assert.equal(two.rows.get("shared").amount,9800);
  assert.equal(two.rows.get("shared").version,2);
});
test("SYNC2-03 two offline edits keep stale local dirty state",async()=>{
  const cloud=cloudDb(),one=localDevice(),two=localDevice();
  one.set({id:"shared",amount:8000});
  await sync(one,cloud).sync({client:{ownerId:A}});
  await sync(two,cloud).sync({client:{ownerId:A}});
  one.set({id:"shared",amount:8100});two.set({id:"shared",amount:8200});
  assert.equal((await sync(one,cloud).sync({client:{ownerId:A}})).ok,true);
  const loser=await sync(two,cloud).sync({client:{ownerId:A}});
  assert.equal(loser.ok,false);
  assert.deepEqual(loser.conflicts.map(x=>x.reason),["BUDGET_VERSION_CONFLICT"]);
  assert.equal(two.rows.get("shared").amount,8200);
  assert.equal(two.rows.get("shared").dirty,true);
  assert.equal(cloud.rows.get("shared").amount,8100);
});
test("SYNC2-04 two offline new rows same category produce scope conflict",async()=>{
  const cloud=cloudDb(),one=localDevice(),two=localDevice();
  one.set({id:"one",amount:3000,categoryId:"food"});
  two.set({id:"two",amount:4000,categoryId:"food"});
  await sync(one,cloud).sync({client:{ownerId:A}});
  const result=await sync(two,cloud).sync({client:{ownerId:A}});
  assert.equal(result.ok,false);
  assert.ok(result.conflicts.some(x=>x.reason==="BUDGET_SCOPE_CONFLICT"));
  assert.equal(two.rows.get("two").dirty,true);
  assert.equal(cloud.rows.size,1);
});
test("SYNC2-05 soft delete replicates to a second device",async()=>{
  const cloud=cloudDb(),one=localDevice(),two=localDevice();
  one.set({id:"shared",amount:3000});
  await sync(one,cloud).sync({client:{ownerId:A}});
  await sync(two,cloud).sync({client:{ownerId:A}});
  one.set({id:"shared",amount:3000,deletedAt:"2026-11-17T17:00:00Z"});
  assert.equal((await sync(one,cloud).sync({client:{ownerId:A}})).ok,true);
  const receipt=await sync(two,cloud).sync({client:{ownerId:A}});
  assert.equal(receipt.applied,1);
  assert.equal(two.rows.get("shared").deletedAt,"2026-11-17T17:00:00Z");
});
test("SYNC2-06 owner mismatch on remote batch aborts before local mutation",async()=>{
  const local=localDevice(),cloud=cloudDb();
  cloud.rows.set("evil",{id:"evil",user_id:B,month:"2026-11",currency:"TWD",
    category_id:null,amount:999,version:1,deleted_at:null});
  const wrongCloud={...cloud,list:async()=>[cloud.rows.get("evil")]};
  const receipt=await sync(local,wrongCloud).sync({client:{ownerId:A}});
  assert.equal(receipt.ok,false);
  assert.equal(receipt.state,"auth_required");
  assert.equal(local.rows.size,0);
});
test("SYNC2-07 logout during remote fetch aborts without applying",async()=>{
  let current=A,reads=0;
  const cloud=cloudDb(),local=localDevice();
  const wrong={...cloud,list:async()=>{reads++;current=null;return [];}};
  const receipt=await Sync.create({local,cloud:wrong,owner:{requireOwner:async()=>{
    if(!current)throw Object.assign(new Error("BUDGET_AUTH_REQUIRED"),{code:"BUDGET_AUTH_REQUIRED"});
    return current;
  }}}).sync({client:{ownerId:A}});
  assert.equal(reads,1);
  assert.equal(receipt.state,"auth_required");
  assert.equal(local.rows.size,0);
});
test("SYNC2-08 account switches during upload; local never marks synced",async()=>{
  let current=A;
  const local=localDevice(),cloud=cloudDb();
  local.set({id:"shared",amount:5000});
  const guarded={...cloud,create:async(args)=>{const saved=await cloud.create(args);current=B;return saved;}};
  const receipt=await Sync.create({local,cloud:guarded,owner:{requireOwner:async()=>current}})
    .sync({client:{ownerId:A}});
  assert.equal(receipt.state,"auth_required");
  assert.equal(local.rows.get("shared").dirty,true);
});
test("SYNC2-09 ownerless local rows are not uploaded",async()=>{
  const local=localDevice(),cloud=cloudDb();
  local.rows.set("legacy",{id:"legacy",month:"2026-11",currency:"TWD",amount:50,version:0,dirty:true});
  const receipt=await sync(local,cloud).sync({client:{ownerId:A}});
  assert.equal(receipt.state,"auth_required");
  assert.equal(cloud.metrics.writes,0);
});
test("SYNC2-10 owner B never sees A's cloud rows",async()=>{
  const cloud=cloudDb(),deviceA=localDevice(A),deviceB=localDevice(B);
  deviceA.set({id:"owner-a",amount:6000});
  assert.equal((await sync(deviceA,cloud,A).sync({client:{ownerId:A}})).uploaded,1);
  const result=await sync(deviceB,cloud,B).sync({client:{ownerId:B}});
  assert.equal(result.ok,true);
  assert.equal(deviceB.rows.size,0);
});
test("SYNC2-11 local-only deleted draft is not created remotely",async()=>{
  const cloud=cloudDb(),local=localDevice();
  local.set({id:"deleted",amount:100,deletedAt:"2026-11-17T14:00:00Z"});
  const receipt=await sync(local,cloud).sync({client:{ownerId:A}});
  assert.equal(receipt.state,"pending");
  assert.equal(receipt.skipped,1);
  assert.equal(cloud.metrics.writes,0);
});
test("SYNC2-12 temporary network error preserves local edits",async()=>{
  const local=localDevice(),cloud=cloudDb();
  local.set({id:"offline",amount:300});
  const offline={...cloud,create:async()=>{throw Object.assign(new Error("offline"),{code:"NETWORK_OFFLINE"});}};
  const receipt=await sync(local,offline).sync({client:{ownerId:A}});
  assert.equal(receipt.ok,false);
  assert.equal(receipt.state,"pending");
  assert.equal(local.rows.get("offline").dirty,true);
});
test("SYNC2-13 remote list is queried once per sync",async()=>{
  const local=localDevice(),cloud=cloudDb();
  const result=await sync(local,cloud).sync({client:{ownerId:A}});
  assert.equal(result.ok,true);
  assert.equal(cloud.metrics.lists,1);
});
test("SYNC2-14 cloud adapter rejects forged explicit ownerId before write",async()=>{
  const fake={
    from(){throw new Error("WRITE_SHOULD_NOT_REACH_DATABASE");},
    auth:{getSession:async()=>({data:{session:{user:{id:A,email:"allowed@example.test"}}}}),
      getUser:async()=>({data:{user:{id:A,email:"allowed@example.test"}}})}
  };
  globalThis.LizhiAuth={client:fake,user:{id:A,email:"allowed@example.test"},
    allowedEmail:"allowed@example.test"};
  try{
    await assert.rejects(()=>Cloud.create({client:fake,record:{id:"forged",ownerId:B,
      month:"2026-11",currency:"TWD",categoryId:null,amount:300,version:0}}),
      /BUDGET_OWNER_CONFLICT|WRITE_SHOULD_NOT_REACH_DATABASE/);
  }finally{delete globalThis.LizhiAuth;}
});
