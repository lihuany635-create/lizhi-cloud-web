"use strict";
// STAGING durable CAD revision store. Small DXF bytea snapshots only; NOT a
// substitute for production object storage, quotas, signing or tenant ACL.
// publish() atomically advances a drawing and completes its queued job.
const crypto=require("node:crypto");
const HASH=/^[a-f0-9]{64}$/;
const SAFE_ID=/^[a-zA-Z0-9_-]{1,128}$/;
const MAX_DXF=16*1024*1024;
class CadRevisionError extends Error{
 constructor(code,message){super(message);this.name="CadRevisionError";this.code=code;}
}
function checkId(s){if(typeof s!=="string"||!SAFE_ID.test(s))throw new CadRevisionError("CAD_REVISION_ID_INVALID","Invalid identifier");}
function checkHash(s){if(typeof s!=="string"||!HASH.test(s))throw new CadRevisionError("CAD_REVISION_KEY_INVALID","Invalid hash");}
const sha=buffer=>crypto.createHash("sha256").update(buffer).digest("hex");
function createPostgresRevisionStore({db,ownerId,authorizeDrawing}={}){
 if(!db||typeof db.connect!=="function"||typeof authorizeDrawing!=="function"||typeof ownerId!=="string"||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId))
  throw new CadRevisionError("CAD_REVISION_PORT_INVALID","Authenticated owner, DB transaction and drawing authorization required");
 async function permitted(projectId,drawingId,mode){
  checkId(projectId);checkId(drawingId);
  if(await authorizeDrawing({ownerId,projectId,drawingId,mode})!==true)
   throw new CadRevisionError("CAD_REVISION_ACCESS_DENIED","Drawing access denied");
 }
 async function read({projectId,drawingId,revision}={}){
  await permitted(projectId,drawingId,"read");
  if(!Number.isSafeInteger(revision)||revision<0)throw new CadRevisionError("CAD_REVISION_INVALID","Invalid revision");
  const head=await db.query("SELECT project_id,current_revision FROM public.lizhi_cad_cloud_drawings WHERE owner_id=$1::uuid AND drawing_id=$2",[ownerId,drawingId]);
  if(!head.rowCount){if(revision===0)return null;throw new CadRevisionError("CAD_REVISION_NOT_FOUND","Drawing does not exist");}
  if(head.rows[0].project_id!==projectId)throw new CadRevisionError("CAD_REVISION_NOT_FOUND","Drawing not in project");
  if(revision===0)return null;
  const res=await db.query("SELECT revision,sha256,dxf_bytes FROM public.lizhi_cad_cloud_revisions WHERE owner_id=$1::uuid AND drawing_id=$2 AND revision=$3",[ownerId,drawingId,revision]);
  if(!res.rowCount)throw new CadRevisionError("CAD_REVISION_NOT_FOUND","Revision unavailable");
  const row=res.rows[0],bytes=row.dxf_bytes;
  if(!Buffer.isBuffer(bytes)||sha(bytes)!==row.sha256)throw new CadRevisionError("CAD_REVISION_CORRUPT","Stored geometry checksum mismatch");
  return Object.freeze({drawing_id:drawingId,revision:Number(row.revision),dxf:bytes,sha256:row.sha256});
 }
 async function publish({job,artifact,inspection,workerId,leaseToken=null}={}){
  if(!job||typeof job!=="object")throw new CadRevisionError("CAD_JOB_INVALID","Missing job");
  const {project_id:projectId,drawing_id:drawingId,idempotency_key:jobKey,expected_revision:expectedRevision}=job;
  await permitted(projectId,drawingId,"write");
  checkHash(jobKey);checkId(workerId);
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw new CadRevisionError("CAD_REVISION_INVALID","Invalid expected revision");
  const bytes=artifact?.artifacts?.dxf?.bytes;
  if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>MAX_DXF||!artifact?.sha256||sha(bytes)!==artifact.sha256)
   throw new CadRevisionError("CAD_REVISION_BYTES_INVALID","DXF bytes/hash required");
  if(!inspection||inspection.valid!==true)throw new CadRevisionError("CAD_REVISION_INSPECTION_INVALID","Verified geometry inspection required");
  const client=await db.connect();let started=false;
  try{
   await client.query("BEGIN");started=true;
   // Lock owner-specific job first, then the drawing to avoid deadlocks.
   const found=await client.query("SELECT job_data,lease_until,lease_until>now() AS lease_active FROM public.lizhi_cad_cloud_jobs WHERE owner_id=$1::uuid AND idempotency_key=$2 FOR UPDATE",[ownerId,jobKey]);
   if(found.rowCount!==1)throw new CadRevisionError("CAD_JOB_NOT_FOUND","CAD job unavailable");
   const state=found.rows[0].job_data;
   if(state.project_id!==projectId||state.drawing_id!==drawingId||state.expected_revision!==expectedRevision)
    throw new CadRevisionError("CAD_JOB_MISMATCH","CAD job does not own drawing");
   if(state.status==="completed"){
    if(!Number.isSafeInteger(state.output_revision)||state.output_revision<=expectedRevision)
     throw new CadRevisionError("CAD_JOB_CONFLICT","Invalid completed job");
    const past=await client.query("SELECT sha256 FROM public.lizhi_cad_cloud_revisions WHERE owner_id=$1::uuid AND drawing_id=$2 AND revision=$3 AND job_key=$4",[ownerId,drawingId,state.output_revision,jobKey]);
    if(past.rowCount!==1||past.rows[0].sha256!==artifact.sha256)
     throw new CadRevisionError("CAD_JOB_CONFLICT","Completed job content changed");
    await client.query("COMMIT");started=false;
    return Object.freeze({revision:state.output_revision,job_committed:true,reused:true});
   }
   if(state.status!=="running"||state.worker_id!==workerId)
    throw new CadRevisionError("CAD_JOB_NOT_OWNED","Only active worker may publish");
   if(state.lease_token!==undefined){
    const until=found.rows[0].lease_until;
    if(typeof leaseToken!=="string"||leaseToken!==state.lease_token||!until||found.rows[0].lease_active!==true)
     throw new CadRevisionError("CAD_LEASE_LOST","Old worker cannot publish a stolen or expired lease");
   }
   await client.query("INSERT INTO public.lizhi_cad_cloud_drawings(owner_id,project_id,drawing_id,current_revision) VALUES ($1::uuid,$2,$3,0) ON CONFLICT (owner_id,drawing_id) DO NOTHING",[ownerId,projectId,drawingId]);
   const h=await client.query("SELECT project_id,current_revision FROM public.lizhi_cad_cloud_drawings WHERE owner_id=$1::uuid AND drawing_id=$2 FOR UPDATE",[ownerId,drawingId]);
   if(h.rowCount!==1||h.rows[0].project_id!==projectId)throw new CadRevisionError("CAD_DRAWING_CONFLICT","Drawing belongs to another project");
   if(Number(h.rows[0].current_revision)!==expectedRevision)
    throw new CadRevisionError("CAD_REVISION_CONFLICT","Another revision was committed first");
   const revision=expectedRevision+1;
   await client.query("INSERT INTO public.lizhi_cad_cloud_revisions (owner_id,drawing_id,revision,job_key,sha256,dxf_bytes,byte_size,inspection) VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8::jsonb)",
    [ownerId,drawingId,revision,jobKey,artifact.sha256,bytes,bytes.length,JSON.stringify({valid:true,entityCount:inspection.entityCount??null,extents:inspection.extents??null})]);
   await client.query("UPDATE public.lizhi_cad_cloud_drawings SET current_revision=$3,updated_at=now() WHERE owner_id=$1::uuid AND drawing_id=$2",[ownerId,drawingId,revision]);
   const finished={...state,status:"completed",output_revision:revision};
   await client.query("UPDATE public.lizhi_cad_cloud_jobs SET job_data=$3::jsonb,updated_at=now() WHERE owner_id=$1::uuid AND idempotency_key=$2",[ownerId,jobKey,JSON.stringify(finished)]);
   await client.query("COMMIT");started=false;
   return Object.freeze({revision,job_committed:true,reused:false});
  }catch(error){if(started)await client.query("ROLLBACK");throw error;}
  finally{client.release();}
 }
 return Object.freeze({read,publish});
}
module.exports=Object.freeze({CadRevisionError,createPostgresRevisionStore});
