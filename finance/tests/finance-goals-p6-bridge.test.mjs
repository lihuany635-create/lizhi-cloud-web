import test from "node:test";
import assert from "node:assert/strict";
import {createGoalsBrowserBridge} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-browser-bridge.mjs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const BrowserClient=require("../goals/p6-browser-client.js");
const OWNER="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const GOAL="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REQUEST="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORIGIN="https://lihuany635-create.github.io";
const SECRET="9".repeat(64);
const base=(x={})=>({month:"2026-12",goal_id:GOAL,request_id:REQUEST,
 expected_version:0,action:"create",kind:"savings",target_amount:5000,
 account_id:null,...x});
function request(action,tool,args,opts={}){
 return new Request("https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-finance-site-mcp/ui/goals",{
  method:opts.method||"POST",
  headers:{"origin":opts.origin||ORIGIN,
    "authorization":"Bearer "+(opts.token||"valid-owner-access-token"),
    "content-type":"application/json"},
  body:JSON.stringify({action,tool,args,...opts.extra})
 });
}
function fakeDB(){
 const calls=[];
 return {calls,async rpc(proc,args){calls.push({proc,args});
   if(proc==="lizhi_finance_p3_month_report")return {data:{
    month:"2026-12",source:"finance_goals_cloud_snapshot",plan:null,goals:[],funds:[]},error:null};
   if(proc==="lizhi_finance_p5_goal_set")return {data:{
    month:"2026-12",source:"finance_goals_cloud_snapshot",goal_id:GOAL,
    request_id:REQUEST,status:"created",version:1,
    committed:true,actual_transfer:false,privateToken:"NEVER_RETURN"},error:null};
   return {data:null,error:{message:"UNEXPECTED_RPC"}}}
 };
}
const make=(x={})=>{const db=x.db||fakeDB();return {db,bridge:createGoalsBrowserBridge({
 db,ownerUid:OWNER,secret:SECRET,origins:[ORIGIN],
 verifyUser:async jwt=>jwt==="valid-owner-access-token"?{id:OWNER}:null,
 clock:()=>1_800_000_000_000,...x
 })}};
async function call(bridge,action,tool,args,options){const r=await bridge.handle(
 request(action,tool,args,options));return {status:r.status,data:await r.json(),headers:r.headers};}

