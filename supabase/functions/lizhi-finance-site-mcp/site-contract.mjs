// Read-only Finance tool contract shared with the private ChatGPT Sites gateway.
// Never add arbitrary SQL, caller-supplied owner/user ID, or write methods here.
const obj = x => x !== null && typeof x === "object" && !Array.isArray(x);
const schema = (properties = {}, required = []) => ({
  type: "object", properties, required, additionalProperties: false
});
const month = {type:"string",pattern:"^20[0-9]{2}-(0[1-9]|1[0-2])$"};
export const FINANCE_SITE_TOOLS = Object.freeze([
  {name:"finance_status",description:"Read owner-scoped cloud Finance snapshot counts. Local unsynced data excluded.",inputSchema:schema(),annotations:{readOnlyHint:true}},
  {name:"finance_accounts",description:"Read owner-scoped account balances computed from the synchronized Finance ledger.",inputSchema:schema(),annotations:{readOnlyHint:true}},
  {name:"finance_cards",description:"Read owner-scoped credit card unpaid balances, excluding full card numbers.",inputSchema:schema(),annotations:{readOnlyHint:true}},
  {name:"finance_month_summary",description:"Read YYYY-MM income, expenses, card spending and card payments separately; card payment never doubles expenses.",inputSchema:schema({month},["month"]),annotations:{readOnlyHint:true}},
  {name:"finance_recent_transactions",description:"Read 1-20 recent transactions, without notes or full card numbers.",inputSchema:schema({limit:{type:"integer",minimum:1,maximum:20},month}),annotations:{readOnlyHint:true}},
]);
export function validateFinanceSiteTool(name,args) {
  if (!FINANCE_SITE_TOOLS.some(t=>t.name===name)) return {ok:false,code:"FINANCE_UNKNOWN_TOOL"};
  if (!obj(args)) return {ok:false,code:"FINANCE_INVALID_ARGS"};
  const keys = Object.keys(args);
  if (keys.length>2) return {ok:false,code:"FINANCE_INVALID_ARGS"};
  if (name==="finance_status" || name==="finance_accounts" || name==="finance_cards")
    return keys.length===0?{ok:true,args:{}}:{ok:false,code:"FINANCE_INVALID_ARGS"};
  if (name==="finance_month_summary")
    return keys.length===1 && typeof args.month==="string" && /^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(args.month)
      ? {ok:true,args:{month:args.month}}:{ok:false,code:"FINANCE_INVALID_MONTH"};
  if (keys.some(k=>!["limit","month"].includes(k))) return {ok:false,code:"FINANCE_INVALID_ARGS"};
  if (args.month!==undefined && (typeof args.month!=="string" || !/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(args.month)))
    return {ok:false,code:"FINANCE_INVALID_MONTH"};
  if (args.limit!==undefined && (!Number.isInteger(args.limit)||args.limit<1||args.limit>20))
    return {ok:false,code:"FINANCE_INVALID_LIMIT"};
  return {ok:true,args:{limit:args.limit??10,...(args.month?{month:args.month}:{})}};
}

