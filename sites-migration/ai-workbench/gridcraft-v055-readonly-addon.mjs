// Site -> Edge v10 v0.5.5 READ-ONLY candidate. NOT automatically deployed.
// Add to the EXISTING Private Site's tool list/dispatch only after verifying the
// signed-in owner identity. No second Site/MCP/DB. Site gate and Edge
// `readonlyV055Enabled` both default to OFF. Does not replace existing tools.
const ENDPOINT = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-gridcraft-bridge/site/dispatch";
const HEX64 = /^[a-f0-9]{64}$/i;
const DOC = /^[1-9][0-9]{0,19}$/;
const A1 = /^([A-Z]{1,3})([1-9][0-9]{0,5})(?::([A-Z]{1,3})([1-9][0-9]{0,5}))?$/;
const CELL = /^\$?[A-Z]{1,3}\$?[1-9][0-9]{0,5}$/;
const MODES = ["values","formulas","formatted"];
const DENIED = new Set(["CELL","INFO","INDIRECT","HYPERLINK","WEBSERVICE","FILTERXML","ENCODEURL",
  "IMAGE","STOCKHISTORY","RTD","DDE","CALL","REGISTER","REGISTER.ID","SQL.REQUEST","EUROCONVERT",
  "PY","COPILOT","TRANSLATE","DETECTLANGUAGE"]);

export const V055_READONLY_TOOLS = Object.freeze([
  {name:"gridcraft_inspect_workbook",
   description:"查看本人授權工作簿的結構（唯讀）：工作表、使用範圍、表格、圖表、定義名稱、凍結窗格。不回傳本機路徑或編輯歷程。",
   inputSchema:{type:"object",properties:{doc:{type:"string",minLength:1,maxLength:20}},
     required:["doc"],additionalProperties:false},
   annotations:{readOnlyHint:true,destructiveHint:false}},
  {name:"gridcraft_evaluate_formula",
   description:"在本人授權工作簿試算一條公式並回傳結果，不修改任何儲存格（唯讀）。不允許外部活頁簿參照、網路、路徑或環境資訊函數（如 CELL、INFO、WEBSERVICE、INDIRECT）。",
   inputSchema:{type:"object",properties:{
     doc:{type:"string",minLength:1,maxLength:20},
     formula:{type:"string",minLength:2,maxLength:500},
     cell:{type:"string",maxLength:12}},
     required:["doc","formula"],additionalProperties:false},
   annotations:{readOnlyHint:true,destructiveHint:false}}
]);
// Replaces the P3 read_range schema ONLY when this gate is on (adds optional mode).
export const V055_READ_RANGE_TOOL = Object.freeze({
  name:"gridcraft_read_range",
  description:"在本人授權的開啟中工作簿讀取至多 200 格（唯讀）。mode：values（預設，計算值）、formulas（公式原文）、formatted（畫面顯示文字）。",
  inputSchema:{type:"object",properties:{
    doc:{type:"string",maxLength:100},sheet:{type:"string",maxLength:80},
    range:{type:"string",maxLength:22},mode:{type:"string",enum:MODES}},
   required:["doc","sheet","range"],additionalProperties:false},
  annotations:{readOnlyHint:true}
});
export const V055_TOOL_NAMES = new Set([...V055_READONLY_TOOLS.map(t=>t.name),"gridcraft_read_range"]);

const plain = v => v!==null && typeof v==="object" && !Array.isArray(v);
const keysOf = v => Object.keys(v).sort().join("|");
const doc = v => {
  if(typeof v!=="string"||!DOC.test(v)||BigInt(v)>18446744073709551615n)throw Error("INVALID_DOC");
  return v;
};

