"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createCadPostgresIntents,SQL}=require("./cloud-cad-postgres-intents.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789",other="bbccddee-1234-4abc-8abc-abc123456789",key="f".repeat(64);
const job={cloud_job_key:key,job_key:"a".repeat(64),status:"prepared_not_executed",script:"_PLINE\n0,0\n1,0\n1,1\n_C\n"};
function fakeDb(){
 const rows=new Map();
 return {async query(sql,params){
  const [who,k,v]=params,id=who+":"+k;
  if(sql===SQL.insert){
   if(rows.has(id))return {rowCount:0,rows:[]};
   rows.set(id,JSON.parse(v));return {rowCount:1,rows:[{cloud_job_key:k}]};
  }
  if(sql===SQL.get)return {rowCount:rows.has(id)?1:0,rows:rows.has(id)?[{prepared_job:structuredClone(rows.get(id))}]:[]};
  throw Error("unexpected SQL");
 }};
}
test("store/reload immutable prepared CAD job from DB contract",async()=>{
 const db=fakeDb(),a=createCadPostgresIntents({db});
 assert.equal((await a.putIfAbsent({ownerId:owner,key,value:job})).job_key,job.job_key);
 const b=createCadPostgresIntents({db});
 assert.equal((await b.get({ownerId:owner,key})).script,job.script);
 assert.equal((await b.putIfAbsent({ownerId:owner,key,value:job})).job_key,job.job_key);
});
test("rejects same request with changed compiled geometry",async()=>{
 const s=createCadPostgresIntents({db:fakeDb()});
 await s.putIfAbsent({ownerId:owner,key,value:job});
 await assert.rejects(s.putIfAbsent({ownerId:owner,key,value:{...job,job_key:"b".repeat(64)}}),{code:"CAD_INTENT_CONFLICT"});
});
test("same cloud job key is scoped to verified owner",async()=>{
 const s=createCadPostgresIntents({db:fakeDb()});
 await s.putIfAbsent({ownerId:owner,key,value:job});
 assert.equal(await s.get({ownerId:other,key}),null);
 await s.putIfAbsent({ownerId:other,key,value:{...job,job_key:"b".repeat(64)}});
 assert.equal((await s.get({ownerId:other,key})).job_key,"b".repeat(64));
});
test("rejects malformed owner, job key and oversized script",async()=>{
 const s=createCadPostgresIntents({db:fakeDb()});
 await assert.rejects(s.get({ownerId:"../escape",key}),{code:"CAD_OWNER_INVALID"});
 await assert.rejects(s.get({ownerId:owner,key:"../escape"}),{code:"CAD_KEY_INVALID"});
 await assert.rejects(s.putIfAbsent({ownerId:owner,key,value:{...job,script:"x".repeat(300001)}}),{code:"CAD_INTENT_INVALID"});
});
