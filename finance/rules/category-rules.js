(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceCategoryRules=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const RULES=Object.freeze([
    Object.freeze({keywords:Object.freeze(["中油","加油","汽油","捷運","公車","計程車"]),category:"交通"}),
    Object.freeze({keywords:Object.freeze(["早餐","午餐","晚餐","麥當勞"]),category:"餐飲"})
  ]);
  return Object.freeze({RULES});
});
