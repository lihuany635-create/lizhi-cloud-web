// P1 authorization-ready API module. No credentials or database connection
// are activated merely by committing this file to GitHub.
const ERROR = (status, code) => ({status,code});
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_RE=/^[a-zA-Z0-9_-]{12,100}$/;
const NORMAL_ORIGIN='https://lihuany635-create.github.io';

export function normalizeTerm(term) {
  return String(term||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
}
export function isVerifiedGoogleAccount(user) {
  if(!UUID_RE.test(user?.id||''))return false;
  const apps=user.app_metadata||{};
  return apps.provider==='google' || (Array.isArray(apps.providers)&&apps.providers.includes('google'));
}
export function parseAction(req,origin) {
  if(req.headers.get('origin')!==origin)return ERROR(403,'ORIGIN_NOT_ALLOWED');
  const token=req.headers.get('authorization')||'';
  const m=/^Bearer ([^\s]+)$/.exec(token);
  if(!m)return ERROR(401,'AUTH_REQUIRED');
  return {token:m[1]};
}
const resp = (status,data,origin)=>new Response(JSON.stringify(data),{
  status,
  headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':origin,
    'vary':'Origin',
    'access-control-allow-headers':'authorization, apikey, content-type',
    'access-control-allow-methods':'GET, POST, OPTIONS'
  }
});
const apiHeaders=(secret,extra={})=>({
  apikey:secret,
  authorization:'Bearer '+secret,
  ...extra,
});
function checkEnv(env){
  const url=String(env.SUPABASE_URL||'');
  if(!/^https:\/\/[^/]+$/.test(url)||!env.SUPABASE_ANON_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)
    return null;
  return url;
}
async function readJson(res) { try{return await res.json()}catch{return null} }
async function restRequest({base,secret,path,method='GET',payload,fetchImpl}) {
  const headers=apiHeaders(secret,method==='GET'?{}:{
    'content-type':'application/json',
    prefer:'return=representation'
  });
  const r=await fetchImpl(base+'/rest/v1/'+path,{method,headers,body:payload?JSON.stringify(payload):undefined});
  const value=await readJson(r);
  if(!r.ok)throw ERROR(r.status===409?409:503,'DB_OPERATION_FAILED');
  return value;
}
const uuid=v=>typeof v==='string'&&UUID_RE.test(v);
const str=(v,max)=>typeof v==='string'&&v.trim()&&v.length<=max;

