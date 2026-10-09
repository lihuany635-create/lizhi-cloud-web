(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceReviewBasket=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const READY="READY",COMMITTED="COMMITTED";
  function create({session,commitCandidate,onCommitted}={}){
    if(!session||typeof session.get!=="function"||typeof commitCandidate!=="function")throw new TypeError("session 與 commitCandidate 為必要參數");
    const completed=new Map(),pending=new Map(),failures=new Map();
    async function confirm(draftId){
      if(completed.has(draftId))return {ok:true,idempotent:true,draftId,transaction:completed.get(draftId)};
      if(pending.has(draftId))return pending.get(draftId);
      const candidate=session.get(draftId);
      if(!candidate)return {ok:false,code:"REFERENCE_NOT_FOUND",draftId};
      if(candidate.status!==READY||candidate.validation?.commitEligible!==true)return {ok:false,code:"NOT_COMMIT_ELIGIBLE",draftId};
      const task=(async()=>{try{const transaction=await commitCandidate(candidate);completed.set(draftId,transaction);failures.delete(draftId);session.markCommitted(draftId,transaction);let warning=null;if(typeof onCommitted==="function")try{await onCommitted(candidate,transaction);}catch(error){warning=error;}return {ok:true,idempotent:false,draftId,transaction,warning};}catch(error){failures.set(draftId,error);return {ok:false,code:"COMMIT_FAILED",draftId,error};}finally{pending.delete(draftId);}})();
      pending.set(draftId,task);return task;
    }
    async function confirmAll(){const targets=session.list().filter(row=>row.status===READY&&row.validation?.commitEligible===true&&!completed.has(row.draftId));const results=[];for(const row of targets)results.push(await confirm(row.draftId));return {ok:results.every(row=>row.ok),results,committed:results.filter(row=>row.ok).length,failed:results.filter(row=>!row.ok).length,skipped:session.list().length-targets.length};}
    async function retryFailed(){const ids=[...failures.keys()],results=[];for(const id of ids)results.push(await confirm(id));return {ok:results.every(row=>row.ok),results};}
    return Object.freeze({confirm,confirmAll,retryFailed,state:()=>({completed:[...completed.keys()],pending:[...pending.keys()],failures:[...failures.keys()]})});
  }
  return Object.freeze({create});
});
