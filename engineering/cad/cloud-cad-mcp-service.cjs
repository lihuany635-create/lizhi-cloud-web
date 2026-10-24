"use strict";
// Pure authenticated CAD MCP domain service. HTTP/OAuth adapters remain external.
// All geometry is compiled to an allowlisted CADCraft job before persistence.
const {prepare}=require("./cloud-cad-job.cjs");
const {prepareJob}=require("./cadcraft-export-job.cjs");
class CadMcpError extends Error{constructor(code,message){super(message);this.name="CadMcpError";this.code=code;}}
function createCadMcpService({authorizeDrawing,queueForOwner,intents}={}){
 if(typeof authorizeDrawing!=="function"||typeof queueForOwner!=="function"||!intents||typeof intents.putIfAbsent!=="function"||typeof intents.get!=="function")
  throw new CadMcpError("CAD_MCP_PORT_INVALID","Missing authorization, queue or immutable intent store");
 const authorized=async(ownerId,projectId,drawingId,action)=>{
  if(typeof ownerId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId))throw new CadMcpError("CAD_UNAUTHENTICATED","Authenticated subject required");
  if(await authorizeDrawing({ownerId,projectId,drawingId,action})!==true)throw new CadMcpError("CAD_ACCESS_DENIED","CAD drawing access denied");
 };
 return Object.freeze({
  async submit(ownerId,{projectId,drawingId,baseRevision,requestId,operation,spec}={}){
   if(!["create","modify"].includes(operation))throw new CadMcpError("CAD_OPERATION_DENIED","Only drawing create/modify supported");
   // Validate identity before authorization. Source design revision and drawing revision
   // are intentionally independent numbers.
   const cloudJob=prepare({projectId,drawingId,baseRevision,requestId,operation});
   if(operation==="create"&&baseRevision!==0)throw new CadMcpError("CAD_CREATE_REVISION","New drawing requires base revision 0");
   if(operation==="modify"&&baseRevision<1)throw new CadMcpError("CAD_MODIFY_REVISION","Modified drawings require an existing revision");
   await authorized(ownerId,projectId,drawingId,operation);
   const compiled=prepareJob(spec,{projectId,drawingId,cloudJobKey:cloudJob.idempotency_key,drawingRevision:baseRevision});
   // The intent store MUST perform one atomic compare-if-absent operation.
   // A reused request_id with different geometry MUST cause a conflict,
   // never silently return the prior drawing job.
   const intent=await intents.putIfAbsent({ownerId,key:cloudJob.idempotency_key,value:compiled});
   if(!intent||intent.job_key!==compiled.job_key)throw new CadMcpError("CAD_INTENT_CONFLICT","Request ID was previously used with different CAD geometry");
   const queue=queueForOwner(ownerId);
   if(!queue||typeof queue.enqueue!=="function")throw new CadMcpError("CAD_QUEUE_INVALID","Queue unavailable");
   const result=await queue.enqueue({projectId,drawingId,baseRevision,requestId,operation});
   if(result?.idempotency_key!==cloudJob.idempotency_key)throw new CadMcpError("CAD_QUEUE_INVALID","Job identity mismatch");
   return Object.freeze({job_key:result.idempotency_key,status:result.status,project_id:projectId,drawing_id:drawingId,expected_revision:baseRevision});
  },
  async status(ownerId,{projectId,drawingId,jobKey}={}){
   // Don't let a guessed job key disclose an unauthenticated owner's job.
   prepare({projectId,drawingId,baseRevision:0,requestId:"validate",operation:"inspect"});
   if(typeof jobKey!=="string"||!/^[0-9a-f]{64}$/.test(jobKey))throw new CadMcpError("CAD_JOB_KEY_INVALID","Invalid job key");
   await authorized(ownerId,projectId,drawingId,"read");
   const q=queueForOwner(ownerId);
   const job=await q.read(jobKey);
   if(!job||job.project_id!==projectId||job.drawing_id!==drawingId)throw new CadMcpError("CAD_JOB_NOT_FOUND","CAD job not found");
   return Object.freeze({job_key:job.idempotency_key,status:job.status,project_id:projectId,drawing_id:drawingId,expected_revision:job.expected_revision,output_revision:job.output_revision});
  }
 });
}
module.exports=Object.freeze({CadMcpError,createCadMcpService});
