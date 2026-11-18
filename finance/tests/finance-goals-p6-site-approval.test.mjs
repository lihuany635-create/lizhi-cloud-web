import test from "node:test";
import assert from "node:assert/strict";
import {handleFinanceSiteMcp} from "../sites/site-worker-adapter.mjs";
import {handleFinanceSiteRequest} from "../../supabase/functions/lizhi-finance-site-mcp/edge-core.mjs";
const TOKEN="a".repeat(64),EMAIL="owner@example.com";
const OWNER="11111111-1111-4111-8111-111111111111";
const GOAL="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REQUEST="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SRC="https://site.example/mcp";
const goalArgs={month:"2026-12",goal_id:GOAL,request_id:REQUEST,
 expected_version:0,action:"create",kind:"savings",target_amount:5000,
 account_id:null};
const frame=(args=goalArgs)=>({jsonrpc:"2.0",id:"write-p6",
 method:"tools/call",params:{name:"finance_goals_goal_set",arguments:args}});
const incoming=(value=frame())=>new Request(SRC,{method:"POST",
 headers:{"content-type":"application/json"},body:JSON.stringify(value)});
function db(){
 const calls=[];
 return {calls,from:()=>({}),async rpc(name,params){
   calls.push({name,params});
   return {data:{month:"2026-12",source:"finance_goals_cloud_snapshot",
     goal_id:GOAL,request_id:REQUEST,status:"created",version:1,committed:true,
     actual_transfer:false},error:null};
 }};
}
function ctx({approve,alter=null}={}){
 const backend=db();
 let forwarded=0,proof=null;
 const env={SITE_FINANCE_OWNER_EMAIL:EMAIL,LIZHI_FINANCE_SITE_MCP_TOKEN:TOKEN};
 const opts={
   verifyOwner:async()=>EMAIL,
   ...(approve!==undefined?{approveGoalWrite:async()=>approve}:{}),
   fetchImpl:async(url,init)=>{
     forwarded++;
     proof=init.headers.get("x-lizhi-goals-write-approval");
     const body=alter?alter(JSON.parse(new TextDecoder().decode(init.body))):init.body;
     const copied=new Headers(init.headers);
     if(alter)copied.set("content-type","application/json");
     return await handleFinanceSiteRequest(new Request(url,{
       method:"POST",headers:copied,body:typeof body==="string"||body instanceof Uint8Array
          ?body:JSON.stringify(body)
     }),{db:backend,token:TOKEN,ownerUid:OWNER,goalToolsEnabled:true});
   }
 };
 return {env,opts,backend,metrics:()=>({forwarded,proof})};
}
test("P6-SITE-01 denies Goals write without a trusted Site approval callback",async()=>{
 const x=ctx();
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 assert.equal(r.status,403);assert.equal(x.metrics().forwarded,0);
});
test("P6-SITE-02 denies Goals write when the real owner rejects confirmation",async()=>{
 const x=ctx({approve:false});
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 assert.equal(r.status,403);assert.equal(x.metrics().forwarded,0);
});
test("P6-SITE-03 Site signed confirmation binds exact request and allows one valid RPC",async()=>{
 const x=ctx({approve:true});
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 const value=await r.json();
 assert.equal(r.status,200);
 assert.equal(value.result.structuredContent.committed,true);
 assert.equal(value.result.structuredContent.actualTransfer,false);
 assert.equal(x.backend.calls.length,1);
 assert.equal(x.backend.calls[0].params.p_owner,OWNER);
 assert.match(x.metrics().proof,/^\d{10}\.[0-9a-f]{64}$/);
 assert.doesNotMatch(JSON.stringify(value),/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
});
test("P6-SITE-04 signed proof fails if payload amount is modified after confirmation",async()=>{
 const x=ctx({approve:true,alter:body=>{
   body.params.arguments.target_amount=5001;return body;
 }});
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 const data=await r.json();
 assert.equal(x.backend.calls.length,0);
 assert.equal(data.result.isError,true);
 assert.match(data.result.content[0].text,/GOALS_EXPLICIT_APPROVAL_REQUIRED/);
});
test("P6-SITE-05 only true owner principal can even attempt write approval",async()=>{
 const x=ctx({approve:true});
 x.opts.verifyOwner=async()=> "not-the-owner@example.com";
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 assert.equal(r.status,403);assert.equal(x.metrics().forwarded,0);
});
test("P6-SITE-06 old MCP gateway rejects CSRF browser origins before forwarding",async()=>{
 const x=ctx({approve:true});
 const req=new Request(SRC,{method:"POST",headers:{origin:"https://attacker.example"},
 body:JSON.stringify(frame())});
 const r=await handleFinanceSiteMcp(req,x.env,x.opts);
 assert.equal(r.status,403);
 assert.equal(x.metrics().forwarded,0);
 assert.equal(x.backend.calls.length,0);
 assert.equal(r.headers.get("access-control-allow-origin"),null);
});
test("P6-SITE-07 unauthorised tool call cannot supply extra owner argument",async()=>{
 const x=ctx({approve:true});
 const forged=frame({...goalArgs,owner_id:OWNER});
 const r=await handleFinanceSiteMcp(incoming(forged),x.env,x.opts);
 const data=await r.json();
 assert.equal(data.result.isError,true);
 assert.equal(x.backend.calls.length,0);
});
