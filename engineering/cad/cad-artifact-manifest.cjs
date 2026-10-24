"use strict";
const crypto=require("node:crypto");
const ALLOWED=Object.freeze({dxf:"application/dxf",svg:"image/svg+xml",png:"image/png"});
class CadArtifactError extends Error{constructor(code,message){super(message);this.name="CadArtifactError";this.code=code;}}
const validSha=s=>typeof s==="string"&&/^[0-9a-f]{64}$/.test(s);
function digest(bytes){if(!Buffer.isBuffer(bytes))throw new CadArtifactError("CAD_BYTES_INVALID","Expected Buffer");return crypto.createHash("sha256").update(bytes).digest("hex");}
function verifyAndRecord({job,format,bytes,revision,expectedSha256}){
 if(!job||!validSha(job.job_key)||!job.source_identity||typeof job.project_id!=="string")throw new CadArtifactError("CAD_JOB_INVALID","Invalid CAD job");
 if(!Object.hasOwn(ALLOWED,format))throw new CadArtifactError("CAD_FORMAT_INVALID","Unsupported CAD format");
 if(!Number.isSafeInteger(revision)||revision<1)throw new CadArtifactError("CAD_REVISION_INVALID","Invalid revision");
 if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>100*1024*1024)throw new CadArtifactError("CAD_SIZE_INVALID","Invalid artifact size");
 const actual=digest(bytes);
 if(expectedSha256!==undefined&&(!validSha(expectedSha256)||actual!==expectedSha256))throw new CadArtifactError("CAD_CHECKSUM_MISMATCH","SHA mismatch");
 if(format==="png"){
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  if(bytes.length<24||!bytes.subarray(0,8).equals(sig)||bytes.toString("ascii",12,16)!=="IHDR")throw new CadArtifactError("CAD_CONTENT_INVALID","Invalid PNG header");
 }
 if(format==="svg"){
  const value=bytes.toString("utf8");
  if(!/^\s*(?:<\?xml[^>]*>\s*)?<svg(?:\s|>)/i.test(value)||!/<\/svg\s*>\s*$/i.test(value))throw new CadArtifactError("CAD_CONTENT_INVALID","Invalid SVG document envelope");
  if(/<\s*(?:script|foreignObject|iframe|object|embed|image|use|animate|set)\b|\bon[a-z]+\s*=|(?:href|src)\s*=|url\s*\(|<!DOCTYPE|<!ENTITY|<\?[^x]|javascript\s*:/i.test(value))throw new CadArtifactError("CAD_SVG_ACTIVE_CONTENT","Active or external SVG content rejected");
 }
 if(format==="dxf"){
  const value=bytes.toString("latin1");
  if(!/(?:^|\r?\n)\s*0\r?\nSECTION\r?\n/.test(value)||!/(?:^|\r?\n)\s*0\r?\nEOF\s*$/.test(value))throw new CadArtifactError("CAD_CONTENT_INVALID","DXF structure markers missing");
 }
 return Object.freeze({schema_version:"cad-artifact@1",job_key:job.job_key,project_id:job.project_id,source_identity:Object.freeze({...job.source_identity}),view:job.view,exporter_version:job.exporter_version,format,mime_type:ALLOWED[format],byte_size:bytes.length,sha256:actual,revision,storage_status:"not_uploaded",validated_at:null,content_verification:"signature_only",preview_policy:"download_only"});
}
module.exports=Object.freeze({CadArtifactError,digest,verifyAndRecord,ALLOWED});
