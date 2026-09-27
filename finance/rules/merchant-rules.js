(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceMerchantRules=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const RULES=Object.freeze([
    Object.freeze({keywords:Object.freeze(["台灣中油","中油"]),merchant:"中油"}),
    Object.freeze({keywords:Object.freeze(["全聯","px mart","pxmart"]),merchant:"全聯"}),
    Object.freeze({keywords:Object.freeze(["麥當勞","mcdonald"]),merchant:"麥當勞"})
  ]);
  return Object.freeze({RULES});
});
