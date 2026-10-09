(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceMultiTransactionParser=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const MAX_TRANSACTIONS=10;
  const makeId=(sessionId,index)=>`${sessionId||"finance-session"}:draft:${index+1}`;

  function segmentTransactions(input,{max=MAX_TRANSACTIONS}={}){
    const text=typeof input==="string"?input:"",segments=[];
    const divider=/(?:[；;。\n]+|[，,](?=\s*[^，,；;。\n]*[\d零〇一二兩三四五六七八九十百千萬億])|\s*(?:然後|接著|另外|還有)\s*)/g;
    let start=0,match;
    const add=(from,to)=>{let left=from,right=to;while(left<right&&/\s/.test(text[left]))left++;while(right>left&&/\s/.test(text[right-1]))right--;if(right>left)segments.push(Object.freeze({text:text.slice(left,right),sourceSpan:Object.freeze({start:left,end:right})}));};
    while((match=divider.exec(text))){add(start,match.index);start=match.index+match[0].length;}
    add(start,text.length);
    if(segments.length>max)return Object.freeze({ok:false,code:"TOO_MANY_TRANSACTIONS",segments:Object.freeze(segments),max});
    return Object.freeze({ok:segments.length>0,code:segments.length?null:"EMPTY_INPUT",segments:Object.freeze(segments),max});
  }

  async function parse(input,{parseDraft,validateDraft,sessionId="finance-session",max=MAX_TRANSACTIONS}={}){
    const result=segmentTransactions(input,{max});
    if(!result.ok)return Object.freeze({...result,candidates:Object.freeze([])});
    if(typeof parseDraft!=="function"||typeof validateDraft!=="function")throw new TypeError("parseDraft 與 validateDraft 為必要函式");
    const candidates=[];
    for(let index=0;index<result.segments.length;index++){
      const segment=result.segments[index],parsed=await parseDraft(segment.text,index),draft=parsed?.draft||parsed;
      const validation=await validateDraft(draft,parsed,index),issues=[...(parsed?.issues||[]),...(validation?.issues||[]),...(validation?.invalidFields||[])];
      candidates.push(Object.freeze({draftId:makeId(sessionId,index),index,rawText:segment.text,sourceSpan:segment.sourceSpan,draft,lockedFields:Object.freeze([...(parsed?.lockedFields||parsed?.ruleResult?.lockedFields||[])]),issues:Object.freeze(issues),validation,status:String(validation?.status||"needs_input").toUpperCase()}));
    }
    return Object.freeze({...result,candidates:Object.freeze(candidates)});
  }

  return Object.freeze({MAX_TRANSACTIONS,segmentTransactions,parse});
});
