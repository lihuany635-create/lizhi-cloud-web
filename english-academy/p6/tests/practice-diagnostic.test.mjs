import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_PRACTICE_BANK,getDemoExercise } from '../sample-bank.mjs';
import { validateExercise,gradeExercise,proposeFeedback,confirmSentenceReview,RUBRIC,MODES } from '../practice-engine.mjs';
import { DIAGNOSTIC_BANK,publicDiagnosticQuestions,createDiagnostic,recordDiagnosticAnswer,
 diagnosticSummary } from '../diagnostic-engine.mjs';
const date=new Date('2026-11-15T08:00:00.000Z');
const ownerId='test-owner-english';
const base={ownerId,attemptId:'attempt-00000001',createdAt:date};
function check(q,response,other={}){return gradeExercise({exercise:q,response,...base,...other})}
test('all seven modalities have one valid example and stable exercise IDs',()=>{
 assert.deepEqual(DEMO_PRACTICE_BANK.map(x=>x.mode),MODES);
 assert.equal(new Set(DEMO_PRACTICE_BANK.map(x=>x.id)).size,7);
 assert.equal(RUBRIC.length,4);
});
test('choice marks correct option and rejects invented choices',()=>{
 const x=getDemoExercise('ex-choice-be');
 assert.equal(check(x,'am').correct,true);
 assert.equal(check(x,'is').correct,false);
 assert.throws(()=>check(x,'orange'),/CHOICE_NOT_OFFERED/);
});
test('spelling and fill blanks distinguish correct and incorrect grammar',()=>{
 const spell=getDemoExercise('ex-spell-apple');
 assert.equal(check(spell,'APPLE').correct,true);
 assert.equal(check(spell,'apply').correct,false);
 const fill=getDemoExercise('ex-fill-perfect');
 assert.equal(check(fill,fill.expected).correct,true);
 assert.equal(check(fill,'had').correct,false);
});
test('configured translation equivalents accepted; uncontrolled variants not certified',()=>{
 const x=getDemoExercise('ex-translate-food');
 assert.equal(check(x,"I have not eaten anything.").correct,true);
 assert.equal(check(x,"I haven't eaten anything.").correct,true);
 assert.equal(check(x,'I did eat nothing').correct,false);
});
test('flip requires learner FSRS self-rating not objective skill score',()=>{
 const x=getDemoExercise('ex-flip-rice');
 assert.equal(check(x,null).status,'needs-self-rating');
 const r=check(x,null,{recalledRating:3});
 assert.equal(r.status,'self-rated');assert.equal(r.correct,null);
 assert.equal(r.evidenceStatus,'unassessed');
});
test('listening without trusted playback remains unassessed even with correct transcript',()=>{
 const x=getDemoExercise('ex-listening-hungry');
 const a=check(x,x.expected);
 assert.equal(a.status,'audio-unverified');
 assert.equal(a.correct,null);
 const b=check(x,x.expected,{audioDelivered:true});
 assert.equal(b.correct,true);
 assert.equal(b.evidenceStatus,'observed');
});
test('open sentence is never marked correct by deterministic engine',()=>{
 const x=getDemoExercise('ex-sentence-sleepy');
 const r=check(x,'I feel sleepy after work.');
 assert.equal(r.status,'needs-human-review');
 assert.equal(r.correct,null);
 assert.equal(r.rubricId,'sentence-rubric-v1');
});
test('AI feedback is proposal-only and cannot mutate grading',()=>{
 const x=getDemoExercise('ex-sentence-sleepy');
 const r=check(x,'I feel sleepy.');
 const feedback=proposeFeedback({draft:r,comment:'The sentence uses sleepy naturally.',
   rubricChecks:[true,true,true,null]});
 assert.equal(feedback.state,'proposal-only');
 assert.equal(feedback.correct,null);
 assert.equal(r.correct,null);
});
test('trusted human review is required; unverified model approval is rejected',()=>{
 const q=getDemoExercise('ex-sentence-sleepy');
 const draft=check(q,'I sleepy');
 const proposal=proposeFeedback({draft,comment:'Missing a verb.',rubricChecks:[true,false,true,false]});
 assert.throws(()=>confirmSentenceReview({draft,proposal,verifiedReviewer:{trusted:false,ownerId},
  approved:true,finalChecks:[true,true,true,true],reviewedAt:date}),/TRUSTED_HUMAN_REVIEW/);
 assert.throws(()=>confirmSentenceReview({draft,proposal,verifiedReviewer:{trusted:true,
  ownerId:'other-owner',role:'learner'},approved:true,finalChecks:[true,true,true,true],reviewedAt:date}),/TRUSTED_HUMAN_REVIEW/);
 const reviewed=confirmSentenceReview({draft,proposal,verifiedReviewer:{trusted:true,ownerId,
   role:'learner'},approved:true,finalChecks:[true,true,true,true],reviewedAt:date});
 assert.equal(reviewed.correct,true);
 assert.equal(reviewed.provisional,true);
 assert.equal(reviewed.grader,'verified-learner-review');
});
test('a reviewer can reject AI suggestion; a failed rubric prevents automatic pass',()=>{
 const draft=check(getDemoExercise('ex-sentence-sleepy'),'I sleepy');
 const proposal=proposeFeedback({draft,comment:'Consider I feel sleepy.',
   rubricChecks:[true,false,true,false]});
 const reviewed=confirmSentenceReview({draft,proposal,verifiedReviewer:{trusted:true,
   ownerId,role:'learner'},approved:true,finalChecks:[true,false,true,true],reviewedAt:date});
 assert.equal(reviewed.correct,false);
});
test('unrecognized modes, invalid cards and oversized answer strings rejected',()=>{
 assert.throws(()=>validateExercise({id:'1',mode:'unknown',prompt:'test',cardId:'x'}));
 assert.throws(()=>check(getDemoExercise('ex-sentence-sleepy'),'x'.repeat(2001)),/INVALID_SENTENCE/);
});
test('diagnostic includes all learning stages, but public questions never expose keys',()=>{
 assert.equal(DIAGNOSTIC_BANK.length,14);
 assert.deepEqual([...new Set(DIAGNOSTIC_BANK.map(x=>x.level))],
  ['A0','A1','A2','B1','B2','C1','C2']);
 const pub=publicDiagnosticQuestions();
 assert.equal(pub.length,14);
 assert.ok(pub.every(x=>!('expected' in x)&&!('acceptedAnswers' in x)));
});
test('diagnostic session records immutable evidence and rejects same question twice',()=>{
 const session=createDiagnostic({ownerId,sessionId:'diagnostic-test-00001',startedAt:date});
 const updated=recordDiagnosticAnswer({session,questionId:'diag-a0-grammar',
   response:'am',attemptId:'diagnostic-attempt-0001',createdAt:date});
 assert.equal(session.attempts.length,0);
 assert.equal(updated.attempts.length,1);
 assert.equal(updated.attempts[0].correct,true);
 assert.throws(()=>recordDiagnosticAnswer({session:updated,questionId:'diag-a0-grammar',
   response:'am',attemptId:'diagnostic-attempt-0002',createdAt:date}),/QUESTION_ALREADY_ANSWERED/);
});
test('listening score cannot be forged by client flag without trusted receipt',()=>{
 const session=createDiagnostic({ownerId,sessionId:'diagnostic-test-00002',startedAt:date});
 const notVerified=recordDiagnosticAnswer({session,questionId:'diag-a2-listening',
  response:'I have eaten',attemptId:'diagnostic-attempt-0003',createdAt:date,
  verifiedAudioReceipt:{trusted:false,ownerId,questionId:'diag-a2-listening'}});
 assert.equal(notVerified.attempts[0].status,'audio-unverified');
 const verified=recordDiagnosticAnswer({session,questionId:'diag-a2-listening',
  response:'I have eaten',attemptId:'diagnostic-attempt-0003',createdAt:date,
  verifiedAudioReceipt:{trusted:true,ownerId,questionId:'diag-a2-listening'}});
 assert.equal(verified.attempts[0].correct,true);
});
test('diagnostic summary never invents CEFR or speaking score',()=>{
 let s=createDiagnostic({ownerId,sessionId:'diagnostic-test-00003',startedAt:date});
 s=recordDiagnosticAnswer({session:s,questionId:'diag-a0-vocab',response:'漂亮的',
  attemptId:'diagnostic-attempt-0004',createdAt:date});
 const result=diagnosticSummary(s);
 assert.equal(result.officialCEFR,null);
 assert.equal(result.proposedLevel,null);
 assert.equal(result.skills.vocabulary.correct,0);
 assert.equal(result.skills.speaking.state,'not-assessed');
 assert.ok(result.suggestedFocus.includes('vocabulary'));
});
test('subjective diagnostic remains pending until reviewed and avoids grade fabrication',()=>{
 let s=createDiagnostic({ownerId,sessionId:'diagnostic-test-00004',startedAt:date});
 s=recordDiagnosticAnswer({session:s,questionId:'diag-b1-writing',
  response:'Yesterday I learned English.',attemptId:'diagnostic-attempt-0005',createdAt:date});
 const result=diagnosticSummary(s);
 assert.equal(result.skills.writing.pendingReview,1);
 assert.equal(result.skills.writing.accuracy,null);
});
