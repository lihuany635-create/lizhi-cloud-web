(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceCardAliases=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const GROUPS=Object.freeze([
    Object.freeze({canonicalHints:Object.freeze(["台新"]),aliases:Object.freeze(["台新卡","台新信用卡","台新"])}),
    Object.freeze({canonicalHints:Object.freeze(["國泰","CUBE"]),aliases:Object.freeze(["國泰CUBE卡","cube卡","國泰卡","cube","國泰"])}),
    Object.freeze({canonicalHints:Object.freeze(["玉山"]),aliases:Object.freeze(["玉山卡","玉山信用卡","玉山"])}),
    Object.freeze({canonicalHints:Object.freeze(["中信","中國信託"]),aliases:Object.freeze(["中信卡","中國信託卡","中信"])} )
  ]);
  return Object.freeze({GROUPS});
});
