import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {GOALS_P5_TOOLS,validateGoalsP5} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-p5-contract.mjs";
import {executeGoalsCandidate} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-p5-edge.mjs";
import {handleFinanceSiteRequest} from "../../supabase/functions/lizhi-finance-site-mcp/edge-core.mjs";
const require=createRequire(import.meta.url);
const UI=require("../goals/p5-goals-ui.js");
const OWNER="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const GOAL="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REQUEST="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MONEY="3000";
const goal=(x={})=>({month:"2026-12",goal_id:GOAL,request_id:REQUEST,
  expected_version:0,action:"create",kind:"savings",target_amount:5000,
  account_id:null,...x});
const fund=(x={})=>goal({kind:"sinking_fund",target_amount:7000,
  purpose:"rent",cadence_months:3,due_amount:null,due_month:null,...x});
const alloc=(x={})=>({month:"2026-12",goal_id:GOAL,request_id:REQUEST,
  action:"allocate",amount:3000,source_reference:"2026-12-salary-slice-1",...x});
const db=(data)=>({calls:[],from(){return this},async rpc(proc,args){this.calls.push({proc,args});return {data,error:null}}});
const receipt=(status="created")=>({month:"2026-12",source:"finance_goals_cloud_snapshot",
  goal_id:GOAL,request_id:REQUEST,status,version:1,committed:true,actual_transfer:false});
const expectCode=(fn,code)=>assert.throws(fn,{code});
const uuidSeq=()=>[REQUEST,GOAL][0];

