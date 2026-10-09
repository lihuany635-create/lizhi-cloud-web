(function(root,factory){
  "use strict";
  const api=factory(root,typeof module==="object"&&module.exports?require("./finance-rule-memory.js"):root.FinanceRuleMemory);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceRuleMemorySync=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,Memory){
  "use strict";
  const TABLE="lizhi_finance_rule_memories",MAX_PAYLOAD_BYTES=8192;
  class RuleMemorySyncError extends Error{constructor(code,message,details={}){super(message);this.name="RuleMemorySyncError";this.code=code;this.details=Object.freeze(details);}}
  const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).length,isCloud=scope=>Boolean(scope?.LizhiAuth?.user&&scope.location?.hostname?.endsWith("github.io"));
  function clientOf(client){const value=client||root.LizhiAuth?.client;if(!value?.from||!value?.auth?.getSession)throw new RuleMemorySyncError("AUTH_REQUIRED","請先登入立之雲端庫。");return value;}
  async function userOf(client){const{data,error}=await client.auth.getSession(),user=data?.session?.user;if(error||!user)throw new RuleMemorySyncError("AUTH_REQUIRED","登入狀態已失效，請重新登入。");return user;}
  function payload(rule){const normalized=Memory.normalizeRule(rule);if(bytes(normalized)>MAX_PAYLOAD_BYTES)throw new RuleMemorySyncError("RULE_PAYLOAD_TOO_LARGE","Rule Memory 超過安全大小限制。");return normalized;}
  function create({localStore,client=null,scope=root,delayMs=500}={}){
    if(!localStore?.list||!localStore?.mergeRemote)throw new TypeError("Rule Memory sync requires a local store.");let timer=null,busy=false,status=Object.freeze({state:"idle",error:null,lastSyncedAt:null});const listeners=new Set(),emit=next=>{status=Object.freeze({...status,...next});for(const fn of listeners)fn(status);return status;};
    async function sync({force=false}={}){if(busy)return status;if(!force&&!isCloud(scope))return status;busy=true;emit({state:"syncing",error:null});try{const db=clientOf(client),user=await userOf(db),{data,error}=await db.from(TABLE).select("id,payload,created_at,updated_at,deleted_at");if(error)throw new RuleMemorySyncError("RULE_SYNC_PULL_FAILED","無法讀取雲端 Rule Memory。",{supabaseCode:String(error.code||"").slice(0,40)});const remote=(data||[]).map(row=>payload({...row.payload,id:row.id,createdAt:row.payload?.createdAt||row.created_at,updatedAt:row.updated_at,deletedAt:row.deleted_at||row.payload?.deletedAt||null}));const merged=await localStore.mergeRemote(remote),rows=merged.map(rule=>({user_id:user.id,id:rule.id,payload:payload(rule),created_at:rule.createdAt,updated_at:rule.updatedAt,deleted_at:rule.deletedAt})),response=rows.length?await db.from(TABLE).upsert(rows,{onConflict:"user_id,id"}):{error:null};if(response.error)throw new RuleMemorySyncError("RULE_SYNC_PUSH_FAILED","無法寫入雲端 Rule Memory。",{supabaseCode:String(response.error.code||"").slice(0,40)});return emit({state:"synced",error:null,lastSyncedAt:Date.now()});}catch(error){emit({state:"error",error:{code:String(error?.code||"RULE_SYNC_FAILED"),message:"本機規則已保留，雲端同步暫時失敗。"}});return status;}finally{busy=false;}}
    function schedule(){if(!isCloud(scope))return status;emit({state:"pending",error:null});clearTimeout(timer);timer=setTimeout(()=>void sync(),delayMs);return status;}
    function subscribe(listener){listeners.add(listener);listener(status);return()=>listeners.delete(listener);}
    return Object.freeze({sync,schedule,subscribe,getStatus:()=>status});
  }
  return Object.freeze({TABLE,MAX_PAYLOAD_BYTES,RuleMemorySyncError,isCloud,payload,create});
});
