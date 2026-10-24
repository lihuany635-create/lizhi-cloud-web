"use strict";
const crypto=require("node:crypto");
class CadExportError extends Error{constructor(code,message){super(message);this.name="CadExportError";this.code=code;}}
function prepareJob(spec,{projectId,exporterVersion="cadcraft-0.12.0"}={}){
 if(spec?.schema_version!=="cad-drawing-spec@1"||spec.units!=="mm"||!["front","top","side"].includes(spec.view)||!Array.isArray(spec.entities)||spec.entities.length>10000)throw new CadExportError("CAD_SPEC_INVALID","Invalid CAD spec");
 if(typeof projectId!=="string"||!/^[-_a-zA-Z0-9]{1,128}$/.test(projectId))throw new CadExportError("CAD_PROJECT_INVALID","Invalid project");
 const src=spec.source_identity;
 if(!src||typeof src.design_id!=="string"||!src.design_id||!Number.isSafeInteger(src.revision)||src.revision<0)throw new CadExportError("CAD_SOURCE_INVALID","Missing revision");
 const lines=["_-LAYER","_M","FURNITURE",""];
 for(const item of spec.entities){
  if(item.type!=="polyline"||item.closed!==true||item.layer!=="FURNITURE"||!Array.isArray(item.points)||item.points.length<3||item.points.length>10000)throw new CadExportError("CAD_ENTITY_UNSUPPORTED","Unsupported entity");
  const points=item.points.map(pair=>{
   if(!Array.isArray(pair)||pair.length!==2||pair.some(n=>typeof n!=="number"||!Number.isFinite(n)||Math.abs(n)>1e6))throw new CadExportError("CAD_COORD_INVALID","Invalid coordinates");
   return pair.join(",");
  });
  lines.push("_PLINE",...points,"_C");
 }
 const script=lines.join("\n")+"\n";
 const stable=JSON.stringify({projectId,source:src,view:spec.view,exporterVersion,script});
 const key=crypto.createHash("sha256").update(stable).digest("hex");
 return Object.freeze({job_key:key,source_identity:Object.freeze({...src}),project_id:projectId,view:spec.view,exporter_version:exporterVersion,script,expected_entities:spec.entities.length,formats:Object.freeze(["dxf","svg","png"]),status:"prepared_not_executed"});
}
function verifyArtifact(job,{format,sha256,byteSize}){
 if(!job?.job_key||!job.formats.includes(format)||typeof sha256!=="string"||!/^[0-9a-f]{64}$/.test(sha256)||!Number.isSafeInteger(byteSize)||byteSize<=0)throw new CadExportError("CAD_ARTIFACT_INVALID","Invalid artifact metadata");
 return Object.freeze({job_key:job.job_key,format,sha256,byte_size:byteSize,source_identity:job.source_identity,exporter_version:job.exporter_version,verified_content:false});
}
module.exports=Object.freeze({CadExportError,prepareJob,verifyArtifact});
