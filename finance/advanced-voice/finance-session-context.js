(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceSessionContext=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const MAX_CANDIDATES=20;
  const STATES=Object.freeze({READY:"READY",NEEDS_INPUT:"NEEDS_INPUT",BLOCKED:"BLOCKED",CANCELLED:"CANCELLED",COMMITTED:"COMMITTED"});
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const chinese={一:1,二:2,兩:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10};

  function referenceIndex(reference,total){
    const text=String(reference||"").trim();
    if(/上一筆|前一筆|剛剛那筆|這筆/.test(text))return total-1;
    const match=/第([一二兩三四五六七八九十]|\d+)筆/.exec(text);
    if(!match)return null;
    const value=/^\d+$/.test(match[1])?Number(match[1]):chinese[match[1]];
    return Number.isInteger(value)?value-1:null;
  }

  function create({sessionId=`finance-${Date.now()}`,max=MAX_CANDIDATES}={}){
    let candidates=[];
    const snapshot=()=>Object.freeze({sessionId,candidates:Object.freeze(clone(candidates)),size:candidates.length});
    function add(items){
      const incoming=Array.isArray(items)?items:[items];
      if(candidates.length+incoming.length>max)throw Object.assign(new RangeError("候選交易超過工作階段上限"),{code:"SESSION_LIMIT_EXCEEDED"});
      const ids=new Set(candidates.map(row=>row.draftId));
      for(const item of incoming){if(!item?.draftId||ids.has(item.draftId))throw Object.assign(new Error("draftId 必須唯一"),{code:"DUPLICATE_DRAFT_ID"});ids.add(item.draftId);candidates.push(clone(item));}
      return snapshot();
    }
    function resolve(reference){
      const active=candidates.filter(row=>row.status!==STATES.CANCELLED);
      const text=String(reference||"");
      if(/上一筆|前一筆|剛剛那筆|這筆/.test(text))return active.length?{ok:true,candidate:clone(active.at(-1))}:{ok:false,code:"REFERENCE_NOT_FOUND"};
      const index=referenceIndex(reference,candidates.length);
      if(index!==null)return index>=0&&index<candidates.length?{ok:true,candidate:clone(candidates[index])}:{ok:false,code:"REFERENCE_NOT_FOUND"};
      const needle=String(reference||"").replace(/(?:修改|取消|刪除|更正|改成|改為)/g,"").trim();
      if(!needle)return {ok:false,code:"REFERENCE_REQUIRED"};
      const matches=active.filter(row=>[row.rawText,row.draft?.note,row.draft?.merchant].some(value=>String(value||"").includes(needle)));
      return matches.length===1?{ok:true,candidate:clone(matches[0])}:matches.length>1?{ok:false,code:"AMBIGUOUS_REFERENCE",matches:matches.map(row=>row.draftId)}:{ok:false,code:"REFERENCE_NOT_FOUND"};
    }
    function replace(draftId,next){const index=candidates.findIndex(row=>row.draftId===draftId);if(index<0)throw Object.assign(new Error("找不到候選交易"),{code:"REFERENCE_NOT_FOUND"});candidates[index]=clone(next);return clone(candidates[index]);}
    function modify(reference,patch,{validate}={}){
      const found=resolve(reference);if(!found.ok)return found;
      if([STATES.COMMITTED,STATES.CANCELLED].includes(found.candidate.status))return {ok:false,code:"IMMUTABLE_DRAFT"};
      const draft={...found.candidate.draft,...clone(patch)},validation=typeof validate==="function"?validate(draft,found.candidate):found.candidate.validation;
      const next={...found.candidate,draft,validation,status:String(validation?.status||found.candidate.status).toUpperCase()};replace(found.candidate.draftId,next);return {ok:true,candidate:clone(next)};
    }
    function cancel(reference){const found=resolve(reference);if(!found.ok)return found;if(found.candidate.status===STATES.COMMITTED)return {ok:false,code:"IMMUTABLE_DRAFT"};const next={...found.candidate,status:STATES.CANCELLED};replace(found.candidate.draftId,next);return {ok:true,candidate:clone(next)};}
    function markCommitted(draftId,transaction){const row=candidates.find(item=>item.draftId===draftId);if(!row)throw Object.assign(new Error("找不到候選交易"),{code:"REFERENCE_NOT_FOUND"});if(row.status===STATES.CANCELLED)throw Object.assign(new Error("已取消候選不可入帳"),{code:"CANCELLED_DRAFT"});return replace(draftId,{...row,status:STATES.COMMITTED,transaction:clone(transaction)});}
    function clear(){candidates=[];return snapshot();}
    function get(draftId){return clone(candidates.find(row=>row.draftId===draftId)||null);}
    function list(){return clone(candidates);}
    return Object.freeze({sessionId,max,add,resolve,modify,cancel,markCommitted,clear,get,list,snapshot});
  }
  return Object.freeze({MAX_CANDIDATES,STATES,referenceIndex,create});
});
