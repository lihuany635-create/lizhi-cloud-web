/** Site-internal MANUAL host candidate. No deployment or real issuance in CI.
 * Only Sites dispatch may reach this handler; NEVER expose origin directly.
 * Credentials stay inside the trusted host; no bearer is returned to browser.
 */
export const PROJECT='61b88bec-9b3e-49e6-8780-d073fc816516';
export const TOOLS=Object.freeze(['list_projects','get_project_context','get_project_handoff']);
export class AuthError extends Error {constructor(code,status=403){super(code);this.code=code;this.status=status;}}
const need=(ok,code,status)=>{if(!ok)throw new AuthError(code,status);};
const id=x=>typeof x==='string'&&/^[\w-]{1,128}$/.test(x);
const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x))),b=>b.toString(16).padStart(2,'0')).join('');
const untilAbort=(promise,signal)=>new Promise((resolve,reject)=>{
 const abort=()=>reject(new AuthError('TIMEOUT',503));
 if(signal.aborted)return abort();signal.addEventListener('abort',abort,{once:true});
 Promise.resolve(promise).then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
});
const opaque=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export async function boundedJSON(response,limit,signal){
 const reader=response.body?.getReader();need(reader,'INVALID_BODY',400);
 let size=0;const chunks=[];
 try{while(true){signal?.throwIfAborted();const {value,done}=await untilAbort(reader.read(),signal??AbortSignal.timeout(8000));if(done)break;size+=value.length;need(size<=limit,'BODY_TOO_LARGE',413);chunks.push(value);}
  const bytes=new Uint8Array(size);let off=0;for(const c of chunks){bytes.set(c,off);off+=c.length;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }finally{void reader.cancel().catch(()=>{});}
}
export class D1Ledger {
 constructor(db){need(db?.prepare&&db?.batch,'LEDGER_UNAVAILABLE',503);this.db=db;}
 async one(sql,...args){return this.db.prepare(sql).bind(...args).first();}
 async audit(g,request,event,tool=null,at=Date.now()){
  await this.db.prepare('INSERT INTO ai_loop_audit_v15 VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),g,request,event,tool,at).run();
 }
 async issue(owner,now,ttl=60000,requestId=null){
  need(Number.isSafeInteger(ttl)&&ttl>0&&ttl<=300000,'INVALID_TTL');
  // If supplied, reserve the retry key in the SAME transaction as grant/audit issuance.
  // Duplicate requests must not leave more grant rows or extra audit writes.
  need(requestId===null||id(requestId),'INVALID_REQUEST',400);
  const token=opaque(),grantId=crypto.randomUUID();
  // D1 batch is transactional: no live orphan grant if ISSUED audit fails.
  await this.db.batch([
   this.db.prepare('INSERT INTO ai_loop_grants_v15(id,token_hash,owner,project,expires,request_id) VALUES(?,?,?,?,?,?)').bind(grantId,await hash(token),owner,PROJECT,now+ttl,requestId),
   this.db.prepare('INSERT INTO ai_loop_audit_v15(id,grant_id,request_id,event,tool,at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),grantId,null,'ISSUED',null,now),
  ]);
  return {token,grantId};
 }
 async claim(token,owner,requestId,now){
  need(id(requestId),'INVALID_REQUEST',400);
  // Unique(owner,request_id) makes retries across grants/processes fail closed.
  return this.one("UPDATE ai_loop_grants_v15 SET state='RUNNING',request_id=? WHERE token_hash=? AND owner=? AND project=? AND state='ISSUED' AND revoked=0 AND expires>? AND (request_id IS NULL OR request_id=?) RETURNING id",requestId,await hash(token),owner,PROJECT,now,requestId);
 }
 async active(g,owner,now){return this.one("SELECT id FROM ai_loop_grants_v15 WHERE id=? AND owner=? AND project=? AND revoked=0 AND expires>? AND state='RUNNING'",g,owner,PROJECT,now);}
 async consume(g,owner,now){return this.one("UPDATE ai_loop_grants_v15 SET calls=calls+1 WHERE id=? AND owner=? AND project=? AND revoked=0 AND expires>? AND state='RUNNING' AND calls<5 RETURNING id",g,owner,PROJECT,now);}
 async finish(g,owner,state,now){return this.one("UPDATE ai_loop_grants_v15 SET state=? WHERE id=? AND owner=? AND revoked=0 AND expires>? AND state='RUNNING' RETURNING id",state,g,owner,now);}
 async revoke(g,owner){return this.one('UPDATE ai_loop_grants_v15 SET revoked=1 WHERE id=? AND owner=? RETURNING id',g,owner);}
 async status(g,owner){return this.one('SELECT id,project,expires,revoked,state,calls FROM ai_loop_grants_v15 WHERE id=? AND owner=?',g,owner);}
}
function projectId(x){return x?.projectId??x?.id;}
export function minimise(tool,raw){
 need(TOOLS.includes(tool),'TOOL_DENIED');
 if(tool==='list_projects'){
  need(Array.isArray(raw),'SOURCE_INVALID',502);const p=raw.find(p=>projectId(p)===PROJECT);
  need(p&&Number.isSafeInteger(p.revision),'SOURCE_INVALID',502);return [{projectId:PROJECT,revision:p.revision}];
 }
 need(projectId(raw)===PROJECT&&Number.isSafeInteger(raw.revision),'SOURCE_SCOPE_INVALID',502);
 if(tool==='get_project_context'){
  need(Array.isArray(raw.tasks)&&raw.tasks.length<=1000,'SOURCE_INVALID',502);
  const tasks=raw.tasks.map(t=>{need(id(t.id)&&id(t.key)&&['PLANNED','IN_PROGRESS','PASS','FAIL','BLOCKED','NOT_TESTED'].includes(t.status),'SOURCE_INVALID',502);return {id:t.id,key:t.key,status:t.status};});
  need(new Set(tasks.map(t=>t.id)).size===tasks.length,'SOURCE_INVALID',502);
  return {projectId:PROJECT,revision:raw.revision,tasks};
 }
 // Existing Bridge has an array; a future source-side compact response may
 // carry only a validated count. Never silently truncate or trust two forms.
 const arrayForm=Array.isArray(raw.unfinished);
 const countForm=Number.isSafeInteger(raw.unfinishedCount)&&raw.unfinishedCount>=0;
 need(arrayForm!==countForm,'SOURCE_INVALID',502);
 need(!arrayForm||raw.unfinished.length<=1000,'SOURCE_TOO_MANY_TASKS',502);
 need(!countForm||raw.unfinishedCount<=1000,'SOURCE_TOO_MANY_TASKS',502);
 const key=raw.lastWork?.key??null;need(key===null||id(key),'SOURCE_INVALID',502);
 return {projectId:PROJECT,revision:raw.revision,lastWorkKey:key,
   unfinishedCount:arrayForm?raw.unfinished.length:raw.unfinishedCount};
}
/** Trusted host-only adapter. Broad Bridge key never enters Worker capsule. */
export function bridgeSource(env,fetchImpl=fetch){
 const base='https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production';
 need(env.PRODUCTION_BRIDGE_URL===base&&env.PRODUCTION_BRIDGE_KEY,'SOURCE_UNCONFIGURED',503);
 // Compact mode requires a separately verified upstream deployment. No silent fallback:
 // any unknown setting fails rather than sending a broad legacy read.
 const mode=env.AI_LOOP_COMPACT_SOURCE_MODE;
 need(mode===undefined||mode==='verified-v1','SOURCE_MODE_UNVERIFIED',503);
 const ops=mode==='verified-v1'
  ?{list_projects:'listManagedProjectsCompactV1',get_project_context:'getProjectContextCompactV1',get_project_handoff:'getProjectHandoffCompactV1'}
  :{list_projects:'listManagedProjects',get_project_context:'getProjectContext',get_project_handoff:'getProjectHandoff'};
 return async function read(tool,args,signal){
  need(TOOLS.includes(tool),'TOOL_DENIED');
  need(args&&Object.keys(args).length===(tool==='list_projects'?0:1)&&(tool==='list_projects'||args.projectId===PROJECT),'PROJECT_DENIED');
  // Cloudflare Workers supports manual (not error) redirect mode; never forward the Bridge key on a redirect.
  const res=await fetchImpl(base+'/bridge',{method:'POST',redirect:'manual',cache:'no-store',signal,
   headers:{Authorization:'Bearer '+env.PRODUCTION_BRIDGE_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({op:ops[tool],args:tool==='list_projects'?[]:[PROJECT]})});
  need(!(res.status>=300&&res.status<400),'SOURCE_REDIRECT_DENIED',502);
  need(res.status===200,'SOURCE_UNAVAILABLE',502);
  return boundedJSON(res,262144,signal);
 };
}
export class ManualReadHost {
 constructor({ledger,read,owner,origin,now=Date.now,enabled=false,timeoutMs=8000,verifyIngress}){
  need(id(owner)&&new URL(origin).protocol==='https:'&&ledger&&typeof read==='function','HOST_UNCONFIGURED',503);
  // HTTP identity headers alone cannot authenticate a caller. Trusted server proof is mandatory.
  need(typeof verifyIngress==='function','INGRESS_VERIFIER_REQUIRED',503);
  need(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=30000,'INVALID_TIMEOUT');
  Object.assign(this,{ledger,read,owner,origin,now,enabled,timeoutMs,verifyIngress});
 }
 async authenticate(req,signal=AbortSignal.timeout(this.timeoutMs)){
  // Only a separately verified trusted principal can authenticate ingress.
  // Header stripping/injection on the actual Site remains NOT_VERIFIED.
  // Service bypass bearer alone supplies NO visitor identity and is rejected.
  need(this.enabled===true,'WORKER_DISABLED',503);
  need(new URL(req.url).origin===this.origin,'ORIGIN_DENIED');
  // Header equality is an additional necessary check, but is never sufficient authentication.
  need(req.headers.get('oai-authenticated-user-id')===this.owner,'OWNER_REQUIRED',401);
  let principal;
  try { principal=await untilAbort(this.verifyIngress(req),signal); }
  catch { if(signal.aborted)throw new AuthError('TIMEOUT',503);throw new AuthError('INGRESS_IDENTITY_UNVERIFIED',401); }
  need(principal?.authenticated===true && principal.subjectId===this.owner &&
   Number.isSafeInteger(principal.expiresAt) && principal.expiresAt>this.now() &&
   principal.revoked!==true && principal.isAnonymous!==true,'INGRESS_IDENTITY_UNVERIFIED',401);
  need(!req.headers.has('origin')||req.headers.get('origin')===this.origin,'CSRF_DENIED');
  need(!req.headers.has('sec-fetch-site')||['same-origin','none'].includes(req.headers.get('sec-fetch-site')),'CSRF_DENIED');
  return this.owner;
 }
 async run(req,{projectId:project,mode,requestId}={},signal=AbortSignal.timeout(this.timeoutMs)){
  const owner=await this.authenticate(req,signal);need(mode==='MANUAL','AUTO_DISABLED');need(project===PROJECT,'PROJECT_DENIED');need(id(requestId),'INVALID_REQUEST',400);
  let g;
  try{
   signal.throwIfAborted();g=await this.ledger.issue(owner,this.now(),60000,requestId);signal.throwIfAborted();
   need(await this.ledger.claim(g.token,owner,requestId,this.now()),'DUPLICATE_OR_INACTIVE',409);
   const call=async(tool)=>{
    await this.authenticate(req,signal);signal.throwIfAborted();
    need(await this.ledger.consume(g.grantId,owner,this.now()),'GRANT_INACTIVE');
    await this.ledger.audit(g.grantId,requestId,'READ_ATTEMPT',tool,this.now());
    // Recheck after awaited audit, before any upstream read.
    need(await this.ledger.active(g.grantId,owner,this.now()),'GRANT_INACTIVE');
    await this.authenticate(req,signal);signal.throwIfAborted();
    const raw=await untilAbort(this.read(tool,tool==='list_projects'?{}:{projectId:PROJECT},signal),signal);
    signal.throwIfAborted();need(await this.ledger.active(g.grantId,owner,this.now()),'GRANT_INACTIVE');
    return minimise(tool,raw);
   };
   const listed=await call('list_projects'),context=await call('get_project_context'),handoff=await call('get_project_handoff');
   const reviewContext=await call('get_project_context'),reviewHandoff=await call('get_project_handoff');
   need(listed[0].revision===context.revision&&context.revision===handoff.revision&&JSON.stringify(context)===JSON.stringify(reviewContext)&&JSON.stringify(handoff)===JSON.stringify(reviewHandoff),'SOURCE_CHANGED',409);
   await this.authenticate(req,signal);signal.throwIfAborted();
   await this.ledger.audit(g.grantId,requestId,'REVIEW_MATCH',null,this.now());
   await this.authenticate(req,signal);signal.throwIfAborted();
   need(await this.ledger.finish(g.grantId,owner,'DONE',this.now()),'GRANT_INACTIVE');
   // Do not export source text, task titles, URLs, session, tokens or secret values.
   return {grantId:g.grantId,projectId:PROJECT,requestId,revision:context.revision,sourceHash:await hash(JSON.stringify({context,handoff})),
    status:'READBACK_MATCH',tasks:context.tasks,unfinishedCount:handoff.unfinishedCount,
    calls:5,mode:'MANUAL',auto:false,paidApiUsed:false,authorApproved:false,workbenchWritten:false,
    handoff:{status:'IN_PROGRESS',scope:'bounded readonly metadata; no model inference',next:'Owner reviews summary; authorised ChatGPT records evidence separately'}};
  }catch(e){
   if(g){await this.ledger.revoke(g.grantId,owner).catch(()=>{});await this.ledger.audit(g.grantId,requestId,'FAILED_CLOSED',null,this.now()).catch(()=>{});}
   // Never echo SQL, upstream messages, token or private source.
   if(e instanceof AuthError)throw e;throw new AuthError(signal.aborted?'TIMEOUT':'HOST_FAILED',503);
  }
 }
 async handle(req){
  const signal=AbortSignal.timeout(this.timeoutMs);
  try{
   const owner=await this.authenticate(req,signal);need(req.method==='POST','METHOD_DENIED',405);
   need(req.headers.get('content-type')?.split(';')[0]==='application/json','JSON_REQUIRED',415);
   const body=await boundedJSON(req,2048,signal);
   need(body&&typeof body==='object'&&!Array.isArray(body),'INVALID_REQUEST',400);
   const allowed=body.action==='run'?['action','projectId','mode','requestId']:['action','grantId'];
   need(Object.keys(body).every(k=>allowed.includes(k)),'INVALID_REQUEST',400);
   await this.authenticate(req,signal);signal.throwIfAborted();
   let result;
   if(body.action==='run')result=await this.run(req,body,signal);
   else {need(id(body.grantId),'INVALID_REQUEST',400);need(['revoke','status'].includes(body.action),'ACTION_DENIED');
    result=await this.ledger[body.action](body.grantId,owner);need(result,'GRANT_NOT_FOUND',404);
    await this.ledger.audit(body.grantId,null,body.action==='revoke'?'REVOKED':'STATUS',null,this.now());}
   return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:e instanceof AuthError?e.code:'HOST_FAILED'},{status:e instanceof AuthError?e.status:503,headers:{'Cache-Control':'no-store'}});}
 }
}
