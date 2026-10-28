import test from 'node:test';
import assert from 'node:assert/strict';
import {WorkbenchReadOnlyBridge,WorkbenchReadError} from './workbench-readonly.mjs';

const P='61b88bec-9b3e-49e6-8780-d073fc816516';
const check=(fn,code)=>assert.rejects(fn,e=>e instanceof WorkbenchReadError && e.code===code);
function setup(opts={}) {
 const calls=[];let reads=0;
 const invoke=async(name,args)=>{
  calls.push({name,args});
  if(opts.failRead && name===opts.failRead)throw Error('private secret should never leak');
  if(opts.invalidJson && name==='get_project_context')return {text:'not JSON'};
  if(opts.error && name==='get_project_context')return {text:JSON.stringify({error:'private error'})};
  if(name==='list_projects')return {text:JSON.stringify([{projectId:P,revision:opts.listRevision??32}])};
  if(name==='get_project_context'){
   reads++;
   return {text:JSON.stringify({projectId:opts.wrongProject?'OTHER':P,revision:opts.revOnSecond && reads>=2?33:32,
     tasks:[{id:'t1',key:'task-1',status:'IN_PROGRESS'}],sources:[{snapshot:'SECRET'}]})};
  }
  if(name==='get_project_handoff')return {text:JSON.stringify({projectId:P,revision:opts.handoffRevision??32,unfinished:[],lastWork:{key:'handoff-1'},artifacts:[{url:'SECRET'}]})};
  throw Error('unapproved tool');
 };
 return {bridge:new WorkbenchReadOnlyBridge({invoke,allowedProjectIds:[P]}),calls};
}
test('P3-MCP-01 live-shaped MCP envelopes read and sanitize secrets',async()=>{
 const {bridge,calls}=setup();const r=await bridge.snapshot(P);
 assert.equal(r.projectId,P);assert.equal(r.revision,32);assert.equal(r.authorApproved,false);
 assert.equal(r.tasks.length,1);assert.equal(JSON.stringify(r).includes('SECRET'),false);
 assert.deepEqual(calls.map(x=>x.name),['list_projects','get_project_context','get_project_handoff']);
});
test('P3-MCP-02 reviewer makes independent fresh reads',async()=>{
 const {bridge,calls}=setup();const r=await bridge.snapshot(P);
 const v=await bridge.reviewFresh(r);assert.equal(v.result,'READBACK_MATCH');assert.equal(v.freshRead,true);
 assert.equal(calls.filter(x=>x.name==='get_project_context').length,2);
});
test('P3-MCP-03 rejects revision changed after planning',async()=>{
 const {bridge}=setup({revOnSecond:true});let r=await bridge.snapshot(P);
 await check(()=>bridge.reviewFresh(r),'REVISION_CHANGED');
});
test('P3-MCP-04 rejects listing/context revision mismatch',async()=>{
 const {bridge}=setup({listRevision:31});await check(()=>bridge.snapshot(P),'REVISION_CHANGED');
});
test('P3-MCP-05 rejects context/handoff revision mismatch',async()=>{
 const {bridge}=setup({handoffRevision:31});await check(()=>bridge.snapshot(P),'REVISION_CHANGED');
});
test('P3-MCP-06 rejects cross-project data even with correct tool name',async()=>{
 const {bridge}=setup({wrongProject:true});await check(()=>bridge.snapshot(P),'CROSS_PROJECT_RESULT');
});
test('P3-MCP-07 never calls MCP outside explicit owner-scoped project',async()=>{
 const {bridge,calls}=setup();await check(()=>bridge.snapshot('OTHER'),'PROJECT_NOT_ALLOWED');assert.equal(calls.length,0);
});
test('P3-MCP-08 fails closed when the MCP status returns an error',async()=>{
 const {bridge}=setup({error:true});await check(()=>bridge.snapshot(P),'MCP_READ_ERROR');
});
test('P3-MCP-09 fails closed on invalid JSON',async()=>{
 const {bridge}=setup({invalidJson:true});await check(()=>bridge.snapshot(P),'READ_JSON_INVALID');
});
test('P3-MCP-10 masks transport error details',async()=>{
 const {bridge}=setup({failRead:'get_project_context'});await check(()=>bridge.snapshot(P),'MCP_READ_ERROR');
});
test('P3-MCP-11 toolkit has only three read-only tools and cannot request writes',async()=>{
 const {bridge}=setup();assert.deepEqual(bridge.allowedTools(),['list_projects','get_project_context','get_project_handoff']);
 await check(()=>bridge._read('append_work_record',{}),'WRITE_TOOL_DENIED');
});
test('P3-MCP-12 handoff is local draft, not AI self-approved',async()=>{
 const {bridge}=setup();const r=await bridge.snapshot(P);const review=await bridge.reviewFresh(r);
 const draft=bridge.handoffDraft(r,review);assert.equal(draft.kind,'LOCAL_DRAFT_ONLY');
 assert.equal(draft.authorApproved,false);assert.equal(draft.status,'NOT_TESTED');
});
test('P3-MCP-13 forged review cannot authorize handoff',async()=>{
 const {bridge}=setup();const r=await bridge.snapshot(P);
 assert.throws(()=>bridge.handoffDraft(r,{projectId:P,revision:32,result:'PASS',freshRead:false}),e=>e.code==='HANDOFF_NOT_VERIFIED');
});
test('P3-MCP-14 untrusted source instructions not propagated in receipts',async()=>{
 const {bridge}=setup();const r=await bridge.snapshot(P);
 assert.equal(r.policy,'LIZHI-AI-BOOT/1.0.0');assert.equal(JSON.stringify(r).includes('snapshot'),false);
});
test('P3-MCP-15 audit records only IDs/revisions/hashes, not source content',async()=>{
 const {bridge}=setup();const r=await bridge.snapshot(P);await bridge.reviewFresh(r);
 assert.equal(bridge.audit.length,2);assert.equal(JSON.stringify(bridge.audit).includes('SECRET'),false);
});
