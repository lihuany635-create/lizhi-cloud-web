(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringCadClient=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  class CadClientError extends Error{constructor(code,message,status=0){super(message);this.name="CadClientError";this.code=code;this.status=status;}}
  async function request(url,options){const response=await root.fetch(url,{...options,headers:{"content-type":"application/json",...(options?.headers||{})}});let payload={};try{payload=await response.json();}catch{}if(!response.ok)throw new CadClientError(payload.code||"CAD_API_FAILED",payload.message||`CAD API failed (${response.status}).`,response.status);return payload;}
  const query=value=>encodeURIComponent(String(value));
  return Object.freeze({health:()=>request("/api/engineering/cad/health"),list:(projectId,designId)=>request(`/api/engineering/cad/jobs?projectId=${query(projectId)}&designId=${query(designId)}`),generate:(projectId,spec)=>request("/api/engineering/cad/jobs",{method:"POST",body:JSON.stringify({project_id:projectId,spec})}),CadClientError});
});
