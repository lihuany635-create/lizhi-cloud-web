// P6 goals browser bridge (security repair candidate).
// Owner-authorized planning writes (never bank transfers) need a valid live
// first-party owner session and current allowlist. Per-write passkey is NOT
// required by the owner; use CAS, request_id and service-only write RPCs.
// This reduces resistance to stolen owner credentials; never treat a caller-
// supplied approval flag, Origin, or client_id OAuth token as authorization.
import {executeGoalsCandidate} from "./finance-goals-p5-edge.mjs";
import {validateGoalsP5,GOALS_P5_TOOLS} from "./finance-goals-p5-contract.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEAD={"cache-control":"private, no-store","pragma":"no-cache",
 "x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
const names=new Map(GOALS_P5_TOOLS.map(t=>[t.name,t]));
const json=(value,status=200,origin=null)=>Response.json(value,{status,
 headers:{...HEAD,...origin?{"access-control-allow-origin":origin,"vary":"Origin"}:{}}});
const reject=(code,status=400,origin=null)=>json({ok:false,code},status,origin);
const record=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
async function bounded(req,max=8192){
 const len=req.headers.get("content-length");
 if(len!==null&&(!/^\d+$/.test(len)||Number(len)>max))throw Error("TOO_LARGE");
 if(!req.body)throw Error("NO_BODY");
 const reader=req.body.getReader(),chunks=[];let size=0;
 try{for(;;){
   const {done,value}=await reader.read();if(done)break;
   if(value){size+=value.byteLength;if(size>max)throw Error("TOO_LARGE");chunks.push(value);}
 }}finally{try{await reader.cancel()}catch{}}
 const data=new Uint8Array(size);let offset=0;
 for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength}
 const body=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(data));
 if(!record(body))throw Error("BAD_BODY");
 return body;
}
/** @param {{db?:any,verifyUser?:(jwt:string)=>Promise<any>|any,ownerUid?:string,origins?:string[],writesEnabled?:boolean}} options */
export function createGoalsBrowserBridge({db,verifyUser,ownerUid,origins=[],writesEnabled=false}={}){
 const allowed=new Set(origins.filter(x=>typeof x==="string"&&
  /^https:\/\/[a-z0-9.-]+(?::\d{1,5})?$/i.test(x)));
 const configured=Boolean(db?.rpc&&typeof verifyUser==="function"&&
  UUID.test(ownerUid||"")&&allowed.size);
 async function handle(req){
  const origin=req.headers.get("origin");
  if(!origin||!allowed.has(origin))return reject("GOALS_ORIGIN_DENIED",403);
  const cors={"access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS",
   "access-control-allow-headers":"authorization, content-type",
   "vary":"Origin","cache-control":"private, no-store"};
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  if(req.method!=="POST")return reject("GOALS_POST_ONLY",405,origin);
  if(!configured)return reject("GOALS_BROWSER_NOT_CONFIGURED",503,origin);
  const authorization=req.headers.get("authorization")||"";
  if(!authorization.startsWith("Bearer ")||
   authorization.length>4103||authorization.length<=7)
   return reject("GOALS_AUTH_REQUIRED",401,origin);
  // verifyUser MUST validate token with Supabase Auth and independently
  // validate first-party session, owner and current allowlist on the server.
  let user;
  try{user=await verifyUser(authorization.slice(7))}
  catch{return reject("GOALS_AUTH_REQUIRED",401,origin)}
  if(!user||user.id!==ownerUid||!UUID.test(user.id)||
   user.firstParty!==true||user.allowlisted!==true)
   return reject("GOALS_OWNER_DENIED",403,origin);
  let data;
  try{data=await bounded(req)}
  catch{return reject("GOALS_BAD_REQUEST",400,origin)}
  // Reject legacy prepare/commit and any model-supplied approval fields.
  if(!["read","write"].includes(data.action)||!names.has(data.tool)||
     Object.keys(data).some(k=>!["action","tool","args"].includes(k)))
     return reject("GOALS_INVALID_ARGS",400,origin);
  const tool=names.get(data.tool);
  const write=tool?.annotations?.readOnlyHint!==true;
  if(write!==(data.action==="write"))
    return reject("GOALS_ACTION_MISMATCH",400,origin);
  if(write&&writesEnabled!==true)
    return reject("GOALS_WRITES_DISABLED",403,origin);
  const checked=validateGoalsP5(data.tool,data.args);
  if(!checked.ok)return reject(checked.code,422,origin);
  try{
   const payload=await executeGoalsCandidate({
     db,owner:user.id,approvedWrite:write&&writesEnabled===true
   },data.tool,checked.args);
   return json({ok:true,result:payload},200,origin);
  }catch(error){
   const allowed=new Set([
    "GOALS_VERSION_CONFLICT","GOALS_DUPLICATE_REQUEST","GOALS_NOT_FOUND",
    "GOALS_ACCOUNT_NOT_OWNED","GOALS_RESERVE_NOT_RELEASED",
    "GOALS_KIND_IMMUTABLE","GOALS_FUND_SCOPE_IMMUTABLE",
    "GOALS_INVALID_ALLOCATION","GOAL_SOURCE_ALREADY_ALLOCATED",
    "GOAL_RESERVE_EXCEEDS_TARGET","GOAL_RELEASE_EXCEEDS_RESERVE",
    "GOAL_RELEASE_SOURCE_INVALID","GOALS_UNBALANCED",
    "GOALS_INVALID_ARGS","GOALS_INVALID_GOAL","GOALS_INVALID_LINES"
   ]);
   if(write&&allowed.has(error?.code))
     return reject(error.code,409,origin);
   return reject(write?"GOALS_WRITE_FAILED":"GOALS_READ_FAILED",503,origin);
  }
 }
 return Object.freeze({handle,configured,writeEnabled:writesEnabled===true});
}
