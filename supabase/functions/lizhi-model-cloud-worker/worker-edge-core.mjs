/**
 * 立之 3D cloud Hew worker endpoint (server to server only).
 *
 * The GitHub Actions worker holds ONLY a dedicated worker bearer token; the
 * service-role key stays here. Ops:
 *   claim                      -> next job + short-lived download URL of the current .hew
 *   upload_url {job_id, kind, ext} -> signed upload URL for the next revision or a result file
 *   finish {job_id, success, mutated, new_path, result, error}
 * Paths are always derived here, never taken from the worker.
 */
const HEX=/^[0-9a-f]{64,128}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXT=/^[a-z0-9]+(\.[a-z0-9]+)?$/;
const BUCKET="lizhi-model-files";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const json=(body,status=200)=>Response.json(body,{status,headers});
const obj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);

async function equalToken(a,b){
 if(!HEX.test(a??"")||!HEX.test(b??""))return false;
 const enc=new TextEncoder();
 const x=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(a)));
 const y=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(b)));
 let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0;
}

/** Path of revision `rev` of a document: <owner>/docs/<doc>/r<rev>.hew */
export const revisionPath=(owner,doc,rev)=>`${owner}/docs/${doc}/r${rev}.hew`;

export async function handleWorkerRequest(req,{token,ownerUid,db,uuid=()=>crypto.randomUUID()}){
 if(req.method!=="POST")return json({error:"POST_ONLY"},405);
 if(req.headers.has("origin"))return json({error:"BROWSER_ORIGIN_REJECTED"},403);
 if(!HEX.test(token??"")||!UUID.test(ownerUid??"")||typeof db?.rpc!=="function"||!db?.storage)
  return json({error:"WORKER_ENDPOINT_NOT_CONFIGURED"},503);
 const auth=req.headers.get("authorization")??"";
 if(!auth.startsWith("Bearer ")||!await equalToken(auth.slice(7),token))
  return json({error:"WORKER_TOKEN_REQUIRED"},401);
 let body;
 try{
  const raw=await req.text();
  if(raw.length>300000)return json({error:"WORKER_BODY_TOO_LARGE"},413);
  body=JSON.parse(raw);
 }catch{return json({error:"WORKER_BAD_JSON"},400)}
 if(!obj(body)||typeof body.op!=="string")return json({error:"WORKER_BAD_OP"},400);
 const storage=db.storage.from(BUCKET);
 const rpc=async(name,args)=>{
  const {data,error}=await db.rpc(name,args);
  if(error)throw Error("WORKER_RPC_FAILED");
  return data;
 };
 // Re-reads the claimed job so every op is bound to a job this owner queued.
 const claimedJob=async jobId=>{
  if(!UUID.test(jobId??""))return null;
  const j=await rpc("lizhi_model_cloud_hew_job",{p_owner:ownerUid,p_job:jobId});
  return obj(j)&&j.state==="claimed"?j:null;
 };
 try{
  if(body.op==="claim"){
   const runId=typeof body.run_id==="string"?body.run_id.slice(0,120):"worker";
   const job=await rpc("lizhi_model_cloud_hew_claim",{p_worker:runId});
   if(job===null)return json({ok:true,job:null});
   if(!obj(job)||job.owner_uid!==ownerUid||!UUID.test(job.job_id??""))
    return json({ok:false,code:"WORKER_FOREIGN_OR_BAD_JOB"},409);
   let download=null;
   if(typeof job.current_path==="string"){
    const {data,error}=await storage.createSignedUrl(job.current_path,600);
    if(error||typeof data?.signedUrl!=="string")return json({ok:false,code:"WORKER_DOWNLOAD_URL_FAILED"},502);
    download=data.signedUrl;
   }
   return json({ok:true,job:{job_id:job.job_id,document_id:job.document_id,revision:job.revision,
    method:job.method,params:job.params,confirmed:job.confirmed===true,download_url:download}});
  }
  if(body.op==="upload_url"){
   const job=await claimedJob(body.job_id);
   if(!job)return json({ok:false,code:"WORKER_JOB_NOT_CLAIMED"},409);
   let path;
   if(body.kind==="revision"){
    const doc=(await rpc("lizhi_model_cloud_hew_list",{p_owner:ownerUid}))
      .find(d=>d.document_id===job.document_id);
    if(!doc)return json({ok:false,code:"WORKER_DOCUMENT_GONE"},409);
    path=revisionPath(ownerUid,job.document_id,doc.revision+1);
   }else if(body.kind==="artifact"&&typeof body.ext==="string"&&EXT.test(body.ext)){
    path=`${ownerUid}/${job.job_id}/${uuid()}.${body.ext}`;
   }else return json({ok:false,code:"WORKER_BAD_UPLOAD_KIND"},400);
   const {data,error}=await storage.createSignedUploadUrl(path);
   if(error||typeof data?.signedUrl!=="string")return json({ok:false,code:"WORKER_UPLOAD_URL_FAILED"},502);
   return json({ok:true,path,upload_url:data.signedUrl});
  }
  if(body.op==="finish"){
   const job=await claimedJob(body.job_id);
   if(!job)return json({ok:false,code:"WORKER_JOB_NOT_CLAIMED"},409);
   if(typeof body.success!=="boolean"||typeof body.mutated!=="boolean")
    return json({ok:false,code:"WORKER_BAD_FINISH"},400);
   const out=await rpc("lizhi_model_cloud_hew_finish",{
    p_job:job.job_id,p_success:body.success,p_mutated:body.mutated,
    p_new_path:typeof body.new_path==="string"?body.new_path:null,
    p_result:body.result??null,
    p_error:typeof body.error==="string"?body.error.slice(0,300):null,
   });
   return json(obj(out)?out:{ok:false,code:"WORKER_FINISH_UNKNOWN"});
  }
  return json({error:"WORKER_UNKNOWN_OP"},400);
 }catch{
  return json({ok:false,code:"WORKER_BACKEND_ERROR"},502);
 }
}
