import {test} from "node:test";
import assert from "node:assert/strict";
import {USAGE_TOOL_NAMES,relayUsageRpc} from "./site-bridge-relay.mjs";
const owner="chatgpt:verified-owner-123",key="z".repeat(64);
const body={jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"usage_status",arguments:{}}};
const mock=async(_url,init)=>({
 ok:true,async json(){return {jsonrpc:"2.0",id:1,result:{content:[]}};},
 init
});
const opts=()=>({verifiedPrincipal:owner,expectedPrincipal:owner,bridgeSecret:key,fetchImpl:mock});
test("exactly six usage tools are forwarded",()=>{
 assert.equal(USAGE_TOOL_NAMES.size,6);
 assert.equal(USAGE_TOOL_NAMES.has("usage_create_transaction"),false);
});
test("verified principal can call a read-only usage tool",async()=>{
 const x=await relayUsageRpc(body,opts());
 assert.equal(x.jsonrpc,"2.0");
});
test("refuses missing principal",async()=>{
 await assert.rejects(relayUsageRpc(body,{...opts(),verifiedPrincipal:""}),/principal/);
});
test("refuses other accounts",async()=>{
 await assert.rejects(relayUsageRpc(body,{...opts(),verifiedPrincipal:"attacker"}),/principal/);
});
test("refuses missing bridge secret",async()=>{
 await assert.rejects(relayUsageRpc(body,{...opts(),bridgeSecret:""}),/bridge/);
});
test("rejects write tool names",async()=>{
 await assert.rejects(relayUsageRpc({...body,params:{name:"usage_delete_all"}},opts()),/Unknown/);
});
test("rejects arbitrary RPC methods",async()=>{
 await assert.rejects(relayUsageRpc({...body,method:"danger"},opts()),/Unsupported/);
});
test("headers carry only static endpoint, principal, server secret",async()=>{
 let url,req;
 const x=opts();
 x.fetchImpl=async(u,i)=>{url=u;req=i;return mock(u,i)};
 await relayUsageRpc(body,x);
 assert.match(url,/^https:\/\/hrdzywkihfqggiwjgavi\.supabase\.co\/functions\/v1\/lizhi-usage-monitor\/mcp$/);
 assert.equal(req.headers["x-lizhi-usage-bridge"],key);
 assert.equal(req.headers["x-lizhi-usage-actor"],owner);
 assert.equal(req.redirect,"manual");
});
test("unauthorized HTTP response fails closed",async()=>{
 await assert.rejects(relayUsageRpc(body,{...opts(),fetchImpl:async()=>({ok:false,status:401})}),/not available/);
});
test("unstructured upstream response is rejected",async()=>{
 await assert.rejects(relayUsageRpc(body,{...opts(),fetchImpl:async()=>({ok:true,json:async()=>({hello:1})})}),/Invalid upstream/);
});
test("invalid timeout is rejected",async()=>{
 await assert.rejects(relayUsageRpc(body,{...opts(),timeoutMs:50}),/timeout/);
});
