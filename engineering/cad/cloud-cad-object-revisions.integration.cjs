"use strict";
// Disposable PostgreSQL 16 + Moto S3 HTTP integration, never production.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {Pool}=require("pg");
const {S3Client,CreateBucketCommand,PutObjectCommand,HeadObjectCommand,GetObjectCommand}=require("@aws-sdk/client-s3");
const {createQueue}=require("./cloud-cad-queue.cjs");
const {createPostgresStorage}=require("./cloud-cad-postgres-storage.cjs");
const {createCadS3Store}=require("./cloud-cad-s3-store.cjs");
const {createObjectRevisionStore}=require("./cloud-cad-object-revisions.cjs");
const OWNER="aabbccdd-1234-4abc-8abc-abc123456789";
const PROJECT="joinedP",DRAWING="joinedD",WORKER="joinWorker";
const dxfA=Buffer.from("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n");
const dxfB=Buffer.from("0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n0\nENDSEC\n0\nEOF\n");
const dxfC=Buffer.from("0\nSECTION\n2\nENTITIES\n0\nCIRCLE\n8\n0\n0\nENDSEC\n0\nEOF\n");
const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L10 10"/></svg>');
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
async function main(){
 assert.ok(process.env.DATABASE_URL?.includes("@127.0.0.1:5432/"),"Disposable localhost PostgreSQL required");
 assert.equal(process.env.CAD_TEST_S3_ENDPOINT,"http://127.0.0.1:9000","Disposable localhost S3 required");
 const db=new Pool({connectionString:process.env.DATABASE_URL,max:4});
 const s3=new S3Client({endpoint:process.env.CAD_TEST_S3_ENDPOINT,region:"us-east-1",forcePathStyle:true,
   credentials:{accessKeyId:"cad_ci_only",secretAccessKey:"cad_ci_only_password"}});
 try{
  for(const role of ["anon","authenticated"])
   await db.query("DO $$ BEGIN CREATE ROLE "+role+" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
  await db.query(fs.readFileSync(path.join(__dirname,"sql/000_staging_cloud_cad_jobs.sql"),"utf8"));
  const bucket="cad-object-join-"+crypto.randomBytes(4).toString("hex");
  await s3.send(new CreateBucketCommand({Bucket:bucket}));
  const objectStore=createCadS3Store({client:s3,sdk:{PutObjectCommand,HeadObjectCommand,GetObjectCommand},bucket});
  const acl=async({ownerId,projectId,drawingId})=>ownerId===OWNER&&projectId===PROJECT&&drawingId===DRAWING;
  const revisionStore=createObjectRevisionStore({db,ownerId:OWNER,authorizeDrawing:acl,objects:objectStore});
  const q=createQueue(createPostgresStorage({db,ownerId:OWNER}));
  const prepare=async(baseRevision,requestId)=>{
   const job=await q.enqueue({projectId:PROJECT,drawingId:DRAWING,baseRevision,operation:baseRevision===0?"create":"modify",requestId});
   await q.change(job.idempotency_key,"claimed",{workerId:WORKER});
   await q.change(job.idempotency_key,"running",{workerId:WORKER});
   const preparedJob={
    job_key:sha(Buffer.from("compiled-"+requestId)),
    cloud_job_key:job.idempotency_key,
    status:"prepared_not_executed",
    project_id:PROJECT,drawing_id:DRAWING,drawing_revision:baseRevision,
    source_identity:{design_id:"cad-model",revision:11},view:"front",exporter_version:"cadcraft-0.12.0"
   };
   return {job,preparedJob};
  };
  const artifact=(dxf,includeSvg=true)=>({
   sha256:sha(dxf),artifacts:{dxf:{bytes:dxf},...(includeSvg?{svg:{bytes:svg}}:{})}
  });
  const inspection={valid:true,entityCount:1,extents:[[0,0],[10,10]]};
  const first=await prepare(0,"joined-first");
  const a=await revisionStore.stageAndPublish({...first,artifact:artifact(dxfA),inspection,workerId:WORKER});
  assert.equal(a.revision,1);assert.equal(a.job_committed,true);
  assert.equal((await q.read(first.job.idempotency_key)).status,"completed");
  const bytes1=await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:1});
  assert.ok(bytes1.bytes.equals(dxfA));
  assert.equal((await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:1,format:"svg"})).bytes.toString(),svg.toString());
  const rev2=await prepare(1,"joined-second");
  const b=await revisionStore.stageAndPublish({...rev2,artifact:artifact(dxfB),inspection,workerId:WORKER});
  assert.equal(b.revision,2);
  assert.ok((await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:1})).bytes.equals(dxfA));
  assert.ok((await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:2})).bytes.equals(dxfB));
  assert.notEqual(a.artifacts.dxf.object_key,b.artifacts.dxf.object_key);

  // Two revisions from identical base must be namespaced by immutable job ID,
  // so the losing worker does not block the rightful published S3 object.
  const win=await prepare(2,"third-winner"),lose=await prepare(2,"third-loser");
  const committed=await revisionStore.stageAndPublish({...win,artifact:artifact(dxfC),inspection,workerId:WORKER});
  assert.equal(committed.revision,3);
  await assert.rejects(
   revisionStore.stageAndPublish({...lose,artifact:artifact(dxfB),inspection,workerId:WORKER}),
   {code:"CAD_OBJECT_REVISION_CONFLICT"}
  );
  assert.equal((await q.read(lose.job.idempotency_key)).status,"running");
  assert.ok((await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:3})).bytes.equals(dxfC));
  await q.change(lose.job.idempotency_key,"failed",{workerId:WORKER});
  const failed=await prepare(3,"unpublished-upload");
  // Partial S3 upload => no DB version commit; audit record remains for review.
  const broken={put:async p=>{
    if(p.format==="svg")throw new Error("SIMULATED_S3_UPLOAD_FAILURE");
    return objectStore.put(p);
  },get:x=>objectStore.get(x)};
  const brokenStore=createObjectRevisionStore({db,ownerId:OWNER,authorizeDrawing:acl,objects:broken});
  await assert.rejects(brokenStore.stageAndPublish({
   ...failed,artifact:artifact(dxfA),inspection,workerId:WORKER
  }),/SIMULATED_S3_UPLOAD_FAILURE/);
  assert.equal((await q.read(failed.job.idempotency_key)).status,"running");
  const head=await db.query("SELECT current_revision FROM lizhi_cad_cloud_drawings WHERE owner_id=$1::uuid AND drawing_id=$2",[OWNER,DRAWING]);
  assert.equal(head.rows[0].current_revision,3);
  await q.change(failed.job.idempotency_key,"failed",{workerId:WORKER});
  await db.query("UPDATE lizhi_cad_cloud_upload_attempts SET created_at=now()-interval '2 hours' WHERE owner_id=$1::uuid AND published_at IS NULL",[OWNER]);
  const orphan=await revisionStore.listOrphanCandidates({olderThanMinutes:60});
  assert.deepEqual(orphan.map(x=>x.job_key).sort(),
   [lose.job.idempotency_key,failed.job.idempotency_key].sort());
  assert.ok(orphan.every(x=>x.action==="REVIEW_ONLY_NO_DELETE"));
  assert.equal((await q.read(first.job.idempotency_key)).status,"completed");

  // Metadata and owner ACL guard against accidentally fetching foreign assets.
  const forbidden=createObjectRevisionStore({db,ownerId:OWNER,authorizeDrawing:async()=>false,objects:objectStore});
  await assert.rejects(forbidden.read({projectId:PROJECT,drawingId:DRAWING,revision:1}),{code:"CAD_OBJECT_ACCESS_DENIED"});
  console.log("CAD_POSTGRES_S3_ATOMIC_PUBLICATION_PASS",JSON.stringify({
   published:[1,2,3],old_revision_preserved:true,
   distinct_job_object_keys:true,concurrent_conflict:"blocked",
   upload_failure_db_revision_unchanged:true,pending_orphan_candidates:orphan.length,
   gc:"REVIEW_ONLY_NO_DELETE",postgres_and_s3:"REAL_HTTP_TEST_SERVICES"
  }));
 }finally{await db.end();s3.destroy();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
