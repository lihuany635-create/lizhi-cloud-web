(function(root,factory){
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(
    isNode?require("./formulas/board-area.js"):root.EngineeringWoodworkingBoardArea,
    isNode?require("./formulas/board-quantity.js"):root.EngineeringWoodworkingBoardQuantity,
    isNode?require("./formulas/waste-factor.js"):root.EngineeringWoodworkingWasteFactor,
    isNode?require("./formulas/timber-weight.js"):root.EngineeringWoodworkingTimberWeight,
    isNode?require("./formulas/slope-angle.js"):root.EngineeringWoodworkingSlopeAngle
  );
  if(isNode)module.exports=api;else root.EngineeringWoodworkingFormulaPack=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(BoardArea,BoardQuantity,WasteFactor,TimberWeight,SlopeAngle){
  "use strict";
  return Object.freeze({module_id:"woodworking",version:"1.0.0",formulas:Object.freeze([BoardArea.definition,BoardQuantity.definition,WasteFactor.definition,TimberWeight.definition,SlopeAngle.definition])});
});
