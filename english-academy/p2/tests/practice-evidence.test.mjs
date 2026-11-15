import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gradePractice, makeSkillEvidence, summarizeSkills,
  initialAssessmentProfile, SKILL_TYPES, normalizeEnglish
} from '../practice-evidence.mjs';
const t=new Date('2026-11-15T08:00:00.000Z');
const base={ownerId:'owner-demo',activityId:'act-01',observedAt:t,reviewer:'objective'};

test('objective spelling, fill and selection grade deterministically',()=>{
  assert.equal(normalizeEnglish('  I    HAVE eaten. '),'i have eaten');
  assert.equal(gradePractice({mode:'spelling',expected:'Rice',answer:' rice '}).correct,true);
  assert.equal(gradePractice({mode:'fill',expected:'have eaten',answer:'Had eaten'}).correct,false);
  assert.equal(gradePractice({mode:'choice',expected:'hungry',answer:'Hungry'}).correct,true);
  assert.throws(()=>gradePractice({mode:'madeup',answer:'a',expected:'a'}),/UNSUPPORTED/);
});

test('sentence never claims automatic correctness without human/AI review',()=>{
  const result=gradePractice({mode:'sentence',expected:'I am hungry.',answer:'I hungry'});
  assert.equal(result.status,'needs-review');
  assert.equal(result.correct,null);
  const evidence=makeSkillEvidence({...base,mode:'sentence',skill:'writing',gradeResult:result});
  assert.equal(evidence.state,'unassessed');
});

test('flipped cards do not auto-score memory; learner rating required',()=>{
  const result=gradePractice({mode:'flip'});
  assert.equal(result.status,'self-rating-required');
  assert.equal(result.correct,null);
});

test('audio exposure cannot be inferred from plain text submission',()=>{
  const result=gradePractice({mode:'listening',expected:'apple',answer:'apple'});
  assert.equal(result.correct,true);
  const evidence=makeSkillEvidence({...base,mode:'listening',skill:'listening',gradeResult:result});
  assert.equal(evidence.state,'unassessed');
  assert.equal(evidence.reason,'AUDIO_DELIVERY_UNVERIFIED');
  const verified=makeSkillEvidence({...base,mode:'listening',skill:'listening',
    reviewer:'verified-audio-session',gradeResult:result});
  assert.equal(verified.state,'observed');
});

test('skill dimension evidence cannot be fabricated from unrelated task type',()=>{
  const result=gradePractice({mode:'spelling',expected:'apple',answer:'apple'});
  assert.throws(()=>makeSkillEvidence({...base,mode:'spelling',skill:'speaking',gradeResult:result}),
    /SKILL_NOT_SUPPORTED/);
});

test('six skill scores initialize as untested not arbitrary CEFR level',()=>{
  const profile=initialAssessmentProfile();
  assert.deepEqual(Object.keys(profile),SKILL_TYPES);
  for(const val of Object.values(profile)){
    assert.equal(val.ceFrLevel,null);
    assert.equal(val.state,'not-tested');
  }
});

test('aggregate skills scoped by owner and do not infer official CEFR',()=>{
  const r1=gradePractice({mode:'spelling',expected:'rice',answer:'rice'});
  const r2=gradePractice({mode:'spelling',expected:'rice',answer:'lice'});
  const evidence=[
    makeSkillEvidence({...base,mode:'spelling',skill:'vocabulary',gradeResult:r1}),
    makeSkillEvidence({...base,mode:'spelling',skill:'vocabulary',
      activityId:'act-02',gradeResult:r2}),
    makeSkillEvidence({...base,ownerId:'someone-else',mode:'spelling',
      skill:'vocabulary',activityId:'act-03',gradeResult:r1})
  ];
  const score=summarizeSkills(evidence,'owner-demo');
  assert.equal(score.vocabulary.performance,0.5);
  assert.equal(score.vocabulary.observations,2);
  assert.equal(score.vocabulary.ceFrLevel,null);
  assert.equal(score.speaking.state,'not-tested');
});

test('invalid owner, time and weighting are rejected',()=>{
  const r=gradePractice({mode:'choice',expected:'rice',answer:'rice'});
  assert.throws(()=>makeSkillEvidence({...base,ownerId:'',mode:'choice',skill:'vocabulary',gradeResult:r}),
    /INVALID_PROVENANCE/);
  assert.throws(()=>makeSkillEvidence({...base,mode:'choice',skill:'vocabulary',
    observedAt:new Date(NaN),gradeResult:r}),/INVALID_DATE/);
  assert.throws(()=>makeSkillEvidence({...base,mode:'choice',skill:'vocabulary',weight:5,gradeResult:r}),
    /INVALID_WEIGHT/);
});
