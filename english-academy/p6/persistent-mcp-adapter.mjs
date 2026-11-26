// P6 candidate adapter linking P3 MCP to proposed owner-scoped PostgreSQL RPC.
// No real credentials here. Requires a server-only, trusted PostgREST client.
// Production Supabase / identity / owner link are NOT configured or deployed.
const actionSet=new Set(['sync_learning_session','create_card_candidates','record_language_errors']);
const text=(x,max)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
const requiredOwner=x=>{if(!text(x,128))throw new TypeError('VERIFIED_OWNER_REQUIRED');return x;};
const itemTypes={candidates:['term','meaningZh','senseKey'],
  errors:['original','corrected','explanation']};
function requireItems(items,kind){
 if(!Array.isArray(items)||items.length>10)throw new TypeError('INVALID_'+kind.toUpperCase());
 const fields=itemTypes[kind];
 return items.map(item=>{
   if(!item||typeof item!=='object'||Array.isArray(item)||
      Object.keys(item).some(k=>!fields.includes(k)))throw new TypeError('INVALID_ITEM');
   if(kind==='candidates'){
     if(!text(item.term,120)||!text(item.meaningZh,500)||
        (item.senseKey!==undefined&&!text(item.senseKey,80)))throw new TypeError('INVALID_CANDIDATE');
     return {term:item.term.trim(),meaningZh:item.meaningZh.trim(),senseKey:item.senseKey??''};
   }
   if(!text(item.original,500)||!text(item.corrected,500)||!text(item.explanation,500))
     throw new TypeError('INVALID_ERROR');
   return {original:item.original.trim(),corrected:item.corrected.trim(),
     explanation:item.explanation.trim()};
 });
}
const ensureScoped=(rows,ownerId)=>{
 if(!Array.isArray(rows)||rows.length>1000||rows.some(x=>x?.owner_id!==ownerId))
   throw new Error('BACKEND_OWNER_SCOPE_VIOLATION');
 return rows;
};
const result=x=>({ok:true,data:x});
const fail=(code,message,retryable=false)=>({ok:false,code,message,retryable});
export function createP6PersistentMcpBackend({trustedDb,clock=()=>new Date()}={}){
 if(!trustedDb||typeof trustedDb.rpc!=='function'||
    typeof trustedDb.select!=='function'||typeof clock!=='function')
    throw new TypeError('SERVER_ONLY_DB_ADAPTER_REQUIRED');
 async function query(table,ownerId,{filters={},limit=100}={}){
   const rows=await trustedDb.select(table,{ownerId,filters,limit});
   return ensureScoped(rows,ownerId);
 }
 return {
   async syncCandidate({ownerId,action,requestId,sourceSessionId,candidates=[],errors=[]}){
     try{
       requiredOwner(ownerId);
       if(!actionSet.has(action)||!text(requestId,100)||requestId.length<12||
          !text(sourceSessionId,100))return fail('INVALID_SYNC_ARGUMENT','Invalid action or session');
       const safeCandidates=requireItems(candidates,'candidates');
       const safeErrors=requireItems(errors,'errors');
       if(!safeCandidates.length&&!safeErrors.length)
         return fail('EMPTY_SYNC','No learning evidence supplied');
       const payload=await trustedDb.rpc('english_p6_ingest_batch',{
         p_owner_id:ownerId,p_source_session_id:sourceSessionId,
         p_request_id:requestId,p_candidates:safeCandidates,p_errors:safeErrors
       });
       if(!payload||typeof payload!=='object'||payload.status!=='success')
         return fail('BACKEND_RESPONSE_INVALID','Invalid sync response',true);
       return result(payload);
     }catch(e){
       if(e?.code==='IDEMPOTENCY_CONFLICT'||e?.message==='IDEMPOTENCY_CONFLICT')
         return fail('IDEMPOTENCY_CONFLICT','Request reused for different content');
       if(e?.code==='LEARNING_SESSION_NOT_AUTHORIZED'||e?.message==='LEARNING_SESSION_NOT_AUTHORIZED')
         return fail('LEARNING_SESSION_NOT_AUTHORIZED','Session is not authorized');
       return fail('BACKEND_UNAVAILABLE','Private learning store unavailable',true);
     }
   },
   async listCandidates(ownerId,limit=20){
     requiredOwner(ownerId);
     if(!Number.isInteger(limit)||limit<1||limit>50)throw new TypeError('INVALID_LIMIT');
     const rows=await query('english_card_candidates',ownerId,{filters:{status:'pending'},limit});
     return {items:rows.map(x=>({...x,ownerId:x.owner_id})),count:rows.length};
   },
   async getSyncStatus(ownerId,requestId){
     requiredOwner(ownerId);
     if(!text(requestId,100))throw new TypeError('INVALID_REQUEST_ID');
     const rows=await query('english_p6_sync_requests',ownerId,{filters:{request_id:requestId},limit:1});
     if(!rows.length)return {requestId,status:'not-found'};
     return {requestId,status:rows[0].status,result:rows[0].result_json};
   },
   async getReviewSummary(ownerId){
     requiredOwner(ownerId);
     const rows=await query('english_review_states',ownerId,{limit:1000});
     const time=clock().getTime();
     const due=rows.filter(x=>Number.isFinite(Date.parse(x.due_at))&&Date.parse(x.due_at)<=time).length;
     return {dueCount:due,trackedCards:rows.length,source:'stored-fsrs-state',
       computedAt:clock().toISOString()};
   },
   async getProfile(ownerId){
     requiredOwner(ownerId);
     const rows=await query('english_skill_evidence',ownerId,{limit:1000});
     const skills=['vocabulary','grammar','reading','writing','listening','speaking'];
     return {ownerVerified:true,
       skills:Object.fromEntries(skills.map(skill=>[skill,{
         state:rows.some(x=>x.skill===skill&&x.evidence_state==='observed')?'observed':'not-tested',
         cefrLevel:null,observations:rows.filter(x=>x.skill===skill&&x.evidence_state==='observed').length
       }]))};
   },
   async addVocabulary(){
     return fail('FORMAL_WRITE_NOT_CONFIGURED',
       'Formal card creation requires separately approved P1 service RPC');
   }
 };
}
