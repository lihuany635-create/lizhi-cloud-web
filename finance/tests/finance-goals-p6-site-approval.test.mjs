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
     actual_transfer:false,privateToken:"NEVER_RETURN"},error:null};
 }};
}
function ctx({active=true,writes=true,siteOwner=EMAIL,alter=null}={}){
 const backend=db();let forwarded=0;
 const env={SITE_FINANCE_OWNER_EMAIL:EMAIL,LIZHI_FINANCE_SITE_MCP_TOKEN:TOKEN};
 const opts={
   verifyOwner:async()=>siteOwner,
   fetchImpl:async(url,init)=>{
     forwarded++;
     const body=alter?alter(JSON.parse(new TextDecoder().decode(init.body))):init.body;
     return handleFinanceSiteRequest(new Request(url,{method:"POST",
        headers:init.headers,body:typeof body==="string"||body instanceof Uint8Array
          ?body:JSON.stringify(body)}),{
        db:backend,token:TOKEN,ownerUid:OWNER,
        goalToolsEnabled:true,goalWritesEnabled:writes,
        verifyGoalsOwner:async()=>active
      });
   }
 };
 return {env,opts,backend,forwarded:()=>forwarded};
}
test("P6-SITE-01 owner-verified private Site can write a plan without Passkey",async()=>{
 const x=ctx();
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 assert.equal(r.status,200);
 const data=await r.json();
 assert.equal(data.result.structuredContent.committed,true);
 assert.equal(data.result.structuredContent.actualTransfer,false);
 assert.equal(x.backend.calls.length,1);
 assert.equal(x.forwarded(),1);
 assert.doesNotMatch(JSON.stringify(data),/NEVER_RETURN|privateToken/);
});
test("P6-SITE-02 non-owner Site principal is refused before forwarding",async()=>{
 const x=ctx({siteOwner:"attacker@example.test"});
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 assert.equal(r.status,403);
 assert.equal(x.forwarded(),0);
 assert.equal(x.backend.calls.length,0);
});
test("P6-SITE-03 even a valid site bearer cannot write when feature flag is off",async()=>{
 const x=ctx({writes:false});
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 const data=await r.json();
 assert.equal(data.result.isError,true);
 assert.match(data.result.content[0].text,/GOALS_WRITES_DISABLED/);
 assert.equal(x.backend.calls.length,0);
});
test("P6-SITE-04 revoked or missing live owner fails before RPC",async()=>{
 const x=ctx({active:false});
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 const data=await r.json();
 assert.match(data.result.content[0].text,/GOALS_OWNER_NOT_AUTHORIZED/);
 assert.equal(x.backend.calls.length,0);
});
test("P6-SITE-05 injected approval flags and owner id are not privileged",async()=>{
 const x=ctx();
 const r=await handleFinanceSiteMcp(incoming(frame({...goalArgs,
   owner_id:OWNER,confirmed_by_user:true,approved:true})),x.env,x.opts);
 const data=await r.json();
 assert.equal(data.result.isError,true);
 assert.equal(x.backend.calls.length,0);
});
test("P6-SITE-06 browser Origin cannot call the private MCP adapter",async()=>{
 const x=ctx();
 const request=new Request(SRC,{method:"POST",
   headers:{origin:"https://attacker.example"},
   body:JSON.stringify(frame())});
 const r=await handleFinanceSiteMcp(request,x.env,x.opts);
 assert.equal(r.status,403);
 assert.equal(x.forwarded(),0);
 assert.equal(x.backend.calls.length,0);
});
test("P6-SITE-07 Edge requires separate live owner verifier even with correct bearer",async()=>{
 const backend=db();
 const req=new Request("https://example.test/mcp",{
   method:"POST",headers:{"authorization":"Bearer "+TOKEN},
   body:JSON.stringify(frame())});
 const r=await handleFinanceSiteRequest(req,{
   db:backend,token:TOKEN,ownerUid:OWNER,
   goalToolsEnabled:true,goalWritesEnabled:true});
 const data=await r.json();
 assert.match(data.result.content[0].text,/GOALS_OWNER_AUTH_UNAVAILABLE/);
 assert.equal(backend.calls.length,0);
});
test("P6-SITE-08 model cannot perform a real transfer through Goals",async()=>{
 const x=ctx();
 const r=await handleFinanceSiteMcp(incoming(),x.env,x.opts);
 const data=await r.json();
 assert.equal(data.result.structuredContent.actualTransfer,false);
 assert.equal(x.backend.calls[0].name,"lizhi_finance_p5_goal_set");
});
