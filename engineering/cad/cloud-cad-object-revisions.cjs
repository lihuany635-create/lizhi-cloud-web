"use strict";
// STAGING: S3-first immutable artifact upload followed by an atomic PostgreSQL
// metadata/head/job commit. Audit attempt is written BEFORE S3 network IO.
// Orphan enumeration is read-only: never auto-delete user files.
const crypto=require("node:crypto");
class CadObjectRevisionError extends Error{
 constructor(code,message){super(message);this.name="CadObjectRevisionError";this.code=code;}
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID=/^[A-Za-z0-9_-]{1,128}$/;
const HASH=/^[a-f0-9]{64}$/;
const sha=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
function createObjectRevisionStore({db,ownerId,authorizeDrawing,objects}={}){
 if(!db||typeof db.query!=="function"||typeof db.connect!=="function"||
    typeof authorizeDrawing!=="function"||!UUID.test(ownerId||"")||
    !objects||typeof objects.put!=="function"||typeof objects.get!=="function")
  throw new CadObjectRevisionError("CAD_OBJECT_PORT_INVALID","Verified owner, database, ACL and object store required");
 async function authorized(projectId,drawingId,mode,transactionClient=null){
  if(typeof projectId!=="string"||!ID.test(projectId)||typeof drawingId!=="string"||!ID.test(drawingId))
   throw new CadObjectRevisionError("CAD_OBJECT_ID_INVALID","Invalid drawing location");
  if(await authorizeDrawing({ownerId,projectId,drawingId,mode,transactionClient})!==true)
   throw new CadObjectRevisionError("CAD_OBJECT_ACCESS_DENIED","Drawing access denied");
 }
 const validateJob=(job,workerId,leaseToken)=>{
  if(!job||!HASH.test(job.idempotency_key||"")||!Number.isSafeInteger(job.expected_revision)||
      job.expected_revision<0||!ID.test(workerId||"")||
      (leaseToken!==null&&(!UUID.test(leaseToken||""))))
   throw new CadObjectRevisionError("CAD_OBJECT_JOB_INVALID","Job, revision or worker identity invalid");
 };
 function owned(state,job,workerId,leaseToken,leaseActive){
  if(!state||state.project_id!==job.project_id||state.drawing_id!==job.drawing_id||
      state.expected_revision!==job.expected_revision)
   throw new CadObjectRevisionError("CAD_OBJECT_JOB_MISMATCH","Queue identity differs from drawing");
  if(state.status!=="running"||state.worker_id!==workerId)
   throw new CadObjectRevisionError("CAD_OBJECT_JOB_NOT_OWNED","Active job not owned by worker");
  if(state.lease_token!==undefined&&
      (state.lease_token!==leaseToken||leaseActive!==true))
   throw new CadObjectRevisionError("CAD_OBJECT_LEASE_LOST","Expired or replaced lease");
 }
 async function stageAndPublish({job,preparedJob,artifact,inspection,workerId,leaseToken=null}={}){
  validateJob(job,workerId,leaseToken);
  const projectId=job.project_id,drawingId=job.drawing_id,jobKey=job.idempotency_key;
  await authorized(projectId,drawingId,"write");
  if(!preparedJob||preparedJob.cloud_job_key!==jobKey||preparedJob.project_id!==projectId||
      preparedJob.drawing_id!==drawingId||preparedJob.drawing_revision!==job.expected_revision||
      !HASH.test(preparedJob.job_key||""))
   throw new CadObjectRevisionError("CAD_OBJECT_INTENT_MISMATCH","Compiled intent does not match job");
  const expectedRevision=job.expected_revision,revision=expectedRevision+1;
  if(!inspection||inspection.valid!==true)
   throw new CadObjectRevisionError("CAD_OBJECT_INSPECTION_INVALID","Verified geometry inspection required");
  const data=artifact?.artifacts;
  const dxf=data?.dxf?.bytes;
  if(!Buffer.isBuffer(dxf)||dxf.length<1||dxf.length>16*1024*1024||
      typeof artifact.sha256!=="string"||sha(dxf)!==artifact.sha256)
   throw new CadObjectRevisionError("CAD_OBJECT_BYTES_INVALID","Verified original DXF required");
  const formats=["dxf","svg","png"].filter(f=>data?.[f]!==undefined);
  for(const format of formats){
   if(!Buffer.isBuffer(data[format]?.bytes))
    throw new CadObjectRevisionError("CAD_OBJECT_BYTES_INVALID","All attached artifacts require bytes");
  }
  // Persist a discoverable attempt before any remote PUT.
  const first=await db.query(
   "SELECT job_data,lease_until>now() AS lease_active FROM public.lizhi_cad_cloud_jobs WHERE owner_id=$1::uuid AND idempotency_key=$2",
   [ownerId,jobKey]
  );
  if(first.rowCount!==1)throw new CadObjectRevisionError("CAD_OBJECT_JOB_NOT_FOUND","Queue job missing");
  owned(first.rows[0].job_data,job,workerId,leaseToken,first.rows[0].lease_active);
  await db.query(
   "INSERT INTO public.lizhi_cad_cloud_upload_attempts(owner_id,job_key,project_id,drawing_id,target_revision) VALUES ($1::uuid,$2,$3,$4,$5) ON CONFLICT (owner_id,job_key) DO NOTHING",
   [ownerId,jobKey,projectId,drawingId,revision]
  );
  const prev=await db.query(
   "SELECT project_id,drawing_id,target_revision,published_at FROM public.lizhi_cad_cloud_upload_attempts WHERE owner_id=$1::uuid AND job_key=$2",
   [ownerId,jobKey]
  );
  if(prev.rowCount!==1||prev.rows[0].project_id!==projectId||prev.rows[0].drawing_id!==drawingId||
      Number(prev.rows[0].target_revision)!==revision||prev.rows[0].published_at)
   throw new CadObjectRevisionError("CAD_OBJECT_ATTEMPT_CONFLICT","Job already reserved for another revision or published");
  const metadata={};
  for(const format of formats){
   const saved=await objects.put({
    ownerId,projectId,drawingId,revision,format,bytes:data[format].bytes,
    job:preparedJob,jobKey
   });
   if(!saved||saved.sha256!==sha(data[format].bytes)||!HASH.test(saved.sha256)||
       !Number.isSafeInteger(saved.byte_size)||saved.byte_size!==data[format].bytes.length||
       typeof saved.object_key!=="string"||!saved.object_key.endsWith("/"+jobKey+"/"+format))
    throw new CadObjectRevisionError("CAD_OBJECT_UPLOAD_UNVERIFIED","Unverified object upload");
   metadata[format]={bucket:saved.bucket,object_key:saved.object_key,
     sha256:saved.sha256,byte_size:saved.byte_size};
  }
  const client=await db.connect();let inTransaction=false;
  try{
   await client.query("BEGIN");inTransaction=true;
   const found=await client.query(
    "SELECT job_data,lease_until>now() AS lease_active FROM public.lizhi_cad_cloud_jobs WHERE owner_id=$1::uuid AND idempotency_key=$2 FOR UPDATE",
    [ownerId,jobKey]
   );
   if(found.rowCount!==1)throw new CadObjectRevisionError("CAD_OBJECT_JOB_NOT_FOUND","Queue job disappeared");
   owned(found.rows[0].job_data,job,workerId,leaseToken,found.rows[0].lease_active);
   // A grant may be revoked during S3 upload. Lock and re-check the original
   // OAuth client authorization INSIDE this same publish transaction.
   await authorized(projectId,drawingId,"write",client);
   await client.query(
    "INSERT INTO public.lizhi_cad_cloud_drawings(owner_id,project_id,drawing_id,current_revision) VALUES ($1::uuid,$2,$3,0) ON CONFLICT(owner_id,drawing_id) DO NOTHING",
    [ownerId,projectId,drawingId]
   );
   const head=await client.query(
    "SELECT project_id,current_revision FROM public.lizhi_cad_cloud_drawings WHERE owner_id=$1::uuid AND drawing_id=$2 FOR UPDATE",
    [ownerId,drawingId]
   );
   if(head.rows[0]?.project_id!==projectId)
    throw new CadObjectRevisionError("CAD_OBJECT_PROJECT_CONFLICT","Drawing belongs to another project");
   if(Number(head.rows[0].current_revision)!==expectedRevision)
    throw new CadObjectRevisionError("CAD_OBJECT_REVISION_CONFLICT","Drawing advanced before publication");
   await client.query(
    "INSERT INTO public.lizhi_cad_cloud_object_revisions(owner_id,drawing_id,revision,job_key,artifacts,inspection) VALUES ($1::uuid,$2,$3,$4,$5::jsonb,$6::jsonb)",
    [ownerId,drawingId,revision,jobKey,JSON.stringify(metadata),JSON.stringify(inspection)]
   );
   await client.query(
    "UPDATE public.lizhi_cad_cloud_drawings SET current_revision=$3,updated_at=now() WHERE owner_id=$1::uuid AND drawing_id=$2",
    [ownerId,drawingId,revision]
   );
   const completed={...found.rows[0].job_data,status:"completed",output_revision:revision};
   await client.query(
    "UPDATE public.lizhi_cad_cloud_jobs SET job_data=$3::jsonb,updated_at=now() WHERE owner_id=$1::uuid AND idempotency_key=$2",
    [ownerId,jobKey,JSON.stringify(completed)]
   );
   await client.query(
    "UPDATE public.lizhi_cad_cloud_upload_attempts SET published_at=now() WHERE owner_id=$1::uuid AND job_key=$2",
    [ownerId,jobKey]
   );
   await client.query("COMMIT");inTransaction=false;
   return Object.freeze({revision,job_committed:true,artifacts:metadata});
  }catch(e){if(inTransaction)await client.query("ROLLBACK");throw e;}
  finally{client.release();}
 }
 async function read({projectId,drawingId,revision,format="dxf"}={}){
  await authorized(projectId,drawingId,"read");
  if(!Number.isSafeInteger(revision)||revision<1||!["dxf","svg","png"].includes(format))
   throw new CadObjectRevisionError("CAD_OBJECT_READ_INVALID","Invalid artifact version or format");
  const res=await db.query(
   "SELECT r.job_key,r.artifacts,d.project_id FROM public.lizhi_cad_cloud_object_revisions r JOIN public.lizhi_cad_cloud_drawings d ON d.owner_id=r.owner_id AND d.drawing_id=r.drawing_id WHERE r.owner_id=$1::uuid AND r.drawing_id=$2 AND r.revision=$3",
   [ownerId,drawingId,revision]
  );
  if(!res.rowCount||res.rows[0].project_id!==projectId)
   throw new CadObjectRevisionError("CAD_OBJECT_NOT_FOUND","Requested revision unavailable");
  const {job_key:jobKey,artifacts}=res.rows[0],entry=artifacts?.[format];
  if(!entry||!HASH.test(entry.sha256||""))
   throw new CadObjectRevisionError("CAD_OBJECT_NOT_FOUND","Requested file format unavailable");
  const fetched=await objects.get({
   ownerId,projectId,drawingId,revision,format,jobKey,expectedSha256:entry.sha256
  });
  if(fetched.object_key!==entry.object_key||sha(fetched.bytes)!==entry.sha256)
   throw new CadObjectRevisionError("CAD_OBJECT_INTEGRITY_FAILED","Stored metadata/object mismatch");
  return Object.freeze({revision,drawing_id:drawingId,format,
    sha256:entry.sha256,bytes:fetched.bytes});
 }
 async function listOrphanCandidates({olderThanMinutes=60,limit=50}={}){
  if(!Number.isSafeInteger(olderThanMinutes)||olderThanMinutes<1||olderThanMinutes>525600||
      !Number.isSafeInteger(limit)||limit<1||limit>100)
   throw new CadObjectRevisionError("CAD_OBJECT_SCAN_INVALID","Invalid orphan scan bounds");
  // This is only a list of uncommitted attempts. Do not delete objects: a
  // worker may still be writing or a retry may reuse the same immutable key.
  const r=await db.query(
   "SELECT a.job_key,a.project_id,a.drawing_id,a.target_revision,a.created_at FROM public.lizhi_cad_cloud_upload_attempts a LEFT JOIN public.lizhi_cad_cloud_jobs j ON j.owner_id=a.owner_id AND j.idempotency_key=a.job_key WHERE a.owner_id=$1::uuid AND a.published_at IS NULL AND a.created_at<now()-($2::int*interval '1 minute') AND (j.idempotency_key IS NULL OR j.job_data->>'status' NOT IN ('claimed','running') OR j.lease_until<now()) AND NOT EXISTS (SELECT 1 FROM public.lizhi_cad_cloud_object_revisions r WHERE r.owner_id=a.owner_id AND r.job_key=a.job_key) ORDER BY a.created_at LIMIT $3",
   [ownerId,olderThanMinutes,limit]
  );
  return Object.freeze(r.rows.map(x=>Object.freeze({
    job_key:x.job_key,project_id:x.project_id,drawing_id:x.drawing_id,
    target_revision:x.target_revision,created_at:x.created_at,action:"REVIEW_ONLY_NO_DELETE"
  })));
 }
 return Object.freeze({stageAndPublish,read,listOrphanCandidates});
}
module.exports=Object.freeze({CadObjectRevisionError,createObjectRevisionStore});
