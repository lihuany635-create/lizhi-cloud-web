// Run with Node >=24. Exercises real route + Edge handlers with an isolated REST fixture.
// No production keys, requests, data, or database writes are used.
import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {randomUUID, createHash} from 'node:crypto';
const source = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const moduleURL = s => 'data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(s,{mode:'transform'})).toString('base64');
const OWNER='11111111-1111-4111-8111-111111111111', OTHER='22222222-2222-4222-8222-222222222222';
const ACTOR='fixture-site-owner', KEY='lzp_local_fixture_only', AGENTKEY='lza_local_fixture_only';
const hash=s=>createHash('sha256').update(s).digest('hex');
const tables={lizhi_production_ai_keys:[{owner_id:OWNER,chatgpt_owner:ACTOR,key_hash:hash(KEY)}],aiwb_agent_keys:[{id:randomUUID(),owner_id:OWNER,agent:'Codex',key_hash:hash(AGENTKEY),revoked_at:null}]};
for(const t of ['projects','tasks','checks','reports','notices','events','side_logs','side_todos']) tables['aiwb_'+t]=[];
const saved={fetch:globalThis.fetch,Deno:globalThis.Deno};
const env={PRODUCTION_BRIDGE_KEY:KEY,PRODUCTION_CHATGPT_OWNER:ACTOR};
globalThis.__aiwbEnv=env;
const calls=[];
function defaults(table,row){
 const base={id:randomUUID(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...row};
 if(table==='aiwb_projects')return {archived:false,task_seq:0,...base};
 if(table==='aiwb_tasks')return {status:'todo',needs_approval:false,approved_at:null,...base};
 if(table==='aiwb_checks')return {checked:false,...base};
 if(table==='aiwb_notices')return {status:'sent',...base};
 if(table==='aiwb_side_logs')return {project:'其他',links:[],done:'',evidence:'',not_done:'',next_step:'',...base};
 return base;
}
function fixtureREST(url,init){
 const u=new URL(url); const table=decodeURIComponent(u.pathname.split('/').at(-1));
 const method=init.method??'GET';const body=init.body?JSON.parse(init.body):undefined;
 if(table==='aiwb_next_task_code'){
  const p=tables.aiwb_projects.find(p=>p.id===body.p_project&&p.owner_id===body.p_owner&&!p.archived);assert.ok(p);
  return Response.json('TASK-'+String(++p.task_seq).padStart(3,'0'));
 }
 assert.ok(tables[table], 'Unexpected fixture table '+table);
 let selected=tables[table].filter(row=>[...u.searchParams].every(([key,value])=>{
  if(['select','limit','order','offset'].includes(key))return true;
  const at=value.indexOf('.'),op=value.slice(0,at),v=value.slice(at+1);
  if(op==='eq')return String(row[key])===v;
  if(op==='neq')return String(row[key])!==v;
  if(op==='is')return v==='null'&&row[key]==null;
  if(op==='in')return v.slice(1,-1).split(',').includes(String(row[key]));
  throw Error('Unsupported fixture operator '+value);
 }));
 if(method==='POST'){
  const rows=(Array.isArray(body)?body:[body]).map(row=>defaults(table,row));tables[table].push(...rows);return Response.json(rows);
 }
 if(method==='PATCH'){selected.forEach(r=>Object.assign(r,body));return Response.json(selected);}
 if(method==='DELETE'){tables[table]=tables[table].filter(r=>!selected.includes(r));return new Response(null,{status:204});}
 for(const order of (u.searchParams.get('order')??'').split(',').reverse())if(order){const [key,dir]=order.split('.');selected.sort((a,b)=>String(a[key]??'').localeCompare(String(b[key]??''))*(dir==='desc'?-1:1));}
 const limit=Number(u.searchParams.get('limit')??10000);return Response.json(selected.slice(0,limit));
}
let edgeHandler;
globalThis.Deno={env:{get:k=>k==='SUPABASE_URL'?'https://fixture.invalid':k==='SUPABASE_SERVICE_ROLE_KEY'?'local-service-fixture':undefined},serve:fn=>{edgeHandler=fn;}};
const side=moduleURL(source('supabase/functions/lizhi-ai-workbench/side.ts'));
await import(moduleURL(source('supabase/functions/lizhi-ai-workbench/index.ts').replace('import "jsr:@supabase/functions-js/edge-runtime.d.ts";','').replace('"./side.ts"',JSON.stringify(side))));
let legacyFailure=false;
const photos=['list_projects','get_project','create_project','list_project_images','read_project_image','import_project_image','update_project_image'];
globalThis.__aiwbLegacy=async req=>{const b=await req.json();if(legacyFailure)throw Error('legacy unavailable');return Response.json({jsonrpc:'2.0',id:b.id,result:b.method==='tools/list'?{tools:[...photos,'old_tool'].map(name=>({name,inputSchema:{type:'object'}}))}:{content:[{type:'text',text:'photo fixture'}]}});};
const routeSrc=source('sites-migration/ai-workbench/route.ts').replace("import {env} from 'cloudflare:workers';","const env=globalThis.__aiwbEnv;").replace("import {identity} from '@/lib/store';",`const identity = req => { const id=req.headers.get('oai-authenticated-user-id'); if(!id||!req.headers.get('oai-authenticated-user-email')) throw Error('missing identity'); return {id}; };`).replace("import {POST as legacyPOST} from './legacy-route';","const legacyPOST=globalThis.__aiwbLegacy;");
const {POST}=await import(moduleURL(routeSrc));
globalThis.fetch=async(url,init={})=>{
 const u=new URL(typeof url==='string'?url:url.url);calls.push({url:u.href,method:init.method??'GET'});
 if(u.hostname==='hrdzywkihfqggiwjgavi.supabase.co')return edgeHandler(new Request(u,init));
 if(u.hostname==='fixture.invalid'&&u.pathname.startsWith('/rest/v1/'))return fixtureREST(u.href,init);
 if(u.hostname==='fixture.invalid'&&u.pathname==='/auth/v1/user'){
  const token=new Headers(init.headers).get('authorization');
  return ['Bearer fixture-owner-jwt','Bearer fixture-other-jwt'].includes(token)?Response.json({id:token.includes('other')?OTHER:OWNER,email:'fixture@example.invalid'}):Response.json({error:'invalid'},{status:401});
 }
 throw Error('Unexpected network request '+u.href);
};
after(()=>{globalThis.fetch=saved.fetch;globalThis.Deno=saved.Deno;delete globalThis.__aiwbEnv;delete globalThis.__aiwbLegacy;});
let rpcId=0;
async function rpc(method,params={},actor=ACTOR){
 const headers={'Content-Type':'application/json'};if(actor){headers['oai-authenticated-user-id']=actor;headers['oai-authenticated-user-email']='fixture@example.invalid';}
 const res=await POST(new Request('https://private-site.invalid/mcp',{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:++rpcId,method,params})}));return res.json();
}
async function call(name,args={},role='manager'){return (await rpc('tools/call',{name,arguments:{role,agent:'Codex',...args}})).result;}
const ok=r=>{assert.notEqual(r?.isError,true,JSON.stringify(r));return r.structuredContent;};
const fail=(r,pattern)=>{assert.equal(r?.isError,true);assert.match(r.content[0].text,pattern);};
async function web(part,token='fixture-owner-jwt',method='GET',body){const r=await edgeHandler(new Request('https://fixture.invalid/'+part,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));return {status:r.status,body:await r.json()};}

