"use strict";
// CI ONLY: genuine Linux CADCraft + real JSON-RPC over loopback HTTP +
// disposable PostgreSQL 16 + Moto S3 HTTP. Identity validation is a test
// bearer stub; NEVER run this script against production projects or storage.
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const http=require("node:http");
const {spawnSync}=require("node:child_process");
const {Pool}=require("pg");
const {S3Client,CreateBucketCommand,PutObjectCommand,GetObjectCommand,HeadObjectCommand}=require("@aws-sdk/client-s3");
const {createQueue}=require("./cloud-cad-queue.cjs");
const {createPostgresStorage}=require("./cloud-cad-postgres-storage.cjs");
const {createCadPostgresIntents}=require("./cloud-cad-postgres-intents.cjs");
const {createCadS3Store}=require("./cloud-cad-s3-store.cjs");
const {createObjectRevisionStore}=require("./cloud-cad-object-revisions.cjs");
const {createObjectWorkerPorts}=require("./cloud-cad-object-worker-ports.cjs");
const {createWorker}=require("./cloud-cad-worker.cjs");
const {createCadcraftExecute}=require("./cloud-cad-execute.cjs");
const {createCadMcpService}=require("./cloud-cad-mcp-service.cjs");
const {createCadMcpHttpHandler}=require("./cloud-cad-mcp-http.cjs");
const {createCadOauthAcl}=require("./cloud-cad-oauth-acl.cjs");
const {createCadWorkerHost}=require("./cloud-cad-worker-host.cjs");

