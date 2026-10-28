import test from 'node:test';
import assert from 'node:assert/strict';
import { ReadOnlySandboxAdapter, FiveRoleSandboxHarness, RoleContractError } from './role-adapter.mjs';

const check = (fn,code) => assert.throws(fn,e=>e instanceof RoleContractError && e.code===code);
function setup(options={}) {
 let count=0;
 let data={projectId:'P',value:7};
 const saved=new Map();
 const adapter=new ReadOnlySandboxAdapter({read_target:{readOnly:true,read:()=>{
   count++;
   if(options.flipOnSecondRead && count>=2)return {...data,value:8};
   return {...data};
 }}});
 const harness=new FiveRoleSandboxHarness({
   adapter,
   readContext:()=>({projectId:options.contextProject??'P',revision:2}),
   appendSandboxRecord:r=>{if(options.noWrite) return {};
     const recordId='record-'+r.requestId;
     saved.set(recordId,options.corruptWrite?{...r,recordId,authorApproved:true}:{...r,recordId});
     return {recordId};},
   readSandboxRecord:({recordId})=>options.noRead?null:saved.get(recordId)
 });
 const input={projectId:'P',taskId:'T',tool:'read_target',args:{},expected:{value:7},requestId:'R'};
 return {harness,input,getReads:()=>count,saved};
}

test('P3-01 successful five-role read, independent review, and sandbox handoff',()=>{
 const x=setup(),r=x.harness.run(x.input);
 assert.equal(r.status,'RECORDED');assert.equal(r.authorApproved,false);
 assert.deepEqual(r.receipts.map(z=>z.role),['Planner','Executor','Reviewer','Handover']);
 assert.equal(r.receipts[2].independentRead,true);
 assert.equal(r.receipts[3].sandboxReadback,true);assert.equal(x.getReads(),2);
});
test('P3-02 reviewer rejects source changing between independent reads',()=>{
 const x=setup({flipOnSecondRead:true}),r=x.harness.run(x.input);
 assert.equal(r.status,'NEEDS_OWNER');assert.deepEqual(r.defects,['SOURCE_CHANGED_BETWEEN_READS']);
 assert.equal(x.saved.size,0);assert.equal(x.getReads(),2);
});
test('P3-03 reviewer rejects mismatched acceptance criteria',()=>{
 const x=setup(),r=x.harness.run({...x.input,expected:{value:9}});
 assert.equal(r.status,'NEEDS_OWNER');assert.deepEqual(r.defects,['CRITERIA_MISMATCH']);
 assert.equal(r.receipts.at(-1).action,'PROPOSE_ONLY');assert.equal(x.saved.size,0);
});
test('P3-04 adapters refuse tools with write capability',()=>{
 check(()=>new ReadOnlySandboxAdapter({write:{readOnly:false,read:()=>({})}}),'WRITE_TOOL_DENIED');
});
test('P3-05 adapters refuse unknown tool even when caller attempts it',()=>{
 const x=setup();check(()=>x.harness.run({...x.input,tool:'phone_tap'}),'TOOL_NOT_ALLOWED');
});
test('P3-06 read-only adapter rejects cross-project arguments',()=>{
 const x=setup();check(()=>x.harness.run({...x.input,args:{projectId:'OTHER'}}),'WRONG_PROJECT');
});
test('P3-07 different project ID in returned source is rejected',()=>{
 const a=new ReadOnlySandboxAdapter({read_target:{readOnly:true,read:()=>({projectId:'OTHER',value:7})}});
 check(()=>a.read({tool:'read_target',projectId:'P'}),'WRONG_PROJECT');
});
test('P3-08 stale or wrong context rejected before execution',()=>{
 const x=setup({contextProject:'OTHER'});check(()=>x.harness.run(x.input),'STALE_CONTEXT');
 assert.equal(x.getReads(),0);
});
test('P3-09 L2/L3 roles cannot self-approve external operations',()=>{
 const x=setup();check(()=>x.harness.run({...x.input,riskTier:'L2'}),'APPROVAL_REQUIRED');
 check(()=>x.harness.run({...x.input,riskTier:'L3'}),'APPROVAL_REQUIRED');
 assert.equal(x.getReads(),0);
});
test('P3-10 paid API forbidden before any operation',()=>{
 const x=setup();check(()=>x.harness.run({...x.input,paidApi:true}),'APPROVAL_REQUIRED');
 assert.equal(x.getReads(),0);
});
test('P3-11 handoff write failure is not accepted as success',()=>{
 const x=setup({noWrite:true});check(()=>x.harness.run(x.input),'HANDOFF_WRITE_UNCONFIRMED');
});
test('P3-12 handoff requires actual readback',()=>{
 const x=setup({noRead:true});check(()=>x.harness.run(x.input),'HANDOFF_READBACK_MISSING');
});
test('P3-13 corrupted handoff author approval is detected',()=>{
 const x=setup({corruptWrite:true});check(()=>x.harness.run(x.input),'HANDOFF_READBACK_MISMATCH');
});
test('P3-14 an unknown project and empty requestId are refused',()=>{
 const x=setup();check(()=>x.harness.run({...x.input,projectId:''}),'INVALID_ID');
 check(()=>x.harness.run({...x.input,requestId:''}),'INVALID_ID');
});
