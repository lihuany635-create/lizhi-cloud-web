/**
 * Hew 3D Site tool contract (private ChatGPT Site -> Supabase Edge -> browser host).
 * The fixed box/move tools take millimetres; `model_call` speaks the Hew API
 * directly, which uses metres. `model_call` may run any method listed in
 * hew-api-registry.json (generated from lizhi-hew docs/API_REFERENCE.gen.md),
 * minus host-owned connection methods; destructive methods need explicit
 * confirmation and filesystem paths are refused (the browser host has none).
 */
import HEW_REGISTRY from "./hew-api-registry.json" with {type:"json"};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const object = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const exact = (x, required, optional=[]) =>
  object(x) && required.every(k => Object.hasOwn(x,k)) &&
  Object.keys(x).every(k => required.includes(k)||optional.includes(k));
const finite = (n,a,b) => typeof n==="number" && Number.isFinite(n) && n>=a && n<=b;
const vec3 = (v,range=100000) => Array.isArray(v)&&v.length===3&&v.every(n=>finite(n,-range,range));
const mmToM = n => n/1000;
const error = code => ({ok:false,code});
const id = x => typeof x==="string" && UUID.test(x);
const M = {type:"number",description:"Millimetres (mm)"};
const session = {type:"string",format:"uuid"};
const origin = {type:"array",minItems:3,maxItems:3,items:M,description:"XYZ coordinates in millimetres"};
const job = {type:"string",format:"uuid"};
const name = {type:"string",maxLength:80};
const entity = {type:"string",maxLength:80};
const common = {session_id:session,request_id:session};
const input = (properties,required) => ({type:"object",properties,required,additionalProperties:false});

