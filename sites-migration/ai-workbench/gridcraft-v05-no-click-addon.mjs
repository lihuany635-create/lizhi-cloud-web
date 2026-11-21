// Opt-in Site v31 ADAPTER CANDIDATE: no extra browser approval click.
// Integrate only in the EXISTING Site after its verified-principal check.
// Service/device authentication is still required and cannot be bypassed.
// This is not a replacement Site, and must not be published as a new MCP.
import {callP4FromPrivateSite,P4_TOOLS} from "./gridcraft-p4-site-addon.mjs";

export const ONE_CLICK_TOOL_DEFINITIONS = P4_TOOLS.map(tool => ({
  ...tool,
  description: tool.name==="gridcraft_commit_write"
    ? "依已預覽的短效版本提交指定工作簿修改；由已驗證本人在 ChatGPT 發出的寫入指令授權，不需要另開網頁。寫入前自動本機備份並檢查版本。"
    : "預覽已在 Windows GridCraft 開啟的工作簿指定儲存格，準備安全寫入；不需要另外按 Windows 授權按鈕。",
}));

// Router MUST have validated the current ChatGPT Site principal before this method.
// This adapter never accepts self-claimed userIds, routes to one fixed Edge, and
// continues to use the Edge's owner bound secret and Windows P4SafeWriter CAS.
// The Site approval_url flow is *not used* in this mode; every commit is a
// user-initiated MCP tool call scoped to that authenticated principal.
// Platform-level confirmation prompts, if any, are outside this add-on.
export async function callGridcraftNoClick({
  rpcId,name,args,verifiedPrincipal,expectedPrincipal,bridgeSecret,
  noClickEnabled=false,fetchImpl,timeoutMs=16000
}={}){
  if(noClickEnabled!==true)throw Error("NO_CLICK_GATE_OFF");
  if(typeof verifiedPrincipal!=="string"||
     verifiedPrincipal.length<8||verifiedPrincipal!==expectedPrincipal)
    throw Error("UNAUTHORIZED");
  if(name!=="gridcraft_prepare_write" && name!=="gridcraft_commit_write")
    throw Error("P4_METHOD_DENIED");
  if(!args || typeof args!=="object" || Array.isArray(args))
    throw Error("P4_INVALID_ARGS");
  let callArgs=args;
  if(name==="gridcraft_commit_write"){
    // This is not a free-form remote command. A prior short-lived preview must
    // already exist in the Windows worker, with matching ID and cell fingerprint.
    // User opted out of extra browser confirmation; an authenticated ChatGPT
    // tool request is the per-operation intent, not an unauthenticated web click.
    const {preview_id,expected_version,request_id}=args;
    if(Object.keys(args).some(k=>!["preview_id","expected_version","request_id","owner_confirmed"].includes(k)))
      throw Error("P4_INVALID_ARGS");
    if(args.owner_confirmed === false)throw Error("WRITE_DENIED_BY_CALLER");
    callArgs={preview_id,expected_version,request_id,owner_confirmed:true};
  }
  return callP4FromPrivateSite({
    rpcId,name,args:callArgs,verifiedPrincipal,expectedPrincipal,bridgeSecret,
    p4Enabled:true,fetchImpl,timeoutMs
  });
}
