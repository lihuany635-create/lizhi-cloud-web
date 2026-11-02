// 立之 CAD full command surface for the private ChatGPT Site (browser mode and cloud mode).
// Mirrors lizhi-cad apps/cadcraft-web/src/lizhi_call.rs: any of the 431 CADCraft commands,
// minus file paths, file/program loading and drawing replacement; destructive commands need
// confirm_destructive=true, set only after the owner agreed in chat.
import CAD_REGISTRY from "./cad-command-registry.json" with {type:"json"};

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const obj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const err=code=>({ok:false,code});
export const MAX_TEXT_CHARS=16384, MAX_SCRIPT_LINES=500, MAX_RENDER_SIDE=4096, MAX_CALL_BYTES=30000;
export const CAD_COMMANDS=new Map(CAD_REGISTRY.commands.map(c=>[c.id,c]));
const ALIAS=new Map();
for(const c of CAD_REGISTRY.commands)for(const a of c.aliases??[])ALIAS.set(String(a).toLowerCase(),c.id);
export const BLOCKED=new Set(["open","close","closeall","recover","drawingrecovery","xopen","appload","lisp",
 "script","plot","plotwindow","plottermanager","-plottermanager","refclose","bclose","compareclose","arrayclose","quit","exit"]);
export const DESTRUCTIVE=new Set(["new","erase","erase.selection","purge","audit","layer.delete","layerstate.delete",
 "layout.delete","style.delete","dimstyle.delete","table.deleterow","table.deletecol","-purge","overkill"]);
const OPS=["execute","cmdline","script","commands","inspect","render"];

const canonical=c=>String(c).trim().replace(/^[_.]+/,"").toLowerCase();
const resolve=c=>{const id=canonical(c);return ALIAS.get(id)??id;};
const isPathKey=k=>["path","file","filename","folder","dir","directory","template","url","output"].includes(k)||
  k.endsWith("_path")||k.endsWith("Path");
function hasPath(v,depth=0){
 if(depth>8)return true;
 if(Array.isArray(v))return v.some(x=>hasPath(x,depth+1));
 if(!obj(v))return false;
 return Object.entries(v).some(([k,x])=>(isPathKey(k)&&x!==null&&x!==undefined)||hasPath(x,depth+1));
}
export function commandRefusal(command,confirmed){
 const id=resolve(command);
 if(BLOCKED.has(id))return "CAD_COMMAND_NOT_ALLOWED_REMOTELY";
 if(DESTRUCTIVE.has(id)&&confirmed!==true)return "CAD_DESTRUCTIVE_COMMAND_REQUIRES_CONFIRMATION";
 return null;
}
function commandStarts(line){
 const out=[];let afterEmpty=true;
 for(const part of line.split(" ")){
  if(part===""){afterEmpty=true;continue}
  if(afterEmpty)out.push(part.split("{")[0]);
  afterEmpty=false;
 }
 return out;
}
function textRefusal(text,confirmed){
 if(typeof text!=="string"||text.includes("\0"))return "CAD_TEXT_INVALID";
 const lines=text.split("\n");
 if([...text].length>MAX_TEXT_CHARS||lines.length>MAX_SCRIPT_LINES)return "CAD_TEXT_TOO_LONG";
 for(const line of lines)for(const w of commandStarts(line.replace(/\r$/,""))){
  const r=commandRefusal(w,confirmed);if(r)return r;
 }
 return null;
}
const keysWithin=(o,allowed)=>Object.keys(o).every(k=>allowed.includes(k));

