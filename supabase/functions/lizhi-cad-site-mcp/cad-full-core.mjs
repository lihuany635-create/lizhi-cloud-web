// Handler for the full CAD tools (cad-full-contract.mjs). Server only; the Site has already
// verified the owner and sent the server-only bearer. Writes are only queued.
import {CAD_FULL_TOOL_NAMES,validateCadFullTool,cadReference} from "./cad-full-contract.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ARTIFACT_PATH=/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9.]+$/i;
export const CAD_FILES_BUCKET="lizhi-cad-files";
const INLINE_IMAGE_MAX_BYTES=1_500_000;
const obj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const text=v=>({type:"text",text:JSON.stringify(v)});
const fail=code=>({isError:true,content:[{type:"text",text:code}]});
const ok=(v,extra=[])=>({isError:false,content:[text(v),...extra]});
function toBase64(bytes){let s="";for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s)}

/** Signed links for the owner's own private files, and the first small PNG inline. */
export async function presentCadArtifacts(db,owner,result){
 const images=[];
 if(!obj(result)||!obj(result.artifacts)||!db?.storage)return {result,images};
 const artifacts={};
 for(const [key,a] of Object.entries(result.artifacts)){
  if(!obj(a)||a.bucket!==CAD_FILES_BUCKET||typeof a.path!=="string"||!ARTIFACT_PATH.test(a.path)||!a.path.startsWith(owner+"/")){
   artifacts[key]=obj(a)&&typeof a.dropped==="string"?{dropped:a.dropped}:{unavailable:true};continue;
  }
  const entry={mime:typeof a.mime==="string"?a.mime:null,bytes:Number.isSafeInteger(a.bytes)?a.bytes:null};
  try{const {data,error}=await db.storage.from(CAD_FILES_BUCKET).createSignedUrl(a.path,3600);
   if(!error&&typeof data?.signedUrl==="string"){entry.url=data.signedUrl;entry.expires_in_s=3600}}catch{}
  if(!images.length&&entry.mime==="image/png"&&entry.bytes!==null&&entry.bytes<=INLINE_IMAGE_MAX_BYTES){
   try{const {data,error}=await db.storage.from(CAD_FILES_BUCKET).download(a.path);
    if(!error&&data){const b=new Uint8Array(await data.arrayBuffer());
     if(b.length<=INLINE_IMAGE_MAX_BYTES)images.push({type:"image",data:toBase64(b),mimeType:"image/png"})}}catch{}
  }
  artifacts[key]=entry;
 }
 return {result:{...result,artifacts},images};
}

async function rpc(db,name,args){
 const {data,error}=await db.rpc(name,args);
 if(error)throw Error("CAD_RPC_FAILED");
 return data;
}

/**
 * Returns null when `name` is not a full CAD tool, otherwise an MCP tool result.
 * @param {string} name
 * @param {any} args
 * @param {{db:any, owner:string, dispatchWorker?: null | (() => Promise<boolean>)}} ctx
 */
export async function handleCadFullTool(name,args,{db,owner,dispatchWorker=null}){
 if(!CAD_FULL_TOOL_NAMES.has(name))return null;
 const v=validateCadFullTool(name,args??{});
 if(!v.ok)return fail(v.code);
 if(name==="cad_api_reference"){const r=cadReference(v.args);return r.ok?ok(r):fail(r.code)}
 try{
  if(name==="cad_call"){
   let job;
   try{job=await rpc(db,"lizhi_cad_site_enqueue",{p_owner:owner,p_session:v.args.session_id,
     p_request_id:v.args.request_id,p_command:"lizhi.call",p_params:v.params})}
   catch{return fail("CAD_NOT_ONLINE_AUTHORIZED_OR_RATE_LIMITED")}
   if(!UUID.test(job??""))return fail("CAD_ENQUEUE_UNKNOWN_DO_NOT_RETRY");
   return ok({ok:true,job_id:job,queued:true,completed:false,automaticRetryAllowed:false,
    note:"Queued on the open CAD page. Read cad_job_status_v2 until succeeded; never retry an unknown write."});
  }
  if(name==="cad_job_status_v2"){
   const j=await rpc(db,"lizhi_cad_site_job",{p_owner:owner,p_job:v.args.job_id});
   if(!obj(j))return fail("CAD_JOB_NOT_FOUND");
   const shown=await presentCadArtifacts(db,owner,j.result??null);
   return ok({ok:true,job:{...j,result:shown.result},completed:j.state==="succeeded",automaticRetryAllowed:false},shown.images);
  }
  if(name==="cad_cloud_documents"){
   const list=await rpc(db,"lizhi_cad_cloud_list",{p_owner:owner});
   return ok({ok:true,mode:"cad_cloud",requires_browser:false,documents:Array.isArray(list)?list.slice(0,200):[]});
  }
  if(name==="cad_cloud_new_document"){
   const d=await rpc(db,"lizhi_cad_cloud_new",{p_owner:owner,p_name:v.args.name,p_metric:v.args.metric});
   if(!obj(d)||!UUID.test(d.document_id??""))return fail("CAD_CLOUD_CREATE_UNKNOWN");
   return ok({ok:true,...d});
  }
  if(name==="cad_cloud_job_status"){
   const j=await rpc(db,"lizhi_cad_cloud_job",{p_owner:owner,p_job:v.args.job_id});
   if(!obj(j)||!UUID.test(j.job_id??""))return fail("CAD_JOB_NOT_FOUND");
   const shown=await presentCadArtifacts(db,owner,j.result??null);
   return ok({ok:true,job:{...j,result:shown.result},completed:j.state==="succeeded",automaticRetryAllowed:false},shown.images);
  }
  if(name==="cad_cloud_call"){
   let job;
   try{job=await rpc(db,"lizhi_cad_cloud_enqueue",{p_owner:owner,p_request:v.args.request_id,
     p_document:v.args.document_id,p_revision:v.args.revision,p_call:v.call})}
   catch{return fail("CAD_CLOUD_ENQUEUE_REFUSED_CHECK_REVISION_DO_NOT_BLIND_RETRY")}
   if(!UUID.test(job??""))return fail("CAD_ENQUEUE_UNKNOWN_DO_NOT_RETRY");
   let worker="not_configured";
   if(typeof dispatchWorker==="function"){try{worker=(await dispatchWorker())?"started":"start_failed"}catch{worker="start_failed"}}
   return ok({ok:true,job_id:job,queued:true,completed:false,mode:"cad_cloud",worker,automaticRetryAllowed:false,
    note:"Queued for the cloud CAD worker. Poll cad_cloud_job_status (usually 1-3 minutes)."});
  }
 }catch{return fail("CAD_RESULT_UNKNOWN_DO_NOT_RETRY")}
 return fail("UNKNOWN_CAD_TOOL");
}
