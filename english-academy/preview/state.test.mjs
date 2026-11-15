import test from 'node:test';
import assert from 'node:assert/strict';
import {initialDemoState,candidateDecision,addExplicitDemoCard,recordDemoPractice,getDemoSummary,normalizeTerm} from './state.mjs';

test('starts as explicitly unassessed demo profile',()=>{
 const s=initialDemoState();
 assert.equal(s.isDemo,true); assert.equal(s.stage,null); assert.equal(getDemoSummary(s).pending,3);
});
test('accept candidate changes only demo state, producing a formal demo card',()=>{
 const s=initialDemoState(), r=candidateDecision(s,'cand-1','accept');
 assert.equal(r.code,'APPROVED'); assert.equal(s.cards.length,1); assert.equal(r.state.cards.length,2);
 assert.equal(r.state.candidates[0].status,'accepted');
});
test('ignored candidate is not imported',()=>{
 const s=initialDemoState(), r=candidateDecision(s,'cand-1','ignore');
 assert.equal(r.code,'IGNORED'); assert.equal(r.state.cards.length,1);
});
test('candidate decisions cannot be repeated or fabricated',()=>{
 const s=initialDemoState(),r=candidateDecision(s,'cand-1','accept');
 assert.equal(candidateDecision(r.state,'cand-1','accept').code,'CANDIDATE_NOT_PENDING');
 assert.equal(candidateDecision(s,'not-exist','accept').code,'CANDIDATE_NOT_PENDING');
 assert.equal(candidateDecision(s,'cand-1','delete').code,'INVALID_DECISION');
});
test('direct demo card validates and rejects duplicate terms',()=>{
 const s=initialDemoState();
 assert.equal(addExplicitDemoCard(s,{term:' Rice ',meaning:'米飯'}).code,'DUPLICATE');
 assert.equal(addExplicitDemoCard(s,{term:'',meaning:'空白'}).code,'INVALID_CARD');
 const r=addExplicitDemoCard(s,{term:'apple',meaning:'蘋果'});
 assert.equal(r.code,'CREATED'); assert.equal(r.state.cards.length,2);
});
test('normalized equivalent Unicode and spaces',()=>{
 assert.equal(normalizeTerm('  Have    EATEN  '),'have eaten');
 assert.equal(normalizeTerm('ＲＩＣＥ'),'rice');
});
test('only allowed demo exercise modes can be recorded',()=>{
 const s=initialDemoState();
 assert.equal(recordDemoPractice(s,{cardId:'card-1',mode:'arbitrary',correct:true}).code,'INVALID_PRACTICE');
 assert.equal(recordDemoPractice(s,{cardId:'other',mode:'choice',correct:true}).code,'INVALID_PRACTICE');
 const r=recordDemoPractice(s,{cardId:'card-1',mode:'choice',correct:true});
 assert.equal(r.code,'RECORDED');assert.equal(getDemoSummary(r.state).accuracy,100);
});
test('review history and audit trail are append-only in reducer',()=>{
 const s=initialDemoState();
 const a=recordDemoPractice(s,{cardId:'card-1',mode:'flip',correct:false}).state;
 const b=recordDemoPractice(a,{cardId:'card-1',mode:'spelling',correct:true}).state;
 assert.equal(b.practice.length,2);assert.equal(b.audit.length,2);
 assert.equal(s.practice.length,0);assert.equal(getDemoSummary(b).accuracy,50);
});
