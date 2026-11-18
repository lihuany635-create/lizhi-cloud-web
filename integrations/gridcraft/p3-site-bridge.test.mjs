import test from "node:test";
import assert from "node:assert/strict";
import {GRIDCRAFT_TOOLS, GRIDCRAFT_TOOL_SET, callGridcraftFromSite}
  from "../../sites-migration/ai-workbench/gridcraft-p3-bridge.mjs";

const OWNER="verified-owner-2026";
const KEY="site-secret-only-never-published".repeat(2);
const common={rpcId:"rpc-17",name:"gridcraft_status",args:{},verifiedPrincipal:OWNER,
 expectedPrincipal:OWNER,bridgeSecret:KEY,enabled:true};
const fakeFetch=async (_url,opt)=>new Response(
 JSON.stringify({jsonrpc:"2.0",id:"rpc-17",result:{content:[{type:"text",text:"READY"}]}}),
 {status:200,headers:{"Content-Type":"application/json"}}
);
test("Site advertises exactly three strictly readonly gridcraft tools",()=>{
 assert.deepEqual(GRIDCRAFT_TOOLS.map(x=>x.name),["gridcraft_status","gridcraft_list_workbooks","gridcraft_read_range"]);
 assert.ok(GRIDCRAFT_TOOLS.every(x=>x.annotations.readOnlyHint===true));
 assert.equal(GRIDCRAFT_TOOL_SET.has("gridcraft_set_cell"),false);
});
test("gate default off even if caller claims owner",async()=>{
 await assert.rejects(()=>callGridcraftFromSite({...common,enabled:false,fetchImpl:fakeFetch}),/GRIDCRAFT_GATE_OFF/);
 await assert.rejects(()=>callGridcraftFromSite({...common,enabled:undefined,fetchImpl:fakeFetch}),/GRIDCRAFT_GATE_OFF/);
});
test("trusted Site principal required, no user-supplied owner field",async()=>{
 for(const who of ["attacker",undefined,null,""]){
   await assert.rejects(()=>callGridcraftFromSite({...common,verifiedPrincipal:who,fetchImpl:fakeFetch}),/UNAUTHORIZED/);
 }
});
test("trusted server-only Secret and method validation",async()=>{
 await assert.rejects(()=>callGridcraftFromSite({...common,bridgeSecret:"short",fetchImpl:fakeFetch}),/BRIDGE_NOT_CONFIGURED/);
 await assert.rejects(()=>callGridcraftFromSite({...common,name:"gridcraft_set_cell",fetchImpl:fakeFetch}),/METHOD_DENIED/);
 await assert.rejects(()=>callGridcraftFromSite({...common,args:{path:"C:/Windows"},fetchImpl:fakeFetch}),/INVALID_ARGS/);
});
test("valid bounded range forwarded to fixed trusted Edge HTTPS endpoint",async()=>{
 let called=false;
 const fetchImpl=async(url,opt)=>{
   called=true;
   assert.equal(url,"https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-gridcraft-bridge/site");
   assert.equal(opt.redirect,"manual");
   assert.equal(opt.headers["x-lizhi-gridcraft-actor"],OWNER);
   assert.equal(opt.headers["x-lizhi-gridcraft-bridge"],KEY);
   const body=JSON.parse(opt.body);
   assert.equal(body.method,"tools/call");
   assert.deepEqual(body.params.arguments,{doc:"book-1",sheet:"估價清單",range:"B3:D3"});
   assert.ok(typeof body.params.requestId==="string");
   return new Response(JSON.stringify({jsonrpc:"2.0",id:"rpc-17",result:{content:[{type:"text",text:"ok"}]}}),{status:200});
 };
 const reply=await callGridcraftFromSite({...common,name:"gridcraft_read_range",args:{doc:"book-1",sheet:"估價清單",range:"B3:D3"},fetchImpl});
 assert.equal(reply.result.content[0].text,"ok");
 assert.ok(called);
});
test("large ranges, arbitrary doc paths and extra fields denied before network",async()=>{
 let calls=0;
 const f=async()=>{calls++;return fakeFetch()};
 const args=[
 {doc:"book-1",sheet:"Main",range:"A1:ZZ1000"},
 {doc:"../book",sheet:"Main",range:"A1"},
 {doc:"book-1",sheet:"Main",range:"A1",cmd:"delete"},
 {doc:"book-1",sheet:"Main",range:"A1:U20"},
 ];
 for(const arg of args)await assert.rejects(()=>callGridcraftFromSite({...common,name:"gridcraft_read_range",args:arg,fetchImpl:f}));
 assert.equal(calls,0);
});
test("upstream errors, redirects, malformed JSON and wrong IDs fail closed",async()=>{
 for(const response of [
  new Response("Oops",{status:503}),
  new Response("",{status:302,headers:{Location:"https://evil.invalid"}}),
  new Response("<html>",{status:200}),
  new Response(JSON.stringify({jsonrpc:"2.0",id:"other",result:{}}),{status:200}),
  new Response("x".repeat(40000),{status:200}),
 ]){
  await assert.rejects(()=>callGridcraftFromSite({...common,fetchImpl:async()=>response}));
 }
});
