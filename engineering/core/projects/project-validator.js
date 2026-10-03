(function(root,factory){
  const api=factory(typeof module==="object"&&module.exports?require("../project-model.js"):root.EngineeringProjectModel);
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringProjectValidator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Model){
  "use strict";
  class ProjectValidationError extends Error{
    constructor(code,message,details={}){super(message);this.name="ProjectValidationError";this.code=code;this.details=Object.freeze({...details});}
  }
  const validTimestamp=value=>typeof value==="string"&&Number.isFinite(Date.parse(value));
  const plainObject=value=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;

  function validate(project,{registry}={}){
    const normalized=Model.create(project);
    if(!normalized.id)throw new ProjectValidationError("PROJECT_ID_REQUIRED","工程專案 ID 不可空白。");
    if(!normalized.workspace_id)throw new ProjectValidationError("WORKSPACE_ID_REQUIRED","工程工作區 ID 不可空白。");
    if(!normalized.name)throw new ProjectValidationError("PROJECT_NAME_REQUIRED","請輸入工程專案名稱。");
    if(!Model.STATUSES.includes(normalized.status))throw new ProjectValidationError("PROJECT_STATUS_INVALID","工程專案狀態不正確。",{status:normalized.status});
    if(!Array.isArray(project.module_ids??project.moduleIds??[]))throw new ProjectValidationError("PROJECT_MODULES_INVALID","專業模組必須是清單。");
    if(!plainObject(project.metadata??{}))throw new ProjectValidationError("PROJECT_METADATA_INVALID","工程專案 metadata 必須是物件。");
    if(!validTimestamp(normalized.created_at)||!validTimestamp(normalized.updated_at))throw new ProjectValidationError("PROJECT_TIMESTAMP_INVALID","工程專案時間格式不正確。");
    if(Date.parse(normalized.updated_at)<Date.parse(normalized.created_at))throw new ProjectValidationError("PROJECT_TIMESTAMP_ORDER_INVALID","更新時間不可早於建立時間。");
    for(const moduleId of normalized.module_ids){
      if(!registry?.get?.(moduleId))throw new ProjectValidationError("PROJECT_MODULE_UNKNOWN","找不到指定的專業模組。",{moduleId});
    }
    try{JSON.stringify(normalized.metadata);}catch{throw new ProjectValidationError("PROJECT_METADATA_INVALID","工程專案 metadata 無法保存。");}
    return normalized;
  }
  return Object.freeze({ProjectValidationError,validate});
});
