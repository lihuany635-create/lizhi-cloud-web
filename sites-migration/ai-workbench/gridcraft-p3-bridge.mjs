// P3 draft adapter for ORIGINAL AI Workbench Private Site; NOT DEPLOYED.
// Caller MUST pass identity(req,'ai').id as verifiedPrincipal.
// Does not replace existing 10+ AI Workbench or 7 construction photo tools.
// No Supabase Edge function for this bridge is yet deployed: feature gate OFF.

import {GRIDCRAFT_TOOLS, validateCall} from "../../integrations/gridcraft/p3-relay-core.mjs";

export {GRIDCRAFT_TOOLS};
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