test('discovery, initialize and complete dynamic catalogue preserve 17 workbench + 10 licut + 7 photo tools',async()=>{
 assert.deepEqual((await rpc('server/discover')).result.supportedVersions,['2026-07-28']);
 assert.match((await rpc('initialize',{protocolVersion:'2025-03-26'})).result.instructions,/三角色/);
 const result=await rpc('tools/list');assert.ok(!result.error);const names=result.result.tools.map(t=>t.name);
 assert.equal(names.length,34);assert.equal(new Set(names).size,34);
 assert.equal(names.filter(n=>n.startsWith('aiwb_')).length,10);assert.equal(names.filter(n=>n.startsWith('side_')).length,7);assert.equal(names.filter(n=>n.startsWith('licut_')).length,10);
 assert.ok(!names.includes('old_tool'));
});
test('missing and different Site identities cannot call Edge or photo tools',async()=>{
 for(const actor of [null,'different-user'])for(const name of ['aiwb_overview','side_log_save','list_projects']){const n=calls.length;const r=await rpc('tools/call',{name,arguments:{role:'manager'}},actor);assert.equal(r.result.isError,true);assert.equal(calls.length,n);}
});
test('discovery errors are protocol errors, never a successful empty catalogue; secrets never returned',async()=>{
 const key=env.PRODUCTION_BRIDGE_KEY;delete env.PRODUCTION_BRIDGE_KEY;
 const r=await rpc('tools/list');assert.ok(r.error);assert.ok(!r.result);env.PRODUCTION_BRIDGE_KEY=key;
 legacyFailure=true;assert.ok((await rpc('tools/list')).error);legacyFailure=false;
 const malformed=await POST(new Request('https://site.invalid/mcp',{method:'POST',body:'{'}));assert.equal((await malformed.json()).error.code,-32700);
 assert.equal((await rpc('unknown')).error.code,-32601);
});

