import test from 'node:test';
import assert from 'node:assert/strict';
import {listCurriculum,buildSkillRoadmap,proposeSkillAdvancement} from '../curriculum.mjs';
const owner='owner-a';
const base={ownerId:owner,skill:'grammar',currentLevel:'A1'};
const practice=(id,date,skill='grammar')=>({
 ownerId:owner,skill,activityId:id,state:'observed',score:0.9,observedAt:date
});
const a=(id,skill='grammar',deliveryVerified)=>({
 ownerId:owner,skill,assessmentId:id,level:'A2',passed:true,
 verificationSource:'trusted-assessment-service',rubricVersion:'p4-rubric-v1',
 issuedAt:'2026-11-14T08:00:00Z',deliveryVerified
});
test('curriculum has all learning levels A0 through C2',()=>{
 const rows=listCurriculum({ownerId:owner});
 assert.equal(rows.length,14);
 assert.deepEqual([...new Set(rows.map(x=>x.level))],['A0','A1','A2','B1','B2','C1','C2']);
 assert.ok(rows.every(x=>x.ownerId===owner&&x.skills.length));
});
test('completion is owner-scoped and does not mutate source catalog',()=>{
 const first=listCurriculum({ownerId:owner,completedIds:['a0-food']});
 assert.equal(first.find(x=>x.id==='a0-food').status,'completed');
 const second=listCurriculum({ownerId:owner});
 assert.equal(second.find(x=>x.id==='a0-food').status,'available');
});
test('skill-specific roadmap never upgrades another skill due to vocabulary completion',()=>{
 const roadmap=buildSkillRoadmap({ownerId:owner,currentLevels:{vocabulary:'A2',grammar:'A0'},
   completedIds:['a0-food']});
 assert.equal(roadmap.vocabulary.observedLevel,'A2');
 assert.equal(roadmap.grammar.observedLevel,'A0');
 assert.equal(roadmap.speaking.observedLevel,null);
 assert.equal(roadmap.speaking.certifiedLevel,null);
 assert.equal(roadmap.vocabulary.completedLessons,1);
 assert.equal(roadmap.grammar.completedLessons,0);
});
test('unassessed learner gets lesson recommendations without fabricated CEFR',()=>{
 const m=buildSkillRoadmap({ownerId:owner});
 assert.equal(m.grammar.stageStatus,'unassessed');
 assert.equal(m.grammar.observedLevel,null);
 assert.ok(m.grammar.recommendedLessonIds.length>0);
});
test('requires multi-day evidence and two validated assessments before advancement proposal',()=>{
 const early=proposeSkillAdvancement(base);
 assert.equal(early.status,'insufficient-evidence');
 assert.ok(early.reasons.includes('MORE_MULTI_DAY_PRACTICE_EVIDENCE'));
 const evidence=Array.from({length:6},(_,i)=>practice('g'+i,
   i%2?'2026-11-12T08:00:00Z':'2026-11-14T08:00:00Z'));
 const ready=proposeSkillAdvancement({...base,evidence,
   verifiedAssessments:[a('test-1'),a('test-2')]});
 assert.equal(ready.status,'ready-for-manual-review');
 assert.equal(ready.autoPromoted,false);
 assert.equal(ready.officialCertification,null);
 assert.equal(ready.nextLevel,'A2');
});
test('duplicate assessment IDs do not count twice',()=>{
 const evidence=Array.from({length:6},(_,i)=>practice('g'+i,
   i%2?'2026-11-12T08:00:00Z':'2026-11-14T08:00:00Z'));
 const p=proposeSkillAdvancement({...base,evidence,verifiedAssessments:[a('one'),a('one')]});
 assert.equal(p.status,'insufficient-evidence');
 assert.equal(p.verifiedAssessments,1);
});
test('listening and speaking require verified delivery evidence',()=>{
 const evidence=Array.from({length:6},(_,i)=>practice('listen'+i,
   i%2?'2026-11-12T08:00:00Z':'2026-11-14T08:00:00Z','listening'));
 const p=proposeSkillAdvancement({ownerId:owner,skill:'listening',currentLevel:'A1',
   evidence,verifiedAssessments:[a('a','listening',false),a('b','listening',false)]});
 assert.ok(p.reasons.includes('VERIFIED_VOICE_OR_AUDIO_SESSION'));
 assert.equal(p.autoPromoted,false);
});
test('C2 is terminal and never promotes to a fictional next stage',()=>{
 const p=proposeSkillAdvancement({ownerId:owner,skill:'writing',currentLevel:'C2'});
 assert.equal(p.status,'top-stage');assert.equal(p.nextLevel,null);
});
test('cross-owner evidence rejected',()=>{
 assert.throws(()=>proposeSkillAdvancement({...base,
   evidence:[{...practice('g1','2026-11-13T08:00:00Z'),ownerId:'other'}]}),/OWNER_SCOPE/);
});
test('invalid level or skill rejected',()=>{
 assert.throws(()=>proposeSkillAdvancement({...base,skill:'telepathy'}),/INVALID_LEVEL/);
 assert.throws(()=>buildSkillRoadmap({ownerId:owner,currentLevels:{grammar:'Z9'}}),/INVALID_CURRENT_LEVEL/);
});
