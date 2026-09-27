(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceEntityResolver=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const FIELD_CONFIG=Object.freeze({
    account:Object.freeze({collection:"accounts",label:"帳戶"}),
    fromAccount:Object.freeze({collection:"accounts",label:"轉出帳戶"}),
    toAccount:Object.freeze({collection:"accounts",label:"轉入帳戶"}),
    creditCard:Object.freeze({collection:"creditCards",label:"信用卡"}),
    category:Object.freeze({collection:"categories",label:"分類"})
  });
  const key=value=>String(value??"").normalize("NFKC").trim().toLocaleLowerCase("zh-TW");
  const active=row=>row&&row.archived!==true&&row.active!==false;

  function resolveFinanceEntity(field,value,references={}){
    const config=FIELD_CONFIG[field];
    if(!config)throw new TypeError(`不支援的 Finance 實體欄位：${field}`);
    const lookup=key(value),rows=Array.isArray(references[config.collection])?references[config.collection]:[];
    if(!lookup)return Object.freeze({status:"missing",field,value:null,entity:null,candidates:Object.freeze([]),message:`${config.label}不可為空`});
    const exact=rows.filter(row=>key(row?.name)===lookup),available=exact.filter(active);
    if(available.length===1)return Object.freeze({status:"resolved",field,value:String(value).trim(),entity:Object.freeze({...available[0]}),candidates:Object.freeze([]),message:""});
    if(available.length>1)return Object.freeze({status:"ambiguous",field,value:String(value).trim(),entity:null,candidates:Object.freeze(available.map(row=>Object.freeze({id:row.id,name:row.name}))),message:`找到多筆同名${config.label}，請手動選擇`});
    if(exact.length)return Object.freeze({status:"archived",field,value:String(value).trim(),entity:null,candidates:Object.freeze(exact.map(row=>Object.freeze({id:row.id,name:row.name}))),message:`${config.label}已封存或不可用`});
    return Object.freeze({status:"not_found",field,value:String(value).trim(),entity:null,candidates:Object.freeze([]),message:`找不到對應${config.label}`});
  }

  function resolveFinanceEntities(draft,fields,references={}){
    const resolved={},outcomes={};
    for(const field of fields||[]){
      const outcome=resolveFinanceEntity(field,draft?.[field],references);
      outcomes[field]=outcome;
      if(outcome.status==="resolved")resolved[field]=outcome.entity;
    }
    return Object.freeze({resolved:Object.freeze(resolved),outcomes:Object.freeze(outcomes)});
  }

  return Object.freeze({FIELD_CONFIG,resolveFinanceEntity,resolveFinanceEntities});
});
