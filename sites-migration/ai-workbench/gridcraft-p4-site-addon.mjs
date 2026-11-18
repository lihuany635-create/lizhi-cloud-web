// P4 preview/commit TOOL CONTRACT candidate. NOT deployed on the original Site.
// Site must use its verified principal and an explicit GRIDCRAFT_P4_ENABLED gate.
// This does NOT replace P3 read-only tools; P4 never accepts arbitrary methods.

export const P4_TOOLS = Object.freeze([
 {
  name:"gridcraft_prepare_write",
  description:"預覽已授權 GridCraft 工作簿的指定範圍變更；不會寫入。最多 50 格、不可傳公式；回傳短效預覽與 expected_version。",
  inputSchema:{type:"object",properties:{
    doc:{type:"string",minLength:1,maxLength:20},
    sheet:{type:"string",minLength:1,maxLength:80},
    range:{type:"string",minLength:2,maxLength:22},
    values:{type:"array",maxItems:50,items:{type:"array",maxItems:50,items:{type:["string","number","boolean","null"]}}}
  },required:["doc","sheet","range","values"],additionalProperties:false},
  annotations:{readOnlyHint:true,destructiveHint:false}
 },
 {
  name:"gridcraft_commit_write",
  description:"依剛才預覽的 preview_id 和 expected_version，經本人在對話中確認以及 Windows 本機按鍵允許後才寫入。先備份，成功回傳未儲存狀態。",
  inputSchema:{type:"object",properties:{
    preview_id:{type:"string",minLength:36,maxLength:36},
    expected_version:{type:"string",minLength:64,maxLength:64},
    request_id:{type:"string",minLength:36,maxLength:36},
    owner_confirmed:{type:"boolean",description:"只能在使用者明確確認本次寫入後填 true"}
  },required:["preview_id","expected_version","request_id","owner_confirmed"],additionalProperties:false},
  annotations:{readOnlyHint:false,destructiveHint:true}
 }
]);
export const P4_TOOL_NAMES = new Set(P4_TOOLS.map(t=>t.name));
const MAX_U64=18446744073709551615n;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{64}$/;
const COL=s=>[...s].reduce((n,c)=>26*n+(c.charCodeAt(0)-64),0);
export function validateP4Call(name,args) {
 if(!P4_TOOL_NAMES.has(name))throw Error("P4_METHOD_DENIED");
 if(!args||typeof args!=="object"||Array.isArray(args))throw Error("P4_INVALID_ARGS");
 if(name==="gridcraft_commit_write") {
   if(Object.keys(args).sort().join("|")!=="expected_version|owner_confirmed|preview_id|request_id")
     throw Error("P4_INVALID_ARGS");
   if(typeof args.preview_id!=="string"||!UUID.test(args.preview_id)||
      typeof args.request_id!=="string"||!UUID.test(args.request_id)||
      typeof args.expected_version!=="string"||!SHA.test(args.expected_version)||
      args.owner_confirmed!==true)throw Error("P4_CONFIRMATION_REQUIRED");
   return {...args};
 }
 if(Object.keys(args).sort().join("|")!=="doc|range|sheet|values")
   throw Error("P4_INVALID_ARGS");
 if(typeof args.doc!=="string"|| !/^[1-9][0-9]{0,19}$/.test(args.doc)||
    BigInt(args.doc)>MAX_U64)throw Error("P4_INVALID_DOC");
 if(typeof args.sheet!=="string"||!args.sheet.length||args.sheet.length>80||
    /[\x00-\x1f]/.test(args.sheet))throw Error("P4_INVALID_SHEET");
 const m=typeof args.range==="string"?
   /^([A-Z]{1,3})([1-9][0-9]{0,5})(?::([A-Z]{1,3})([1-9][0-9]{0,5}))?$/.exec(args.range):null;
 if(!m||args.range.length>22)throw Error("P4_INVALID_RANGE");
 const rows=Number(m[4]||m[2])-Number(m[2])+1;
 const cols=COL(m[3]||m[1])-COL(m[1])+1;
 if(rows<1||cols<1||rows*cols>50)throw Error("P4_RANGE_LIMIT");
 if(!Array.isArray(args.values)||args.values.length!==rows)throw Error("P4_VALUE_SHAPE");
 for(const row of args.values){
   if(!Array.isArray(row)||row.length!==cols)throw Error("P4_VALUE_SHAPE");
   for(const v of row){
     if(v===null||typeof v==="boolean")continue;
     if(typeof v==="number"){
       if(!Number.isFinite(v)||Math.abs(v)>Number.MAX_SAFE_INTEGER)throw Error("P4_UNSAFE_NUMBER");
       continue;
     }
     if(typeof v!=="string"||v.length>1000||v.startsWith("=")||v.includes("\x00"))
       throw Error("P4_FORMULA_OR_VALUE_DENIED");
   }
 }
 if(new TextEncoder().encode(JSON.stringify(args.values)).length>4096)throw Error("P4_VALUE_LIMIT");
 return {doc:args.doc,sheet:args.sheet,range:args.range,values:args.values};
}

// This adapter is meant to be integrated into the EXISTING v29 Private Site.
// Do not publish as another Site. Never replace existing P3 / AIWB / photo tools.
const SITE_TO_EDGE =
  "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-gridcraft-bridge/site/dispatch";

export async function callP4FromPrivateSite({rpcId,name,args,
   verifiedPrincipal,expectedPrincipal,bridgeSecret,p4Enabled=false,
   fetchImpl=fetch,timeoutMs=16000}={}){
  if(p4Enabled!==true)throw Error("P4_GATE_OFF");
  if(typeof verifiedPrincipal!=="string"||verifiedPrincipal!==expectedPrincipal||
     verifiedPrincipal.length<8)throw Error("UNAUTHORIZED");
  if(typeof bridgeSecret!=="string"||bridgeSecret.length<32)throw Error("BRIDGE_NOT_CONFIGURED");
  if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>17000)throw Error("P4_INVALID_TIMEOUT");
  const parsed=validateP4Call(name,args);
  const body=JSON.stringify({jsonrpc:"2.0",id:rpcId??null,method:"tools/call",
     params:{name,arguments:parsed,requestId:crypto.randomUUID()}});
  if(new TextEncoder().encode(body).length>8192)throw Error("P4_REQUEST_LIMIT");
  const res=await fetchImpl(SITE_TO_EDGE,{
    method:"POST",redirect:"manual",
    headers:{"Content-Type":"application/json","Accept":"application/json",
       "x-lizhi-gridcraft-bridge":bridgeSecret,
       "x-lizhi-gridcraft-actor":verifiedPrincipal},
    body,signal:AbortSignal.timeout(timeoutMs)
  });
  if(!res?.ok||res.status>=300)throw Error("P4_EDGE_UNAVAILABLE");
  const raw=await res.text();
  if(new TextEncoder().encode(raw).length>32768)throw Error("P4_RESULT_LIMIT");
  let payload;
  try{payload=JSON.parse(raw);}catch{throw Error("P4_INVALID_REPLY");}
  if(payload?.jsonrpc!=="2.0"||payload.id!==(rpcId??null)||
     !Object.hasOwn(payload,"result"))throw Error("P4_INVALID_REPLY");
  return payload;
}
