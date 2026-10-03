(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringInputValidator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const error=(field,rule,message)=>Object.freeze({code:"VALIDATION_ERROR",field,rule,message});
  const empty=value=>value===undefined||value===null||value==="";
  function validate(schema,rawInput={}){
    const fields=schema?.fields||{},input=rawInput&&typeof rawInput==="object"&&!Array.isArray(rawInput)?rawInput:{},value={},errors=[];
    for(const key of Object.keys(input))if(!Object.hasOwn(fields,key))errors.push(error(key,"unknown","不接受這個輸入欄位。"));
    for(const [name,rules] of Object.entries(fields)){
      let current=input[name];
      if(empty(current)){if(rules.required)errors.push(error(name,"required","此欄位為必填。"));continue;}
      if(rules.type==="number"){
        if(rules.coerce!==false&&typeof current==="string"&&current.trim()!=="")current=Number(current);
        if(typeof current!=="number"||!Number.isFinite(current)){errors.push(error(name,"finite_number","請輸入有效數字。"));continue;}
        if(rules.integer&&!Number.isInteger(current))errors.push(error(name,"integer","必須是整數。"));
        if(rules.min!==undefined&&(rules.exclusiveMin?current<=rules.min:current<rules.min))errors.push(error(name,"min",rules.exclusiveMin?`必須大於 ${rules.min}。`:`不得小於 ${rules.min}。`));
        if(rules.max!==undefined&&(rules.exclusiveMax?current>=rules.max:current>rules.max))errors.push(error(name,"max",rules.exclusiveMax?`必須小於 ${rules.max}。`:`不得大於 ${rules.max}。`));
      }else if(rules.type==="string"||rules.type==="unit")current=String(current).trim();
      if(Array.isArray(rules.enum)&&!rules.enum.includes(current))errors.push(error(name,rules.type==="unit"?"unit":"enum","輸入值不在允許清單中。"));
      value[name]=current;
    }
    return Object.freeze({ok:errors.length===0,value:Object.freeze(value),errors:Object.freeze(errors)});
  }
  return Object.freeze({validate});
});
