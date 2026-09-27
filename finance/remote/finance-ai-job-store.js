(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceAIJobStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const JOB_TABLE="lizhi_finance_ai_jobs",HOST_TABLE="lizhi_finance_ai_hosts";
  const JOB_STATUSES=Object.freeze(["pending","processing","completed","failed","cancelled"]);
  const FORBIDDEN_KEYS=/token|secret|password|prompt|ollama|service.?role|refresh/i;
  class FinanceAIJobError extends Error{constructor(code,message,details={},cause){super(message,{cause});this.name="FinanceAIJobError";this.code=code;this.details=details;}}
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function clientOf(client){const value=client||root.LizhiAuth?.client;if(!value?.from||!value?.rpc)throw new FinanceAIJobError("AUTH_REQUIRED","請先登入立之雲端庫。");return value;}
  async function currentUser(client){const {data,error}=await client.auth.getSession();const user=data?.session?.user;if(error||!user)throw new FinanceAIJobError("AUTH_REQUIRED","登入狀態已失效，請重新登入。",{},error);return user;}
  function safeClone(value){return JSON.parse(JSON.stringify(value??{}));}
  function assertNoForbiddenKeys(value,path="request_payload"){
    if(!value||typeof value!=="object")return;
    for(const [key,item] of Object.entries(value)){
      if(FORBIDDEN_KEYS.test(key))throw new FinanceAIJobError("UNSAFE_JOB_PAYLOAD",`Job 不可包含 ${path}.${key}。`);
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
  function mapError(error,code="JOB_STORE_ERROR"){if(error instanceof FinanceAIJobError)return error;return new FinanceAIJobError(code,error?.message||"AI Job 操作失敗。",{},error);}
  async function enqueue(context,{requestId,client}={}){
    const db=clientOf(client),user=await currentUser(db),payload=normalizeRequestPayload(context),id=normalizeRequestId(requestId);
    const row={user_id:user.id,request_id:id,raw_text:payload.rawText,request_payload:payload,status:"pending"};
    const query=db.from(JOB_TABLE).insert(row).select().single(),{data,error}=await query;
    if(!error&&data)return data;
    if(error?.code==="23505"){
      const existing=await db.from(JOB_TABLE).select("*").eq("request_id",id).maybeSingle();
      if(!existing.error&&existing.data)return existing.data;
    }
    throw mapError(error,"JOB_ENQUEUE_FAILED");
  }
  async function read(jobId,{client}={}){const db=clientOf(client),{data,error}=await db.from(JOB_TABLE).select("*").eq("id",jobId).maybeSingle();if(error)throw mapError(error,"JOB_READ_FAILED");return data||null;}
  async function cancel(jobId,{client}={}){
    const db=clientOf(client),{data,error}=await db.from(JOB_TABLE).update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",jobId).eq("status","pending").select().maybeSingle();
    if(error)throw mapError(error,"JOB_CANCEL_FAILED");return data||null;
  }
  async function wait(jobId,{client,signal,timeoutMs=600000,pollIntervalMs=1000,onStatus}={}){
    const started=Date.now();let last="";
    while(true){
      if(signal?.aborted){await cancel(jobId,{client}).catch(()=>{});throw new FinanceAIJobError("CANCELLED","已取消家中 AI 工作。");}
      const job=await read(jobId,{client});if(!job)throw new FinanceAIJobError("JOB_NOT_FOUND","找不到 AI Job。");
      if(job.status!==last){last=job.status;onStatus?.(job);}
      if(job.status==="completed")return job;
      if(job.status==="failed")throw new FinanceAIJobError(job.error_code||"AI_HOST_FAILED","家中 AI 主機處理失敗。",{jobId});
      if(job.status==="cancelled")throw new FinanceAIJobError("CANCELLED","AI Job 已取消。");
      if(new Date(job.expires_at).getTime()<=Date.now())throw new FinanceAIJobError("JOB_EXPIRED","等待家中 AI 主機逾時。",{jobId});
      if(Date.now()-started>=timeoutMs)throw new FinanceAIJobError("TIMEOUT","等待家中 AI 主機逾時。",{jobId,timeoutMs});
      await sleep(Math.max(50,pollIntervalMs));
    }
  }
  async function claim(hostId,{client}={}){const db=clientOf(client),{data,error}=await db.rpc("lizhi_claim_finance_ai_job",{p_host_id:normalizeRequestId(hostId)});if(error)throw mapError(error,"JOB_CLAIM_FAILED");return Array.isArray(data)?data[0]||null:data||null;}
  async function complete(jobId,hostId,resultPayload,{client}={}){assertNoForbiddenKeys(resultPayload,"result_payload");const db=clientOf(client),now=new Date().toISOString(),{data,error}=await db.from(JOB_TABLE).update({status:"completed",result_payload:safeClone(resultPayload),error_code:null,completed_at:now,updated_at:now}).eq("id",jobId).eq("status","processing").eq("host_id",hostId).select().maybeSingle();if(error)throw mapError(error,"JOB_COMPLETE_FAILED");return data||null;}
  async function fail(jobId,hostId,errorCode,{client}={}){const db=clientOf(client),now=new Date().toISOString(),code=String(errorCode||"AI_HOST_FAILED").slice(0,80),result=await db.from(JOB_TABLE).update({status:"failed",result_payload:null,error_code:code,completed_at:now,updated_at:now}).eq("id",jobId).eq("status","processing").eq("host_id",hostId).select().maybeSingle();if(result.error)throw mapError(result.error,"JOB_FAIL_UPDATE_FAILED");return result.data||null;}
  async function heartbeat(hostId,status="online",{client,version="phase6b"}={}){if(!["online","busy","offline"].includes(status))throw new FinanceAIJobError("INVALID_HOST_STATUS","AI Host 狀態不正確。");const db=clientOf(client),user=await currentUser(db),row={user_id:user.id,host_id:normalizeRequestId(hostId),status,version,last_seen_at:new Date().toISOString()},{data,error}=await db.from(HOST_TABLE).upsert(row,{onConflict:"user_id"}).select().single();if(error)throw mapError(error,"HOST_HEARTBEAT_FAILED");return data;}
  async function host({client}={}){const db=clientOf(client),{data,error}=await db.from(HOST_TABLE).select("*").maybeSingle();if(error)throw mapError(error,"HOST_READ_FAILED");return data||null;}
  function hostAvailability(row,now=Date.now()){if(!row?.last_seen_at)return Object.freeze({state:"offline",ageMs:null,row:row||null});const ageMs=Math.max(0,now-new Date(row.last_seen_at).getTime());return Object.freeze({state:ageMs<20000?(row.status==="busy"?"busy":"online"):ageMs<=60000?"stale":"offline",ageMs,row});}
  return Object.freeze({JOB_TABLE,HOST_TABLE,JOB_STATUSES,FinanceAIJobError,normalizeRequestPayload,enqueue,read,cancel,wait,claim,complete,fail,heartbeat,host,hostAvailability});
});

