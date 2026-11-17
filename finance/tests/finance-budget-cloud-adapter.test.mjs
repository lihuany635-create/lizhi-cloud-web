import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const Cloud=require("../budget/budget-cloud-store.js");
const A="11111111-1111-4111-8111-111111111111",B="22222222-2222-4222-8222-222222222222";
const date="2026-11-17T00:00:00.000Z";
const makeRow=(id,owner=A,amount=100)=>({id,user_id:owner,month:"2026-11",category_id:null,
  currency:"TWD",amount,version:1,created_at:date,updated_at:date,deleted_at:null});
function harness({id=A,initial=[],email="only@example.test"}={}){
  let signedIn={id,email},allowedEmail=email,queryCount=0,authCalls=0;
  const rows=new Map(initial.map(r=>[r.id,{...r}]));
  const db={auth:{
    async getSession(){return {data:{session:signedIn?{user:signedIn}:null},error:null}},
    async getUser(){authCalls++;return {data:{user:signedIn},error:null};}
  },from(table){
    queryCount++;assert.equal(table,Cloud.TABLE);
    let mode="read",conditions=[],fields=null,payload=null,range=[0,249],order=[];
    const q={
      select(f){fields=f;return q},
      eq(k,v){conditions.push([k,v]);return q},
      order(k,opt){order.push([k,opt]);return q},
      range(a,b){range=[a,b];return q},
      insert(p){mode="insert";payload=p;return q},
      update(p){mode="update";payload=p;return q},
      async maybeSingle(){return execute(true)},
      then(resolve,reject){return execute(false).then(resolve,reject)}
    };
    async function execute(single){
      const matches=r=>conditions.every(([k,v])=>r[k]===v);
      if(!signedIn)return {data:null,error:{code:"42501"}};
      if(mode==="read"){
        let out=[...rows.values()].filter(r=>r.user_id===signedIn.id&&matches(r));
        out.sort((a,b)=>a.month.localeCompare(b.month)||a.id.localeCompare(b.id));
        out=out.slice(range[0],range[1]+1);
        return {data:out.map(r=>({...r})),error:null};
      }
      if(mode==="insert"){
        if(payload.user_id!==signedIn.id)return {data:null,error:{code:"42501"}};
        if([...rows.values()].some(r=>r.user_id===signedIn.id&&r.month===payload.month
          &&r.currency===payload.currency&&r.category_id===payload.category_id))
          return {data:null,error:{code:"23505"}};
        const row={...payload,version:1,created_at:date,updated_at:date,deleted_at:null};
        rows.set(row.id,row);return {data:{...row},error:null};
      }
      if(mode==="update"){
        const current=[...rows.values()].find(matches);
        if(!current||current.user_id!==signedIn.id)return {data:null,error:null};
        if(payload.version!==current.version+1)return {data:null,error:{code:"23514"}};
        const next={...current,...payload,updated_at:date};
        rows.set(next.id,next);return {data:{...next},error:null};
      }
      throw new Error("unexpected");
    }
    return q;
  }};
  globalThis.LizhiAuth={client:db,allowedEmail:email,get user(){return signedIn}};
  return {db,rows,setIdentity(value){signedIn=value},get queryCount(){return queryCount},
    get authCalls(){return authCalls},close(){delete globalThis.LizhiAuth}};
}
const record=(id,ownerId=A,amount=100)=>({id,ownerId,month:"2026-11",currency:"TWD",
  categoryId:null,amount,version:0,deletedAt:null});
test("CA2-01 owner-scoped minimal cloud listing via verified getUser",async()=>{
  const h=harness({initial:[makeRow("own",A),makeRow("other",B)]});
  try{
    const out=await Cloud.list({client:h.db,month:"2026-11"});
    assert.deepEqual(out.map(x=>x.id),["own"]);
    assert.equal(h.queryCount,1);
    assert.ok(h.authCalls>=2);
  }finally{h.close()}
});
test("CA2-02 insert validates ownership and persisted version",async()=>{
  const h=harness();
  try{
    const row=await Cloud.create({client:h.db,record:record("first")});
    assert.equal(row.user_id,A);assert.equal(row.version,1);
    assert.equal(h.rows.size,1);
  }finally{h.close()}
});
test("CA2-03 CAS update accepts matching version and increments once",async()=>{
  const h=harness({initial:[makeRow("first")]});
  try{
    const row=await Cloud.update({client:h.db,record:{...record("first"),version:1,amount:999}});
    assert.equal(row.version,2);assert.equal(row.amount,999);
  }finally{h.close()}
});
test("CA2-04 stale CAS update rejects without overwriting",async()=>{
  const h=harness({initial:[{...makeRow("first"),version:2,amount:1000}]});
  try{
    await assert.rejects(()=>Cloud.update({client:h.db,record:{...record("first"),version:1,amount:1}}),
      /BUDGET_VERSION_CONFLICT/);
    assert.equal(h.rows.get("first").amount,1000);
  }finally{h.close()}
});
test("CA2-05 duplicate monthly total budget creates a conflict",async()=>{
  const h=harness({initial:[makeRow("existing")]});
  try{
    await assert.rejects(()=>Cloud.create({client:h.db,record:record("duplicate")}),
      /BUDGET_SCOPE_CONFLICT/);
    assert.equal(h.rows.size,1);
  }finally{h.close()}
});
test("CA2-06 spoofed payload owner rejected before DB write",async()=>{
  const h=harness();
  try{
    await assert.rejects(()=>Cloud.create({client:h.db,record:record("spoofed",B)}),
      /BUDGET_OWNER_CONFLICT/);
    assert.equal(h.rows.size,0);
  }finally{h.close()}
});
test("CA2-07 forged second user against allowlisted identity blocked",async()=>{
  const h=harness();
  try{
    h.setIdentity({id:B,email:"other@example.test"});
    await assert.rejects(()=>Cloud.list({client:h.db}),/BUDGET_AUTH_REQUIRED/);
    assert.equal(h.queryCount,0);
  }finally{h.close()}
});
test("CA2-08 signed-out client blocked before issuing cloud request",async()=>{
  const h=harness();
  try{
    h.setIdentity(null);
    await assert.rejects(()=>Cloud.list({client:h.db}),/BUDGET_AUTH_REQUIRED/);
    assert.equal(h.queryCount,0);
  }finally{h.close()}
});
test("CA2-09 cloud response with forged user_id rejected",async()=>{
  const h=harness({initial:[makeRow("own",A)]});
  try{
    const original=h.db.from.bind(h.db);
    h.db.from=table=>{
      const q=original(table);
      q.then=(resolve,reject)=>Promise.resolve({data:[makeRow("evil",B)],error:null})
        .then(resolve,reject);
      return q;
    };
    await assert.rejects(()=>Cloud.list({client:h.db}),/BUDGET_REMOTE_OWNER_MISMATCH/);
  }finally{h.close()}
});
test("CA2-10 owner switched during network await is rejected",async()=>{
  const h=harness({initial:[makeRow("own")]});
  try{
    const original=h.db.from.bind(h.db);
    h.db.from=table=>{
      const q=original(table);
      q.then=(resolve,reject)=>Promise.resolve().then(()=>{
        h.setIdentity({id:B,email:"other@example.test"});
        return {data:[makeRow("own")],error:null};
      }).then(resolve,reject);
      return q;
    };
    await assert.rejects(()=>Cloud.list({client:h.db}),/BUDGET_AUTH_REQUIRED|BUDGET_IDENTITY_CHANGED/);
  }finally{h.close()}
});
