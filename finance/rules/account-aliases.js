(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceAccountAliases=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const GROUPS=Object.freeze([
    Object.freeze({canonicalHints:Object.freeze(["現金"]),aliases:Object.freeze(["現金","cash"])}),
    Object.freeze({canonicalHints:Object.freeze(["國泰"]),aliases:Object.freeze(["國泰帳戶","國泰銀行","國泰"])}),
    Object.freeze({canonicalHints:Object.freeze(["台新"]),aliases:Object.freeze(["台新帳戶","台新銀行","台新"])}),
    Object.freeze({canonicalHints:Object.freeze(["中華郵政","郵局"]),aliases:Object.freeze(["郵局","郵局帳戶"])}),
    Object.freeze({canonicalHints:Object.freeze(["街口"]),aliases:Object.freeze(["街口","街口支付"])}),
    Object.freeze({canonicalHints:Object.freeze(["LINE Pay","LINEPAY"]),aliases:Object.freeze(["line pay","linepay"])} )
  ]);
  return Object.freeze({GROUPS});
});
