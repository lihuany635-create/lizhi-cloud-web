// P3 candidate contract only. NOT registered in the production private Site.
// Never allow caller to specify ownerId, service token, SQL or arbitrary table.
// Reads are bounded by month; writes require an explicit owner-authorised request.
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const only=(x,keys)=>obj(x)&&Object.keys(x).every(k=>keys.includes(k));
const month={type:"string",pattern:"^20[0-9]{2}-(0[1-9]|1[0-2])$"};
const uuid={type:"string",format:"uuid"};
const money={type:"integer",minimum:0,maximum:9007199254740991};
const scope=(properties,required=[])=>({type:"object",properties,required,additionalProperties:false});
const accountId={anyOf:[{type:"null"},{type:"string",minLength:1,maxLength:160}]};
export const GOALS_P3_TOOLS=Object.freeze([
  {name:"finance_goals_month_report",description:"Read this owner's planned savings, investment cash and protected funds separately from expense budgets. No bank verification implied.",inputSchema:scope({month},["month"]),annotations:{readOnlyHint:true}},
  {name:"finance_goals_salary_get",description:"Read this owner's monthly estimated salary allocation plan; no account balances or transactions included.",inputSchema:scope({month},["month"]),annotations:{readOnlyHint:true}},
  {name:"finance_goals_salary_set",description:"Set or soft-remove a complete 8-line salary allocation plan; does not transfer money or create expense transactions. Requires explicit user approval, stable request_id and expected_version.",inputSchema:scope({
    month,request_id:uuid,expected_version:money,action:{type:"string",enum:["set","remove"]},
    estimated_income:money,
    lines:{type:"array",minItems:8,maxItems:8,items:scope({
      category:{type:"string",enum:["food","daily","transport","savings","investible_cash","rent_reserve","insurance_reserve","credit_card_reserve"]},
      amount:money,accountRole:{type:"string"},
      accountId
    },["category","amount","accountRole","accountId"])}
  },["month","request_id","expected_version","action"]),annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true}}
]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH=/^20[0-9]{2}-(0[1-9]|1[0-2])$/;
const roles=Object.freeze({
  food:"first_bank_debit",daily:"first_bank_debit",transport:"first_bank_debit",
  savings:"first_bank_savings",investible_cash:"investment_cash_pool",
  rent_reserve:"investment_cash_pool",insurance_reserve:"investment_cash_pool",
  credit_card_reserve:"ctbc_salary"
});
const goodMoney=n=>Number.isSafeInteger(n)&&n>=0;
const safeAccount=x=>x===null||(typeof x==="string"&&x.length>0&&x.length<=160);
const invalid=code=>({ok:false,code});
export function validateGoalsP3(name,args){
  if(!GOALS_P3_TOOLS.some(x=>x.name===name))return invalid("GOALS_TOOL_UNKNOWN");
  if(!obj(args)||!MONTH.test(args.month||""))return invalid("GOALS_INVALID_MONTH");
  if(name!=="finance_goals_salary_set")
    return only(args,["month"])?{ok:true,args:{month:args.month}}:invalid("GOALS_INVALID_ARGS");
  if(!only(args,["month","request_id","expected_version","action","estimated_income","lines"])||
      !UUID.test(args.request_id||"")||!goodMoney(args.expected_version)||
      !["set","remove"].includes(args.action))return invalid("GOALS_INVALID_ARGS");
  if(args.action==="remove"){
    if("estimated_income" in args||"lines" in args)return invalid("GOALS_INVALID_ARGS");
    return {ok:true,args:{month:args.month,request_id:args.request_id,
      expected_version:args.expected_version,action:"remove"}};
  }
  if(!goodMoney(args.estimated_income)||!Array.isArray(args.lines)||
     args.lines.length!==8)return invalid("GOALS_INVALID_LINES");
  const seen=new Set();let total=0;
  const lines=[];
  for(const line of args.lines){
    if(!only(line,["category","amount","accountRole","accountId"])||
      Object.keys(line).length!==4||
      !Object.hasOwn(roles,line.category)||seen.has(line.category)||
      line.accountRole!==roles[line.category]||
      !goodMoney(line.amount)||!safeAccount(line.accountId))
      return invalid("GOALS_INVALID_LINES");
    seen.add(line.category);
    total+=line.amount;
    if(!Number.isSafeInteger(total))return invalid("GOALS_INVALID_LINES");
    lines.push({category:line.category,amount:line.amount,
      accountRole:line.accountRole,accountId:line.accountId});
  }
  if(seen.size!==8||total!==args.estimated_income)return invalid("GOALS_UNBALANCED");
  return {ok:true,args:{month:args.month,request_id:args.request_id,
    expected_version:args.expected_version,action:"set",
    estimated_income:args.estimated_income,lines}};
}
