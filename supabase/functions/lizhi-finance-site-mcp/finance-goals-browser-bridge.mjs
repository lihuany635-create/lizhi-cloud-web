// P6 private browser goals bridge candidate: no browser gets the Site MCP bearer.
// The ORIGINAL Finance Edge keeps server-to-server Site requests separate.
// Browser calls use a real verified Supabase access token for the owner, and
// writes need an exact-argument, short-lived HMAC prepare/commit challenge.
// All P1-P5 role-restricted RPC writes still validate CAS and request IDs.
import {executeGoalsCandidate} from "./finance-goals-p5-edge.mjs";
import {validateGoalsP5,GOALS_P5_TOOLS} from "./finance-goals-p5-contract.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEAD={"cache-control":"private, no-store","pragma":"no-cache",
  "x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
const toolNames=new Set(GOALS_P5_TOOLS.map(x=>x.name));
const textEncoder=new TextEncoder();
function json(body,status=200,origin=null){
  return Response.json(body,{status,headers:{...HEAD,...(origin?{
    "access-control-allow-origin":origin,"vary":"Origin"}:{})}});
}
function reject(code,status=400,origin=null){return json({ok:false,code},status,origin)}
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const safe=x=>typeof x==="string"&&x.length>0&&x.length<=4096;
function canonical(x){
  if(Array.isArray(x))return x.map(canonical);
  if(!object(x))return x;
  return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]));
}
function b64(array){
  let str="";for(const value of array)str+=String.fromCharCode(value);
  return btoa(str).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function from64(value){
  if(!/^[\w-]+$/.test(value)||value.length>4096)throw Error("BAD_TOKEN");
  const str=atob(value.replace(/-/g,"+").replace(/_/g,"/"));
  return Uint8Array.from(str,c=>c.charCodeAt(0));
}
async function digest(value){return b64(new Uint8Array(await crypto.subtle.digest("SHA-256",
  textEncoder.encode(JSON.stringify(canonical(value))))));}
async function mac(secret,payload){
  if(!safe(secret)||secret.length<32)throw Error("NOT_CONFIGURED");
  const key=await crypto.subtle.importKey("raw",textEncoder.encode(secret),
    {name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC",key,textEncoder.encode(payload))));
}
function timingEqual(a,b){
  if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;
  let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);
  return v===0;
}
async function bounded(req,max=8192){
  const len=req.headers.get("content-length");
  if(len!==null&&(!/^\d+$/.test(len)||Number(len)>max))throw Error("TOO_LARGE");
  const reader=req.body?.getReader();if(!reader)throw Error("NO_BODY");
  let n=0;const chunks=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;
    if(value){n+=value.byteLength;if(n>max)throw Error("TOO_LARGE");chunks.push(value);}
  }}finally{try{await reader.cancel()}catch{}}
  const buffer=new Uint8Array(n);let offset=0;
  for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}
  const body=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buffer));
  if(!object(body))throw Error("BAD_JSON");
  return body;
}
export function createGoalsBrowserBridge({db,verifyUser,ownerUid,secret,origins=[],
  clock=()=>Date.now()}={}){
  const allowed=new Set(origins.filter(x=>typeof x==="string"&&
    /^https:\/\/[a-z0-9.-]+(?::\d{1,5})?$/i.test(x)));
  const configured=Boolean(db?.rpc&&typeof verifyUser==="function"&&
    UUID.test(ownerUid||"")&&safe(secret)&&secret.length>=32&&allowed.size);
  async function handle(req){
    const origin=req.headers.get("origin");
    if(!origin||!allowed.has(origin))return reject("GOALS_ORIGIN_DENIED",403);
    const cors={"access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS",
      "access-control-allow-headers":"authorization, content-type","vary":"Origin",
      "cache-control":"private, no-store"};
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
    if(req.method!=="POST")return reject("GOALS_POST_ONLY",405,origin);
    if(!configured)return reject("GOALS_BROWSER_NOT_CONFIGURED",503,origin);
    const authorization=req.headers.get("authorization")||"";
    if(!authorization.startsWith("Bearer ")||
      !safe(authorization.slice(7)))return reject("GOALS_AUTH_REQUIRED",401,origin);
    // A DB service client does not make the user authenticated. The Auth server
    // MUST validate the actual bearer; owner IDs are never read from request JSON.
    let user;
    try{user=await verifyUser(authorization.slice(7));}
    catch{return reject("GOALS_AUTH_REQUIRED",401,origin)}
    if(!user||user.id!==ownerUid||!UUID.test(user.id))
      return reject("GOALS_OWNER_DENIED",403,origin);
    let data;try{data=await bounded(req);}
    catch{return reject("GOALS_BAD_REQUEST",400,origin)}
    if(!["read","prepare","commit"].includes(data.action)||!toolNames.has(data.tool))
      return reject("GOALS_TOOL_UNKNOWN",400,origin);
    if(Object.keys(data).some(k=>!["action","tool","args","proof","approved"].includes(k)))
      return reject("GOALS_INVALID_ARGS",400,origin);
    const check=validateGoalsP5(data.tool,data.args);
    if(!check.ok)return reject(check.code,422,origin);
    const isWrite=GOALS_P5_TOOLS.find(x=>x.name===data.tool)?.annotations?.readOnlyHint!==true;
    if(!isWrite&&data.action!=="read"||isWrite&&data.action==="read")
      return reject("GOALS_ACTION_MISMATCH",400,origin);
    if(data.action==="read"){
      try{
        const payload=await executeGoalsCandidate({db,owner:user.id},
          data.tool,check.args);
        return json({ok:true,result:payload},200,origin);
      }catch{return reject("GOALS_READ_FAILED",503,origin)}
    }
    if(!UUID.test(check.args.request_id||""))
      return reject("GOALS_REQUEST_ID_REQUIRED",422,origin);
    const hash=await digest({owner:user.id,tool:data.tool,args:check.args});
    if(data.action==="prepare"){
      const issued=clock(),expires=issued+180000;
      const claim={o:user.id,t:data.tool,h:hash,r:check.args.request_id,
        i:issued,e:expires};
      const encoded=b64(textEncoder.encode(JSON.stringify(claim)));
      const signed=await mac(secret,encoded);
      return json({ok:true,expiresAt:expires,proof:encoded+"."+signed,
        requiresExplicitConfirmation:true},200,origin);
    }
    if(data.approved!==true||!safe(data.proof))
      return reject("GOALS_EXPLICIT_APPROVAL_REQUIRED",403,origin);
    let claim;
    try{
      const parts=data.proof.split(".");
      if(parts.length!==2)return reject("GOALS_APPROVAL_INVALID",403,origin);
      const expected=await mac(secret,parts[0]);
      if(!timingEqual(expected,parts[1]))return reject("GOALS_APPROVAL_INVALID",403,origin);
      claim=JSON.parse(new TextDecoder().decode(from64(parts[0])));
    }catch{return reject("GOALS_APPROVAL_INVALID",403,origin)}
    const current=clock();
    if(!object(claim)||claim.o!==user.id||claim.t!==data.tool||
      claim.r!==check.args.request_id||claim.h!==hash||
      !Number.isSafeInteger(claim.i)||!Number.isSafeInteger(claim.e)||
      claim.e-claim.i!==180000||current<claim.i-30000||current>claim.e)
      return reject("GOALS_APPROVAL_INVALID",403,origin);
    try{
      const result=await executeGoalsCandidate({db,owner:user.id,
        approvedWrite:true},data.tool,check.args);
      return json({ok:true,result},200,origin);
    }catch(error){
      const allowed=new Set(["GOALS_VERSION_CONFLICT","GOALS_DUPLICATE_REQUEST",
        "GOALS_NOT_FOUND","GOALS_ACCOUNT_NOT_OWNED","GOALS_RESERVE_NOT_RELEASED",
        "GOALS_KIND_IMMUTABLE","GOALS_FUND_SCOPE_IMMUTABLE",
        "GOALS_INVALID_ALLOCATION","GOAL_SOURCE_ALREADY_ALLOCATED",
        "GOAL_RELEASE_EXCEEDS_RESERVE","GOALS_UNBALANCED"]);
      const code=allowed.has(error?.code)?error.code:"GOALS_WRITE_FAILED";
      return reject(code,409,origin);
    }
  }
  return Object.freeze({handle,configured});
}
