// P6 goals browser bridge (security repair candidate).
// All remote mutations are explicitly disabled until a real server-verifiable
// WebAuthn/reauthentication factor and atomic one-time approval receipt exist.
// JWT possession, client-side confirm(), Origin, approved=true and HMAC alone
// are NOT evidence of a human approving an exact financial mutation.
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
export function createGoalsBrowserBridge({db,verifyUser,ownerUid,origins=[]}={}){
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
  if(!["read","prepare","commit"].includes(data.action)||!names.has(data.tool)||
   Object.keys(data).some(k=>!["action","tool","args","proof","approved"].includes(k)))
   return reject("GOALS_INVALID_ARGS",400,origin);
  const tool=names.get(data.tool);
  const isWrite=tool?.annotations?.readOnlyHint!==true;
  // Server-side hard stop: no matter what proof or flags a caller sends,
  // NO goals writes may reach the database until independent human proof exists.
  if(data.action!=="read"||isWrite)
   return reject("GOALS_HUMAN_APPROVAL_NOT_CONFIGURED",403,origin);
  if(data.proof!==undefined||data.approved!==undefined)
   return reject("GOALS_INVALID_ARGS",400,origin);
  const checked=validateGoalsP5(data.tool,data.args);
  if(!checked.ok)return reject(checked.code,422,origin);
  try{
   const payload=await executeGoalsCandidate({db,owner:user.id},
    data.tool,checked.args);
   return json({ok:true,result:payload},200,origin);
  }catch{return reject("GOALS_READ_FAILED",503,origin)}
 }
 return Object.freeze({handle,configured,writeEnabled:false});
}
