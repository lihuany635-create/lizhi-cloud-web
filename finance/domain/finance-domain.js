(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceDomain=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const TRANSACTION_TYPES=Object.freeze(["income","expense","transfer","credit_card_purchase","credit_card_payment"]);
  const ACCOUNT_TYPES=Object.freeze(["cash","bank","postal","ewallet","other"]);
  const CATEGORY_TYPES=Object.freeze(["income","expense"]);
  const DATE_PATTERN=/^(\d{4})-(\d{2})-(\d{2})$/;
  const isText=value=>typeof value==="string"&&value.trim().length>0;
  const error=(code,field,message)=>({code,field,message});

  function isValidDate(value){
    const match=DATE_PATTERN.exec(value||"");
    if(!match)return false;
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
    if(month<1||month>12||day<1)return false;
    const days=[31,(year%4===0&&year%100!==0)||year%400===0?29:28,31,30,31,30,31,31,30,31,30,31];
    return day<=days[month-1];
  }

  function toIdSet(value){
    if(value==null)return null;
    if(value instanceof Set)return value;
    if(value instanceof Map)return new Set(value.keys());
    if(Array.isArray(value))return new Set(value.map(item=>typeof item==="string"?item:item?.id));
    return new Set(Object.keys(value));
  }

  function validateTransaction(transaction,references={}){
    const errors=[];
    if(!transaction||typeof transaction!=="object"||Array.isArray(transaction))return {valid:false,errors:[error("INVALID_TRANSACTION",null,"交易必須是物件")]};
    if(transaction.id!==undefined&&!isText(transaction.id))errors.push(error("INVALID_ID","id","交易 id 必須是非空字串"));
    if(!TRANSACTION_TYPES.includes(transaction.type))errors.push(error("UNKNOWN_TRANSACTION_TYPE","type",`未知交易類型：${transaction.type??""}`));
    if(!Number.isSafeInteger(transaction.amount)||transaction.amount<=0)errors.push(error("INVALID_AMOUNT","amount","金額必須是大於 0 的安全整數"));
    if(!isValidDate(transaction.date))errors.push(error("INVALID_DATE","date","日期必須是有效的 YYYY-MM-DD"));

    const required=[];
    if(transaction.type==="income")required.push(["accountId","帳戶"],["categoryId","分類"]);
    if(transaction.type==="expense")required.push(["accountId","帳戶"],["categoryId","分類"]);
    if(transaction.type==="transfer")required.push(["fromAccountId","轉出帳戶"],["toAccountId","轉入帳戶"]);
    if(transaction.type==="credit_card_purchase")required.push(["creditCardId","信用卡"],["categoryId","分類"]);
    if(transaction.type==="credit_card_payment"){if(!isText(transaction.fromAccountId)&&!isText(transaction.accountId))errors.push(error("MISSING_REFERENCE","fromAccountId","付款帳戶不可為空"));required.push(["creditCardId","信用卡"]);}
    for(const [field,label] of required)if(!isText(transaction[field]))errors.push(error("MISSING_REFERENCE",field,`${label}不可為空`));
    if(transaction.type==="transfer"&&isText(transaction.fromAccountId)&&transaction.fromAccountId===transaction.toAccountId)errors.push(error("SAME_TRANSFER_ACCOUNT","toAccountId","轉出與轉入帳戶不可相同"));

    const accounts=toIdSet(references.accounts),cards=toIdSet(references.creditCards),categories=toIdSet(references.categories);
    for(const field of ["accountId","fromAccountId","toAccountId"]){
      if(isText(transaction[field])&&accounts&&!accounts.has(transaction[field]))errors.push(error("INVALID_ACCOUNT_REFERENCE",field,`找不到帳戶：${transaction[field]}`));
    }
    if(isText(transaction.creditCardId)&&cards&&!cards.has(transaction.creditCardId))errors.push(error("INVALID_CREDIT_CARD_REFERENCE","creditCardId",`找不到信用卡：${transaction.creditCardId}`));
    if(isText(transaction.categoryId)&&categories&&!categories.has(transaction.categoryId))errors.push(error("INVALID_CATEGORY_REFERENCE","categoryId",`找不到分類：${transaction.categoryId}`));
    return {valid:errors.length===0,errors};
  }

  function calculateAccountBalance(account,transactions=[]){
    if(!account||!isText(account.id))throw new TypeError("帳戶必須包含 id");
    if(!Number.isSafeInteger(account.initialBalance))throw new TypeError("initialBalance 必須是安全整數");
    return transactions.reduce((balance,tx)=>{
      const amount=Number.isSafeInteger(tx.amount)?tx.amount:0;
      if(tx.type==="income"&&tx.accountId===account.id)return balance+amount;
      if(tx.type==="expense"&&tx.accountId===account.id)return balance-amount;
      if(tx.type==="transfer"&&tx.fromAccountId===account.id)return balance-amount;
      if(tx.type==="transfer"&&tx.toAccountId===account.id)return balance+amount;
      if(tx.type==="credit_card_payment"&&(tx.fromAccountId===account.id||tx.accountId===account.id))return balance-amount;
      return balance;
    },account.initialBalance);
  }

  function inMonth(transaction,month){return typeof month==="string"&&/^\d{4}-\d{2}$/.test(month)&&transaction.date?.slice(0,7)===month;}
  function calculateMonthlyIncome(transactions,month){return transactions.filter(tx=>tx.type==="income"&&inMonth(tx,month)).reduce((sum,tx)=>sum+tx.amount,0);}
  function calculateMonthlyExpense(transactions,month){return transactions.filter(tx=>(tx.type==="expense"||tx.type==="credit_card_purchase")&&inMonth(tx,month)).reduce((sum,tx)=>sum+tx.amount,0);}
  function calculateMonthlyCreditCardPurchases(transactions,month,creditCardId=null){return transactions.filter(tx=>tx.type==="credit_card_purchase"&&inMonth(tx,month)&&(!creditCardId||tx.creditCardId===creditCardId)).reduce((sum,tx)=>sum+tx.amount,0);}
  function calculateMonthlyCreditCardPayments(transactions,month,creditCardId=null){return transactions.filter(tx=>tx.type==="credit_card_payment"&&inMonth(tx,month)&&(!creditCardId||tx.creditCardId===creditCardId)).reduce((sum,tx)=>sum+tx.amount,0);}
  function calculateMonthlyBalance(transactions,month){return calculateMonthlyIncome(transactions,month)-calculateMonthlyExpense(transactions,month);}
  function calculateCreditCardOutstanding(creditCardId,transactions=[]){
    if(!isText(creditCardId))throw new TypeError("creditCardId 不可為空");
    const net=transactions.reduce((sum,tx)=>tx.creditCardId!==creditCardId?sum:tx.type==="credit_card_purchase"?sum+tx.amount:tx.type==="credit_card_payment"?sum-tx.amount:sum,0);
    return Math.max(0,net);
  }
  function calculateTotalAssets(accounts=[],transactions=[]){
    return accounts.filter(account=>account.includeInAssets!==false).reduce((sum,account)=>sum+calculateAccountBalance(account,transactions),0);
  }
  function calculateTotalCreditCardLiabilities(cards=[],transactions=[]){return cards.reduce((sum,card)=>sum+calculateCreditCardOutstanding(card.id,transactions),0);}
  function calculateNetWorth(accounts=[],cards=[],transactions=[]){return calculateTotalAssets(accounts,transactions)-calculateTotalCreditCardLiabilities(cards,transactions);}
  function calculateCreditCardCycle(card,transactions=[],currentDate){
    const today=currentDate||new Date().toISOString().slice(0,10),month=today.slice(0,7),closingDay=Number(card?.closingDay),outstanding=calculateCreditCardOutstanding(card?.id,transactions),purchases=calculateMonthlyCreditCardPurchases(transactions,month,card?.id),payments=calculateMonthlyCreditCardPayments(transactions,month,card?.id);
    if(!Number.isSafeInteger(closingDay)||closingDay<1||closingDay>31)return Object.freeze({available:false,month,purchases,payments,outstanding,unbilled:null,billedUnpaid:null,paymentStatus:payments>0?(outstanding>0?"partial":"paid"):"unpaid"});
    const [yearValue,monthValue,dayValue]=today.split("-").map(Number),monthEnd=new Date(Date.UTC(yearValue,monthValue,0)).getUTCDate(),safeClosing=Math.min(closingDay,monthEnd),closingDate=`${month}-${String(safeClosing).padStart(2,"0")}`;
    const unbilled=transactions.filter(tx=>tx.type==="credit_card_purchase"&&tx.creditCardId===card.id&&tx.date>closingDate&&tx.date<=today).reduce((sum,tx)=>sum+tx.amount,0),billedUnpaid=Math.max(0,outstanding-unbilled);
    return Object.freeze({available:true,month,closingDate,purchases,payments,outstanding,unbilled,billedUnpaid,paymentStatus:payments>0?(outstanding>0?"partial":"paid"):"unpaid"});
  }
  function filterTransactionsByDateRange(transactions=[],startDate,endDate){
    if(startDate&&!isValidDate(startDate))throw new TypeError("startDate 必須是有效的 YYYY-MM-DD");
    if(endDate&&!isValidDate(endDate))throw new TypeError("endDate 必須是有效的 YYYY-MM-DD");
    if(startDate&&endDate&&startDate>endDate)throw new RangeError("startDate 不可晚於 endDate");
    return transactions.filter(tx=>(!startDate||tx.date>=startDate)&&(!endDate||tx.date<=endDate));
  }
  function summarizeExpensesByCategory(transactions=[],startDate,endDate){
    const rows=filterTransactionsByDateRange(transactions,startDate,endDate),totals=new Map();
    for(const tx of rows)if((tx.type==="expense"||tx.type==="credit_card_purchase")&&isText(tx.categoryId))totals.set(tx.categoryId,(totals.get(tx.categoryId)||0)+tx.amount);
    return [...totals.entries()].map(([categoryId,amount])=>({categoryId,amount})).sort((a,b)=>b.amount-a.amount||a.categoryId.localeCompare(b.categoryId));
  }
  function summarizeMonthlyTrend(transactions=[],months=[]){
    return months.map(month=>({month,income:calculateMonthlyIncome(transactions,month),expense:calculateMonthlyExpense(transactions,month),balance:calculateMonthlyBalance(transactions,month)}));
  }

  return Object.freeze({TRANSACTION_TYPES,ACCOUNT_TYPES,CATEGORY_TYPES,isValidDate,validateTransaction,calculateAccountBalance,calculateMonthlyIncome,calculateMonthlyExpense,calculateMonthlyCreditCardPurchases,calculateMonthlyCreditCardPayments,calculateMonthlyBalance,calculateCreditCardOutstanding,calculateTotalAssets,calculateTotalCreditCardLiabilities,calculateNetWorth,calculateCreditCardCycle,filterTransactionsByDateRange,summarizeExpensesByCategory,summarizeMonthlyTrend});
});
