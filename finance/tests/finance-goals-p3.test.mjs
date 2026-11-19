import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createGoal,recordAllocation} from "../goals/p1-goal-model.mjs";
import {sampleDecember2026,createSinkingFund} from "../goals/p2-salary-sinking-model.mjs";
import {buildMonthlyGoalReport,assertOwnerSnapshot} from "../goals/p3-monthly-report.mjs";
import {GOALS_P3_TOOLS,validateGoalsP3} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-p3-contract.mjs";
import {executeGoalsP3} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-p3-edge.mjs";
const require=createRequire(import.meta.url);
const View=require("../goals/p3-goals-ui.js");

const OWNER="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const ID="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const RENT="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const INSURANCE="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const REQUEST="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const sample=()=>sampleDecember2026({ownerId:OWNER,id:ID});
const reportInputs=()=>{
  const salaryPlan=sample();
  const rent=createSinkingFund({ownerId:OWNER,id:RENT,month:"2026-12",purpose:"rent",
    monthlyContribution:7000,cadenceMonths:3});
  const insurance=createSinkingFund({ownerId:OWNER,id:INSURANCE,month:"2026-12",
    purpose:"insurance",monthlyContribution:1850,cadenceMonths:12,dueAmount:22000});
  return {ownerId:OWNER,month:"2026-12",salaryPlan,
    goals:[rent.goal,insurance.goal,
      createGoal({ownerId:OWNER,id:ID,month:"2026-12",kind:"savings",targetAmount:5000})],
    funds:[rent.fund,insurance.fund],events:[],
    expenseBudget:{month:"2026-12",ownerId:OWNER,amount:9500}};
};
const write=(action="set")=>({
  month:"2026-12",request_id:REQUEST,expected_version:0,action,
  estimated_income:43000,
  lines:sample().lines.map(x=>({...x}))
});
const rpcDb=(data,error=null)=>({calls:[],async rpc(name,args){
  this.calls.push({name,args});return {data,error};
}});
const errCode=(fn,code)=>assert.throws(fn,{code});

