// Synthetic Edge/Auth/PostgREST integration; not a production owner-HTTP test.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const owner='7ee9b650-4b22-4c13-ba46-9ceefa9deaaa';
const bridge='synthetic-bridge-fixture-'.repeat(3),actor='synthetic-site-owner';
const file=new URL('../supabase/functions/lizhi-usage-monitor/index.ts',import.meta.url);
let handler;const rows=[];let sequence=0,breakWrite=false;
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',LIZHI_USAGE_MCP_BRIDGE_KEY:bridge,LIZHI_USAGE_MCP_ALLOWED_ACTOR:actor};
const realFetch=globalThis.fetch;
globalThis.Deno={env:{get:k=>env[k]},serve:f=>{handler=f;}};
globalThis.fetch=async(url,init={})=>{
 const u=new URL(url);assert.equal(u.origin,'https://synthetic.invalid');
 if(u.pathname==='/auth/v1/user'){
  if(init.headers.Authorization==='Bearer synthetic-owner-session')return Response.json({id:owner});
  if(init.headers.Authorization==='Bearer synthetic-other-session')return Response.json({id:'ae624019-050b-42cd-951d-d8b748bed507'});
  return Response.json({error:'invalid'},{status:401});
 }
 assert.equal(init.headers.apikey,'synthetic-service');
 if(u.pathname==='/rest/v1/aiwb_projects')return Response.json([{owner_id:owner}]);
 assert.equal(u.pathname,'/rest/v1/aiwb_side_logs');
 if(init.method==='POST'){
  if(breakWrite)return Response.json({error:'synthetic-failure'},{status:500});
  const row=JSON.parse(init.body);assert.equal(row.owner_id,owner);
  if(rows.some(x=>x.id===row.id))return Response.json({code:'23505'},{status:409});
  rows.push({...row,created_at:new Date(Date.now()+sequence++).toISOString()});
  return new Response(null,{status:201});
 }
 assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
 let result=rows.filter(r=>r.owner_id===owner);
 const id=u.searchParams.get('id');if(id)result=result.filter(r=>r.id===id.slice(3));
 const title=u.searchParams.get('title');
 if(title?.startsWith('like.'))result=result.filter(x=>x.title.startsWith(title.slice(5).replace('*','')));
 if(title?.startsWith('eq.'))result=result.filter(x=>x.title===title.slice(3));
 const or=u.searchParams.get('or');if(or){const event=or.match(/[0-9a-f-]{36}/)[0];result=result.filter(x=>x.title.endsWith(' '+event));}
 if(u.searchParams.get('order')?.startsWith('created_at.desc'))result=result.toReversed();
 const offset=Number(u.searchParams.get('offset')||0),limit=Number(u.searchParams.get('limit')||100);
 return Response.json(result.slice(offset,offset+limit));
};
let source=await readFile(file,'utf8');
source=source.replace('import "jsr:@supabase/functions-js/edge-runtime.d.ts";','');
source=source.replace(/import \{BRIDGE_SECRET_SHA256,BRIDGE_ACTOR_SHA256\} from [^;]+;/,'const BRIDGE_SECRET_SHA256=undefined,BRIDGE_ACTOR_SHA256=undefined;');
source=source.replace(/from "(\.\.\/[^\"]+)"/g,(_,p)=>'from "'+new URL(p,file).href+'"');
await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64'));
const root='https://edge.invalid/functions/v1/lizhi-usage-monitor';
const rpc=async(name,args={},extra={})=>{
 const r=await handler(new Request(root+'/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json',authorization:'Bearer synthetic-owner-session',...extra},body:JSON.stringify({jsonrpc:'2.0',id:1,method:name==='tools/list'?name:'tools/call',params:{name,arguments:args}})}));
 return {status:r.status,body:await r.json()};
};
const value=r=>{assert.equal(r.status,200);assert.equal(r.body.result.isError,false,JSON.stringify(r));return JSON.parse(r.body.result.content[0].text);};
test('integrated Edge enforces owner auth, persists and reads Side, rejects duplicates and write failures',async t=>{
 try{
 await t.test('anonymous, forged caller and genuine other account denied',async()=>{
  assert.equal((await rpc('tools/list',{}, {authorization:''})).status,401);
  assert.equal((await rpc('tools/list',{}, {authorization:'Bearer synthetic-other-session'})).status,403);
  assert.equal((await rpc('tools/list',{}, {'x-lizhi-usage-bridge':bridge,'x-lizhi-usage-actor':'wrong-owner'})).status,403);
  assert.equal((await rpc('tools/list',{}, {origin:'https://untrusted.example'})).status,403);
 });
 await t.test('verified bridge lists exactly eleven tools',async()=>{
  const r=await rpc('tools/list',{}, {authorization:'','x-lizhi-usage-bridge':bridge,'x-lizhi-usage-actor':actor});
  assert.equal(r.status,200);assert.equal(r.body.result.tools.length,11);
 });
 const month=new Intl.DateTimeFormat('sv',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit'}).format(new Date());
 const before={eventId:crypto.randomUUID(),at:new Date().toISOString(),service:'supabase',feature:'usage_monitor',taskLabel:'隔離端點驗收',actionDetail:'查詢監控服務狀態',operation:'edge_read',plannedCalls:1};
 const {at,plannedCalls,...metadata}=before;
 await t.test('owner budget writes and reads back without accepting client UID',async()=>{
  assert.equal(value(await rpc('usage_budget_set',{month,cap:1})).monthlyToolCap,1);
  assert.equal((await rpc('usage_budget_set',{month,cap:9,ownerId:owner})).body.error.code,-32602);
 });
 await t.test('before saved, after saved, retries and website source match',async()=>{
  assert.equal(value(await rpc('usage_log_before',before)).decision,'allow');
  const after={...metadata,completedAt:new Date().toISOString(),toolCalls:1,outcome:'success'};
  assert.equal(value(await rpc('usage_log_after',after)).saved,true);
  assert.equal(value(await rpc('usage_log_after',after)).saved,true);
  assert.equal(value(await rpc('usage_events',{eventId:before.eventId})).records.length,2);
  const web=await handler(new Request(root+'/ai-ledger?month='+month,{headers:{authorization:'Bearer synthetic-owner-session'}}));
  assert.equal(web.status,200);assert.equal((await web.json()).summary.assistantObservedToolCalls,1);
 });
 await t.test('cap holds next optional task and failed/aborted task still recorded',async()=>{
  const next={...before,eventId:crypto.randomUUID(),at:new Date().toISOString()};
  assert.equal(value(await rpc('usage_log_before',next)).decision,'hold');
  const {at,plannedCalls,...meta}=next;
  const after={...meta,completedAt:new Date().toISOString(),toolCalls:0,outcome:'failure'};
  assert.equal(value(await rpc('usage_log_after',after)).saved,true);
  const summary=value(await rpc('usage_summary'));assert.equal(summary.summary.failures,1);assert.equal(summary.summary.assistantObservedToolCalls,1);
 });
 await t.test('egress MCP persists, independent GET reads back and retry keeps one row',async()=>{
  const args={month,total:4.8,cached:1.1,unit:'GB',observedAt:new Date().toISOString(),samePeriod:true};
  const first=value(await rpc('usage_egress_record',args));assert.equal(first.verified,true);
  assert.equal(value(await rpc('usage_egress_record',args)).id,first.id);
  const history=value(await rpc('usage_egress_history',{month}));
  assert.equal(history.readings.length,1);assert.equal(history.uncachedGb,3.7);
  const web=await handler(new Request(root+'/egress-history?month='+month,{headers:{authorization:'Bearer synthetic-owner-session'}}));
  assert.equal((await web.json()).latest.id,first.id);
  assert.equal((await rpc('usage_egress_record',{...args,ownerId:owner})).body.error.code,-32602);
  assert.equal(value(await rpc('usage_egress_history',{month:'2020-01'})).alert,'UNKNOWN');
 });
 await t.test('DB write errors are surfaced and never returned as saved',async()=>{
  breakWrite=true;
  const r=await rpc('usage_log_before',{...before,eventId:crypto.randomUUID()});assert.equal(r.body.result.isError,true);
 });
 }finally{globalThis.fetch=realFetch;delete globalThis.Deno;}
});
