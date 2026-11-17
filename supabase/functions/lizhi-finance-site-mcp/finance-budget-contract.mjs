// P3 CANDIDATE: add to the existing private Finance Site only.
// A user/owner ID is deliberately absent from every input schema.
const object=(props={},required=[])=>({type:"object",properties:props,required,additionalProperties:false});
const month={type:"string",pattern:"^20[0-9]{2}-(0[1-9]|1[0-2])$"};
const uuid={type:"string",format:"uuid"};
const money={type:"integer",minimum:0,maximum:9007199254740991};
const version={type:"integer",minimum:0,maximum:9007199254740991};
const category={type:"string",minLength:1,maxLength:160};
const currency={type:"string",enum:["TWD"]};
export const FINANCE_BUDGET_TOOLS=Object.freeze([
  {name:"finance_budget_summary",description:"Read the owner's budget, spending, remaining amount and 80%/100% alerts for a YYYY-MM month. Zero is a configured budget; null means unset. Only the already-synced cloud ledger is counted.",inputSchema:object({month,currency},["month"]),annotations:{readOnlyHint:true}},
  {name:"finance_budget_categories",description:"Read the owner's monthly expense category budgets and spending totals (no transaction notes). Use to get category IDs before setting a category budget.",inputSchema:object({month,currency},["month"]),annotations:{readOnlyHint:true}},
  {name:"finance_budget_set",description:"Create, update or soft-remove one monthly total/category budget on the existing owner-verified cloud ledger. Require an explicit user request. For new budgets use expected_version=0; for edits/removal first read current version. Repeat same request_id only for uncertain receipts; changing the payload under an old request_id is rejected. Does not create a real transaction.",inputSchema:object({
    request_id:uuid,month,currency,scope:{type:"string",enum:["total","category"]},
    category_id:category,action:{type:"string",enum:["set","remove"]},
    amount:money,expected_version:version
  },["request_id","month","scope","action","expected_version"]),annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true}}
]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH=/^20[0-9]{2}-(0[1-9]|1[0-2])$/;
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const exact=(o,allowed)=>Object.keys(o).every(k=>allowed.includes(k));
const safe=x=>Number.isSafeInteger(x)&&x>=0&&x<=9007199254740991;
export function validateFinanceBudgetTool(name,args){
  if(!FINANCE_BUDGET_TOOLS.some(t=>t.name===name))return {ok:false,code:"BUDGET_UNKNOWN_TOOL"};
  if(!obj(args)||!exact(args,[
    "request_id","month","currency","scope","category_id","action","amount","expected_version"
  ]))return {ok:false,code:"BUDGET_VALIDATION_ERROR"};
  if(typeof args.month!=="string"||!MONTH.test(args.month)||
     args.currency!==undefined&&args.currency!=="TWD")
    return {ok:false,code:"BUDGET_VALIDATION_ERROR"};
  const normalized={month:args.month,currency:"TWD"};
  if(name!=="finance_budget_set"){
    return exact(args,["month","currency"])?{ok:true,args:normalized}:
      {ok:false,code:"BUDGET_VALIDATION_ERROR"};
  }
  if(typeof args.request_id!=="string"||!UUID.test(args.request_id)||
     !["total","category"].includes(args.scope)||
     !["set","remove"].includes(args.action)||
     !safe(args.expected_version))return {ok:false,code:"BUDGET_VALIDATION_ERROR"};
  if(args.scope==="total"&&Object.hasOwn(args,"category_id")||
     args.scope==="category"&&(typeof args.category_id!=="string"||
       args.category_id.length<1||args.category_id.length>160))
    return {ok:false,code:"BUDGET_VALIDATION_ERROR"};
  if(args.action==="set"&&!safe(args.amount)||
     args.action==="remove"&&Object.hasOwn(args,"amount"))
    return {ok:false,code:"BUDGET_VALIDATION_ERROR"};
  if(!exact(args,["request_id","month","currency","scope","category_id","action","amount","expected_version"]))
    return {ok:false,code:"BUDGET_VALIDATION_ERROR"};
  return {ok:true,args:{...normalized,request_id:args.request_id,scope:args.scope,
    category_id:args.scope==="category"?args.category_id:null,action:args.action,
    amount:args.action==="set"?args.amount:null,expected_version:args.expected_version}};
}
