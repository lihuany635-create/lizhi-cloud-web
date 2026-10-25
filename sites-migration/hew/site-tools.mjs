/**
 * SERVER-ONLY Site tool adapter. Portable candidate: requires an actual
 * PRIVATE ChatGPT Site runtime to register these tools and pass verified auth.
 * Does not create or publish a Site, execute models or authorize a browser.
 */
import {MODEL_SITE_TOOLS,validateModelSiteTool} from "../../hew/sites/model-site-contract.mjs";
export const modelSiteTools=MODEL_SITE_TOOLS;
export const MODEL_UPSTREAM="https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-model-site-mcp";
const hex=/^[0-9a-f]{64,128}$/i;
const obj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
const fail=code=>({isError:true,content:[{type:"text",text:code}]});
const success=v=>({isError:false,content:[{type:"text",text:JSON.stringify(v)}]});
async function readBoundedJson(resp,max=32768){
 const h=resp.headers.get("content-length");
 if(h!==null&&(!/^\d+$/.test(h)||Number(h)>max))throw Error("UPSTREAM_TOO_LARGE");
 if(!resp.body)throw Error("EMPTY_UPSTREAM");
 const reader=resp.body.getReader(),parts=[];
 let len=0;try{
  for(;;){const {value,done}=await reader.read();if(done)break;
    if(!value)continue;len+=value.length;if(len>max)throw Error("UPSTREAM_TOO_LARGE");parts.push(value);}
 }finally{try{await reader.cancel()}catch{}}
 const data=new Uint8Array(len);let at=0;
 for(const p of parts){data.set(p,at);at+=p.length;}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(data));
}
export async function handleModelSiteTool(name,args,trustedAuth,serverSecrets,fetcher=fetch){
 const checked=validateModelSiteTool(name,args);
 if(!checked.ok)return fail(checked.code);
 // Identity MUST come from the Site's verified server-side session, not
 // request headers, model arguments, unverified profile or client JS.
 if(trustedAuth?.signedIn!==true||typeof trustedAuth?.verifiedUserEmail!=="string")
   return fail("MODEL_OWNER_AUTH_REQUIRED");
 if(typeof serverSecrets?.ownerEmail!=="string"||
    trustedAuth.verifiedUserEmail.trim().toLowerCase()!==serverSecrets.ownerEmail.trim().toLowerCase())
   return fail("MODEL_OWNER_ACCESS_DENIED");
 if(!hex.test(serverSecrets?.siteMcpToken??""))return fail("MODEL_SITE_NOT_CONFIGURED");
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),18000);
 try{
  const rpcId=crypto.randomUUID();
  const response=await fetcher(MODEL_UPSTREAM,{
   method:"POST",redirect:"manual",signal:controller.signal,
   headers:{Authorization:"Bearer "+serverSecrets.siteMcpToken,
     "Content-Type":"application/json",Accept:"application/json"},
   body:JSON.stringify({jsonrpc:"2.0",id:rpcId,method:"tools/call",params:{name,arguments:args}})
  });
  if(response.status>=300&&response.status<400)return fail("MODEL_UPSTREAM_REDIRECT_REFUSED_DO_NOT_RETRY");
  if(response.status===401)return fail("MODEL_UPSTREAM_UNAUTHORIZED");
  if(response.status===403)return fail("MODEL_UPSTREAM_FORBIDDEN");
  if(response.status===503)return fail("MODEL_ENGINE_UNAVAILABLE");
  if(!response.ok)return fail("MODEL_UPSTREAM_HTTP_"+response.status);
  const body=await readBoundedJson(response);
  if(!obj(body)||body.jsonrpc!=="2.0"||body.id!==rpcId||
    !obj(body.result)||typeof body.result.isError!=="boolean"||
    !Array.isArray(body.result.content)||body.result.content.length!==1)
    return fail("MODEL_RESULT_UNKNOWN_DO_NOT_RETRY");
  const payload=body.result.content[0];
  if(!obj(payload)||payload.type!=="text"||typeof payload.text!=="string"||
    payload.text.length>8192)return fail("MODEL_RESULT_UNKNOWN_DO_NOT_RETRY");
  let value;try{value=JSON.parse(payload.text)}catch{return fail("MODEL_RESULT_UNKNOWN_DO_NOT_RETRY")}
  if(body.result.isError||!obj(value)||value.ok!==true)return fail("MODEL_UPSTREAM_REJECTED");
  if(name==="model_status"){
   if(!Array.isArray(value.sessions)||typeof value.online!=="boolean")return fail("MODEL_BAD_STATUS");
   return success({ok:true,online:value.online,requiresExplicitPageConsent:true,
     sessions:value.sessions.filter(v=>obj(v)&&typeof v.session_id==="string"&&typeof v.document_id==="string")
     .slice(0,8).map(v=>({session_id:v.session_id,document_id:v.document_id}))});
  }
  if(name==="model_job_status"){
   const j=value.job;
   const states=["queued","claimed","succeeded","failed","cancelled","expired"];
   if(!obj(j)||typeof j.job_id!=="string"||!states.includes(j.state))return fail("MODEL_BAD_JOB");
   return success({ok:true,job_id:j.job_id,state:j.state,completed:j.state==="succeeded",
     automaticRetryAllowed:false,error:typeof j.error==="string"?j.error.slice(0,200):null});
  }
  if(name==="model_scene"){
   if(!Array.isArray(value.entities)||typeof value.document_id!=="string"||
     typeof value.revision!=="string")return fail("MODEL_BAD_SCENE");
   return success({ok:true,document_id:value.document_id,revision:value.revision,
     entities:value.entities.filter(v=>obj(v)&&typeof v.id==="string")
       .slice(0,100).map(v=>({id:v.id,name:typeof v.name==="string"?v.name.slice(0,80):null,
         kind:typeof v.kind==="string"?v.kind.slice(0,32):null}))});
  }
  if(value.queued!==true||value.completed!==false||typeof value.job_id!=="string")
    return fail("MODEL_RESULT_UNKNOWN_DO_NOT_RETRY");
  return success({ok:true,queued:true,completed:false,job_id:value.job_id,
    automaticRetryAllowed:false,note:"Only queued. Read model_job_status and verify succeeded before claiming geometry created."});
 }catch(e){
  if(e instanceof Error&&e.name==="AbortError")return fail("MODEL_TIMEOUT_DO_NOT_RETRY");
  return fail("MODEL_RESULT_UNKNOWN_DO_NOT_RETRY");
 }finally{clearTimeout(timeout);}
}
