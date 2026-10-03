(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringRoundingPolicy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  class RoundingPolicyError extends Error{constructor(message){super(message);this.name="RoundingPolicyError";this.code="ROUNDING_POLICY_INVALID";}}
  function roundNumber(value,policy={type:"none"}){
    if(typeof value!=="number"||!Number.isFinite(value))return value;
    if(policy.type==="none")return value;
    if(policy.type==="decimal_places"){
      const places=Number(policy.places);if(!Number.isInteger(places)||places<0||places>12)throw new RoundingPolicyError("小數位數必須是 0 到 12 的整數。");
      const factor=10**places;return Math.round((value+Number.EPSILON)*factor)/factor;
    }
    if(policy.type==="significant_digits"){
      const digits=Number(policy.digits);if(!Number.isInteger(digits)||digits<1||digits>15)throw new RoundingPolicyError("有效位數必須是 1 到 15 的整數。");
      return Number(value.toPrecision(digits));
    }
    throw new RoundingPolicyError("不支援的 rounding policy。");
  }
  function apply(value,policy){
    if(Array.isArray(value))return value.map(item=>apply(item,policy));
    if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,apply(item,policy)]));
    return roundNumber(value,policy);
  }
  return Object.freeze({RoundingPolicyError,roundNumber,apply});
});
