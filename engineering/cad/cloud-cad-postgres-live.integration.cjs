"use strict";
// Real PostgreSQL integration: runs only under the isolated Actions postgres service.
// Never connects to production Supabase. Invoke with DATABASE_URL and NODE_PATH(pg).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {Pool}=require("pg");
const {createQueue}=require("./cloud-cad-queue.cjs");
const {createPostgresStorage}=require("./cloud-cad-postgres-storage.cjs");
const {createCadPostgresIntents}=require("./cloud-cad-postgres-intents.cjs");
const {prepareJob}=require("./cadcraft-export-job.cjs");
const OWNER="aabbccdd-1234-4abc-8abc-abc123456789",OTHER="bbccddee-1234-4abc-8abc-abc123456789";
const args={projectId:"cloudp",drawingId:"drawing1",baseRevision:0,operation:"create",requestId:"req1"};
const spec={schema_version:"cad-drawing-spec@1",units:"mm",view:"front",source_identity:{design_id:"cab",revision:9},entities:[{type:"polyline",layer:"FURNITURE",closed:true,points:[[0,0],[800,0],[800,900],[0,900]]}]};
async function main(){
 assert.ok(process.env.DATABASE_URL?.includes("@127.0.0.1:5432/"),"Refusing to run without isolated local PostgreSQL");
 const a=new Pool({connectionString:process.env.DATABASE_URL,max:3}),b=new Pool({connectionString:process.env.DATABASE_URL,max:3});
 try{
  for(const role of ["anon","authenticated"])await a.query("DO $$ BEGIN CREATE ROLE "+role+" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
  const sql=fs.readFileSync(path.join(__dirname,"sql","000_staging_cloud_cad_jobs.sql"),"utf8");
  await a.query(sql);
  const storeA=createPostgresStorage({db:a,ownerId:OWNER}),storeB=createPostgresStorage({db:b,ownerId:OWNER});
  const queueA=createQueue(storeA),queueB=createQueue(storeB);
  const [first,duplicate]=await Promise.all([queueA.enqueue(args),queueB.enqueue(args)]);
  assert.equal(first.idempotency_key,duplicate.idempotency_key);
  assert.equal((await a.query("SELECT count(*)::int AS n FROM lizhi_cad_cloud_jobs")).rows[0].n,1);
  const prepared=prepareJob(spec,{projectId:args.projectId,drawingId:args.drawingId,cloudJobKey:first.idempotency_key,drawingRevision:0});
  const intentsA=createCadPostgresIntents({db:a}),intentsB=createCadPostgresIntents({db:b});
  await intentsA.putIfAbsent({ownerId:OWNER,key:first.idempotency_key,value:prepared});
  assert.equal((await intentsB.get({ownerId:OWNER,key:first.idempotency_key})).job_key,prepared.job_key);
  await intentsB.putIfAbsent({ownerId:OWNER,key:first.idempotency_key,value:prepared});
  await assert.rejects(intentsB.putIfAbsent({ownerId:OWNER,key:first.idempotency_key,value:{...prepared,job_key:"f".repeat(64)}}),{code:"CAD_INTENT_CONFLICT"});
  assert.equal(await intentsB.get({ownerId:OTHER,key:first.idempotency_key}),null);
  assert.equal(await createPostgresStorage({db:a,ownerId:OTHER}).get(first.idempotency_key),null);
  const before=await storeB.get(first.idempotency_key);
  const claimed=await queueA.change(first.idempotency_key,"claimed",{workerId:"worker1"});
  assert.equal(claimed.status,"claimed");assert.equal((await queueB.read(first.idempotency_key)).status,"claimed");
  const illegal=await storeB.compareAndSwap(first.idempotency_key,before,{...before,status:"cancelled"});
  assert.equal(illegal,false);
  const running=await queueB.change(first.idempotency_key,"running",{workerId:"worker1"});
  assert.equal(running.status,"running");
  await queueA.change(first.idempotency_key,"completed",{workerId:"worker1",outputRevision:1});
  assert.equal((await queueB.read(first.idempotency_key)).output_revision,1);
  // Privilege checks: the migration grants no direct read to browser roles.
  const client=await a.connect();
  try{
   await client.query("SET ROLE authenticated");
   await assert.rejects(client.query("SELECT * FROM public.lizhi_cad_cloud_jobs"),error=>error.code==="42501");
  }finally{await client.query("RESET ROLE");client.release();}
  console.log("POSTGRES_REAL_CLOUD_CAD_PASS",JSON.stringify({duplicate_insert:"blocked",intent_conflict:"blocked",cross_owner_read:"denied",cas:"atomic",restart_simulated_with_independent_pool:true,output_revision:1,rls_privilege:"denied_to_authenticated"}));
 }finally{await a.end();await b.end();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
