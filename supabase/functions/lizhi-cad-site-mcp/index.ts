import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.75.0";
import {CAD_SITE_TOOLS,validateCadSiteTool} from "./cad-site-contract.mjs";

// Dedicated Sites *UPSTREAM* endpoint, not ChatGPT OAuth and not a public CAD
// workstation. A private ChatGPT Site verifies its own owner BEFORE forwarding
// a call with a separate server-only bearer. Never send a service_role key to Sites.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hex=/^[0-9a-f]{64,128}$/i;
const root=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const secret=Deno.env.get("LIZHI_CAD_SITE_MCP_TOKEN")||"";
const owner=Deno.env.get("LIZHI_CAD_SITE_OWNER_UID")||"";
const ready=!!root&&!!key&&hex.test(secret)&&uuid.test(owner);
const db=ready?createClient(root,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
const headers={"Cache-Control":"no-store, private","Pragma":"no-cache","X-Content-Type-Options":"nosniff"};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers});
const result=(id:string|number,data:unknown)=>json({jsonrpc:"2.0",id,result:data});
const rpcError=(id:string|number|null,code:number,message:string)=>json({jsonrpc:"2.0",id,error:{code,message}});
const fail=(id:string|number,msg:string)=>result(id,{isError:true,content:[{type:"text",text:msg}]});
const success=(id:string|number,body:Record<string,unknown>)=>result(id,{isError:false,content:[{type:"text",text:JSON.stringify(body)}],structuredContent:body});
async function eq(x:string,y:string):Promise<boolean>{
  if(!hex.test(x)||!hex.test(y))return false;
  const enc=new TextEncoder();
  const a=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(x)));
  const b=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(y)));
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
Deno.serve(async(req:Request)=>{
  // Client browsers cannot call this endpoint directly. No CORS, no cookies,
  // no caller-supplied owner UID, no arbitrary SQL or arbitrary MCP tool names.
  if(req.headers.has("origin"))return json({error:"BROWSER_ORIGIN_NOT_ALLOWED"},403);
  if(req.method!=="POST")return json({error:"POST_ONLY"},405);
  if(!ready||!db)return json({error:"SITE_BRIDGE_NOT_CONFIGURED"},503);
  const bearer=req.headers.get("authorization")||"";
  if(!bearer.startsWith("Bearer ")||!await eq(bearer.slice(7),secret))
    return json({error:"SITE_OWNER_CREDENTIAL_REQUIRED"},401);
  if(Number(req.headers.get("content-length")||"0")>16384)return json({error:"TOO_LARGE"},413);
  let p:Record<string,unknown>;
  try{
    const raw=await req.text();
    if(raw.length>16384)throw new Error("BODY_TOO_LARGE");
    p=JSON.parse(raw);
    if(!p||typeof p!=="object"||Array.isArray(p))throw new Error("INVALID_BODY");
  }catch{return rpcError(null,-32700,"Malformed bounded JSON");}
  const id=typeof p.id==="string"||typeof p.id==="number"?p.id:null;
  if(p.jsonrpc!=="2.0"||typeof p.method!=="string")return rpcError(id,-32600,"Invalid Request");
  if(p.method==="notifications/initialized"||id===null)return new Response(null,{status:202,headers});
  if(p.method==="initialize")return result(id,{
    protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false}},
    serverInfo:{name:"lizhi-cad-private-site-relay",version:"0.1.0"}
  });
  if(p.method==="ping")return result(id,{});
  if(p.method==="tools/list")return result(id,{tools:CAD_SITE_TOOLS});
  if(p.method!=="tools/call")return rpcError(id,-32601,"Unknown method");
  const params=p.params as Record<string,unknown>|null;
  if(!params||typeof params!=="object"||Array.isArray(params)||typeof params.name!=="string")
    return rpcError(id,-32602,"Invalid tool call");
  const checked=validateCadSiteTool(params.name,params.arguments??{});
  if(!checked.ok)return fail(id,checked.code||"CAD_INVALID_ARGUMENTS");
  // Read-only status is itself scoped to one hardcoded owner UID.
  if(params.name==="cad_status"){
    const {data,error}=await db.rpc("lizhi_cad_site_active",{p_owner:owner});
    if(error)return fail(id,"CAD_STATUS_UNAVAILABLE");
    const sessions=Array.isArray(data)?data:[];
    return success(id,{ok:true,online:sessions.length>0,sessions,engine:"local-browser",requiresPageOpen:true});
  }
  if(params.name==="cad_job_status"){
    const {data,error}=await db.rpc("lizhi_cad_site_job",{p_owner:owner,p_job:(checked.args as {job_id:string}).job_id});
    if(error)return fail(id,"CAD_JOB_STATUS_UNAVAILABLE");
    if(!data)return fail(id,"CAD_JOB_NOT_FOUND");
    // No DXF/file contents returned: only a bounded status/geometry receipt.
    return success(id,{ok:true,job:data,completed:data.state==="succeeded",automaticRetryAllowed:false});
  }
  // A successful tool call only queues work. The browser's existing first-party
  // heartbeat+claim+finish processes it exactly once while CAD is opt-in online.
  const {data,error}=await db.rpc("lizhi_cad_site_enqueue",{
    p_owner:owner,p_session:(checked.args as {session_id:string}).session_id,
    p_request_id:checked.args.request_id,
    p_command:checked.command,p_params:checked.params
  });
  if(error)return fail(id,"CAD_NOT_ONLINE_AUTHORIZED_OR_RATE_LIMITED");
  return success(id,{ok:true,job_id:data,queued:true,completed:false,
    automaticRetryAllowed:false,note:"排入短效 CAD 工作階段；必須使用 cad_job_status 查到 succeeded 才能說已繪圖。絕不自動改 request_id 重試。"});
});
