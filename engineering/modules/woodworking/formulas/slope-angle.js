(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringWoodworkingSlopeAngle=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const VERSION="1.0.0";
  const definition=Object.freeze({
    id:"woodworking.slope-angle",module_id:"woodworking",name:"坡度角（Rise / Run）",version:VERSION,status:"production",category:"角度計算",
    description:"已知垂直高度 rise 與水平距離 run，計算相對水平面的坡度角。",applicability:"只適用於直角三角形的 rise/run 坡度角，不代表等角接合斜切角。",
    assumptions:Object.freeze(["rise 與 run 使用相同單位","角度以 degree 輸出","run 必須大於 0"]),
    input_schema:Object.freeze({fields:Object.freeze({
      rise:Object.freeze({label:"垂直高度 Rise",type:"number",required:true,min:0,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      run:Object.freeze({label:"水平距離 Run",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      unit:Object.freeze({label:"尺寸單位",type:"unit",required:true,enum:Object.freeze(["mm","cm","m"]),default:"mm"})
    })}),
    output_schema:Object.freeze({fields:Object.freeze({angle_degrees:Object.freeze({type:"number",unit:"°"}),angle_unit:Object.freeze({type:"string",enum:Object.freeze(["degree"])})})}),
    supported_units:Object.freeze({length:Object.freeze(["mm","cm","m"]),angle:Object.freeze(["degree"])}),rounding_policy:Object.freeze({type:"decimal_places",places:3}),
    execute(input){return Object.freeze({result:Object.freeze({angle_degrees:Math.atan2(input.rise,input.run)*180/Math.PI,angle_unit:"degree"}),warnings:Object.freeze([{code:"DEFINED_GEOMETRY_ONLY",message:"此公式只計算 rise/run 坡度角，不可直接視為所有接合或斜切角。"}])});}
  });
  const goldenSamples=Object.freeze([
    Object.freeze({name:"forty five degrees",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({rise:100,run:100,unit:"mm"}),expected_result:Object.freeze({angle_degrees:45,angle_unit:"degree"}),tolerance:0}),
    Object.freeze({name:"zero rise",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({rise:0,run:2,unit:"m"}),expected_result:Object.freeze({angle_degrees:0,angle_unit:"degree"}),tolerance:0}),
    Object.freeze({name:"three four five",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({rise:3,run:4,unit:"cm"}),expected_result:Object.freeze({angle_degrees:36.87,angle_unit:"degree"}),tolerance:0.001})
  ]);
  return Object.freeze({definition,goldenSamples});
});
