(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceCommandRouter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const INTENTS=Object.freeze({ADD_TRANSACTIONS:"ADD_TRANSACTIONS",MODIFY_DRAFT:"MODIFY_DRAFT",CANCEL_DRAFT:"CANCEL_DRAFT",QUERY_LEDGER:"QUERY_LEDGER",HELP:"HELP",UNKNOWN:"UNKNOWN"});
  const ALLOWED=new Set(Object.values(INTENTS));
  const trim=value=>typeof value==="string"?value.trim():"";

  function deterministicIntent(text){
    if(!text)return INTENTS.UNKNOWN;
    if(/^(幫助|說明|怎麼用|可以做什麼|help)$/i.test(text))return INTENTS.HELP;
    if(/(?:取消|刪除|不要)(?:第[一二三四五六七八九十\d]+筆|上一筆|前一筆|這筆|剛剛那筆|草稿|候選)/.test(text))return INTENTS.CANCEL_DRAFT;
    if(/(?:修改|改成|更正|調整)(?:第[一二三四五六七八九十\d]+筆|上一筆|前一筆|這筆|剛剛那筆|草稿|候選)?|第[一二三四五六七八九十\d]+筆.*(?:改成|改為)/.test(text))return INTENTS.MODIFY_DRAFT;
    if(/(?:多少|幾筆|查詢|查一下|顯示|列出|最近|本月|這個月|今天).*(?:支出|收入|餘額|未繳|交易|花)|(?:帳戶|信用卡).*(?:餘額|未繳)|(?:今天|本月|這個月)(?:花了|收入)|(?:本月|這個月).*(?:多少|幾筆)|(?:還有多少|未繳多少|卡費)/.test(text))return INTENTS.QUERY_LEDGER;
    if(/^(?:全部確認|確認全部|全部入帳|全部記帳|確認第.+筆)$/.test(text))return INTENTS.UNKNOWN;
    if(/[\d零〇一二兩三四五六七八九十百千萬億]|(?:早餐|午餐|晚餐|加油|停車|薪水|轉帳|繳卡|買)/.test(text))return INTENTS.ADD_TRANSACTIONS;
    return INTENTS.UNKNOWN;
  }

  function normalizeAiIntent(value){
    const intent=typeof value==="string"?value:typeof value?.intent==="string"?value.intent:"";
    return ALLOWED.has(intent)?intent:INTENTS.UNKNOWN;
  }

  async function route(input,{classify}={}){
    const text=trim(input),deterministic=deterministicIntent(text);
    if(deterministic!==INTENTS.UNKNOWN||!text||typeof classify!=="function")return Object.freeze({intent:deterministic,text,source:"deterministic",writeAllowed:false});
    try{
      const intent=normalizeAiIntent(await classify(text));
      return Object.freeze({intent,text,source:intent===INTENTS.UNKNOWN?"fallback":"ai-enum",writeAllowed:false});
    }catch{
      return Object.freeze({intent:INTENTS.UNKNOWN,text,source:"fallback",writeAllowed:false});
    }
  }

  return Object.freeze({INTENTS,deterministicIntent,normalizeAiIntent,route});
});
