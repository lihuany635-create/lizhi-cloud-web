import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTap,createEvidence,runSuite,EvidenceError} from './acceptance-evidence.mjs';
const coverage=['AT01','AT02','AT03','AT04','AT05','AT06','AT07','AT08','AT09','AT10'];
const companion=['INT-01','P2-03','INT-02','INT-03','INT-12','INT-10','P3-HTTP-05','INT-15','INT-14','P3-MCP-07'];
const tap=(ids=[...coverage,...companion],changes={})=>[
'TAP version 13',...ids.map((id,i)=>`ok ${i+1} - ${id} synthetic sandbox evidence`),
'1..'+ids.length,'# tests '+(changes.tests??ids.length),'# suites 0',
'# pass '+(changes.pass??ids.length),'# fail '+(changes.fail??0),
'# cancelled '+(changes.cancelled??0),'# skipped '+(changes.skipped??0),'# todo '+(changes.todo??0),''].join('\n');
const expect=(fn,code)=>assert.throws(fn,e=>e instanceof EvidenceError&&e.code===code);
test('P5-01 parse full TAP coverage including independent companion evidence',()=>{
 const r=parseTap(tap());assert.equal(Object.keys(r.coverage).length,10);assert.equal(r.summary.tests,20);
 assert(r.coverage.AT05.references.includes('INT-12'));
});
test('P5-02 reject omitted direct AT case',()=>expect(()=>parseTap(tap([...coverage.filter(x=>x!=='AT09'),...companion])),'MISSING_AT09'));
test('P5-03 reject omitted companion evidence',()=>expect(()=>parseTap(tap([...coverage,...companion.filter(x=>x!=='P3-HTTP-05')])),'MISSING_AT07'));
test('P5-04 reject failing test with zero status assumptions',()=>expect(()=>parseTap(tap(undefined,{fail:1,pass:19})),'TESTS_NOT_PASS'));
test('P5-05 reject skipped or cancelled tests',()=>expect(()=>parseTap(tap(undefined,{skipped:1})),'TESTS_NOT_PASS'));
test('P5-06 reject malformed or incomplete summary',()=>expect(()=>parseTap('TAP version 13\nok 1 - AT01 test\n# tests 1'),'TAP_INCOMPLETE'));
test('P5-07 reject incorrect test count',()=>expect(()=>parseTap(tap(undefined,{tests:19,pass:19})),'TAP_CASE_COUNT_MISMATCH'));
test('P5-08 reject duplicate summary',()=>expect(()=>parseTap(tap()+'# pass 20\n'),'DUPLICATE_SUMMARY'));
test('P5-09 invalid directory prevents running arbitrary commands',()=>expect(()=>runSuite({dir:'/tmp'}),'DIRECTORY_NOT_ALLOWLISTED'));
test('P5-10 evidence minimum baseline required, no false E2E PASS',()=>{
 const files={'durable-queue.mjs':'a','durable-review-integration.mjs':'b','workbench-readonly.mjs':'c'};
 expect(()=>createEvidence({tap:tap(),files}),'BASELINE_REGRESSION');
});
test('P5-11 no target source means evidence incomplete',()=>{
 const ids=[...coverage,...companion];const long=[...ids,...Array.from({length:100},(_,i)=>`MOCK-${i}`)];
 expect(()=>createEvidence({tap:tap(long),files:{'durable-queue.mjs':'x'}}),'SOURCES_MISSING');
});
test('P5-12 correct synthetic baseline still labels real E2E NOT_TESTED',()=>{
 const ids=[...coverage,...companion,...Array.from({length:100},(_,i)=>`MOCK-${i}`)];
 const files={'durable-queue.mjs':'a','durable-review-integration.mjs':'b','workbench-readonly.mjs':'c'};
 const e=createEvidence({tap:tap(ids),files,at:'2026-10-28T00:00:00Z'});
 assert.equal(e.result,'SANDBOX_PASS');assert.equal(e.liveE2e,'NOT_TESTED');
 assert.equal(e.ownerApproval,'NOT_OBTAINED');assert.equal(e.boundaries.workbenchWrite,false);
 assert.equal(e.sources.length,3);assert.equal(e.boundaries.networkUse,'NOT_INSTRUMENTED');assert.match(e.tapSha256,/^[0-9a-f]{64}$/);
});
