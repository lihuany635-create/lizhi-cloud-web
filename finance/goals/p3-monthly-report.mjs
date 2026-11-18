// Finance P3 candidate: owner-scoped monthly goal report, *not* the expense budget.
// No remote access, bank transfers, trades, or mutation of Finance transaction records.
import {goalProgress} from "./p1-goal-model.mjs";
import {summarizeSalaryPlan,previewSinkingFund} from "./p2-salary-sinking-model.mjs";

const MONTH=/^20\d{2}-(0[1-9]|1[0-2])$/;
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const error=code=>{const e=new Error(code);e.code=code;throw e;};
const goalsFor=(goals,month,owner)=>goals.filter(g=>g.ownerId===owner&&g.month===month&&!g.deletedAt);

export function buildMonthlyGoalReport({
  ownerId,month,salaryPlan=null,goals=[],funds=[],events=[],expenseBudget=null,
  syncStatus="candidate_only"
}){
  if(typeof ownerId!=="string"||!ownerId||!MONTH.test(month)||
    !Array.isArray(goals)||!Array.isArray(funds)||!Array.isArray(events)||
    !["candidate_only","synced","pending","error"].includes(syncStatus))
    error("GOAL_REPORT_INVALID_ARGS");
  if(salaryPlan!==null&&(salaryPlan.ownerId!==ownerId||salaryPlan.month!==month||salaryPlan.deletedAt))
    error("GOAL_REPORT_OWNER_MISMATCH");
  if(expenseBudget!==null&&(
    expenseBudget.month!==month||
    (expenseBudget.ownerId!==undefined&&expenseBudget.ownerId!==ownerId)||
    !safe(expenseBudget.amount)))
    error("GOAL_REPORT_BUDGET_INVALID");

  // Fail closed on foreign snapshot rows; do not silently discard them.
  assertOwnerSnapshot({ownerId,salaryPlan,goals,funds,events});
  const plan=salaryPlan?summarizeSalaryPlan(salaryPlan,ownerId):null;
  const owned=goalsFor(goals,month,ownerId);
  const reports=owned.map(g=>{
    const state=goalProgress(g,events,ownerId);
    return Object.freeze({
      id:g.id,kind:g.kind,targetAmount:g.targetAmount,
      userConfirmedReserved:state.userConfirmedReserved,
      remaining:state.remaining,percentage:state.percentage,
      accountId:g.accountId,bankVerified:false,investedPrincipal:null
    });
  });
  const seenFunds=new Set();
  const sinking=[];
  for(const fund of funds){
    if(fund.ownerId!==ownerId||fund.month!==month||fund.deletedAt)continue;
    if(seenFunds.has(fund.id))error("GOAL_REPORT_DUPLICATE_FUND");
    seenFunds.add(fund.id);
    const goal=owned.find(g=>g.id===fund.id);
    if(!goal)error("GOAL_REPORT_ORPHAN_FUND");
    sinking.push(Object.freeze(previewSinkingFund(fund,goal,events,ownerId)));
  }
  const saved=reports.filter(x=>x.kind==="savings");
  const invest=reports.filter(x=>x.kind==="investible_cash");
  const sum=rows=>{
    const total=rows.reduce((v,r)=>v+r.userConfirmedReserved,0);
    if(!safe(total))error("GOAL_REPORT_OVERFLOW");return total;
  };
  const confirmedSavings=sum(saved);
  const confirmedInvestible=sum(invest);
  const confirmedSinking=sum(reports.filter(x=>x.kind==="sinking_fund"));
  const plans=plan?{
    spendingPlan:plan.spendingPlan,
    fixedSavings:plan.fixedSavings,
    flexibleInvestible:plan.freeInvestible,
    protectedReserve:plan.plannedProtectedFunds,
    investmentCashPool:plan.investmentCashPool,
    creditCardReserve:plan.cardPaymentReserve
  }:null;
  return Object.freeze({
    month,source:"goal_planning",syncStatus,
    planStatus:plan?"planned":"not_configured",
    estimatedSalary:plan?.income??null,
    allocation:plans,
    goalProgress:reports,
    sinkingFunds:sinking,
    userConfirmed:{savings:confirmedSavings,investibleCash:confirmedInvestible,protectedFunds:confirmedSinking},
    separatelyConfiguredExpenseBudget:expenseBudget?.amount??null,
    realBankTransfers:0,actualTrades:0,
    actualSalaryReceived:null,accountBalancesVerified:false,
    note:"規劃不等於交易；預留僅代表使用者確認，非銀行核實；支出預算獨立呈現。"
  });
}

// Reject snapshots containing other owners even if callers give an ownerId;
// a server-side handler may filter but must not silently accept cross-user data.
export function assertOwnerSnapshot({ownerId,salaryPlan=null,goals=[],funds=[],events=[]}){
  if(!ownerId||goals.some(x=>x.ownerId!==ownerId)||
    funds.some(x=>x.ownerId!==ownerId)||
    events.some(x=>x.ownerId!==ownerId)||
    salaryPlan!==null&&salaryPlan.ownerId!==ownerId)
    error("GOAL_REPORT_UNTRUSTED_OWNER");
  return true;
}