test('all 17 tools: isolated task, evidence, report, notification and side-record lifecycle with web readback',async()=>{
 const first=ok(await call('aiwb_overview'));assert.deepEqual(first.projects,[]);
 const p=ok(await call('aiwb_save_project',{title:'【測試】MCP isolated fixture',goal:'development only'}));
 const created=ok(await call('aiwb_create_task',{project_id:p.id,title:'驗證任務',assignee:'engineer',checks:['fixture evidence only'],needs_approval:true,approval_reason:'approval guard test'}));
 const t=created.task;assert.equal(t.code,'TASK-001');
 assert.equal(ok(await call('aiwb_list_tasks',{project_id:p.id})).tasks[0].id,t.id);
 assert.equal(ok(await call('aiwb_get_task',{task_id:t.id})).checks.length,1);
 assert.equal(ok(await call('aiwb_update_task',{task_id:t.id,status:'doing'},'engineer')).task.status,'doing');
 fail(await call('aiwb_tick_check',{check_id:created.checks[0].id,checked:true},'engineer'),/evidence_url/);
 ok(await call('aiwb_tick_check',{check_id:created.checks[0].id,checked:true,evidence_url:'https://example.invalid/fixture-evidence'},'engineer'));
 const rep=ok(await call('aiwb_attach_report',{task_id:t.id,kind:'execution',title:'fixture report',url:'https://example.invalid/fixture-report'},'engineer'));
 const n=ok(await call('aiwb_notify',{task_id:t.id,to_role:'advisor',report_id:rep.id,next_step:'read fixture report',dedupe_key:'fixture-notice'}));
 assert.equal(ok(await call('aiwb_notify',{task_id:t.id,to_role:'advisor',next_step:'duplicate',dedupe_key:'fixture-notice'})).duplicate,true);
 assert.equal(ok(await call('aiwb_inbox',{ack_ids:[n.notice.id]},'engineer')).acknowledged,0);
 assert.equal(ok(await call('aiwb_inbox',{},'advisor')).notices[0].report.id,rep.id);
 assert.equal(ok(await call('aiwb_inbox',{ack_ids:[n.notice.id]},'advisor')).acknowledged,1);
 fail(await call('aiwb_save_project',{title:'forbidden'},'advisor'),/只有專案經理/);
 fail(await call('aiwb_create_task',{project_id:p.id,title:'forbidden',assignee:'engineer'},'engineer'),/只有專案經理/);
 fail(await call('aiwb_attach_report',{task_id:t.id,kind:'acceptance',title:'forbidden',url:'https://example.invalid/fixture'},'engineer'),/專案經理/);
 fail(await call('aiwb_update_task',{task_id:t.id,status:'done'},'engineer'),/專案經理/);
 ok(await call('aiwb_attach_report',{task_id:t.id,kind:'acceptance',title:'fixture acceptance',url:'https://example.invalid/fixture-acceptance'}));
 fail(await call('aiwb_update_task',{task_id:t.id,status:'done'}),/本人/);
 fail(await call('aiwb_update_task',{task_id:t.id,needs_approval:false,status:'done'}),/本人批准/);
 fail(await call('aiwb_update_task',{task_id:t.id,needs_approval:'false',status:'done'}),/boolean|true|false/);
 assert.equal(ok(await call('aiwb_get_task',{task_id:t.id})).task.needs_approval,true);
 // The model/tool context has no owner approval operation. Only web fixture JWT may approve.
 assert.equal((await web('approve',KEY,'POST',{task_id:t.id,approve:true})).status,403);
 assert.equal((await web('approve','fixture-owner-jwt','POST',{task_id:t.id,approve:true})).status,200);
 ok(await call('aiwb_update_task',{task_id:t.id,status:'done'}));
 fail(await call('aiwb_tick_check',{check_id:created.checks[0].id,checked:false},'engineer'),/已完成/);
 const detail=ok(await call('aiwb_get_task',{task_id:t.id}));
 assert.deepEqual((await web('task?id='+t.id)).body,detail);
 const board=(await web('board')).body.tasks.find(x=>x.id===t.id);assert.equal(board.status,'done');assert.equal(board.checks_done,1);assert.equal(board.reports,2);
 const log=ok(await call('side_log_save',{project:'工作台',title:'fixture log',done:'local fixture',evidence:'PASS isolated only'})).log;
 assert.equal(ok(await call('side_log_list',{project:'工作台'})).logs[0].id,log.id);
 ok(await call('side_log_save',{id:log.id,title:'updated fixture log'}));
 const todo=ok(await call('side_todo_save',{project:'工作台',title:'fixture todo',checks:['fixture check']})).todo;
 ok(await call('side_todo_tick',{id:todo.id,index:0,done:true}));
 ok(await call('side_todo_save',{id:todo.id,status:'done'}));
 assert.equal(ok(await call('side_todo_list',{include_done:true})).todos[0].checks_done,1);
 const overview=ok(await call('side_overview',{project:'工作台'}));assert.equal(overview.logs[0].title,'updated fixture log');assert.equal(overview.done_todos[0].id,todo.id);
 assert.deepEqual((await web('side')).body.logs,overview.logs);
 assert.deepEqual((await web('board','fixture-other-jwt')).body.tasks,[]);
 assert.equal((await web('task?id='+t.id,'fixture-other-jwt')).status,404);
 fail(await call('side_log_save',{id:randomUUID(),title:'missing'}),/找不到/);
 // Delete only newly created local fixture records; never existing production test data.
 ok(await call('side_delete',{kind:'log',id:log.id}));ok(await call('side_delete',{kind:'todo',id:todo.id}));
 assert.deepEqual(ok(await call('side_log_list')).logs,[]);
});

test('Edge rejects no token, invalid key, wrong actor, browser origin; agent keys cannot reach role tools',async()=>{
 for(const [headers,status] of [[{},401],[{Authorization:'Bearer lzp_bad','x-lizhi-actor':ACTOR},401],[{Authorization:'Bearer '+KEY,'x-lizhi-actor':'other'},403],[{Authorization:'Bearer '+KEY,'x-lizhi-actor':ACTOR,Origin:'https://evil.invalid'},403]]){
  const r=await edgeHandler(new Request('https://fixture.invalid/mcp',{method:'POST',headers,body:JSON.stringify({method:'tools/list'})}));assert.equal(r.status,status);
 }
 const send=async body=>(await edgeHandler(new Request('https://fixture.invalid/agent-mcp',{method:'POST',headers:{Authorization:'Bearer '+AGENTKEY},body:JSON.stringify(body)}))).json();
 assert.equal((await send({method:'tools/list'})).result.tools.length,7);
 fail((await send({method:'tools/call',params:{name:'aiwb_overview',arguments:{role:'manager'}}})).result,/只能/);
});