async function authenticate(req,env,base,fetchImpl){
  const bearer=parseAction(req,env.ENGLISH_ALLOWED_ORIGIN||NORMAL_ORIGIN);
  if(!bearer.token)throw bearer;
  const userResponse=await fetchImpl(base+'/auth/v1/user',{
    method:'GET',
    headers:{
      authorization:'Bearer '+bearer.token,
      apikey:env.SUPABASE_ANON_KEY
    },
  });
  if(!userResponse.ok)throw ERROR(401,'AUTH_INVALID');
  const user=await readJson(userResponse);
  if(!isVerifiedGoogleAccount(user))throw ERROR(403,'GOOGLE_LOGIN_REQUIRED');
  const allowUrl='english_authorized_users?owner_id=eq.'+encodeURIComponent(user.id)+'&enabled=eq.true&select=owner_id&limit=1';
  const allowed=await restRequest({base,secret:env.SUPABASE_SERVICE_ROLE_KEY,
    path:allowUrl,fetchImpl});
  if(!Array.isArray(allowed)||allowed.length!==1)throw ERROR(403,'ACCOUNT_NOT_ALLOWED');
  return {userId:user.id};
}
async function validateBody(req){
  const clen=Number(req.headers.get('content-length')||0);
  if(clen>16384)throw ERROR(413,'PAYLOAD_TOO_LARGE');
  let textBody;try{textBody=await req.text()}catch{throw ERROR(400,'BODY_READ_FAILED')}
  if(textBody.length>16384)throw ERROR(413,'PAYLOAD_TOO_LARGE');
  try{
    const body=JSON.parse(textBody);
    if(body&&typeof body==='object'&&!Array.isArray(body))return body;
  }catch{}
  throw ERROR(400,'INVALID_JSON');
}
function requestId(body){
  if(typeof body.requestId!=='string'||!REQUEST_RE.test(body.requestId))
    throw ERROR(400,'INVALID_REQUEST_ID');
  return body.requestId;
}
function cardContent(body){
  if(!str(body.term,120)||!str(body.meaningZh,500))throw ERROR(400,'INVALID_CARD');
  const term=body.term.trim(),normalized_term=normalizeTerm(term);
  if(!normalized_term||normalized_term.length>120)throw ERROR(400,'INVALID_CARD');
  return {
    term,normalized_term,meaning_zh:body.meaningZh.trim(),
    part_of_speech: typeof body.partOfSpeech==='string'?body.partOfSpeech.slice(0,40):'',
    example_en:typeof body.exampleEn==='string'?body.exampleEn.slice(0,500):''
  };
}
async function audit({base,secret,userId,action,id,requestId,fetchImpl}) {
  await restRequest({base,secret,path:'english_audit_events',method:'POST',fetchImpl,
    payload:{owner_id:userId,actor_type:'verified_google_user',
      action,resource_id:id,request_id:requestId}});
}
export async function handleP1Request(req,env,fetchImpl=fetch) {
  const origin=env.ENGLISH_ALLOWED_ORIGIN||NORMAL_ORIGIN;
  if(req.headers.get('origin')!==origin) return resp(403,{code:'ORIGIN_NOT_ALLOWED'},origin);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':origin,
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'authorization,apikey,content-type',
    'vary':'Origin'
  }});
  const base=checkEnv(env);
  if(!base)return resp(503,{code:'SERVER_NOT_CONFIGURED'},origin);
  try {
    const actor=await authenticate(req,env,base,fetchImpl);
    const u=actor.userId,secret=env.SUPABASE_SERVICE_ROLE_KEY;
    const url=new URL(req.url);
    const path=url.pathname.replace(/^\/+/,'').split('/').pop();
    if(req.method==='GET'&&path==='status')
      return resp(200,{ready:true,ownerVerified:true},origin);
    if(req.method==='GET'&&(path==='candidates'||path==='cards')){
      const table=path==='cards'?'english_cards':'english_card_candidates';
      const data=await restRequest({base,secret,fetchImpl,path:table+
       '?owner_id=eq.'+encodeURIComponent(u)+'&select=*&order=created_at.desc&limit=200'});
      return resp(200,{items:data},origin);
    }
    if(req.method!=='POST')return resp(404,{code:'UNKNOWN_ACTION'},origin);
    const body=await validateBody(req),rid=requestId(body);
    if(path==='candidate'){
      const data=cardContent(body);
      if(!str(body.sourceEventId,100))throw ERROR(400,'INVALID_SOURCE_EVENT');
      const inserted=await restRequest({base,secret,fetchImpl,
        path:'english_card_candidates',method:'POST',payload:{
          ...data,owner_id:u,source_event_id:body.sourceEventId.trim(),status:'pending'}});
      const item=inserted?.[0];
      if(!item?.id)throw ERROR(503,'DB_RESPONSE_INVALID');
      await audit({base,secret,userId:u,action:'candidate_create',id:item.id,requestId:rid,fetchImpl});
      return resp(201,{id:item.id,status:'pending'},origin);
    }
    if(path==='card'){
      const data=cardContent(body);
      const inserted=await restRequest({base,secret,fetchImpl,path:'english_cards',method:'POST',
        payload:{...data,owner_id:u}});
      const item=inserted?.[0];if(!item?.id)throw ERROR(503,'DB_RESPONSE_INVALID');
      await audit({base,secret,userId:u,action:'explicit_card_create',id:item.id,requestId:rid,fetchImpl});
      return resp(201,{id:item.id,status:'active'},origin);
    }
    if(path==='accept'){
      if(!uuid(body.candidateId)||body.userConfirmed!==true)
        throw ERROR(400,'EXPLICIT_CONFIRMATION_REQUIRED');
      const digestArray=new Uint8Array(await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(u+':'+body.candidateId+':accept')));
      const digest=Array.from(digestArray).map(b=>b.toString(16).padStart(2,'0')).join('');
      const result=await restRequest({base,secret,fetchImpl,
        path:'rpc/english_promote_candidate',method:'POST',
        payload:{p_owner_id:u,p_candidate_id:body.candidateId,p_request_id:rid,p_payload_digest:digest}});
      return resp(200,{result},origin);
    }
    if(path==='ignore'){
      if(!uuid(body.candidateId)||body.userConfirmed!==true)
        throw ERROR(400,'EXPLICIT_CONFIRMATION_REQUIRED');
      const patch=await restRequest({base,secret,fetchImpl,method:'PATCH',
        path:'english_card_candidates?owner_id=eq.'+encodeURIComponent(u)+
         '&id=eq.'+encodeURIComponent(body.candidateId)+'&status=eq.pending',
        payload:{status:'ignored',reviewed_at:new Date().toISOString()}});
      if(!Array.isArray(patch)||patch.length!==1)throw ERROR(409,'CANDIDATE_NOT_PENDING');
      await audit({base,secret,userId:u,action:'candidate_ignored',id:body.candidateId,requestId:rid,fetchImpl});
      return resp(200,{status:'ignored'},origin);
    }
    return resp(404,{code:'UNKNOWN_ACTION'},origin);
  }catch(e){
    const s=Number.isInteger(e?.status)?e.status:503;
    const c=typeof e?.code==='string'?e.code:'SERVER_UNAVAILABLE';
    return resp(s,{code:c},origin);
  }
}
