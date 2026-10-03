(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringProjectModel=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const STATUSES=Object.freeze(["active","archived"]);
  const FIELDS=Object.freeze(["id","workspace_id","name","status","module_ids","created_at","updated_at","metadata"]);

  function plainObject(value){
    return value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  }

  function create(input={}){
    const now=new Date().toISOString();
    const project={
      id:String(input.id||"").trim(),
      workspace_id:String(input.workspace_id||input.workspaceId||"").trim(),
      name:String(input.name||"").trim(),
      status:String(input.status||"active").trim(),
      module_ids:[...new Set((input.module_ids||input.moduleIds||[]).map(value=>String(value).trim()).filter(Boolean))],
      created_at:String(input.created_at||input.createdAt||now),
      updated_at:String(input.updated_at||input.updatedAt||input.created_at||input.createdAt||now),
      metadata:{...plainObject(input.metadata)}
    };
    return Object.freeze({...project,module_ids:Object.freeze(project.module_ids),metadata:Object.freeze(project.metadata)});
  }

  function toRecord(project){
    const normalized=create(project);
    return Object.fromEntries(FIELDS.map(field=>[field,field==="module_ids"?[...normalized[field]]:field==="metadata"?{...normalized[field]}:normalized[field]]));
  }

  return Object.freeze({STATUSES,FIELDS,create,toRecord});
});
