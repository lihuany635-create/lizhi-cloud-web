(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringUnitConverter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const UNITS=Object.freeze({mm:Object.freeze({dimension:"length",factor:0.001}),cm:Object.freeze({dimension:"length",factor:0.01}),m:Object.freeze({dimension:"length",factor:1}),kg:Object.freeze({dimension:"mass",factor:1})});
  class UnitConversionError extends Error{constructor(code,message,details={}){super(message);this.name="UnitConversionError";this.code=code;this.details=Object.freeze({...details});}}
  function convert(value,from,to,dimension){
    const source=UNITS[from],target=UNITS[to];
    if(!source||!target)throw new UnitConversionError("UNIT_UNKNOWN","無法辨識輸入單位。",{from,to});
    if(source.dimension!==target.dimension||dimension&&(source.dimension!==dimension||target.dimension!==dimension))throw new UnitConversionError("UNIT_INCOMPATIBLE","不可在不同量綱間換算。",{from,to,dimension});
    if(typeof value!=="number"||!Number.isFinite(value))throw new UnitConversionError("UNIT_VALUE_INVALID","單位換算值必須是有限數字。");
    return value*source.factor/target.factor;
  }
  return Object.freeze({UNITS,UnitConversionError,convert});
});
