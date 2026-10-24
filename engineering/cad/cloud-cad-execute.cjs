"use strict";
const {runPreparedExport}=require("./cadcraft-cli-runner.cjs");
class CadExecuteError extends Error{constructor(code,message){super(message);this.name="CadExecuteError";this.code=code;}}
function createCadcraftExecute({loadPreparedExport,runCli=runPreparedExport,binPath="cadcraft-cli"}={}){
 if(typeof loadPreparedExport!=="function"||typeof runCli!=="function")throw new CadExecuteError("CAD_EXECUTE_PORT_INVALID","Missing execution dependency");
 return async function execute({job,source}){
  if(!job||!["create","modify"].includes(job.operation))throw new CadExecuteError("CAD_EXECUTE_DENIED","Unsupported task type");
  const prepared=await loadPreparedExport(job);
  if(!prepared||prepared.project_id!==job.project_id||!prepared.source_identity||prepared.source_identity.revision!==job.expected_revision||prepared.status!=="prepared_not_executed")
   throw new CadExecuteError("CAD_PREPARED_MISMATCH","Drawing intent does not match queued job");
  if(job.operation==="modify"&&(!source||!Buffer.isBuffer(source.dxf)))throw new CadExecuteError("CAD_SOURCE_REQUIRED","Missing editable source DXF");
  if(job.operation==="create"&&source?.dxf)throw new CadExecuteError("CAD_UNEXPECTED_SOURCE","New drawing must not overwrite source");
  const result=await runCli({job:prepared,sourceDxf:job.operation==="modify"?source.dxf:null,binPath});
  if(!result||result.job_key!==prepared.job_key||!result.artifacts?.dxf||!result.artifacts?.png)throw new CadExecuteError("CAD_RESULT_INVALID","CAD runner output invalid");
  return result;
 };
}
module.exports=Object.freeze({CadExecuteError,createCadcraftExecute});
