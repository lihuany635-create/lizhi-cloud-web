// Server-only Supabase adapter for P11 candidate English Academy web API.
// This module MUST run inside approved Edge, NEVER in GitHub Pages/browser.
// No credentials hardcoded. All owner/session assertions rechecked per call.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const readTables=new Map([
 ['english_cards','id,owner_id,term,meaning_zh,example_en,created_at'],
 ['english_card_candidates','id,owner_id,term,meaning_zh,status,example_en,created_at'],
 ['english_error_records','id,owner_id,original_sentence,corrected_sentence,explanation,skill,occurred_at']
]);
const writeRpc=new Set([
 'english_web_create_candidate','english_web_promote_candidate',
 'english_web_ignore_candidate'
]);
function decodeClaims(bearer){
 const segments=bearer.split('.');
 if(segments.length!==3)throw Error('JWT_REQUIRED');
 const part=segments[1].replace(/-/g,'+').replace(/_/g,'/');
 try{return JSON.parse(atob(part+'='.repeat((4-part.length%4)%4)));}
 catch{throw Error('INVALID_JWT_PAYLOAD');}
}
async function jsonResponse(response){
 if(!response.ok)throw Error('REMOTE_SERVICE_UNAVAILABLE');
 try{return await response.json()}catch{throw Error('REMOTE_RESPONSE_INVALID');}
}
/** @param {{env?: Record<string,string>, fetchImpl?: typeof fetch}} [options] */
export function createP11SupabaseTrustedWeb({env,fetchImpl=fetch}={}){
 const base=String(env?.SUPABASE_URL||'').replace(/\/$/,'');
 const anon=String(env?.SUPABASE_ANON_KEY||'');
 const secret=String(env?.SUPABASE_SERVICE_ROLE_KEY||'');
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base)||
   !anon||!secret||typeof fetchImpl!=='function')
   throw new TypeError('ENGLISH_TRUSTED_SUPABASE_ENV_REQUIRED');
 const serviceHeaders={
   apikey:secret,authorization:'Bearer '+secret,
   'cache-control':'no-store'
 };
 async function serviceCall(path,{method='GET',body}={}){
   const request=await fetchImpl(base+'/rest/v1/'+path,{
     method,headers:{...serviceHeaders,...(body?{'content-type':'application/json'}:{})},
     body:body?JSON.stringify(body):undefined,cache:'no-store'
   });
   return jsonResponse(request);
 }
 const trustedDb={
   async select(table,{ownerId,filters={},limit=200}={}){
     if(!readTables.has(table)||!UUID.test(ownerId||'')||
       !Number.isInteger(limit)||limit<1||limit>200||
       Object.keys(filters).some(k=>k!=='status')||
       (filters.status!==undefined&&filters.status!=='pending'))
       throw Error('INVALID_OWNER_SCOPED_SELECT');
     const qs=new URLSearchParams({
       owner_id:'eq.'+ownerId,
       select:readTables.get(table),
       order:table==='english_error_records'?'occurred_at.desc':'created_at.desc',
       limit:String(limit)
     });
     if(filters.status)qs.set('status','eq.'+filters.status);
     const records=await serviceCall(table+'?'+qs.toString());
     if(!Array.isArray(records)||records.some(r=>r.owner_id!==ownerId))
       throw Error('OWNER_SCOPE_VIOLATION');
     return records;
   },
   async rpc(name,payload){
     if(!writeRpc.has(name)||!payload||!UUID.test(payload.p_owner_id||''))
       throw Error('INVALID_TRUSTED_RPC');
     return serviceCall('rpc/'+name,{method:'POST',body:payload});
   }
 };
 async function verifyOwner({bearer}={}){
   if(typeof bearer!=='string'||bearer.length>16384||!bearer)throw Error('MISSING_TOKEN');
   const claims=decodeClaims(bearer);
   const result=await jsonResponse(await fetchImpl(base+'/auth/v1/user',{
     method:'GET',headers:{authorization:'Bearer '+bearer,apikey:anon},
     cache:'no-store'
   }));
   if(!UUID.test(result?.id||'')||claims.sub!==result.id||
     claims.iss!==base+'/auth/v1'||claims.role!=='authenticated'||
     claims.aud!=='authenticated'||!Number.isFinite(claims.exp)||
     claims.exp<=Date.now()/1000||!UUID.test(claims.session_id||''))
     throw Error('INVALID_TOKEN_BINDING');
   const provider=result?.app_metadata?.provider, providers=result?.app_metadata?.providers;
   if(provider!=='google'&&!(Array.isArray(providers)&&providers.includes('google')))
     throw Error('GOOGLE_PROVIDER_REQUIRED');
   const qs=new URLSearchParams({
     owner_id:'eq.'+result.id,enabled:'eq.true',select:'owner_id',limit:'1'
   });
   const allowed=await serviceCall('english_authorized_users?'+qs.toString());
   if(!Array.isArray(allowed)||allowed.length!==1||allowed[0]?.owner_id!==result.id)
     throw Error('OWNER_NOT_AUTHORIZED');
   const active=await serviceCall('rpc/english_web_session_active',{
     method:'POST',body:{p_owner_id:result.id,p_session_id:claims.session_id}
   });
   if(active!==true)throw Error('SESSION_REVOKED');
   return Object.freeze({
     serverVerified:true,identityType:'google-user',
     ownerId:result.id,sessionId:claims.session_id,
     scopes:Object.freeze(['english:read','english:candidate'])
   });
 }
 return Object.freeze({verifyOwner,trustedDb});
}
