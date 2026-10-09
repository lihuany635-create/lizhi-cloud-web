(function(root,factory){
  const isNode=typeof module!=="undefined"&&module.exports;
  const api=factory(isNode?require("../domain/finance-domain.js"):root.FinanceDomain);
  if(isNode)module.exports=api;
  root.FinanceLedgerQuery=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain){
  "use strict";
  const TYPES=Object.freeze({TODAY_EXPENSE:"TODAY_EXPENSE",MONTH_CATEGORY_EXPENSE:"MONTH_CATEGORY_EXPENSE",RECENT_TRANSACTIONS:"RECENT_TRANSACTIONS",ACCOUNT_BALANCE:"ACCOUNT_BALANCE",CARD_OUTSTANDING:"CARD_OUTSTANDING",MONTH_INCOME:"MONTH_INCOME"});
  const pad=value=>String(value).padStart(2,"0");
  const monthRange=month=>{const [year,value]=month.split("-").map(Number),last=new Date(year,value,0).getDate();return [`${month}-01`,`${month}-${pad(last)}`];};
  const active=rows=>(rows||[]).filter(row=>!row.archived);
  function uniqueEntity(rows,text){const matches=active(rows).filter(row=>text.includes(row.name)||[...(row.aliases||[])].some(alias=>text.includes(alias)));return matches.length===1?{ok:true,value:matches[0]}:matches.length>1?{ok:false,code:"AMBIGUOUS_ENTITY"}:{ok:false,code:"ENTITY_NOT_FOUND"};}
  function parse(input,{currentDate}={}){
    const text=String(input||"").trim(),date=currentDate||new Date().toISOString().slice(0,10),month=date.slice(0,7);
    if(/今天.*(?:支出|花了|消費)/.test(text))return {ok:true,query:{type:TYPES.TODAY_EXPENSE,date}};
    if(/(?:本月|這個月).*收入/.test(text))return {ok:true,query:{type:TYPES.MONTH_INCOME,month}};
    let match=/(?:最近|列出最近)(\d+|[一二兩三四五六七八九十]+)筆/.exec(text);if(match){const chinese={一:1,二:2,兩:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10};const limit=/^\d+$/.test(match[1])?Number(match[1]):chinese[match[1]]||5;return {ok:true,query:{type:TYPES.RECENT_TRANSACTIONS,limit:Math.min(Math.max(limit,1),20)}};}
    if(/(?:本月|這個月).*(?:分類|餐飲|交通|娛樂|日常|醫療|購物).*(?:支出|花了|消費)|(?:本月|這個月)(?:餐飲|交通|娛樂|日常|醫療|購物)/.test(text))return {ok:true,query:{type:TYPES.MONTH_CATEGORY_EXPENSE,month,entityText:text}};
    if(/(?:未繳|卡費|信用卡欠)/.test(text))return {ok:true,query:{type:TYPES.CARD_OUTSTANDING,entityText:text}};
    if(/(?:餘額|還有多少)/.test(text))return {ok:true,query:{type:TYPES.ACCOUNT_BALANCE,entityText:text}};
    return {ok:false,code:"UNSUPPORTED_QUERY"};
  }
  function execute(query,{transactions=[],accounts=[],creditCards=[],categories=[],syncState="synced"}={}){
    if(!query||!Object.values(TYPES).includes(query.type))return {ok:false,code:"INVALID_QUERY"};
    let result;
    if(query.type===TYPES.TODAY_EXPENSE){const rows=transactions.filter(tx=>tx.date===query.date&&["expense","credit_card_purchase"].includes(tx.type));result={amount:rows.reduce((sum,row)=>sum+row.amount,0),count:rows.length,transactions:rows};}
    if(query.type===TYPES.MONTH_INCOME)result={amount:Domain.calculateMonthlyIncome(transactions,query.month)};
    if(query.type===TYPES.RECENT_TRANSACTIONS)result={transactions:[...transactions].sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt||"").localeCompare(String(a.createdAt||""))).slice(0,query.limit)};
    if(query.type===TYPES.ACCOUNT_BALANCE){const found=uniqueEntity(accounts,query.entityText);if(!found.ok)return found;result={entity:found.value,amount:Domain.calculateAccountBalance(found.value,transactions)};}
    if(query.type===TYPES.CARD_OUTSTANDING){const found=uniqueEntity(creditCards,query.entityText);if(!found.ok)return found;result={entity:found.value,amount:Domain.calculateCreditCardOutstanding(found.value.id,transactions)};}
    if(query.type===TYPES.MONTH_CATEGORY_EXPENSE){const found=uniqueEntity(categories,query.entityText);if(!found.ok)return found;const [start,end]=monthRange(query.month),summary=Domain.summarizeExpensesByCategory(transactions,start,end),row=summary.find(item=>item.categoryId===found.value.id);result={entity:found.value,amount:row?.amount||0};}
    return {ok:true,query,result,readOnly:true,warning:syncState==="synced"||syncState==="idle"?null:"帳本尚未完成同步，查詢結果可能不完整。"};
  }
  return Object.freeze({TYPES,parse,execute});
});
