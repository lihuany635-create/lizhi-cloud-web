(function(root,factory){
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(isNode?require("../modules/woodworking/rendering/rendering-adapter.js"):root.EngineeringFurnitureRenderingAdapter,isNode?require("../modules/woodworking/rendering/projection-2d.js"):root.EngineeringFurnitureProjection2D);
  if(isNode)module.exports=api;else root.EngineeringCadDrawingSpec=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(RenderingAdapter,Projection){
"use strict";
class CadSpecError extends Error{constructor(code,message){super(message);this.name="CadSpecError";this.code=code;}}
const finitePositive=n=>typeof n==="number"&&Number.isFinite(n)&&n>0&&n<=1000000;
const validKey=s=>typeof s==="string"&&s.length>0&&s.length<=256;
function createFromDesign(design,{view="front"}={}){
 if(!["front","top","side"].includes(view))throw new CadSpecError("CAD_VIEW_INVALID","Unsupported view");
 if(!validKey(design?.id)||!validKey(design?.template_id)||!validKey(design?.template_version)||!Number.isSafeInteger(design?.revision)||design.revision<0)throw new CadSpecError("CAD_SOURCE_INVALID","Invalid design identity");
 const rendering=RenderingAdapter.fromDesign(design);
 const projection=Projection.create(rendering,view);
 if(!Array.isArray(projection.primitives)||projection.primitives.length>10000)throw new CadSpecError("CAD_ENTITY_LIMIT","Entity limit exceeded");
 const entities=projection.primitives.map((p,i)=>{
  if(p.type!=="rect"||![p.x_mm,p.y_mm].every(n=>typeof n==="number"&&Number.isFinite(n))||!finitePositive(p.width_mm)||!finitePositive(p.height_mm))throw new CadSpecError("CAD_ENTITY_INVALID","Invalid rectangle");
  return Object.freeze({id:"cad-entity-"+(i+1),type:"polyline",layer:"FURNITURE",closed:true,points:Object.freeze([[p.x_mm,p.y_mm],[p.x_mm+p.width_mm,p.y_mm],[p.x_mm+p.width_mm,p.y_mm+p.height_mm],[p.x_mm,p.y_mm+p.height_mm]].map(x=>Object.freeze(x))),source_part_key:p.logical_part_key,source_instance_key:p.instance_key});
 });
 return Object.freeze({schema_version:"cad-drawing-spec@1",units:"mm",coordinate_system:"engineering-right-handed-mm",view,source_identity:Object.freeze({design_id:design.id,template_id:design.template_id,template_version:design.template_version,revision:design.revision}),bounds:Object.freeze({...projection.bounds}),layers:Object.freeze([{name:"FURNITURE"}]),entities:Object.freeze(entities),exports:Object.freeze(["dxf","svg","png"])});
}
return Object.freeze({CadSpecError,createFromDesign});
});
