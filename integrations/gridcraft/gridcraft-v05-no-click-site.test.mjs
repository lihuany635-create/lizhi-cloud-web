import test from "node:test";
import assert from "node:assert/strict";
import {callGridcraftNoClick,ONE_CLICK_TOOL_DEFINITIONS} from "../../sites-migration/ai-workbench/gridcraft-v05-no-click-addon.mjs";

const OWNER="legit-owner-2026",SECRET="c".repeat(64);
const preview={doc:"1",sheet:"Sheet1",range:"A3",values:[["OK"]]};
const commit={preview_id:"12345678-1234-4234-8234-123456789012",
  expected_version:"f".repeat(64),
  request_id:"4b5db764-3a8b-4a3d-bf09-123456789012"};
const common={rpcId:7,verifiedPrincipal:OWNER,expectedPrincipal:OWNER,
  bridgeSecret:SECRET,noClickEnabled:true};
function fakeValidate(expectName,verify){
 return async (_url,opts)=>{
  const rpc=JSON.parse(opts.body);
  assert.equal(rpc.params.name,expectName);
  verify(rpc.params.arguments);
  assert.equal(opts.headers["x-lizhi-gridcraft-actor"],OWNER);
  assert.equal(opts.headers["x-lizhi-gridcraft-bridge"],SECRET);
  return new Response(JSON.stringify({jsonrpc:"2.0",id:7,result:{
   content:[{type:"text",text:"ok"}]}}),{status:200});
 };
}
test("Additive no-click tool set preserves P4 preview and commit names",()=>{
 assert.deepEqual(ONE_CLICK_TOOL_DEFINITIONS.map(x=>x.name),[
   "gridcraft_prepare_write","gridcraft_commit_write"]);
});
test("No-click gate default OFF",async()=>{
 await assert.rejects(callGridcraftNoClick({...common,noClickEnabled:false,
  name:"gridcraft_prepare_write",args:preview,
  fetchImpl:async()=>{throw Error("network not allowed")}}),/NO_CLICK_GATE_OFF/);
});
test("Must verify trusted owner before any Edge request",async()=>{
 let called=false;
 await assert.rejects(callGridcraftNoClick({...common,
  verifiedPrincipal:"attacker",name:"gridcraft_prepare_write",args:preview,
  fetchImpl:async()=>{called=true;return new Response("{}")}}),/UNAUTHORIZED/);
 assert.equal(called,false);
});
test("Readonly preview still performs exactly one owner-verified Edge request",async()=>{
 const r=await callGridcraftNoClick({...common,
  name:"gridcraft_prepare_write",args:preview,
  fetchImpl:fakeValidate("gridcraft_prepare_write",args=>assert.deepEqual(args,preview))});
 assert.equal(r.result.content[0].text,"ok");
});
test("User's authenticated commit requires no browser approval, still passes CAS fields",async()=>{
 const r=await callGridcraftNoClick({...common,
  name:"gridcraft_commit_write",args:commit,
  fetchImpl:fakeValidate("gridcraft_commit_write",args=>{
   assert.deepEqual(args,{...commit,owner_confirmed:true});
  })});
 assert.equal(r.result.content[0].text,"ok");
});
test("Caller explicitly denying write must be honored",async()=>{
 await assert.rejects(callGridcraftNoClick({...common,
  name:"gridcraft_commit_write",args:{...commit,owner_confirmed:false},
  fetchImpl:async()=>{throw Error("unexpected network")}}),/WRITE_DENIED_BY_CALLER/);
});
test("Unexpected methods and injected properties cannot reach Edge",async()=>{
 for(const [name,args] of [["gridcraft_shell",{command:"dir"}],
    ["gridcraft_commit_write",{...commit,shell:"cmd"}],
    ["gridcraft_prepare_write",{...preview,path:"c:/secret"}]]){
  await assert.rejects(callGridcraftNoClick({...common,name,args,
    fetchImpl:async()=>{throw Error("unexpected network")}}));
 }
});
test("Missing preview fields are rejected before Edge",async()=>{
 await assert.rejects(callGridcraftNoClick({...common,
  name:"gridcraft_commit_write",args:{...commit,preview_id:"broken"},
  fetchImpl:async()=>{throw Error("unexpected network")}}),/P4_INVALID_ARGS/);
});
