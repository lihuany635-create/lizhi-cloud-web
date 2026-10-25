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
