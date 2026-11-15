// Existing English Academy P1 live UI: verified website -> P11 atomic
// P1/P6/P7 PostgREST RPCs. Candidate only, NOT deployed.
// No API keys, identity, approval or owner ID may come from the request body.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RID=/^[A-Za-z0-9_-]{12,100}$/;
const READ=new Map([
  ['cards','english_cards'],
  ['candidates','english_card_candidates'],
  ['errors','english_error_records']
]);
const WRITE=new Set(['candidate','accept','ignore']);
const noCache={'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','vary':'Origin'};
const limited=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max;
const reply=(status,data,origin)=>new Response(JSON.stringify(data),{
  status,headers:{...noCache,...(origin?{
    'access-control-allow-origin':origin,
    'access-control-allow-headers':'authorization,apikey,content-type',
    'access-control-allow-methods':'GET,POST,OPTIONS'
  }:{})}
});
const respondError=(status,code,origin)=>reply(status,{code},origin);
function validateShape(input,allowed){
  return !!input&&typeof input==='object'&&!Array.isArray(input)&&
    Object.keys(input).every(k=>allowed.includes(k));
}
async function readBody(request){
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))
    throw {code:'JSON_REQUIRED',status:415};
  const length=Number(request.headers.get('content-length')||0);
  if(length>16384)throw {code:'REQUEST_TOO_LARGE',status:413};
  const raw=await request.text();
  if(raw.length>16384)throw {code:'REQUEST_TOO_LARGE',status:413};
  try{
    const parsed=JSON.parse(raw);
    if(validateShape(parsed,Object.keys(parsed)))return parsed;
  }catch{}
  throw {code:'INVALID_BODY',status:400};
}
const errorCode=(e)=>{
  const known=new Set(['IDEMPOTENCY_CONFLICT','CANDIDATE_NOT_PENDING',
    'CANDIDATE_NOT_FOUND','OWNER_NOT_AUTHORIZED']);
  const code=typeof e?.code==='string'?e.code:'';
  if(known.has(code))return code;
  const msg=String(e?.message||'');
  for(const term of known)if(msg.includes(term))return term;
  return 'ENGLISH_BACKEND_UNAVAILABLE';
};
const digest=async(obj)=>{
  const bytes=new TextEncoder().encode(JSON.stringify(obj));
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  return Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('');
};

export function createP11WebCardApi({
  verifyOwner,trustedDb,allowedOrigin='https://lihuany635-create.github.io'
}={}){
 if(typeof verifyOwner!=='function'||!trustedDb||
    typeof trustedDb.select!=='function'||typeof trustedDb.rpc!=='function'||
    !/^https:\/\/[^/]+$/.test(allowedOrigin))
   throw new TypeError('TRUSTED_WEB_CARD_DEPENDENCIES_REQUIRED');
 return async function handle(request){
   if(!(request instanceof Request))return respondError(400,'INVALID_REQUEST',null);
   const origin=request.headers.get('origin');
   if(origin!==allowedOrigin)return respondError(403,'ORIGIN_NOT_ALLOWED',null);
   if(request.method==='OPTIONS')return new Response(null,{
     status:204,headers:{...noCache,'access-control-allow-origin':allowedOrigin,
       'access-control-allow-headers':'authorization,apikey,content-type',
       'access-control-allow-methods':'GET,POST,OPTIONS'}
   });
   let actor;
   const authorization=request.headers.get('authorization')||'';
   if(!/^Bearer [^\s]+$/.test(authorization))
     return respondError(401,'AUTH_REQUIRED',allowedOrigin);
   try{actor=await verifyOwner({bearer:authorization.slice(7),request});}
   catch{return respondError(401,'AUTH_INVALID',allowedOrigin);}
   if(actor?.serverVerified!==true||actor.identityType!=='google-user'||
     !UUID.test(actor.ownerId||'')||!limited(actor.sessionId,128)||
     !Array.isArray(actor.scopes)||!actor.scopes.includes('english:read'))
     return respondError(403,'ACCOUNT_NOT_ALLOWED',allowedOrigin);
   const ownerId=actor.ownerId;
   const path=new URL(request.url).pathname.split('/').filter(Boolean).at(-1);
   if(request.method==='GET'&&path==='status')
     return reply(200,{ready:true,ownerVerified:true,storage:'verified-cloud'},allowedOrigin);
   if(request.method==='GET'&&READ.has(path)){
     try{
       const records=await trustedDb.select(READ.get(path),{
         ownerId,filters:path==='candidates'?{status:'pending'}:{},limit:200
       });
       if(!Array.isArray(records)||records.length>200||
          records.some(row=>row?.owner_id!==ownerId))
         throw new Error('OWNER_SCOPE_MISMATCH');
       return reply(200,{items:records},allowedOrigin);
     }catch{return respondError(503,'ENGLISH_BACKEND_UNAVAILABLE',allowedOrigin);}
   }
   if(request.method!=='POST'||!WRITE.has(path))
     return respondError(404,'UNKNOWN_ACTION',allowedOrigin);
   if(!actor.scopes.includes('english:candidate'))
     return respondError(403,'SCOPE_DENIED',allowedOrigin);
   let data;
   try{data=await readBody(request);}
   catch(e){return respondError(e?.status??400,e?.code??'INVALID_BODY',allowedOrigin);}
   if(!RID.test(data.requestId||''))
     return respondError(400,'INVALID_REQUEST_ID',allowedOrigin);
   let rpc,payload;
   if(path==='candidate'){
     if(!validateShape(data,['requestId','term','meaningZh','senseKey'])||
        !limited(data.term,120)||!limited(data.meaningZh,500)||
        (data.senseKey!==undefined&&(typeof data.senseKey!=='string'||data.senseKey.length>80)))
       return respondError(400,'INVALID_CARD',allowedOrigin);
     rpc='english_web_create_candidate';
     payload={p_owner_id:ownerId,p_request_id:data.requestId,
       p_term:data.term.trim(),p_meaning_zh:data.meaningZh.trim(),
       p_sense_key:(data.senseKey??'').trim()};
   } else {
     if(!validateShape(data,['requestId','candidateId'])||
        !UUID.test(data.candidateId||''))
       return respondError(400,'INVALID_CANDIDATE_ID',allowedOrigin);
     if(path==='accept'){
       rpc='english_web_promote_candidate';
       payload={p_owner_id:ownerId,p_candidate_id:data.candidateId,
         p_request_id:data.requestId,p_payload_digest:await digest({
           action:'promote_candidate',ownerId,candidateId:data.candidateId,
           requestId:data.requestId
         })};
     }else{
       rpc='english_web_ignore_candidate';
       payload={p_owner_id:ownerId,p_candidate_id:data.candidateId,
         p_request_id:data.requestId};
     }
   }
   try{
     const result=await trustedDb.rpc(rpc,payload);
     if(!result||typeof result!=='object'||!limited(result.status,60))
       throw new Error('BAD_BACKEND_RESPONSE');
     return reply(path==='candidate'?201:200,result,allowedOrigin);
   }catch(e){
     const code=errorCode(e);
     const status=code==='IDEMPOTENCY_CONFLICT'||code==='CANDIDATE_NOT_PENDING'?
       409:code==='OWNER_NOT_AUTHORIZED'?403:
       code==='CANDIDATE_NOT_FOUND'?404:503;
     return respondError(status,code,allowedOrigin);
   }
 };
}
