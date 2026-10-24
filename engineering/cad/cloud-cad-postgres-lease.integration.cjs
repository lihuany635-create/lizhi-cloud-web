"use strict";
// Isolated PostgreSQL 16 lease crash/recovery integration (no production access).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {Pool}=require("pg");
const {createQueue}=require("./cloud-cad-queue.cjs");
const {createWorker}=require("./cloud-cad-worker.cjs");
const {createPostgresStorage}=require("./cloud-cad-postgres-storage.cjs");
const {createPostgresLeaseManager}=require("./cloud-cad-postgres-lease.cjs");
const {createLeasedCadRunner}=require("./cloud-cad-lease-runner.cjs");
const {createPostgresRevisionStore}=require("./cloud-cad-postgres-revisions.cjs");
// Separate owner prevents intentional stale rows from preceding integration tests being claimed.
const OWNER="ccccdddd-1234-4abc-8abc-abc123456789";
const args={projectId:"leaseP",drawingId:"leaseD",baseRevision:0,operation:"create",requestId:"lease01"};
const bytes=Buffer.from("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n");
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
async function main(){
 assert.ok(process.env.DATABASE_URL?.includes("@127.0.0.1:5432/"),"Refuse remote PostgreSQL");
 const a=new Pool({connectionString:process.env.DATABASE_URL,max:3}),b=new Pool({connectionString:process.env.DATABASE_URL,max:3});
 try{
  for(const role of ["anon","authenticated"])await a.query("DO $$ BEGIN CREATE ROLE "+role+" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
  await a.query(fs.readFileSync(path.join(__dirname,"sql/000_staging_cloud_cad_jobs.sql"),"utf8"));
  const q=createQueue(createPostgresStorage({db:a,ownerId:OWNER}));
  const job=await q.enqueue(args);
  const leaseA=createPostgresLeaseManager({db:a,ownerId:OWNER});
  const leaseB=createPostgresLeaseManager({db:b,ownerId:OWNER});
  // Two concurrent claim attempts can never both own the same job.
  const [left,right]=await Promise.all([
   leaseA.claimNext({workerId:"workerA",leaseSeconds:60}),
   leaseB.claimNext({workerId:"workerB",leaseSeconds:60})
  ]);
  const active=left||right;
  assert.ok(active);assert.equal([left,right].filter(Boolean).length,1);
  assert.equal(active.job.idempotency_key,job.idempotency_key);
  const firstToken=active.lease_token,firstOwner=active.job.worker_id;
  const firstLease=firstOwner==="workerA"?leaseA:leaseB;
  const secondLease=firstOwner==="workerA"?leaseB:leaseA;
  const secondOwner=firstOwner==="workerA"?"workerB":"workerA";
  assert.equal(active.job.attempt,1);
  await firstLease.heartbeat({jobKey:job.idempotency_key,workerId:firstOwner,leaseToken:firstToken,leaseSeconds:60});
  await assert.rejects(firstLease.heartbeat({jobKey:job.idempotency_key,workerId:firstOwner,leaseToken:crypto.randomUUID()}),{code:"CAD_LEASE_LOST"});
  // Crash simulation: expired heartbeat, then a different process reclaims it.
  await a.query("UPDATE lizhi_cad_cloud_jobs SET lease_until=now()-interval '2 seconds' WHERE owner_id=$1::uuid AND idempotency_key=$2",[OWNER,job.idempotency_key]);
  const revived=await secondLease.claimNext({workerId:secondOwner,leaseSeconds:60});
  assert.equal(revived.job.idempotency_key,job.idempotency_key);
  assert.equal(revived.job.attempt,2);
  assert.notEqual(revived.lease_token,firstToken);
  await assert.rejects(firstLease.heartbeat({jobKey:job.idempotency_key,workerId:firstOwner,leaseToken:firstToken}),{code:"CAD_LEASE_LOST"});
  // Transactional publisher must require the *current* fence, even when
  // caller spoofs a valid worker ID. Previous token cannot complete work.
  const revision=createPostgresRevisionStore({db:b,ownerId:OWNER,authorizeDrawing:async()=>true});
  await q.change(job.idempotency_key,"running",{workerId:secondOwner});
  await assert.rejects(revision.publish({
   job,workerId:secondOwner,leaseToken:firstToken,
   artifact:{sha256:sha(bytes),artifacts:{dxf:{bytes}}},inspection:{valid:true,entityCount:1}
  }),{code:"CAD_LEASE_LOST"});
  const output=await revision.publish({
   job,workerId:secondOwner,leaseToken:revived.lease_token,
   artifact:{sha256:sha(bytes),artifacts:{dxf:{bytes}}},inspection:{valid:true,entityCount:1}
  });
  assert.equal(output.revision,1);assert.equal(output.job_committed,true);
  assert.equal((await q.read(job.idempotency_key)).status,"completed");
  assert.equal((await revision.read({projectId:"leaseP",drawingId:"leaseD",revision:1})).dxf.toString(),bytes.toString());
  // Production-style path: scheduler has already claimed a lease, so Worker
  // must accept it without claiming twice and publish with its fence token.
  const next=await q.enqueue({...args,baseRevision:1,operation:"modify",requestId:"lease02"});
  const claim=await secondLease.claimNext({workerId:secondOwner,leaseSeconds:60});
  assert.equal(claim.job.idempotency_key,next.idempotency_key);
  const worker=createWorker({queue:q,workerId:secondOwner,ports:{
   authorize:async()=>{},
   loadRevision:async j=>revision.read({projectId:j.project_id,drawingId:j.drawing_id,revision:j.expected_revision}),
   execute:async({source})=>({bytes:Buffer.concat([source.dxf,Buffer.from("0\nLINE\n")])}),
   inspect:async()=>({valid:true,entityCount:2}),
   storeImmutable:async({output})=>({sha256:sha(output.bytes),artifacts:{dxf:{bytes:output.bytes}}}),
   publishRevision:async({job,artifact,inspection,leaseToken})=>
    revision.publish({job,artifact,inspection,workerId:secondOwner,leaseToken})
  }});
  await assert.rejects(worker.runClaimed(next.idempotency_key,firstToken),{code:"CAD_LEASE_LOST"});
  const done=await worker.runClaimed(next.idempotency_key,claim.lease_token);
  assert.equal(done.revision,2);
  assert.equal((await q.read(next.idempotency_key)).status,"completed");
  assert.equal((await revision.read({projectId:"leaseP",drawingId:"leaseD",revision:2})).dxf.toString(),bytes.toString()+"0\nLINE\n");
  // Long-running job with real PostgreSQL heartbeat while CAD execution is
  // still in flight; not a mere timer mock.
  const third=await q.enqueue({...args,baseRevision:2,operation:"modify",requestId:"lease03"});
  const thirdClaim=await leaseB.claimNext({workerId:secondOwner,leaseSeconds:5});
  assert.equal(thirdClaim.job.idempotency_key,third.idempotency_key);
  let renewals=0;
  const slowWorker=createWorker({queue:q,workerId:secondOwner,ports:{
   authorize:async()=>{},
   loadRevision:async j=>revision.read({projectId:j.project_id,drawingId:j.drawing_id,revision:j.expected_revision}),
   execute:async({source,signal})=>{
    await new Promise(resolve=>setTimeout(resolve,170));
    assert.equal(signal.aborted,false);
    return {bytes:Buffer.concat([source.dxf,Buffer.from("0\nLINE\n")])};
   },
   inspect:async()=>({valid:true,entityCount:3}),
   storeImmutable:async({output})=>({sha256:sha(output.bytes),artifacts:{dxf:{bytes:output.bytes}}}),
   publishRevision:async({job,artifact,inspection,leaseToken})=>
    revision.publish({job,artifact,inspection,workerId:secondOwner,leaseToken})
  }});
  const activeRunner=createLeasedCadRunner({
   worker:slowWorker,workerId:secondOwner,leaseSeconds:5,heartbeatIntervalMs:30,
   leaseManager:{heartbeat:async opts=>{renewals++;return leaseB.heartbeat(opts);}}
  });
  const thirdDone=await activeRunner.runClaim(thirdClaim);
  assert.equal(thirdDone.revision,3);
  assert.ok(renewals>=2, "Lease should be renewed while geometry is executing");
  assert.equal((await q.read(third.idempotency_key)).status,"completed");
  const nothing=await leaseA.claimNext({workerId:"anotherWorker",leaseSeconds:60});
  assert.equal(nothing,null);
  console.log("CAD_POSTGRES_LEASE_RECOVERY_PASS",JSON.stringify({
   concurrent_claims:1,attempt_after_crash:2,old_token:"rejected",
   reclaimed_by:secondOwner,immutable_revision:3,job_status:"completed",leased_worker_run:"PASS",heartbeats_during_execution:renewals,
   healthy_lease_renewed:true
  }));
 }finally{await a.end();await b.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
