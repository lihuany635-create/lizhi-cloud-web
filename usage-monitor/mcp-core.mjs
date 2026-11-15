// Stateless, read-only MCP JSON-RPC 2.0 dispatcher.
// The caller must authorize BEFORE invoking dispatchUsageMcp.
// No background activity, service-role secrets or network access here.
export const MCP_PROTOCOL_VERSION = "2025-06-18";
const monthSchema={type:"string",pattern:"^20[0-9]{2}-(0[1-9]|1[0-2])$"};
const monthInput={type:"object",properties:{month:monthSchema},additionalProperties:false};
const emptyInput={type:"object",properties:{},additionalProperties:false};
const text=(data)=>({content:[{type:"text",text:JSON.stringify(data)}],isError:false});
const tool=(name,description,inputSchema)=>({
 name,title:name,description,inputSchema,
 annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}
});
export const USAGE_MCP_TOOLS=Object.freeze([
 tool("usage_status","查詢監控 MCP 的候選模式、資料覆蓋與部署狀態；不是 Supabase 的官方可用量。",emptyInput),
 tool("usage_summary","查詢指定月已接入 Edge 的觀測摘要及各類官方用量是否取得；官方未同步時不可推定剩餘。",monthInput),
 tool("usage_services","查詢指定月已接入的服務流量；不代表 22 項 Edge 或全站都已涵蓋。",monthInput),
 tool("usage_events","查詢最近逐筆觀測事件；最多 100 筆，不回傳 HTTP 標頭、Token 或請求本文。",{
   type:"object",properties:{month:monthSchema,limit:{type:"integer",minimum:1,maximum:100}},additionalProperties:false
 }),
 tool("usage_alerts","依官方快照警告超額風險；官方數據缺失時應回報 UNKNOWN，不能宣稱安全。",monthInput),
 tool("usage_policy","唯讀查詢候選限流政策與實際強制執行狀態，不修改任何設定。",emptyInput)
]);
const lookup=new Map(USAGE_MCP_TOOLS.map(x=>[x.name,x]));
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
function badParams(args,schema){
 if(!object(args))return "工具 arguments 必須是物件。";
 const props=schema.properties||{};
 for(const k of Object.keys(args))if(!Object.hasOwn(props,k))return "不允許的參數："+k;
 if(args.month!==undefined && (typeof args.month!=="string"||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(args.month)))
   return "月份應為 YYYY-MM。";
 if(args.limit!==undefined&&(!Number.isInteger(args.limit)||args.limit<1||args.limit>100))
   return "limit 必須為 1～100 的整數。";
 return null;
}
export function usageMonth(now=new Date()){
 const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit"})
   .formatToParts(now);
 return date.find(x=>x.type==="year").value+"-"+date.find(x=>x.type==="month").value;
}
export function usageAlerts(quotas){
 if(!Array.isArray(quotas))return [];
 return quotas.map(q=>{
   const limit=q.limit,used=q.official_used;
   if(used===null||used===undefined||!Number.isFinite(used)||!Number.isFinite(limit)||limit<=0)
     return {key:q.key||"unknown",state:"UNKNOWN",reason:"official_usage_unavailable"};
   const ratio=used/limit;
   return {key:q.key||"unknown",state:ratio>=.95?"STOP":ratio>=.85?"THROTTLE":ratio>=.70?"WARNING":"NORMAL",
     officialUsedAsOf:used,limit,ratio,reason:"official_snapshot_may_be_delayed"};
 });
}
export async function dispatchUsageMcp(message,{snapshot,now=new Date()}={}){
 const error=(id,code,message)=>({jsonrpc:"2.0",id, error:{code,message}});
 if(!object(message)||message.jsonrpc!=="2.0"||
   (message.id!==undefined && typeof message.id!=="number"&&typeof message.id!=="string"))
   return error(null,-32600,"Invalid JSON-RPC request.");
 const method=message.method;
 if(typeof method!=="string")return error(message.id??null,-32600,"Missing JSON-RPC method.");
 if(method==="notifications/initialized" && message.id===undefined)return null;
 if(message.id===undefined)return error(null,-32600,"Request ID is required.");
 const ok=result=>({jsonrpc:"2.0",id:message.id,result});
 if(method==="initialize"){
   return ok({protocolVersion:MCP_PROTOCOL_VERSION,
     capabilities:{tools:{listChanged:false}},
     serverInfo:{name:"lizhi-supabase-usage-monitor",version:"0.2.0"}});
 }
 if(method==="ping")return ok({});
 if(method==="tools/list")return ok({tools:USAGE_MCP_TOOLS});
 if(method!=="tools/call")return error(message.id,-32601,"Method not found.");
 const params=message.params;
 if(!object(params)||typeof params.name!=="string")
   return error(message.id,-32602,"Invalid tools/call params.");
 const spec=lookup.get(params.name);
 if(!spec)return error(message.id,-32602,"Unknown usage tool.");
 const args=params.arguments===undefined?{}:params.arguments;
 const invalid=badParams(args,spec.inputSchema);
 if(invalid)return error(message.id,-32602,invalid);
 const name=params.name;
 try{
   if(name==="usage_status"){
     return ok(text({service:"lizhi-supabase-usage-monitor",mcpReady:true,
       authorization:"validated_upstream_per_request",mode:"read_only",
       officialBillingConnected:false,siteConnected:false,
       gatewayEnforced:false,allServicesInstrumented:false,
       note:"MCP 程式可回應，不表示已部署、Site 已串接或已實際防止超額。"}));
   }
   if(name==="usage_policy")return ok(text({
     state:"candidate_not_enforced",thresholds:{notice:.70,throttle:.85,stop:.95},
     officialSnapshotMaxAgeMinutes:60,failClosedFor:["optional","background"],
     criticalRecoveryIsNotZeroCost:true,hasExternalGateway:false,hasAtomicReservations:false
   }));
   if(typeof snapshot!=="function")throw new Error("Snapshot backend not configured.");
   const month=args.month??usageMonth(now);
   const snap=await snapshot(month);
   if(!object(snap)||snap.coverage!=="instrumented_only")throw new Error("Unsupported snapshot coverage.");
   if(name==="usage_summary")return ok(text({
     month,coverage:snap.coverage,source:snap.source,summary:snap.summary,quotas:snap.quotas,
     officialBillingConnected:false,note:snap.note
   }));
   if(name==="usage_services")return ok(text({month,coverage:snap.coverage,services:snap.sources}));
   if(name==="usage_events")return ok(text({month,coverage:snap.coverage,
     events:(snap.events||[]).slice(0,args.limit??100)}));
   if(name==="usage_alerts")return ok(text({month,alerts:usageAlerts(snap.quotas),
     note:"UNKNOWN 不等於安全；任何觀測下限都不能證明剩餘額度。"}));
   return error(message.id,-32601,"Method not found.");
 }catch{
   // Never leak database/Supabase/secret details in MCP tool results.
   return ok({isError:true,content:[{type:"text",text:"監控資料目前不可用。尚未驗證的資料不得當成官方帳務。"}]});
 }
}
