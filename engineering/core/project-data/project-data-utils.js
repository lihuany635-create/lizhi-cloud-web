(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringProjectDataUtils=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  class ProjectDataValidationError extends Error{constructor(code,message,field){super(message);this.name="ProjectDataValidationError";this.code=code;this.field=field;}}
  const object=value=>value&&typeof value==="object"&&!Array.isArray(value);
  function text(value,field,{required=true,max=5000}={}){const result=String(value??"").trim();if(required&&!result)throw new ProjectDataValidationError("PROJECT_DATA_REQUIRED",`${field} 不可空白。`,field);if(result.length>max)throw new ProjectDataValidationError("PROJECT_DATA_TOO_LONG",`${field} 超過長度限制。`,field);return result;}
  function timestamp(value,field){const result=text(value,field,{max:40});if(!Number.isFinite(Date.parse(result)))throw new ProjectDataValidationError("PROJECT_DATA_TIMESTAMP_INVALID",`${field} 不是有效時間。`,field);return result;}
  function metadata(value){if(value===undefined)return Object.freeze({});if(!object(value))throw new ProjectDataValidationError("PROJECT_DATA_METADATA_INVALID","metadata 必須是物件。","metadata");return Object.freeze({...value});}
  function base(data,{updated=false}={}){if(!object(data))throw new ProjectDataValidationError("PROJECT_DATA_INVALID","Project data 必須是物件。");const result={id:text(data.id,"id",{max:160}),project_id:text(data.project_id,"project_id",{max:160}),created_at:timestamp(data.created_at,"created_at"),metadata:metadata(data.metadata)};if(updated)result.updated_at=timestamp(data.updated_at,"updated_at");return result;}
  return Object.freeze({ProjectDataValidationError,object,text,timestamp,metadata,base});
});
