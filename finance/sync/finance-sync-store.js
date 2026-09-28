(function(root,factory){
  "use strict";
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceSyncStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const TABLE="lizhi_finance_records",MAX_PAYLOAD_BYTES=65536,KINDS=Object.freeze(["accounts","creditCards","categories","transactions"]);
  const FORBIDDEN_KEYS=new Set(["token","accesstoken","refreshtoken","password","secret","servicerole","authorization","audio","audioblob","base64","mediastream"]);
  class FinanceSyncStoreError extends Error{constructor(code,message,details={}){super(message);this.name="FinanceSyncStoreError";this.code=code;this.details=Object.freeze(details);}}
  function clientOf(client){const value=client||root.LizhiAuth?.client;if(!value?.from||!value?.auth?.getSession)throw new FinanceSyncStoreError("AUTH_REQUIRED","請先登入立之雲端庫。");return value;}
  async function currentUser(client){const {data,error}=await client.auth.getSession(),user=data?.session?.user;if(error||!user)throw new FinanceSyncStoreError("AUTH_REQUIRED","登入狀態已失效，請重新登入。");return user;}
  function kindOf(value){const kind=String(value||"");if(!KINDS.includes(kind))throw new FinanceSyncStoreError("INVALID_SYNC_KIND","不支援的 Finance sync 類型。",{kind});return kind;}
  function assertSafe(value,path="payload"){
    if(!value||typeof value!=="object")return;
    for(const [key,item] of Object.entries(value)){const normalized=key.replace(/[^a-z0-9]/gi,"").toLowerCase();if(FORBIDDEN_KEYS.has(normalized))throw new FinanceSyncStoreError("UNSAFE_SYNC_PAYLOAD",`Finance sync 不可包含 ${path}.${key}。`);assertSafe(item,`${path}.${key}`);}
  }
  const clone=value=>JSON.parse(JSON.stringify(value));
  function assertPayloadSize(payload){const bytes=new TextEncoder().encode(JSON.stringify(payload)).length;if(bytes>MAX_PAYLOAD_BYTES)throw new FinanceSyncStoreError("SYNC_PAYLOAD_TOO_LARGE","Finance sync 單筆資料超過安全大小限制。",{maxBytes:MAX_PAYLOAD_BYTES});}
  function normalizeLocalRow(kind,record,userId){
    const safeKind=kindOf(kind),payload=clone(record||{}),id=String(payload.id||"").trim();
    if(!id||id.length>160)throw new FinanceSyncStoreError("INVALID_RECORD_ID","Finance record id 格式不正確。");
    assertSafe(payload);assertPayloadSize(payload);const now=new Date().toISOString();
    return Object.freeze({user_id:userId,kind:safeKind,id,payload,created_at:payload.createdAt||now,updated_at:payload.updatedAt||payload.createdAt||now,deleted_at:payload.deletedAt||null});
  }
  function normalizeRemoteRow(row){
    const kind=kindOf(row?.kind),id=String(row?.id||"").trim(),payload=clone(row?.payload||{});if(!id)throw new FinanceSyncStoreError("INVALID_REMOTE_ROW","雲端 Finance record 缺少 id。");assertSafe(payload);assertPayloadSize(payload);
    return Object.freeze({kind,id,payload:{...payload,id,createdAt:payload.createdAt||row.created_at,updatedAt:payload.updatedAt||row.updated_at,deletedAt:row.deleted_at||payload.deletedAt||null},created_at:row.created_at,updated_at:row.updated_at,deleted_at:row.deleted_at||null});
  }
  async function list({client}={}){const db=clientOf(client);await currentUser(db);const {data,error}=await db.from(TABLE).select("kind,id,payload,created_at,updated_at,deleted_at");if(error)throw new FinanceSyncStoreError("SYNC_PULL_FAILED","無法讀取 Finance 雲端資料。",{supabaseCode:String(error.code||"").slice(0,40)});return (data||[]).map(normalizeRemoteRow);}
  async function upsert(entries,{client}={}){
    if(!Array.isArray(entries)||!entries.length)return [];
    const db=clientOf(client),user=await currentUser(db),rows=entries.map(entry=>normalizeLocalRow(entry.kind,entry.record,user.id));
    const {data,error}=await db.from(TABLE).upsert(rows,{onConflict:"user_id,kind,id"}).select("kind,id,updated_at,deleted_at");if(error)throw new FinanceSyncStoreError("SYNC_PUSH_FAILED","無法寫入 Finance 雲端資料。",{supabaseCode:String(error.code||"").slice(0,40)});return data||[];
  }
  return Object.freeze({TABLE,MAX_PAYLOAD_BYTES,KINDS,FORBIDDEN_KEYS,FinanceSyncStoreError,assertSafe,assertPayloadSize,normalizeLocalRow,normalizeRemoteRow,list,upsert});
});
