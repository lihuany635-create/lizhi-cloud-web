(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringCalculationResult=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  function success({formula,input,result,warnings=[],meta={}}){return Object.freeze({ok:true,formula_id:formula.id,formula_version:formula.version,input:clone(input),result:clone(result),warnings:Object.freeze(clone(warnings)),errors:Object.freeze([]),meta:Object.freeze(clone(meta))});}
  function failure({formulaId,formulaVersion=null,input={},errors=[],warnings=[],meta={}}){return Object.freeze({ok:false,formula_id:String(formulaId||""),formula_version:formulaVersion,input:clone(input),result:null,warnings:Object.freeze(clone(warnings)),errors:Object.freeze(clone(errors)),meta:Object.freeze(clone(meta))});}
  function error(code,message,details={}){return Object.freeze({code,message,details:Object.freeze(clone(details))});}
  return Object.freeze({success,failure,error});
});