test("P3-01 monthly plan totals are separated from the expense budget",()=>{
  const r=buildMonthlyGoalReport(reportInputs());
  assert.equal(r.estimatedSalary,43000);
  assert.equal(r.allocation.spendingPlan,9500);
  assert.equal(r.separatelyConfiguredExpenseBudget,9500);
  assert.equal(r.allocation.fixedSavings,5000);
  assert.equal(r.allocation.flexibleInvestible,14650);
  assert.equal(r.allocation.protectedReserve,8850);
  assert.equal(r.allocation.investmentCashPool,23500);
  assert.equal(r.realBankTransfers,0);
  assert.equal(r.actualTrades,0);
});
test("P3-02 without confirmed events, goals have zero progress",()=>{
  const r=buildMonthlyGoalReport(reportInputs());
  assert.equal(r.userConfirmed.savings,0);
  assert.equal(r.userConfirmed.protectedFunds,0);
  assert.equal(r.accountBalancesVerified,false);
  assert.equal(r.actualSalaryReceived,null);
});
test("P3-03 manual reservation is user-confirmed, never bank verified",()=>{
  const inputs=reportInputs();
  const allocated=recordAllocation({goals:inputs.goals,events:[]},{
    ownerId:OWNER,goalId:RENT,requestId:REQUEST,kind:"allocate",
    amount:3000,sourceReference:"2026-12-rent-slice",confirmedByUser:true
  });
  const r=buildMonthlyGoalReport({...inputs,events:allocated.events});
  assert.equal(r.userConfirmed.protectedFunds,3000);
  assert.equal(r.sinkingFunds.find(x=>x.purpose==="rent").cycleProjection,21000);
  assert.equal(r.sinkingFunds.find(x=>x.purpose==="rent").confirmedDueAmount,null);
  assert.equal(r.sinkingFunds.find(x=>x.purpose==="insurance").cycleProjection,22200);
});
test("P3-04 no plan is distinct from configured zero",()=>{
  const x=reportInputs();
  const r=buildMonthlyGoalReport({...x,salaryPlan:null,goals:[],funds:[]});
  assert.equal(r.planStatus,"not_configured");
  assert.equal(r.estimatedSalary,null);
  assert.equal(r.separatelyConfiguredExpenseBudget,9500);
});
test("P3-05 cross-owner plan and budget are rejected",()=>{
  const x=reportInputs();
  errCode(()=>buildMonthlyGoalReport({...x,ownerId:OTHER}),"GOAL_REPORT_OWNER_MISMATCH");
  errCode(()=>buildMonthlyGoalReport({...x,expenseBudget:{month:"2026-12",amount:9500,ownerId:OTHER}}),
    "GOAL_REPORT_BUDGET_INVALID");
});
test("P3-06 owner snapshot rejects foreign goal, fund and event rows",()=>{
  const x=reportInputs();
  errCode(()=>assertOwnerSnapshot({...x,events:[{ownerId:OTHER}]}),"GOAL_REPORT_UNTRUSTED_OWNER");
  errCode(()=>assertOwnerSnapshot({...x,goals:[{ownerId:OTHER}]}),"GOAL_REPORT_UNTRUSTED_OWNER");
});
test("P3-07 malformed month, duplicate fund and orphan are safe failures",()=>{
  const x=reportInputs();
  errCode(()=>buildMonthlyGoalReport({...x,month:"2026-19"}),"GOAL_REPORT_INVALID_ARGS");
  errCode(()=>buildMonthlyGoalReport({...x,funds:[...x.funds,x.funds[0]]}),
    "GOAL_REPORT_DUPLICATE_FUND");
  errCode(()=>buildMonthlyGoalReport({...x,goals:[]}),"GOAL_REPORT_ORPHAN_FUND");
});
test("P3-08 candidate UI renders verified values as escaped text",()=>{
  const r=buildMonthlyGoalReport(reportInputs());
  const html=View.render({report:r,state:"synced"});
  assert.match(html,/43,000/);
  assert.match(html,/23,500/);
  assert.match(html,/14,650/);
  assert.match(html,/8,850/);
  assert.match(html,/不代表銀行/);
  assert.doesNotMatch(html,/<script/);
  assert.equal(View.escape('<img src=x onerror="bad()">'),
    '&lt;img src=x onerror=&quot;bad()&quot;&gt;');
});
test("P3-09 UI is fail-closed when goals are not wired",()=>{
  const html=View.render();
  assert.match(html,/尚未正式上線/);
  assert.doesNotMatch(html,/43,000/);
  assert.match(View.render({report:buildMonthlyGoalReport(reportInputs()),state:"auth_required"}),
    /本人登入/);
});
test("P3-10 exact three tools, owner absent from all schemas",()=>{
  assert.deepEqual(GOALS_P3_TOOLS.map(x=>x.name),[
    "finance_goals_month_report","finance_goals_salary_get","finance_goals_salary_set"]);
  for(const t of GOALS_P3_TOOLS){
    assert.equal(t.inputSchema.additionalProperties,false);
    assert.equal(t.inputSchema.properties.ownerId,undefined);
  }
});
test("P3-11 read accepts only YYYY-MM without caller-supplied owner",()=>{
  assert.equal(validateGoalsP3("finance_goals_month_report",{month:"2026-12"}).ok,true);
  assert.equal(validateGoalsP3("finance_goals_month_report",{month:"2026-12",ownerId:OTHER}).ok,false);
  assert.equal(validateGoalsP3("finance_goals_salary_get",{month:"2026-22"}).ok,false);
});
test("P3-12 full eight-line write is required and verified",()=>{
  assert.equal(validateGoalsP3("finance_goals_salary_set",write()).ok,true);
  const x=write();x.lines[0].amount=7001;
  assert.equal(validateGoalsP3("finance_goals_salary_set",x).code,"GOALS_UNBALANCED");
  const y=write();y.lines[1].category="food";
  assert.equal(validateGoalsP3("finance_goals_salary_set",y).code,"GOALS_INVALID_LINES");
  const z=write();z.lines[0].accountRole="investment_cash_pool";
  assert.equal(validateGoalsP3("finance_goals_salary_set",z).ok,false);
});
test("P3-13 remove must omit money and lines",()=>{
  assert.equal(validateGoalsP3("finance_goals_salary_set",write("remove")).ok,false);
  const {month,request_id,expected_version}=write();
  assert.equal(validateGoalsP3("finance_goals_salary_set",{
    month,request_id,expected_version,action:"remove"
  }).ok,true);
});
test("P3-14 candidate RPC uses fixed server owner and bounded monthly query",async()=>{
  const data={month:"2026-12",source:"finance_goals_cloud_snapshot",plan:null,goals:[],funds:[]};
  const db=rpcDb(data);
  const r=await executeGoalsP3({db,owner:OWNER},"finance_goals_month_report",{month:"2026-12"});
  assert.equal(r.readOnly,true);
  assert.equal(db.calls[0].name,"lizhi_finance_p3_month_report");
  assert.deepEqual(db.calls[0].args,{p_owner:OWNER,p_month:"2026-12"});
});
test("P3-15 candidate read rejects unbounded or malformed RPC result",async()=>{
  const db=rpcDb({month:"2026-12",source:"finance_goals_cloud_snapshot",goals:Array(51).fill({}),funds:[]});
  await assert.rejects(()=>executeGoalsP3({db,owner:OWNER},
    "finance_goals_month_report",{month:"2026-12"}),{code:"GOALS_REPORT_LIMIT"});
  await assert.rejects(()=>executeGoalsP3({db,owner:OTHER},
    "finance_goals_month_report",{month:"2026-12",user_id:OWNER}),{code:"GOALS_INVALID_ARGS"});
});
test("P3-16 candidate write submits exact owner and CAS version via RPC",async()=>{
  const db=rpcDb({month:"2026-12",source:"finance_goals_cloud_snapshot",
    request_id:REQUEST,status:"created",version:1,committed:true});
  const r=await executeGoalsP3({db,owner:OWNER},"finance_goals_salary_set",write());
  assert.equal(r.committed,true);
  assert.equal(r.actualTransfer,false);
  assert.equal(db.calls[0].name,"lizhi_finance_p3_salary_set");
  assert.equal(db.calls[0].args.p_owner,OWNER);
  assert.equal(db.calls[0].args.p_expected_version,0);
  assert.equal(db.calls[0].args.p_lines.length,8);
});
test("P3-17 no RPC called when input is invalid or server owner unavailable",async()=>{
  const db=rpcDb(null);
  await assert.rejects(()=>executeGoalsP3({db,owner:OWNER},
    "finance_goals_salary_set",{...write(),ownerUid:OTHER}),{code:"GOALS_INVALID_ARGS"});
  assert.equal(db.calls.length,0);
  await assert.rejects(()=>executeGoalsP3({db,owner:"bad"},
    "finance_goals_salary_get",{month:"2026-12"}),{code:"GOALS_DEPENDENCY_UNAVAILABLE"});
});
test("P3-18 safe error mapping never leaks raw DB exceptions",async()=>{
  const db=rpcDb(null,{message:"GOALS_VERSION_CONFLICT raw database connection private"});
  await assert.rejects(()=>executeGoalsP3({db,owner:OWNER},
    "finance_goals_salary_set",write()),{code:"GOALS_VERSION_CONFLICT"});
  const other=rpcDb(null,{message:"password=supersecret"});
  await assert.rejects(()=>executeGoalsP3({db:other,owner:OWNER},
    "finance_goals_salary_get",{month:"2026-12"}),{code:"GOALS_DEPENDENCY_UNAVAILABLE"});
});
test("P3-19 no ledger write or transaction in response",async()=>{
  const db=rpcDb({month:"2026-12",source:"finance_goals_cloud_snapshot",
    request_id:REQUEST,status:"updated",version:3,committed:true});
  const r=await executeGoalsP3({db,owner:OWNER},"finance_goals_salary_set",{
    ...write(),expected_version:2
  });
  assert.equal(r.actualTransfer,false);
  assert.equal(r.status,"updated");
  assert.doesNotMatch(JSON.stringify(r),/creditCardNumber|bankToken|accountBalance/);
});
