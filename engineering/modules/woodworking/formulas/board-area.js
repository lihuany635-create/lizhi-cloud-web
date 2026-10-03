(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringWoodworkingBoardArea=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const VERSION="1.0.0";
  const definition=Object.freeze({
    id:"woodworking.board-area",module_id:"woodworking",name:"板材面積",version:VERSION,status:"production",category:"基礎計算",
    description:"依單片長寬與片數估算板材總面積。",applicability:"矩形板材的面積估算；不代表裁切排版或 BOM。",
    assumptions:Object.freeze(["板材視為矩形","所有板材尺寸相同","不扣除缺角或孔洞"]),
    input_schema:Object.freeze({fields:Object.freeze({
      length:Object.freeze({label:"板長",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      width:Object.freeze({label:"板寬",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      quantity:Object.freeze({label:"片數",type:"number",required:true,integer:true,min:1,default:1}),
      unit:Object.freeze({label:"尺寸單位",type:"unit",required:true,enum:Object.freeze(["mm","cm","m"]),default:"cm"})
    })}),
    output_schema:Object.freeze({fields:Object.freeze({total_area_m2:Object.freeze({label:"總面積",type:"number",unit:"m²"}),area_unit:Object.freeze({type:"string",enum:Object.freeze(["m²"])})})}),
    supported_units:Object.freeze({length:Object.freeze(["mm","cm","m"])}),rounding_policy:Object.freeze({type:"decimal_places",places:4}),
    execute(input){return Object.freeze({result:Object.freeze({total_area_m2:input.length*input.width*input.quantity,area_unit:"m²"}),warnings:Object.freeze([{code:"AREA_ESTIMATE_ONLY",message:"面積結果不包含裁切排版、木紋方向、鋸路、餘料或板材缺陷。"}])});}
  });
  const goldenSamples=Object.freeze([
    Object.freeze({name:"centimeter board",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({length:244,width:122,quantity:1,unit:"cm"}),expected_result:Object.freeze({total_area_m2:2.9768,area_unit:"m²"}),tolerance:0}),
    Object.freeze({name:"millimeter multiple boards",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({length:2400,width:1200,quantity:3,unit:"mm"}),expected_result:Object.freeze({total_area_m2:8.64,area_unit:"m²"}),tolerance:0}),
    Object.freeze({name:"rounding",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({length:333,width:777,quantity:2,unit:"mm"}),expected_result:Object.freeze({total_area_m2:0.5175,area_unit:"m²"}),tolerance:0})
  ]);
  return Object.freeze({definition,goldenSamples});
});
