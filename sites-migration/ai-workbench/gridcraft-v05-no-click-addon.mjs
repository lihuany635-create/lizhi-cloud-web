// GridCraft v31 SITE ADDITIVE ADAPTER — remove extra browser approval, not owner security.
// Integrate into the EXISTING owner-private Site's VERIFIED MCP request handler.
// Keep current P3, workbench and photo tools untouched. The original Site remains
// the only /mcp and this code does not deploy or create any new Site / Edge / DB.
// Local P4SafeWriter still enforces preview TTL, version CAS, XLSX backup, replay
// denial, write limits and readback; only the extra browser click is removed.
import {callP4FromPrivateSite, P4_TOOLS} from "./gridcraft-p4-site-addon.mjs";

const NO_CLICK_COMMIT_KEYS=["preview_id","expected_version","request_id"];
const COMMIT_DESCRIPTION=
  "把本人於 ChatGPT 明確指定的儲存格修改，依前一工具的短效預覽與版本直接提交；" +
  "不需另開確認網頁；每筆寫入先在 Windows 備份並檢查版本，不會自動儲存原檔。";

// Unlike original P4_TOOLS, the public MCP schema has NO owner_confirmed
// boolean or approval_url. The auth-bound Site service supplies the backend
// compatibility flag only after verifying the same private owner principal.
export const ONE_CLICK_TOOL_DEFINITIONS=Object.freeze(P4_TOOLS.map((tool)=>{
  if(tool.name!=="gridcraft_commit_write") return Object.freeze({
    ...tool,
    description:"唯讀預覽指定工作簿的儲存格變更；供 ChatGPT 自動接續安全寫入，無需確認網頁。"
  });
  const properties=Object.fromEntries(
    NO_CLICK_COMMIT_KEYS.map(key=>[key,tool.inputSchema.properties[key]])
  );
  return Object.freeze({
    ...tool,description:COMMIT_DESCRIPTION,
    inputSchema:{
      type:"object",properties,required:NO_CLICK_COMMIT_KEYS,
      additionalProperties:false
    }
  });
}));

function checkNoClickCommit(args) {
  if(!args||typeof args!=="object"||Array.isArray(args))
    throw Error("P4_INVALID_ARGS");
  const keys=Object.keys(args).sort();
  if(keys.length!==3||NO_CLICK_COMMIT_KEYS.some(key=>!keys.includes(key)))
    throw Error("P4_INVALID_ARGS");
  return {
    preview_id:args.preview_id,
    expected_version:args.expected_version,
    request_id:args.request_id,
    // Internal Edge/P4SafeWriter compatibility ONLY. This is NOT a submitted
    // client boolean and does not bypass the verified Site owner principal.
    owner_confirmed:true
  };
}

function stripLegacyApprovalPage(payload,name) {
  if(name!=="gridcraft_prepare_write")return payload;
  if(!payload?.result?.content || !Array.isArray(payload.result.content))
    return payload;
  const content=payload.result.content.map((item)=>{
    if(item?.type!=="text"||typeof item.text!=="string")return item;
    let parsed;
    try{parsed=JSON.parse(item.text);}catch{return item;}
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return item;
    // Never fabricate an actual commit, permission or backup status.
    const {approval_url,approvalUrl,instruction,...rest}=parsed;
    if(!("approval_url" in parsed)&&!("approvalUrl" in parsed)&&!("instruction" in parsed))
      return item;
    return {...item,text:JSON.stringify(rest)};
  });
  return {...payload,result:{...payload.result,content}};
}

// This call must be reachable ONLY through the EXISTING /mcp tool dispatch
// after verification of the logged-in owner, never an open GET/approval route.
// No claim of owner status from args/body/headers supplied by the caller.
export async function callGridcraftNoClick({
  rpcId,name,args,verifiedPrincipal,expectedPrincipal,bridgeSecret,
  noClickEnabled=false,fetchImpl,timeoutMs=16000
}={}){
  if(noClickEnabled!==true)throw Error("NO_CLICK_GATE_OFF");
  if(typeof verifiedPrincipal!=="string"||
     verifiedPrincipal.length<8||verifiedPrincipal!==expectedPrincipal)
    throw Error("UNAUTHORIZED");
  if(name!=="gridcraft_prepare_write"&&name!=="gridcraft_commit_write")
    throw Error("P4_METHOD_DENIED");
  if(!args||typeof args!=="object"||Array.isArray(args))
    throw Error("P4_INVALID_ARGS");
  const callArgs=name==="gridcraft_commit_write" ? checkNoClickCommit(args) : args;
  const payload=await callP4FromPrivateSite({
    rpcId,name,args:callArgs,verifiedPrincipal,expectedPrincipal,
    bridgeSecret,p4Enabled:true,fetchImpl,timeoutMs
  });
  return stripLegacyApprovalPage(payload,name);
}
