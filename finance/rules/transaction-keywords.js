(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceTransactionKeywords=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const RULES=Object.freeze([
    Object.freeze({type:"credit_card_payment",keywords:Object.freeze(["繳卡費","繳信用卡","還卡費","付卡費","支付卡費","卡費繳款","自動扣繳卡費"])}),
    Object.freeze({type:"transfer",keywords:Object.freeze(["轉帳","轉到","轉入","轉出","轉"])}),
    Object.freeze({type:"income",keywords:Object.freeze(["薪水","薪資","收入","入帳"])}),
    Object.freeze({type:"credit_card_purchase",keywords:Object.freeze(["信用卡消費","信用卡買","刷卡","卡刷","刷","卡"])} )
  ]);
  return Object.freeze({RULES,DEFAULT_HINT:"expense"});
});
