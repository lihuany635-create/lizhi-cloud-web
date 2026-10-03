(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringWoodworkingWasteFactor=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const VERSION="1.0.0";
  const definition=Object.freeze({
    id:"woodworking.waste-factor",module_id:"woodworking",name:"損耗加成",version:VERSION,status:"production",category:"基礎計算",
    description:"以 base × (1 + waste_rate) 計算含損耗需求量。",applicability:"適用於已知基礎用量與損耗率的純數學估算。",
    assumptions:Object.freeze(["損耗率使用小數表示，0.1 代表 10%","損耗均勻套用於基礎用量"]),
    input_schema:Object.freeze({fields:Object.freeze({
      base_amount:Object.freeze({label:"基礎用量",type:"number",required:true,min:0,exclusiveMin:true}),
      waste_rate:Object.freeze({label:"損耗率（0.1 = 10%）",type:"number",required:true,min:0,max:2,default:0.1})
    })}),
    output_schema:Object.freeze({fields:Object.freeze({adjusted_amount:Object.freeze({type:"number"}),waste_amount:Object.freeze({type:"number"}),rate_decimal:Object.freeze({type:"number"})})}),
    supported_units:Object.freeze({}),rounding_policy:Object.freeze({type:"decimal_places",places:4}),
    execute(input){const warnings=[];if(input.waste_rate>0.5)warnings.push({code:"HIGH_WASTE_RATE",message:"損耗率超過 50%，請確認輸入是否正確。"});return Object.freeze({result:Object.freeze({adjusted_amount:input.base_amount*(1+input.waste_rate),waste_amount:input.base_amount*input.waste_rate,rate_decimal:input.waste_rate}),warnings:Object.freeze(warnings)});}
  });
  const goldenSamples=Object.freeze([
    Object.freeze({name:"ten percent",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({base_amount:100,waste_rate:0.1}),expected_result:Object.freeze({adjusted_amount:110,waste_amount:10,rate_decimal:0.1}),tolerance:0}),
    Object.freeze({name:"zero waste",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({base_amount:12.5,waste_rate:0}),expected_result:Object.freeze({adjusted_amount:12.5,waste_amount:0,rate_decimal:0}),tolerance:0}),
    Object.freeze({name:"rounding",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({base_amount:3.3333,waste_rate:0.1234}),expected_result:Object.freeze({adjusted_amount:3.7446,waste_amount:0.4113,rate_decimal:0.1234}),tolerance:0})
  ]);
  return Object.freeze({definition,goldenSamples});
});
