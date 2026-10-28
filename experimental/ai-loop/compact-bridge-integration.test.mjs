/**
 * v2.2 isolated simulation. Exercises production compact adapter + host fetch,
 * but NOT a deployed Supabase Edge, trusted Site principal, or actual D1.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compactOwnedProjectOperation,COMPACT_OPS,PROJECT,MAX_PROJECTED_BYTES} from '../../production/source/lib/ai-loop-compact.mjs';
import {projectSourceResult} from './bounded-source-projection.mjs';
import {bridgeSource,minimise} from '../../production/source/lib/ai-loop-v15.mjs';

const BASE='https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production';
const project=(more={})=>({
 id:PROJECT,revision:123,
 managedTasks:[{id:'task-1',key:'auth',status:'IN_PROGRESS',title:'PRIVATE',other:'SECRET'}],
 records:[{key:'last-work',result:'PRIVATE'}],
 artifacts:[{raw:'SECRET'}],
 ...more
});
const invalid=(fn,code)=>assert.throws(fn,e=>e?.code===code);
const options=(extra={})=>({PRODUCTION_BRIDGE_URL:BASE,
 PRODUCTION_BRIDGE_KEY:'TEST_ONLY_NOT_A_REAL_SECRET',
 AI_LOOP_COMPACT_SOURCE_MODE:'verified-v1',...extra});

test('CB-01 source-side compact context returns only exact fields, even with >256KiB private history',()=>{
 const p=project({artifacts:[{private:'SECRET'.repeat(60000)}]});
 assert.ok(Buffer.byteLength(JSON.stringify(p))>262144);
 const out=compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],p);
 assert.ok(Buffer.byteLength(JSON.stringify(out))<MAX_PROJECTED_BYTES);
 assert.deepEqual(out,{projectId:PROJECT,revision:123,tasks:[{id:'task-1',key:'auth',status:'IN_PROGRESS'}]});
 assert.ok(!JSON.stringify(out).includes('PRIVATE'));
 assert.deepEqual(minimise('get_project_context',out),out);
});
test('CB-02 handoff compact retains all unfinished count and latest work key without sensitive data',()=>{
 const p=project({records:[{key:'last-work',content:'SECRET'.repeat(90000)}]});
 assert.ok(Buffer.byteLength(JSON.stringify(p))>262144);
 const out=compactOwnedProjectOperation('getProjectHandoffCompactV1',[PROJECT],p);
 assert.deepEqual(out,{projectId:PROJECT,revision:123,lastWork:{key:'last-work'},unfinishedCount:1});
 assert.deepEqual(minimise('get_project_handoff',out),
   {projectId:PROJECT,revision:123,lastWorkKey:'last-work',unfinishedCount:1});
});
test('CB-03 compact list never lists other projects',()=>{
 assert.deepEqual(compactOwnedProjectOperation('listManagedProjectsCompactV1',[],project()),[{projectId:PROJECT,revision:123}]);
});
test('CB-04 invalid op, extra arg, foreign project and undefined request all fail closed',()=>{
 const p=project();
 invalid(()=>compactOwnedProjectOperation('appendWorkRecord',[],p),'TOOL_DENIED');
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',[],p),'INVALID_COMPACT_ARGS');
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT,'extra'],p),'INVALID_COMPACT_ARGS');
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',['foreign'],p),'PROJECT_DENIED');
 invalid(()=>compactOwnedProjectOperation('listManagedProjectsCompactV1',[PROJECT],p),'INVALID_COMPACT_ARGS');
 invalid(()=>compactOwnedProjectOperation('listManagedProjectsCompactV1',null,p),'INVALID_COMPACT_ARGS');
});
test('CB-05 server-owned project object must already be scoped to target',()=>{
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],project({id:'foreign'})),'SOURCE_SCOPE_INVALID');
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],project({revision:NaN})),'SOURCE_PROJECTION_INVALID');
});
test('CB-06 >1000 tasks never returns a truncated success',()=>{
 const tasks=Array.from({length:1001},(_,i)=>({id:'id-'+i,key:'key-'+i,status:'PASS'}));
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],project({managedTasks:tasks})),'SOURCE_PROJECTION_TOO_MANY_TASKS');
});
test('CB-07 many long task IDs fail 64KiB projected byte bound',()=>{
 const tasks=Array.from({length:500},(_,i)=>({id:('id'+i).padEnd(120,'x'),key:('key'+i).padEnd(120,'y'),status:'PASS'}));
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],project({managedTasks:tasks})),'SOURCE_PROJECTION_TOO_LARGE');
});
test('CB-08 duplicate or invalid task data rejects without silently dropping item',()=>{
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],project({managedTasks:[
  {id:'same',key:'first',status:'PASS'},{id:'same',key:'second',status:'PASS'}]})),'SOURCE_PROJECTION_DUPLICATE_TASK');
 invalid(()=>compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],project({managedTasks:[
  {id:'id1',key:'key1',status:'INVALID'}]})),'SOURCE_PROJECTION_INVALID');
});
test('CB-09 compact mode fetches new versioned operations and no legacy fallback',async()=>{
 const seen=[];
 const adapter=bridgeSource(options(),async(url,request)=>{
  const {op,args}=JSON.parse(request.body);
  seen.push(op);
  assert.equal(url,BASE+'/bridge');
  assert.equal(request.redirect,'manual');
  assert.ok(Object.hasOwn(COMPACT_OPS,op));
  return Response.json(compactOwnedProjectOperation(op,args,project()));
 });
 const signal=AbortSignal.timeout(5000);
 const list=await adapter('list_projects',{},signal);
 const context=await adapter('get_project_context',{projectId:PROJECT},signal);
 const handoff=await adapter('get_project_handoff',{projectId:PROJECT},signal);
 assert.deepEqual(seen,['listManagedProjectsCompactV1','getProjectContextCompactV1','getProjectHandoffCompactV1']);
 assert.equal(minimise('get_project_context',context).tasks.length,1);
 assert.equal(minimise('get_project_handoff',handoff).unfinishedCount,1);
 assert.deepEqual(list,[{projectId:PROJECT,revision:123}]);
});
test('CB-10 legacy Bridge calls unchanged without compact mode',async()=>{
 let op=null;
 const adapter=bridgeSource(options({AI_LOOP_COMPACT_SOURCE_MODE:undefined}),async(_url,req)=>{
  op=JSON.parse(req.body).op;return Response.json([{projectId:PROJECT,revision:123}]);
 });
 await adapter('list_projects',{},AbortSignal.timeout(5000));
 assert.equal(op,'listManagedProjects');
});
test('CB-11 unknown mode is blocked before Bridge calls; compact 404 never retries legacy',async()=>{
 assert.throws(()=>bridgeSource(options({AI_LOOP_COMPACT_SOURCE_MODE:'auto'})),e=>e.code==='SOURCE_MODE_UNVERIFIED');
 let calls=0;
 const adapter=bridgeSource(options(),async()=>{calls++;return new Response('not found',{status:404});});
 await assert.rejects(()=>adapter('get_project_context',{projectId:PROJECT},AbortSignal.timeout(5000)),
  e=>e.code==='SOURCE_UNAVAILABLE');
 assert.equal(calls,1);
});
test('CB-12 list/context/handoff compact projections preserve same source revision',()=>{
 const p=project(),outputs=[
  compactOwnedProjectOperation('listManagedProjectsCompactV1',[],p)[0],
  compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],p),
  compactOwnedProjectOperation('getProjectHandoffCompactV1',[PROJECT],p)
 ];
 assert.ok(outputs.every(x=>x.revision===123));
 p.revision=124;
 assert.ok(outputs.every(x=>x.revision!==compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],p).revision));
});
test('CB-13 production projector retains v2.1 reference semantics on safe input',()=>{
 const p=project();
 assert.deepEqual(compactOwnedProjectOperation('getProjectContextCompactV1',[PROJECT],p),
 projectSourceResult('get_project_context',{projectId:PROJECT,revision:123,tasks:p.managedTasks}));
});
test('CB-14 versioned Bridge handler branch is owner scoped and separate from legacy operate path (static review)',()=>{
 const backend=readFileSync(new URL('../../production/source/backend/index.ts',import.meta.url),'utf8');
 const check=backend.indexOf("if(part==='bridge'&&Object.hasOwn(COMPACT_OPS,op))");
 const ownerScope=backend.indexOf("const existing=await db('lizhi_production_state?owner_id=eq.'");
 const bridgeAuth=backend.indexOf("if(!isBridge)throw new FlowError");
 const oldOperate=backend.indexOf("const next=operate(record.data as State,op,args,actor)");
 assert.ok(check>ownerScope&&ownerScope>bridgeAuth,'compact branch must be AFTER key and owner-scoped state');
 assert.ok(oldOperate>check,'legacy operation remains a separate path');
 assert.ok(backend.includes("managedOf(record.data as State,AI_LOOP_PROJECT)"));
 assert.ok(!backend.includes('AI_LOOP_COMPACT_BYPASS_KEY'));
});
