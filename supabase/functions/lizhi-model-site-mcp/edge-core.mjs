/**
 * Candidate *server-only* Lizhi 3D upstream MCP Edge handler.
 * No deployment, no browser CORS, no general-purpose Hew dispatcher.
 * Server secrets and service_role client must be provided only by Deno index.ts.
 * Local Site owner auth happens independently BEFORE this upstream bearer.
 */
import {MODEL_SITE_TOOLS,validateModelSiteTool} from "./model-site-contract.mjs";
const HEX=/^[0-9a-f]{64,128}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEADER={"Cache-Control":"private, no-store","Pragma":"no-cache","X-Content-Type-Options":"nosniff"};
const object=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const json=(obj,status=200)=>Response.json(obj,{status,headers:HEADER});
const response=(id,result)=>json({jsonrpc:"2.0",id,result});
const rpcError=(id,code,message)=>json({jsonrpc:"2.0",id,error:{code,message}});
const fail=(id,code)=>response(id,{isError:true,content:[{type:"text",text:code}]});
const success=(id,body)=>response(id,{isError:false,content:[{type:"text",text:JSON.stringify(body)}]});
async function secureEqual(a,b){
 if(!HEX.test(a)||!HEX.test(b))return false;
 const enc=new TextEncoder();
 const one=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(a)));
 const two=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(b)));
 let diff=0;for(let i=0;i<one.length;i++)diff|=one[i]^two[i];
 return diff===0;
}
async function readJsonLimited(req,max=16384){
 const declared=req.headers.get("content-length");
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>max))throw Error("TOO_LARGE");
 if(!req.body)throw Error("EMPTY_BODY");
 const reader=req.body.getReader();
 let size=0;const parts=[];
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;
   size+=value.length;if(size>max)throw Error("TOO_LARGE");parts.push(value);}
 }finally{try{await reader.cancel()}catch{}}
 const data=new Uint8Array(size);let offset=0;
 for(const part of parts){data.set(part,offset);offset+=part.length}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(data));
}
function properSessions(data){
 return Array.isArray(data)
   ?data.filter(s=>object(s)&&UUID.test(s.session_id??"")&&UUID.test(s.document_id??"")).slice(0,8)
   :[];
}
async function call(db,name,params){
 const {data,error}=await db.rpc(name,params);
 if(error)throw Error("MODEL_RPC_DENIED_OR_UNAVAILABLE");
 return data;
}
export async function handleModelEdgeRequest(req,{token,ownerUid,db,verifyBearer=secureEqual}){
 if(req.headers.has("origin"))return json({error:"MODEL_BROWSER_ORIGIN_NOT_ALLOWED"},403);
 if(req.method!=="POST")return json({error:"POST_ONLY"},405);
 if(!HEX.test(token??"")||!UUID.test(ownerUid??"")||!db?.rpc)
   return json({error:"MODEL_UPSTREAM_NOT_CONFIGURED"},503);
 const bearer=req.headers.get("authorization")??"";
 if(!bearer.startsWith("Bearer ")||!await verifyBearer(bearer.slice(7),token))
   return json({error:"MODEL_SITE_BEARER_REQUIRED"},401);
 let frame;
 try{frame=await readJsonLimited(req)}catch(e){
  if(e instanceof Error&&e.message==="TOO_LARGE")return json({error:"MODEL_BODY_TOO_LARGE"},413);
  return rpcError(null,-32700,"Malformed bounded JSON");
 }
 const id=typeof frame?.id==="string"||typeof frame?.id==="number"?frame.id:null;
 if(!object(frame)||frame.jsonrpc!=="2.0"||typeof frame.method!=="string")
   return rpcError(id,-32600,"Invalid JSON-RPC request");
 if(frame.method==="notifications/initialized"||id===null)return new Response(null,{status:202,headers:HEADER});
 if(frame.method==="initialize")return response(id,{
  protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false}},
  serverInfo:{name:"lizhi-model-private-site-relay",version:"0.1.0"}
 });
 if(frame.method==="ping")return response(id,{});
 if(frame.method==="tools/list")return response(id,{tools:MODEL_SITE_TOOLS});
 if(frame.method!=="tools/call")return rpcError(id,-32601,"Unknown method");
 const p=frame.params;
 if(!object(p)||typeof p.name!=="string")return rpcError(id,-32602,"Invalid tool call");
 const checked=validateModelSiteTool(p.name,p.arguments??{});
 if(!checked.ok)return fail(id,checked.code);
 if(p.name==="model_new_document")
  return fail(id,"MODEL_NEW_DOCUMENT_NOT_IMPLEMENTED_UNSAVED_GUARD");
 try{
  if(p.name==="model_status"){
   const sessions=properSessions(await call(db,"lizhi_model_site_sessions",{p_owner:ownerUid}));
   return success(id,{ok:true,online:sessions.length>0,sessions,
    engine:"hew-browser-wasm",requiresExplicitPageConsent:true,requiresPageOpen:true});
  }
  if(p.name==="model_job_status"){
   const job=await call(db,"lizhi_model_site_job",{p_owner:ownerUid,p_job:checked.args.job_id});
   if(!object(job)||!UUID.test(job.job_id??""))return fail(id,"MODEL_JOB_NOT_FOUND");
   return success(id,{ok:true,job:{job_id:job.job_id,state:job.state,
    error:typeof job.error==="string"?job.error.slice(0,200):null}});
  }
  if(p.name==="model_scene"){
   const scene=await call(db,"lizhi_model_site_scene",
    {p_owner:ownerUid,p_session:checked.args.session_id});
   if(!object(scene)||!UUID.test(scene.document_id??"")||
      typeof scene.revision!=="string"||!Array.isArray(scene.entities))
    return fail(id,"MODEL_SCENE_UNAVAILABLE");
   const entities=scene.entities.filter(x=>object(x)&&typeof x.id==="string").slice(0,100)
    .map(x=>({id:x.id,name:typeof x.name==="string"?x.name.slice(0,80):null,
      kind:typeof x.kind==="string"?x.kind.slice(0,32):null}));
   return success(id,{ok:true,document_id:scene.document_id,
    revision:scene.revision,entities});
  }
  const sessions=properSessions(await call(db,"lizhi_model_site_sessions",{p_owner:ownerUid}));
  const session=sessions.find(x=>x.session_id===checked.args.session_id);
  if(!session)return fail(id,"MODEL_OWNER_SESSION_OFFLINE_OR_NO_CONSENT");
  const scene=await call(db,"lizhi_model_site_scene",
   {p_owner:ownerUid,p_session:session.session_id});
  if(!object(scene)||scene.document_id!==session.document_id||
    typeof scene.revision!=="string"||scene.revision.length>128)
   return fail(id,"MODEL_DOCUMENT_REVISION_NOT_VERIFIED");
  const queued=await call(db,"lizhi_model_site_enqueue",{
   p_owner:ownerUid,p_session:session.session_id,
   p_request_id:checked.args.request_id,p_document:session.document_id,
   p_revision:scene.revision,p_command:checked.command,p_params:checked.params
  });
  if(!UUID.test(queued??""))return fail(id,"MODEL_UPSTREAM_ENQUEUE_UNKNOWN_DO_NOT_RETRY");
  return success(id,{ok:true,queued:true,completed:false,job_id:queued,
   automaticRetryAllowed:false,
   note:"Queued only; check model_job_status until succeeded. Unknown writes MUST NOT retry."});
 }catch{
  return fail(id,"MODEL_UPSTREAM_RESULT_UNKNOWN_DO_NOT_RETRY");
 }
}
