(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringRectangleArea=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const definition=Object.freeze({
    id:"demo.rectangle-area",module_id:"demo",name:"矩形面積",version:"1.0.0",description:"以長與寬驗證中立 Calculation Engine 的示範公式。",
    input_schema:Object.freeze({fields:Object.freeze({
      length:Object.freeze({label:"長度",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      width:Object.freeze({label:"寬度",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      unit:Object.freeze({label:"輸入單位",type:"unit",required:true,enum:Object.freeze(["mm","cm","m"])})
    })}),
    output_schema:Object.freeze({fields:Object.freeze({area:Object.freeze({type:"number"}),area_unit:Object.freeze({type:"string",enum:Object.freeze(["m²"])})})}),
    supported_units:Object.freeze({length:Object.freeze(["mm","cm","m"])}),rounding_policy:Object.freeze({type:"decimal_places",places:4}),
    execute(input){return Object.freeze({result:Object.freeze({area:input.length*input.width,area_unit:"m²"}),warnings:Object.freeze([])});}
  });
  const goldenSamples=Object.freeze([
    Object.freeze({name:"meters",input:Object.freeze({length:2,width:3,unit:"m"}),expected_result:Object.freeze({area:6,area_unit:"m²"}),formula_version:"1.0.0",tolerance:0}),
    Object.freeze({name:"centimeters",input:Object.freeze({length:250,width:120,unit:"cm"}),expected_result:Object.freeze({area:3,area_unit:"m²"}),formula_version:"1.0.0",tolerance:0}),
    Object.freeze({name:"rounding",input:Object.freeze({length:333,width:333,unit:"mm"}),expected_result:Object.freeze({area:0.1109,area_unit:"m²"}),formula_version:"1.0.0",tolerance:0.00001})
  ]);
  return Object.freeze({definition,goldenSamples});
});
