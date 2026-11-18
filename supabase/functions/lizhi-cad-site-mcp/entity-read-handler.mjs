// Feature-gated CAD entity-read RPC adapter (no production activation).
// The upstream private Site must already verify owner identity and server-only bearer.
import {validateEntityReadTool,projectEntityReadReceipt} from "./cad-entity-read-v1.mjs";
const error=code=>({ok:false,code});
export async function executeEntityReadTool(db,owner,name,args){
 const v=validateEntityReadTool(name,args);
 if(!v.ok)return v;
 if(!db||typeof db.rpc!=="function"||typeof owner!=="string")
   return error("CAD_READ_NOT_CONFIGURED");
 if(name==="cad_read_job"){
  const {data,error:err}=await db.rpc("lizhi_cad_site_read_job",{p_owner:owner,p_job:v.job_id});
  if(err)return error("CAD_READ_JOB_UNAVAILABLE");
  if(!data)return error("CAD_READ_JOB_NOT_FOUND");
  return projectEntityReadReceipt(data);
 }
 const {data,error:err}=await db.rpc("lizhi_cad_site_read_enqueue",{
   p_owner:owner,p_session:v.session_id,p_request_id:v.request_id,
   p_command:v.command,p_params:v.params
 });
 if(err)return error("CAD_READ_SESSION_OR_QUEUE_UNAVAILABLE");
 if(typeof data!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data))
  return error("CAD_READ_INVALID_JOB_ID");
 return {ok:true,job_id:data,queued:true,completed:false,automaticRetryAllowed:false};
}
