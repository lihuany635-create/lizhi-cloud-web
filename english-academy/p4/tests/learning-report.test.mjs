import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLearningReport} from '../learning-report.mjs';
const owner='owner-a',asOf='2026-11-15T08:00:00.000Z';
const event=(id,time,correct,graderType='objective')=>({
 ownerId:owner,eventId:id,cardId:'rice',recordedAt:time,
 mode:'choice',graderType,correct
});
test('zero activity uses null accuracy and no imaginary CEFR level',()=>{
 const r=buildLearningReport({ownerId:owner,asOf});
 assert.equal(r.trackedPracticeEvents,0);
 assert.equal(r.objectiveAccuracy,null);
 assert.equal(r.completedSessions,0);
 assert.equal(r.missedDayPenalty,0);
 assert.equal(r.skills.speaking.cefrLevel,null);
});
test('objective score excludes subjective learner self ratings',()=>{
 const e=[event('1','2026-11-14T08:00:00Z',true),
 event('2','2026-11-13T08:00:00Z',false),
 event('3','2026-11-12T08:00:00Z',true,'learner_self')];
 const r=buildLearningReport({ownerId:owner,asOf,practiceEvents:e});
 assert.equal(r.trackedPracticeEvents,3);
 assert.equal(r.objectiveEvaluated,2);
 assert.equal(r.objectiveAccuracy,0.5);
 assert.equal(r.selfRatings,1);
 assert.equal(r.activeDays,3);
});
test('duplicates, old activity and future activity do not corrupt results',()=>{
 const e=[event('same','2026-11-14T08:00:00Z',true),
 event('same','2026-11-14T08:00:00Z',true),
 event('old','2026-10-01T08:00:00Z',false)];
 const r=buildLearningReport({ownerId:owner,asOf,practiceEvents:e});
 assert.equal(r.trackedPracticeEvents,1);
 assert.equal(r.objectiveAccuracy,1);
 assert.throws(()=>buildLearningReport({ownerId:owner,asOf,practiceEvents:[
 event('future','2026-11-20T08:00:00Z',true)]}),/INVALID_PRACTICE/);
});
test('recorded minutes are actual completed sessions not planned time',()=>{
 const rows=[{ownerId:owner,sessionId:'s1',status:'completed',
   finishedAt:'2026-11-14T08:00:00Z',actualMinutes:12},
   {ownerId:owner,sessionId:'s2',status:'paused',
   finishedAt:'2026-11-14T08:00:00Z',actualMinutes:25}];
 const goals=[{ownerId:owner,forDate:'2026-11-14T00:00:00Z',minutes:20}];
 const r=buildLearningReport({ownerId:owner,asOf,completedSessions:rows,plannedGoals:goals});
 assert.equal(r.completedSessions,1);
 assert.equal(r.recordedMinutes,12);
 assert.equal(r.plannedDays,1);
 assert.equal(r.missingDaysNotPenalized,true);
});
test('prior objective score permits evidence-backed comparison only',()=>{
 const r=buildLearningReport({ownerId:owner,asOf,practiceEvents:[
 event('ok','2026-11-14T00:00:00Z',true)],
 previousReport:{ownerId:owner,objectiveAccuracy:0.6}});
 assert.equal(r.objectiveAccuracyChange,0.4);
 const no=buildLearningReport({ownerId:owner,asOf,practiceEvents:[
 event('ok','2026-11-14T00:00:00Z',true)],
 previousReport:{ownerId:'another',objectiveAccuracy:0.1}});
 assert.equal(no.objectiveAccuracyChange,null);
});
test('cross-owner data never enters report',()=>{
 assert.throws(()=>buildLearningReport({ownerId:owner,asOf,practiceEvents:[
 {...event('ok','2026-11-14T00:00:00Z',true),ownerId:'other'}]}),/OWNER_SCOPE/);
});
test('activity ids are auditable without disclosing answer text',()=>{
 const r=buildLearningReport({ownerId:owner,asOf,practiceEvents:[
 {...event('ok','2026-11-14T00:00:00Z',true),answerText:'sensitive sentence'}]});
 const printed=JSON.stringify(r);
 assert.ok(!printed.includes('sensitive sentence'));
 assert.deepEqual(r.provenance.practiceEventIds,['ok']);
});
