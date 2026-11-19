import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createGoal} from "../goals/p1-goal-model.mjs";
import {createSinkingFund,sampleDecember2026} from "../goals/p2-salary-sinking-model.mjs";
import {buildMonthlyGoalReport} from "../goals/p3-monthly-report.mjs";
import {validateGoalsP3} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-p3-contract.mjs";
import {executeGoalsP3} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-p3-edge.mjs";
const require=createRequire(import.meta.url);
const UI=require("../goals/p3-goals-ui.js");

const OWNER="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const ID="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FUND_ID="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REQUEST="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const salaryPlan=()=>sampleDecember2026({ownerId:OWNER,id:ID});
const fund=()=>createSinkingFund({ownerId:OWNER,id:FUND_ID,
  month:"2026-12",purpose:"rent",monthlyContribution:7000,cadenceMonths:3});
const snapshot=()=>({ownerId:OWNER,month:"2026-12",
  salaryPlan:salaryPlan(),goals:[fund().goal],funds:[fund().fund],events:[],
  expenseBudget:{ownerId:OWNER,month:"2026-12",amount:9500}});
const db=(result)=>({calls:[],async rpc(name,args){
  this.calls.push({name,args});return {data:result,error:null};
}});
const readParams={month:"2026-12"};
const basePlan=()=>({
  id:ID,estimated_income:43000,version:1,
  lines:salaryPlan().lines.map(l=>({
    category:l.category,amount:l.amount,accountRole:l.accountRole,
    accountId:l.accountId
  }))
});
const response={
  month:"2026-12",source:"finance_goals_cloud_snapshot"
};
const error=(fn,code)=>assert.throws(fn,{code});

