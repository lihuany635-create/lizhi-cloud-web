// P3 CANDIDATE: service-role-only, fixed-owner budget MCP data adapter.
// No arbitrary owner ID, SQL, or transaction note is accepted from callers.
const TABLE="lizhi_finance_budgets";
const BUDGET_FIELDS="id,user_id,month,category_id,currency,amount,version,updated_at,deleted_at";
const CATEGORIES_FIELDS="id,payload";
const MAX=9007199254740991;
const knownError=code=>Object.assign(new Error(code),{code});
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
function amount(value){
  if((typeof value!=="string"&&typeof value!=="number")||
     !/^[0-9]{1,16}$/.test(String(value)))throw knownError("BUDGET_INVALID_REMOTE_DATA");
  const parsed=Number(value);
  if(!Number.isSafeInteger(parsed)||parsed<0||parsed>MAX)
    throw knownError("BUDGET_INVALID_REMOTE_DATA");
  return parsed;
}
function validRows(value,code){
  if(!Array.isArray(value))throw knownError(code);
  return value;
}
function status(limit,used){
  if(limit===null)return {state:"not_configured",percentage:null,remaining:null};
  const remaining=limit-used;
  if(!Number.isSafeInteger(remaining))throw knownError("BUDGET_INVALID_REMOTE_DATA");
  if(limit===0)return {state:used>0?"over":"at_limit",percentage:null,remaining};
  const percent=Number((used/limit*100).toFixed(2));
  const state=used>limit?"over":used===limit?"at_limit":
    used*5>=limit*4?"near_limit":"normal";
  return {state,percentage:percent,remaining};
}
async function readSettings(db,owner,month){
  const {data,error}=await db.from(TABLE).select(BUDGET_FIELDS)
    .eq("user_id",owner).eq("month",month).eq("currency","TWD")
    .order("id",{ascending:true}).range(0,250);
  if(error)throw knownError("BUDGET_DEPENDENCY_UNAVAILABLE");
  const rows=validRows(data,"BUDGET_DEPENDENCY_UNAVAILABLE");
  if(rows.length>250||rows.some(r=>r?.user_id!==owner||r.month!==month||r.currency!=="TWD"))
    throw knownError("BUDGET_INVALID_REMOTE_OWNER");
  return rows.map(r=>({...r,amount:amount(r.amount),version:amount(r.version)}));
}
async function readSpending(db,owner,month){
  const {data,error}=await db.rpc("lizhi_finance_budget_site_spending",
    {p_owner:owner,p_month:month});
  if(error||!obj(data)||data.month!==month||data.currency!=="TWD")
    throw knownError("BUDGET_DEPENDENCY_UNAVAILABLE");
  const used=amount(data.used);
  const byCategory=new Map();
  for(const record of validRows(data.by_category,"BUDGET_INVALID_REMOTE_DATA")){
    const key=record.category_id;
    if(key!==null&&typeof key!=="string")throw knownError("BUDGET_INVALID_REMOTE_DATA");
    if(byCategory.has(key))throw knownError("BUDGET_INVALID_REMOTE_DATA");
    byCategory.set(key,amount(record.used));
  }
  return {used,byCategory,countedTransactions:amount(data.counted_transactions),
    excludedForeign:amount(data.excluded_foreign_currency)};
}
async function readCategories(db,owner){
  const {data,error}=await db.from("lizhi_finance_records")
    .select(CATEGORIES_FIELDS).eq("user_id",owner).eq("kind","categories")
    .is("deleted_at",null).order("id",{ascending:true}).range(0,250);
  if(error)throw knownError("BUDGET_DEPENDENCY_UNAVAILABLE");
  const rows=validRows(data,"BUDGET_DEPENDENCY_UNAVAILABLE");
  if(rows.length>250)throw knownError("BUDGET_RESULT_LIMIT");
  return rows.filter(r=>obj(r.payload)&&r.payload.type==="expense"&&
    !r.payload.deletedAt).map(r=>({id:String(r.id).slice(0,160),
      name:String(r.payload.name||"未命名分類").slice(0,100),
      archived:r.payload.archived===true}));
}
function budgetRecord(row){
  return row?{id:row.id,month:row.month,category_id:row.category_id,
    currency:row.currency,amount:row.deleted_at?null:row.amount,
    configured:!row.deleted_at,version:row.version,
    updated_at:row.updated_at,deleted:!!row.deleted_at}:
    {id:null,month:null,category_id:null,currency:"TWD",amount:null,
      configured:false,version:0,updated_at:null,deleted:false};
}
export async function executeFinanceBudget({db,owner},name,args){
  if(!db?.from||!db?.rpc||typeof owner!=="string"||
     !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(owner))
    throw knownError("BUDGET_DEPENDENCY_UNAVAILABLE");
  if(name==="finance_budget_set"){
    const {data,error}=await db.rpc("lizhi_finance_budget_site_set",{
      p_owner:owner,p_request_id:args.request_id,p_month:args.month,
      p_category_id:args.category_id,p_currency:args.currency,
      p_amount:args.amount,p_delete:args.action==="remove",
      p_expected_version:args.expected_version
    });
    if(error){
      const raw=String(error.message||"");
      for(const code of ["BUDGET_VERSION_CONFLICT","BUDGET_DUPLICATE_REQUEST",
        "BUDGET_VALIDATION_ERROR","BUDGET_CATEGORY_NOT_FOUND",
        "BUDGET_SCOPE_IMMUTABLE","BUDGET_OWNER_REQUIRED"]){
        if(raw.includes(code))throw knownError(code);
      }
      if(error.code==="23505")throw knownError("BUDGET_VERSION_CONFLICT");
      throw knownError("BUDGET_DEPENDENCY_UNAVAILABLE");
    }
    if(!obj(data)||!["created","updated","deleted"].includes(data.status)||
       data.request_id!==args.request_id||!obj(data.budget)||
       data.budget.month!==args.month||
       (data.budget.category_id??null)!==(args.category_id??null)||
       data.budget.currency!=="TWD"||
       !Number.isSafeInteger(Number(data.budget.version)))
      throw knownError("BUDGET_RECEIPT_INVALID");
    return {source:"supabase_owner_budget",committed:true,
      status:data.status,request_id:data.request_id,
      budget:{...data.budget,amount:amount(data.budget.amount)}};
  }
  const [settings,spending]=await Promise.all([
    readSettings(db,owner,args.month),readSpending(db,owner,args.month)
  ]);
  if(name==="finance_budget_summary"){
    const row=settings.find(x=>x.category_id===null);
    const budget=budgetRecord(row);
    const state=status(budget.amount,spending.used);
    return {month:args.month,currency:"TWD",budget,used:spending.used,
      ...state,counted_transactions:spending.countedTransactions,
      excluded_foreign_currency:spending.excludedForeign,
      source:"supabase_synced_snapshot",
      notice:"雲端已同步交易的預算統計，不含尚未同步的本機資料。"};
  }
  if(name!=="finance_budget_categories")throw knownError("BUDGET_UNKNOWN_TOOL");
  const categories=await readCategories(db,owner);
  const names=new Map(categories.map(x=>[x.id,x]));
  const configured=new Map(settings.filter(x=>x.category_id!==null)
    .map(x=>[x.category_id,x]));
  const keys=new Set([...categories.map(x=>x.id),...configured.keys(),
    ...spending.byCategory.keys()].filter(x=>x!==null));
  const result=[...keys].sort((a,b)=>a.localeCompare(b)).map(categoryId=>{
    const value=budgetRecord(configured.get(categoryId));
    const used=spending.byCategory.get(categoryId)??0;
    return {category_id:categoryId,name:names.get(categoryId)?.name??"已移除分類",
      archived:names.get(categoryId)?.archived??true,budget:value,
      used,...status(value.amount,used)};
  });
  return {month:args.month,currency:"TWD",categories:result,
    total_used:spending.used,excluded_foreign_currency:spending.excludedForeign,
    source:"supabase_synced_snapshot",
    notice:"不包含交易備註或未同步的本機資料。"};
}
