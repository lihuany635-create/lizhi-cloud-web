import {mkdir,readFile,rename,rm,stat,writeFile} from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export class CadJobStoreError extends Error{constructor(code,message,cause){super(message,{cause});this.name="CadJobStoreError";this.code=code;}}
const safe=value=>typeof value==="string"&&/^[-_a-zA-Z0-9]{1,128}$/.test(value);
const json=value=>JSON.stringify(value,null,2)+"\n";

export function createCadJobStore({rootDir}={}){
  if(typeof rootDir!=="string"||!path.isAbsolute(rootDir))throw new CadJobStoreError("CAD_STORAGE_ROOT_INVALID","CAD storage root must be absolute.");
  const jobsDir=path.join(rootDir,"jobs"),indexesDir=path.join(rootDir,"indexes"),temporaryDir=path.join(rootDir,"temporary");
  const jobDir=key=>{if(!/^[0-9a-f]{64}$/.test(String(key)))throw new CadJobStoreError("CAD_JOB_KEY_INVALID","Invalid CAD job key.");return path.join(jobsDir,key);};
  const indexPath=(projectId,designId)=>{if(!safe(projectId)||!safe(designId))throw new CadJobStoreError("CAD_STORAGE_ID_INVALID","Invalid CAD storage identity.");return path.join(indexesDir,projectId,`${designId}.json`);};
  async function readJson(file,fallback=null){try{return JSON.parse(await readFile(file,"utf8"));}catch(error){if(error?.code==="ENOENT")return fallback;throw error;}}
  async function atomicJson(file,value){await mkdir(path.dirname(file),{recursive:true});const temp=`${file}.${process.pid}.${crypto.randomUUID()}.tmp`;await writeFile(temp,json(value),{encoding:"utf8",flag:"wx"});await rename(temp,file);}
  async function get(jobKey){return readJson(path.join(jobDir(jobKey),"manifest.json"));}
  async function list(projectId,designId){const rows=await readJson(indexPath(projectId,designId),[]);return Array.isArray(rows)?rows:[];}
  async function createTemporary(jobKey){await mkdir(temporaryDir,{recursive:true});const target=path.join(temporaryDir,`${jobKey}-${crypto.randomUUID()}`);await mkdir(target,{recursive:false});return target;}
  async function commit({job,execution,tempDir}){
    const target=jobDir(job.job_key),existing=await get(job.job_key);if(existing){await rm(tempDir,{recursive:true,force:true});return existing;}
    const completedAt=new Date().toISOString(),artifacts=Object.fromEntries(Object.entries(execution.artifacts).map(([format,item])=>[format,{...item,url:`/api/engineering/cad/artifacts/${job.job_key}/${format}`}])) ,manifest={schema_version:"cad-export-record@1",job:{...job,status:"completed",script_sha256:crypto.createHash("sha256").update(job.script).digest("hex"),script:undefined},completed_at:completedAt,cadcraft:{server_info:execution.server_info,protocol_version:execution.protocol_version,cli_info:execution.cli_info,mcp_inspection_before:execution.mcp_inspection_before,mcp_inspection_after:execution.mcp_inspection_after},artifacts};
    await atomicJson(path.join(tempDir,"manifest.json"),manifest);await mkdir(jobsDir,{recursive:true});
    try{await rename(tempDir,target);}catch(error){if(error?.code!=="EEXIST"&&error?.code!=="ENOTEMPTY")throw error;await rm(tempDir,{recursive:true,force:true});const winner=await get(job.job_key);if(winner)return winner;throw error;}
    const file=indexPath(job.project_id,job.source_identity.design_id),rows=await list(job.project_id,job.source_identity.design_id),summary={job_key:job.job_key,project_id:job.project_id,source_identity:job.source_identity,view:job.view,exporter_version:job.exporter_version,completed_at:completedAt,artifacts};
    await atomicJson(file,[summary,...rows.filter(item=>item.job_key!==job.job_key)].sort((a,b)=>b.source_identity.revision-a.source_identity.revision||b.completed_at.localeCompare(a.completed_at)));
    return manifest;
  }
  async function artifact(jobKey,format){if(!["dxf","svg","png"].includes(format))throw new CadJobStoreError("CAD_FORMAT_INVALID","Unsupported CAD artifact format.");const manifest=await get(jobKey);if(!manifest)throw new CadJobStoreError("CAD_JOB_NOT_FOUND","CAD job not found.");const item=manifest.artifacts?.[format];if(!item)throw new CadJobStoreError("CAD_ARTIFACT_NOT_FOUND","CAD artifact not found.");const file=path.join(jobDir(jobKey),item.filename),details=await stat(file);if(!details.isFile()||details.size!==item.byte_size)throw new CadJobStoreError("CAD_ARTIFACT_CORRUPT","CAD artifact metadata does not match stored bytes.");return{file,metadata:item};}
  return Object.freeze({rootDir,get,list,createTemporary,commit,artifact});
}
