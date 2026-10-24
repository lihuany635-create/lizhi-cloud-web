"use strict";
// Cloud CAD orchestration; injected ports must be implemented by authorized cloud services.
// Does not expose CADCraft's raw shell/MCP commands to callers.
const {CadQueueError}=require("./cloud-cad-queue.cjs");
class CadWorkerError extends Error{constructor(code,message){super(message);this.name="CadWorkerError";this.code=code;}}
const methods=["authorize","loadRevision","execute","inspect","storeImmutable","publishRevision"];
function createWorker({queue,ports,workerId}){
 if(!queue||typeof queue.change!=="function"||typeof queue.read!=="function"||!ports||methods.some(k=>typeof ports[k]!=="function"))throw new CadWorkerError("CAD_WORKER_PORT_INVALID","Missing worker port");
 if(typeof workerId!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(workerId))throw new CadWorkerError("CAD_WORKER_ID_INVALID","Invalid worker");
 async function process(jobKey,{preclaimed=false,leaseToken=null}={}){
  const original=await queue.read(jobKey);
  if(preclaimed){
   if(!original||original.status!=="claimed"||original.worker_id!==workerId||original.lease_token!==leaseToken)
    throw new CadWorkerError("CAD_LEASE_LOST","Claimed job is not owned by this worker");
  }else if(!original||original.status!=="queued")throw new CadWorkerError("CAD_JOB_NOT_QUEUED","Job is not queued");
  // Validate access before claim, and again in publishRevision's transaction.
  await ports.authorize(original);
  let claimed=false;
  try{
   if(!preclaimed)await queue.change(jobKey,"claimed",{workerId});claimed=true;
   const source=await ports.loadRevision(original);
   if(original.operation!=="create"&&!source)throw new CadWorkerError("CAD_SOURCE_MISSING","Source revision missing");
   await queue.change(jobKey,"running",{workerId});
   const output=await ports.execute({job:original,source});
   const inspection=await ports.inspect({job:original,output});
   if(!inspection||inspection.valid!==true)throw new CadWorkerError("CAD_INSPECTION_FAILED","Geometry verification failed");
   const artifact=await ports.storeImmutable({job:original,output,inspection});
   if(!artifact||typeof artifact.sha256!=="string"||!/^[a-f0-9]{64}$/.test(artifact.sha256))throw new CadWorkerError("CAD_ARTIFACT_INVALID","Missing content hash");
   // Must atomically compare the current drawing revision to original.expected_revision,
   // commit a new immutable revision and retain authorization within that same transaction.
   const published=await ports.publishRevision({job:original,artifact,inspection,leaseToken});
   if(!published||!Number.isSafeInteger(published.revision)||published.revision<=original.expected_revision)throw new CadWorkerError("CAD_PUBLISH_INVALID","Invalid published revision");
   // The durable PostgreSQL publisher may atomically advance the drawing and
   // mark the job completed within the same transaction. Never issue a second
   // status transition in that case (and never mark a committed drawing failed).
   if(published.job_committed!==true)await queue.change(jobKey,"completed",{workerId,outputRevision:published.revision});
   return Object.freeze({job_key:jobKey,status:"completed",revision:published.revision,sha256:artifact.sha256});
  }catch(error){
   if(claimed){
    const current=await queue.read(jobKey);
    if(["claimed","running"].includes(current?.status)){
     try{await queue.change(jobKey,"failed",{workerId});}catch(_){/* retain original failure; recovery scanner must reconcile */ }
    }
   }
   throw error;
  }
 }
 return Object.freeze({
  run:jobKey=>process(jobKey),
  runClaimed:(jobKey,leaseToken)=>process(jobKey,{preclaimed:true,leaseToken})
 });
}
module.exports=Object.freeze({CadWorkerError,createWorker});
