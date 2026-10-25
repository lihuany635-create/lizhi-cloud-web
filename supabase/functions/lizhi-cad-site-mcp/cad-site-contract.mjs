// Strict shared contract for the private Sites CAD tool gateway.
// Pure JS: reusable by Deno Edge and the PRIVATE Sites server adapter.
export const SITE_CAD_ENDPOINT="https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-cad-site-mcp";
const ID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const names=new Set(["cad_status","cad_draw_rectangle","cad_draw_line","cad_draw_circle","cad_new_drawing","cad_job_status","cad_inspect_drawing","cad_list_entities"]);
export const CAD_SITE_TOOLS=[
  {name:"cad_status",description:"Check the owner's explicitly enabled and online CAD sessions. Read only; no DXF or screenshots.",inputSchema:{type:"object",properties:{},additionalProperties:false}},
  {name:"cad_draw_rectangle",description:"Queue one rectangle in an explicitly enabled CAD page. This is NOT a save confirmation. Query cad_job_status before saying drawn.",inputSchema:{type:"object",properties:{session_id:{type:"string",format:"uuid"},p1:{type:"array",items:{type:"number"},minItems:2,maxItems:2},p2:{type:"array",items:{type:"number"},minItems:2,maxItems:2},request_id:{type:"string",format:"uuid"}},required:["session_id","p1","p2","request_id"],additionalProperties:false}},
  {name:"cad_draw_line",description:"Queue one bounded polyline (2-64 2D points) in an approved online CAD session.",inputSchema:{type:"object",properties:{session_id:{type:"string",format:"uuid"},points:{type:"array",items:{type:"array",items:{type:"number"},minItems:2,maxItems:2},minItems:2,maxItems:64},closed:{type:"boolean"},request_id:{type:"string",format:"uuid"}},required:["session_id","points","request_id"],additionalProperties:false}},
  {name:"cad_draw_circle",description:"Queue circle with positive radius in the current drawing units.",inputSchema:{type:"object",properties:{session_id:{type:"string",format:"uuid"},center:{type:"array",items:{type:"number"},minItems:2,maxItems:2},radius:{type:"number",exclusiveMinimum:0,maximum:1000000},request_id:{type:"string",format:"uuid"}},required:["session_id","center","radius","request_id"],additionalProperties:false}},
  {name:"cad_new_drawing",description:"May replace the current drawing. Refuses unsaved existing drawing in browser. Do not invoke without explicit user intent.",inputSchema:{type:"object",properties:{session_id:{type:"string",format:"uuid"},metric:{type:"boolean"},request_id:{type:"string",format:"uuid"}},required:["session_id","request_id"],additionalProperties:false}},
  {name:"cad_inspect_drawing",description:"Queue a strictly bounded read-only native drawing summary; query cad_job_status for completed result. Never exposes DXF or local path.",inputSchema:{type:"object",properties:{session_id:{type:"string",format:"uuid"},request_id:{type:"string",format:"uuid"}},required:["session_id","request_id"],additionalProperties:false}},
  {name:"cad_list_entities",description:"Queue a read-only page of at most 8 native CAD entity handles and bounded geometry. This is NOT a screenshot, save, selection or mutation.",inputSchema:{type:"object",properties:{session_id:{type:"string",format:"uuid"},request_id:{type:"string",format:"uuid"},type:{type:"string",maxLength:32},layer:{type:"string",maxLength:80},selected:{type:"boolean"},limit:{type:"integer",minimum:1,maximum:8},offset:{type:"integer",minimum:0,maximum:10000}},required:["session_id","request_id"],additionalProperties:false}},
  {name:"cad_job_status",description:"Read only. Confirm whether a prior job is queued, claimed, succeeded, failed, cancelled or expired.",inputSchema:{type:"object",properties:{job_id:{type:"string",format:"uuid"}},required:["job_id"],additionalProperties:false}}
];
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const point=x=>Array.isArray(x)&&x.length===2&&x.every(n=>typeof n==="number"&&Number.isFinite(n)&&Math.abs(n)<=1000000);
const own=(o,k)=>Object.hasOwn(o,k);
export function validateCadSiteTool(name,args) {
  if(!names.has(name))return {ok:false,code:"UNKNOWN_CAD_TOOL"};
  if(!object(args))return {ok:false,code:"INVALID_ARGUMENTS"};
  if(JSON.stringify(args).length>8192)return {ok:false,code:"CAD_ARGUMENTS_TOO_LARGE"};
  const keys=Object.keys(args);
  const allowed=(...arr)=>keys.every(k=>arr.includes(k));
  if(name==="cad_status")return keys.length===0?{ok:true,args:{}}:{ok:false,code:"INVALID_ARGUMENTS"};
  if(name==="cad_job_status")
    return allowed("job_id")&&keys.length===1&&typeof args.job_id==="string"&&ID_RE.test(args.job_id)?
    {ok:true,args:{job_id:args.job_id}}:{ok:false,code:"INVALID_JOB_ID"};
  const sid=args.session_id,req=args.request_id;
  if(!allowed("session_id","request_id","p1","p2","points","closed","center","radius","metric","type","layer","selected","limit","offset")||
     typeof sid!=="string"||!ID_RE.test(sid)||typeof req!=="string"||!ID_RE.test(req))
    return {ok:false,code:"INVALID_CAD_SESSION_OR_REQUEST"};
  const base={session_id:sid,request_id:req};
  if(name==="cad_inspect_drawing"&&keys.length===2)
    return {ok:true,args:base,command:"lizhi.inspect",params:{}};
  if(name==="cad_list_entities"){
    if(!allowed("session_id","request_id","type","layer","selected","limit","offset")||
       (own(args,"type")&&(typeof args.type!=="string"||args.type.length>32||args.type.includes("\\0")))||
       (own(args,"layer")&&(typeof args.layer!=="string"||args.layer.length>80||args.layer.includes("\\0")))||
       (own(args,"selected")&&typeof args.selected!=="boolean")||
       (own(args,"limit")&&(!Number.isInteger(args.limit)||args.limit<1||args.limit>8))||
       (own(args,"offset")&&(!Number.isInteger(args.offset)||args.offset<0||args.offset>10000)))
      return {ok:false,code:"CAD_INVALID_INSPECTION_FILTER"};
    const p={};for(const k of ["type","layer","selected","limit","offset"])
      if(own(args,k))p[k]=args[k];
    if(!own(p,"limit"))p.limit=8;
    return {ok:true,args:base,command:"lizhi.entities",params:p};
  }

  if(name==="cad_draw_rectangle"&&keys.length===4&&allowed("session_id","request_id","p1","p2")&&point(args.p1)&&point(args.p2))
    return {ok:true,args:{...base},command:"rectang",params:{p1:args.p1,p2:args.p2}};
  if(name==="cad_draw_line"&&allowed("session_id","request_id","points","closed")&&Array.isArray(args.points)&&
     args.points.length>=2&&args.points.length<=64&&args.points.every(point)&&
     (!own(args,"closed")||typeof args.closed==="boolean"))
    return {ok:true,args:{...base},command:"line",params:{points:args.points,closed:args.closed===true}};
  if(name==="cad_draw_circle"&&keys.length===4&&allowed("session_id","request_id","center","radius")&&point(args.center)&&
     typeof args.radius==="number"&&Number.isFinite(args.radius)&&args.radius>0&&args.radius<=1000000)
    return {ok:true,args:{...base},command:"circle",params:{center:args.center,radius:args.radius}};
  if(name==="cad_new_drawing"&&allowed("session_id","request_id","metric")&&
     (!own(args,"metric")||typeof args.metric==="boolean"))
    return {ok:true,args:{...base},command:"new",params:{metric:args.metric!==false}};
  return {ok:false,code:"INVALID_CAD_GEOMETRY"};
}
