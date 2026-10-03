(function(root,factory){
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(root,isNode?require("../project-model.js"):root.EngineeringProjectModel,isNode?require("./project-validator.js"):root.EngineeringProjectValidator);
  if(isNode)module.exports=api;else root.EngineeringProjectService=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,Model,Validator){
  "use strict";
  class ProjectServiceError extends Error{
    constructor(code,message,cause){super(message,{cause});this.name="ProjectServiceError";this.code=code;}
  }
  const randomId=()=>root.crypto?.randomUUID?.()||`project-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function create({repository,registry,workspaceId,now=()=>new Date().toISOString(),idGenerator=randomId}){
    if(!repository||!registry||!String(workspaceId||"").trim())throw new TypeError("Project service dependencies are required");
    const workspace_id=String(workspaceId).trim();
    const checked=project=>Validator.validate(project,{registry});
    async function owned(projectId){
      const project=await repository.getById(projectId);
      if(!project||project.workspace_id!==workspace_id)throw new ProjectServiceError("PROJECT_NOT_FOUND","找不到工程專案。");
      return project;
    }
    async function save(existing,changes,operation="update"){
      const timestamp=now();
      const project=checked(Model.create({...existing,...changes,id:existing.id,workspace_id:existing.workspace_id,created_at:existing.created_at,updated_at:timestamp}));
      return operation==="archive"?repository.archive(project):operation==="reopen"?repository.reopen(project):repository.update(project);
    }
    return Object.freeze({
      async createProject(input={}){
        const timestamp=now();
        const project=checked(Model.create({id:idGenerator(),workspace_id,name:input.name,status:"active",module_ids:input.module_ids||input.moduleIds||[],created_at:timestamp,updated_at:timestamp,metadata:input.metadata||{}}));
        return repository.create(project);
      },
      getProject:owned,
      async listProjects(){return (await repository.list()).filter(project=>project.workspace_id===workspace_id);},
      async updateProject(projectId,changes={}){
        const existing=await owned(projectId);
        return save(existing,{name:changes.name??existing.name,metadata:changes.metadata??existing.metadata,module_ids:changes.module_ids??changes.moduleIds??existing.module_ids});
      },
      async archiveProject(projectId){const existing=await owned(projectId);return existing.status==="archived"?existing:save(existing,{status:"archived"},"archive");},
      async reopenProject(projectId){const existing=await owned(projectId);return existing.status==="active"?existing:save(existing,{status:"active"},"reopen");},
      async associateModule(projectId,moduleId){
        const existing=await owned(projectId),id=String(moduleId||"").trim();
        if(!registry.get(id))throw new Validator.ProjectValidationError("PROJECT_MODULE_UNKNOWN","找不到指定的專業模組。",{moduleId:id});
        return save(existing,{module_ids:[...new Set([...existing.module_ids,id])]});
      },
      async removeModule(projectId,moduleId){
        const existing=await owned(projectId),id=String(moduleId||"").trim();
        return save(existing,{module_ids:existing.module_ids.filter(item=>item!==id)});
      }
    });
  }
  return Object.freeze({ProjectServiceError,create});
});
