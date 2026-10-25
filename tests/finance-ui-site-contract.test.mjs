import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {FINANCE_SITE_TOOLS,FINANCE_UI_SITE_TOOLS,validateFinanceUiTool} from "../supabase/functions/lizhi-finance-site-mcp/site-contract.mjs";
import {handleFinanceSiteRequest} from "../supabase/functions/lizhi-finance-site-mcp/edge-core.mjs";

const OWNER="84b34232-26ed-49c2-b160-e7fdbf80e8cf";
const SESSION="6ccae67d-6393-480a-a2c5-6fd50cf53bf0";
const REQUEST="a08265bb-a1aa-4cdf-b767-1eb7a49c3e53";
const TOKEN="a".repeat(64);
const URL="https://localhost.invalid/rpc";
const call=(name,args={})=>new Request(URL,{method:"POST",headers:{
  "Authorization":"Bearer "+TOKEN},body:JSON.stringify({jsonrpc:"2.0",id:17,method:"tools/call",params:{name,arguments:args}})});
function fakeDb({result=[],error=null}={}){
  const calls=[];
  return {calls,db:{rpc:async(name,args)=>{calls.push({name,args});return {data:result,error}},
    from:()=>{throw Error("finance record table should not be queried for UI")}}};
}
async function run(name,args,fixture=fakeDb()){
  const response=await handleFinanceSiteRequest(call(name,args),{
    db:fixture.db,token:TOKEN,ownerUid:OWNER});
  return {response,result:await response.json(),calls:fixture.calls};
}
test("FIN-SITE-UI-01 five original finance tools stay unchanged",()=>{
  assert.deepEqual(FINANCE_SITE_TOOLS.map(x=>x.name),[
    "finance_status","finance_accounts","finance_cards","finance_month_summary","finance_recent_transactions"]);
  assert.deepEqual(FINANCE_UI_SITE_TOOLS.map(x=>x.name),[
    "finance_ui_sessions","finance_ui_inspect","finance_ui_action","finance_ui_job"]);
});
test("FIN-SITE-UI-02 valid operation maps to bounded structured queue",()=>{
  const r=validateFinanceUiTool("finance_ui_action",{
    session_id:SESSION,request_id:REQUEST,revision:"rev",ref:"u2",action:"fill",value:"120"});
  assert.equal(r.ok,true);
  assert.equal(r.args.operation,"interact");
  assert.deepEqual(r.args.params,{revision:"rev",ref:"u2",action:"fill",value:"120"});
});
test("FIN-SITE-UI-03 reject arbitrary commands, arbitrary extra properties, unbounded text",()=>{
  const common={session_id:SESSION,request_id:REQUEST,revision:"rev",ref:"u2"};
  for(const more of [
    {action:"eval",value:"script"},{action:"click",script:"evil"},
    {action:"fill",value:"x".repeat(301)},{action:"click",value:"x"},
    {action:"click",confirm:"true"},{action:"select"},
    {action:"fill",value:"100",confirm:true}]) {
    assert.equal(validateFinanceUiTool("finance_ui_action",{...common,...more}).ok,false);
  }
  assert.equal(validateFinanceUiTool("finance_ui_sql",{}).ok,false);
});
test("FIN-SITE-UI-04 uses server-configured owner, never caller-supplied owner",async()=>{
  const fixture=fakeDb({result:[{session_id:SESSION}]});
  const out=await run("finance_ui_sessions",{},fixture);
  assert.equal(out.result.result.structuredContent.sessions.length,1);
  assert.deepEqual(out.calls,[{name:"lizhi_finance_ui_site_sessions",args:{p_owner:OWNER}}]);
  const nope=await run("finance_ui_sessions",{owner:OWNER});
  assert.equal(nope.result.result.isError,true);
});
test("FIN-SITE-UI-05 queues once, returns queued not completed",async()=>{
  const fixture=fakeDb({result:REQUEST});
  const out=await run("finance_ui_inspect",{session_id:SESSION,request_id:REQUEST},fixture);
  assert.equal(out.result.result.structuredContent.queued,true);
  assert.equal(out.result.result.structuredContent.completed,false);
  assert.deepEqual(out.calls,[{name:"lizhi_finance_ui_site_enqueue",args:{
    p_owner:OWNER,p_session:SESSION,p_request_id:REQUEST,p_operation:"inspect",p_params:{}}}]);
});
test("FIN-SITE-UI-06 errors never fall back to database writes",async()=>{
  const fixture=fakeDb({result:null,error:{message:"access denied"}});
  const out=await run("finance_ui_action",{session_id:SESSION,request_id:REQUEST,
    revision:"rev",ref:"u0",action:"click",confirm:true},fixture);
  assert.equal(out.result.result.isError,true);
  assert.equal(out.calls.length,1);
  assert.match(out.result.result.content[0].text,/NOT_AUTHORIZED/);
});
test("FIN-SITE-UI-07 job lookup owner-scoped and not a save guarantee",async()=>{
  const fixture=fakeDb({result:{job_id:REQUEST,state:"succeeded",result:{completed:false,dispatched:true}}});
  const out=await run("finance_ui_job",{job_id:REQUEST},fixture);
  assert.equal(out.result.result.structuredContent.completed,true);
  assert.equal(out.result.result.structuredContent.job.result.completed,false);
  assert.deepEqual(out.calls[0].args,{p_owner:OWNER,p_job:REQUEST});
});
test("FIN-SITE-UI-08 SQL migration has restricted grants and no ledger updates",()=>{
  const sql=fs.readFileSync(new URL("../supabase/migrations/20261025162500_lizhi_finance_ui_control.sql",import.meta.url),"utf8");
  assert.match(sql,/grant execute on function public\.lizhi_finance_ui_site_enqueue[^\n]+to service_role/);
  assert.doesNotMatch(sql,/grant execute on function public\.lizhi_finance_ui_site_enqueue[^\n]+to authenticated/);
  assert.match(sql,/nullif\(auth\.jwt\(\)->>'client_id',''\) is not null/);
  assert.doesNotMatch(sql,/\b(?:update|delete from|insert into)\s+(?:public\.)?lizhi_finance_records\b/i);
});
