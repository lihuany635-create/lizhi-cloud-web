import {test} from "node:test";
import assert from "node:assert/strict";
import {API_COUNT_METRICS,readProjectApiCountObservations} from "./management-api-observer.mjs";
const ref="hrdzywkihfqggiwjgavi",token="m".repeat(50);
const row=()=>({timestamp:"2026-11-16T00:00:00Z",total_auth_requests:1,total_realtime_requests:2,total_rest_requests:3,total_storage_requests:4});
const res=(data={result:[row()]})=>({ok:true,status:200,json:async()=>data});
test("missing Management API credential means unavailable, no fabricated bills",async()=>{
 const x=await readProjectApiCountObservations();
 assert.equal(x.state,"unavailable");assert.equal(x.billable,false);
});
test("restrict endpoint to original Supabase project",async()=>{
 await assert.rejects(readProjectApiCountObservations({token,projectRef:"other-project"}),/project/);
});
test("correct endpoint uses server-only bearer and no key in url",async()=>{
 let url,options;
 const x=await readProjectApiCountObservations({token,fetchImpl:async(u,o)=>{url=u;options=o;return res();}});
 assert.equal(url,"https://api.supabase.com/v1/projects/"+ref+"/analytics/endpoints/usage.api-counts");
 assert.equal(url.includes(token),false);
 assert.equal(options.headers.Authorization,"Bearer "+token);
 assert.equal(options.redirect,"manual");
 assert.equal(x.billable,false);assert.equal(x.officialBillingConnected,false);
 assert.equal(x.billingCoverage,"none");
 assert.deepEqual(Object.keys(x.rows[0]),["timestamp",...API_COUNT_METRICS]);
});
test("management API data must not become Edge invocation/egress official used",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>res()});
 assert.equal(Object.hasOwn(x.rows[0],"edge_invocations"),false);
 assert.equal(Object.hasOwn(x.rows[0],"egress"),false);
});
test("429 rate limiting is unavailable not zero",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>({ok:false,status:429})});
 assert.equal(x.reason,"management_rate_limited");assert.deepEqual(x.rows,[]);
});
test("missing analytics_usage_read access is unavailable",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>({ok:false,status:403})});
 assert.equal(x.reason,"management_permission_denied");
});
test("network timeout is unavailable",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>{throw Error("timeout");}});
 assert.equal(x.reason,"management_network_unavailable");
});
test("reject missing project api count fields",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>res({result:[{timestamp:"2026-11-16T00:00:00Z"}]})});
 assert.equal(x.reason,"management_invalid_response");
});
test("reject negative or fractional counts",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>res({result:[{...row(),total_rest_requests:-1}]})});
 assert.equal(x.state,"unavailable");
});
test("reject malformed or non-ISO timestamps",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>res({result:[{...row(),timestamp:"undefined"}]})});
 assert.equal(x.state,"unavailable");
});
test("cap responses to 400 rows",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>res({result:Array(401).fill(row())})});
 assert.equal(x.state,"unavailable");
});
test("empty real analytics is allowed but still not billing",async()=>{
 const x=await readProjectApiCountObservations({token,fetchImpl:async()=>res({result:[]})});
 assert.equal(x.state,"available");assert.equal(x.rows.length,0);assert.equal(x.billable,false);
});
test("invalid timeouts are rejected",async()=>{
 await assert.rejects(readProjectApiCountObservations({token,timeoutMs:0}),/timeout/);
});