test("P5-01 contract exposes P3 original three + exactly two goal writes",()=>{
 assert.deepEqual(GOALS_P5_TOOLS.map(x=>x.name),[
   "finance_goals_month_report","finance_goals_salary_get","finance_goals_salary_set",
   "finance_goals_goal_set","finance_goals_allocation_set"]);
 assert.ok(GOALS_P5_TOOLS.every(x=>!x.inputSchema.properties.ownerId));
});
test("P5-02 goal create and update accept safe integer amounts and expected versions",()=>{
 assert.equal(validateGoalsP5("finance_goals_goal_set",goal()).ok,true);
 assert.equal(validateGoalsP5("finance_goals_goal_set",goal({action:"update",expected_version:2})).ok,true);
 assert.equal(validateGoalsP5("finance_goals_goal_set",goal({target_amount:5000.5})).ok,false);
 assert.equal(validateGoalsP5("finance_goals_goal_set",goal({action:"update",expected_version:0})).ok,false);
});
test("P5-03 goal removal must not carry funding or kind fields",()=>{
 assert.equal(validateGoalsP5("finance_goals_goal_set",goal({action:"remove",expected_version:2})).ok,false);
 const d={month:"2026-12",goal_id:GOAL,request_id:REQUEST,expected_version:2,action:"remove"};
 assert.equal(validateGoalsP5("finance_goals_goal_set",d).ok,true);
});
test("P5-04 rent and insurance follow matching cadence without inferred bills",()=>{
 assert.equal(validateGoalsP5("finance_goals_goal_set",fund()).ok,true);
 assert.equal(validateGoalsP5("finance_goals_goal_set",fund({purpose:"insurance",cadence_months:3})).code,"GOALS_INVALID_FUND");
 assert.equal(validateGoalsP5("finance_goals_goal_set",fund({due_amount:-1})).ok,false);
 assert.equal(validateGoalsP5("finance_goals_goal_set",fund({due_month:"2026-18"})).ok,false);
});
test("P5-05 ordinary savings cannot carry reserve-specific properties",()=>{
 assert.equal(validateGoalsP5("finance_goals_goal_set",goal({purpose:"rent"})).ok,false);
 assert.equal(validateGoalsP5("finance_goals_goal_set",goal({account_id:""})).ok,false);
 assert.equal(validateGoalsP5("finance_goals_goal_set",goal({owner_id:OTHER})).ok,false);
});
test("P5-06 allocation uses owner authentication, no spoofable confirmation field",()=>{
 assert.equal(validateGoalsP5("finance_goals_allocation_set",alloc()).ok,true);
 assert.equal(GOALS_P5_TOOLS.find(x=>x.name==="finance_goals_allocation_set").inputSchema.required.includes("confirmed_by_user"),false);
 assert.equal(validateGoalsP5("finance_goals_allocation_set",alloc({confirmed_by_user:false})).ok,false);
 assert.equal(validateGoalsP5("finance_goals_allocation_set",alloc({amount:0})).ok,false);
 assert.equal(validateGoalsP5("finance_goals_allocation_set",alloc({source_reference:"  "})).ok,false);
});
test("P5-07 existing P3 read and salary contract remain backwards compatible",()=>{
 assert.equal(validateGoalsP5("finance_goals_month_report",{month:"2026-12"}).ok,true);
 assert.equal(validateGoalsP5("finance_goals_salary_get",{month:"2026-12"}).ok,true);
});
test("P5-08 editor is disabled and clearly honest when provider missing",()=>{
 const html=UI.render();
 assert.match(html,/候選介面/);
 assert.match(html,/新增、修改或停用目標/);
 assert.match(html,/資金預留與釋出/);
 assert.doesNotMatch(html,/人工確認預留與釋出/);
 assert.match(html,/八項薪水分配/);
 assert.match(html,/disabled/);
 assert.doesNotMatch(html,/已存入銀行|正式已啟用/);
});
test("P5-09 account names and labels are HTML escaped",()=>{
 const html=UI.render({enabled:true,accounts:[{id:"a1",name:'<img src=x onerror="alert(1)">'}]});
 assert.doesNotMatch(html,/<img/);
 assert.match(html,/&lt;img/);
});
test("P5-10 create and edit command include explicit version and safe source id",()=>{
 const req={confirmed:"on",month:"2026-12",action:"create",
   kind:"savings",target_amount:"5000",account_id:""};
 const u=[REQUEST,GOAL];const c=UI.buildCommand("goal",req,{goals:[],uuid:()=>u.shift()});
 assert.equal(c.args.goal_id,GOAL);
 assert.equal(c.args.request_id,REQUEST);
 assert.equal(c.args.expected_version,0);
 assert.equal(c.args.account_id,null);
 const update=UI.buildCommand("goal",{...req,action:"update",goal_id:GOAL},{
   goals:[{id:GOAL,version:4}],uuid:()=>REQUEST});
 assert.equal(update.args.expected_version,4);
});
test("P5-11 salary form must balance all eight items to expected income",()=>{
 const base={confirmed:"on",month:"2026-12",action:"set",estimated_income:"43000",
   food:"7000",daily:"1500",transport:"1000",savings:"5000",
   investible_cash:"14650",rent_reserve:"7000",insurance_reserve:"1850",
   credit_card_reserve:"5000"};
 const cmd=UI.buildCommand("salary",base,{uuid:()=>REQUEST});
 assert.equal(cmd.args.lines.length,8);
 assert.equal(cmd.args.estimated_income,43000);
 expectCode(()=>UI.buildCommand("salary",{...base,food:"7001"},{uuid:()=>REQUEST}),
    "SALARY_PLAN_UNBALANCED");
});
test("P5-12 unauthenticated caller denied, owner needs no per-write confirmation",async()=>{
 const backend={calls:[],async invoke(tool,args){this.calls.push({tool,args});return {...receipt("created"),actualTransfer:false}}};
 const no=UI.createController({provider:backend,authenticated:false,uuid:()=>REQUEST});
 await assert.rejects(()=>no.submit("goal",{month:"2026-12",action:"create",
   kind:"savings",target_amount:"5000"}),{code:"GOALS_NOT_CONNECTED"});
 assert.equal(backend.calls.length,0);
 let i=0;const ids=[REQUEST,GOAL];
 const owner=UI.createController({provider:backend,authenticated:true,uuid:()=>ids[i++]});
 const saved=await owner.submit("goal",{month:"2026-12",action:"create",
   kind:"savings",target_amount:"5000"});
 assert.equal(saved.committed,true);
 assert.equal(backend.calls.length,1);
});
test("P5-13 authenticated controller invokes the approved tool only",async()=>{
 const backend={calls:[],async invoke(tool,args){this.calls.push({tool,args});return {...receipt(),actualTransfer:false}}};
 let i=0;const ids=[REQUEST,GOAL];
 const c=UI.createController({provider:backend,authenticated:true,confirmAction:()=>true,uuid:()=>ids[i++]});
 const got=await c.submit("goal",{confirmed:"on",month:"2026-12",action:"create",
  kind:"savings",target_amount:"5000"});
 assert.equal(got.status,"created");
 assert.equal(backend.calls.length,1);
 assert.equal(backend.calls[0].tool,"finance_goals_goal_set");
});
test("P5-14 edge adapter rejects write until trusted approval is supplied",async()=>{
 const backend=db(receipt());
 await assert.rejects(()=>executeGoalsCandidate({db:backend,owner:OWNER},
   "finance_goals_goal_set",goal()),{code:"GOALS_EXPLICIT_APPROVAL_REQUIRED"});
 assert.equal(backend.calls.length,0);
 const result=await executeGoalsCandidate({db:backend,owner:OWNER,approvedWrite:true},
   "finance_goals_goal_set",goal());
 assert.equal(result.committed,true);
 assert.equal(result.actualTransfer,false);
 assert.equal(backend.calls[0].args.p_owner,OWNER);
 assert.equal(backend.calls[0].proc,"lizhi_finance_p5_goal_set");
});
test("P5-15 event adapter returns a bounded receipt with no untrusted secrets",async()=>{
 const backend=db({...receipt("recorded"),version:undefined,bank_verified:false,
   rawAccountNumber:"SECRET"});
 const result=await executeGoalsCandidate({db:backend,owner:OWNER,approvedWrite:true},
   "finance_goals_allocation_set",alloc());
 assert.equal(result.bankVerified,false);
 assert.doesNotMatch(JSON.stringify(result),/SECRET|rawAccountNumber/);
});
test("P5-16 allocation cannot be called for a foreign owner by tool arguments",async()=>{
 const backend=db(receipt());
 await assert.rejects(()=>executeGoalsCandidate({db:backend,owner:OWNER,approvedWrite:true},
   "finance_goals_allocation_set",alloc({owner:OTHER})),{code:"GOALS_INVALID_ALLOCATION"});
 assert.equal(backend.calls.length,0);
});
test("P5-17 receipt status must match requested operation",async()=>{
 const backend=db(receipt("removed"));
 await assert.rejects(()=>executeGoalsCandidate({db:backend,owner:OWNER,approvedWrite:true},
   "finance_goals_goal_set",goal()),{code:"GOALS_RECEIPT_INVALID"});
});
const TOKEN="a".repeat(64);
const request=(frame)=>new Request("https://private.example.invalid/mcp",{
 method:"POST",headers:{"authorization":"Bearer "+TOKEN,"content-type":"application/json"},
 body:JSON.stringify({jsonrpc:"2.0",id:"p5-test",...frame})
});
const gatewayOpts=(x={})=>({db:db(receipt()),token:TOKEN,ownerUid:OWNER,
  verifyBearer:async()=>true,...x});