/** Validates one call ({op,...}); returns {ok,call} where call is what the host/worker runs. */
export function checkCadCall(call){
 if(!obj(call))return err("CAD_CALL_INVALID");
 const confirmed=call.confirmed;
 if(confirmed!==undefined&&confirmed!==true)return err("CAD_CALL_INVALID");
 if(!OPS.includes(call.op))return err("CAD_CALL_UNKNOWN_OP");
 if(hasPath(call))return err("CAD_BROWSER_HAS_NO_FILESYSTEM_PATH");
 const o=call;
 if(o.op==="execute"){
  if(!keysWithin(o,["op","command","params","confirmed"])||typeof o.command!=="string"||!o.command||o.command.length>64||
     !/^[\x21-\x7e]+$/.test(o.command)||!(o.params===undefined||o.params===null||obj(o.params)))return err("CAD_CALL_INVALID");
  if(!CAD_COMMANDS.has(resolve(o.command)))return err("CAD_UNKNOWN_COMMAND");
  const r=commandRefusal(o.command,confirmed);if(r)return err(r);
 }else if(o.op==="cmdline"||o.op==="script"){
  if(!keysWithin(o,["op","text","confirmed"]))return err("CAD_CALL_INVALID");
  const r=textRefusal(o.text,confirmed);if(r)return err(r);
 }else if(o.op==="commands"){
  if(!keysWithin(o,["op","filter"])||!(o.filter===undefined||(typeof o.filter==="string"&&o.filter.length<=64)))return err("CAD_CALL_INVALID");
 }else if(o.op==="inspect"){
  if(!keysWithin(o,["op","entities","limit"])||!(o.entities===undefined||typeof o.entities==="boolean")||
     !(o.limit===undefined||(Number.isInteger(o.limit)&&o.limit>=1&&o.limit<=2000)))return err("CAD_CALL_INVALID");
 }else if(o.op==="render"){
  if(!keysWithin(o,["op","width","height","fit","window"])||
     !["width","height"].every(k=>o[k]===undefined||(Number.isInteger(o[k])&&o[k]>=16&&o[k]<=MAX_RENDER_SIDE))||
     !(o.fit===undefined||typeof o.fit==="boolean"))return err("CAD_CALL_INVALID");
 }
 if(new TextEncoder().encode(JSON.stringify(call)).byteLength>MAX_CALL_BYTES)return err("CAD_CALL_TOO_LARGE");
 return {ok:true,call};
}

/** Builds the host/worker call from Site tool arguments. */
function callFromArgs(a){
 const call={op:a.op};
 for(const k of ["command","params","text","filter","entities","limit","width","height","fit","window"])
  if(a[k]!==undefined)call[k]=a[k];
 if(a.confirm_destructive===true)call.confirmed=true;
 return call;
}

export function cadReference(args){
 if(args.command!==undefined){
  const id=resolve(args.command);const c=CAD_COMMANDS.get(id);
  if(!c)return err("CAD_UNKNOWN_COMMAND");
  return {ok:true,command:{...c,blocked:BLOCKED.has(id),destructive:DESTRUCTIVE.has(id)}};
 }
 const q=typeof args.filter==="string"?args.filter.toLowerCase():"";
 const list=CAD_REGISTRY.commands.filter(c=>!q||c.id.includes(q)||c.label.toLowerCase().includes(q)||
   (c.aliases??[]).some(a=>String(a).toLowerCase()===q)||c.menu.toLowerCase().includes(q));
 const limit=Math.min(Number.isInteger(args.limit)?args.limit:120,431);
 return {ok:true,count:list.length,returned:Math.min(list.length,limit),source:CAD_REGISTRY.source,
  commands:list.slice(0,limit).map(c=>({id:c.id,label:c.label,aliases:c.aliases,menu:c.menu,
   ...(BLOCKED.has(c.id)?{blocked:true}:{}),...(DESTRUCTIVE.has(c.id)?{destructive:true}:{})})),
  guide:"ops: execute {command, params} (JSON form, never a dialog), cmdline {text} (like typing: `line 0,0 @10,0 @0,5 c`), "+
   "script {text}, commands {filter}, inspect {entities?, limit?}, render {width?, height?, window?} (PNG shown to you). "+
   "Read a command's params with command=<id>. Destructive commands need confirm_destructive=true only after the user agreed. "+
   "No file paths: the drawing file is handled by the page (browser mode) or the cloud worker (cloud mode)."};
}

const callProps={op:{type:"string",enum:OPS},command:{type:"string",maxLength:64},params:{type:"object"},
 text:{type:"string",maxLength:MAX_TEXT_CHARS},filter:{type:"string",maxLength:64},entities:{type:"boolean"},
 limit:{type:"integer",minimum:1,maximum:2000},width:{type:"integer",minimum:16,maximum:MAX_RENDER_SIDE},
 height:{type:"integer",minimum:16,maximum:MAX_RENDER_SIDE},fit:{type:"boolean"},
 window:{type:"array",items:{type:"array",items:{type:"number"},minItems:2,maxItems:2},minItems:2,maxItems:2},
 confirm_destructive:{type:"boolean",const:true}};
