// Candidate-only backend adapter. Must be called *after* the existing
// private Site has verified the human owner and Edge has verified its bearer.
// Never expose or accept ownerId from tool arguments. No production wiring.
import {GOALS_P3_TOOLS,validateGoalsP3} from "./finance-goals-p3-contract.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=code=>{const e=new Error(code);e.code=code;throw e;};
const knownErrors=new Set([
  "GOALS_VERSION_CONFLICT","GOALS_DUPLICATE_REQUEST","GOALS_NOT_FOUND",
  "GOALS_UNBALANCED","SALARY_PLAN_ACCOUNT_NOT_OWNED",
  "SALARY_PLAN_CATEGORY_INVALID","SALARY_PLAN_UNBALANCED",
  "GOALS_REPORT_LIMIT","GOALS_DEPENDENCY_UNAVAILABLE"
]);
const procedures=Object.freeze({
  finance_goals_month_report:"lizhi_finance_p3_month_report",
  finance_goals_salary_get:"lizhi_finance_p3_salary_get",
  finance_goals_salary_set:"lizhi_finance_p3_salary_set"
});
// Fail-closed response projection. Never forward unchecked RPC JSON fields.
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const money=x=>Number.isSafeInteger(x)&&x>=0;
const identifier=x=>typeof x==="string"&&x.length>=1&&x.length<=160;
const optionalAccount=x=>x===null||identifier(x);
const monthly=x=>x===null||(typeof x==="string"&&/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(x));
function safePlan(p){
  if(p==null)return null;
  if(!object(p)||!UUID.test(p.id||"")||!money(p.estimated_income)||
    !Number.isSafeInteger(p.version)||p.version<1||
    !Array.isArray(p.lines)||p.lines.length!==8)
    fail("GOALS_RECEIPT_INVALID");
  const lines=p.lines.map(l=>{
    if(!object(l)||!identifier(l.category)||!money(l.amount)||
      !identifier(l.accountRole)||!optionalAccount(l.accountId))
      fail("GOALS_RECEIPT_INVALID");
    return {category:l.category,amount:l.amount,
      accountRole:l.accountRole,accountId:l.accountId};
  });
  if(new Set(lines.map(x=>x.category)).size!==8)
    fail("GOALS_RECEIPT_INVALID");
  return Object.freeze({id:p.id,estimated_income:p.estimated_income,
    version:p.version,lines});
}
function safeGoal(g){
  if(!object(g)||!UUID.test(g.id||"")||
    !["savings","investible_cash","sinking_fund"].includes(g.kind)||
    !money(g.target_amount)||!money(g.user_confirmed_reserved)||
    !optionalAccount(g.account_id))fail("GOALS_RECEIPT_INVALID");
  return {id:g.id,kind:g.kind,target_amount:g.target_amount,
    account_id:g.account_id,user_confirmed_reserved:g.user_confirmed_reserved};
}
function safeFund(f){
  if(!object(f)||!UUID.test(f.id||"")||
    !["rent","insurance"].includes(f.purpose)||
    f.cadence_months!==(f.purpose==="rent"?3:12)||
    !money(f.monthly_contribution)||
    !(f.due_amount===null||money(f.due_amount))||
    !monthly(f.due_month))fail("GOALS_RECEIPT_INVALID");
  return {id:f.id,purpose:f.purpose,cadence_months:f.cadence_months,
    monthly_contribution:f.monthly_contribution,
    due_amount:f.due_amount,due_month:f.due_month};
}
export async function executeGoalsP3({db,owner},name,untrustedArgs){
  if(!UUID.test(owner||"")||!db||typeof db.rpc!=="function")
    fail("GOALS_DEPENDENCY_UNAVAILABLE");
  const v=validateGoalsP3(name,untrustedArgs);
  if(!v.ok)fail(v.code);
  const args=v.args;
  const params={p_owner:owner,p_month:args.month};
  if(name==="finance_goals_salary_set"){
    params.p_request_id=args.request_id;
    params.p_action=args.action;
    params.p_expected_version=args.expected_version;
    params.p_income=args.action==="set"?args.estimated_income:null;
    params.p_lines=args.action==="set"?args.lines:null;
  }
  const proc=procedures[name];
  if(!proc||!GOALS_P3_TOOLS.some(x=>x.name===name))
    fail("GOALS_TOOL_UNKNOWN");
  let data;
  try{
    const response=await db.rpc(proc,params);
    if(response?.error){
      const message=String(response.error.message||"");
      const allowed=[...knownErrors].find(c=>message.includes(c));
      fail(allowed||"GOALS_DEPENDENCY_UNAVAILABLE");
    }
    data=response?.data;
  }catch(e){
    if(e?.code&&knownErrors.has(e.code))throw e;
    fail("GOALS_DEPENDENCY_UNAVAILABLE");
  }
  if(!data||typeof data!=="object"||Array.isArray(data)||
     data.month!==args.month||data.source!=="finance_goals_cloud_snapshot")
    fail("GOALS_RECEIPT_INVALID");
  // No private transaction notes, bank credentials, or external owner fields.
  if(name==="finance_goals_salary_set"){
    if(data.committed!==true||
      !["created","updated","restored","removed","already_applied"].includes(data.status)||
      data.request_id!==args.request_id||
      !Number.isSafeInteger(data.version)||data.version<1)
      fail("GOALS_RECEIPT_INVALID");
    return Object.freeze({month:data.month,status:data.status,
      version:data.version,committed:true,request_id:data.request_id,
      source:data.source,actualTransfer:false,
      note:"薪資分配設定已寫入候選目標規劃資料；非銀行實際轉帳或交易。"});
  }
  // Return only our own explicitly defined bounded summary fields.
  if(name==="finance_goals_salary_get"){
    return Object.freeze({
      month:data.month,source:data.source,
      plan:safePlan(data.plan),readOnly:true,
      actualSalaryReceived:null,actualTransfer:false
    });
  }
  if(!Array.isArray(data.goals)||!Array.isArray(data.funds)||
     data.goals.length>50||data.funds.length>50)
    fail("GOALS_REPORT_LIMIT");
  return Object.freeze({
    month:data.month,source:data.source,
    plan:safePlan(data.plan),
    goals:data.goals.map(safeGoal),funds:data.funds.map(safeFund),
    readOnly:true,bankVerified:false,actualTrades:0,
    note:"目標預留與已付款／已投資不同；不包含未同步的本機紀錄。"
  });
}
