"use strict";
// Disposable PostgreSQL16 integration: OAuth revoked *after* object upload but
// *before* final database publication must block the revision transaction.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {Pool}=require("pg");
const {createCadOauthAcl}=require("./cloud-cad-oauth-acl.cjs");
const {createQueue}=require("./cloud-cad-queue.cjs");
const {createPostgresStorage}=require("./cloud-cad-postgres-storage.cjs");
const {createObjectRevisionStore}=require("./cloud-cad-object-revisions.cjs");
const owner="ddddcccc-1234-4abc-8abc-abc123456789",project="revocationP",drawing="revocationD",oauthClient="approved-client";
const workerId="workerR";
const sha=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const dxf=Buffer.from("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n");
async function main(){
 assert.ok(process.env.DATABASE_URL?.includes("@127.0.0.1:5432/"),"Refusing remote PostgreSQL");
 const db=new Pool({connectionString:process.env.DATABASE_URL});
 try{
  for(const role of ["anon","authenticated"])await db.query("DO $$ BEGIN CREATE ROLE "+role+" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
  await db.query(fs.readFileSync(path.join(__dirname,"sql/000_staging_cloud_cad_jobs.sql"),"utf8"));
  await db.query(fs.readFileSync(path.join(__dirname,"sql/001_staging_cad_oauth_grants.sql"),"utf8"));
  await db.query("INSERT INTO public.lizhi_cad_oauth_project_grants(owner_id,project_id,oauth_client_id,can_write) VALUES ($1::uuid,$2,$3,true)",[owner,project,oauthClient]);
  const acl=createCadOauthAcl({db});
  const authorizeDrawing=opts=>acl.authorizeDrawing({...opts,clientId:oauthClient});
  const queue=createQueue(createPostgresStorage({db,ownerId:owner}));
  const queued=await queue.enqueue({projectId:project,drawingId:drawing,baseRevision:0,requestId:"publish-revoked",operation:"create"});
  await queue.change(queued.idempotency_key,"claimed",{workerId});
  await queue.change(queued.idempotency_key,"running",{workerId});
  let uploaded=false;
  const objects={
   async put(opts){
    assert.equal(opts.format,"dxf");
    uploaded=true;
    await db.query("UPDATE public.lizhi_cad_oauth_project_grants SET revoked_at=now() WHERE owner_id=$1::uuid AND project_id=$2 AND oauth_client_id=$3",[owner,project,oauthClient]);
    return {bucket:"ci-only",object_key:"cad-v1/"+owner+"/"+project+"/"+drawing+"/1/"+queued.idempotency_key+"/dxf",sha256:sha(opts.bytes),byte_size:opts.bytes.length};
   },
   async get(){throw Error("No committed object can be read");}
  };
  const revisions=createObjectRevisionStore({db,ownerId:owner,authorizeDrawing,objects});
  const prepared={job_key:sha(Buffer.from("compiled-intent")),cloud_job_key:queued.idempotency_key,project_id:project,drawing_id:drawing,drawing_revision:0};
  await assert.rejects(revisions.stageAndPublish({
   job:queued,preparedJob:prepared,artifact:{sha256:sha(dxf),artifacts:{dxf:{bytes:dxf}}},
   inspection:{valid:true,entityCount:1},workerId
  }),{code:"CAD_OBJECT_ACCESS_DENIED"});
  assert.equal(uploaded,true);
  const state=await db.query("SELECT count(*)::int AS n FROM public.lizhi_cad_cloud_object_revisions WHERE owner_id=$1::uuid",[owner]);
  assert.equal(state.rows[0].n,0);
  const head=await db.query("SELECT count(*)::int AS n FROM public.lizhi_cad_cloud_drawings WHERE owner_id=$1::uuid",[owner]);
  assert.equal(head.rows[0].n,0);
  assert.equal((await queue.read(queued.idempotency_key)).status,"running");
  const attempt=await db.query("SELECT published_at FROM public.lizhi_cad_cloud_upload_attempts WHERE owner_id=$1::uuid AND job_key=$2",[owner,queued.idempotency_key]);
  assert.equal(attempt.rowCount,1);
  assert.equal(attempt.rows[0].published_at,null);
  console.log("CAD_POSTGRES_REVOKE_DURING_UPLOAD_BLOCKED",JSON.stringify({
   object_uploaded:true,version_published:false,job_completed:false,
   orphan_audit_retained:true,authorization_checked_in_transaction:true
  }));
 }finally{await db.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
