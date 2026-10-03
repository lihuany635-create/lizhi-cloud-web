(function(root,factory){
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(isNode?require("./rectangle-area.js"):root.EngineeringRectangleArea);
  if(isNode)module.exports=api;else root.EngineeringDemoFormulaPack=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(RectangleArea){
  "use strict";
  return Object.freeze({module_id:"demo",version:"1.0.0",formulas:Object.freeze([RectangleArea.definition])});
});
