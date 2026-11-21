import test from "node:test";
import assert from "node:assert/strict";
import {
  P4_SAVE_TOOLS,validateP4SaveCall,callP4SaveFromPrivateSite
} from "../../sites-migration/ai-workbench/gridcraft-v054-save-addon.mjs";

const OWNER="verified-gridcraft-owner";
const BRIDGE="a".repeat(64);
const RID="123e4567-e89b-42d3-a456-426614174000";
const CID="123e4567-e89b-42d3-a456-426614174001";
const args={doc:"1",file_name:"P4-SafeCopy.xlsx"};
const common={rpcId:"test-1",name:"gridcraft_save_prepare",args,
  verifiedPrincipal:OWNER,expectedPrincipal:OWNER,bridgeSecret:BRIDGE,
  p4SaveEnabled:true};

test("Additive SafeSave tool list never includes raw file path or app.save",()=>{
 assert.deepEqual(P4_SAVE_TOOLS.map(x=>x.name),
 ["gridcraft_save_prepare","gridcraft_save_commit","gridcraft_save_status"]);
 assert.ok(P4_SAVE_TOOLS.every(x=>x.inputSchema.additionalProperties===false));
 assert.ok(!P4_SAVE_TOOLS.some(x=>JSON.stringify(x).includes("file_path")));
});
test("SafeSave gate defaults OFF before any HTTP",async()=>{
 let count=0;
 await assert.rejects(()=>callP4SaveFromPrivateSite({...common,p4SaveEnabled:false,fetchImpl:async()=>{count++;}}),/P4_SAVE_GATE_OFF/);
 await assert.rejects(()=>callP4SaveFromPrivateSite({...common,p4SaveEnabled:undefined,fetchImpl:async()=>{count++;}}),/P4_SAVE_GATE_OFF/);
 assert.equal(count,0);
});
test("Owner identity and bridge configuration are fail-closed",async()=>{
 let count=0;const fake=async()=>{count++;return new Response('{}')};
 await assert.rejects(()=>callP4SaveFromPrivateSite({...common,verifiedPrincipal:"intruder",fetchImpl:fake}),/UNAUTHORIZED/);
 await assert.rejects(()=>callP4SaveFromPrivateSite({...common,bridgeSecret:"short",fetchImpl:fake}),/BRIDGE_NOT_CONFIGURED/);
 assert.equal(count,0);
});
test("Reject any remote path, reserved name or shape bypass",()=>{
 for(const name of ["../out.xlsx","C:\\Users\\out.xlsx","\\\\host\\out.xlsx","CON.xlsx",
   "a.xlsx:evil","file.xls","a..xlsx"," .xlsx","mark\u202e.xlsx","out?.xlsx"]){
   assert.throws(()=>validateP4SaveCall("gridcraft_save_prepare",{doc:"1",file_name:name}));
 }
 assert.throws(()=>validateP4SaveCall("gridcraft_save_prepare",{doc:"1",file_name:"ok.xlsx",path:"C:\\windows"}));
 assert.throws(()=>validateP4SaveCall("gridcraft_save_prepare",{doc:"0",file_name:"ok.xlsx"}));
 assert.throws(()=>validateP4SaveCall("gridcraft_save_prepare",{doc:"18446744073709551616",file_name:"ok.xlsx"}));
});
test("Require explicit owner confirmation and narrow status boolean",()=>{
 const commit={preview_id:RID,request_id:CID,expected_version:"a".repeat(64),owner_confirmed:false};
 assert.throws(()=>validateP4SaveCall("gridcraft_save_commit",commit),/P4_CONFIRMATION_REQUIRED/);
 assert.deepEqual(validateP4SaveCall("gridcraft_save_commit",{...commit,owner_confirmed:true}),
                  {...commit,owner_confirmed:true});
 assert.throws(()=>validateP4SaveCall("gridcraft_save_status",{request_id:RID,verify_disk:"true"}),/P4_INVALID_ARGS/);
 assert.deepEqual(validateP4SaveCall("gridcraft_save_status",{request_id:RID,verify_disk:true}),
                 {request_id:RID,verify_disk:true});
});
test("Send authenticated request to the same single Edge, never auto-follow redirect",async()=>{
 let count=0;
 const fake=async(url,init)=>{
   count++;
   assert.equal(url,"https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-gridcraft-bridge/site/dispatch");
   assert.equal(init.method,"POST");
   assert.equal(init.redirect,"manual");
   assert.equal(init.headers["x-lizhi-gridcraft-actor"],OWNER);
   assert.equal(init.headers["x-lizhi-gridcraft-bridge"],BRIDGE);
   const body=JSON.parse(init.body);
   assert.equal(body.params.name,"gridcraft_save_prepare");
   assert.deepEqual(body.params.arguments,args);
   assert.match(body.params.requestId,/^[0-9a-f-]{36}$/i);
   return new Response(JSON.stringify({jsonrpc:"2.0",id:"test-1",result:{content:[{type:"text",text:"REDACTED"}]}}),{status:200});
 };
 const response=await callP4SaveFromPrivateSite({...common,fetchImpl:fake});
 assert.equal(count,1);assert.equal(response.result.content[0].text,"REDACTED");
});
test("Reject redirect, malformed JSON, mismatched RPC id, bad timeout without retry",async()=>{
 const responses=[
   new Response("",{status:302,headers:{"Location":"https://evil.invalid/"}}),
   new Response("<html>",{status:200}),
   new Response(JSON.stringify({jsonrpc:"2.0",id:"wrong",result:{}}),{status:200})
 ];
 for(const r of responses)await assert.rejects(()=>callP4SaveFromPrivateSite({...common,fetchImpl:async()=>r}));
 await assert.rejects(()=>callP4SaveFromPrivateSite({...common,timeoutMs:900}));
});
