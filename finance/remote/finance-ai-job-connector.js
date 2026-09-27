(function(root,factory){
  const api=factory(root,typeof module!=="undefined"&&module.exports?require("./finance-ai-job-store.js"):root.FinanceAIJobStore);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceAIJobConnector=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,Store){
  "use strict";
  const DEFAULT_SETTINGS=Object.freeze({provider:"supabase-ai-job",timeout:600000,pollIntervalMs:1000});
  class JobConnectorError extends Error{constructor(code,message,details={},cause){super(message,{cause});this.name="JobConnectorError";this.code=code;this.details=details;}}
  function requestId(){return root.crypto?.randomUUID?.()||`finance-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
  function normalizeSettings(input={}){const timeout=Number(input.jobTimeout??input.timeout??DEFAULT_SETTINGS.timeout),pollIntervalMs=Number(input.pollIntervalMs??DEFAULT_SETTINGS.pollIntervalMs);if(!Number.isSafeInteger(timeout)||timeout<5000||timeout>600000)throw new JobConnectorError("INVALID_TIMEOUT","AI Job timeout 必須是 5000 到 600000 毫秒。");if(!Number.isSafeInteger(pollIntervalMs)||pollIntervalMs<100||pollIntervalMs>10000)throw new JobConnectorError("INVALID_POLL_INTERVAL","AI Job polling 間隔不正確。");return Object.freeze({provider:"supabase-ai-job",timeout,pollIntervalMs});}
  function mapError(error){if(error instanceof JobConnectorError)return error;return new JobConnectorError(error?.code||"JOB_BRIDGE_ERROR",error?.message||"Supabase AI Job Bridge 暫時不可用。",error?.details||{},error);}
  async function generateConstrainedFinancePatch(promptPackage,settings=DEFAULT_SETTINGS,{signal,context,onStatus,client}={}){
    if(!context?.draft)throw new JobConnectorError("INVALID_CONTEXT","缺少 Canonical Finance Draft context。");
    const config=normalizeSettings(settings),id=requestId();let job;
    try{
      job=await Store.enqueue(context,{requestId:id,client});
      onStatus?.(job);
      const completed=await Store.wait(job.id,{client,signal,timeoutMs:config.timeout,pollIntervalMs:config.pollIntervalMs,onStatus});
      const result=completed.result_payload||{},patch=result.patch;
      if(!patch||typeof patch!=="object"||Array.isArray(patch))throw new JobConnectorError("MODEL_OUTPUT_INVALID","AI Host 回傳內容不符合安全格式。",{jobId:completed.id});
      return Object.freeze({rawText:JSON.stringify(patch),model:String(result.model||"finance-job-bridge"),metrics:Object.freeze({requestId:id,jobId:completed.id,elapsedMs:Number(result.elapsedMs||0),issues:Array.isArray(result.issues)?result.issues:[]})});
    }catch(error){throw mapError(error);}
  }
  async function checkHostStatus({client,now}={}){try{return Store.hostAvailability(await Store.host({client}),now);}catch(error){throw mapError(error);}}
  return Object.freeze({DEFAULT_SETTINGS,JobConnectorError,normalizeSettings,generateConstrainedFinancePatch,checkHostStatus});
});