export const HEW_METHODS = new Map(HEW_REGISTRY.methods.map(m=>[m.method,m]));
export const BLOCKED_METHODS = new Set(["hew.meta.hello","hew.doc.attach","hew.doc.focus"]);
export const DESTRUCTIVE_METHODS = new Set([
 "hew.doc.new","hew.doc.open","hew.doc.close","hew.doc.revert","hew.doc.import",
 "hew.doc.purge_unused","hew.entity.delete","hew.sketch.delete","hew.solid.delete_faces",
 "hew.solid.delete_imprint","hew.group.explode","hew.component.explode","hew.tag.delete",
 "hew.scenes.remove","hew.library.remove","hew.attr.delete","hew.guide.clear",
]);
const MAX_CALL_BYTES = 30000;
export const CLOUD_LIFECYCLE_METHODS = new Set(["hew.doc.new","hew.doc.open","hew.doc.close","hew.doc.save","hew.doc.revert","hew.doc.import"]);
const MAX_TRANSACT_COMMANDS = 200;
const METHOD = /^hew\.[a-z]+\.[a-z_]+$/;
function hasPath(v,depth=0){
 if(depth>8||!object(v))return false;
 for(const [k,x] of Object.entries(v)){
  if((k==="path"||k.endsWith("_path"))&&x!==undefined)return true;
  if(object(x)&&hasPath(x,depth+1))return true;
 }
 return false;
}
/** Server-side mirror of lizhi-hew app/src/api/lizhiModelPolicy.ts plus registry check. */
export function checkHewCall(method,params,confirmed){
 if(typeof method!=="string"||!METHOD.test(method))return error("MODEL_INVALID_METHOD");
 if(!object(params))return error("MODEL_INVALID_PARAMS");
 const named=[{method,params}];
 if(method==="hew.doc.transact"){
  const list=params.commands;
  if(!Array.isArray(list)||list.length===0||list.length>MAX_TRANSACT_COMMANDS)
   return error("MODEL_INVALID_TRANSACTION");
  for(const c of list){
   if(!object(c))return error("MODEL_INVALID_TRANSACTION");
   named.push({method:c.method,params:c.params??{}});
  }
 }
 for(let i=0;i<named.length;i++){
  const c=named[i];
  if(typeof c.method!=="string"||!METHOD.test(c.method)||!object(c.params))
   return error("MODEL_INVALID_TRANSACTION");
  const entry=HEW_METHODS.get(c.method);
  if(!entry)return error("MODEL_UNKNOWN_HEW_METHOD");
  if(BLOCKED_METHODS.has(c.method))return error("MODEL_METHOD_RESERVED_FOR_HOST");
  if(i>0&&(entry.class==="solitary"||c.method==="hew.doc.transact"))
   return error("MODEL_SOLITARY_METHOD_IN_TRANSACTION");
  if(DESTRUCTIVE_METHODS.has(c.method)&&confirmed!==true)
   return error("MODEL_DESTRUCTIVE_CALL_REQUIRES_USER_CONFIRMATION");
  if(hasPath(c.params))return error("MODEL_BROWSER_HAS_NO_FILESYSTEM_PATH");
 }
 if(method==="hew.doc.save"&&(params.return_bytes===false||params.copy===true))
  return error("MODEL_BROWSER_SAVE_RETURNS_BYTES");
 return {ok:true};
}
/** Compact or detailed registry views for model_api_reference. */
export function hewApiReference(args){
 if(args.method!==undefined){
  const m=HEW_METHODS.get(args.method);
  if(!m)return error("MODEL_UNKNOWN_HEW_METHOD");
  return {ok:true,method:{...m,destructive:DESTRUCTIVE_METHODS.has(m.method),
   allowed:!BLOCKED_METHODS.has(m.method)}};
 }
 const pick=m=>({method:m.method,class:m.class,summary:m.summary.slice(0,240),
  ...(DESTRUCTIVE_METHODS.has(m.method)?{destructive:true}:{}),
  ...(BLOCKED_METHODS.has(m.method)?{allowed:false}:{})});
 if(args.namespace!==undefined){
  const list=HEW_REGISTRY.methods.filter(m=>m.namespace===args.namespace);
  if(!list.length)return error("MODEL_UNKNOWN_HEW_NAMESPACE");
  return {ok:true,namespace:args.namespace,methods:list.map(pick)};
 }
 const namespaces={};
 for(const m of HEW_REGISTRY.methods)(namespaces[m.namespace]??=[]).push(m.method.split(".")[2]);
 return {ok:true,count:HEW_REGISTRY.count,source:HEW_REGISTRY.source,namespaces,
  units:"Hew API uses metres and right-handed +Z up. Fixed box/move tools use millimetres.",
  guide:"Read one namespace, then the full schema of a method before calling it. "+
   "Use hew.doc.transact to group several edits into one undo step, with `as` names and {\"$ref\":\"name#/field\"} between commands. "+
   "Destructive methods need confirm_destructive=true only after the user agreed in chat. "+
   "Binary results (snapshot, export, save) come back as private file links in model_job_status."};
}
export const MODEL_SITE_TOOLS = Object.freeze([
 {name:"model_status",description:"Read current explicitly authorized 3D modeling sessions. No file paths or model contents.",inputSchema:input({},[])},
 {name:"model_new_document",description:"Queue new empty model ONLY after user's explicit confirmation and only when browser host can prevent unsaved data loss. This is not completed until model_job_status says succeeded.",inputSchema:input({...common,confirm_new_document:{type:"boolean",const:true}},["session_id","request_id","confirm_new_document"])},
 {name:"model_create_box",description:"Queue one rectangular watertight box. Dimensions and origin use millimetres; not a success acknowledgment.",inputSchema:input({...common,origin_mm:origin,width_mm:M,depth_mm:M,height_mm:M,object_name:name},["session_id","request_id","origin_mm","width_mm","depth_mm","height_mm"])},
 {name:"model_move",description:"Queue a translation of exactly one stable 3D object ID; do not change another document.",inputSchema:input({...common,entity_id:entity,translation_mm:origin},["session_id","request_id","entity_id","translation_mm"])},
 {name:"model_scene",description:"Read only geometry scene summary for an explicitly authorized model session.",inputSchema:input({session_id:session},["session_id"])},
 {name:"model_job_status",description:"Read only. Verify a prior job state and read its result (Hew reply, kernel error detail, private file links, inline snapshot image). Do not retry unknown mutations.",inputSchema:input({job_id:job},["job_id"])},
 {name:"model_api_reference",description:"Read only, no session needed. Without arguments: every Hew API namespace and method name. With namespace: its methods and summaries. With method: the full params/result schema and refusals. Read before using model_call.",inputSchema:input({namespace:{type:"string",maxLength:40},method:{type:"string",maxLength:80}},[])},
 {name:"model_call",description:"Queue ONE Hew API call (any method from model_api_reference, e.g. hew.solid.push_pull, hew.solid.follow_me, hew.sketch.offset, hew.component.place, hew.scenes.add, hew.material.paint, hew.view.snapshot, hew.doc.export) against the user's authorized open model. Params follow the method's schema in metres. Wrap multi-step edits in hew.doc.transact. Destructive methods (delete, new/open/close/revert/import document, explode, purge) need confirm_destructive=true ONLY after the user explicitly agreed in chat. Queued only: read model_job_status for the result; never retry an unknown write.",inputSchema:input({...common,method:{type:"string",maxLength:80,pattern:"^hew\\.[a-z]+\\.[a-z_]+$"},params:{type:"object"},confirm_destructive:{type:"boolean",const:true}},["session_id","request_id","method"])},
 {name:"model_cloud_documents",description:"Read only. List the user's cloud 3D documents (real .hew files kept in private cloud storage, every revision kept). Cloud mode needs no open browser or computer.",inputSchema:input({},[])},
 {name:"model_cloud_new_document",description:"Create a new empty cloud 3D document by name. Its first model_cloud_call writes revision 1.",inputSchema:input({name:{type:"string",minLength:1,maxLength:80}},["name"])},
 {name:"model_cloud_call",description:"Queue ONE Hew API call (same methods and params as model_call, metres) against a cloud document at its current revision. A headless Hew worker runs it in the cloud within a few minutes, even with the user's computer off, and writes the next revision. Document lifecycle methods (new/open/close/save/revert/import) are not allowed here. Destructive methods need confirm_destructive=true only after the user agreed in chat. Then poll model_cloud_job_status; never retry an unknown write.",inputSchema:input({document_id:session,revision:{type:"integer",minimum:0},request_id:session,method:{type:"string",maxLength:80,pattern:"^hew\\.[a-z]+\\.[a-z_]+$"},params:{type:"object"},confirm_destructive:{type:"boolean",const:true}},["document_id","revision","request_id","method"])},
 {name:"model_cloud_job_status",description:"Read only. State and result of a cloud job: Hew reply or kernel error, new revision, private file links, inline snapshot image.",inputSchema:input({job_id:job},["job_id"])}
]);
export function validateModelSiteTool(tool,args){
 if(!MODEL_SITE_TOOLS.some(t=>t.name===tool))return error("UNKNOWN_MODEL_TOOL");
 if(!object(args))return error("INVALID_ARGUMENTS");
 let raw;try{raw=JSON.stringify(args)}catch{return error("INVALID_ARGUMENTS")}
 if(!raw||new TextEncoder().encode(raw).byteLength>32768)return error("MODEL_ARGUMENTS_TOO_LARGE");
 if(tool==="model_status")return exact(args,[])?{ok:true,kind:"read",args:{}}:error("INVALID_ARGUMENTS");
 if(tool==="model_job_status")return exact(args,["job_id"])&&id(args.job_id)
   ?{ok:true,kind:"read",args:{job_id:args.job_id}}:error("INVALID_JOB_ID");
 if(tool==="model_cloud_documents")return exact(args,[])?{ok:true,kind:"cloud_read",args:{}}:error("INVALID_ARGUMENTS");
 if(tool==="model_cloud_job_status")return exact(args,["job_id"])&&id(args.job_id)
   ?{ok:true,kind:"cloud_read",args:{job_id:args.job_id}}:error("INVALID_JOB_ID");
 if(tool==="model_cloud_new_document")
   return exact(args,["name"])&&typeof args.name==="string"&&args.name.trim().length>0&&args.name.length<=80
     ?{ok:true,kind:"cloud_write",args:{name:args.name.trim()}}:error("INVALID_ARGUMENTS");
 if(tool==="model_cloud_call"){
   if(!exact(args,["document_id","revision","request_id","method"],["params","confirm_destructive"])||
      !id(args.document_id)||!id(args.request_id)||!Number.isSafeInteger(args.revision)||args.revision<0||
      (args.confirm_destructive!==undefined&&args.confirm_destructive!==true))
     return error("INVALID_ARGUMENTS");
   if(CLOUD_LIFECYCLE_METHODS.has(args.method))return error("MODEL_CLOUD_WORKER_OWNS_DOCUMENT_LIFECYCLE");
   const params=args.params===undefined?{}:args.params;
   const checked=checkHewCall(args.method,params,args.confirm_destructive);
   if(!checked.ok)return checked;
   if(new TextEncoder().encode(JSON.stringify(params)).byteLength>MAX_CALL_BYTES)return error("MODEL_CALL_TOO_LARGE");
   return {ok:true,kind:"cloud_write",args:{document_id:args.document_id,revision:args.revision,
     request_id:args.request_id,method:args.method,params,confirmed:args.confirm_destructive===true}};
 }
 if(tool==="model_api_reference"){
   if(!exact(args,[],["namespace","method"])||
      (args.namespace!==undefined&&(typeof args.namespace!=="string"||!/^[a-z]{1,40}$/.test(args.namespace)))||
      (args.method!==undefined&&(typeof args.method!=="string"||!METHOD.test(args.method))))
     return error("INVALID_ARGUMENTS");
   return {ok:true,kind:"reference",args:{...args}};
 }
 if(!id(args.session_id))return error("INVALID_SESSION_ID");
 if(tool==="model_scene")return exact(args,["session_id"]) ? {ok:true,kind:"read",args:{session_id:args.session_id}} : error("INVALID_ARGUMENTS");
 if(!id(args.request_id))return error("INVALID_REQUEST_ID");
 const base={session_id:args.session_id,request_id:args.request_id};
 if(tool==="model_call"){
   if(!exact(args,["session_id","request_id","method"],["params","confirm_destructive"])||
      (args.confirm_destructive!==undefined&&args.confirm_destructive!==true))
     return error("INVALID_ARGUMENTS");
   const params=args.params===undefined?{}:args.params;
   const checked=checkHewCall(args.method,params,args.confirm_destructive);
   if(!checked.ok)return checked;
   let finalParams=params;
   if(args.method==="hew.doc.save")finalParams={...params,return_bytes:true};
   const job={method:args.method,params:finalParams,
     ...(args.confirm_destructive===true?{confirmed:true}:{})};
   if(new TextEncoder().encode(JSON.stringify(job)).byteLength>MAX_CALL_BYTES)
     return error("MODEL_CALL_TOO_LARGE");
   const entry=HEW_METHODS.get(args.method);
   return {ok:true,kind:"write",args:base,command:"call",params:job,
     readOnly:entry.class==="read-only"};
 }
 if(tool==="model_new_document"){
   if(!exact(args,["session_id","request_id","confirm_new_document"])||args.confirm_new_document!==true)
     return error("NEW_DOCUMENT_REQUIRES_CONFIRMATION");
   return {ok:true,kind:"write",args:base,command:"new_document",params:{confirm_new_document:true}};
 }
 if(tool==="model_create_box"){
   if(!exact(args,["session_id","request_id","origin_mm","width_mm","depth_mm","height_mm"],["object_name"])||
      !vec3(args.origin_mm)||!finite(args.width_mm,0.1,20000)||
      !finite(args.depth_mm,0.1,20000)||!finite(args.height_mm,0.1,20000)||
      (Object.hasOwn(args,"object_name")&&(typeof args.object_name!=="string"||args.object_name.trim().length===0||args.object_name.length>80)))
      return error("INVALID_MODEL_GEOMETRY");
   const [x,y,z]=args.origin_mm.map(mmToM);
   const w=mmToM(args.width_mm),d=mmToM(args.depth_mm),h=mmToM(args.height_mm);
   return {ok:true,kind:"write",args:base,command:"create_box",params:{
     origin_m:[x,y,z],size_m:[w,d,h],name:args.object_name??"Box"
   }};
 }
 if(tool==="model_move"){
   if(!exact(args,["session_id","request_id","entity_id","translation_mm"])||
     typeof args.entity_id!=="string"||!/^[a-z][a-z0-9_-]{0,79}$/i.test(args.entity_id)||
     !vec3(args.translation_mm)||args.translation_mm.every(n=>n===0))return error("INVALID_MODEL_MOVE");
   return {ok:true,kind:"write",args:base,command:"move",params:{
     entity_id:args.entity_id,translation_m:args.translation_mm.map(mmToM)}};
 }
 return error("INVALID_ARGUMENTS");
}
/**
 * Pure adapter for a future authorized Hew host. Returns only official JSON-RPC
 * envelopes; NOT suitable for direct untrusted web invocation. The host must
 * verify document/session/version/permission before dispatch and persist job ACK.
 */
