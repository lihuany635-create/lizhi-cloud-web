// Isolated P3 memory backend, not a production data store.
// The caller may register learning sessions ONLY from a trusted website/DB
// flow; MCP tools never register or authorize their own conversation scope.
const normalize = x=>String(x).normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const sessionKey=(owner,session)=>owner+'|'+session;
const ownerKey=(owner,id)=>owner+'|'+id;
const clone = value=>JSON.parse(JSON.stringify(value));
const fail=(code,message,{retryable=false}={})=>({ok:false,code,message,retryable});
const done=(data)=>({ok:true,data});
async function fingerprint(action,payload){
 const data=new TextEncoder().encode(JSON.stringify({action,payload}));
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
 return Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');
}
function inputError(candidates,errors){
 if(!Array.isArray(candidates)||!Array.isArray(errors)||candidates.length>10||errors.length>10)
   return fail('INVALID_BATCH','Limited to ten items per category');
 if(candidates.some(c=>!c?.term||!c?.meaningZh)||errors.some(e=>!e?.original||!e?.corrected||!e?.explanation))
   return fail('INVALID_ITEM','Missing teaching evidence');
 return null;
}
export function createCandidateBackend({now=()=>new Date()}={}){
 const authorizedSessions=new Set();
 const candidates=new Map();
 const cards=new Map();
 const errors=new Map();
 const syncRecords=new Map();
 const reviewStates=new Map();
 const audit=[];
 const transientFailures=new Set();

 function registerLearningSession({ownerId,sessionId,confirmedByWebsite}){
   if(confirmedByWebsite!==true||typeof ownerId!=='string'||!ownerId||
     typeof sessionId!=='string'||!sessionId)throw new Error('WEBSITE_SCOPE_REQUIRED');
   authorizedSessions.add(sessionKey(ownerId,sessionId));
 }
 function seedReview({ownerId,cardId,dueAt}){
   const date=new Date(dueAt);
   if(Number.isNaN(date.getTime()))throw new Error('INVALID_DATE');
   reviewStates.set(ownerKey(ownerId,cardId),{ownerId,cardId,dueAt:date.toISOString()});
 }
 function setTransientFailure({ownerId,requestId}){
   transientFailures.add(ownerKey(ownerId,requestId));
 }
 function addAudit(ownerId,action,resourceId){
   audit.push({seq:audit.length+1,ownerId,action,resourceId,at:now().toISOString()});
 }
 function findSync(ownerId,requestId){
   const r=syncRecords.get(ownerKey(ownerId,requestId));
   return r?clone(r):null;
 }
 async function syncCandidate({
   ownerId,action,requestId,sourceSessionId,candidates:incoming=[],errors:incomingErrors=[]
 }){
   if(!authorizedSessions.has(sessionKey(ownerId,sourceSessionId)))
     return fail('LEARNING_SESSION_NOT_AUTHORIZED','Conversation is not an approved English session');
   const error=inputError(incoming,incomingErrors);
   if(error)return error;
   if(incoming.length+incomingErrors.length===0)return fail('EMPTY_SYNC','No learning evidence supplied');
   const payload={sourceSessionId,
     candidates:incoming.map(c=>({term:normalize(c.term),meaningZh:c.meaningZh.trim(),
        senseKey:normalize(c.senseKey??'')})),
     errors:incomingErrors.map(e=>({original:e.original.trim(),corrected:e.corrected.trim(),
        explanation:e.explanation.trim()}))};
   const hash=await fingerprint(action,payload);
   const key=ownerKey(ownerId,requestId);
   const existing=syncRecords.get(key);
   if(existing){
     if(existing.hash!==hash||existing.action!==action)
       return fail('IDEMPOTENCY_CONFLICT','This request ID belongs to a different payload');
     if(existing.status==='success')return done({...clone(existing.public),replay:true});
   }
   if(transientFailures.delete(key)){
     syncRecords.set(key,{status:'retryable',hash,action,attempts:(existing?.attempts??0)+1,
       public:{requestId,status:'retryable',retryable:true}});
     addAudit(ownerId,'sync_retryable',requestId);
     return fail('RETRYABLE_NETWORK_FAILURE','Temporary failure, retry with the same request ID',
       {retryable:true});
   }
   // All validations are performed before mutation; a production backend
   // must implement this block in one owner-scoped DB transaction/RPC.
   let added=0,duplicates=0,reported=0;
   for(const c of incoming){
     const norm=normalize(c.term),sense=normalize(c.senseKey??'');
     const cardKey=ownerKey(ownerId,norm+'|'+sense);
     if(candidates.has(cardKey)||cards.has(cardKey))duplicates++;
     else {candidates.set(cardKey,{id:'candidate-'+(candidates.size+1),
       ownerId,term:c.term.trim(),normalizedTerm:norm,meaningZh:c.meaningZh.trim(),
       senseKey:sense,sourceSessionId,status:'pending'});added++;}
   }
   for(const e of incomingErrors){
     const errorKey=ownerKey(ownerId,sourceSessionId+'|'+normalize(e.original)+'|'+normalize(e.corrected));
     if(!errors.has(errorKey)){
       errors.set(errorKey,{ownerId,sourceSessionId,original:e.original.trim(),
         corrected:e.corrected.trim(),explanation:e.explanation.trim(),status:'recorded'});
       reported++;
     }
   }
   const publicResult={requestId,status:'success',replay:false,
     pendingAdded:added,candidatesDuplicated:duplicates,errorsAdded:reported};
   syncRecords.set(key,{status:'success',hash,action,attempts:(existing?.attempts??0)+1,
     public:publicResult});
   addAudit(ownerId,action,requestId);
   return done(clone(publicResult));
 }
 async function addVocabulary({ownerId,requestId,term,meaningZh,senseKey=''}) {
   const payload={term:normalize(term),meaningZh:meaningZh.trim(),senseKey:normalize(senseKey)};
   const hash=await fingerprint('add_vocabulary',payload);
   const key=ownerKey(ownerId,requestId);
   const existing=syncRecords.get(key);
   if(existing){
     if(existing.hash!==hash||existing.action!=='add_vocabulary')
       return fail('IDEMPOTENCY_CONFLICT','Request ID already used for another action');
     return done({...clone(existing.public),replay:true});
   }
   const cardKey=ownerKey(ownerId,payload.term+'|'+payload.senseKey);
   const dup=cards.has(cardKey);
   if(!dup)cards.set(cardKey,{ownerId,term:term.trim(),normalizedTerm:payload.term,
     senseKey:payload.senseKey,meaningZh:meaningZh.trim(),status:'active'});
   const result={requestId,status:'success',replay:false,created:!dup};
   syncRecords.set(key,{status:'success',hash,action:'add_vocabulary',attempts:1,public:result});
   addAudit(ownerId,'add_vocabulary',requestId);
   return done(clone(result));
 }
 async function listCandidates(ownerId,limit=20) {
   const items=[...candidates.values()].filter(c=>c.ownerId===ownerId&&c.status==='pending')
     .slice(0,limit).map(clone);
   return {items,count:items.length};
 }
 async function getSyncStatus(ownerId,requestId) {
   const record=findSync(ownerId,requestId);
   return record?{requestId,status:record.status,attempts:record.attempts,
     result:record.public}:{requestId,status:'not-found'};
 }
 async function getReviewSummary(ownerId) {
   const date=now().getTime();
   const mine=[...reviewStates.values()].filter(x=>x.ownerId===ownerId);
   const due=mine.filter(x=>new Date(x.dueAt).getTime()<=date).length;
   return {dueCount:due,trackedCards:mine.length,source:'stored-fsrs-state',
     computedAt:now().toISOString()};
 }
 async function getProfile(ownerId) {
   const skills=['vocabulary','grammar','reading','writing','listening','speaking'];
   return {ownerVerified:true,skills:Object.fromEntries(skills.map(s=>[s,
     {state:'not-tested',cefrLevel:null,observations:0}])),
     pendingCandidates:[...candidates.values()].filter(x=>x.ownerId===ownerId).length,
     recordedErrorCount:[...errors.values()].filter(x=>x.ownerId===ownerId).length};
 }
 function inspectionSnapshot(ownerId) {
   // Test-only diagnostic. NEVER expose as MCP tool or production API.
   return {candidates:[...candidates.values()].filter(x=>x.ownerId===ownerId).map(clone),
     errors:[...errors.values()].filter(x=>x.ownerId===ownerId).map(clone),
     cards:[...cards.values()].filter(x=>x.ownerId===ownerId).map(clone),
     audit:audit.filter(x=>x.ownerId===ownerId).map(clone)};
 }
 return {registerLearningSession,seedReview,setTransientFailure,syncCandidate,addVocabulary,
   listCandidates,getSyncStatus,getReviewSummary,getProfile,inspectionSnapshot};
}
