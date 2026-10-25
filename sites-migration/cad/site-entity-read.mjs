// OPTIONAL candidate adapter; not enabled by the released six-tool Site.
// Integrate only after native WASM, DB and Edge read tools all pass E2E.
import {SITE_CAD_ENDPOINT} from "../../cad/sites/cad-site-contract.mjs";
import {ENTITY_READ_TOOLS,validateEntityReadTool,projectEntityReadReceipt} from "../../cad/sites/cad-entity-read-v1.mjs";
export const cadEntityReadToolsCandidate=ENTITY_READ_TOOLS;
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const err=code=>({isError:true,content:[{type:"text",text:code}]});
const hex=/^[0-9a-f]{64,128}$/i;
async function boundedResponseJson(response){
 if(response.headers.get("content-length") && Number(response.headers.get("content-length"))>8192)
  throw Error("CAD_READ_RESPONSE_TOO_LARGE");
 if(!response.body)throw Error("CAD_READ_EMPTY_RESPONSE");
 const reader=response.body.getReader();
 const chunks=[];let size=0;
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   if(!value)continue;
   size+=value.byteLength;if(size>8192)throw Error("CAD_READ_RESPONSE_TOO_LARGE");
   chunks.push(value);
  }
 }finally{try{await reader.cancel()}catch{}}
 const all=new Uint8Array(size);let i=0;
 for(const c of chunks){all.set(c,i);i+=c.byteLength;}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(all));
}
export async function handleCadEntityReadSiteTool(name,args,auth,secrets,fetcher=fetch){
 const v=validateEntityReadTool(name,args);
 if(!v.ok)return err(v.code);
 if(auth?.signedIn!==true||typeof auth.verifiedUserEmail!=="string"||
   typeof secrets?.ownerEmail!=="string"||auth.verifiedUserEmail.trim().toLowerCase()!==secrets.ownerEmail.trim().toLowerCase())
  return err("OWNER_AUTH_REQUIRED");
 if(secrets?.entityReadEnabled!==true)return err("CAD_READ_NOT_ENABLED");
 if(!hex.test(secrets?.siteMcpToken??""))return err("CAD_SITE_SECRET_NOT_CONFIGURED");
 const ctrl=new AbortController();
 const timer=setTimeout(()=>ctrl.abort(),18000);
 try{
  const id=crypto.randomUUID();
  const rsp=await fetcher(SITE_CAD_ENDPOINT,{
   method:"POST",redirect:"manual",signal:ctrl.signal,
   headers:{"Authorization":"Bearer "+secrets.siteMcpToken,
     "Content-Type":"application/json","Accept":"application/json"},
   body:JSON.stringify({jsonrpc:"2.0",id,method:"tools/call",
      params:{name,arguments:args}})
  });
  if(rsp.type==="opaqueredirect"||(rsp.status>=300&&rsp.status<400))
   return err("CAD_READ_REDIRECT_REJECTED");
  if(rsp.status===401||rsp.status===403)return err("CAD_READ_UPSTREAM_AUTH_DENIED");
  if(rsp.status===503)return err("CAD_READ_UPSTREAM_UNAVAILABLE");
  if(!rsp.ok)return err("CAD_READ_HTTP_ERROR");
  const data=await boundedResponseJson(rsp);
  if(!obj(data)||data.jsonrpc!=="2.0"||data.id!==id||!obj(data.result)
    ||data.result.isError!==false||!Array.isArray(data.result.content)
    ||data.result.content.length!==1||data.result.content[0]?.type!=="text")
    return err("CAD_READ_INVALID_UPSTREAM_RPC");
  let payload;
  try{payload=JSON.parse(data.result.content[0].text)}catch{return err("CAD_READ_INVALID_UPSTREAM_JSON")}
  if(!obj(payload)||payload.ok!==true)return err("CAD_READ_UPSTREAM_TOOL_ERROR");
  if(name==="cad_read_job"){
   const value=projectEntityReadReceipt(payload);
   if(!value.ok)return err(value.code);
   return {isError:false,content:[{type:"text",text:JSON.stringify(value)}]};
  }
  if(typeof payload.job_id!=="string"||payload.queued!==true||payload.completed!==false)
   return err("CAD_READ_UNCONFIRMED_DO_NOT_RETRY");
  return {isError:false,content:[{type:"text",text:JSON.stringify({
   ok:true,job_id:payload.job_id,queued:true,completed:false,automaticRetryAllowed:false
  })}]};
 }catch(e){
  return err(e?.name==="AbortError"?"CAD_READ_TIMEOUT_DO_NOT_RETRY":"CAD_READ_UNKNOWN_DO_NOT_RETRY");
 }finally{clearTimeout(timer)}
}