export function formulaGuard(f) {
  if(typeof f!=="string"||!f.startsWith("=")||f.length<2||f.length>500||/[\x00-\x1f]/.test(f))
    throw Error("FORMULA_INVALID");
  if(f.includes("[")||f.includes("\\")||f.toLowerCase().includes("://"))throw Error("FORMULA_EXTERNAL_DENIED");
  for(const m of f.matchAll(/([A-Za-z_][A-Za-z0-9_.]*)\s*\(/g)){
    let n=m[1].toUpperCase();
    for(const p of ["_XLFN._XLWS.","_XLFN.","_XLWS."])if(n.startsWith(p))n=n.slice(p.length);
    if(DENIED.has(n)||n.startsWith("CUBE"))throw Error("FORMULA_FUNCTION_DENIED");
  }
  return f;
}

export function validateV055Call(name,args) {
  if(!V055_TOOL_NAMES.has(name))throw Error("METHOD_DENIED");
  if(!plain(args))throw Error("INVALID_ARGS");
  const k=keysOf(args);
  if(name==="gridcraft_inspect_workbook"){
    if(k!=="doc")throw Error("INVALID_ARGS");
    return {doc:doc(args.doc)};
  }
  if(name==="gridcraft_evaluate_formula"){
    if(k!=="doc|formula"&&k!=="cell|doc|formula")throw Error("INVALID_ARGS");
    const out={doc:doc(args.doc),formula:formulaGuard(args.formula)};
    if("cell" in args){
      if(typeof args.cell!=="string"||!CELL.test(args.cell))throw Error("INVALID_CELL");
      out.cell=args.cell;
    }
    return out;
  }
  if(k!=="doc|range|sheet"&&k!=="doc|mode|range|sheet")throw Error("INVALID_ARGS");
  if(typeof args.sheet!=="string"||!args.sheet.length||args.sheet.length>80||/[\x00-\x1f]/.test(args.sheet))
    throw Error("INVALID_SHEET");
  const m=typeof args.range==="string"&&args.range.length<=22?A1.exec(args.range):null;
  if(!m)throw Error("INVALID_RANGE");
  const col=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
  const rows=Number(m[4]||m[2])-Number(m[2])+1, cols=col(m[3]||m[1])-col(m[1])+1;
  if(rows<1||cols<1||rows>50||cols>20||rows*cols>200)throw Error("RANGE_LIMIT");
  const out={doc:doc(args.doc),sheet:args.sheet,range:args.range};
  if("mode" in args){
    if(!MODES.includes(args.mode))throw Error("INVALID_MODE");
    if(args.mode!=="values")out.mode=args.mode; // values == legacy 3-key shape
  }
  return out;
}

export async function callV055FromPrivateSite({
  rpcId,name,args,verifiedPrincipal,expectedPrincipal,bridgeSecret,
  readonlyV055Enabled=false,fetchImpl=fetch,timeoutMs=15000
}={}) {
  if(readonlyV055Enabled!==true)throw Error("V055_READONLY_GATE_OFF");
  if(typeof verifiedPrincipal!=="string"||verifiedPrincipal.length<8||
     verifiedPrincipal!==expectedPrincipal)throw Error("UNAUTHORIZED");
  if(typeof bridgeSecret!=="string"||!HEX64.test(bridgeSecret))throw Error("BRIDGE_NOT_CONFIGURED");
  if(rpcId!==null&&typeof rpcId!=="string"&&typeof rpcId!=="number")throw Error("INVALID_RPC_ID");
  if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>17000)throw Error("INVALID_TIMEOUT");
  const parsed=validateV055Call(name,args);
  const payload=JSON.stringify({jsonrpc:"2.0",id:rpcId??null,method:"tools/call",
    params:{name,arguments:parsed,requestId:crypto.randomUUID()}});
  if(new TextEncoder().encode(payload).length>4096)throw Error("REQUEST_LIMIT");
  let response;
  try{
    response=await fetchImpl(ENDPOINT,{method:"POST",redirect:"manual",headers:{
      "Content-Type":"application/json","Accept":"application/json",
      "x-lizhi-gridcraft-actor":verifiedPrincipal,"x-lizhi-gridcraft-bridge":bridgeSecret
    },body:payload,signal:AbortSignal.timeout(timeoutMs)});
  }catch{throw Error("GRIDCRAFT_BACKEND_UNAVAILABLE");}
  if(!response?.ok||response.status>=300)throw Error("GRIDCRAFT_BACKEND_UNAVAILABLE");
  const raw=await response.text();
  if(new TextEncoder().encode(raw).length>32768)throw Error("REPLY_LIMIT");
  let result;
  try{result=JSON.parse(raw);}catch{throw Error("INVALID_RELAY_RESPONSE");}
  if(!plain(result)||result.jsonrpc!=="2.0"||result.id!==(rpcId??null)||!Object.hasOwn(result,"result"))
    throw Error("INVALID_RELAY_RESPONSE");
  return result;
}
