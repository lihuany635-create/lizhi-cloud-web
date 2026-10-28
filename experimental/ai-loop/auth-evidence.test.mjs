import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAuthTap,evidenceFor,AuthEvidenceError} from './auth-evidence.mjs';
const ids=Array.from({length:10},(_,i)=>'AUTH'+String(i+1).padStart(2,'0'));
const tap=(labels=ids,pass=labels.length)=>['TAP version 13',...labels.map((id,i)=>`ok ${i+1} - ${id} mock`),
 `1..${labels.length}`,`# tests ${labels.length}`,`# pass ${pass}`,'# fail 0','# cancelled 0','# skipped 0','# todo 0',''].join('\n');
const fails=(cb,code)=>assert.throws(cb,e=>e instanceof AuthEvidenceError&&e.code===code);
test('AUTH-EV01 all ten mock cases are covered but live authorization is NOT_TESTED',()=>{
 const e=evidenceFor({tap:tap(),source:'AUTH10 test fixtures',at:'2026-10-28T00:00:00Z'});
 assert.equal(e.result,'LOCAL_MOCK_PREFLIGHT_PASS');assert.equal(e.liveOwnerAuthorization,'NOT_TESTED');
 assert.equal(e.authenticOwnerConsent,'NOT_OBTAINED');assert.equal(e.coverage.AUTH10.liveServer,'NOT_TESTED');
 assert.equal(e.summary.pass,10);assert.equal(e.paidApiUsed,false);
});
test('AUTH-EV02 missing a mock case cannot produce a complete report',()=>{
 fails(()=>parseAuthTap(tap(ids.slice(0,9))),'TESTS_NOT_ALL_PASS');
});
test('AUTH-EV03 a false passing summary is refused',()=>{
 fails(()=>parseAuthTap(tap(ids,9)),'TESTS_NOT_ALL_PASS');
});
test('AUTH-EV04 duplicate case is not coverage',()=>{
 fails(()=>parseAuthTap(tap([...ids.slice(0,9),'AUTH09'])),'AUTH_COVERAGE_MISSING');
});
