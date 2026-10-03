(function(root,factory){
  const api=factory(typeof module==="object"&&module.exports?require("../project-model.js"):root.EngineeringProjectModel);
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringProjectRepository=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Model){
  "use strict";
  class ProjectRepositoryError extends Error{
    constructor(code,message,cause){super(message,{cause});this.name="ProjectRepositoryError";this.code=code;}
  }
  const mapError=(error,code,message)=>error instanceof ProjectRepositoryError?error:new ProjectRepositoryError(code,message,error);

  function create({persistence}){
    if(!persistence)throw new TypeError("Project repository persistence is required");
    const repository={
      async create(project){
        try{await persistence.addProject(Model.toRecord(project));return Model.create(project);}
        catch(error){
          if(error?.name==="ConstraintError"||error?.cause?.name==="ConstraintError")throw new ProjectRepositoryError("PROJECT_ALREADY_EXISTS","工程專案 ID 已存在。",error);
          throw mapError(error,"PROJECT_CREATE_FAILED","無法建立工程專案。");
        }
      },
      async getById(projectId){
        try{const row=await persistence.getProject(String(projectId));return row?Model.create(row):null;}
        catch(error){throw mapError(error,"PROJECT_READ_FAILED","無法讀取工程專案。");}
      },
      async list(){
        try{return (await persistence.listProjects()).map(Model.create).sort((a,b)=>b.updated_at.localeCompare(a.updated_at));}
        catch(error){throw mapError(error,"PROJECT_LIST_FAILED","無法讀取工程專案清單。");}
      },
      async update(project){
        try{
          if(!await persistence.getProject(project.id))throw new ProjectRepositoryError("PROJECT_NOT_FOUND","找不到工程專案。");
          await persistence.putProject(Model.toRecord(project));
          return Model.create(project);
        }catch(error){throw mapError(error,"PROJECT_UPDATE_FAILED","無法更新工程專案。");}
      },
      archive(project){return repository.update(project);},
      reopen(project){return repository.update(project);}
    };
    return Object.freeze(repository);
  }
  return Object.freeze({ProjectRepositoryError,create});
});