export function toHewJsonRpc(validated,requestId=1){
 if(!validated?.ok||validated.kind!=="write")throw Error("VALIDATED_WRITE_REQUIRED");
 let method,params;
 if(validated.command==="create_box"){
   const [x,y,z]=validated.params.origin_m;
   const [w,d,h]=validated.params.size_m;
   method="hew.doc.transact";
   params={label:"AI: create box",commands:[
    {method:"hew.sketch.draw_rect",as:"base",params:{
      plane:{origin:[x,y,z],normal:[0,0,1]},corner_a:[x,y,z],corner_b:[x+w,y+d,z]}},
    {method:"hew.solid.extrude",as:"solid",params:{region:{"$ref":"base#/region_id"},distance:h}},
    {method:"hew.entity.rename",params:{id:{"$ref":"solid#/object_id"},name:validated.params.name}}
   ]};
 }else if(validated.command==="move"){
   method="hew.doc.transact";
   params={label:"AI: move object",commands:[
    {method:"hew.entity.move",params:{ids:[validated.params.entity_id],translation:validated.params.translation_m}}
   ]};
 }else if(validated.command==="new_document"){
   // Deliberately not bridged: web host needs unsaved-document guard first.
   throw Error("BROWSER_DOCUMENT_LIFECYCLE_NOT_IMPLEMENTED");
 }else throw Error("UNSUPPORTED_HEW_MUTATION");
 return {jsonrpc:"2.0",id:requestId,method,params};
}
