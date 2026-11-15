import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeSkills,selectDueCards,createAdaptiveDailyPlan,SKILLS} from '../adaptive-planner.mjs';
import {listCurriculum} from '../curriculum.mjs';

const owner='test-owner',other='other-owner';
const now='2026-11-15T08:00:00.000Z';
const record=(skill,activityId,score,observedAt='2026-11-13T08:00:00.000Z')=>({
 ownerId:owner,skill,activityId,state:'observed',score,weight:1,observedAt
});
const reviews=[
 {ownerId:owner,cardId:'card-a',dueAt:'2026-11-13T00:00:00.000Z'},
 {ownerId:owner,cardId:'card-b',dueAt:'2026-11-20T00:00:00.000Z'},
 {ownerId:owner,cardId:'card-c',dueAt:'2026-11-10T00:00:00.000Z',scheduleStatus:'suspended'}
];
const lessons=()=>listCurriculum({ownerId:owner});

test('empty assessment yields no fabricated weakness, speaking score, or official CEFR',()=>{
 const s=analyzeSkills({ownerId:owner,asOf:now});
 assert.deepEqual(Object.keys(s),SKILLS);
 for(const row of Object.values(s)){
   assert.equal(row.state,'not-tested');assert.equal(row.correctRate,null);
   assert.equal(row.cefrLevel,null);assert.equal(row.priority,0);
 }
});
test('three weak grammar observations outrank stronger vocabulary evidence',()=>{
 const e=[record('grammar','g1',0),record('grammar','g2',0.2),
  record('grammar','g3',0.4),record('vocabulary','v1',1),
  record('vocabulary','v2',1),record('vocabulary','v3',0.9)];
 const plan=createAdaptiveDailyPlan({ownerId:owner,asOf:now,evidence:e,
   reviewCards:reviews,lessons:lessons(),goalMinutes:20});
 assert.equal(plan.focusSkill,'grammar');
 assert.equal(plan.focusBasis,'observed-weakness');
 assert.ok(plan.tasks.some(x=>x.type==='review'));
 const l=plan.tasks.find(x=>x.type==='lesson');
 assert.ok(l?.lessonId.includes('daily')||l?.lessonId.includes('perfect'));
 assert.ok(l.evidenceRefs.includes('g1'));
 assert.equal(plan.officialCefrLevel,null);
});
test('different owner evidence or lessons fails closed rather than leaking context',()=>{
 const bad=[{...record('grammar','g1',0),ownerId:other}];
 assert.throws(()=>analyzeSkills({ownerId:owner,asOf:now,evidence:bad}),/OWNER_SCOPE/);
 assert.throws(()=>createAdaptiveDailyPlan({ownerId:owner,asOf:now,
   lessons:[{...lessons()[0],ownerId:other}]}),/OWNER_SCOPE/);
 assert.throws(()=>selectDueCards({ownerId:owner,asOf:now,
   cards:[{...reviews[0],ownerId:other}]}),/OWNER_SCOPE/);
});
test('duplicate activity ID does not inflate skill observation counts',()=>{
 const e=[record('grammar','same',0),record('grammar','same',1)];
 const s=analyzeSkills({ownerId:owner,asOf:now,evidence:e});
 assert.equal(s.grammar.observations,1);
 assert.equal(s.grammar.correctRate,0);
});
test('out-of-order dates, suspended cards and future dues are handled',()=>{
 const result=selectDueCards({ownerId:owner,asOf:now,cards:reviews});
 assert.deepEqual(result.map(x=>x.cardId),['card-a']);
});
test('review queue deduplicates card IDs and sorts deadlines',()=>{
 const rows=[{ownerId:owner,cardId:'b',dueAt:'2026-11-13T08:00:00Z'},
 {ownerId:owner,cardId:'a',dueAt:'2026-11-12T08:00:00Z'},
 {ownerId:owner,cardId:'a',dueAt:'2026-11-11T08:00:00Z'}];
 assert.deepEqual(selectDueCards({ownerId:owner,asOf:now,cards:rows}).map(x=>x.cardId),['a','b']);
});
test('daily plan allocations never exceed selected learner goal',()=>{
 for(const minutes of [5,10,20,45,90]){
   const plan=createAdaptiveDailyPlan({ownerId:owner,asOf:now,goalMinutes:minutes,
     lessons:lessons(),reviewCards:reviews});
   assert.equal(plan.allocatedMinutes,minutes);
   assert.equal(plan.tasks.reduce((s,t)=>s+t.minutes,0),minutes);
   assert.ok(plan.tasks.every(t=>t.minutes>0));
 }
});
test('no evidence results in initial exploration rather than a false weak-skill label',()=>{
 const plan=createAdaptiveDailyPlan({ownerId:owner,asOf:now,lessons:lessons()});
 assert.equal(plan.focusSkill,'vocabulary');
 assert.equal(plan.focusBasis,'initial-exploration');
 assert.ok(plan.tasks.some(x=>x.type==='lesson'));
 assert.equal(plan.skillSummary.speaking.state,'not-tested');
});
test('long inactivity triggers gentle start and never deletes or penalizes history',()=>{
 const snapshot=lessons();
 const plan=createAdaptiveDailyPlan({ownerId:owner,asOf:now,goalMinutes:20,lessons:snapshot,
   lastSessionAt:'2026-10-10T08:00:00.000Z'});
 assert.equal(plan.gentleRestart,true);
 assert.ok(plan.hiatusDays>=30);
 assert.ok(plan.tasks.some(x=>x.type==='light-conversation'));
 assert.equal(snapshot.length,14);
});
test('recent activity does not trigger restart',()=>{
 const p=createAdaptiveDailyPlan({ownerId:owner,asOf:now,lastSessionAt:'2026-11-14T08:00:00Z',
   lessons:lessons()});
 assert.equal(p.gentleRestart,false);
});
test('learner preference overrides machine-selected weakness',()=>{
 const e=[record('grammar','g1',0),record('grammar','g2',0),record('grammar','g3',0)];
 const p=createAdaptiveDailyPlan({ownerId:owner,asOf:now,evidence:e,lessons:lessons(),
   skillPreference:'speaking'});
 assert.equal(p.focusSkill,'speaking');
 assert.equal(p.focusBasis,'user-preference');
});
test('when lesson set is exhausted, use practice rather than inventing a new lesson',()=>{
 const data=lessons();
 const p=createAdaptiveDailyPlan({ownerId:owner,asOf:now,lessons:data,
   completedLessonIds:data.map(x=>x.id)});
 assert.ok(p.tasks.some(x=>x.type==='practice'));
 assert.ok(!p.tasks.some(x=>x.type==='lesson'));
});
test('reject invalid goal, unknown skill preference and future learning evidence',()=>{
 assert.throws(()=>createAdaptiveDailyPlan({ownerId:owner,asOf:now,goalMinutes:0}),/INVALID_PLAN/);
 assert.throws(()=>createAdaptiveDailyPlan({ownerId:owner,asOf:now,skillPreference:'psychic'}),/UNKNOWN_SKILL/);
 assert.throws(()=>analyzeSkills({ownerId:owner,asOf:now,
   evidence:[record('grammar','g1',1,'2026-12-15T00:00:00Z')]}),/FUTURE_DATE/);
});
test('snapshot is not mutated by planner',()=>{
 const e=[record('grammar','g1',0),record('grammar','g2',0.1),record('grammar','g3',1)];
 const before=JSON.stringify(e);
 createAdaptiveDailyPlan({ownerId:owner,asOf:now,evidence:e,lessons:lessons()});
 assert.equal(JSON.stringify(e),before);
});
test('old errors beyond 90 days do not create perpetual weakness penalties',()=>{
 const errors=[{ownerId:owner,id:'old',skill:'grammar',at:'2026-06-01T00:00:00Z'}];
 const a=analyzeSkills({ownerId:owner,asOf:now,errors});
 assert.equal(a.grammar.errorCount,0);
});
