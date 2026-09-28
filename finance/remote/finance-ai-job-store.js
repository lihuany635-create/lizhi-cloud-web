(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceAIJobStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const JOB_TABLE="lizhi_finance_ai_jobs",HOST_TABLE="lizhi_finance_ai_hosts";
  const JOB_STATUSES=Object.freeze(["pending","processing","completed","failed","cancelled"]);
  const FORBIDDEN_KEY_NAMES=new Set(["token","accesstoken","refreshtoken","password","secret","servicerole","prompt","systemprompt","ollama","ollamaurl","gatewaysecret","authorization"]);
  const SAFE_ERROR_CODES=new Set(["AUTH_REQUIRED","AUTH_INVALID","USER_NOT_ALLOWED","JOB_ENQUEUE_FAILED","JOB_READ_FAILED","JOB_CLAIM_FAILED","JOB_BRIDGE_ERROR","JOB_NOT_FOUND","JOB_EXPIRED","TIMEOUT","CANCELLED","CONNECTION_FAILED","GATEWAY_ERROR","RATE_LIMITED","BUSY","OLLAMA_UNAVAILABLE","OLLAMA_TIMEOUT","MODEL_OUTPUT_INVALID","AI_HOST_FAILED","INTERNAL_ERROR","INVALID_CONTEXT","INVALID_RAW_TEXT","INVALID_REQUEST_ID","INVALID_TIMEOUT","INVALID_POLL_INTERVAL","UNSAFE_JOB_PAYLOAD","JOB_PAYLOAD_TOO_LARGE","JOB_COMPLETE_FAILED","JOB_FAIL_UPDATE_FAILED","HOST_HEARTBEAT_FAILED","HOST_READ_FAILED","INVALID_HOST_STATUS"]);
  const SAFE_STAGES=new Set(["session","enqueue","wait","host","gateway","ollama","result"]);
  const safeErrorCode=code=>SAFE_ERROR_CODES.has(String(code||""))?String(code):"INTERNAL_ERROR";
  const safeStage=stage=>SAFE_STAGES.has(String(stage||""))?String(stage):"result";
  const stageForCode=code=>/^AUTH_|USER_NOT_ALLOWED/.test(code)?"session":code==="JOB_ENQUEUE_FAILED"?"enqueue":["JOB_READ_FAILED","JOB_NOT_FOUND","JOB_EXPIRED","TIMEOUT","CANCELLED"].includes(code)?"wait":["JOB_CLAIM_FAILED","AI_HOST_FAILED","BUSY","RATE_LIMITED","HOST_HEARTBEAT_FAILED","HOST_READ_FAILED"].includes(code)?"host":["CONNECTION_FAILED","GATEWAY_ERROR"].includes(code)?"gateway":["OLLAMA_UNAVAILABLE","OLLAMA_TIMEOUT"].includes(code)?"ollama":"result";
  const safeSupabaseCode=value=>/^[A-Za-z0-9_]{1,40}$/.test(String(value||""))?String(value):null;
  function safeDetails(details={}){const out={};const supabaseCode=safeSupabaseCode(details.supabaseCode);if(supabaseCode)out.supabaseCode=supabaseCode;if(details.jobId)out.jobId=String(details.jobId).slice(0,80);if(Number.isSafeInteger(details.timeoutMs))out.timeoutMs=details.timeoutMs;return Object.freeze(out);}
  function safeMessage(code){return {AUTH_REQUIRED:"請先登入立之雲端庫。",AUTH_INVALID:"登入驗證失敗。",USER_NOT_ALLOWED:"目前帳號沒有使用 Finance AI 的權限。",JOB_ENQUEUE_FAILED:"無法建立 AI 工作。",JOB_READ_FAILED:"無法讀取 AI 工作狀態。",JOB_CLAIM_FAILED:"家中 AI 主機無法領取工作。",JOB_NOT_FOUND:"找不到 AI 工作。",JOB_EXPIRED:"AI 工作已逾期。",TIMEOUT:"等待家中 AI 主機逾時。",CANCELLED:"AI 工作已取消。",CONNECTION_FAILED:"家中 AI Host 無法連線 Finance AI Gateway。",GATEWAY_ERROR:"Finance AI Gateway 回應失敗。",OLLAMA_UNAVAILABLE:"家中 Ollama 目前不可用。",OLLAMA_TIMEOUT:"家中模型處理逾時。",MODEL_OUTPUT_INVALID:"AI 回傳結果未通過安全驗證。",AI_HOST_FAILED:"家中 AI 主機處理失敗。"}[code]||"Supabase AI Job Bridge 暫時不可用。";}
  class FinanceAIJobError extends Error{constructor(code,message,details={},cause,stage){const safeCode=safeErrorCode(code);super(message||safeMessage(safeCode),cause?{cause}:undefined);this.name="FinanceAIJobError";this.code=safeCode;this.stage=safeStage(stage||stageForCode(safeCode));this.details=safeDetails(details);}}
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function clientOf(client){const value=client||root.LizhiAuth?.client;if(!value?.from||!value?.rpc)throw new FinanceAIJobError("AUTH_REQUIRED","請先登入立之雲端庫。",{},undefined,"session");return value;}
  async function currentUser(client){const {data,error}=await client.auth.getSession();const user=data?.session?.user;if(error||!user)throw new FinanceAIJobError("AUTH_REQUIRED","登入狀態已失效，請重新登入。",{},undefined,"session");return user;}
  function safeClone(value){return JSON.parse(JSON.stringify(value??{}));}
  function assertNoForbiddenKeys(value,path="request_payload"){
    if(!value||typeof value!=="object")return;
    for(const [key,item] of Object.entries(value)){
      const normalizedKey=String(key).replace(/[^a-z0-9]/gi,"").toLowerCase();
      if(FORBIDDEN_KEY_NAMES.has(normalizedKey))throw new FinanceAIJobError("UNSAFE_JOB_PAYLOAD",`Job 不可包含 ${path}.${key}。`);
      assertNoForbiddenKeys(item,`${path}.${key}`);
    }
  }
  function normalizeRequestPayload(context={}){
    const rawText=String(context.rawText||"").trim();
    if(!rawText||rawText.length>300)throw new FinanceAIJobError("INVALID_RAW_TEXT","記帳文字必須是 1 到 300 字。");
    const payload=safeClone({rawText,draft:context.draft||{},lockedFields:Array.isArray(context.lockedFields)?context.lockedFields:[],typeHints:Array.isArray(context.typeHints)?context.typeHints:[],allowedValues:context.allowedValues||{}});
    assertNoForbiddenKeys(payload);
    const encoded=JSON.stringify(payload);
    if(encoded.length>24000)throw new FinanceAIJobError("JOB_PAYLOAD_TOO_LARGE","AI Job context 超過安全大小限制。");
    return Object.freeze(payload);
  }
  function normalizeRequestId(value){const id=String(value||"").trim();if(!id||id.length>120)throw new FinanceAIJobError("INVALID_REQUEST_ID","requestId 格式不正確。");return id;}
  function mapError(error,code="JOB_BRIDGE_ERROR",stage){if(error instanceof FinanceAIJobError)return error;const safeCode=safeErrorCode(code),supabaseCode=safeSupabaseCode(error?.code);return new FinanceAIJobError(safeCode,safeMessage(safeCode),{supabaseCode},undefined,stage||stageForCode(safeCode));}
  async function enqueue(context,{requestId,client}={}){
    const db=clientOf(client),user=await currentUser(db),payload=normalizeRequestPayload(context),id=normalizeRequestId(requestId);
    const row={user_id:user.id,request_id:id,raw_text:payload.rawText,request_payload:payload,status:"pending"};
    const query=db.from(JOB_TABLE).insert(row).select().single(),{data,error}=await query;
    if(!error&&data)return data;
    if(error?.code==="23505"){
      const existing=await db.from(JOB_TABLE).select("*").eq("request_id",id).maybeSingle();
      if(!existing.error&&existing.data)return existing.data;
    }
    throw mapError(error,"JOB_ENQUEUE_FAILED","enqueue");
  }
  async function read(jobId,{client}={}){const db=clientOf(client),{data,error}=await db.from(JOB_TABLE).select("*").eq("id",jobId).maybeSingle();if(error)throw mapError(error,"JOB_READ_FAILED","wait");return data||null;}
  async function cancel(jobId,{client}={}){
    const db=clientOf(client),{data,error}=await db.from(JOB_TABLE).update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",jobId).eq("status","pending").select().maybeSingle();
    if(error)throw mapError(error,"JOB_BRIDGE_ERROR","wait");return data||null;
  }
  async function wait(jobId,{client,signal,timeoutMs=600000,pollIntervalMs=1000,onStatus}={}){
    const started=Date.now();let last="";
    while(true){
      if(signal?.aborted){await cancel(jobId,{client}).catch(()=>{});throw new FinanceAIJobError("CANCELLED","已取消家中 AI 工作。");}
      const job=await read(jobId,{client});if(!job)throw new FinanceAIJobError("JOB_NOT_FOUND","找不到 AI Job。");
      if(job.status!==last){last=job.status;onStatus?.(job);}
      if(job.status==="completed")return job;
      if(job.status==="failed"){const code=safeErrorCode(job.error_code||"AI_HOST_FAILED");throw new FinanceAIJobError(code,safeMessage(code),{jobId},undefined,stageForCode(code));}
      if(job.status==="cancelled")throw new FinanceAIJobError("CANCELLED","AI Job 已取消。");
      if(new Date(job.expires_at).getTime()<=Date.now())throw new FinanceAIJobError("JOB_EXPIRED","等待家中 AI 主機逾時。",{jobId});
      if(Date.now()-started>=timeoutMs)throw new FinanceAIJobError("TIMEOUT","等待家中 AI 主機逾時。",{jobId,timeoutMs});
      await sleep(Math.max(50,pollIntervalMs));
    }
  }
  async function claim(hostId,{client}={}){const db=clientOf(client),{data,error}=await db.rpc("lizhi_claim_finance_ai_job",{p_host_id:normalizeRequestId(hostId)});if(error)throw mapError(error,"JOB_CLAIM_FAILED","host");return Array.isArray(data)?data[0]||null:data||null;}
  async function complete(jobId,hostId,resultPayload,{client}={}){assertNoForbiddenKeys(resultPayload,"result_payload");const db=clientOf(client),now=new Date().toISOString(),{data,error}=await db.from(JOB_TABLE).update({status:"completed",result_payload:safeClone(resultPayload),error_code:null,completed_at:now,updated_at:now}).eq("id",jobId).eq("status","processing").eq("host_id",hostId).select().maybeSingle();if(error)throw mapError(error,"JOB_COMPLETE_FAILED","result");return data||null;}
  async function fail(jobId,hostId,errorCode,{client}={}){const db=clientOf(client),now=new Date().toISOString(),code=safeErrorCode(errorCode||"AI_HOST_FAILED"),result=await db.from(JOB_TABLE).update({status:"failed",result_payload:null,error_code:code,completed_at:now,updated_at:now}).eq("id",jobId).eq("status","processing").eq("host_id",hostId).select().maybeSingle();if(result.error)throw mapError(result.error,"JOB_FAIL_UPDATE_FAILED","host");return result.data||null;}
  async function heartbeat(hostId,status="online",{client,version="phase6b"}={}){if(!["online","busy","offline"].includes(status))throw new FinanceAIJobError("INVALID_HOST_STATUS","AI Host 狀態不正確.",{},undefined,"host");const db=clientOf(client),user=await currentUser(db),row={user_id:user.id,host_id:normalizeRequestId(hostId),status,version,last_seen_at:new Date().toISOString()},{data,error}=await db.from(HOST_TABLE).upsert(row,{onConflict:"user_id"}).select().single();if(error)throw mapError(error,"HOST_HEARTBEAT_FAILED","host");return data;}
  async function host({client}={}){const db=clientOf(client),{data,error}=await db.from(HOST_TABLE).select("*").maybeSingle();if(error)throw mapError(error,"HOST_READ_FAILED","host");return data||null;}
  function hostAvailability(row,now=Date.now()){if(!row?.last_seen_at)return Object.freeze({state:"offline",ageMs:null,row:row||null});const ageMs=Math.max(0,now-new Date(row.last_seen_at).getTime());return Object.freeze({state:ageMs<20000?(row.status==="busy"?"busy":"online"):ageMs<=60000?"stale":"offline",ageMs,row});}
  return Object.freeze({JOB_TABLE,HOST_TABLE,JOB_STATUSES,SAFE_ERROR_CODES,SAFE_STAGES,FinanceAIJobError,safeErrorCode,stageForCode,normalizeRequestPayload,enqueue,read,cancel,wait,claim,complete,fail,heartbeat,host,hostAvailability});
});

