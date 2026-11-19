// Unpublished P5 candidate: compose existing P3 tools with goal CRUD and
// manual reservation tools. Caller cannot set owner or approval via tool args.
import {executeGoalsP3} from "./finance-goals-p3-edge.mjs";
import {GOALS_P3_TOOLS} from "./finance-goals-p3-contract.mjs";
import {GOALS_P5_TOOLS,validateGoalsP5} from "./finance-goals-p5-contract.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const failure=(code)=>{const e=new Error(code);e.code=code;throw e;};
const known=new Set(["GOALS_VERSION_CONFLICT","GOALS_DUPLICATE_REQUEST",
  "GOALS_NOT_FOUND","GOALS_RESERVE_NOT_RELEASED","GOALS_KIND_IMMUTABLE","GOALS_FUND_SCOPE_IMMUTABLE",
  "GOALS_ACCOUNT_NOT_OWNED","GOALS_INVALID_ALLOCATION","GOALS_INVALID_FUND",
  "GOALS_INVALID_GOAL","GOAL_SOURCE_ALREADY_ALLOCATED",
  "GOAL_RELEASE_EXCEEDS_RESERVE","GOAL_RELEASE_SOURCE_INVALID",
  "GOAL_RESERVE_EXCEEDS_TARGET"]);
const rpc=Object.freeze({
  finance_goals_goal_set:"lizhi_finance_p5_goal_set",
  finance_goals_allocation_set:"lizhi_finance_p5_allocation_set"
});
const safeInt=v=>Number.isSafeInteger(v)&&v>0;
export async function executeGoalsCandidate({
  db,owner,approvedWrite=false
},toolName,input) {
  if(!UUID.test(owner||"")||!db||typeof db.rpc!=="function")
    failure("GOALS_DEPENDENCY_UNAVAILABLE");
  if(GOALS_P3_TOOLS.some(t=>t.name===toolName)){
    if(toolName==="finance_goals_salary_set"&&approvedWrite!==true)
      failure("GOALS_EXPLICIT_APPROVAL_REQUIRED");
    return executeGoalsP3({db,owner},toolName,input);
  }
  const checked=validateGoalsP5(toolName,input);
  if(!checked.ok)failure(checked.code);
  if(approvedWrite!==true)failure("GOALS_EXPLICIT_APPROVAL_REQUIRED");
  const args=checked.args;
  const params={p_owner:owner,p_month:args.month,p_goal_id:args.goal_id,
    p_request_id:args.request_id,p_action:args.action};
  if(toolName==="finance_goals_goal_set") {
    Object.assign(params,{
      p_expected_version:args.expected_version,p_kind:args.kind??null,
      p_target:args.target_amount??null,p_account:args.account_id??null,
      p_purpose:args.purpose??null,p_cadence:args.cadence_months??null,
      p_due_amount:args.due_amount??null,p_due_month:args.due_month??null
    });
  } else if(toolName==="finance_goals_allocation_set"){
    Object.assign(params,{
      p_amount:args.amount,p_source_reference:args.source_reference,
      p_confirmed:true
    });
  } else failure("GOALS_TOOL_UNKNOWN");
  let data;
  try{
    const response=await db.rpc(rpc[toolName],params);
    if(response?.error){
      const message=String(response.error.message||"");
      const code=[...known].find(c=>message.includes(c));
      failure(code||"GOALS_DEPENDENCY_UNAVAILABLE");
    }
    data=response?.data;
  }catch(e){
    if(e?.code&&known.has(e.code))throw e;
    failure("GOALS_DEPENDENCY_UNAVAILABLE");
  }
  if(!data||typeof data!=="object"||Array.isArray(data)||
    data.month!==args.month||data.source!=="finance_goals_cloud_snapshot"||
    data.goal_id!==args.goal_id||data.request_id!==args.request_id||
    data.committed!==true||data.actual_transfer!==false)
    failure("GOALS_RECEIPT_INVALID");
  const expected=toolName==="finance_goals_goal_set" ?
    (args.action==="remove"?["removed","already_applied"]:
    args.action==="create"?["created","already_applied"]:
    ["updated","already_applied"]):
    ["recorded","already_applied"];
  if(!expected.includes(data.status))failure("GOALS_RECEIPT_INVALID");
  if(toolName==="finance_goals_goal_set"&&!safeInt(data.version))
    failure("GOALS_RECEIPT_INVALID");
  return Object.freeze({
    month:data.month,goal_id:data.goal_id,request_id:data.request_id,
    status:data.status,
    ...(toolName==="finance_goals_goal_set"?{version:data.version}:{}),
    committed:true,actualTransfer:false,bankVerified:false,
    note:"僅更新理財目標與人工確認預留，未執行銀行或投資交易。"
  });
}
export const GOALS_CANDIDATE_MCP=GOALS_P5_TOOLS;
