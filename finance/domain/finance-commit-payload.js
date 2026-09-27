(function(root,factory){
  const api=factory(typeof module!=="undefined"&&module.exports?require("./finance-domain.js"):root.FinanceDomain);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceCommitPayload=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain){
  "use strict";

  function buildFinanceCommitPayload(validationResult){
    if(!validationResult||validationResult.status!=="ready"||validationResult.commitEligible!==true)throw new TypeError("只有 READY 且 commitEligible 的驗證結果可以建立 payload");
    const draft=validationResult.draft,resolved=validationResult.resolved||{};
    const payload={type:draft.type,amount:draft.amount,date:draft.date,note:draft.note||draft.merchant||""};
    if(draft.type==="income"||draft.type==="expense")Object.assign(payload,{accountId:resolved.account.id,categoryId:resolved.category.id});
    if(draft.type==="transfer")Object.assign(payload,{fromAccountId:resolved.fromAccount.id,toAccountId:resolved.toAccount.id});
    if(draft.type==="credit_card_purchase")Object.assign(payload,{creditCardId:resolved.creditCard.id,categoryId:resolved.category.id});
    if(draft.type==="credit_card_payment")Object.assign(payload,{accountId:resolved.account.id,creditCardId:resolved.creditCard.id});
    const refs={accounts:[resolved.account,resolved.fromAccount,resolved.toAccount].filter(Boolean),creditCards:resolved.creditCard?[resolved.creditCard]:[],categories:resolved.category?[resolved.category]:[]};
    const checked=Domain.validateTransaction(payload,refs);
    if(!checked.valid)throw new TypeError(checked.errors[0]?.message||"Commit payload 不符合既有 Finance Domain");
    return Object.freeze(payload);
  }

  return Object.freeze({buildFinanceCommitPayload});
});
