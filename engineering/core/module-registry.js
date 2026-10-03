(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else{
    root.EngineeringModuleRegistryApi=api;
    root.EngineeringModuleRegistry=api.createRegistry();
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const REQUIRED_FIELDS=["id","name","version","status","capabilities"];

  function normalizeModule(candidate){
    if(!candidate||typeof candidate!=="object")throw new TypeError("Engineering module must be an object");
    for(const field of REQUIRED_FIELDS){
      if(candidate[field]===undefined||candidate[field]===null)throw new TypeError(`Engineering module is missing ${field}`);
    }
    const id=String(candidate.id).trim();
    const name=String(candidate.name).trim();
    const version=String(candidate.version).trim();
    const status=String(candidate.status).trim();
    if(!/^[a-z][a-z0-9-]*$/.test(id))throw new TypeError("Engineering module id is invalid");
    if(!name||!version||!status)throw new TypeError("Engineering module metadata cannot be empty");
    if(!Array.isArray(candidate.capabilities))throw new TypeError("Engineering module capabilities must be an array");
    return Object.freeze({id,name,version,status,capabilities:Object.freeze([...candidate.capabilities])});
  }

  function createRegistry(){
    const modules=new Map();
    const failures=[];
    return Object.freeze({
      register(candidate){
        const definition=normalizeModule(candidate);
        if(modules.has(definition.id))throw new Error(`Engineering module already registered: ${definition.id}`);
        modules.set(definition.id,definition);
        return definition;
      },
      recordFailure(error){
        failures.push({message:error instanceof Error?error.message:String(error),at:new Date().toISOString()});
      },
      get(id){return modules.get(String(id))||null;},
      list(){return [...modules.values()];},
      failures(){return failures.map(item=>({...item}));},
      clear(){modules.clear();failures.length=0;}
    });
  }

  return Object.freeze({REQUIRED_FIELDS:Object.freeze([...REQUIRED_FIELDS]),normalizeModule,createRegistry});
});