const OWNER="feddcbaa-1234-4abc-8abc-abc123456789";
const PROJECT="cadRealCloud",DRAWING="realCabinet",WORKER="cloudCadWorker",CLIENT="ci-oauth-granted";
const sha=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const spec=(points)=>({
 schema_version:"cad-drawing-spec@1",units:"mm",view:"front",
 source_identity:{design_id:"cabinet-demo",revision:9},
 entities:[{type:"polyline",layer:"FURNITURE",closed:true,points}]
});
function inspect(bin,dxf){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"lizhi-cad-info-"));
 try{
  const file=path.join(dir,"drawing.dxf");
  fs.writeFileSync(file,dxf);
  const res=spawnSync(bin,["info",file],{
   encoding:"utf8",timeout:30000,maxBuffer:1024*1024,
   env:{PATH:process.env.PATH||"",HOME:dir,CADCRAFT_CONFIG_DIR:dir}
  });
  assert.equal(res.status,0,"CADCraft info failed: "+res.stderr);
  return JSON.parse(res.stdout);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
async function main(){
 const bin=process.env.CADCRAFT_BIN;
 assert.ok(bin&&fs.existsSync(bin),"Verified Linux CADCraft binary is required");
 assert.ok(process.env.DATABASE_URL?.includes("@127.0.0.1:5432/"),"Only CI localhost PostgreSQL allowed");
 assert.equal(process.env.CAD_TEST_S3_ENDPOINT,"http://127.0.0.1:9000","Only CI localhost S3 allowed");
 const db=new Pool({connectionString:process.env.DATABASE_URL,max:4});
 const s3=new S3Client({
  endpoint:process.env.CAD_TEST_S3_ENDPOINT,
  region:"us-east-1",forcePathStyle:true,
  credentials:{accessKeyId:"cad_ci_only",secretAccessKey:"cad_ci_only_password"}
 });
 let server=null;
 try{
  for(const role of ["anon","authenticated"])
   await db.query("DO $$ BEGIN CREATE ROLE "+role+" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
  await db.query(fs.readFileSync(path.join(__dirname,"sql/000_staging_cloud_cad_jobs.sql"),"utf8"));
  await db.query(fs.readFileSync(path.join(__dirname,"sql/001_staging_cad_oauth_grants.sql"),"utf8"));
  await db.query("INSERT INTO public.lizhi_cad_oauth_project_grants(owner_id,project_id,oauth_client_id,can_write) VALUES ($1::uuid,$2,$3,true)",[OWNER,PROJECT,CLIENT]);
  const bucket="cad-real-engine-"+crypto.randomBytes(4).toString("hex");
  await s3.send(new CreateBucketCommand({Bucket:bucket}));
  const s3Store=createCadS3Store({client:s3,sdk:{PutObjectCommand,GetObjectCommand,HeadObjectCommand},bucket});
  const grants=createCadOauthAcl({db});
  const acl=async args=>args.drawingId===DRAWING&&grants.authorizeDrawing(args);
  const inspectAcl=async args=>acl({...args,clientId:CLIENT});
  const revisionStore=createObjectRevisionStore({
   db,ownerId:OWNER,authorizeDrawing:inspectAcl,objects:s3Store
  });
  const intents=createCadPostgresIntents({db});
  const queue=createQueue(createPostgresStorage({db,ownerId:OWNER}));
  const service=createCadMcpService({
   authorizeDrawing:acl,queueForOwner:()=>queue,intents,requireOAuthClient:true
  });
  server=http.createServer(createCadMcpHttpHandler({
   service,verifyBearer:async(token)=>token==="CI_STUB_ONLY"?{userId:OWNER,clientId:CLIENT}:null
  }));
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const address="http://127.0.0.1:"+server.address().port+"/mcp";
  let requestId=0;
  async function call(name,args){
   const rpc={jsonrpc:"2.0",id:++requestId,method:"tools/call",params:{name,arguments:args}};
   const resp=await fetch(address,{
    method:"POST",
    headers:{"content-type":"application/json","authorization":"Bearer CI_STUB_ONLY"},
    body:JSON.stringify(rpc)
   });
   assert.equal(resp.status,200);
   const payload=await resp.json();
   assert.equal(payload.result?.isError,false,JSON.stringify(payload));
   return JSON.parse(payload.result.content[0].text);
  }
  const workerHost=createCadWorkerHost({
   db,ownerId:OWNER,workerId:WORKER,binPath:bin,objects:s3Store,
   authorizeDrawing:acl,leaseSeconds:30,heartbeatIntervalMs:1000
  });
  const request=async(baseRevision,requestId,points)=>{
   const result=await call("cad_submit_drawing",{
    projectId:PROJECT,drawingId:DRAWING,baseRevision,requestId,
    operation:baseRevision===0?"create":"modify",
    spec:spec(points)
   });
   assert.equal(result.status,"queued");
   assert.equal((await call("cad_job_status",{projectId:PROJECT,drawingId:DRAWING,jobKey:result.job_key})).status,"queued");
   const completed=await workerHost.runOnce();
   assert.equal(completed.revision,baseRevision+1);
   const status=await call("cad_job_status",{projectId:PROJECT,drawingId:DRAWING,jobKey:result.job_key});
   assert.equal(status.output_revision,baseRevision+1);
   assert.equal(status.status,"completed");
   return result.job_key;
  };
  const firstKey=await request(0,"real-first",[[0,0],[800,0],[800,900],[0,900]]);
  const rev1=await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:1});
  const secondKey=await request(1,"real-second",[[900,900],[1000,900],[1000,1000],[900,1000]]);
  const rev2=await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:2});
  assert.notEqual(rev1.sha256,rev2.sha256);
  assert.equal(sha(rev1.bytes),rev1.sha256);
  assert.equal(sha(rev2.bytes),rev2.sha256);
  const firstInfo=inspect(bin,rev1.bytes),secondInfo=inspect(bin,rev2.bytes);
  assert.equal(firstInfo.entityCount,1);
  assert.equal(secondInfo.entityCount,2);
  assert.deepEqual(secondInfo.extents,[[0,0],[1000,1000]]);
  const rev2svg=await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:2,format:"svg"});
  const rev2png=await revisionStore.read({projectId:PROJECT,drawingId:DRAWING,revision:2,format:"png"});
  assert.ok(rev2svg.bytes.length>10&&rev2png.bytes.length>24);
  const rows=await db.query(
   "SELECT revision,job_key,artifacts FROM public.lizhi_cad_cloud_object_revisions WHERE owner_id=$1::uuid AND drawing_id=$2 ORDER BY revision",
   [OWNER,DRAWING]
  );
  assert.deepEqual(rows.rows.map(r=>r.revision),[1,2]);
  assert.deepEqual(rows.rows.map(r=>r.job_key),[firstKey,secondKey]);
  assert.notEqual(rows.rows[0].artifacts.dxf.object_key,rows.rows[1].artifacts.dxf.object_key);
  const revokedJob=await call("cad_submit_drawing",{
   projectId:PROJECT,drawingId:DRAWING,baseRevision:2,
   requestId:"queued-before-revocation",operation:"modify",
   spec:spec([[1100,1100],[1200,1100],[1200,1200],[1100,1200]])
  });
  await db.query("UPDATE public.lizhi_cad_oauth_project_grants SET revoked_at=now() WHERE owner_id=$1::uuid AND project_id=$2 AND oauth_client_id=$3",[OWNER,PROJECT,CLIENT]);
  await assert.rejects(workerHost.runOnce(),{code:"CAD_ACCESS_REVOKED"});
  assert.equal((await queue.read(revokedJob.job_key)).status,"failed");
  const latest=await db.query("SELECT current_revision FROM public.lizhi_cad_cloud_drawings WHERE owner_id=$1::uuid AND drawing_id=$2",[OWNER,DRAWING]);
  assert.equal(latest.rows[0].current_revision,2);
  assert.equal(await workerHost.runOnce(),null);
  const evidence=path.resolve("cad-real-storage-evidence");
  fs.mkdirSync(evidence,{recursive:true});
  for(const [name,bytes] of [
   ["rev1.dxf",rev1.bytes],["rev2.dxf",rev2.bytes],
   ["rev2.svg",rev2svg.bytes],["rev2.png",rev2png.bytes]
  ])fs.writeFileSync(path.join(evidence,name),bytes);
  const proof={
   engine:"CADCraft",version:"0.12.0",platform:"GitHub Actions Ubuntu",
   actual_engine_in_this_run:true,mcp:"REAL_LOOPBACK_JSON_RPC_TEST_AUTH_STUB",
   database:"EPHEMERAL_POSTGRESQL16",object_storage:"MOTO_S3_HTTP_EMULATOR",
   revisions:[1,2],geometry_counts:[firstInfo.entityCount,secondInfo.entityCount],
   geometry_extents:[firstInfo.extents,secondInfo.extents],
   revision_sha256:[rev1.sha256,rev2.sha256],
   preview_sha256:{svg:rev2svg.sha256,png:rev2png.sha256},
   oauth_client_bound_intent:true,worker_rechecks_revoked_client:true,
   worker_lease_claim_and_publish:true,queued_revoked_job:"DENIED_AND_FAILED",
   persistent_cloud_service_deployed:false,production_supabase_connected:false
  };
  fs.writeFileSync(path.join(evidence,"verification.json"),JSON.stringify(proof,null,2));
  console.log("CAD_REAL_ENGINE_POSTGRES_S3_MCP_E2E_PASS",JSON.stringify(proof));
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  await db.end();s3.destroy();
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
