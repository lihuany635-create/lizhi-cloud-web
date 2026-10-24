"use strict";
// Single-owner staging worker processor. The host is still responsible for
// long-lived process management, access to trusted DB credentials and
// operating-system sandboxing of the official CADCraft binary.
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const {createQueue}=require("./cloud-cad-queue.cjs");
const {createPostgresStorage}=require("./cloud-cad-postgres-storage.cjs");
const {createPostgresLeaseManager}=require("./cloud-cad-postgres-lease.cjs");
const {createCadPostgresIntents}=require("./cloud-cad-postgres-intents.cjs");
const {createCadcraftExecute}=require("./cloud-cad-execute.cjs");
const {createObjectRevisionStore}=require("./cloud-cad-object-revisions.cjs");
const {createObjectWorkerPorts}=require("./cloud-cad-object-worker-ports.cjs");
const {createWorker}=require("./cloud-cad-worker.cjs");
const {createLeasedCadRunner}=require("./cloud-cad-lease-runner.cjs");
class CadWorkerHostError extends Error{constructor(code,message){super(message);this.name="CadWorkerHostError";this.code=code;}}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKER=/^[A-Za-z0-9_-]{1,128}$/;
function inspectWithCadcraft({binPath,output}){
 const bytes=output?.artifacts?.dxf?.bytes;
 if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>16*1024*1024)
  throw new CadWorkerHostError("CAD_INSPECTION_INPUT_INVALID","Bounded DXF output is required");
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"cad-verify-"));
 try{
  const file=path.join(dir,"output.dxf");
  fs.writeFileSync(file,bytes,{flag:"wx",mode:0o600});
  const p=spawnSync(binPath,["info",file],{
   encoding:"utf8",timeout:30000,maxBuffer:512*1024,
   cwd:dir,env:{PATH:process.env.PATH||"",HOME:dir,CADCRAFT_CONFIG_DIR:dir}
  });
  if(p.error||p.status!==0)throw new CadWorkerHostError("CAD_INSPECTION_FAILED","CADCraft could not inspect DXF");
  let result;
  try{result=JSON.parse(p.stdout);}catch{throw new CadWorkerHostError("CAD_INSPECTION_FAILED","Invalid CADCraft inspection response");}
  const extents=result?.extents;
  if(!Number.isSafeInteger(result?.entityCount)||result.entityCount<1||
     !Array.isArray(extents)||extents.length!==2||extents.some(row=>!Array.isArray(row)||row.length!==2||row.some(v=>!Number.isFinite(v)||Math.abs(v)>1e7))||
     extents[1][0]<extents[0][0]||extents[1][1]<extents[0][1])
   throw new CadWorkerHostError("CAD_INSPECTION_FAILED","Unexpected CAD geometry or bounds");
  return Object.freeze({valid:true,entityCount:result.entityCount,extents});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
function createCadWorkerHost({
 db,ownerId,workerId,binPath,objects,authorizeDrawing,
 inspect=inspectWithCadcraft,leaseSeconds=60,heartbeatIntervalMs=10000,
 makeWorker=createWorker,makeRunner=createLeasedCadRunner
}={}){
 if(!db||typeof db.query!=="function"||typeof db.connect!=="function"||
    typeof ownerId!=="string"||!UUID.test(ownerId)||
    typeof workerId!=="string"||!WORKER.test(workerId)||
    typeof binPath!=="string"||!fs.existsSync(binPath)||
    !objects||typeof objects.put!=="function"||typeof objects.get!=="function"||
    typeof authorizeDrawing!=="function"||typeof inspect!=="function")
  throw new CadWorkerHostError("CAD_WORKER_HOST_INVALID","Missing restricted CAD worker dependencies");
 const queue=createQueue(createPostgresStorage({db,ownerId}));
 const leases=createPostgresLeaseManager({db,ownerId});
 const intents=createCadPostgresIntents({db});
 let busy=false;
 async function processClaim(claim){
  if(!claim||claim.job?.worker_id!==workerId)
   throw new CadWorkerHostError("CAD_CLAIM_OWNER_INVALID","Worker does not own claim");
  const job=claim.job,jobKey=job.idempotency_key;
  try{
   const prepared=await intents.get({ownerId,key:jobKey});
   if(!prepared||prepared.cloud_job_key!==jobKey||
      prepared.project_id!==job.project_id||prepared.drawing_id!==job.drawing_id||
      prepared.drawing_revision!==job.expected_revision||
      typeof prepared.oauth_client_id!=="string")
    throw new CadWorkerHostError("CAD_VERIFIED_INTENT_REQUIRED","Job has no OAuth-bound compiled CAD intent");
   const acl=async(args)=>authorizeDrawing({...args,clientId:prepared.oauth_client_id});
   if(await acl({ownerId,projectId:job.project_id,drawingId:job.drawing_id,mode:"write"})!==true)
    throw new CadWorkerHostError("CAD_ACCESS_REVOKED","CAD project grant revoked before execution");
   const revisionStore=createObjectRevisionStore({db,ownerId,authorizeDrawing:acl,objects});
   const execute=createCadcraftExecute({
    loadPreparedExport:async j=>intents.get({ownerId,key:j.idempotency_key}),binPath
   });
   const ports=createObjectWorkerPorts({ownerId,workerId,authorizeDrawing:acl,revisionStore,intents,execute,
    inspect:async({output})=>inspect({binPath,output})});
   const worker=makeWorker({queue,workerId,ports});
   const runner=makeRunner({
    leaseManager:leases,worker,workerId,leaseSeconds,heartbeatIntervalMs
   });
   return await runner.runClaim(claim);
  }catch(error){
   // Fenced failure never damages a job reclaimed by another worker. Do not
   // expose user prompts, CAD scripts or DB connection details in errors.
   try{await leases.failClaim({jobKey,workerId,leaseToken:claim.lease_token});}
   catch(e){if(e?.code!=="CAD_LEASE_LOST")throw e;}
   throw error;
  }
 }
 async function runOnce(){
  if(busy)throw new CadWorkerHostError("CAD_WORKER_BUSY","Concurrent polling from one worker is not allowed");
  busy=true;
  try{
   const claim=await leases.claimNext({workerId,leaseSeconds});
   if(!claim)return null;
   return await processClaim(claim);
  }finally{busy=false;}
 }
 return Object.freeze({runOnce,processClaim});
}
module.exports=Object.freeze({CadWorkerHostError,createCadWorkerHost,inspectWithCadcraft});
