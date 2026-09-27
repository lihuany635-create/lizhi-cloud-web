(function(root,factory){
  const api=factory(typeof module!=="undefined"&&module.exports?require("./finance-commit-payload.js"):root.FinanceCommitPayload);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceCommitController=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(CommitPayload){
  "use strict";

  class FinanceCommitError extends Error{
    constructor(code,message,details={},cause){super(message,{cause});this.name="FinanceCommitError";this.code=code;this.details=details;}
  }
  function stableFingerprint(payload){
    const ordered={type:payload.type,amount:payload.amount,date:payload.date,accountId:payload.accountId||null,creditCardId:payload.creditCardId||null,categoryId:payload.categoryId||null,fromAccountId:payload.fromAccountId||null,toAccountId:payload.toAccountId||null,note:payload.note||""};
    const text=JSON.stringify(ordered);let hash=2166136261;
    for(let index=0;index<text.length;index++){hash^=text.charCodeAt(index);hash=Math.imul(hash,16777619);}
    return `finance-${(hash>>>0).toString(16).padStart(8,"0")}`;
  }
  function createDuplicateGuard({ttlMs=5000,now=()=>Date.now()}={}){
    if(!Number.isSafeInteger(ttlMs)||ttlMs<1)throw new TypeError("duplicate guard ttlMs 必須是正整數");
    const entries=new Map();
    function cleanup(time){for(const [key,expires] of entries)if(expires<=time)entries.delete(key);}
    return Object.freeze({
      reserve(key){const time=now();cleanup(time);if(entries.has(key))return false;entries.set(key,time+ttlMs);return true;},
      release(key){entries.delete(key);},
      has(key){const time=now();cleanup(time);return entries.has(key);}
    });
  }
  function createFinanceCommitController({createTransaction,duplicateGuard=createDuplicateGuard()}={}){
    if(typeof createTransaction!=="function")throw new TypeError("createTransaction 必須是既有 Finance 正式建立交易函式");
    return Object.freeze({
      async commit(validationResult,{dryRun=false}={}){
        if(!validationResult||validationResult.status!=="ready"||validationResult.commitEligible!==true)return Object.freeze({ok:false,status:"rejected",code:"validation_not_ready",committed:false,payload:null});
        const payload=CommitPayload.buildFinanceCommitPayload(validationResult),fingerprint=stableFingerprint(payload);
        if(dryRun)return Object.freeze({ok:true,status:"dry_run",code:null,committed:false,payload,fingerprint});
        if(!duplicateGuard.reserve(fingerprint))return Object.freeze({ok:false,status:"blocked",code:"duplicate_transaction",committed:false,payload,fingerprint});
        try{
          const transaction=await createTransaction(payload);
          return Object.freeze({ok:true,status:"committed",code:null,committed:true,payload,fingerprint,transaction});
        }catch(error){
          duplicateGuard.release(fingerprint);
          throw new FinanceCommitError("COMMIT_FAILED",error?.message||"正式交易建立失敗",{payload,fingerprint},error);
        }
      }
    });
  }

  return Object.freeze({FinanceCommitError,stableFingerprint,createDuplicateGuard,createFinanceCommitController});
});
