import test from 'node:test';
import assert from 'node:assert/strict';
import {projectSourceResult,projectionReceipt,PROJECT,MAX_PROJECTED_BYTES} from './bounded-source-projection.mjs';
import {minimise} from '../../production/source/lib/ai-loop-v15.mjs';

const baseContext=()=>({projectId:PROJECT,revision:118,tasks:[
  {id:'task-1',key:'worker',status:'IN_PROGRESS',title:'PRIVATE TITLE',detail:'secret'}
],images:[{signedUrl:'SECRET_URL'}],records:[{summary:'PRIVATE'}]});
const baseHandoff=()=>({projectId:PROJECT,revision:118,unfinished:[{id:'task-1',title:'PRIVATE'}],
  lastWork:{key:'work-1',result:'PRIVATE'},artifacts:[{private:'SECRET'}]});
const bad=(cb,code)=>assert.throws(cb,e=>e?.code===code);

test('PROJ-01 >256KiB context becomes <64KiB safe allowlisted metadata BEFORE HTTP transport',()=>{
 const raw=baseContext();raw.records=[{secret:'PRIVATE'.repeat(100000)}];
 assert.ok(Buffer.byteLength(JSON.stringify(raw))>262144);
 const compact=projectSourceResult('get_project_context',raw);
 assert.ok(Buffer.byteLength(JSON.stringify(compact))<MAX_PROJECTED_BYTES);
 assert.deepEqual(compact,{projectId:PROJECT,revision:118,tasks:[{id:'task-1',key:'worker',status:'IN_PROGRESS'}]});
 assert.equal(JSON.stringify(compact).includes('PRIVATE'),false);
 assert.deepEqual(minimise('get_project_context',compact),compact);
});
test('PROJ-02 >256KiB handoff history becomes only bounded revision, last-work key and unfinished count',()=>{
 const raw=baseHandoff();raw.artifacts=[{text:'SECRET'.repeat(100000)}];
 assert.ok(Buffer.byteLength(JSON.stringify(raw))>262144);
 const result=projectSourceResult('get_project_handoff',raw);
 assert.deepEqual(result,{projectId:PROJECT,revision:118,lastWork:{key:'work-1'},unfinishedCount:1});
 assert.deepEqual(minimise('get_project_handoff',result),
   {projectId:PROJECT,revision:118,lastWorkKey:'work-1',unfinishedCount:1});
});
test('PROJ-03 list_projects keeps exactly one target and does not copy any other projects',()=>{
 const raw=[{projectId:'foreign',revision:3,title:'PRIVATE OTHER',token:'SECRET'},
  {projectId:PROJECT,revision:118,title:'PRIVATE TARGET'}];
 const res=projectSourceResult('list_projects',raw);
 assert.deepEqual(res,[{projectId:PROJECT,revision:118}]);
 assert.deepEqual(minimise('list_projects',res),res);
});
test('PROJ-04 no source-side project-scope override is allowed',()=>{
 bad(()=>projectSourceResult('get_project_context',baseContext(),{projectId:'foreign'}),'PROJECT_DENIED');
 bad(()=>projectSourceResult('get_project_handoff',{...baseHandoff(),projectId:'foreign'}),'SOURCE_SCOPE_INVALID');
 bad(()=>projectSourceResult('list_projects',[]),'SOURCE_SCOPE_INVALID');
});
test('PROJ-05 duplicate target or ambiguous project list fails closed',()=>{
 bad(()=>projectSourceResult('list_projects',[{projectId:PROJECT,revision:118},{projectId:PROJECT,revision:119}]),'SOURCE_SCOPE_INVALID');
});
test('PROJ-06 invalid revision and task status are rejected; never silently omit bad task',()=>{
 bad(()=>projectSourceResult('get_project_context',{...baseContext(),revision:NaN}),'SOURCE_PROJECTION_INVALID');
 bad(()=>projectSourceResult('get_project_context',{...baseContext(),tasks:[{id:'x',key:'y',status:'BOGUS'}]}),'SOURCE_PROJECTION_INVALID');
});
test('PROJ-07 duplicate task IDs rejected instead of silently dropping either task',()=>{
 const raw=baseContext();raw.tasks=[raw.tasks[0],{...raw.tasks[0],key:'different'}];
 bad(()=>projectSourceResult('get_project_context',raw),'SOURCE_PROJECTION_DUPLICATE_TASK');
});
test('PROJ-08 task count over 1000 rejects; no partial PASS summary',()=>{
 const raw=baseContext();raw.tasks=Array.from({length:1001},(_,i)=>({id:'t-'+i,key:'task-'+i,status:'PLANNED'}));
 bad(()=>projectSourceResult('get_project_context',raw),'SOURCE_PROJECTION_TOO_MANY_TASKS');
});
test('PROJ-09 byte limit is verified after allowlisting: many long identifiers fail closed',()=>{
 const raw=baseContext();raw.tasks=Array.from({length:450},(_,i)=>({
   id:('id-'+i).padEnd(127,'x'),key:('key-'+i).padEnd(127,'y'),status:'PASS'
 }));
 bad(()=>projectSourceResult('get_project_context',raw),'SOURCE_PROJECTION_TOO_LARGE');
});
test('PROJ-10 handoff unfinished count >1000 rejects instead of truncating',()=>{
 const raw=baseHandoff();raw.unfinished=Array.from({length:1001},()=>({private:'PRIVATE'}));
 bad(()=>projectSourceResult('get_project_handoff',raw),'SOURCE_PROJECTION_TOO_MANY_TASKS');
});
test('PROJ-11 projected handoff with two unfinished representations is rejected by host',()=>{
 const both={...baseHandoff(),unfinishedCount:1};
 bad(()=>minimise('get_project_handoff',both),'SOURCE_INVALID');
 const invalid={projectId:PROJECT,revision:118,lastWork:null,unfinishedCount:-1};
 bad(()=>minimise('get_project_handoff',invalid),'SOURCE_INVALID');
});
test('PROJ-12 receipt never claims source, live auth, deployment or true provider quota verification',()=>{
 const projection=projectSourceResult('get_project_context',baseContext());
 const report=projectionReceipt('get_project_context',projection);
 assert.equal(report.fullSourceVerified,false);
 assert.equal(report.liveBridgeInstalled,false);
 assert.equal(report.authorApproved,false);
 assert.equal(JSON.stringify(report).includes('PRIVATE'),false);
});
test('PROJ-13 unsupported or write tool cannot use projection',()=>{
 for(const tool of ['append_work_record','phone_tap','finance_create_transaction']){
  bad(()=>projectSourceResult(tool,baseContext()),'TOOL_DENIED');
 }
});
test('PROJ-14 fixed-size summary is stable across private field growth while revision drift remains visible',()=>{
 const a=baseContext(),b=baseContext();b.images=[{private:'X'.repeat(100000)}];
 assert.deepEqual(projectSourceResult('get_project_context',a),projectSourceResult('get_project_context',b));
 b.revision=119;
 assert.notDeepEqual(projectSourceResult('get_project_context',a),projectSourceResult('get_project_context',b));
});
