// Candidate only: CAD entity read tools for the private Site relay.
// NOT advertised or deployed until matching WASM runtime, SQL, Edge and Site are ready.
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const object=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const keysAllowed=(o,allowed)=>Object.keys(o).every(k=>allowed.includes(k));
const err=code=>({ok:false,code});
export const ENTITY_READ_TOOLS=Object.freeze([
  {name:"cad_inspect_drawing",description:"Queue bounded read-only geometry overview for an authorized open CAD session. Does not read a DXF file. Use cad_read_job for the result.",inputSchema:{type:"object",properties:{session_id:{type:"string",format:"uuid"},request_id:{type:"string",format:"uuid"}},required:["session_id","request_id"],additionalProperties:false}},
  {name:"cad_list_entities",description:"Queue a read-only list of at most 8 native CAD entities, limited to simple numeric geometry. Use cad_read_job for the result.",inputSchema:{type:"object",properties:{session_id:{type:"string",format:"uuid"},request_id:{type:"string",format:"uuid"},limit:{type:"integer",minimum:1,maximum:8},offset:{type:"integer",minimum:0,maximum:10000},type:{type:"string",maxLength:32},layer:{type:"string",maxLength:80},selected:{type:"boolean"}},required:["session_id","request_id"],additionalProperties:false}},
  {name:"cad_read_job",description:"Read the result of a previous read-only inspect/list job; never returns binary CAD files.",inputSchema:{type:"object",properties:{job_id:{type:"string",format:"uuid"}},required:["job_id"],additionalProperties:false}}
]);
const short=(v,n)=>typeof v==="string"&&v.length>0&&v.length<=n&&!/\u0000|[\u0000-\u001f]/.test(v);
export function validateEntityReadTool(name,args){
 if(!object(args))return err("CAD_READ_INVALID_ARGS");
 let size;
 try{size=JSON.stringify(args).length}catch{return err("CAD_READ_INVALID_ARGS")}
 if(size>2048)return err("CAD_READ_TOO_LARGE");
 if(name==="cad_read_job"){
  if(!keysAllowed(args,["job_id"])||Object.keys(args).length!==1||typeof args.job_id!=="string"||!ID.test(args.job_id))return err("CAD_READ_INVALID_JOB");
  return {ok:true,job_id:args.job_id};
 }
 if(name!=="cad_inspect_drawing"&&name!=="cad_list_entities")return err("UNKNOWN_CAD_READ_TOOL");
 if(!short(args.session_id,36)||!ID.test(args.session_id)||!short(args.request_id,36)||!ID.test(args.request_id))return err("CAD_READ_INVALID_SESSION");
 const params={};
 if(name==="cad_inspect_drawing"){
  if(!keysAllowed(args,["session_id","request_id"])||Object.keys(args).length!==2)return err("CAD_READ_INVALID_ARGS");
 }else{
  if(!keysAllowed(args,["session_id","request_id","limit","offset","type","layer","selected"]))return err("CAD_READ_INVALID_ARGS");
  if(args.limit!==undefined&&(!Number.isInteger(args.limit)||args.limit<1||args.limit>8))return err("CAD_READ_INVALID_LIMIT");
  if(args.offset!==undefined&&(!Number.isInteger(args.offset)||args.offset<0||args.offset>10000))return err("CAD_READ_INVALID_OFFSET");
  for(const k of ["type","layer"]){
   if(args[k]!==undefined&&!short(args[k],k==="type"?32:80))return err("CAD_READ_INVALID_FILTER");
  }
  if(args.selected!==undefined&&typeof args.selected!=="boolean")return err("CAD_READ_INVALID_FILTER");
  Object.assign(params,{limit:args.limit??8,offset:args.offset??0});
  for(const k of ["type","layer","selected"])if(args[k]!==undefined)params[k]=args[k];
 }
 return {ok:true,session_id:args.session_id,request_id:args.request_id,
  command:name==="cad_inspect_drawing"?"lizhi.inspect":"lizhi.entities",params};
}
const finite=v=>typeof v==="number"&&Number.isFinite(v)&&Math.abs(v)<=1e6;
const integer=(v,max=10000000)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const sane=s=>typeof s==="string"&&s.length<=80&&!/[\u0000-\u001f]/.test(s)?s:"";
const cleanScalar=v=>finite(v)?v:typeof v==="boolean"?v:undefined;
const COORD_KEYS=new Set(["x","y","z","start","end","center","radius","diameter","points","vertices","closed","bulge","startAngle","endAngle","angle","min","max","width","height","a","b","p","const_width","elevation","plinegen","pt","start_width","end_width"]);
const NATIVE_TYPES=new Set(["line","circle","arc","lwPolyline","polyline3d"]);
function cleanGeometry(data,depth=0){
 if(depth>4)return undefined;
 const scalar=cleanScalar(data);if(scalar!==undefined)return scalar;
 if(Array.isArray(data)){
  if(data.length>64)return undefined;
  const value=data.map(v=>cleanGeometry(v,depth+1));return value.every(x=>x!==undefined)?value:undefined;
 }
 if(object(data)){
  if(Object.keys(data).length>12)return undefined;
  const clean={};
  for(const [k,v] of Object.entries(data)){
   if(k==="type"){
    if(typeof v!=="string"||!NATIVE_TYPES.has(v))return undefined;
    clean.type=v;
    continue;
   }
   if(!COORD_KEYS.has(k))return undefined;
   const item=cleanGeometry(v,depth+1);
   if(item===undefined)return undefined;
   clean[k]=item;
  }
  return clean;
 }
 return undefined;
}
export function projectEntityReadReceipt(job){
 if(!object(job))return err("CAD_READ_INVALID_RECEIPT");
 const state=job.state;
 if(!["queued","claimed","succeeded","failed","cancelled","expired"].includes(state))
  return err("CAD_READ_INVALID_RECEIPT");
 const kind=job.kind;
 if(!["lizhi.inspect","lizhi.entities"].includes(kind))
  return err("CAD_READ_NOT_A_READ_JOB");
 const receipt={ok:true,job_id:typeof job.job_id==="string"&&ID.test(job.job_id)?job.job_id:null,
   kind,state,completed:state==="succeeded",automaticRetryAllowed:false};
 if(state!=="succeeded"){
  if(state==="failed")receipt.error="CAD_READ_FAILED";
  return receipt;
 }
 const raw=job.data;
 if(!object(raw)||JSON.stringify(raw).length>3500)return err("CAD_READ_INVALID_RESULT");
 if(!integer(raw.revision,Number.MAX_SAFE_INTEGER))return err("CAD_READ_INVALID_RESULT");
 if(kind==="lizhi.inspect"){
  const data={revision:raw.revision};
  for(const k of ["entityCount","selectionCount"]){
   if(integer(raw[k]))data[k]=raw[k];
  }
  if(typeof raw.dirty==="boolean")data.dirty=raw.dirty;
  if(typeof raw.currentLayer==="string")data.currentLayer=sane(raw.currentLayer);
  if(object(raw.counts)){
   const counts={};
   for(const [k,v] of Object.entries(raw.counts).slice(0,20)){
    if(/^[A-Za-z_][A-Za-z0-9_-]{0,31}$/.test(k)&&integer(v))counts[k]=v;
   }
   data.counts=counts;
  }
  const extents=cleanGeometry(raw.extents);
  if(extents!==undefined&&JSON.stringify(extents).length<=400)data.extents=extents;
  return {...receipt,data};
 }
 if(!Array.isArray(raw.entities)||raw.entities.length>8)return err("CAD_READ_INVALID_RESULT");
 const entities=[];
 for(const entity of raw.entities){
  if(!object(entity)||!short(entity.handle,16)||!/^[0-9a-f]{1,16}$/i.test(entity.handle))return err("CAD_READ_INVALID_RESULT");
  const row={handle:entity.handle,type:sane(entity.type).slice(0,32),layer:sane(entity.layer),
    geometryAvailable:false};
  const g=cleanGeometry(entity.geometry);
  if(g!==undefined&&JSON.stringify(g).length<=640){row.geometry=g;row.geometryAvailable=true;}
  entities.push(row);
 }
 const data={revision:raw.revision,entities,returned:entities.length};
 if(integer(raw.count))data.count=raw.count;
 if(integer(raw.offset,10000))data.offset=raw.offset;
 if(typeof raw.hasMore==="boolean")data.hasMore=raw.hasMore;
 return {...receipt,data};
}
