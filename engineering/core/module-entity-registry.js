(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringModuleEntityRegistry=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  class ModuleEntityRegistryError extends Error{constructor(code,message){super(message);this.name="ModuleEntityRegistryError";this.code=code;}}
  const key=(moduleId,entityType)=>`${String(moduleId||"").trim()}:${String(entityType||"").trim()}`;
  function createRegistry(){const resolvers=new Map();return Object.freeze({
    register({module_id,entity_type,resolve}){const identity=key(module_id,entity_type);if(!/^[a-z][a-z0-9-]*:[a-z][a-z0-9_-]*$/.test(identity)||typeof resolve!=="function")throw new ModuleEntityRegistryError("MODULE_ENTITY_REGISTRATION_INVALID","Module Entity resolver 定義無效。");if(resolvers.has(identity))throw new ModuleEntityRegistryError("MODULE_ENTITY_DUPLICATE",`Module Entity resolver 已註冊：${identity}`);resolvers.set(identity,resolve);return identity;},
    async resolve(compositeId){const [moduleId,entityType,...idParts]=String(compositeId||"").split(":"),id=idParts.join(":");if(!moduleId||!entityType||!id)throw new ModuleEntityRegistryError("MODULE_ENTITY_ID_INVALID","Module Entity ID 格式無效。");const resolver=resolvers.get(key(moduleId,entityType));if(!resolver)throw new ModuleEntityRegistryError("MODULE_ENTITY_UNAVAILABLE","找不到 Module Entity resolver。");return resolver(id);},
    list(){return[...resolvers.keys()];}
  });}
  return Object.freeze({ModuleEntityRegistryError,createRegistry,create:createRegistry});
});
