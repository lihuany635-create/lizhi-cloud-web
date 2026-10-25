/**
 * Private ChatGPT Site's SERVER-SIDE MCP handler, analogous to the phone v9 Site.
 * No ChatGPT OAuth/DCR needed here; Sites verifies the signed-in owner's identity.
 * Never accept emails/auth flags from MCP arguments, browser headers or request body.
 */
import {CAD_SITE_TOOLS,SITE_CAD_ENDPOINT,validateCadSiteTool} from "../../cad/sites/cad-site-contract.mjs";
export const cadSiteTools=CAD_SITE_TOOLS;
const hex=/^[a-f0-9]{64,128}$/i;
const obj=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const error=code=>({isError:true,content:[{type:"text",text:code}]});
async function boundedJson(response,max=32768){
  const length=response.headers.get("content-length");
  if(length&&(!/^\d+$/.test(length)||Number(length)>max))throw Error("TOO_LARGE");
  if(!response.body)throw Error("EMPTY");
  const reader=response.body.getReader(),chunks=[];
  let used=0;
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      if(!value)continue;
      used+=value.length;if(used>max)throw Error("TOO_LARGE");
      chunks.push(value);
    }
  }finally{try{await reader.cancel();}catch{}}
  const out=new Uint8Array(used);
  let at=0;for(const a of chunks){out.set(a,at);at+=a.length}
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(out));
}
// Native read-only job results: never forward a full document or filename.
function safeReadReceipt(value){
  if(!obj(value))return null;
  const unsigned=v=>Number.isSafeInteger(v)&&v>=0?v:null;
  if(Array.isArray(value.entities)){
    const simple=new Set(["line","circle","arc","lwpolyline","polyline"]);
    const entities=value.entities.slice(0,8).filter(obj).map(e=>{
      const type=typeof e.type==="string"?e.type.slice(0,32):"";
      const layer=typeof e.layer==="string"?e.layer.slice(0,80):"";
      const handle=typeof e.handle==="string"&&/^[0-9a-f]{1,16}$/i.test(e.handle)?e.handle:null;
      let geometry=null;
      if(simple.has(type.toLowerCase())&&obj(e.geometry)&&JSON.stringify(e.geometry).length<=640)
        geometry=e.geometry;
      return {handle,type,layer,geometry};
    });
    const output={revision:unsigned(value.revision),count:unsigned(value.count),
      returned:entities.length,offset:unsigned(value.offset),entities,
      hasMore:value.hasMore===true};
    return JSON.stringify(output).length<=3800?output:null;
  }
  if(unsigned(value.entityCount)!==null){
    const validBounds=Array.isArray(value.extents)&&value.extents.length===2&&
      value.extents.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==="number"&&Number.isFinite(n)));
    const entries=obj(value.counts)?Object.entries(value.counts)
      .filter(([key,n])=>key.length<=40&&unsigned(n)!==null).slice(0,30):[];
    const output={revision:unsigned(value.revision),entityCount:unsigned(value.entityCount),
      counts:Object.fromEntries(entries),
      extents:validBounds?value.extents:null,
      currentLayer:typeof value.currentLayer==="string"?value.currentLayer.slice(0,80):null,
      dirty:value.dirty===true,
      selectionCount:unsigned(value.selectionCount)};
    return JSON.stringify(output).length<=3800?output:null;
  }
  return null;
}
export async function handleCadSiteTool(
  name,args,auth,secrets,fetcher=fetch
){
  const command=validateCadSiteTool(name,args);
  if(!command.ok)return error(command.code||"INVALID_CAD_COMMAND");
  // The Sites identity is provided by the trusted Site server. Never trust
  // custom headers like X-Owner-Email or an "owner" tool argument.
  if(auth?.signedIn!==true || typeof auth?.verifiedUserEmail!=="string" ||
     !secrets?.ownerEmail || auth.verifiedUserEmail.trim().toLowerCase()!==secrets.ownerEmail.trim().toLowerCase())
    return error("OWNER_AUTH_REQUIRED");
  if(!hex.test(secrets?.siteMcpToken||""))return error("SITE_BRIDGE_NOT_CONFIGURED");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),18000);
  try{
    const id=crypto.randomUUID();
    // Send ONE bounded POST per invocation, no redirects and no retries.
    // Local user's CAD page must separately have enabled both AI consent and
    // its own Supabase first-party session lease before accepting geometry.
    const response=await fetcher(SITE_CAD_ENDPOINT,{
      method:"POST",redirect:"manual",signal:controller.signal,
      headers:{Authorization:"Bearer "+secrets.siteMcpToken,
        "Content-Type":"application/json",Accept:"application/json"},
      body:JSON.stringify({jsonrpc:"2.0",id,method:"tools/call",
        params:{name,arguments:args}})
    });
    if(response.status>=300&&response.status<400)return error("CAD_UPSTREAM_REDIRECT_REJECTED");
    if(!response.ok)return error("CAD_UPSTREAM_REJECTED_OR_UNAVAILABLE");
    const body=await boundedJson(response);
    if(!obj(body)||body.jsonrpc!=="2.0"||body.id!==id||!obj(body.result) ||
       typeof body.result.isError!=="boolean"||
       !Array.isArray(body.result.content)||body.result.content.length!==1)
      return error("CAD_UNCONFIRMED_DO_NOT_RETRY");
    const text=body.result.content[0];
    if(!obj(text)||text.type!=="text"||typeof text.text!=="string"||text.text.length>8192)
      return error("CAD_UNCONFIRMED_DO_NOT_RETRY");
    // Project only the documented payload; avoid exposing arbitrary upstream data.
    let value;
    try{value=JSON.parse(text.text)}catch{return error("CAD_UNCONFIRMED_DO_NOT_RETRY")}
    if(!obj(value)||body.result.isError===true||value.ok!==true)
      return error("CAD_REJECTED_OR_UNAVAILABLE");
    if(name==="cad_status"){
      if(typeof value.online!=="boolean"||!Array.isArray(value.sessions))
        return error("CAD_INVALID_STATUS");
      const sessions=value.sessions.filter(x=>obj(x)&&typeof x.session_id==="string")
        .slice(0,8).map(x=>({session_id:x.session_id,last_seen:x.last_seen}));
      return {isError:false,content:[{type:"text",text:JSON.stringify({ok:true,online:value.online,sessions,requiresPageOpen:true})}]};
    }
    if(name==="cad_job_status"){
      if(!obj(value.job)||typeof value.job.state!=="string")return error("CAD_INVALID_JOB_STATUS");
      const job=value.job;
      const allowed=new Set(["queued","claimed","succeeded","failed","cancelled","expired"]);
      if(!allowed.has(job.state))return error("CAD_INVALID_JOB_STATUS");
      return {isError:false,content:[{type:"text",text:JSON.stringify({
        ok:true,job_id:job.job_id,state:job.state,
        completed:job.state==="succeeded",error:typeof job.error==="string"?job.error.slice(0,200):null,
        automaticRetryAllowed:false,...(job.state==="succeeded"&&job.result?{readResult:safeReadReceipt(job.result)}:{})})}]};
    }
    if(typeof value.job_id!=="string"||value.queued!==true||value.completed!==false)
      return error("CAD_UNCONFIRMED_DO_NOT_RETRY");
    return {isError:false,content:[{type:"text",text:JSON.stringify({
      ok:true,job_id:value.job_id,queued:true,completed:false,automaticRetryAllowed:false,
      note:"指令只已排隊。請用 cad_job_status 確認 succeeded，不要因逾時自行重試。" })}]};
  }catch{
    return error("CAD_RESULT_UNKNOWN_DO_NOT_RETRY");
  }finally{clearTimeout(timeout)}
}
