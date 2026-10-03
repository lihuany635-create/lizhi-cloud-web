(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringWoodworkingTimberWeight=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const VERSION="1.0.0",DENSITY_WARNING=Object.freeze({code:"USER_SUPPLIED_DENSITY",message:"密度為使用者輸入；木材樹種、含水率與材料狀態會影響實際重量。"});
  const definition=Object.freeze({
    id:"woodworking.timber-weight",module_id:"woodworking",name:"木料重量估算",version:VERSION,status:"production",category:"基礎計算",
    description:"以矩形木料體積乘以使用者提供的密度估算重量。",applicability:"矩形實木或可用等效密度表示的材料重量估算。",
    assumptions:Object.freeze(["木料視為完整矩形體","密度由使用者自行提供，單位固定為 kg/m³"]),
    input_schema:Object.freeze({fields:Object.freeze({
      length:Object.freeze({label:"長度",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      width:Object.freeze({label:"寬度",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      thickness:Object.freeze({label:"厚度",type:"number",required:true,min:0,exclusiveMin:true,unit_field:"unit",canonical_unit:"m",dimension:"length"}),
      unit:Object.freeze({label:"尺寸單位",type:"unit",required:true,enum:Object.freeze(["mm","cm","m"]),default:"mm"}),
      density_kg_m3:Object.freeze({label:"密度（kg/m³）",type:"number",required:true,min:0,exclusiveMin:true,max:5000})
    })}),
    output_schema:Object.freeze({fields:Object.freeze({volume_m3:Object.freeze({type:"number",unit:"m³"}),mass_kg:Object.freeze({type:"number",unit:"kg"}),mass_unit:Object.freeze({type:"string",enum:Object.freeze(["kg"])})})}),
    supported_units:Object.freeze({length:Object.freeze(["mm","cm","m"]),density:Object.freeze(["kg/m³"]),mass:Object.freeze(["kg"])}),rounding_policy:Object.freeze({type:"decimal_places",places:4}),
    execute(input){const volume=input.length*input.width*input.thickness;return Object.freeze({result:Object.freeze({volume_m3:volume,mass_kg:volume*input.density_kg_m3,mass_unit:"kg"}),warnings:Object.freeze([DENSITY_WARNING])});}
  });
  const goldenSamples=Object.freeze([
    Object.freeze({name:"millimeter timber",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({length:2000,width:100,thickness:50,unit:"mm",density_kg_m3:600}),expected_result:Object.freeze({volume_m3:0.01,mass_kg:6,mass_unit:"kg"}),tolerance:0}),
    Object.freeze({name:"centimeter timber",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({length:200,width:10,thickness:5,unit:"cm",density_kg_m3:700}),expected_result:Object.freeze({volume_m3:0.01,mass_kg:7,mass_unit:"kg"}),tolerance:0}),
    Object.freeze({name:"rounding",formula_id:definition.id,formula_version:VERSION,input:Object.freeze({length:1234,width:87,thickness:19,unit:"mm",density_kg_m3:543}),expected_result:Object.freeze({volume_m3:0.002,mass_kg:1.1076,mass_unit:"kg"}),tolerance:0.0001})
  ]);
  return Object.freeze({definition,goldenSamples,DENSITY_WARNING});
});
