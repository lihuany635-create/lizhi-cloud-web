import test from "node:test";
import assert from "node:assert/strict";
import {handleSiteCadMcpRequest as handle} from "../sites-migration/cad/site-mcp-route.mjs";
const owner={signedIn:true,verifiedUserEmail:"OWNER@example.test"};
const other={signedIn:true,verifiedUserEmail:"other@example.test"};
const secrets={ownerEmail:"owner@example.test",siteMcpToken:"a".repeat(64)};
const sid="11111111-1111-4111-8111-111111111111";
const reqId="22222222-2222-4222-8222-222222222222";
const jobId="33333333-3333-4333-8333-333333333333";
const message=(method,params)=>({jsonrpc:"2.0",id:"ci-cad-site",method,...params===undefined?{}:{params}});
const call=(payload,opts={})=>new Request("https://private-site.invalid/mcp",{method:"POST",...opts,
  headers:{"Content-Type":"application/json",...(opts.headers||{})},
  body:typeof payload==="string"?payload:JSON.stringify(payload)});
test("unverified or different owner cannot enumerate any CAD tools",async()=>{
 let invoked=0;const fetcher=async()=>{invoked++;throw Error("unreachable")};
 const payload=call(message("tools/list"));
 assert.equal((await handle(payload,null,secrets,fetcher)).status,401);
 assert.equal((await handle(call(message("tools/list")),other,secrets,fetcher)).status,403);
 assert.equal((await handle(call(message("tools/call",{name:"cad_status"})),null,secrets,fetcher)).status,401);
 assert.equal(invoked,0);
});
test("authenticated owner sees exactly the intended eight tools",async()=>{
 const r=await handle(call(message("tools/list")),owner,secrets);
 assert.equal(r.status,200);
 const b=await r.json();
 assert.equal(b.result.tools.length,8);
 assert.deepEqual(b.result.tools.map(x=>x.name).sort(),
  ["cad_status","cad_draw_rectangle","cad_draw_line","cad_draw_circle","cad_new_drawing","cad_job_status","cad_inspect_drawing","cad_list_entities"].sort());
 assert.equal(r.headers.get("cache-control"),"no-store, private");
});
test("tool invocation is owner checked and forwards one bounded job",async()=>{
 let n=0;
 const fetcher=async(url,options)=>{
  n++;
  assert.ok(url.endsWith("/lizhi-cad-site-mcp"));
  assert.equal(options.headers.Authorization,"Bearer "+secrets.siteMcpToken);
  const request=JSON.parse(options.body);
  return Response.json({jsonrpc:"2.0",id:request.id,
    result:{isError:false,content:[{type:"text",text:JSON.stringify({ok:true,job_id:jobId,queued:true,completed:false})}]}});
 };
 const body=message("tools/call",{name:"cad_draw_rectangle",
  arguments:{session_id:sid,request_id:reqId,p1:[0,0],p2:[800,900]}});
 const response=await handle(call(body),owner,secrets,fetcher);
 const rpc=await response.json();
 assert.equal(response.status,200);
 assert.equal(rpc.result.isError,false);
 assert.equal(JSON.parse(rpc.result.content[0].text).completed,false);
 assert.equal(n,1);
});
test("unauthorized browser Origin, invalid tools, and excessive UTF-8 rejected",async()=>{
 assert.equal((await handle(call(message("tools/list"),{headers:{Origin:"https://evil.example"}}),owner,secrets)).status,403);
 const bad=await handle(call(message("tools/call",{name:"execute_script",arguments:{}})),owner,secrets,async()=>{throw Error("should not fetch")});
 assert.equal((await bad.json()).result.isError,true);
 assert.equal((await handle(call(message("tools/list"),{method:"PUT"}),owner,secrets)).status,405);
 assert.equal((await handle(call(message("tools/list",{padding:"字".repeat(6000)})),owner,secrets)).status,413);
});
test("no credentials or request-supplied owner can satisfy trusted Site identity",async()=>{
 assert.equal((await handle(call(message("initialize")),owner,{ownerEmail:""},async()=>{throw Error("unexpected")})).status,503);
 assert.equal((await handle(call({...message("tools/list"),ownerEmail:"owner@example.test"},{headers:{"X-Owner-Email":"owner@example.test"}}),null,secrets)).status,401);
});
