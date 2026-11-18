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
      !["created","updated","removed","already_applied"].includes(data.status)||
      data.request_id!==args.request_id)fail("GOALS_RECEIPT_INVALID");
    return Object.freeze({month:data.month,status:data.status,
      version:data.version,committed:true,request_id:data.request_id,
      source:data.source,actualTransfer:false,
      note:"薪資分配設定已寫入候選目標規劃資料；非銀行實際轉帳或交易。"});
  }
  // Return only our own explicitly defined bounded summary fields.
  if(name==="finance_goals_salary_get"){
    return Object.freeze({
      month:data.month,source:data.source,
      plan:data.plan??null,readOnly:true,
      actualSalaryReceived:null,actualTransfer:false
    });
  }
  if(!Array.isArray(data.goals)||!Array.isArray(data.funds)||
     data.goals.length>50||data.funds.length>50)
    fail("GOALS_REPORT_LIMIT");
  return Object.freeze({
    month:data.month,source:data.source,
    plan:data.plan??null,goals:data.goals,funds:data.funds,
    readOnly:true,bankVerified:false,actualTrades:0,
    note:"目標預留與已付款／已投資不同；不包含未同步的本機紀錄。"
  });
}
