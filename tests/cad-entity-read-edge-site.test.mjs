import test from "node:test";
import assert from "node:assert/strict";
import {executeEntityReadTool} from "../supabase/functions/lizhi-cad-site-mcp/entity-read-handler.mjs";
import {handleCadEntityReadSiteTool} from "../sites-migration/cad/site-entity-read.mjs";
const session_id="11111111-1111-4111-8111-111111111111",request_id="22222222-2222-4222-8222-222222222222",job_id="33333333-3333-4333-8333-333333333333";
const auth={signedIn:true,verifiedUserEmail:"owner@example.test"};
const secrets={ownerEmail:"owner@example.test",siteMcpToken:"a".repeat(64),entityReadEnabled:true};
test("read-only Edge dispatch enqueues only bounded commands, once",async()=>{
 const calls=[];
 const db={rpc:async(method,args)=>{
  calls.push({method,args});
  return {data:job_id,error:null};
 }};
 const result=await executeEntityReadTool(db,"owner-user","cad_list_entities",{session_id,request_id,limit:8});
 assert.equal(result.queued,true);
 assert.equal(result.completed,false);
 assert.equal(calls.length,1);
 assert.equal(calls[0].method,"lizhi_cad_site_read_enqueue");
 assert.equal(calls[0].args.p_command,"lizhi.entities");
 assert.deepEqual(calls[0].args.p_params,{limit:8,offset:0});
 await executeEntityReadTool(db,"owner-user","cad_list_entities",{session_id,request_id,limit:50});
 assert.equal(calls.length,1);
});
test("read job sanitizes database result before returning it",async()=>{
 const db={rpc:async(method)=>({error:null,data:{job_id,kind:"lizhi.entities",state:"succeeded",data:{
  revision:5,entities:[{handle:"F",type:"LINE",layer:"0",geometry:{start:[0,0],end:[800,900]},path:"secret.dxf"}]}}})};
 const x=await executeEntityReadTool(db,"owner-user","cad_read_job",{job_id});
 assert.equal(x.ok,true);
 assert.equal(x.completed,true);
 assert.equal(JSON.stringify(x).includes("secret.dxf"),false);
});
test("server refuses unsigned, non-owner and read-disabled use without fetch",async()=>{
 let n=0;
 const fetcher=async()=>{n++;throw Error("should not fetch")};
 for(const [a,s] of [[null,secrets],[{signedIn:true,verifiedUserEmail:"bad@example.test"},secrets],[auth,{...secrets,entityReadEnabled:false}]]){
  const r=await handleCadEntityReadSiteTool("cad_inspect_drawing",{session_id,request_id},a,s,fetcher);
  assert.equal(r.isError,true);
 }
 assert.equal(n,0);
});
test("server reads single upstream response with manual redirect policy",async()=>{
 let n=0;
 const fetcher=async(url,opts)=>{
  n++;assert.equal(opts.redirect,"manual");
  assert.equal(opts.headers.Authorization,"Bearer "+secrets.siteMcpToken);
  const req=JSON.parse(opts.body);
  return Response.json({jsonrpc:"2.0",id:req.id,result:{isError:false,content:[{type:"text",
   text:JSON.stringify({ok:true,job_id,queued:true,completed:false})}]}});
 };
 const r=await handleCadEntityReadSiteTool("cad_inspect_drawing",{session_id,request_id},auth,secrets,fetcher);
 assert.equal(n,1);
 assert.equal(r.isError,false);
 assert.equal(JSON.parse(r.content[0].text).completed,false);
});
test("server rejects redirects and malformed upstream receipts without leaking bearer",async()=>{
 let n=0;
 const fetcher=async()=>{n++;return new Response(null,{status:302,headers:{location:"https://attacker.invalid"}})};
 const r=await handleCadEntityReadSiteTool("cad_inspect_drawing",{session_id,request_id},auth,secrets,fetcher);
 assert.equal(n,1);assert.equal(r.isError,true);
 assert.equal(r.content[0].text,"CAD_READ_REDIRECT_REJECTED");
 assert.ok(!JSON.stringify(r).includes(secrets.siteMcpToken));
});