const uuid={type:"string",format:"uuid"};
const schema=(properties,required)=>({type:"object",properties,required,additionalProperties:false});
export const CAD_FULL_TOOLS=Object.freeze([
 {name:"cad_api_reference",description:"Read only, no session needed. Search the 431 CADCraft (AutoCAD-style) commands by filter, or pass command=<id> for its parameter doc. Read before cad_call / cad_cloud_call.",inputSchema:schema({filter:{type:"string",maxLength:64},command:{type:"string",maxLength:64},limit:{type:"integer",minimum:1,maximum:431}},[])},
 {name:"cad_call",description:"Queue ONE operation on the user's open, AI-enabled CAD page: execute any command with JSON params, type at the command line, run a script, list commands, inspect the drawing, or render a PNG. Destructive commands (erase, purge, new, *.delete…) need confirm_destructive=true ONLY after the user agreed in chat. Queued only: read cad_job_status for the result (renders come back as an image). Never retry an unknown write.",inputSchema:schema({session_id:uuid,request_id:uuid,...callProps},["session_id","request_id","op"])},
 {name:"cad_job_status_v2",description:"Read only. State and full result of a cad_call job: output, prompt state, revision before/after, kernel error, private file links, and the rendered PNG as an image.",inputSchema:schema({job_id:uuid},["job_id"])},
 {name:"cad_cloud_documents",description:"Read only. List the user's cloud CAD drawings (DXF files in private cloud storage, every revision kept). Cloud mode needs no open page or computer.",inputSchema:schema({},[])},
 {name:"cad_cloud_new_document",description:"Create a new empty cloud CAD drawing by name; its first cad_cloud_call writes revision 1.",inputSchema:schema({name:{type:"string",minLength:1,maxLength:80},metric:{type:"boolean"}},["name"])},
 {name:"cad_cloud_call",description:"Queue ONE operation (same ops and params as cad_call) on a cloud drawing at its current revision. A headless CADCraft worker runs it in the cloud within a few minutes, even with the user's computer off, and saves the next revision. Then poll cad_cloud_job_status; never retry an unknown write.",inputSchema:schema({document_id:uuid,revision:{type:"integer",minimum:0},request_id:uuid,...callProps},["document_id","revision","request_id","op"])},
 {name:"cad_cloud_job_status",description:"Read only. State and result of a cloud CAD job: output, new revision, private file links, rendered PNG as an image.",inputSchema:schema({job_id:uuid},["job_id"])},
]);
export const CAD_FULL_TOOL_NAMES=new Set(CAD_FULL_TOOLS.map(t=>t.name));

export function validateCadFullTool(name,args){
 if(!CAD_FULL_TOOL_NAMES.has(name))return err("UNKNOWN_CAD_TOOL");
 if(!obj(args))return err("INVALID_ARGUMENTS");
 let raw;try{raw=JSON.stringify(args)}catch{return err("INVALID_ARGUMENTS")}
 if(new TextEncoder().encode(raw).byteLength>MAX_CALL_BYTES+2048)return err("CAD_ARGUMENTS_TOO_LARGE");
 const keys=Object.keys(args);
 if(name==="cad_api_reference"){
  if(!keysWithin(args,["filter","command","limit"])||(args.filter!==undefined&&typeof args.filter!=="string")||
     (args.command!==undefined&&typeof args.command!=="string")||(args.limit!==undefined&&!Number.isInteger(args.limit)))return err("INVALID_ARGUMENTS");
  return {ok:true,kind:"reference",args};
 }
 if(name==="cad_job_status_v2"||name==="cad_cloud_job_status")
  return keys.length===1&&UUID.test(args.job_id??"")?{ok:true,kind:"read",args:{job_id:args.job_id}}:err("INVALID_JOB_ID");
 if(name==="cad_cloud_documents")return keys.length===0?{ok:true,kind:"read",args:{}}:err("INVALID_ARGUMENTS");
 if(name==="cad_cloud_new_document")
  return keysWithin(args,["name","metric"])&&typeof args.name==="string"&&args.name.trim()&&args.name.length<=80&&
   (args.metric===undefined||typeof args.metric==="boolean")?{ok:true,kind:"write",args:{name:args.name.trim(),metric:args.metric!==false}}:err("INVALID_ARGUMENTS");
 const callKeys=Object.keys(callProps);
 if(name==="cad_call"){
  if(!keysWithin(args,["session_id","request_id",...callKeys])||!UUID.test(args.session_id??"")||!UUID.test(args.request_id??""))
   return err("INVALID_CAD_SESSION_OR_REQUEST");
  const c=checkCadCall(callFromArgs(args));if(!c.ok)return c;
  return {ok:true,kind:"write",args:{session_id:args.session_id,request_id:args.request_id},command:"lizhi.call",params:c.call};
 }
 if(name==="cad_cloud_call"){
  if(!keysWithin(args,["document_id","revision","request_id",...callKeys])||!UUID.test(args.document_id??"")||
     !UUID.test(args.request_id??"")||!Number.isSafeInteger(args.revision)||args.revision<0)return err("INVALID_ARGUMENTS");
  const c=checkCadCall(callFromArgs(args));if(!c.ok)return c;
  return {ok:true,kind:"write",args:{document_id:args.document_id,revision:args.revision,request_id:args.request_id},call:c.call};
 }
 return err("UNKNOWN_CAD_TOOL");
}
