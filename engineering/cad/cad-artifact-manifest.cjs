"use strict";
const crypto=require("node:crypto");
const ALLOWED=Object.freeze({dxf:"application/dxf",svg:"image/svg+xml",png:"image/png"});
class CadArtifactError extends Error{constructor(code,message){super(message);this.name="CadArtifactError";this.code=code;}}
const validSha=s=>typeof s==="string"&&/^[a-f0-9]{64}$/.test(s);
function digest(bytes){if(!Buffer.isBuffer(bytes))throw new CadArtifactError("CAD_BYTES_INVALID","Expected file bytes");return crypto.createHash("sha256").update(bytes).digest("hex");}
function verifyAndRecord({job,format,bytes,revision,expectedSha256}){
 if(!job||!validSha(job.job_key)||!job.source_identity||typeof job.project_id!=="string")throw new CadArtifactError("CAD_JOB_INVALID","Invalid CAD job");
 if(!Object.hasOwn(ALLOWED,format))throw new CadArtifactError("CAD_FORMAT_INVALID","Unsupported CAD artifact");
 if(!Number.isSafeInteger(revision)||revision<1)throw new CadArtifactError("CAD_REVISION_INVALID","Invalid artifact revision");
 if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>100*1024*1024)throw new CadArtifactError("CAD_SIZE_INVALID","Invalid CAD artifact size");
 const actual=digest(bytes);
 if(expectedSha256!==undefined&&(!validSha(expectedSha256)||expectedSha256!==actual))throw new CadArtifactError("CAD_CHECKSUM_MISMATCH","Artifact checksum mismatch");
 const sig=bytes.subarray(0,16).toString("latin1");
 if(format==="png"&&!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new CadArtifactError("CAD_CONTENT_INVALID","Invalid PNG signature");
 if(format==="svg"&&!/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(bytes.toString("utf8").slice(0,1024)))throw new CadArtifactError("CAD_CONTENT_INVALID","Invalid SVG root");
 if(format==="dxf"&&!bytes.toString("latin1").includes("SECTION"))throw new CadArtifactError("CAD_CONTENT_INVALID","Invalid DXF marker");
 return Object.freeze({schema_version:"cad-artifact@1",job_key:job.job_key,project_id:job.project_id,source_identity:Object.freeze({...job.source_identity}),view:job.view,exporter_version:job.exporter_version,format,mime_type:ALLOWED[format],byte_size:bytes.length,sha256:actual,revision,storage_status:"not_uploaded",validated_at:null});
}
module.exports=Object.freeze({CadArtifactError,digest,verifyAndRecord,ALLOWED});
