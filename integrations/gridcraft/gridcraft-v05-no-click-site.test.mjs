import test from "node:test";
import assert from "node:assert/strict";
import {callGridcraftNoClick,ONE_CLICK_TOOL_DEFINITIONS} from "../../sites-migration/ai-workbench/gridcraft-v05-no-click-addon.mjs";

const OWNER="legit-owner-2026",SECRET="c".repeat(64);
const preview={doc:"1",sheet:"Sheet1",range:"A3",values:[[123]]};
const commit={preview_id:"12345678-1234-4234-8234-123456789012",
  expected_version:"f".repeat(64),
  request_id:"4b5db764-3a8b-4a3d-bf09-123456789012"};
const common={rpcId:7,verifiedPrincipal:OWNER,expectedPrincipal:OWNER,
  bridgeSecret:SECRET,noClickEnabled:true};
function fakeValidate(expectName,verify,returned="ok"){
 return async (_url,opts)=>{
  const rpc=JSON.parse(opts.body);
  assert.equal(rpc.params.name,expectName);
  verify(rpc.params.arguments);
  assert.equal(opts.headers["x-lizhi-gridcraft-actor"],OWNER);
  assert.equal(opts.headers["x-lizhi-gridcraft-bridge"],SECRET);
  return new Response(JSON.stringify({jsonrpc:"2.0",id:7,result:{
   content:[{type:"text",text:returned}]}}),{status:200});
 };
}
test("Tool set retains original P4 names; public commit has NO owner_confirmed toggle",()=>{
 assert.deepEqual(ONE_CLICK_TOOL_DEFINITIONS.map(x=>x.name),[
   "gridcraft_prepare_write","gridcraft_commit_write"]);
 const commitTool=ONE_CLICK_TOOL_DEFINITIONS.find(x=>x.name==="gridcraft_commit_write");
 assert.deepEqual(commitTool.inputSchema.required,["preview_id","expected_version","request_id"]);
 assert.deepEqual(Object.keys(commitTool.inputSchema.properties),
                  ["preview_id","expected_version","request_id"]);
 assert.equal(commitTool.inputSchema.additionalProperties,false);
 assert.doesNotMatch(commitTool.description,/按下確認|確認頁面/);
 assert.match(commitTool.description,/不需另開確認網頁/);
});
test("No-click gate defaults OFF and prevents network",async()=>{
 let calls=0;
 await assert.rejects(callGridcraftNoClick({...common,noClickEnabled:false,
  name:"gridcraft_prepare_write",args:preview,
  fetchImpl:async()=>{calls++;throw Error("network not allowed")}}),/NO_CLICK_GATE_OFF/);
 assert.equal(calls,0);
});
test("Trusted principal must match owner before network",async()=>{
 for(const principal of ["attacker","",null,123]){
  let called=false;
  await assert.rejects(callGridcraftNoClick({...common,
   verifiedPrincipal:principal,name:"gridcraft_prepare_write",args:preview,
   fetchImpl:async()=>{called=true;throw Error("Unexpected network")}}),/UNAUTHORIZED/);
  assert.equal(called,false);
 }
});
test("Readonly preview still sends owner-authenticated request to original Edge",async()=>{
 const r=await callGridcraftNoClick({...common,name:"gridcraft_prepare_write",
  args:preview,fetchImpl:fakeValidate("gridcraft_prepare_write",args=>assert.deepEqual(args,preview))});
 assert.equal(r.result.content[0].text,"ok");
});
test("Authorized ChatGPT commit no longer needs browser approval or boolean from MCP caller",async()=>{
 const r=await callGridcraftNoClick({...common,
  name:"gridcraft_commit_write",args:commit,
  fetchImpl:fakeValidate("gridcraft_commit_write",args=>{
   assert.deepEqual(args,{...commit,owner_confirmed:true});
  })});
 assert.equal(r.result.content[0].text,"ok");
});
test("Old owner_confirmed boolean (true or false) is rejected at new MCP boundary",async()=>{
 for(const value of [true,false]){
  let called=false;
  await assert.rejects(callGridcraftNoClick({...common,
   name:"gridcraft_commit_write",args:{...commit,owner_confirmed:value},
   fetchImpl:async()=>{called=true;throw Error("unexpected network")}}),/P4_INVALID_ARGS/);
  assert.equal(called,false);
 }
});
test("Unexpected method, arbitrary path, and extra attributes never reach Edge",async()=>{
 for(const [name,args] of [["gridcraft_shell",{command:"dir"}],
   ["gridcraft_commit_write",{...commit,shell:"cmd"}],
   ["gridcraft_prepare_write",{...preview,path:"c:/secret"}]]){
  let called=false;
  await assert.rejects(callGridcraftNoClick({...common,name,args,
   fetchImpl:async()=>{called=true;throw Error("unexpected network")}}));
  assert.equal(called,false);
 }
});
test("Broken short-lived ID or version rejected before network",async()=>{
 for(const args of [
  {...commit,preview_id:"broken"},
  {...commit,expected_version:"x".repeat(64)},
  {...commit,request_id:"nope"},
  {...commit,request_id:undefined}
 ]){
  let called=false;
  await assert.rejects(callGridcraftNoClick({...common,
   name:"gridcraft_commit_write",args,
   fetchImpl:async()=>{called=true;throw Error("unexpected network")}}));
  assert.equal(called,false);
 }
});
test("Preview reply does not advertise legacy approval page",async()=>{
 const legacy={
  ok:true,preview_id:commit.preview_id,doc:"1",sheet:"Sheet1",range:"A3",
  before:[[null]],after:[[123]],expected_version:commit.expected_version,
  approval_url:"https://legacy.invalid/gridcraft/approve?preview=123",
  instruction:"Open browser confirmation page"
 };
 const r=await callGridcraftNoClick({...common,name:"gridcraft_prepare_write",args:preview,
  fetchImpl:fakeValidate("gridcraft_prepare_write",x=>assert.deepEqual(x,preview),JSON.stringify(legacy))});
 const result=JSON.parse(r.result.content[0].text);
 assert.deepEqual(result.after,[[123]]);
 assert.equal(result.approval_url,undefined);
 assert.equal(result.instruction,undefined);
 assert.equal(result.expected_version,commit.expected_version);
});
test("Malformed response fails closed; does not hallucinate a successful write",async()=>{
 await assert.rejects(callGridcraftNoClick({...common,name:"gridcraft_commit_write",
  args:commit,fetchImpl:async()=>new Response("no JSON",{status:200})}),/P4_INVALID_REPLY/);
});
