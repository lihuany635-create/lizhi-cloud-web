(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringPlatformAdapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  class UnsupportedPlatformCapabilityError extends Error{
    constructor(capability){
      super(`Platform capability is not available in Engineering Phase 0: ${capability}`);
      this.name="UnsupportedPlatformCapabilityError";
      this.code="ENGINEERING_CAPABILITY_UNAVAILABLE";
      this.capability=capability;
    }
  }

  const CONTRACT=Object.freeze(["getCurrentUser","saveRecord","loadRecord","uploadFile","sync","callAI","notify"]);

  function create(implementations={}){
    const adapter={};
    for(const capability of CONTRACT){
      adapter[capability]=typeof implementations[capability]==="function"
        ? implementations[capability]
        : async()=>{throw new UnsupportedPlatformCapabilityError(capability);};
    }
    return Object.freeze(adapter);
  }

  return Object.freeze({CONTRACT,UnsupportedPlatformCapabilityError,create});
});
