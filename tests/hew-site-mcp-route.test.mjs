import test from "node:test";
import assert from "node:assert/strict";
import {handleSiteModelMcpRequest} from "../sites-migration/hew/site-mcp-route.mjs";
import {handleModelEdgeRequest} from "../supabase/functions/lizhi-model-site-mcp/edge-core.mjs";
const email="owner@example.test";
const valid={signedIn:true,verifiedUserEmail:email};
const secrets={ownerEmail:email,siteMcpToken:"b".repeat(64)};
const owner="11111111-1111-4111-8111-111111111111";
const session="33333333-3333-4333-8333-333333333333";
const document="44444444-4444-4444-8444-444444444444";
const requestId="55555555-5555-4555-8555-555555555555";
const jobId="66666666-6666-4666-8666-666666666666";
const requests=[];
const db={rpc:async(name,args)=>{
  requests.push({name,args});
  const data={
    lizhi_model_site_sessions:[{session_id:session,document_id:document}],
    lizhi_model_site_scene:{document_id:document,revision:"r1",entities:[]},
    lizhi_model_site_enqueue:jobId,
  }[name];
  return {data,error:null};
}};
let count=0;
const forward=async(url,init)=>{
 count++;
 const req=new Request(url,{method:init.method,headers:init.headers,body:init.body});
 return handleModelEdgeRequest(req,{db,ownerUid:owner,token:secrets.siteMcpToken});
};
const request=(method,id=1,params)=>new Request("https://model-site.example/mcp",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({jsonrpc:"2.0",id,method,...params?{params}:{}}),
});
test("private M3 site route rejects unauthenticated, wrong owner, origin and GET",async()=>{
  count=0;
  for(const identity of [null,{signedIn:true,verifiedUserEmail:"other@example.test"}]){
    const r=await handleSiteModelMcpRequest(request("tools/list"),identity,secrets,forward);
    assert.ok(r.status===401||r.status===403);
  }
  const o=await handleSiteModelMcpRequest(new Request("https://model-site.example/mcp",{method:"POST",
    headers:{Origin:"https://attacker.test"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/list"})}),
    valid,secrets,forward);
  assert.equal(o.status,403);
  const get=await handleSiteModelMcpRequest(new Request("https://model-site.example/mcp",{method:"GET"}),valid,secrets,forward);
  assert.equal(get.status,405);
  assert.equal(count,0);
});
test("MCP initialize, tools/list exposes exactly six registered 3D tools",async()=>{
  count=0;
  const init=await (await handleSiteModelMcpRequest(request("initialize"),valid,secrets,forward)).json();
  assert.equal(init.result.serverInfo.name,"lizhi-hew-model-private-site");
  const listing=await (await handleSiteModelMcpRequest(request("tools/list"),valid,secrets,forward)).json();
  assert.deepEqual(listing.result.tools.map(t=>t.name),
    ["model_status","model_new_document","model_create_box","model_move","model_scene","model_job_status"]);
  assert.equal(count,0);
});
test("Site /mcp to real Edge core returns a queued 3D job once, not created geometry",async()=>{
  count=0;requests.length=0;
  const args={session_id:session,request_id:requestId,origin_mm:[0,0,0],
    width_mm:1200,depth_mm:600,height_mm:750};
  const r=await handleSiteModelMcpRequest(request("tools/call",7,{name:"model_create_box",arguments:args}),
    valid,secrets,forward);
  assert.equal(r.status,200);
  const value=(await r.json()).result;
  assert.equal(value.isError,false);
  const data=JSON.parse(value.content[0].text);
  assert.equal(data.queued,true);
  assert.equal(data.completed,false);
  assert.equal(data.job_id,jobId);
  assert.equal(count,1);
  assert.deepEqual(requests.map(r=>r.name),
    ["lizhi_model_site_sessions","lizhi_model_site_scene","lizhi_model_site_enqueue"]);
});
test("oversized Site MCP body and invalid tool name do not reach upstream",async()=>{
 count=0;requests.length=0;
 const long=new Request("https://model-site.example/mcp",{method:"POST",
   body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{
      name:"model_status",arguments:{bad:"x".repeat(17000)}}})});
 const a=await handleSiteModelMcpRequest(long,valid,secrets,forward);
 assert.equal(a.status,413);
 const b=await handleSiteModelMcpRequest(request("tools/call",9,{name:"model_delete",arguments:{}}),
    valid,secrets,forward);
 assert.equal((await b.json()).result.isError,true);
 assert.equal(count,0);
});
