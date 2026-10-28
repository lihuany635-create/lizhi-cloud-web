/** Actual local SQL + Web Request execution; identity/Bridge are simulated.
 * AUTH01..AUTH10 labels here NEVER imply live platform E2E.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {D1Ledger,ManualReadHost,bridgeSource,PROJECT,TOOLS} from '../../production/source/lib/ai-loop-v15.mjs';
const ORIGIN='https://sandbox.invalid',OWNER='test-owner';
const schema=readFileSync(new URL('../../production/source/sql/ai-loop-v15-candidate.sql',import.meta.url),'utf8');
function d1(db){return {prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)??null;},async run(){return db.prepare(sql).run(...args);}};}};}};}
function req(body,headers={}){return new Request(ORIGIN+'/api/ai-loop',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':OWNER,...headers},body:JSON.stringify(body)});}
const body=(requestId='request-1')=>({action:'run',projectId:PROJECT,mode:'MANUAL',requestId});
function fixture({db=new DatabaseSync(':memory:'),init=true,read,enabled=true,timeoutMs=8000}={}){
 if(init)db.exec(schema);let time=1800000000000;const seen=[];
 const ledger=new D1Ledger(d1(db));
 const source=async(tool,args,signal)=>{seen.push({tool,args});if(read)return read(tool,args,signal,seen.length);
  if(tool==='list_projects')return [{projectId:PROJECT,revision:78},{projectId:'foreign',revision:8,private:'PRIVATE_SOURCE'}];
  if(tool==='get_project_context')return {projectId:PROJECT,revision:78,tasks:[{id:'task-1',key:'worker',status:'IN_PROGRESS',title:'PRIVATE_SOURCE'}],secret:'PRIVATE_SOURCE'};
  return {projectId:PROJECT,revision:78,lastWork:{key:'last-work'},unfinished:[{}],private:'PRIVATE_SOURCE'};};
 // UNIT TEST ONLY: a mock Site verifier, not valid evidence for live owner authentication.
 const verifyIngress=async req=>({authenticated:req.headers.get('oai-authenticated-user-id')===OWNER,
   subjectId:req.headers.get('oai-authenticated-user-id')});
 const host=new ManualReadHost({ledger,read:source,owner:OWNER,origin:ORIGIN,enabled,now:()=>time,timeoutMs,verifyIngress});
 return {db,ledger,host,seen,tick:n=>{time+=n;},now:()=>time,run:(b=body(),h={})=>host.handle(req(b,h))};
}
async function error(response,code){assert.equal((await response.json()).error,code);}
test('V15-AUTH01 missing/wrong owner and fake approval cannot start grant or source read',async()=>{
 const f=fixture();for(const owner of ['', 'intruder'])await error(await f.run(body(),{'oai-authenticated-user-id':owner}),'OWNER_REQUIRED');
 await error(await f.run({...body(),ownerApproved:true}),'INVALID_REQUEST');assert.equal(f.seen.length,0);assert.equal(f.db.prepare('select count(*) n from ai_loop_grants_v15').get().n,0);
});
test('V15-AUTH02 MANUAL executes five bounded reads and fresh review, no private source/credential in result',async()=>{
 const f=fixture(),res=await f.run();assert.equal(res.status,200);const result=await res.json();assert.equal(result.calls,5);assert.equal(result.revision,78);assert.equal(result.status,'READBACK_MATCH');assert.equal(result.workbenchWritten,false);assert.equal(result.authorApproved,false);
 assert.deepEqual(f.seen.map(x=>x.tool),[...TOOLS,'get_project_context','get_project_handoff']);
 assert.equal(JSON.stringify(result).includes('PRIVATE_SOURCE'),false);assert.equal(JSON.stringify(result).includes('token'),false);
 const row=f.db.prepare('select * from ai_loop_grants_v15').get();assert.match(row.token_hash,/^[a-f0-9]{64}$/);assert.equal(row.state,'DONE');assert.equal(row.calls,5);
});
test('V15-AUTH03 cross-project denied before issue and foreign source denied without summary',async()=>{
 const f=fixture();await error(await f.run({...body(),projectId:'foreign'}),'PROJECT_DENIED');assert.equal(f.seen.length,0);
 const bad=fixture({read:()=>[{projectId:'foreign',revision:1}]});await error(await bad.run(),'SOURCE_INVALID');
});
test('V15-AUTH04 source adapter enforces exact three tools/project/schema and fixed upstream URL',async()=>{
 let calls=0;const read=bridgeSource({PRODUCTION_BRIDGE_URL:'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production',PRODUCTION_BRIDGE_KEY:'TEST_ONLY_NOT_REAL_SECRET'},async()=>{calls++;return Response.json([]);});
 for(const tool of ['append_work_record','phone_tap','finance_create_transaction','cad_line','model_scene','toString','__proto__'])await assert.rejects(()=>read(tool,{},AbortSignal.timeout(100)),/TOOL_DENIED/);
 await assert.rejects(()=>read('get_project_context',{projectId:'foreign'},AbortSignal.timeout(100)),/PROJECT_DENIED/);
 await assert.rejects(()=>read('get_project_context',{projectId:PROJECT,extra:true},AbortSignal.timeout(100)),/PROJECT_DENIED/);assert.equal(calls,0);
 assert.throws(()=>bridgeSource({PRODUCTION_BRIDGE_URL:'https://attacker.invalid',PRODUCTION_BRIDGE_KEY:'test'}),/SOURCE_UNCONFIGURED/);
});
test('V15-AUTH05 HTTP failures, malformed/oversize upstream and hung read fail closed once',async()=>{
 for(const response of [new Response('secret',{status:401}),new Response('secret',{status:403}),new Response('secret',{status:302}),new Response('secret',{status:503}),new Response('{'),new Response('x'.repeat(262145))]){
  let count=0;const read=bridgeSource({PRODUCTION_BRIDGE_URL:'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production',PRODUCTION_BRIDGE_KEY:'TEST_ONLY_NOT_REAL_SECRET'},async()=>{count++;return response;});
  const f=fixture({read});const r=await f.run();assert.ok(r.status>=400);assert.equal((await r.text()).includes('secret'),false);assert.equal(count,1);
 }
 const f=fixture({read:()=>new Promise(()=>{}),timeoutMs:20});const keep=setTimeout(()=>{},1000);await error(await f.run(),'TIMEOUT');clearTimeout(keep);assert.equal(f.seen.length,1);
});
test('V15-AUTH06 revision or same-revision metadata drift rejects review',async()=>{
 for(const sameRevision of [false,true]){const f=fixture({read:(tool,args,signal,n)=>tool==='list_projects'?[{projectId:PROJECT,revision:78}]:tool==='get_project_context'?{projectId:PROJECT,revision:n>3&&!sameRevision?79:78,tasks:[{id:'task-1',key:'worker',status:n>3&&sameRevision?'PASS':'IN_PROGRESS'}]}:{projectId:PROJECT,revision:78,unfinished:[]}});await error(await f.run(),'SOURCE_CHANGED');}
});
test('V15-AUTH07 expiry and cross-instance revoke block next read and late result',async()=>{
 for(const expire of [false,true]){let f;f=fixture({read:async()=>{
  const g=f.db.prepare('select id from ai_loop_grants_v15').get();
  if(expire)f.tick(60001);else await new D1Ledger(d1(f.db)).revoke(g.id,OWNER);
  return [{projectId:PROJECT,revision:78}];
 }});await error(await f.run(),'GRANT_INACTIVE');assert.equal(f.seen.length,1);}
});
test('V15-AUTH08 concurrent duplicate request only executes one run across two host instances',async()=>{
 const f=fixture(),other=fixture({db:f.db,init:false});const results=await Promise.all([f.run(),other.run()]);assert.deepEqual(results.map(r=>r.status).sort(),[200,503]);assert.equal(f.seen.length+other.seen.length,5);
 const res=await f.run();assert.ok(res.status>=400);assert.equal(f.seen.length+other.seen.length,5);
});
test('V15-AUTH09 OFF/AUTO/CSRF/unknown action/extra fields fail before grant or read',async()=>{
 const off=fixture({enabled:false});await error(await off.run(),'WORKER_DISABLED');
 const f=fixture();await error(await f.run({...body(),mode:'AUTO'}),'AUTO_DISABLED');
 await error(await f.run(body(),{origin:'https://attacker.invalid'}),'CSRF_DENIED');
 await error(await f.run(body(),{'sec-fetch-site':'cross-site'}),'CSRF_DENIED');
 await error(await f.run({action:'issue',grantId:'bad'}),'ACTION_DENIED');
 assert.equal(f.seen.length,0);
});
test('V15-AUTH10 durable audit stores safe events, no source/token/error bodies',async()=>{
 const f=fixture();await f.run();const audit=f.db.prepare('select * from ai_loop_audit_v15').all();assert.equal(audit.length,7);assert.equal(audit.filter(x=>x.event==='READ_ATTEMPT').length,5);
 const serial=JSON.stringify(audit);assert.equal(serial.includes('PRIVATE_SOURCE'),false);assert.equal(serial.includes('token'),false);assert.equal(serial.includes('Bearer'),false);
});
test('V15-11 SQLite reopen retains revocation/request replay protection',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ai-loop-v15-'));try{
  const path=join(dir,'ledger.db');const f=fixture({db:new DatabaseSync(path)});await f.run();const g=f.db.prepare('select id from ai_loop_grants_v15').get();await f.ledger.revoke(g.id,OWNER);f.db.close();
  const other=fixture({db:new DatabaseSync(path),init:false});assert.equal((await other.ledger.status(g.id,OWNER)).revoked,1);assert.ok((await other.run()).status>=400);assert.equal(other.seen.length,0);other.db.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('V15-12 atomic call limit, owner isolation and malformed/oversize client request',async()=>{
 const f=fixture();const g=await f.ledger.issue(OWNER,f.now());await f.ledger.claim(g.token,OWNER,'manual-claim',f.now());
 const reads=await Promise.all(Array.from({length:10},()=>f.ledger.consume(g.grantId,OWNER,f.now())));assert.equal(reads.filter(Boolean).length,5);
 assert.equal(await f.ledger.revoke(g.grantId,'intruder'),null);assert.equal(await f.ledger.status(g.grantId,'intruder'),null);
 await error(await f.host.handle(new Request(ORIGIN+'/api/ai-loop',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':OWNER},body:'x'.repeat(2049)})),'BODY_TOO_LARGE');
});
test('V15-13 ledger/audit failure prevents upstream call; no silent success',async()=>{
 const f=fixture();f.db.exec('DROP TABLE ai_loop_audit_v15');await error(await f.run(),'HOST_FAILED');assert.equal(f.seen.length,0);
});
test('V15-14 grant revoke during audit prevents next upstream read',async()=>{
 const f=fixture(),audit=f.ledger.audit.bind(f.ledger);f.ledger.audit=async(g,r,event,...rest)=>{await audit(g,r,event,...rest);if(event==='READ_ATTEMPT')await new D1Ledger(d1(f.db)).revoke(g,OWNER);};
 await error(await f.run(),'GRANT_INACTIVE');assert.equal(f.seen.length,0);
});
test('V15-15 upstream stalled body aborts and no late result is returned',async()=>{
 const read=bridgeSource({PRODUCTION_BRIDGE_URL:'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production',PRODUCTION_BRIDGE_KEY:'TEST_ONLY_NOT_REAL_SECRET'},async()=>new Response(new ReadableStream({start(){}})));
 const f=fixture({read,timeoutMs:20}),keep=setTimeout(()=>{},1000);await error(await f.run(),'TIMEOUT');clearTimeout(keep);assert.equal(f.seen.length,1);
});
test('V15-16 missing schema fails closed; short-lived grant and TTL upper bound enforced',async()=>{
 const f=fixture();for(const ttl of [0,-1,300001,Infinity])await assert.rejects(()=>f.ledger.issue(OWNER,f.now(),ttl),/INVALID_TTL/);
 const g=await f.ledger.issue(OWNER,f.now(),1);f.tick(2);assert.equal(await f.ledger.claim(g.token,OWNER,'expired-claim',f.now()),null);
 f.db.exec('DROP TABLE ai_loop_grants_v15');await error(await f.run(),'HOST_FAILED');assert.equal(f.seen.length,0);
});


test('V15-17 trusted ingress verifier is mandatory, a forged owner header cannot bypass it',async()=>{
 const f=fixture();
 const base={ledger:f.ledger,read:f.host.read,owner:OWNER,origin:ORIGIN,enabled:true,now:f.now};
 assert.throws(()=>new ManualReadHost(base),e=>e.code==='INGRESS_VERIFIER_REQUIRED');
 const forged=new ManualReadHost({...base,verifyIngress:async()=>null});
 await error(await forged.handle(req(body())),'INGRESS_IDENTITY_UNVERIFIED');
 assert.equal(f.seen.length,0);
 assert.equal(f.db.prepare('select count(*) n from ai_loop_grants_v15').get().n,0);
});
test('V15-18 verified platform principal must match owner even when HTTP header matches',async()=>{
 const f=fixture();
 const base={ledger:f.ledger,read:f.host.read,owner:OWNER,origin:ORIGIN,enabled:true,now:f.now};
 for(const verifier of [
  async()=>({authenticated:false,subjectId:OWNER}),
  async()=>({authenticated:true,subjectId:'other-owner'}),
  async()=>{throw Error('hidden platform exception token');},
 ]) {
  const host=new ManualReadHost({...base,verifyIngress:verifier});
  const res=await host.handle(req(body()));
  await error(res,'INGRESS_IDENTITY_UNVERIFIED');
 }
 assert.equal(f.seen.length,0);
});
test('V15-19 platform revocation before first source read fails closed and does not issue visible results',async()=>{
 const f=fixture();let checks=0;
 const host=new ManualReadHost({ledger:f.ledger,read:f.host.read,owner:OWNER,origin:ORIGIN,
  enabled:true,now:f.now,verifyIngress:async()=>{
   checks++;return checks<3?{authenticated:true,subjectId:OWNER}:{authenticated:false,subjectId:OWNER};
  }});
 await error(await host.handle(req(body())),'INGRESS_IDENTITY_UNVERIFIED');
 assert.equal(f.seen.length,0);
 assert.ok(checks>=3);
});


test('V15-20 Cloudflare-compatible manual redirects prevent Bridge credential forwarding',async()=>{
 const calls=[];
 const source=bridgeSource({
  PRODUCTION_BRIDGE_URL:'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production',
  PRODUCTION_BRIDGE_KEY:'TEST_ONLY_NOT_REAL_SECRET'
 },async(url,options)=>{
   calls.push({url,method:options.method,redirect:options.redirect});
   assert.equal(options.redirect,'manual','Cloudflare Workers does not implement redirect:error');
   assert.equal(options.method,'POST');
   return new Response(null,{status:302,headers:{Location:'https://attacker.invalid/collect'}});
 });
 const f=fixture({read:source});
 await error(await f.run(),'SOURCE_REDIRECT_DENIED');
 assert.equal(calls.length,1,'no redirect follow or retries');
 assert.equal(f.seen.length,1,'no second source call');
 assert.equal(calls[0].url,'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production/bridge');
});
