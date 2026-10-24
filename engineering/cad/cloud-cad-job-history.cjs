"use strict";
// Authorized recovery of CAD jobs after a chat session ends. No CAD script,
// user prompt, S3 location, OAuth token, or database credentials are returned.
class CadJobHistoryError extends Error {
 constructor(code,message){super(message);this.name="CadJobHistoryError";this.code=code;}
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID=/^[A-Za-z0-9_-]{1,128}$/;
const JOB_KEY=/^[a-f0-9]{64}$/;
const STATES=new Set(["queued","claimed","running","completed","failed","cancelled"]);
function createCadJobHistory({db,authorizeDrawing}={}){
 if(!db||typeof db.query!=="function"||typeof authorizeDrawing!=="function")
  throw new CadJobHistoryError("CAD_HISTORY_CONFIG_INVALID","DB and authorization are required");
 async function list(ownerId,{projectId,limit=25}={},context={}){
  const clientId=context?.clientId;
  if(!UUID.test(ownerId||"")||!ID.test(projectId||"")||
     typeof clientId!=="string"||!/^[A-Za-z0-9_.:-]{1,256}$/.test(clientId))
   throw new CadJobHistoryError("CAD_HISTORY_ID_INVALID","Verified user, project and OAuth client required");
  if(!Number.isSafeInteger(limit)||limit<1||limit>25)
   throw new CadJobHistoryError("CAD_HISTORY_LIMIT_INVALID","Limit must be 1-25");
  // Only the verified owner's matching project is queried. A further
  // drawing-level read grant is required for EVERY item returned.
  const result=await db.query(
   "SELECT job_data,created_at FROM public.lizhi_cad_cloud_jobs WHERE owner_id=$1::uuid AND job_data->>'project_id'=$2 ORDER BY created_at DESC,idempotency_key DESC LIMIT $3",
   [ownerId,projectId,limit]
  );
  const permissions=new Map(),jobs=[];
  for(const row of result.rows||[]){
   const job=row.job_data;
   if(!job||!ID.test(job.drawing_id||"")||!JOB_KEY.test(job.idempotency_key||"")||
      job.project_id!==projectId||!STATES.has(job.status))continue;
   if(!permissions.has(job.drawing_id)){
    const granted=await authorizeDrawing({ownerId,projectId,drawingId:job.drawing_id,action:"read",clientId});
    permissions.set(job.drawing_id,granted===true);
   }
   if(!permissions.get(job.drawing_id))continue;
   jobs.push(Object.freeze({
    job_key:job.idempotency_key,drawing_id:job.drawing_id,
    operation:job.operation,status:job.status,
    expected_revision:job.expected_revision,output_revision:job.output_revision??null,
    created_at:row.created_at
   }));
  }
  return Object.freeze({project_id:projectId,jobs:Object.freeze(jobs)});
 }
 return Object.freeze({list});
}
module.exports=Object.freeze({createCadJobHistory,CadJobHistoryError});
