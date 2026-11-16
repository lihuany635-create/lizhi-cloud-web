// FUTURE SITE ADAPTER — not currently connected or deployed.
// Sites must authenticate the ChatGPT account with its native identity(req,'ai')
// and provide the VERIFIED principal. Never read a principal directly from input.
export const USAGE_TOOL_NAMES=new Set([
 "usage_status","usage_summary","usage_services",
 "usage_events","usage_alerts","usage_policy",
 "usage_log_before","usage_log_after","usage_budget_set"
]);
const upstream="https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-usage-monitor/mcp";
export async function relayUsageRpc(body,{
 verifiedPrincipal,expectedPrincipal,bridgeSecret,
 fetchImpl=fetch,timeoutMs=20000
}={}){
 if(typeof expectedPrincipal!=="string"||expectedPrincipal.length<8||
    verifiedPrincipal!==expectedPrincipal)throw new Error("Site principal not authorized.");
 if(typeof bridgeSecret!=="string"||bridgeSecret.length<32)
   throw new Error("Server-side bridge key not configured.");
 if(!body||typeof body!=="object"||Array.isArray(body)||
    body.jsonrpc!=="2.0"||typeof body.method!=="string")throw new Error("Invalid MCP message.");
 const allowed=["server/discover","initialize","ping","tools/list","tools/call"];
 if(!allowed.includes(body.method))throw new Error("Unsupported Site relay MCP method.");
 if(body.method==="tools/call" &&
    (!body.params||!USAGE_TOOL_NAMES.has(body.params.name)))throw new Error("Unknown usage tool.");
 if(!Number.isFinite(timeoutMs)||timeoutMs<1000||timeoutMs>30000)
   throw new Error("Invalid upstream timeout.");
 const r=await fetchImpl(upstream,{
   method:"POST",
   headers:{
     "Content-Type":"application/json",
     "Accept":"application/json, text/event-stream",
     "x-lizhi-usage-bridge":bridgeSecret,
     "x-lizhi-usage-actor":verifiedPrincipal
   },
   body:JSON.stringify(body),
   signal:AbortSignal.timeout(timeoutMs),
   redirect:"manual"
 });
 if(!r?.ok)throw new Error("Usage backend not available or not authorized.");
 const data=await r.json();
 if(!data||data.jsonrpc!=="2.0"||
    (!Object.hasOwn(data,"result")&&!Object.hasOwn(data,"error")))
   throw new Error("Invalid upstream MCP response.");
 return data;
}
