import {test} from "node:test";
import assert from "node:assert/strict";
import {USAGE_MCP_TOOLS,usageMonth,usageAlerts,dispatchUsageMcp} from "./mcp-core.mjs";
const fakeSnapshot=async month=>({
 month,coverage:"instrumented_only",source:"app_telemetry_not_official_billing",
 note:"Only instrumented services, not official.",
 summary:{request_count:2,response_bytes_known:120,blocked_count:0},
 sources:[{source:"test-edge",request_count:2}],events:Array.from({length:3},(_,i)=>({
   route:"/mcp",status_code:200,decision:"allow",occurred_at:"2026-11-15T00:00:00Z",sequence:i
 })),
 quotas:[{key:"edge_invocations",limit:500000,official_used:null},
   {key:"egress",limit:100,official_used:96,
    official_source:"supabase_dashboard_manual",official_as_of:"2026-11-15T11:30:00Z"}]
});
const rpc=(method,params={},id=1)=>dispatchUsageMcp({jsonrpc:"2.0",id,method,params},{
 snapshot:fakeSnapshot,now:new Date("2026-11-15T12:00:00Z")
});
const read=x=>JSON.parse(x.result.content[0].text);
test("six read-only tools exist with no write-side tools",()=>{
 assert.deepEqual(USAGE_MCP_TOOLS.map(x=>x.name),[
 "usage_status","usage_summary","usage_services","usage_events","usage_alerts","usage_policy"]);
 for(const x of USAGE_MCP_TOOLS)assert.equal(x.annotations.readOnlyHint,true);
});
test("initialize advertises streamable stateless MCP",async()=>{
 const x=await rpc("initialize");
 assert.equal(x.result.protocolVersion,"2025-06-18");
 assert.equal(x.result.capabilities.tools.listChanged,false);
});
test("tools/list returns all tools",async()=>{
 const x=await rpc("tools/list");
 assert.equal(x.result.tools.length,6);
});
test("ping returns empty result",async()=>{
 assert.deepEqual((await rpc("ping")).result,{});
});
test("notifications/initialized receives no response",async()=>{
 assert.equal(await dispatchUsageMcp({jsonrpc:"2.0",method:"notifications/initialized"}),null);
});
test("usage_summary says official billing is not connected",async()=>{
 const x=read(await rpc("tools/call",{name:"usage_summary",arguments:{month:"2026-11"}}));
 assert.equal(x.coverage,"instrumented_only");
 assert.equal(x.officialBillingConnected,false);
 assert.equal(x.quotas[0].official_used,null);
});
test("usage_events limits results",async()=>{
 const x=read(await rpc("tools/call",{name:"usage_events",arguments:{month:"2026-11",limit:2}}));
 assert.equal(x.events.length,2);
});
test("unknown official quota is reported UNKNOWN",async()=>{
 const x=read(await rpc("tools/call",{name:"usage_alerts",arguments:{}}));
 assert.equal(x.alerts[0].state,"UNKNOWN");
 assert.equal(x.alerts[1].state,"STOP");
});
test("usage_policy does not claim enforced gateway",async()=>{
 const x=read(await rpc("tools/call",{name:"usage_policy",arguments:{}}));
 assert.equal(x.hasExternalGateway,false);
 assert.equal(x.state,"candidate_not_enforced");
});
test("usage_status does not claim Site is connected",async()=>{
 const x=read(await rpc("tools/call",{name:"usage_status",arguments:{}}));
 assert.equal(x.siteConnected,false);
 assert.equal(x.gatewayEnforced,false);
});
test("bad tool names are JSON-RPC invalid params",async()=>{
 const x=await rpc("tools/call",{name:"usage_delete",arguments:{}});
 assert.equal(x.error.code,-32602);
});
test("bad month is rejected without database reads",async()=>{
 const x=await rpc("tools/call",{name:"usage_summary",arguments:{month:"2026-00"}});
 assert.equal(x.error.code,-32602);
});
test("unrecognized input is rejected",async()=>{
 const x=await rpc("tools/call",{name:"usage_status",arguments:{write:true}});
 assert.equal(x.error.code,-32602);
});
test("invalid event limit is rejected",async()=>{
 for(const limit of [-1,0,101,"4"]){
   const x=await rpc("tools/call",{name:"usage_events",arguments:{limit}});
   assert.equal(x.error.code,-32602);
 }
});
test("unexpected snapshot is tool error, not fake numbers",async()=>{
 const x=await dispatchUsageMcp({jsonrpc:"2.0",method:"tools/call",id:2,
 params:{name:"usage_summary",arguments:{month:"2026-11"}}},{
 snapshot:async()=>{throw new Error("DATABASE_SECRET=not-for-user");}
 });
 assert.equal(x.result.isError,true);
 assert.doesNotMatch(x.result.content[0].text,/DATABASE_SECRET/);
});
test("invalid JSON-RPC payload is rejected",async()=>{
 const x=await dispatchUsageMcp({method:"ping"});
 assert.equal(x.error.code,-32600);
});
test("unknown method returns method-not-found",async()=>{
 const x=await rpc("makeMoney");
 assert.equal(x.error.code,-32601);
});
test("Taipei month handles UTC rollover",()=>{
 assert.equal(usageMonth(new Date("2026-10-31T17:00:00Z")),"2026-11");
});
test("alerts don't silently treat zero official as unknown",()=>{
 assert.equal(usageAlerts([{key:"e",limit:100,official_used:0,
   official_source:"supabase_dashboard_manual",official_as_of:"2026-11-15T11:30:00Z"}],
   new Date("2026-11-15T12:00:00Z"))[0].state,"NORMAL");
});

test("stale official usage is UNKNOWN, not NORMAL",()=>{
 const x=usageAlerts([{key:"e",limit:100,official_used:10,
   official_source:"supabase_dashboard_manual",official_as_of:"2026-11-15T08:00:00Z"}],
   new Date("2026-11-15T12:00:00Z"));
 assert.equal(x[0].state,"UNKNOWN");
});
test("unverified official source cannot claim STOP/NORMAL",()=>{
 const x=usageAlerts([{key:"e",limit:100,official_used:99}],new Date("2026-11-15T12:00:00Z"));
 assert.equal(x[0].state,"UNKNOWN");
});
