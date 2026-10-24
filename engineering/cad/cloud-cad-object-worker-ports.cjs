"use strict";
// Connects the existing cloud Worker to an object-backed revision publisher.
// Real CADCraft execution and project authorization remain injected ports.
// Prepared intent is loaded server-side from owner-scoped durable storage.
const crypto=require("node:crypto");
class CadObjectPortsError extends Error{
 constructor(code,message){super(message);this.name="CadObjectPortsError";this.code=code;}
}
function createObjectWorkerPorts({
 ownerId,workerId,authorizeDrawing,revisionStore,intents,execute,inspect
}={}){
 if(typeof ownerId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId)||
    typeof workerId!=="string"||!/^[a-zA-Z0-9_-]{1,128}$/.test(workerId)||
    typeof authorizeDrawing!=="function"||!revisionStore||
    typeof revisionStore.read!=="function"||typeof revisionStore.stageAndPublish!=="function"||
    !intents||typeof intents.get!=="function"||typeof execute!=="function"||typeof inspect!=="function")
  throw new CadObjectPortsError("CAD_OBJECT_PORTS_INVALID","Missing trusted worker dependencies");
 const authorize=async job=>{
  if(!job||await authorizeDrawing({
   ownerId,projectId:job.project_id,drawingId:job.drawing_id,mode:"write"
  })!==true)throw new CadObjectPortsError("CAD_OBJECT_ACCESS_DENIED","Worker project authorization failed");
 };
 async function loadRevision(job){
  if(job.expected_revision===0)return null;
  const r=await revisionStore.read({
   projectId:job.project_id,drawingId:job.drawing_id,
   revision:job.expected_revision,format:"dxf"
  });
  return Object.freeze({drawing_id:job.drawing_id,revision:r.revision,
   dxf:r.bytes,sha256:r.sha256});
 }
 async function storeImmutable({output}){
  if(!output?.artifacts?.dxf||!Buffer.isBuffer(output.artifacts.dxf.bytes))
   throw new CadObjectPortsError("CAD_OBJECT_OUTPUT_INVALID","CADCraft must return DXF artifacts");
  const dxf=output.artifacts.dxf.bytes;
  const sha256=crypto.createHash("sha256").update(dxf).digest("hex");
  if(output.artifacts.dxf.sha256!==undefined&&output.artifacts.dxf.sha256!==sha256)
   throw new CadObjectPortsError("CAD_OBJECT_DIGEST_INVALID","CADCraft artifact hash differs from bytes");
  return Object.freeze({sha256,artifacts:output.artifacts});
 }
 async function publishRevision({job,artifact,inspection,leaseToken}){
  const preparedJob=await intents.get({ownerId,key:job.idempotency_key});
  if(!preparedJob)throw new CadObjectPortsError("CAD_OBJECT_INTENT_MISSING","Prepared drawing not found");
  return revisionStore.stageAndPublish({
   job,preparedJob,artifact,inspection,workerId,leaseToken:leaseToken??null
  });
 }
 return Object.freeze({authorize,loadRevision,execute,inspect,storeImmutable,publishRevision});
}
module.exports=Object.freeze({CadObjectPortsError,createObjectWorkerPorts});
