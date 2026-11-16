import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AI_USAGE_TOOLS,dispatchAiUsageMcp,stableUsageId} from '../supabase/functions/_shared/lizhi-usage-ai-mcp.mjs';
import {buildAiSideSnapshot} from '../supabase/functions/_shared/lizhi-ai-side-ledger.mjs';
const now=new Date('2026-11-16T04:00:00Z');
const b={eventId:'aa8a2ba4-b952-4604-984b-8c6d105f7092',at:'2026-11-16T03:00:00Z',service:'supabase',feature:'usage_monitor',taskLabel:'監控接線驗收',actionDetail:'核對監控服務狀態',operation:'edge_read',plannedCalls:2};
const a=({...extra}={})=>{const {at,plannedCalls,...meta}=b;return {...meta,completedAt:'2026-11-16T03:05:00Z',toolCalls:2,outcome:'success',...extra};};
function makeStore(initial=[]){
 const rows=[...initial];let serial=0;
 return {rows,
  async event(id){return rows.filter(r=>r.title.endsWith(' '+id)&&r.title.startsWith('AI_USAGE '));},
  async append(r){if(!rows.some(x=>x.id===r.id))rows.push({...r,created_at:new Date(now.getTime()+serial++).toISOString()});},
  async snapshot(month,exclude){return buildAiSideSnapshot({month,rows:rows.filter(r=>r.title.startsWith('AI_USAGE ')&&!r.title.endsWith(' '+exclude)),budgets:rows.filter(r=>r.title.startsWith('AI_USAGE_BUDGET '))});}
 };
}
const call=async(store,name,args={})=>dispatchAiUsageMcp({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}},{store,now});
const data=x=>{assert.equal(x.result?.isError,false,JSON.stringify(x));return JSON.parse(x.result.content[0].text);};
const budget=async(s,cap=10)=>data(await call(s,'usage_budget_set',{month:'2026-11',cap}));
test('nine tools advertise six reads and three writes',()=>{
 assert.equal(AI_USAGE_TOOLS.length,9);assert.deepEqual(AI_USAGE_TOOLS.filter(x=>!x.annotations.readOnlyHint).map(x=>x.name),['usage_log_before','usage_log_after','usage_budget_set']);
});
test('discovery and list expose nine tools',async()=>{
 for(const method of ['server/discover','tools/list']){
 const r=await dispatchAiUsageMcp({jsonrpc:'2.0',id:1,method},{now});
 if(method==='tools/list')assert.equal(r.result.tools.length,9);else assert.ok(r.result.supportedVersions.includes('2026-07-28'));
 }
});
test('before persists even when cap is unconfigured and holds optional work',async()=>{
 const s=makeStore();const r=data(await call(s,'usage_log_before',b));
 assert.equal(r.saved,true);assert.equal(r.verified,true);assert.equal(r.decision,'hold');assert.equal(r.budget.monthlyToolCap,null);assert.equal(s.rows.length,1);
});
test('all six reads use self registered data, including tasks and services',async()=>{
 const s=makeStore();await budget(s);assert.equal(data(await call(s,'usage_log_before',b)).decision,'allow');
 data(await call(s,'usage_log_after',a()));
 for(const name of AI_USAGE_TOOLS.slice(0,6).map(x=>x.name)){
 const r=data(await call(s,name));assert.ok(r.source==='ai_self_registered_operations');
 if(name==='usage_summary'){assert.equal(r.summary.assistantObservedToolCalls,2);assert.equal(r.officialCost,null);assert.equal(r.days[0].day,'2026-11-16');}
 if(name==='usage_services'){assert.equal(r.services[0].assistantObservedToolCalls,2);assert.equal(r.tasks[0].taskLabel,b.taskLabel);}
 }
});
test('identical before and after retry count once and never rewrite history',async()=>{
 const s=makeStore();await budget(s);await call(s,'usage_log_before',b);await call(s,'usage_log_before',b);
 await call(s,'usage_log_after',a());await call(s,'usage_log_after',a());
 assert.equal(s.rows.length,3);assert.equal(data(await call(s,'usage_summary')).summary.assistantObservedToolCalls,2);
 assert.equal(data(await call(s,'usage_log_before',b)).reason,'event_already_completed');
});
test('after fails without before; no fabricated pre-event is inserted',async()=>{
 const s=makeStore();assert.equal((await call(s,'usage_log_after',a())).result.isError,true);assert.equal(s.rows.length,0);
});
test('mismatched task or purpose and altered completed outcome are rejected',async()=>{
 const s=makeStore();await budget(s);await call(s,'usage_log_before',b);
 for(const changes of [{taskLabel:'另外的任務'},{feature:'another_feature'},{actionDetail:'不同操作目的'}])assert.equal((await call(s,'usage_log_after',a(changes))).result.isError,true);
 await call(s,'usage_log_after',a());assert.equal((await call(s,'usage_log_after',a({outcome:'failure'}))).result.isError,true);
 assert.equal(s.rows.length,3);
});
test('failed operation remains persisted and counted',async()=>{
 const s=makeStore();await budget(s);await call(s,'usage_log_before',b);data(await call(s,'usage_log_after',a({outcome:'failure',toolCalls:1})));
 const r=data(await call(s,'usage_summary'));assert.equal(r.summary.failures,1);assert.equal(r.summary.assistantObservedToolCalls,1);
});
test('unknown results and zero-call aborted work are preserved',async()=>{
 const s=makeStore();await call(s,'usage_log_before',b);data(await call(s,'usage_log_after',a({outcome:'unknown',toolCalls:0})));
 assert.equal(data(await call(s,'usage_summary')).summary.unknownResults,1);
});
test('cap is read back; reaching cap holds next optional event',async()=>{
 const s=makeStore();assert.equal((await budget(s,2)).monthlyToolCap,2);
 assert.equal(data(await call(s,'usage_log_before',b)).decision,'allow');await call(s,'usage_log_after',a());
 assert.equal(data(await call(s,'usage_alerts')).alert,'LIMIT_REACHED');
 assert.equal(data(await call(s,'usage_log_before',{...b,eventId:'ba8a2ba4-b952-4604-984b-8c6d105f7092'})).decision,'hold');
});
test('pending event holds another operation until after is saved',async()=>{
 const s=makeStore();await budget(s);
 assert.equal(data(await call(s,'usage_log_before',b)).decision,'allow');
 assert.equal(data(await call(s,'usage_log_before',{...b,eventId:'ba8a2ba4-b952-4604-984b-8c6d105f7092'})).decision,'hold');
});
test('concurrent distinct plans cannot both be admitted when only one fits',async()=>{
 const s=makeStore();await budget(s,2);
 const results=await Promise.all([b,{...b,eventId:'ba8a2ba4-b952-4604-984b-8c6d105f7092'}].map(x=>call(s,'usage_log_before',x)));
 assert.ok(results.map(data).filter(x=>x.decision==='allow').length<=1);
});
test('write and readback failures return explicit error and never claim success',async()=>{
 for(const mode of ['write','read']){
 const s=makeStore();if(mode==='write')s.append=async()=>{throw new Error('private credential');};else s.event=async()=>[];
 const r=await call(s,'usage_log_before',b);assert.equal(r.result.isError,true);assert.doesNotMatch(JSON.stringify(r),/private credential/);
 }
});
test('raw SQL, secrets, query-string evidence and client owner claims are rejected',async()=>{
 const s=makeStore();
 for(const changes of [{actionDetail:'select * from users'},{taskLabel:'password value'},{ownerId:'claimed'},{plannedCalls:0},{eventId:'no'}]){
 const r=await call(s,'usage_log_before',{...b,...changes});assert.ok(r.error||r.result.isError);
 }
 await call(s,'usage_log_before',b);
 assert.equal((await call(s,'usage_log_after',a({evidenceUrl:'https://github.com/x/y?token=hidden'}))).result.isError,true);
});
test('invalid budget values never write',async()=>{
 const s=makeStore();for(const cap of [0,-1,1.2,'10',1000001])assert.equal((await call(s,'usage_budget_set',{month:'2026-11',cap})).error.code,-32602);
 assert.equal(s.rows.length,0);
});
test('future timestamps and historical backfills never authorize fresh work',async()=>{
 const s=makeStore();await budget(s);assert.equal((await call(s,'usage_log_before',{...b,at:'2027-11-16T00:00:00Z'})).result.isError,true);
 const r=data(await call(s,'usage_log_before',{...b,at:'2026-10-16T00:00:00Z'}));assert.equal(r.decision,'hold');assert.equal(r.reason,'historical_backfill_only');
});
test('event lookup returns both phases and planned/actual calls',async()=>{
 const s=makeStore();await budget(s);await call(s,'usage_log_before',b);await call(s,'usage_log_after',a());
 const rows=data(await call(s,'usage_events',{eventId:b.eventId})).records;
 assert.equal(rows.length,2);assert.equal(rows[0].plannedCalls,2);assert.equal(rows[1].completedAt,a().completedAt);
 assert.equal(rows[0].officialCost,null);
});
test('restart with a durable file reload preserves counts and replay identity',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'usage-ai-'));const file=join(dir,'rows.json');
 try{
 const s=makeStore();await budget(s);await call(s,'usage_log_before',b);await call(s,'usage_log_after',a());
 await writeFile(file,JSON.stringify(s.rows));const reopened=makeStore(JSON.parse(await readFile(file,'utf8')));
 await call(reopened,'usage_log_after',a());assert.equal(reopened.rows.length,3);assert.equal(data(await call(reopened,'usage_summary')).summary.assistantObservedToolCalls,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('deterministic UUID is stable and phase-specific',async()=>{
 assert.equal(await stableUsageId('a:before'),await stableUsageId('a:before'));assert.notEqual(await stableUsageId('a:before'),await stableUsageId('a:after'));
});
