(function(root,factory){
  "use strict";
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceBudgetDomain=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const MONEY_MAX=Number.MAX_SAFE_INTEGER;
  const MONTH=/^20[0-9]{2}-(0[1-9]|1[0-2])$/;
  const CURRENCY="TWD";
  const isObject=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
  const active=x=>x&&x.deletedAt==null&&x.deleted_at==null;
  const assertMonth=m=>{if(typeof m!=="string"||!MONTH.test(m))throw new RangeError("INVALID_BUDGET_MONTH");return m;};
  const assertCurrency=c=>{if(c!==CURRENCY)throw new RangeError("UNSUPPORTED_BUDGET_CURRENCY");return c;};
  const amountOf=value=>{
    if(!Number.isSafeInteger(value)||value<0||value>MONEY_MAX)throw new RangeError("INVALID_BUDGET_AMOUNT");
    return value;
  };
  const add=(a,b)=>{
    if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b<0||a>MONEY_MAX-b)
      throw new RangeError("BUDGET_AMOUNT_OVERFLOW");
    return a+b;
  };
  function validateBudget(input){
    if(!isObject(input))throw new TypeError("INVALID_BUDGET");
    const month=assertMonth(input.month),currency=assertCurrency(input.currency??CURRENCY);
    const amount=amountOf(input.amount);
    const categoryId=input.categoryId??null;
    if(categoryId!==null&&(typeof categoryId!=="string"||!categoryId.trim()||categoryId.length>160))
      throw new TypeError("INVALID_BUDGET_CATEGORY");
    if(input.id!==undefined&&(typeof input.id!=="string"||!input.id.trim()))
      throw new TypeError("INVALID_BUDGET_ID");
    return {month,currency,amount,categoryId};
  }
  function state(budget,spent){
    if(budget==null)return "unset";
    const amount=amountOf(budget.amount);
    if(amount===0)return spent>0?"over":"normal";
    if(spent>amount)return "over";
    if(spent===amount)return "limit";
    // Comparison without rounding fractional currency values.
    return spent/amount>=0.8?"warning":"normal";
  }
  function summary({month,currency=CURRENCY,budgets=[],transactions=[],categories=[],accounts=[],creditCards=[]}={}){
    assertMonth(month);assertCurrency(currency);
    if(![budgets,transactions,categories,accounts,creditCards].every(Array.isArray))
      throw new TypeError("INVALID_BUDGET_COLLECTION");
    const selected=new Map();
    for(const row of budgets){
      if(!active(row)||row.month!==month||row.currency!==currency)continue;
      const normalized=validateBudget(row),key=normalized.categoryId===null?"@total":"@cat:"+normalized.categoryId;
      if(selected.has(key))throw new Error("DUPLICATE_BUDGET_SCOPE");
      selected.set(key,{...row,...normalized});
    }
    const label=new Map(categories.map(x=>[String(x.id),String(x.name||"未分類")]));
    const accountCurrency=new Map(accounts.map(x=>[String(x.id),x.currency||CURRENCY]));
    const cardCurrency=new Map(creditCards.map(x=>[String(x.id),x.currency||CURRENCY]));
    const used=new Map();let spent=0,count=0,unconverted=0;
    for(const tx of transactions){
      if(!active(tx)||typeof tx.date!=="string"||tx.date.slice(0,7)!==month)continue;
      if(tx.type!=="expense"&&tx.type!=="credit_card_purchase")continue;
      const inferred=tx.type==="expense"
        ?accountCurrency.get(String(tx.accountId))
        :cardCurrency.get(String(tx.creditCardId));
      const txCurrency=tx.currency??inferred??CURRENCY;
      if(txCurrency!==currency){unconverted++;continue;}
      if(!Number.isSafeInteger(tx.amount)||tx.amount<=0)throw new RangeError("INVALID_BUDGET_TRANSACTION");
      const category=(typeof tx.categoryId==="string"&&tx.categoryId.trim())?tx.categoryId:"";
      spent=add(spent,tx.amount);
      used.set(category,add(used.get(category)||0,tx.amount));
      count++;
    }
    const total=selected.get("@total")??null;
    // Category budgets are independent allocations. Display an advisory only;
    // a larger combined allocation must never block the user from saving.
    const categoryAllocation=[...selected.entries()].filter(([key])=>key.startsWith("@cat:"))
      .reduce((sum,[,row])=>sum+BigInt(row.amount),0n);
    const categoryOverage=total&&categoryAllocation>BigInt(total.amount)
      ?(categoryAllocation-BigInt(total.amount)).toString():null;
    const categoryIds=new Set([...used.keys(),...[...selected.keys()].filter(x=>x.startsWith("@cat:")).map(x=>x.slice(5))]);
    const byCategory=[...categoryIds].map(categoryId=>{
      const budget=selected.get("@cat:"+categoryId)??null,amountUsed=used.get(categoryId)||0;
      return {
        category_id:categoryId||null,
        category:categoryId?(label.get(categoryId)||"未分類"):"未分類",
        configured:!!budget,budget:budget?budget.amount:null,
        used:amountUsed,remaining:budget?budget.amount-amountUsed:null,
        status:state(budget,amountUsed)
      };
    }).sort((a,b)=>b.used-a.used||a.category.localeCompare(b.category,"zh-TW"));
    return Object.freeze({
      month,currency,configured:!!total,
      budget:total?total.amount:null,
      used:spent,remaining:total?total.amount-spent:null,
      status:state(total,spent),
      percentage:total?(total.amount===0?(spent>0?null:0):spent/total.amount*100):null,
      by_category:byCategory,
      category_budget_total:categoryAllocation.toString(),
      category_budget_excess:categoryOverage,
      category_budget_warning:categoryOverage!==null,
      counted_transactions:count,
      excluded_foreign_currency:unconverted,
      notice:unconverted?"存在未換算的外幣消費，未納入此幣別預算。":null
    });
  }
  // Opt-in defaults are virtual monthly candidates. Never generate a remote row,
  // overwrite an explicit month or resurrect an explicitly removed tombstone.
  function previewFutureDefaults({month,budgets=[],defaults=[]}={}){
    assertMonth(month);
    if(!Array.isArray(budgets)||!Array.isArray(defaults))
      throw new TypeError("BUDGET_DEFAULT_COLLECTION_REQUIRED");
    const occupied=new Set(budgets.filter(row=>row?.month===month&&row.currency==="TWD")
      .map(row=>row.categoryId??null));
    const result=budgets.slice(),seen=new Set();
    for(const row of defaults){
      if(!row||row.currency!=="TWD"||row.disabled_at||!row.start_month||
         row.start_month>month)continue;
      const categoryId=row.category_id??null;
      if(seen.has(categoryId))throw new Error("BUDGET_DEFAULT_DUPLICATE_SCOPE");
      seen.add(categoryId);
      if(occupied.has(categoryId))continue;
      const amount=Number(row.amount);
      validateBudget({month,categoryId,amount,currency:"TWD"});
      result.push({id:"default-preview:"+String(row.id),month,categoryId,currency:"TWD",
        amount,virtual:true,dirty:false,deletedAt:null,defaultStartMonth:row.start_month});
      occupied.add(categoryId);
    }
    return result;
  }
  function copyMonthBudgets({budgets,fromMonth,toMonth,idFactory}){
    assertMonth(fromMonth);assertMonth(toMonth);
    if(fromMonth===toMonth)throw new RangeError("SAME_BUDGET_MONTH");
    if(typeof idFactory!=="function")throw new TypeError("BUDGET_ID_FACTORY_REQUIRED");
    const keys=new Set();
    return budgets.filter(row=>active(row)&&row.month===fromMonth).map(row=>{
      const value=validateBudget(row),key=value.currency+":"+(value.categoryId===null?"T":"C:"+value.categoryId);
      if(keys.has(key))throw new Error("DUPLICATE_BUDGET_SCOPE");keys.add(key);
      return {id:idFactory(),month:toMonth,currency:value.currency,
        categoryId:value.categoryId,amount:value.amount,version:0,
        dirty:true,deletedAt:null,createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()};
    });
  }
  return Object.freeze({MONEY_MAX,CURRENCY,validateBudget,state,summary,copyMonthBudgets,previewFutureDefaults});
});
