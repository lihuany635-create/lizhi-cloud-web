// P5 isolated extension to the existing P3 read/salary MCP contract.
// Never registered or deployed without separate owner authorization.
import {GOALS_P3_TOOLS,validateGoalsP3} from "./finance-goals-p3-contract.mjs";
const uuid={type:"string",format:"uuid"};
const month={type:"string",pattern:"^20[0-9]{2}-(0[1-9]|1[0-2])$"};
const amt={type:"integer",minimum:0,maximum:9007199254740991};
const pos={type:"integer",minimum:1,maximum:9007199254740991};
const optionalId={anyOf:[{type:"null"},{type:"string",minLength:1,maxLength:160}]};
const schema=(properties,required)=>({type:"object",properties,required,additionalProperties:false});
export const GOALS_P5_TOOLS=Object.freeze([
  ...GOALS_P3_TOOLS,
  {name:"finance_goals_goal_set",description:"Create/update/soft-disable a savings, investible cash or protected rent/insurance goal. Never moves bank money. Requires explicit user instruction and request id.",inputSchema:schema({
    month,goal_id:uuid,request_id:uuid,expected_version:amt,
    action:{type:"string",enum:["create","update","remove"]},
    kind:{type:"string",enum:["savings","investible_cash","sinking_fund"]},
    target_amount:amt,account_id:optionalId,
    purpose:{type:"string",enum:["rent","insurance"]},
    cadence_months:{type:"integer",enum:[3,12]},
    due_amount:{anyOf:[{type:"null"},amt]},due_month:{anyOf:[{type:"null"},month]}
  },["month","goal_id","request_id","expected_version","action"]),annotations:{readOnlyHint:false,idempotentHint:true}},
  {name:"finance_goals_allocation_set",description:"Append an owner-authorized reservation or release of a uniquely identified source slice. No per-action passkey or confirmation flag; never moves real funds.",inputSchema:schema({
    month,goal_id:uuid,request_id:uuid,
    action:{type:"string",enum:["allocate","release"]},
    amount:pos,source_reference:{type:"string",minLength:1,maxLength:160}
  },["month","goal_id","request_id","action","amount","source_reference"]),annotations:{readOnlyHint:false,idempotentHint:true}}
]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH=/^20[0-9]{2}-(0[1-9]|1[0-2])$/;
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const only=(x,keys)=>obj(x)&&Object.keys(x).every(k=>keys.includes(k));
const money=x=>Number.isSafeInteger(x)&&x>=0;
const validAccount=x=>x===null||(typeof x==="string"&&x.length>0&&x.length<=160);
const error=code=>({ok:false,code});
export function validateGoalsP5(name,input){
  if(GOALS_P3_TOOLS.some(t=>t.name===name))return validateGoalsP3(name,input);
  if(!GOALS_P5_TOOLS.some(t=>t.name===name))return error("GOALS_TOOL_UNKNOWN");
  if(!obj(input)||!MONTH.test(input.month||"")||
     !UUID.test(input.goal_id||"")||!UUID.test(input.request_id||""))
    return error("GOALS_INVALID_ARGS");
  if(name==="finance_goals_allocation_set"){
    if(!only(input,["month","goal_id","request_id","action","amount","source_reference"])||
       !["allocate","release"].includes(input.action)||
       !money(input.amount)||input.amount===0||
       typeof input.source_reference!=="string"||!input.source_reference.trim()||
       input.source_reference.length>160)
       return error("GOALS_INVALID_ALLOCATION");
    return {ok:true,args:{...input}};
  }
  const allowed=["month","goal_id","request_id","expected_version","action","kind",
    "target_amount","account_id","purpose","cadence_months","due_amount","due_month"];
  if(!only(input,allowed)||!money(input.expected_version)||
     !["create","update","remove"].includes(input.action))
    return error("GOALS_INVALID_ARGS");
  if(input.action==="remove"){
    if(Object.keys(input).some(k=>!["month","goal_id","request_id","expected_version","action"].includes(k)))
      return error("GOALS_INVALID_ARGS");
    return {ok:true,args:{month:input.month,goal_id:input.goal_id,
      request_id:input.request_id,expected_version:input.expected_version,action:"remove"}};
  }
  if(!["savings","investible_cash","sinking_fund"].includes(input.kind)||
     !money(input.target_amount)||!validAccount(input.account_id)||
     (input.action==="create"&&input.expected_version!==0)||
     (input.action==="update"&&input.expected_version<1))
    return error("GOALS_INVALID_GOAL");
  if(input.kind!=="sinking_fund"){
    if(["purpose","cadence_months","due_amount","due_month"].some(k=>k in input))
      return error("GOALS_INVALID_GOAL");
  } else {
    const cadence=input.kind==="sinking_fund"&&(input.purpose==="rent"?3:input.purpose==="insurance"?12:null);
    if(input.cadence_months!==cadence||
       !(input.due_amount===null||money(input.due_amount))||
       !(input.due_month===null||(typeof input.due_month==="string"&&MONTH.test(input.due_month))))
       return error("GOALS_INVALID_FUND");
  }
  const args={month:input.month,goal_id:input.goal_id,request_id:input.request_id,
    expected_version:input.expected_version,action:input.action,kind:input.kind,
    target_amount:input.target_amount,account_id:input.account_id};
  if(input.kind==="sinking_fund")Object.assign(args,{
    purpose:input.purpose,cadence_months:input.cadence_months,
    due_amount:input.due_amount,due_month:input.due_month
  });
  return {ok:true,args};
}
