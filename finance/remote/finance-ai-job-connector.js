(function(root,factory){
  const api=factory(root,typeof module!=="undefined"&&module.exports?require("./finance-ai-job-store.js"):root.FinanceAIJobStore);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceAIJobConnector=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,Store){
  "use strict";
  const DEFAULT_SETTINGS=Object.freeze({provider:"supabase-ai-job",timeout:600000,pollIntervalMs:1000});
  const safeCode=code=>Store.SAFE_ERROR_CODES?.has(String(code||""))?String(code):"INTERNAL_ERROR";
  const safeStage=stage=>Store.SAFE_STAGES?.has(String(stage||""))?String(stage):"result";
  function messageFor(code){return {AUTH_REQUIRED:"登入狀態已失效，請重新登入。",AUTH_INVALID:"登入驗證失敗，請重新登入。",USER_NOT_ALLOWED:"此帳號沒有 Finance AI 使用權限。",JOB_ENQUEUE_FAILED:"無法建立 AI 工作，請檢查登入狀態與雲端連線。",JOB_READ_FAILED:"無法讀取 AI 工作狀態。",JOB_NOT_FOUND:"找不到 AI 工作。",JOB_EXPIRED:"AI 工作已逾期。",TIMEOUT:"等待家中 AI 主機逾時。",CANCELLED:"AI 工作已取消。",CONNECTION_FAILED:"家中 AI Host 無法連線 Finance AI Gateway。",GATEWAY_ERROR:"Finance AI Gateway 回應失敗。",OLLAMA_UNAVAILABLE:"家中 Ollama 目前不可用。",OLLAMA_TIMEOUT:"家中模型處理逾時。",MODEL_OUTPUT_INVALID:"AI 回傳結果未通過安全驗證。",AI_HOST_FAILED:"家中 AI 主機處理失敗。"}[code]||"Supabase AI Job Bridge 暫時不可用。";}
  function safeDetails(details={}){const out={};if(/^[A-Za-z0-9_]{1,40}$/.test(String(details.supabaseCode||"")))out.supabaseCode=String(details.supabaseCode);if(details.jobId)out.jobId=String(details.jobId).slice(0,80);return Object.freeze(out);}
  class JobConnectorError extends Error{constructor(code,message,details={},cause,stage){const value=safeCode(code);super(message||messageFor(value),cause?{cause}:undefined);this.name="JobConnectorError";this.code=value;this.stage=safeStage(stage||Store.stageForCode?.(value));this.details=safeDetails(details);}}
  function requestId(){return root.crypto?.randomUUID?.()||`finance-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
  function normalizeSettings(input={}){const timeout=Number(input.jobTimeout??input.timeout??DEFAULT_SETTINGS.timeout),pollIntervalMs=Number(input.pollIntervalMs??DEFAULT_SETTINGS.pollIntervalMs);if(!Number.isSafeInteger(timeout)||timeout<5000||timeout>600000)throw new JobConnectorError("INVALID_TIMEOUT","AI Job timeout 必須是 5000 到 600000 毫秒。");if(!Number.isSafeInteger(pollIntervalMs)||pollIntervalMs<100||pollIntervalMs>10000)throw new JobConnectorError("INVALID_POLL_INTERVAL","AI Job polling 間隔不正確。");return Object.freeze({provider:"supabase-ai-job",timeout,pollIntervalMs});}
  function mapError(error){if(error instanceof JobConnectorError)return error;const code=safeCode(error?.code),stage=safeStage(error?.stage||Store.stageForCode?.(code));return new JobConnectorError(code,messageFor(code),error?.details||{},undefined,stage);}
  function diagnostic(kind,value){if(!root.location||!root.console)return;const method=kind==="failure"?"error":"info";root.console[method]?.(kind==="failure"?"Finance AI failure":"Finance AI stage",value);}
  async function generateConstrainedFinancePatch(promptPackage,settings=DEFAULT_SETTINGS,{signal,context,onStatus,client}={}){
    if(!context?.draft)throw new JobConnectorError("INVALID_CONTEXT","缺少 Canonical Finance Draft context。");
    const config=normalizeSettings(settings),id=requestId();let job;
    try{
      diagnostic("stage",{stage:"session"});
      diagnostic("stage",{stage:"enqueue"});
      job=await Store.enqueue(context,{requestId:id,client});
      onStatus?.(job);
      diagnostic("stage",{stage:"wait"});
      const completed=await Store.wait(job.id,{client,signal,timeoutMs:config.timeout,pollIntervalMs:config.pollIntervalMs,onStatus});
      const result=completed.result_payload||{},patch=result.patch;
      if(!patch||typeof patch!=="object"||Array.isArray(patch))throw new JobConnectorError("MODEL_OUTPUT_INVALID","AI Host 回傳內容不符合安全格式。",{jobId:completed.id},undefined,"result");
      return Object.freeze({rawText:JSON.stringify(patch),model:String(result.model||"finance-job-bridge"),metrics:Object.freeze({requestId:id,jobId:completed.id,elapsedMs:Number(result.elapsedMs||0),issues:Array.isArray(result.issues)?result.issues:[]})});
    }catch(error){const safe=mapError(error);diagnostic("failure",{stage:safe.stage,code:safe.code});throw safe;}
  }
  async function checkHostStatus({client,now}={}){try{return Store.hostAvailability(await Store.host({client}),now);}catch(error){throw mapError(error);}}
  return Object.freeze({DEFAULT_SETTINGS,JobConnectorError,mapError,normalizeSettings,generateConstrainedFinancePatch,checkHostStatus});
});

