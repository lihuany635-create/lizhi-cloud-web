// Finance P2 isolated candidate. Pure planning only: no transfers, trades or ledger mutations.
import {createGoal, goalProgress} from "./p1-goal-model.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH=/^20\d{2}-(0[1-9]|1[0-2])$/;
const isUuid=value=>typeof value==="string"&&UUID.test(value);
const isMoney=value=>Number.isSafeInteger(value)&&value>=0;
const isLabel=value=>typeof value==="string"&&value.length>=1&&value.length<=160;
const fail=code=>{const e=new Error(code);e.code=code;throw e;};
const isPlain=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const keysOnly=(value,allowed)=>isPlain(value)&&Object.keys(value).every(key=>allowed.includes(key));

// A role is a PLAN LABEL, not proof that an actual existing account is selected.
// The real accountId must be resolved later against owner's finance_references.
export const CATEGORY_ROLES=Object.freeze({
  food:"first_bank_debit",
  daily:"first_bank_debit",
  transport:"first_bank_debit",
  savings:"first_bank_savings",
  investible_cash:"investment_cash_pool",
  rent_reserve:"investment_cash_pool",
  insurance_reserve:"investment_cash_pool",
  credit_card_reserve:"ctbc_salary"
});
export const PLAN_CATEGORIES=Object.freeze(Object.keys(CATEGORY_ROLES));
export const FUND_PURPOSES=Object.freeze({rent:3,insurance:12});

export function createSinkingFund({
  ownerId,id,month,purpose,monthlyContribution,cadenceMonths,
  dueAmount=null,dueMonth=null,accountId=null
}) {
  if(!Object.hasOwn(FUND_PURPOSES,purpose)||
      cadenceMonths!==FUND_PURPOSES[purpose]||
      !isMoney(monthlyContribution)||
      !(dueAmount===null||isMoney(dueAmount))||
      !(dueMonth===null||(typeof dueMonth==="string"&&MONTH.test(dueMonth)))||
      !(accountId===null||isLabel(accountId)))fail("FUND_VALIDATION_ERROR");
  const cycleAmount=monthlyContribution*cadenceMonths;
  if(!Number.isSafeInteger(cycleAmount))fail("FUND_VALIDATION_ERROR");
  const goal=createGoal({ownerId,id,month,kind:"sinking_fund",
    targetAmount:monthlyContribution,accountId});
  const fund=Object.freeze({
    ownerId,id,month,purpose,cadenceMonths,monthlyContribution,
    dueAmount,dueMonth,accountId,version:1,deletedAt:null
  });
  return Object.freeze({fund,goal});
}

