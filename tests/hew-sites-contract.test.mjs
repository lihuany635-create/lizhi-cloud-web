import test from "node:test";
import assert from "node:assert/strict";
import {MODEL_SITE_TOOLS,validateModelSiteTool,toHewJsonRpc} from "../hew/sites/model-site-contract.mjs";
import {handleModelSiteTool,MODEL_UPSTREAM} from "../sites-migration/hew/site-tools.mjs";
const session_id="11111111-1111-4111-8111-111111111111";
const request_id="22222222-2222-4222-8222-222222222222";
const job_id="33333333-3333-4333-8333-333333333333";
const owner={signedIn:true,verifiedUserEmail:"owner@example.test"};
const secrets={ownerEmail:"owner@example.test",siteMcpToken:"a".repeat(64)};
const box={session_id,request_id,origin_mm:[0,0,0],width_mm:1200,depth_mm:600,height_mm:750,object_name:"Table"};
test("model Site exposes exactly six bounded tools",()=>{
 assert.deepEqual(MODEL_SITE_TOOLS.map(x=>x.name),[
 "model_status","model_new_document","model_create_box",
 "model_move","model_scene","model_job_status"]);
 for(const tool of MODEL_SITE_TOOLS)assert.equal(tool.inputSchema.additionalProperties,false);
});
test("mm -> m converts rectangular solid into atomic official Hew transact",()=>{
 const v=validateModelSiteTool("model_create_box",box);
 assert.equal(v.ok,true);assert.deepEqual(v.params.size_m,[1.2,0.6,0.75]);
 const rpc=toHewJsonRpc(v,77);assert.equal(rpc.method,"hew.doc.transact");
 assert.equal(rpc.id,77);assert.equal(rpc.params.commands.length,3);
 assert.equal(rpc.params.commands[0].method,"hew.sketch.draw_rect");
 assert.deepEqual(rpc.params.commands[0].params.corner_b,[1.2,0.6,0]);
 assert.equal(rpc.params.commands[1].params.distance,0.75);
 assert.deepEqual(rpc.params.commands[1].params.region,{"$ref":"base#/region_id"});
 assert.equal(rpc.params.commands[2].params.name,"Table");
});
test("bad dimensions, unknown fields, NaN and unconfirmed new doc are blocked",()=>{
 for(const payload of [
 {...box,width_mm:-1},{...box,height_mm:Infinity},
 {...box,width_mm:20001},{...box,origin_mm:[NaN,0,0]},
 {...box,file_path:"/etc/passwd"},{...box,extra:{method:"hew.doc.save"}}
 ])assert.equal(validateModelSiteTool("model_create_box",payload).ok,false);
 assert.equal(validateModelSiteTool("model_new_document",{session_id,request_id,confirm_new_document:false}).ok,false);
 assert.throws(()=>toHewJsonRpc(validateModelSiteTool("model_new_document",{session_id,request_id,confirm_new_document:true})),/BROWSER_DOCUMENT_LIFECYCLE_NOT_IMPLEMENTED/);
});
test("move only one bounded entity and reject zero vectors, read tools do not write",()=>{
 assert.equal(validateModelSiteTool("model_move",{session_id,request_id,entity_id:"obj_7",translation_mm:[0,0,0]}).ok,false);
 const v=validateModelSiteTool("model_move",{session_id,request_id,entity_id:"obj_7",translation_mm:[0,300,0]});
 assert.equal(v.ok,true);
 assert.deepEqual(toHewJsonRpc(v).params.commands[0].params.translation,[0,0.3,0]);
 assert.equal(validateModelSiteTool("model_scene",{session_id}).kind,"read");
 assert.equal(validateModelSiteTool("model_job_status",{job_id}).kind,"read");
 assert.equal(validateModelSiteTool("model_execute",{session_id,request_id}).ok,false);
});
test("unsigned and nonowner Site invocations never call upstream",async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error("not expected")};
 for(const auth of [{signedIn:false,verifiedUserEmail:owner.verifiedUserEmail},
  {signedIn:true,verifiedUserEmail:"other@example.test"}]){
  const res=await handleModelSiteTool("model_status",{},auth,secrets,fetcher);
  assert.equal(res.isError,true);
 }
 assert.equal(calls,0);
});
function mocked(reply,onCall=()=>{},code=200){
 return async(url,init)=>{
  assert.equal(url,MODEL_UPSTREAM);assert.equal(init.method,"POST");
  assert.equal(init.redirect,"manual");
  assert.equal(init.headers.Authorization,"Bearer "+secrets.siteMcpToken);
  const req=JSON.parse(init.body);onCall(req);
  return Response.json({jsonrpc:"2.0",id:req.id,
   result:{isError:false,content:[{type:"text",text:JSON.stringify(reply)}]}},{status:code});
 };
}
test("mutation sends one POST and reports queued, not completed",async()=>{
 let count=0;const res=await handleModelSiteTool("model_create_box",box,owner,secrets,
  mocked({ok:true,queued:true,completed:false,job_id},()=>count++));
 assert.equal(count,1);assert.equal(res.isError,false);
 const value=JSON.parse(res.content[0].text);assert.equal(value.completed,false);
 assert.equal(value.automaticRetryAllowed,false);
});
test("job status must be queried separately and sanitized",async()=>{
 const res=await handleModelSiteTool("model_job_status",{job_id},owner,secrets,
  mocked({ok:true,job:{job_id,state:"succeeded",private:"hidden"}}));
 assert.equal(res.isError,false);const v=JSON.parse(res.content[0].text);
 assert.equal(v.state,"succeeded");assert.equal(v.completed,true);
 assert.ok(!res.content[0].text.includes("hidden"));
});
test("network result unknown does not cause automatic retry",async()=>{
 let count=0;const res=await handleModelSiteTool("model_create_box",box,owner,secrets,
  async()=>{count++;throw Error("connection lost")});
 assert.equal(res.isError,true);assert.equal(count,1);
 assert.match(res.content[0].text,/DO_NOT_RETRY/);
});
test("upstream HTTP 401/403/503 are distinguishable",async()=>{
 for(const [status,expected] of [[401,"UNAUTHORIZED"],[403,"FORBIDDEN"],[503,"UNAVAILABLE"]]){
  const res=await handleModelSiteTool("model_status",{},owner,secrets,async()=>new Response(null,{status}));
  assert.equal(res.isError,true);assert.match(res.content[0].text,new RegExp(expected));
 }
});
test("bounded response and strict scene projection",async()=>{
 const res=await handleModelSiteTool("model_scene",{session_id},owner,secrets,mocked({
  ok:true,document_id:"doc_1",revision:"8",entities:[{id:"obj_1",kind:"solid",name:"Table",secret:"hidden"}]
 }));
 assert.equal(res.isError,false);assert.ok(!res.content[0].text.includes("hidden"));
 const big=await handleModelSiteTool("model_status",{},owner,secrets,
  async()=>new Response("x".repeat(33000),{status:200}));
 assert.equal(big.isError,true);assert.match(big.content[0].text,/DO_NOT_RETRY/);
});

test("upstream redirect 302 is rejected without following or sending twice",async()=>{
 let count=0;
 const res=await handleModelSiteTool("model_create_box",box,owner,secrets,
  async()=>{count++;return new Response(null,{status:302,headers:{location:"https://untrusted.example"}})});
 assert.equal(count,1);assert.equal(res.isError,true);
 assert.match(res.content[0].text,/REDIRECT_REFUSED_DO_NOT_RETRY/);
});