// General browser-hosted UI control. Not arbitrary JavaScript or SQL.
// All commands only go to an explicitly enabled, short-lived first-party session.
const uuid={type:"string",format:"uuid"};
const uiref={type:"string",pattern:"^u[0-9]{1,3}$"};
export const FINANCE_UI_SITE_TOOLS=Object.freeze([
  {name:"finance_ui_sessions",description:"List browser Finance workspaces that explicitly enabled AI control. Read only; no remote browser without opt-in.",inputSchema:schema(),annotations:{readOnlyHint:true}},
  {name:"finance_ui_inspect",description:"Queue a bounded snapshot of visible Finance UI controls; call finance_ui_job to retrieve the result. Does not return passwords or record payloads.",inputSchema:schema({session_id:uuid,request_id:uuid},["session_id","request_id"]),annotations:{readOnlyHint:true}},
  {name:"finance_ui_action",description:"Queue one click/fill/select on the previously inspected Finance webpage. Any financial write/delete requires native owner confirmation in the open browser; do not assume queued means completed.",inputSchema:schema({session_id:uuid,request_id:uuid,revision:{type:"string"},ref:uiref,action:{type:"string",enum:["click","fill","select"]},value:{type:"string",maxLength:300},confirm:{type:"boolean"}},["session_id","request_id","revision","ref","action"]),annotations:{readOnlyHint:false,destructiveHint:true}},
  {name:"finance_ui_job",description:"Read job receipt for a previously queued UI inspect/action. The receipt may report rejected, succeeded or expired; succeeded only means UI event dispatched, not ledger committed.",inputSchema:schema({job_id:uuid},["job_id"]),annotations:{readOnlyHint:true}}
]);
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateFinanceUiTool(name,args) {
  if(!FINANCE_UI_SITE_TOOLS.some(t=>t.name===name)||!obj(args))return {ok:false,code:"UNKNOWN_FINANCE_UI_TOOL"};
  const keys=Object.keys(args);
  const exact=(must,allowed=must)=>must.every(k=>Object.hasOwn(args,k))&&keys.every(k=>allowed.includes(k));
  const isid=x=>typeof x==="string"&&UUID_RE.test(x);
  if(name==="finance_ui_sessions")
    return keys.length===0?{ok:true,args:{}}:{ok:false,code:"INVALID_UI_ARGS"};
  if(name==="finance_ui_job")
    return exact(["job_id"])&&isid(args.job_id)?{ok:true,args:{job_id:args.job_id}}:{ok:false,code:"INVALID_UI_JOB"};
  if(!isid(args.session_id)||!isid(args.request_id))
    return {ok:false,code:"INVALID_UI_SESSION_OR_REQUEST"};
  if(name==="finance_ui_inspect")
    return exact(["session_id","request_id"])?{ok:true,args:{session_id:args.session_id,request_id:args.request_id,operation:"inspect",params:{}}}:{ok:false,code:"INVALID_UI_ARGS"};
  if(!exact(["session_id","request_id","revision","ref","action"],["session_id","request_id","revision","ref","action","value","confirm"]))
    return {ok:false,code:"INVALID_UI_ARGS"};
  if(typeof args.revision!=="string"||args.revision.length<1||args.revision.length>96||
      typeof args.ref!=="string"||!/^u[0-9]{1,3}$/.test(args.ref)||
      !["click","fill","select"].includes(args.action))
    return {ok:false,code:"INVALID_UI_ACTION"};
  if(args.action==="click"&&(Object.hasOwn(args,"value")||Object.hasOwn(args,"confirm")&&typeof args.confirm!=="boolean"))
    return {ok:false,code:"INVALID_UI_ACTION"};
  if(args.action!=="click"&&(typeof args.value!=="string"||args.value.length>300||Object.hasOwn(args,"confirm")))
    return {ok:false,code:"INVALID_UI_FIELD"};
  return {ok:true,args:{session_id:args.session_id,request_id:args.request_id,
    operation:"interact",params:{revision:args.revision,ref:args.ref,action:args.action,
      ...(args.action==="click"&&args.confirm===true?{confirm:true}:{}),
      ...(args.action!=="click"?{value:args.value}:{})}}};
}