// Distinguish monthly target from actual bill; 7,000 monthly rent does NOT
// confirm a 21,000 quarterly invoice. No paid/unpaid status is inferred.
export function previewSinkingFund(fund,goal,events,ownerId) {
  if(!fund||fund.ownerId!==ownerId||fund.deletedAt||!goal||
      goal.ownerId!==ownerId||goal.id!==fund.id||
      goal.month!==fund.month||goal.kind!=="sinking_fund"||
      goal.targetAmount!==fund.monthlyContribution)
    fail("FUND_GOAL_MISMATCH");
  const progress=goalProgress(goal,events,ownerId);
  const projection=fund.monthlyContribution*fund.cadenceMonths;
  if(!Number.isSafeInteger(projection))fail("FUND_VALIDATION_ERROR");
  return Object.freeze({
    purpose:fund.purpose,
    cadenceMonths:fund.cadenceMonths,
    monthlyTarget:fund.monthlyContribution,
    userConfirmedReservedThisMonth:progress.userConfirmedReserved,
    protectedFromInvestmentThisMonth:progress.userConfirmedReserved,
    cycleProjection:projection,
    confirmedDueAmount:fund.dueAmount,
    confirmedDueMonth:fund.dueMonth,
    projectedCycleGap:fund.dueAmount===null?null:
      Math.max(0,fund.dueAmount-projection),
    projectedCycleBuffer:fund.dueAmount===null?null:
      Math.max(0,projection-fund.dueAmount),
    currentCycleCovered:null, // requires history + actual bank balances
    bankVerified:false,
    isActualPayment:false
  });
}
const checkLine=line=>{
  if(!keysOnly(line,["category","amount","accountRole","accountId"])||
      !Object.hasOwn(CATEGORY_ROLES,line.category)||
      !isMoney(line.amount)||
      line.accountRole!==CATEGORY_ROLES[line.category]||
      !(line.accountId===null||isLabel(line.accountId)))
    fail("SALARY_LINE_INVALID");
  return Object.freeze({category:line.category,amount:line.amount,
    accountRole:line.accountRole,accountId:line.accountId});
};
export function createSalaryPlan({ownerId,id,month,estimatedIncome,lines}) {
  if(!isUuid(ownerId)||!isUuid(id)||!MONTH.test(month)||
      !isMoney(estimatedIncome)||!Array.isArray(lines)||
      lines.length!==PLAN_CATEGORIES.length)fail("SALARY_PLAN_INVALID");
  const normalized=lines.map(checkLine);
  if(new Set(normalized.map(x=>x.category)).size!==PLAN_CATEGORIES.length)
    fail("SALARY_PLAN_DUPLICATE_CATEGORY");
  const total=normalized.reduce((sum,line)=>sum+line.amount,0);
  if(!Number.isSafeInteger(total)||total!==estimatedIncome)
    fail("SALARY_PLAN_UNBALANCED");
  return Object.freeze({
    ownerId,id,month,currency:"TWD",source:"estimated_salary",
    estimatedIncome,lines:Object.freeze(normalized),
    version:1,deletedAt:null
  });
}
function ownPlan(plan,ownerId){
  if(!plan||plan.ownerId!==ownerId||plan.deletedAt)fail("SALARY_PLAN_NOT_FOUND");
}
export function summarizeSalaryPlan(plan,ownerId) {
  ownPlan(plan,ownerId);
  const amounts=Object.fromEntries(PLAN_CATEGORIES.map(c=>
    [c,plan.lines.find(x=>x.category===c).amount]));
  const grouped=Object.create(null);
  for(const line of plan.lines)grouped[line.accountRole]=(grouped[line.accountRole]||0)+line.amount;
  const protectedFunds=amounts.rent_reserve+amounts.insurance_reserve;
  return Object.freeze({
    income:plan.estimatedIncome,
    lineTotal:plan.lines.reduce((sum,l)=>sum+l.amount,0),
    accountRoleTotals:Object.freeze({...grouped}),
    spendingPlan:amounts.food+amounts.daily+amounts.transport,
    fixedSavings:amounts.savings,
    freeInvestible:amounts.investible_cash,
    plannedProtectedFunds:protectedFunds,
    investmentCashPool:protectedFunds+amounts.investible_cash,
    cardPaymentReserve:amounts.credit_card_reserve,
    assignedAccountIds:plan.lines.filter(line=>line.accountId!==null).length,
    realTransfersPerformed:0,
    fundedAmountVerified:0
  });
}
// Preview actual salary changes. Protect fixed commitments; never secretly
// reduce rent/insurance, spend twice, or auto-invest a surplus.
export function previewSalaryAdjustment(plan,{ownerId,actualIncome}) {
  ownPlan(plan,ownerId);
  if(!isMoney(actualIncome))fail("SALARY_PLAN_INVALID");
  const free=plan.lines.find(x=>x.category==="investible_cash").amount;
  const fixed=plan.estimatedIncome-free;
  const flexible=Math.max(0,Math.min(free,actualIncome-fixed));
  const shortfall=Math.max(0,fixed-actualIncome);
  const surplus=Math.max(0,actualIncome-fixed-flexible);
  return Object.freeze({
    actualIncome,unchangedFixedCommitments:fixed,
    suggestedInvestible:shortfall?0:flexible,
    unassignedSurplus:surplus,
    needsManualReview:shortfall>0,
    fixedShortfall:shortfall,
    createsTransfer:false,
    createsTransaction:false
  });
}
// Account assignment is only allowed after the real Finance account reference
// has been read; an invented ID or another owner's ID must be rejected.
export function assignSalaryAccount(plan,{
  ownerId,expectedVersion,category,accountId,ownerAccounts
}) {
  ownPlan(plan,ownerId);
  if(expectedVersion!==plan.version)fail("SALARY_PLAN_VERSION_CONFLICT");
  if(!Object.hasOwn(CATEGORY_ROLES,category)||!isLabel(accountId)||
      !Array.isArray(ownerAccounts))fail("SALARY_ACCOUNT_INVALID");
  const account=ownerAccounts.find(x=>x&&x.id===accountId&&
    x.ownerId===ownerId&&!x.archived&&!x.deletedAt);
  if(!account)fail("SALARY_ACCOUNT_NOT_OWNED_OR_ACTIVE");
  return Object.freeze({...plan,version:plan.version+1,
    lines:Object.freeze(plan.lines.map(line=>line.category!==category?line:
      Object.freeze({...line,accountId})))});
}
export function sampleDecember2026({ownerId,id}) {
  const amounts={
    food:7000,daily:1500,transport:1000,savings:5000,
    investible_cash:14650,rent_reserve:7000,insurance_reserve:1850,
    credit_card_reserve:5000
  };
  const lines=PLAN_CATEGORIES.map(category=>({
    category,amount:amounts[category],
    accountRole:CATEGORY_ROLES[category],accountId:null
  }));
  return createSalaryPlan({ownerId,id,month:"2026-12",
    estimatedIncome:43000,lines});
}
