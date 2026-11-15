// Server-only adapter for the existing owner-private Site. No client owner IDs.
import {createMcpHandler} from '../p3/mcp-server.mjs';
import {createP6PersistentMcpBackend} from '../p6/persistent-mcp-adapter.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TABLES=new Map([
 ['english_card_candidates',{fields:'id,owner_id,term,meaning_zh,sense_key,status,created_at',order:'created_at.desc',filters:['status']}],
 ['english_p6_sync_requests',{fields:'owner_id,request_id,status,result_json',order:'created_at.desc',filters:['request_id']}],
 ['english_review_states',{fields:'owner_id,card_id,due_at',order:'due_at.asc',filters:[]}],
 ['english_skill_evidence',{fields:'owner_id,skill,evidence_state',order:'occurred_at.desc',filters:[]}]
]);
const fail=()=>Object.assign(new Error('ENGLISH_AUTH_DENIED'),{code:'ENGLISH_AUTH_DENIED'});
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');

export function createProductionEnglishMcp({env,fetchImpl=fetch}={}){
 const base=String(env?.SUPABASE_URL||'').replace(/\/$/,'');
 const key=env?.SUPABASE_SERVICE_ROLE_KEY;
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base)||!key)throw Error('SERVER_ENV_REQUIRED');
 async function service(path,{method='GET',body}={}){
  const response=await fetchImpl(base+'/rest/v1/'+path,{
   method,headers:{apikey:key,authorization:'Bearer '+key,'content-type':'application/json'},
   body:body===undefined?undefined:JSON.stringify(body),
   signal:AbortSignal.timeout(15000),cache:'no-store'
  });
  const out=await response.json().catch(()=>null);
  if(!response.ok){
   // Preserve only known application errors, never raw SQL or provider details.
   const allowed=['LEARNING_SESSION_NOT_AUTHORIZED','IDEMPOTENCY_CONFLICT'];
   const code=allowed.find(s=>String(out?.message||'').includes(s));
   throw Object.assign(new Error(code||'BACKEND_UNAVAILABLE'),{code:code||'BACKEND_UNAVAILABLE'});
  }
  return out;
 }
 const trustedDb={
  async select(table,{ownerId,filters={},limit=100}={}){
   const spec=TABLES.get(table);
   if(!spec||!UUID.test(ownerId||'')||!Number.isInteger(limit)||limit<1||limit>1000||
    Object.keys(filters).some(k=>!spec.filters.includes(k)))throw Error('INVALID_SCOPED_QUERY');
   const qs=new URLSearchParams({select:spec.fields,owner_id:'eq.'+ownerId,order:spec.order,limit:String(limit)});
   for(const [k,v] of Object.entries(filters)){
    if(typeof v!=='string'||v.length>100||(k==='status'&&v!=='pending'))throw Error('INVALID_FILTER');
    qs.set(k,'eq.'+v);
   }
   const rows=await service(table+'?'+qs);
   if(!Array.isArray(rows)||rows.length>limit||rows.some(r=>r.owner_id!==ownerId))throw Error('OWNER_SCOPE_VIOLATION');
   return rows;
  },
  async rpc(name,args){
   if(name!=='english_p6_ingest_batch'||!UUID.test(args?.p_owner_id||''))throw Error('RPC_DENIED');
   return service('rpc/'+name,{method:'POST',body:args});
  }
 };
 const backend=createP6PersistentMcpBackend({trustedDb});
 const handle=createMcpHandler({backend,allowedOrigins:[],authenticate:async({bearer,request})=>{
  if(request.headers.has('origin')||!/^lzp_[A-Za-z0-9_-]{20,500}$/.test(bearer))throw fail();
  const actor=request.headers.get('x-lizhi-actor')||'';
  if(!actor||actor.length>180)throw fail();
  const linked=await service('rpc/english_resolve_site_owner',{
   method:'POST',body:{p_key_hash:await hash(bearer),p_chatgpt_owner:actor}
  });
  if(!UUID.test(linked?.owner_id||'')||linked.enabled!==true||linked.link_verified!==true)throw fail();
  return {serverVerified:true,active:true,userId:linked.owner_id,
   verifiedClientId:'existing-owner-private-site',scopes:['english:read','english:candidate']};
 }});
 return async request=>{
  // Formal card creation remains exclusively behind the Google-authenticated website.
  if(request.method==='POST'){
   const len=Number(request.headers.get('content-length')||0);
   if(len>16384)return Response.json({error:'REQUEST_TOO_LARGE'},{status:413});
   const reader=request.body?.getReader();const chunks=[];let size=0;
   if(reader){
    while(true){const {done,value}=await reader.read();if(done)break;
     size+=value.byteLength;
     if(size>16384){await reader.cancel();return Response.json({error:'REQUEST_TOO_LARGE'},{status:413});}
     chunks.push(value);
    }
   }
   const bytes=new Uint8Array(size);let offset=0;
   for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   request=new Request(request,{body:bytes});
  }
  return handle(request);
 };
}