test("P5-18 existing MCP remains unchanged when feature gate is disabled",async()=>{
 const r=await handleFinanceSiteRequest(request({method:"tools/list"}),gatewayOpts());
 const json=await r.json();
 assert.equal(json.result.tools.some(x=>x.name==="finance_goals_goal_set"),false);
 const denied=await handleFinanceSiteRequest(request({method:"tools/call",params:{
   name:"finance_goals_goal_set",arguments:goal()}}),gatewayOpts());
 const j=await denied.json();
 assert.match(j.result.content[0].text,/GOALS_NOT_CONNECTED/);
});
test("P5-19 goals remain disabled without a live owner verifier",async()=>{
 const opts=gatewayOpts({goalToolsEnabled:true,goalWritesEnabled:true});
 const listing=await (await handleFinanceSiteRequest(request({method:"tools/list"}),opts)).json();
 assert.equal(listing.result.tools.some(x=>x.name==="finance_goals_goal_set"),true);
 const denied=await (await handleFinanceSiteRequest(request({method:"tools/call",params:{
   name:"finance_goals_goal_set",arguments:goal()}}),opts)).json();
 assert.match(denied.result.content[0].text,/GOALS_OWNER_AUTH_UNAVAILABLE/);
 assert.equal(opts.db.calls.length,0);
});
test("P5-20 owner-only enabled write commits once without second approval",async()=>{
 const opts=gatewayOpts({goalToolsEnabled:true,goalWritesEnabled:true,
   verifyGoalsOwner:async()=>true});
 const res=await (await handleFinanceSiteRequest(request({method:"tools/call",params:{
   name:"finance_goals_goal_set",arguments:goal()}}),opts)).json();
 assert.equal(res.result.structuredContent.committed,true);
 assert.equal(res.result.structuredContent.actualTransfer,false);
 assert.equal(opts.db.calls.length,1);
 assert.equal(opts.db.calls[0].args.p_owner,OWNER);
});
test("P5-21 funded goals cannot be removed and get a safe explicit error",async()=>{
 const backend={async rpc(){return {error:{message:"GOALS_RESERVE_NOT_RELEASED: 2000 reserved"}}}};
 await assert.rejects(()=>executeGoalsCandidate({
   db:backend,owner:OWNER,approvedWrite:true
 },"finance_goals_goal_set",goal({action:"remove",expected_version:2,kind:undefined,
 target_amount:undefined,account_id:undefined})),{code:"GOALS_INVALID_ARGS"});
 const remove={month:"2026-12",goal_id:GOAL,request_id:REQUEST,
   expected_version:2,action:"remove"};
 await assert.rejects(()=>executeGoalsCandidate({db:backend,owner:OWNER,
   approvedWrite:true},"finance_goals_goal_set",remove),{code:"GOALS_RESERVE_NOT_RELEASED"});
});
