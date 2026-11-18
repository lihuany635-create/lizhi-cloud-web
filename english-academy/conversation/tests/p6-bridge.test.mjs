import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger,addCandidate} from '../ledger.mjs';
import {proposeExistingAcademySync} from '../p6-bridge.mjs';

const at='2026-11-15T13:00:00.000Z';
test('maps sentences to existing record_language_errors and words to create_card_candidates',()=>{
 let l=createLedger();
 l=addCandidate(l,{kind:'sentence',original:'She go home yesterday.',
  correction:'She went home yesterday.',meaning:'過去式 go 應改為 went',topic:'weekend'},{id:'test1',at});
 l=addCandidate(l,{kind:'word',original:'libary',correction:'library',
  meaning:'圖書館',topic:'weekend'},{id:'test2',at});
 const result=proposeExistingAcademySync(l);
 assert.equal(result.status,'proposal-only');
 assert.equal(result.websiteSessionVerified,false);
 assert.equal(result.userApprovedCards,false);
 assert.deepEqual(result.actions.map(a=>a.tool),['record_language_errors','create_card_candidates']);
 assert.deepEqual(result.actions[0].errors,[{
  original:'She go home yesterday.',corrected:'She went home yesterday.',explanation:'過去式 go 應改為 went'
 }]);
 assert.deepEqual(result.actions[1].candidates,[{term:'library',meaningZh:'圖書館'}]);
 assert.equal('accessToken' in result,false);
 assert.equal('ownerId' in result,false);
});
test('duplicate normalized terms do not produce duplicate pending website cards',()=>{
 let l=createLedger();
 l=addCandidate(l,{kind:'word',original:'libary',correction:'library',
  meaning:'圖書館'},{id:'test1',at});
 l=addCandidate(l,{kind:'word',original:'LIBARY',correction:'LIBRARY',
  meaning:'圖書館'},{id:'test2',at});
 assert.equal(proposeExistingAcademySync(l).actions[0].candidates.length,1);
});
test('cannot propose overlong P6 original text or empty meaning',()=>{
 let l=addCandidate(createLedger(),{kind:'sentence',original:'a'.repeat(600),
  correction:'b',meaning:'說明'},{id:'test1',at});
 assert.throws(()=>proposeExistingAcademySync(l),/too long/);
 l=addCandidate(createLedger(),{kind:'word',original:'wrong',
  correction:'correct',meaning:''},{id:'test2',at});
 assert.throws(()=>proposeExistingAcademySync(l),/meaning/);
});
test('proposal does not call network, write any storage or create official cards',()=>{
 const result=proposeExistingAcademySync(createLedger());
 assert.deepEqual(result.actions,[]);
 assert.equal(result.requiresTrustedOwnerAndSession,true);
 assert.equal(result.userApprovedCards,false);
});
