"use strict";
// Disposable PostgreSQL 16 integration; DATABASE_URL MUST target loopback CI.
const assert=require("node:assert/strict"),crypto=require("node:crypto");
const fs=require("node:fs"),path=require("node:path"),{Pool}=require("pg");
const {createQueue}=require("./cloud-cad-queue.cjs");
const {createWorker}=require("./cloud-cad-worker.cjs");
const {createPostgresStorage}=require("./cloud-cad-postgres-storage.cjs");
const {createPostgresRevisionStore}=require("./cloud-cad-postgres-revisions.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789",other="bbccddee-1234-4abc-8abc-abc123456789";
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const input=(revision,requestId)=>({projectId:"projectR",drawingId:"drawingR",baseRevision:revision,operation:revision===0?"create":"modify",requestId});
async function main(){
 assert.ok(process.env.DATABASE_URL?.includes("@127.0.0.1:5432/"),"Local ephemeral PostgreSQL required");
 const a=new Pool({connectionString:process.env.DATABASE_URL,max:4}),b=new Pool({connectionString:process.env.DATABASE_URL,max:4});
 try{
  for(const role of ["anon","authenticated"])await a.query("DO $$ BEGIN CREATE ROLE "+role+" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
  await a.query(fs.readFileSync(path.join(__dirname,"sql/000_staging_cloud_cad_jobs.sql"),"utf8"));
  const acl=async({ownerId,projectId,drawingId})=>ownerId===owner&&projectId==="projectR"&&drawingId==="drawingR";
  const revA=createPostgresRevisionStore({db:a,ownerId:owner,authorizeDrawing:acl});
  const revB=createPostgresRevisionStore({db:b,ownerId:owner,authorizeDrawing:acl});
  const qA=createQueue(createPostgresStorage({db:a,ownerId:owner}));
  const qB=createQueue(createPostgresStorage({db:b,ownerId:owner}));
  // First revision: actual Worker calls the transactional publication adapter.
  const first=await qA.enqueue(input(0,"first"));
  const firstDxf=Buffer.from("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n");
  const ports={
   authorize:async()=>{},
   loadRevision:async j=>revA.read({projectId:j.project_id,drawingId:j.drawing_id,revision:j.expected_revision}),
   execute:async({job,source})=>{
    if(job.expected_revision===0)assert.equal(source,null);
    else assert.ok(source&&Buffer.isBuffer(source.dxf));
    return {bytes:job.expected_revision===0?firstDxf:Buffer.concat([source.dxf,Buffer.from("0\nLINE\n")])};
   },
   inspect:async({output})=>({valid:true,entityCount:1,extents:[[0,0],[800,900]]}),
   storeImmutable:async({output})=>({sha256:sha(output.bytes),artifacts:{dxf:{bytes:output.bytes}}}),
   publishRevision:async({job,artifact,inspection})=>revA.publish({job,artifact,inspection,workerId:"workerR"})
  };
  const worker=createWorker({queue:qA,ports,workerId:"workerR"});
  const result1=await worker.run(first.idempotency_key);
  assert.equal(result1.revision,1);
  assert.equal((await qB.read(first.idempotency_key)).status,"completed");
  assert.equal((await qB.read(first.idempotency_key)).output_revision,1);
  const source1=await revB.read({projectId:"projectR",drawingId:"drawingR",revision:1});
  assert.equal(source1.dxf.toString(),firstDxf.toString());
  const firstArtifact={sha256:sha(firstDxf),artifacts:{dxf:{bytes:firstDxf}}};
  const replay=await revB.publish({job:first,artifact:firstArtifact,inspection:{valid:true},workerId:"workerR"});
  assert.equal(replay.reused,true);assert.equal(replay.revision,1);
  // New edit: old revision must remain unchanged and new revision persisted.
  const second=await qB.enqueue(input(1,"second"));
  const result2=await worker.run(second.idempotency_key);
  assert.equal(result2.revision,2);
  const source2=await revB.read({projectId:"projectR",drawingId:"drawingR",revision:2});
  assert.equal(source2.dxf.toString(),firstDxf.toString()+"0\nLINE\n");
  assert.equal((await revA.read({projectId:"projectR",drawingId:"drawingR",revision:1})).sha256,sha(firstDxf));
  // Two workers competing at the same revision; one must fail atomically.
  const third=await qA.enqueue(input(2,"third"));
  const fourth=await qB.enqueue(input(2,"fourth"));
  for(const j of [third,fourth]){
   const q=j.idempotency_key===third.idempotency_key?qA:qB;
   await q.change(j.idempotency_key,"claimed",{workerId:"workerR"});
   await q.change(j.idempotency_key,"running",{workerId:"workerR"});
  }
  const thirdBytes=Buffer.from("version-three");
  const makeArtifact=b=>({sha256:sha(b),artifacts:{dxf:{bytes:b}}});
  assert.equal((await revA.publish({job:third,artifact:makeArtifact(thirdBytes),inspection:{valid:true},workerId:"workerR"})).revision,3);
  await assert.rejects(revB.publish({job:fourth,artifact:makeArtifact(Buffer.from("stale-write")),inspection:{valid:true},workerId:"workerR"}),{code:"CAD_REVISION_CONFLICT"});
  assert.equal((await qB.read(fourth.idempotency_key)).status,"running");
  assert.equal((await qA.read(third.idempotency_key)).status,"completed");
  // Revision bytes do not leak to another owner or project.
  const otherStore=createPostgresRevisionStore({db:b,ownerId:other,authorizeDrawing:async()=>true});
  await assert.rejects(otherStore.read({projectId:"projectR",drawingId:"drawingR",revision:1}),{code:"CAD_REVISION_NOT_FOUND"});
  await assert.rejects(revA.read({projectId:"wrongProject",drawingId:"drawingR",revision:1}),{code:"CAD_REVISION_ACCESS_DENIED"});
  for(const table of ["lizhi_cad_cloud_revisions","lizhi_cad_cloud_drawings"]){
   const client=await a.connect();
   try{
    await client.query("SET ROLE authenticated");
    await assert.rejects(client.query("SELECT * FROM public."+table),e=>e.code==="42501");
   }finally{await client.query("RESET ROLE");client.release();}
  }
  console.log("CAD_POSTGRES_IMMUTABLE_REVISIONS_PASS",JSON.stringify({
   first:1,second:2,third:3,atomicCompletion:true,idempotentReplay:true,
   olderVersionRetained:true,concurrentStaleWrite:"blocked",privateTables:"denied",
   independentConnectionRead:true
  }));
 }finally{await a.end();await b.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
