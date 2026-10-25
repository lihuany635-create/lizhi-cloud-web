import test from "node:test";
import assert from "node:assert/strict";
import {handleModelEdgeRequest} from "../supabase/functions/lizhi-model-site-mcp/edge-core.mjs";

const owner="11111111-1111-4111-8111-111111111111";
const session="33333333-3333-4333-8333-333333333333";
const document="44444444-4444-4444-8444-444444444444";
const requestId="55555555-5555-4555-8555-555555555555";
const jobId="66666666-6666-4666-8666-666666666666";
const bearer="a".repeat(64);
const rpc=(name,args={})=>({jsonrpc:"2.0",id:9,method:"tools/call",params:{name,arguments:args}});
const req=body=>new Request("https://example.test/edge",{method:"POST",
 headers:{Authorization:"Bearer "+bearer},body:JSON.stringify(body)});
const result=async response=>(await response.json());
const value=message=>JSON.parse(message.result.content[0].text);
function fixture(){
 const calls=[];
 const data={
  lizhi_model_site_sessions:[{session_id:session,document_id:document}],
  lizhi_model_site_scene:{document_id:document,revision:"v1",entities:[{id:"box_1",name:"Table",kind:"solid",internal:"hidden"}]},
  lizhi_model_site_job:{job_id:jobId,state:"succeeded",error:null},
  lizhi_model_site_enqueue:jobId,
 };
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data:data[name],error:null};}};
 return {calls,data,config:{token:bearer,ownerUid:owner,db}};
}
const box=()=>rpc("model_create_box",{session_id:session,request_id:requestId,
 origin_mm:[0,0,0],width_mm:1200,depth_mm:600,height_mm:750});
test("MCP handshake exposes exactly six bounded tools",async()=>{
 const f=fixture();
 const res=await result(await handleModelEdgeRequest(req({jsonrpc:"2.0",id:1,method:"tools/list"}),f.config));
 assert.deepEqual(res.result.tools.map(x=>x.name),["model_status","model_new_document",
   "model_create_box","model_move","model_scene","model_job_status"]);
 assert.equal(f.calls.length,0);
});
test("wrong bearer and browser Origin are denied before SQL",async()=>{
 const f=fixture();
 const invalid=new Request("https://example.test/edge",{method:"POST",body:JSON.stringify(rpc("model_status"))});
 assert.equal((await handleModelEdgeRequest(invalid,f.config)).status,401);
 const browser=new Request("https://example.test/edge",{method:"POST",
  headers:{Authorization:"Bearer "+bearer,Origin:"https://example.test"},
  body:JSON.stringify(rpc("model_status"))});
 assert.equal((await handleModelEdgeRequest(browser,f.config)).status,403);
 assert.equal(f.calls.length,0);
});
test("box queue uses a pinned owner, document and revision",async()=>{
 const f=fixture();const reply=await result(await handleModelEdgeRequest(req(box()),f.config));
 assert.equal(value(reply).queued,true);assert.equal(value(reply).completed,false);
 assert.deepEqual(f.calls.map(x=>x.name),["lizhi_model_site_sessions","lizhi_model_site_scene","lizhi_model_site_enqueue"]);
 const args=f.calls[2].args;assert.equal(args.p_owner,owner);
 assert.equal(args.p_session,session);assert.equal(args.p_document,document);
 assert.equal(args.p_revision,"v1");assert.equal(args.p_request_id,requestId);
 assert.deepEqual(args.p_params.size_m,[1.2,0.6,0.75]);
});
test("scene projection removes arbitrary fields",async()=>{
 const f=fixture();const reply=await result(await handleModelEdgeRequest(
  req(rpc("model_scene",{session_id:session})),f.config));
 assert.equal(value(reply).entities.length,1);assert.equal(value(reply).entities[0].name,"Table");
 assert.ok(!JSON.stringify(value(reply)).includes("hidden"));
});
test("new document and invalid geometry are rejected without SQL calls",async()=>{
 const f=fixture();
 const a=await result(await handleModelEdgeRequest(req(rpc("model_new_document",
  {session_id:session,request_id:requestId,confirm_new_document:true})),f.config));
 assert.equal(a.result.isError,true);
 const b=await result(await handleModelEdgeRequest(req(rpc("model_create_box",
  {session_id:session,request_id:requestId,origin_mm:[0,0,0],width_mm:-1,depth_mm:600,height_mm:750})),f.config));
 assert.equal(b.result.isError,true);assert.equal(f.calls.length,0);
});
test("oversized request is rejected without using database",async()=>{
 const f=fixture();const oversized=new Request("https://example.test/edge",{method:"POST",
 headers:{Authorization:"Bearer "+bearer},body:"x".repeat(20000)});
 assert.equal((await handleModelEdgeRequest(oversized,f.config)).status,413);
 assert.equal(f.calls.length,0);
});
test("backend errors do not claim completed writes",async()=>{
 const f=fixture();f.config.db.rpc=async(name,args)=>{
  f.calls.push({name,args});if(name==="lizhi_model_site_enqueue")throw new Error("INTERNAL_DB_DETAIL");
  return {data:f.data[name],error:null};
 };
 const reply=await result(await handleModelEdgeRequest(req(box()),f.config));
 assert.equal(reply.result.isError,true);assert.ok(!JSON.stringify(reply).includes("INTERNAL_DB_DETAIL"));
 assert.match(reply.result.content[0].text,/DO_NOT_RETRY/);
});
test("unsupported calls are not forwarded",async()=>{
 const f=fixture();const reply=await result(await handleModelEdgeRequest(
  req(rpc("model_execute_code",{})),f.config));
 assert.equal(reply.result.isError,true);assert.equal(f.calls.length,0);
});
