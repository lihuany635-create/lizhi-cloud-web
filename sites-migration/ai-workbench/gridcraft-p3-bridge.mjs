// P3 draft adapter for ORIGINAL AI Workbench Private Site; NOT DEPLOYED.
// Caller MUST pass identity(req,'ai').id as verifiedPrincipal.
// Does not replace existing 10+ AI Workbench or 7 construction photo tools.
// No Supabase Edge function for this bridge is yet deployed: feature gate OFF.

// Self-contained helper so existing Private Site can copy this ONE module.
// The backend revalidates all input independently (defense in depth).
const TOOLS = [
 {name:"gridcraft_status",description:"查詢本人 Windows GridCraft 代理在線狀態（唯讀）。",
  inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:"gridcraft_list_workbooks",description:"列出本人 Windows 上明確授權的 GridCraft 工作簿（唯讀）。",
  inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:"gridcraft_read_range",description:"在本人授權的開啟中工作簿讀取至多 200 格（唯讀）。",
  inputSchema:{type:"object",properties:{
    doc:{type:"string",maxLength:100},sheet:{type:"string",maxLength:80},
    range:{type:"string",maxLength:22}},
   required:["doc","sheet","range"],additionalProperties:false},
  annotations:{readOnlyHint:true}}
];
export const GRIDCRAFT_TOOLS = Object.freeze(TOOLS);
function validateCall(name,args) {
  if (!GRIDCRAFT_TOOL_SET.has(name)) throw Error("METHOD_DENIED");
  if (!args || typeof args !== "object" || Array.isArray(args)) throw Error("INVALID_ARGS");
  if (name!=="gridcraft_read_range") {
    if (Object.keys(args).length) throw Error("INVALID_ARGS");
    return {};
  }
  if (Object.keys(args).sort().join("|")!=="doc|range|sheet") throw Error("INVALID_ARGS");
  if (typeof args.doc!=="string" || !/^[A-Za-z0-9._:-]{1,100}$/.test(args.doc)) throw Error("INVALID_DOC");
  if (typeof args.sheet!=="string" || args.sheet.length<1 || args.sheet.length>80 ||
      /[\x00-\x1f]/.test(args.sheet)) throw Error("INVALID_SHEET");
  const m=typeof args.range==="string"&&args.range.length<=22
     ? /^([A-Z]{1,3})([1-9][0-9]{0,5})(?::([A-Z]{1,3})([1-9][0-9]{0,5}))?$/.exec(args.range) : null;
  if (!m) throw Error("INVALID_RANGE");
  const col=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
  const rows=Number(m[4]||m[2])-Number(m[2])+1, cols=col(m[3]||m[1])-col(m[1])+1;
  if (rows<1||cols<1||rows>50||cols>20||rows*cols>200) throw Error("RANGE_LIMIT");
  return {doc:args.doc,sheet:args.sheet,range:args.range};
}

export const GRIDCRAFT_TOOL_SET = new Set(GRIDCRAFT_TOOLS.map(t=>t.name));
const UPSTREAM="https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-gridcraft-bridge/site";
const MAX_BODY=32*1024;

export async function callGridcraftFromSite(
  {rpcId,name,args,verifiedPrincipal,expectedPrincipal,bridgeSecret,enabled=false,
   fetchImpl=fetch,timeoutMs=15000}={}
){
  if (enabled!==true) throw Error("GRIDCRAFT_GATE_OFF");
  if (typeof verifiedPrincipal!=="string" || verifiedPrincipal.length<8 ||
      verifiedPrincipal!==expectedPrincipal) throw Error("UNAUTHORIZED");
  if (typeof bridgeSecret!=="string" || bridgeSecret.length<32) throw Error("BRIDGE_NOT_CONFIGURED");
  const parsed=validateCall(name,args||{});
  if (typeof rpcId!=="string" && typeof rpcId!=="number" && rpcId!==null) throw Error("INVALID_REQUEST_ID");
  if (!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>19000) throw Error("INVALID_TIMEOUT");
  const requestId = crypto.randomUUID();
  const body=JSON.stringify({jsonrpc:"2.0",id:rpcId,method:"tools/call",
                            params:{name,arguments:parsed,requestId}});
  if (body.length>4096) throw Error("REQUEST_LIMIT");
  const response=await fetchImpl(UPSTREAM,{
    method:"POST",
    headers:{"Content-Type":"application/json","Accept":"application/json",
             "x-lizhi-gridcraft-bridge":bridgeSecret,"x-lizhi-gridcraft-actor":verifiedPrincipal},
    body,redirect:"manual",signal:AbortSignal.timeout(timeoutMs)
  });
  if (!response || !response.ok || response.status>=300) throw Error("GRIDCRAFT_BACKEND_UNAVAILABLE");
  const text=await response.text();
  if (text.length>MAX_BODY) throw Error("REPLY_LIMIT");
  let payload;
  try{payload=JSON.parse(text);}catch{throw Error("INVALID_RELAY_RESPONSE");}
  if (!payload || payload.jsonrpc!=="2.0" || payload.id!==rpcId ||
       (!Object.hasOwn(payload,"result")&&!Object.hasOwn(payload,"error"))) {
    throw Error("INVALID_RELAY_RESPONSE");
  }
  return payload;
}
