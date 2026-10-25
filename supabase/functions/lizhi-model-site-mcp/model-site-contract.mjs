/**
 * Draft Hew 3D Site tool contract. Independent gateway; NOT a deployed MCP server.
 * Dimensions and offsets at the ChatGPT boundary are millimetres; Hew API uses metres.
 * No filesystem paths, arbitrary Hew methods, eval/script, exports or destructive actions.
 * Pin Hew upstream implementation: hew3d/hew@f7734a5dfa262c03822d0eae918206705223e6b3.
 */
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
export const MODEL_SITE_TOOLS = Object.freeze([
 {name:"model_status",description:"Read current explicitly authorized 3D modeling sessions. No file paths or model contents.",inputSchema:input({},[])},
 {name:"model_new_document",description:"Queue new empty model ONLY after user's explicit confirmation and only when browser host can prevent unsaved data loss. This is not completed until model_job_status says succeeded.",inputSchema:input({...common,confirm_new_document:{type:"boolean",const:true}},["session_id","request_id","confirm_new_document"])},
 {name:"model_create_box",description:"Queue one rectangular watertight box. Dimensions and origin use millimetres; not a success acknowledgment.",inputSchema:input({...common,origin_mm:origin,width_mm:M,depth_mm:M,height_mm:M,object_name:name},["session_id","request_id","origin_mm","width_mm","depth_mm","height_mm"])},
 {name:"model_move",description:"Queue a translation of exactly one stable 3D object ID; do not change another document.",inputSchema:input({...common,entity_id:entity,translation_mm:origin},["session_id","request_id","entity_id","translation_mm"])},
 {name:"model_scene",description:"Read only geometry scene summary for an explicitly authorized model session.",inputSchema:input({session_id:session},["session_id"])},
 {name:"model_job_status",description:"Read only. Verify a prior job state; do not retry unknown mutations.",inputSchema:input({job_id:job},["job_id"])}
]);
export function validateModelSiteTool(tool,args){
 if(!MODEL_SITE_TOOLS.some(t=>t.name===tool))return error("UNKNOWN_MODEL_TOOL");
 if(!object(args))return error("INVALID_ARGUMENTS");
 let raw;try{raw=JSON.stringify(args)}catch{return error("INVALID_ARGUMENTS")}
 if(!raw||new TextEncoder().encode(raw).byteLength>8192)return error("MODEL_ARGUMENTS_TOO_LARGE");
 if(tool==="model_status")return exact(args,[])?{ok:true,kind:"read",args:{}}:error("INVALID_ARGUMENTS");
 if(tool==="model_job_status")return exact(args,["job_id"])&&id(args.job_id)
   ?{ok:true,kind:"read",args:{job_id:args.job_id}}:error("INVALID_JOB_ID");
 if(!id(args.session_id))return error("INVALID_SESSION_ID");
 if(tool==="model_scene")return exact(args,["session_id"]) ? {ok:true,kind:"read",args:{session_id:args.session_id}} : error("INVALID_ARGUMENTS");
 if(!id(args.request_id))return error("INVALID_REQUEST_ID");
 const base={session_id:args.session_id,request_id:args.request_id};
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