// Cloud-first Finance: operates with the owner-scoped Supabase ledger even if all
// user browsers/computers are offline. Does not require Finance UI sessions.
const financeId={type:"string",minLength:1,maxLength:160};
const transactionFields={
  type:{type:"string",enum:["income","expense","transfer","credit_card_purchase","credit_card_payment"]},
  amount:{type:"integer",minimum:1,maximum:9007199254740991},
  date:{type:"string",pattern:"^20[0-9]{2}-[0-9]{2}-[0-9]{2}$"},
  accountId:financeId,fromAccountId:financeId,toAccountId:financeId,
  creditCardId:financeId,categoryId:financeId,
  note:{type:"string",maxLength:240}
};
export const FINANCE_CLOUD_TOOLS=Object.freeze([
  {name:"finance_references",description:"List active account, card and category IDs and names from the owner-owned synced ledger; use before creating a transaction. No PIN/card numbers/notes.",inputSchema:schema(),annotations:{readOnlyHint:true}},
  {name:"finance_create_transaction",description:"Immediately create one owner-owned transaction in the persistent cloud ledger, independent of browser or PC. User must have explicitly requested the entry. Supply a new UUID request_id for each distinct intent; retry same UUID only to resolve uncertain receipt. Five types: income, expense, transfer, credit_card_purchase, credit_card_payment. Payment is not an expense; overpayments are rejected.",inputSchema:schema({request_id:{type:"string",format:"uuid"},transaction:schema(transactionFields,["type","amount","date"])},["request_id","transaction"]),annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true}}
]);
const CLOUD_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validCloudDate(value) {
  if(typeof value!=="string"||!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(value))return false;
  const [y,m,d]=value.split("-").map(Number);
  return m>=1&&m<=12&&d>=1&&d<=new Date(Date.UTC(y,m,0)).getUTCDate();
}
export function validateFinanceCloudTool(name,args) {
  if(!FINANCE_CLOUD_TOOLS.some(t=>t.name===name)||!obj(args))return {ok:false,code:"FINANCE_CLOUD_UNKNOWN_TOOL"};
  if(name==="finance_references")return Object.keys(args).length===0?{ok:true,args:{}}:{ok:false,code:"FINANCE_CLOUD_INVALID_ARGS"};
  if(Object.keys(args).sort().join(",")!=="request_id,transaction"||
    typeof args.request_id!=="string"||!CLOUD_UUID.test(args.request_id)||
    !obj(args.transaction))return {ok:false,code:"FINANCE_CLOUD_INVALID_ARGS"};
  const tx=args.transaction;
  if(Object.keys(tx).some(k=>!Object.hasOwn(transactionFields,k)))return {ok:false,code:"FINANCE_CLOUD_UNKNOWN_FIELD"};
  if(!["income","expense","transfer","credit_card_purchase","credit_card_payment"].includes(tx.type)||
    !Number.isSafeInteger(tx.amount)||tx.amount<=0||!validCloudDate(tx.date))
    return {ok:false,code:"FINANCE_CLOUD_INVALID_TRANSACTION"};
  for(const k of ["accountId","fromAccountId","toAccountId","creditCardId","categoryId"])
    if(Object.hasOwn(tx,k)&&(typeof tx[k]!=="string"||!tx[k].trim()||tx[k].length>160))
      return {ok:false,code:"FINANCE_CLOUD_INVALID_REFERENCE"};
  if(Object.hasOwn(tx,"note")&&(typeof tx.note!=="string"||tx.note.length>240))
    return {ok:false,code:"FINANCE_CLOUD_INVALID_NOTE"};
  const has=k=>Object.hasOwn(tx,k);
  const valid=(
    (["income","expense"].includes(tx.type)&&has("accountId")&&has("categoryId")&&!has("fromAccountId")&&!has("toAccountId")&&!has("creditCardId"))||
    (tx.type==="transfer"&&has("fromAccountId")&&has("toAccountId")&&tx.fromAccountId!==tx.toAccountId&&
      !has("accountId")&&!has("categoryId")&&!has("creditCardId"))||
    (tx.type==="credit_card_purchase"&&has("creditCardId")&&has("categoryId")&&!has("accountId")&&!has("fromAccountId")&&!has("toAccountId"))||
    (tx.type==="credit_card_payment"&&has("creditCardId")&&(has("fromAccountId")!==has("accountId"))&&
      !has("categoryId")&&!has("toAccountId"))
  );
  return valid?{ok:true,args:{request_id:args.request_id,transaction:{...tx}}}:{ok:false,code:"FINANCE_CLOUD_REFERENCE_FIELDS"};
}
