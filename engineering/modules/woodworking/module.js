(function(root,factory){
  const definition=factory();
  if(typeof module==="object"&&module.exports)module.exports=definition;
  else{
    try{
      if(!root.EngineeringModuleRegistry)throw new Error("Engineering Module Registry is unavailable");
      root.EngineeringModuleRegistry.register(definition);
    }catch(error){
      root.EngineeringModuleRegistry?.recordFailure?.(error);
    }
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  return Object.freeze({
    id:"woodworking",
    name:"木工",
    version:"1.0.0",
    status:"ready",
    capabilities:Object.freeze(["woodworking-tools","calculation-history"])
  });
});