test("P6-01 refuses all browser goals endpoints if secret or origins missing",async()=>{
 const db=fakeDB(),bridge=createGoalsBrowserBridge({
  db,ownerUid:OWNER,secret:"",origins:[ORIGIN],verifyUser:()=>({id:OWNER})});
 assert.equal(bridge.configured,false);
 const r=await call(bridge,"read","finance_goals_month_report",{month:"2026-12"});
 assert.equal(r.status,503);
 assert.equal(db.calls.length,0);
});
test("P6-02 disallows arbitrary origins and has no public wildcard CORS",async()=>{
 const {bridge,db}=make();
 const r=await call(bridge,"read","finance_goals_month_report",
  {month:"2026-12"},{origin:"https://attacker.example"});
 assert.equal(r.status,403);
 assert.equal(r.headers.get("access-control-allow-origin"),null);
 assert.equal(db.calls.length,0);
});
test("P6-03 requires verified Supabase JWT and exact fixed owner",async()=>{
 const {bridge,db}=make();
 const unauth=await call(bridge,"read","finance_goals_month_report",
  {month:"2026-12"},{token:"wrong"});
 assert.equal(unauth.status,403);
 assert.equal(db.calls.length,0);
 const foreign=make({verifyUser:()=>({id:OTHER})});
 const denied=await call(foreign.bridge,"read","finance_goals_month_report",{month:"2026-12"});
 assert.equal(denied.status,403);
 assert.equal(foreign.db.calls.length,0);
});
test("P6-04 reads minimal goal report with per-owner source and no secrets",async()=>{
 const {bridge,db}=make();
 const r=await call(bridge,"read","finance_goals_month_report",{month:"2026-12"});
 assert.equal(r.status,200);
 assert.equal(r.data.result.month,"2026-12");
 assert.equal(r.headers.get("access-control-allow-origin"),ORIGIN);
 assert.equal(db.calls[0].args.p_owner,OWNER);
 assert.equal(db.calls[0].proc,"lizhi_finance_p3_month_report");
 assert.equal(r.headers.get("cache-control"),"private, no-store");
});
test("P6-05 cannot substitute caller owner or SQL fields in args",async()=>{
 const {bridge,db}=make();
 const r=await call(bridge,"read","finance_goals_month_report",
  {month:"2026-12",ownerId:OTHER});
 assert.equal(r.status,422);
 assert.equal(db.calls.length,0);
});
test("P6-06 a browser cannot mutate via a read action",async()=>{
 const {bridge,db}=make();
 const r=await call(bridge,"read","finance_goals_goal_set",base());
 assert.equal(r.status,400);
 assert.equal(db.calls.length,0);
});
test("P6-07 write requires a signed prepare/commit challenge plus approval",async()=>{
 const {bridge,db}=make();
 const prepared=await call(bridge,"prepare","finance_goals_goal_set",base());
 assert.equal(prepared.status,200);
 assert.equal(prepared.data.requiresExplicitConfirmation,true);
 assert.equal(db.calls.length,0);
 const noApproval=await call(bridge,"commit","finance_goals_goal_set",base(),
  {extra:{proof:prepared.data.proof,approved:false}});
 assert.equal(noApproval.status,403);
 assert.equal(db.calls.length,0);
 const done=await call(bridge,"commit","finance_goals_goal_set",base(),
  {extra:{proof:prepared.data.proof,approved:true}});
 assert.equal(done.status,200);
 assert.equal(done.data.result.committed,true);
 assert.equal(done.data.result.actualTransfer,false);
 assert.equal(db.calls.length,1);
 assert.doesNotMatch(JSON.stringify(done.data),/privateToken|NEVER_RETURN/);
});
test("P6-08 a proof is cryptographically bound to the exact amount and version",async()=>{
 const {bridge,db}=make();
 const prepared=await call(bridge,"prepare","finance_goals_goal_set",base());
 const r=await call(bridge,"commit","finance_goals_goal_set",base({target_amount:5001}),
  {extra:{proof:prepared.data.proof,approved:true}});
 assert.equal(r.status,403);
 assert.equal(db.calls.length,0);
});
test("P6-09 a changed request_id cannot reuse a previous approval",async()=>{
 const {bridge}=make();
 const prepared=await call(bridge,"prepare","finance_goals_goal_set",base());
 const r=await call(bridge,"commit","finance_goals_goal_set",
  base({request_id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc"}),
  {extra:{proof:prepared.data.proof,approved:true}});
 assert.equal(r.status,403);
});
test("P6-10 stale approval proof is rejected after three minutes",async()=>{
 let now=1_800_000_000_000;
 const {bridge,db}=make({clock:()=>now});
 const prepared=await call(bridge,"prepare","finance_goals_goal_set",base());
 now+=180001;
 const r=await call(bridge,"commit","finance_goals_goal_set",base(),
  {extra:{proof:prepared.data.proof,approved:true}});
 assert.equal(r.status,403);
 assert.equal(db.calls.length,0);
});
test("P6-11 forged approval signature and malformed base64 are rejected",async()=>{
 const {bridge,db}=make();
 const prepared=await call(bridge,"prepare","finance_goals_goal_set",base());
 const forged=prepared.data.proof.slice(0,-3)+"bad";
 const r=await call(bridge,"commit","finance_goals_goal_set",base(),
  {extra:{proof:forged,approved:true}});
 assert.equal(r.status,403);
 assert.equal(db.calls.length,0);
});
test("P6-12 unknown tool and unrecognised extra JSON fields are denied",async()=>{
 const {bridge}=make();
 const unknown=await call(bridge,"read","finance_goals_execute_sql",{month:"2026-12"});
 assert.equal(unknown.status,400);
 const extra=await call(bridge,"prepare","finance_goals_goal_set",base(),
  {extra:{owner:OTHER}});
 assert.equal(extra.status,400);
});
test("P6-13 bridge read stays robust when the backend is unavailable",async()=>{
 const db={rpc:async()=>({error:{message:"DATABASE_PASSWORD_IS_SECRET"}})};
 const {bridge}=make({db});
 const r=await call(bridge,"read","finance_goals_month_report",{month:"2026-12"});
 assert.equal(r.status,503);
 assert.doesNotMatch(JSON.stringify(r.data),/DATABASE_PASSWORD_IS_SECRET/);
});
test("P6-14 browser client formats planning separately from bank evidence",()=>{
 const report=BrowserClient.reportFromPayload("2026-12",{
  month:"2026-12",goals:[],funds:[],
  plan:{id:GOAL,estimated_income:43000,version:1,
    lines:[
      ["food",7000],["daily",1500],["transport",1000],["savings",5000],
      ["investible_cash",14650],["rent_reserve",7000],
      ["insurance_reserve",1850],["credit_card_reserve",5000]
    ].map(([category,amount])=>({category,amount}))}
 });
 assert.equal(report.allocation.spendingPlan,9500);
 assert.equal(report.allocation.fixedSavings,5000);
 assert.equal(report.allocation.investmentCashPool,23500);
 assert.equal(report.allocation.flexibleInvestible,14650);
 assert.equal(report.allocation.protectedReserve,8850);
 assert.equal(report.actualSalaryReceived,null);
 assert.equal(report.actualTrades,0);
});
test("P6-15 browser client fail closes on owner change between remote and readback",async()=>{
 let owner=OWNER;const access={user:{id:OWNER},access_token:"test-owner-jwt"};
 const client={supabaseUrl:"https://hrdzywkihfqggiwjgavi.supabase.co",
  auth:{getSession:async()=>({data:{session:access},error:null}),
    getUser:async()=>({data:{user:{id:owner}},error:null})}};
 const gateway=BrowserClient.create({
  getAuth:()=>({client,user:{id:OWNER}}),
  owner:async()=>owner,
  doFetch:async()=>{owner=OTHER;return Response.json({ok:true,result:{
    month:"2026-12",plan:null,goals:[],funds:[]}})}
 });
 await assert.rejects(()=>gateway.readMonth("2026-12"),{code:"GOALS_IDENTITY_CHANGED"});
});
test("P6-16 caller cannot replace original project endpoint or gain admin token",()=>{
 assert.equal(BrowserClient.PROJECT,"hrdzywkihfqggiwjgavi");
 assert.match(BrowserClient.URL,/^https:\/\/hrdzywkihfqggiwjgavi.supabase.co\/functions/);
 assert.doesNotMatch(BrowserClient.URL,/service_role|site_mcp_token/i);
});