test("P4-01 month report rejects foreign goal rather than silently dropping it",()=>{
  const s=snapshot();
  s.goals.push(createGoal({ownerId:OTHER,id:ID,month:"2026-12",
    kind:"savings",targetAmount:100}));
  error(()=>buildMonthlyGoalReport(s),"GOAL_REPORT_UNTRUSTED_OWNER");
});
test("P4-02 month report rejects foreign event and fund snapshots",()=>{
  const s=snapshot();
  error(()=>buildMonthlyGoalReport({...s,events:[{ownerId:OTHER}]}),
    "GOAL_REPORT_UNTRUSTED_OWNER");
  error(()=>buildMonthlyGoalReport({...s,funds:[{...fund().fund,ownerId:OTHER}]}),
    "GOAL_REPORT_UNTRUSTED_OWNER");
});
test("P4-03 monthly report does not invent salary receipt or actual securities trades",()=>{
  const r=buildMonthlyGoalReport(snapshot());
  assert.equal(r.realBankTransfers,0);
  assert.equal(r.actualTrades,0);
  assert.equal(r.accountBalancesVerified,false);
  assert.equal(r.actualSalaryReceived,null);
  assert.equal(r.userConfirmed.protectedFunds,0);
});
test("P4-04 card reserve and transfer amounts stay out of expenseBudget",()=>{
  const r=buildMonthlyGoalReport(snapshot());
  assert.equal(r.separatelyConfiguredExpenseBudget,9500);
  assert.equal(r.allocation.spendingPlan,9500);
  assert.equal(r.allocation.creditCardReserve,5000);
  assert.equal(r.allocation.investmentCashPool,23500);
  assert.equal(r.allocation.flexibleInvestible,14650);
  assert.equal(r.allocation.protectedReserve,8850);
});
test("P4-05 UI escapes untrusted RPC metadata and never displays sample when not wired",()=>{
  const r=buildMonthlyGoalReport(snapshot());
  const html=UI.render({report:{...r,source:'<img src=x onerror="hack()">',
    syncStatus:'<script>alert(1)</script>'},state:"synced"});
  assert.doesNotMatch(html,/<script>|<img/);
  assert.match(html,/&lt;img/);
  assert.match(html,/14,650/);
  assert.match(UI.render(),/尚未正式上線/);
  assert.doesNotMatch(UI.render(),/43,000/);
});
test("P4-06 salary RPC strips secret and unknown fields from accepted plan rows",async()=>{
  const plan={...basePlan(),ownerId:OTHER,bankToken:"SECRET_NOT_TO_LEAK",
    lines:basePlan().lines.map(l=>({...l,accessToken:"BAD"}))};
  const r=await executeGoalsP3({db:db({...response,plan}),owner:OWNER},
    "finance_goals_salary_get",readParams);
  assert.equal(r.plan.estimated_income,43000);
  assert.equal(r.plan.lines.length,8);
  assert.doesNotMatch(JSON.stringify(r),/SECRET_NOT_TO_LEAK|accessToken|ownerId/);
});
test("P4-07 report rows whitelist fields, stripping untrusted notes",async()=>{
  const x=await executeGoalsP3({db:db({...response,plan:basePlan(),
    goals:[{id:FUND_ID,kind:"sinking_fund",target_amount:7000,
      user_confirmed_reserved:0,account_id:null,personalNote:"SECRET"}],
    funds:[{id:FUND_ID,purpose:"rent",cadence_months:3,
      monthly_contribution:7000,due_amount:null,due_month:null,
      cardNumber:"SECRET"}],password:"SECRET"}),owner:OWNER},
    "finance_goals_month_report",readParams);
  assert.equal(x.goals.length,1);assert.equal(x.funds.length,1);
  assert.doesNotMatch(JSON.stringify(x),/personalNote|cardNumber|password|SECRET/);
});
test("P4-08 reject malformed plan and negative account reserve from RPC",async()=>{
  const invalid=basePlan();invalid.lines[1].category="food";
  await assert.rejects(()=>executeGoalsP3({db:db({...response,plan:invalid}),owner:OWNER},
    "finance_goals_salary_get",readParams),{code:"GOALS_RECEIPT_INVALID"});
  await assert.rejects(()=>executeGoalsP3({db:db({...response,plan:null,
    goals:[{id:FUND_ID,kind:"sinking_fund",target_amount:7000,
      user_confirmed_reserved:-100,account_id:null}],funds:[]}),owner:OWNER},
    "finance_goals_month_report",readParams),{code:"GOALS_RECEIPT_INVALID"});
});
test("P4-09 reject malformed cash amount or unknown sinking purpose",async()=>{
  const badFund={id:FUND_ID,purpose:"brokerage_purchase",cadence_months:12,
    monthly_contribution:1850,due_amount:22000,due_month:null};
  await assert.rejects(()=>executeGoalsP3({db:db({...response,plan:null,
    goals:[],funds:[badFund]}),owner:OWNER},
    "finance_goals_month_report",readParams),{code:"GOALS_RECEIPT_INVALID"});
});
test("P4-10 server owner enforced; arbitrary owner and browser URL cannot be passed",async()=>{
  const backend=db({...response,plan:null});
  await assert.rejects(()=>executeGoalsP3({db:backend,owner:OWNER},
    "finance_goals_salary_get",{month:"2026-12",owner_id:OTHER}),{code:"GOALS_INVALID_ARGS"});
  assert.equal(backend.calls.length,0);
  await assert.rejects(()=>executeGoalsP3({db:backend,owner:"arbitrary"},
    "finance_goals_month_report",readParams),{code:"GOALS_DEPENDENCY_UNAVAILABLE"});
});
test("P4-11 request schema rejects hidden account changes and injection-like fields",()=>{
  const data=salaryPlan();
  const valid={month:"2026-12",request_id:REQUEST,expected_version:0,action:"set",
    estimated_income:43000,lines:data.lines.map(l=>({...l}))};
  assert.equal(validateGoalsP3("finance_goals_salary_set",valid).ok,true);
  assert.equal(validateGoalsP3("finance_goals_salary_set",{...valid,
    user_id:OTHER}).ok,false);
  assert.equal(validateGoalsP3("finance_goals_salary_set",{...valid,
    lines:valid.lines.map((l,i)=>i?l:{...l,amount:7000.1})}).ok,false);
  assert.equal(validateGoalsP3("finance_goals_salary_set",{...valid,
    lines:valid.lines.map((l,i)=>i?l:{...l,sql:"DROP TABLE"})}).ok,false);
});
test("P4-12 restoration receipt is accepted but claims no bank transfer",async()=>{
  const r=await executeGoalsP3({db:db({...response,status:"restored",version:4,
    request_id:REQUEST,committed:true}),owner:OWNER},
    "finance_goals_salary_set",{month:"2026-12",
      request_id:REQUEST,expected_version:3,action:"set",
      estimated_income:43000,lines:salaryPlan().lines.map(l=>({...l}))});
  assert.equal(r.status,"restored");
  assert.equal(r.actualTransfer,false);
  assert.equal(r.version,4);
});
test("P4-13 fail closed if write receipt has unsafe version",async()=>{
  await assert.rejects(()=>executeGoalsP3({db:db({...response,status:"created",
    version:-1,request_id:REQUEST,committed:true}),owner:OWNER},
    "finance_goals_salary_set",{month:"2026-12",
      request_id:REQUEST,expected_version:0,action:"remove"}),{code:"GOALS_RECEIPT_INVALID"});
});
test("P4-14 unknown RPC name cannot trigger any database call",async()=>{
  const backend=db({...response,plan:null});
  await assert.rejects(()=>executeGoalsP3({db:backend,owner:OWNER},
    "finance_goals_sql_execute",{month:"2026-12"}),{code:"GOALS_TOOL_UNKNOWN"});
  assert.equal(backend.calls.length,0);
});
test("P4-15 oversized goal report fails without returning partial private data",async()=>{
  const backend=db({...response,plan:null,goals:Array(51).fill({}),funds:[]});
  await assert.rejects(()=>executeGoalsP3({db:backend,owner:OWNER},
    "finance_goals_month_report",readParams),{code:"GOALS_REPORT_LIMIT"});
});
test("P4-16 receipt error mapping hides underlying database failure strings",async()=>{
  const backend={rpc:async()=>({error:{message:"p_owner database SECRET"}})};
  await assert.rejects(()=>executeGoalsP3({db:backend,owner:OWNER},
    "finance_goals_salary_get",readParams),{code:"GOALS_DEPENDENCY_UNAVAILABLE"});
});
