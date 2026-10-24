"use strict";
// Cloud-first durable job state contract. No database, network, or CAD runtime dependency.
const crypto=require("node:crypto");
const STATUS=Object.freeze(["queued","claimed","running","completed","failed","cancelled"]);
const allowed=Object.freeze({queued:["claimed","cancelled"],claimed:["running","queued","failed","cancelled"],running:["completed","failed","cancelled"],completed:[],failed:["queued"],cancelled:[]});
class CadJobError extends Error{constructor(code,message){super(message);this.name="CadJobError";this.code=code;}}
function assertId(id){if(typeof id!=="string"||!/^[a-zA-Z0-9_-]{1,128}$/.test(id))throw new CadJobError("CAD_ID_INVALID","Invalid ID");}
function prepare({projectId,drawingId,baseRevision,operation,requestId}){
 for(const id of [projectId,drawingId,requestId])assertId(id);
 if(!Number.isSafeInteger(baseRevision)||baseRevision<0)throw new CadJobError("CAD_REVISION_INVALID","Invalid source revision");
 if(!["create","modify","inspect","render","export"].includes(operation))throw new CadJobError("CAD_OPERATION_DENIED","Unsupported operation");
 const idempotencyKey=crypto.createHash("sha256").update(JSON.stringify([projectId,drawingId,baseRevision,operation,requestId])).digest("hex");
 return Object.freeze({schema_version:"cloud-cad-job@1",idempotency_key:idempotencyKey,project_id:projectId,drawing_id:drawingId,expected_revision:baseRevision,operation,status:"queued",attempt:0,worker_id:null,output_revision:null});
}
function transition(job,to,{workerId=null,expectedStatus,outputRevision=null}={}){
 if(!job||!STATUS.includes(job.status)||!STATUS.includes(to))throw new CadJobError("CAD_STATUS_INVALID","Bad job state");
 if(expectedStatus!==job.status)throw new CadJobError("CAD_JOB_CONFLICT","Stale job status");
 if(!allowed[job.status].includes(to))throw new CadJobError("CAD_TRANSITION_DENIED","Illegal state transition");
 if(["claimed","running","completed"].includes(to)){
  assertId(workerId);
  if(job.status!=="queued"&&job.worker_id!==workerId)throw new CadJobError("CAD_WORKER_MISMATCH","Worker does not own job");
 }
 if(to==="completed"&&(!Number.isSafeInteger(outputRevision)||outputRevision<=job.expected_revision))throw new CadJobError("CAD_OUTPUT_REVISION_INVALID","Must write a new revision");
 return Object.freeze({...job,status:to,worker_id:to==="queued"?null:(workerId||job.worker_id),attempt:to==="claimed"?job.attempt+1:job.attempt,output_revision:to==="completed"?outputRevision:null});
}
module.exports=Object.freeze({CadJobError,prepare,transition,STATUS});
