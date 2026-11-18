import test from "node:test";
import assert from "node:assert/strict";
import {recordAllocation} from "../goals/p1-goal-model.mjs";
import {
  CATEGORY_ROLES,PLAN_CATEGORIES,createSinkingFund,previewSinkingFund,
  createSalaryPlan,summarizeSalaryPlan,previewSalaryAdjustment,
  assignSalaryAccount,sampleDecember2026
} from "../goals/p2-salary-sinking-model.mjs";

const OWNER="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const PLAN="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const RENT="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const INSURANCE="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const UUID1="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const UUID2="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const plan=()=>sampleDecember2026({ownerId:OWNER,id:PLAN});
const rent=(overrides={})=>createSinkingFund({
  ownerId:OWNER,id:RENT,month:"2026-12",purpose:"rent",
  cadenceMonths:3,monthlyContribution:7000,...overrides
});
const insurance=(overrides={})=>createSinkingFund({
  ownerId:OWNER,id:INSURANCE,month:"2026-12",purpose:"insurance",
  cadenceMonths:12,monthlyContribution:1850,dueAmount:22000,...overrides
});
const code=(fn,value)=>assert.throws(fn,{code:value});

test("P2-01 all 43,000 salary is assigned once across eight distinct planning categories",()=>{
  const p=plan();
  assert.equal(p.lines.length,8);
  assert.deepEqual(p.lines.map(x=>x.category),PLAN_CATEGORIES);
  assert.equal(summarizeSalaryPlan(p,OWNER).lineTotal,43000);
  assert.equal(p.source,"estimated_salary");
});
test("P2-02 living expenses 9,500 stay separate from savings and investments",()=>{
  const s=summarizeSalaryPlan(plan(),OWNER);
  assert.equal(s.spendingPlan,9500);
  assert.equal(s.fixedSavings,5000);
  assert.equal(s.cardPaymentReserve,5000);
  assert.equal(s.realTransfersPerformed,0);
  assert.equal(s.fundedAmountVerified,0);
});
test("P2-03 protected rent and insurance 8,850 not free investment cash",()=>{
  const s=summarizeSalaryPlan(plan(),OWNER);
  assert.equal(s.plannedProtectedFunds,8850);
  assert.equal(s.freeInvestible,14650);
  assert.equal(s.investmentCashPool,23500);
  assert.equal(s.investmentCashPool-s.plannedProtectedFunds,14650);
});
test("P2-04 bank roles reflect confirmed intentions; actual account IDs remain unresolved",()=>{
  const s=summarizeSalaryPlan(plan(),OWNER);
  assert.equal(s.accountRoleTotals.first_bank_debit,9500);
  assert.equal(s.accountRoleTotals.first_bank_savings,5000);
  assert.equal(s.accountRoleTotals.ctbc_salary,5000);
  assert.equal(s.accountRoleTotals.investment_cash_pool,23500);
  assert.equal(s.assignedAccountIds,0);
});
test("P2-05 quarterly rent projection is not a confirmed 21,000 invoice",()=>{
  const {fund,goal}=rent();
  const s=previewSinkingFund(fund,goal,[],OWNER);
  assert.equal(s.cycleProjection,21000);
  assert.equal(s.monthlyTarget,7000);
  assert.equal(s.confirmedDueAmount,null);
  assert.equal(s.currentCycleCovered,null);
  assert.equal(s.isActualPayment,false);
  assert.equal(s.protectedFromInvestmentThisMonth,0);
});
test("P2-06 insurance 22,000/year is covered in projected contributions, not proven paid",()=>{
  const {fund,goal}=insurance();
  const s=previewSinkingFund(fund,goal,[],OWNER);
  assert.equal(s.monthlyTarget,1850);
  assert.equal(s.cycleProjection,22200);
  assert.equal(s.confirmedDueAmount,22000);
  assert.equal(s.projectedCycleBuffer,200);
  assert.equal(s.currentCycleCovered,null);
  assert.equal(s.bankVerified,false);
});
test("P2-07 insufficient projected contributions show an explicit gap",()=>{
  const {fund,goal}=insurance({monthlyContribution:1700});
  const s=previewSinkingFund(fund,goal,[],OWNER);
  assert.equal(s.projectedCycleGap,1600);
  assert.equal(s.projectedCycleBuffer,0);
});
test("P2-08 fund progress uses P1 confirmed allocation without inventing transfers",()=>{
  const {fund,goal}=rent();
  const result=recordAllocation({goals:[goal],events:[]},{
    ownerId:OWNER,goalId:RENT,requestId:UUID1,kind:"allocate",
    amount:3000,sourceReference:"salary-2026-12-rent-slice",
    confirmedByUser:true
  });
  const s=previewSinkingFund(fund,goal,result.events,OWNER);
  assert.equal(s.userConfirmedReservedThisMonth,3000);
  assert.equal(s.protectedFromInvestmentThisMonth,3000);
  assert.equal(s.currentCycleCovered,null);
});
test("P2-09 release lowers protected reservation without fabricating a payment",()=>{
  const {fund,goal}=insurance();
  const first=recordAllocation({goals:[goal],events:[]},{
    ownerId:OWNER,goalId:INSURANCE,requestId:UUID1,kind:"allocate",
    amount:1850,sourceReference:"salary-2026-12-insurance-slice",
    confirmedByUser:true
  });
  const second=recordAllocation({goals:[goal],events:first.events},{
    ownerId:OWNER,goalId:INSURANCE,requestId:UUID2,kind:"release",
    amount:500,sourceReference:"salary-2026-12-insurance-slice",
    confirmedByUser:true
  });
  assert.equal(previewSinkingFund(fund,goal,second.events,OWNER).protectedFromInvestmentThisMonth,1350);
});
test("P2-10 reject swapped purpose, annual/quartely cadence, invalid due month",()=>{
  code(()=>rent({cadenceMonths:12}),"FUND_VALIDATION_ERROR");
  code(()=>insurance({purpose:"rent",cadenceMonths:12}),"FUND_VALIDATION_ERROR");
  code(()=>rent({dueMonth:"2026-15"}),"FUND_VALIDATION_ERROR");
  code(()=>rent({monthlyContribution:-1}),"FUND_VALIDATION_ERROR");
  code(()=>insurance({dueAmount:-1}),"FUND_VALIDATION_ERROR");
});
test("P2-11 mixed owner and mismatched fund goal denied",()=>{
  const {fund,goal}=rent();
  code(()=>previewSinkingFund(fund,goal,[],OTHER),"FUND_GOAL_MISMATCH");
  code(()=>previewSinkingFund(fund,insurance().goal,[],OWNER),"FUND_GOAL_MISMATCH");
});
test("P2-12 reject duplicate categories and salary total mismatches",()=>{
  const p=plan();
  code(()=>createSalaryPlan({
    ownerId:OWNER,id:PLAN,month:"2026-12",
    estimatedIncome:43000,lines:[...p.lines.slice(0,7),p.lines[0]]
  }),"SALARY_PLAN_DUPLICATE_CATEGORY");
  code(()=>createSalaryPlan({
    ownerId:OWNER,id:PLAN,month:"2026-12",
    estimatedIncome:42999,lines:p.lines
  }),"SALARY_PLAN_UNBALANCED");
});
test("P2-13 unknown category and forged account roles fail closed",()=>{
  const p=plan();
  for(const bad of [
    {...p.lines[0],category:"unknown"},
    {...p.lines[0],accountRole:"investment_cash_pool"},
    {...p.lines[0],amount:-20},
    {...p.lines[0],accountId:""}
  ]){
    code(()=>createSalaryPlan({
      ownerId:OWNER,id:PLAN,month:"2026-12",
      estimatedIncome:43000,lines:[bad,...p.lines.slice(1)]
    }),"SALARY_LINE_INVALID");
  }
});
test("P2-14 preview lower actual salary reduces only flexible investible allocation",()=>{
  const s=previewSalaryAdjustment(plan(),{ownerId:OWNER,actualIncome:40000});
  assert.equal(s.unchangedFixedCommitments,28350);
  assert.equal(s.suggestedInvestible,11650);
  assert.equal(s.fixedShortfall,0);
  assert.equal(s.needsManualReview,false);
  assert.equal(s.createsTransaction,false);
});
test("P2-15 overpayment remains unassigned, not automatically invested",()=>{
  const s=previewSalaryAdjustment(plan(),{ownerId:OWNER,actualIncome:50000});
  assert.equal(s.suggestedInvestible,14650);
  assert.equal(s.unassignedSurplus,7000);
});
test("P2-16 salary below protected commitments flags review, no silent reduction",()=>{
  const s=previewSalaryAdjustment(plan(),{ownerId:OWNER,actualIncome:20000});
  assert.equal(s.fixedShortfall,8350);
  assert.equal(s.needsManualReview,true);
  assert.equal(s.suggestedInvestible,0);
});
test("P2-17 can only assign a verified existing own account with CAS",()=>{
  const p=plan();
  const ownAccount={id:"first-bank-savings-verified-id",ownerId:OWNER,archived:false};
  const changed=assignSalaryAccount(p,{
    ownerId:OWNER,expectedVersion:1,category:"savings",
    accountId:ownAccount.id,ownerAccounts:[ownAccount]
  });
  assert.equal(changed.version,2);
  assert.equal(changed.lines.find(x=>x.category==="savings").accountId,ownAccount.id);
  assert.equal(p.version,1);
  assert.equal(p.lines.find(x=>x.category==="savings").accountId,null);
  code(()=>assignSalaryAccount(p,{
    ownerId:OWNER,expectedVersion:0,category:"savings",
    accountId:ownAccount.id,ownerAccounts:[ownAccount]
  }),"SALARY_PLAN_VERSION_CONFLICT");
});
test("P2-18 reject another owner's or archived account and plan",()=>{
  const p=plan();
  const input={ownerId:OWNER,expectedVersion:1,category:"food",accountId:"other-bank",
    ownerAccounts:[{id:"other-bank",ownerId:OTHER}]};
  code(()=>assignSalaryAccount(p,input),"SALARY_ACCOUNT_NOT_OWNED_OR_ACTIVE");
  code(()=>assignSalaryAccount(p,{...input,ownerAccounts:[{id:"other-bank",ownerId:OWNER,archived:true}]}),"SALARY_ACCOUNT_NOT_OWNED_OR_ACTIVE");
  code(()=>summarizeSalaryPlan(p,OTHER),"SALARY_PLAN_NOT_FOUND");
  code(()=>previewSalaryAdjustment(p,{ownerId:OTHER,actualIncome:43000}),"SALARY_PLAN_NOT_FOUND");
});
test("P2-19 invalid actual salary and account references fail, without changing the plan",()=>{
  const p=plan();
  code(()=>previewSalaryAdjustment(p,{ownerId:OWNER,actualIncome:-100}),"SALARY_PLAN_INVALID");
  code(()=>assignSalaryAccount(p,{ownerId:OWNER,expectedVersion:1,category:"savings",
    accountId:"made-up",ownerAccounts:[]}),"SALARY_ACCOUNT_NOT_OWNED_OR_ACTIVE");
  assert.equal(summarizeSalaryPlan(p,OWNER).lineTotal,43000);
});
