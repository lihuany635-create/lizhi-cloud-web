import test from "node:test";
import assert from "node:assert/strict";
import {P4_TOOLS,callP4FromPrivateSite} from "../../sites-migration/ai-workbench/gridcraft-p4-site-addon.mjs";

const OWNER="verified-owner-2026",BRIDGE="b".repeat(64);
const PREVIEW={doc:"1",sheet:"Sheet1",range:"A3:B3",values:[["測試",456]]};
const common={rpcId:"abc",name:"gridcraft_prepare_write",args:PREVIEW,
 verifiedPrincipal:OWNER,expectedPrincipal:OWNER,bridgeSecret:BRIDGE,p4Enabled:true};

test("Original Site P4 add-on is additive and defaults OFF",async()=>{
 assert.deepEqual(P4_TOOLS.map(t=>t.name),["gridcraft_prepare_write","gridcraft_commit_write"]);
 let calls=0;
 await assert.rejects(()=>callP4FromPrivateSite({...common,p4Enabled:false,
  fetchImpl:async()=>{calls++;throw Error("MUST_NOT_SEND")}}),/P4_GATE_OFF/);
 assert.equal(calls,0);
});
test("Owner and Site secret checked before any upstream request",async()=>{
 let calls=0;
 const fake=async()=>{calls++;return new Response("{}",{status:200})};
 await assert.rejects(()=>callP4FromPrivateSite({...common,verifiedPrincipal:"another-owner",
  fetchImpl:fake}),/UNAUTHORIZED/);
 await assert.rejects(()=>callP4FromPrivateSite({...common,bridgeSecret:"short",
  fetchImpl:fake}),/BRIDGE_NOT_CONFIGURED/);
 assert.equal(calls,0);
});
test("Valid P4 preview goes to exact ORIGINAL GridCraft Edge dispatch endpoint",async()=>{
 let called=false;
 const fetchImpl=async(url,options)=>{
   called=true;
   assert.equal(url,"https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-gridcraft-bridge/site/dispatch");
   assert.equal(options.headers["x-lizhi-gridcraft-actor"],OWNER);
   assert.equal(options.headers["x-lizhi-gridcraft-bridge"],BRIDGE);
   assert.equal(options.redirect,"manual");
   const rpc=JSON.parse(options.body);
   assert.equal(rpc.params.name,"gridcraft_prepare_write");
   assert.deepEqual(rpc.params.arguments,PREVIEW);
   assert.ok(/^[0-9a-f-]{36}$/.test(rpc.params.requestId));
   return new Response(JSON.stringify({jsonrpc:"2.0",id:"abc",result:{content:[{type:"text",text:"preview"}]}}),{status:200});
 };
 const r=await callP4FromPrivateSite({...common,fetchImpl});
 assert.equal(r.result.content[0].text,"preview");
 assert.equal(called,true);
});
test("P4 commit must carry explicit confirmation and a version hash",async()=>{
 const c={preview_id:"12345678-1234-4234-a234-123456789012",
    expected_version:"f".repeat(64),request_id:"4b5db764-3a8b-4a3d-bf09-123456789012",
    owner_confirmed:false};
 await assert.rejects(()=>callP4FromPrivateSite({...common,name:"gridcraft_commit_write",args:c,
  fetchImpl:async()=>{throw Error("UNEXPECTED_NETWORK")}}),/P4_CONFIRMATION_REQUIRED/);
});
test("Upstream redirect and mismatched request response fail closed",async()=>{
 const responses=[
   new Response("",{status:302,headers:{Location:"https://evil.invalid"}}),
   new Response(JSON.stringify({jsonrpc:"2.0",id:"incorrect",result:{}}),{status:200}),
   new Response("<html>",{status:200}),
 ];
 for(const response of responses){
   await assert.rejects(()=>callP4FromPrivateSite({...common,fetchImpl:async()=>response}));
 }
});
