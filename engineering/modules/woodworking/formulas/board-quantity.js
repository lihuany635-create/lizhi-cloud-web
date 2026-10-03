(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringWoodworkingBoardQuantity=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const VERSION="1.0.0",LIMIT_WARNING=Object.freeze({code:"AREA_ESTIMATE_ONLY",message:"張數僅為面積估算，不考慮裁切排版、木紋方向、鋸路、可用餘料、缺陷或 Cutting Optimization。"});
  const definition=Object.freeze({
    id:"woodworking.board-quantity",module_id:"woodworking",name:"板材用量估算",version:VERSION,status:"production",category:"基礎計算",
    description:"以需求面積、損耗率與單張板材面積估算張數。",applicability:"初步採購面積估算，不可當成 BOM 或最佳裁切結果。",
    assumptions:Object.freeze(["需求與板材以面積比例估算","建議張數採向上取整","損耗率使用小數表示"]),
    input_schema:Object.freeze({fields:Object.freeze({
      required_area_m2:Object.freeze({label:"需求面積（m²）",type:"number",required:true,min:0,exclusiveMin:true}),
      board_length:Object.freeze({label:"單張板長",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      board_width:Object.freeze({label:"單張板寬",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      unit:Object.freeze({label:"板材尺寸單位",type:"unit",required:true,enum:Object.freeze(["mm","cm","m"]),default:"cm"}),
      waste_rate:Object.freeze({label:"損耗率（0.1 = 10%）",type:"number",required:true,min:0,max:2,default:0.1})
    })}),
    output_schema:Object.freeze({fields:Object.freeze({adjusted_required_area_m2:Object.freeze({type:"number",unit:"m²"}),single_board_area_m2:Object.freeze({type:"number",unit:"m²"}),raw_board_count:Object.freeze({type:"number"}),recommended_board_count:Object.freeze({type:"integer",count_policy:"ceil"})})}),
    supported_units:Object.freeze({length:Object.freeze(["mm","cm","m"]),area:Object.freeze(["m²"])}),rounding_policy:Object.freeze({type:"decimal_places",places:4}),
    execute(input){const adjusted=input.required_area_m2*(1+input.waste_rate),single=input.board_length*input.board_width,warnings=[LIMIT_WARNING];if(input.waste_rate>0.5)warnings.push({code:"HIGH_WASTE_RATE",message:"損耗率超過 50%，請確認輸入是否正確。"});return Object.freeze({result:Object.freeze({adjusted_required_area_m2:adjusted,single_board_area_m2:single,raw_board_count:adjusted/single,recommended_board_count:Math.ceil(adjusted/single)}),warnings:Object.freeze(warnings)});}
  });
  const goldenSamples=Object.freeze([
    Object.freeze({name:"standard sheets",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({required_area_m2:10,board_length:244,board_width:122,unit:"cm",waste_rate:0.1}),expected_result:Object.freeze({adjusted_required_area_m2:11,single_board_area_m2:2.9768,raw_board_count:3.6952,recommended_board_count:4}),tolerance:0.0001}),
    Object.freeze({name:"millimeter board",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({required_area_m2:5,board_length:2400,board_width:1200,unit:"mm",waste_rate:0}),expected_result:Object.freeze({adjusted_required_area_m2:5,single_board_area_m2:2.88,raw_board_count:1.7361,recommended_board_count:2}),tolerance:0.0001}),
    Object.freeze({name:"exact board count",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({required_area_m2:6,board_length:2,board_width:1,unit:"m",waste_rate:0}),expected_result:Object.freeze({adjusted_required_area_m2:6,single_board_area_m2:2,raw_board_count:3,recommended_board_count:3}),tolerance:0})
  ]);
  return Object.freeze({definition,goldenSamples,LIMIT_WARNING});
});
