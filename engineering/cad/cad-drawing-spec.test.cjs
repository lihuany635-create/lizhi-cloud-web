"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const file=path.join(__dirname,"cad-drawing-spec.js");
const source=fs.readFileSync(file,"utf8");
function moduleWithProjection(primitives){
 const imports={
  "../modules/woodworking/rendering/rendering-adapter.js":{fromDesign:(design)=>({design})},
  "../modules/woodworking/rendering/projection-2d.js":{create:(_,view)=>({view,bounds:{x_mm:0,y_mm:0,width_mm:800,height_mm:900},primitives})}
 };
 const module={exports:{}};
 vm.runInNewContext(source,{module,exports:module.exports,require:(key)=>{if(!Object.hasOwn(imports,key))throw Error(key);return imports[key];}});
 return module.exports;
}
const design={id:"design-test",template_id:"woodworking.open-box-cabinet",template_version:"1.1.0",revision:1};
test("converts six rectangles into immutable millimetre CAD polylines",()=>{
 const parts=Array.from({length:6},(_,i)=>({type:"rect",logical_part_key:"part"+i,instance_key:"instance"+i,x_mm:i*10,y_mm:0,width_mm:100,height_mm:200}));
 const spec=moduleWithProjection(parts).createFromDesign(design);
 assert.equal(spec.units,"mm");assert.equal(spec.schema_version,"cad-drawing-spec@1");
 assert.equal(spec.entities.length,6);assert.equal(spec.entities[0].closed,true);
 assert.deepEqual(Array.from(spec.entities[0].points[0]),[0,0]);
 assert.equal(spec.source_identity.revision,1);
 assert.equal(Object.isFrozen(spec.entities[0]),true);
});
test("rejects invalid CAD bounds and unsupported view",()=>{
 const api=moduleWithProjection([{type:"rect",x_mm:0,y_mm:0,width_mm:-1,height_mm:10}]);
 assert.throws(()=>api.createFromDesign(design),{code:"CAD_ENTITY_INVALID"});
 assert.throws(()=>api.createFromDesign(design,{view:"oblique"}),{code:"CAD_VIEW_INVALID"});
});
test("fails closed for missing source revision",()=>{
 assert.throws(()=>moduleWithProjection([]).createFromDesign({...design,revision:undefined}),{code:"CAD_SOURCE_INVALID"});
});
