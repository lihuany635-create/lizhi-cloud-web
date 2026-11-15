// P2 deterministic practice grading and evidence. AI subjective scoring remains proposed only.
export const PRACTICE_TYPES=Object.freeze([
  'flip','choice','spelling','fill','translation','listening','sentence'
]);
export const SKILL_TYPES=Object.freeze([
  'vocabulary','grammar','reading','writing','listening','speaking'
]);
const PRACTICE_SET=new Set(PRACTICE_TYPES);
const SKILL_SET=new Set(SKILL_TYPES);
const objective = new Set(['choice','spelling','fill','translation','listening']);

export function normalizeEnglish(value) {
  return String(value??'').normalize('NFKC').toLocaleLowerCase('en')
    .trim().replace(/\s+/gu,' ').replace(/[.,!?;:]+$/gu,'');
}
export function gradePractice({mode,expected,answer}){
  if(!PRACTICE_SET.has(mode))throw new TypeError('UNSUPPORTED_PRACTICE');
  if(mode==='sentence')return {status:'needs-review',correct:null,source:'human-or-ai-proposal',
    note:'自由造句不可直接當成客觀題確定評分'};
  if(mode==='flip')return {status:'self-rating-required',correct:null,source:'learner',
    note:'翻卡必須依回想程度由學習者選擇 Again/Hard/Good/Easy'};
  if(!objective.has(mode))throw new TypeError('NOT_OBJECTIVE');
  if(typeof answer!=='string' || typeof expected!=='string' || !expected.trim())
    throw new TypeError('INVALID_ANSWER');
  const correct=normalizeEnglish(expected)===normalizeEnglish(answer);
  return {status:'graded',correct,source:'deterministic',
    note:mode==='listening'?'只驗證聽寫文字，不能證明音訊已播放或完成聽力能力評分':''};
}
const EVIDENCE_SKILLS={
  choice:['vocabulary'],
  spelling:['vocabulary','writing'],
  fill:['vocabulary','grammar'],
  translation:['vocabulary','reading','writing'],
  listening:['listening'],
  sentence:['writing','grammar'],
  flip:['vocabulary'],
};
export function makeSkillEvidence({ownerId,activityId,mode,gradeResult,reviewer,
   skill,observedAt,weight=1}) {
  if(typeof ownerId!=='string'||!ownerId||
     typeof activityId!=='string'||!activityId)throw new TypeError('INVALID_PROVENANCE');
  if(!PRACTICE_SET.has(mode) || !SKILL_SET.has(skill) ||
     !EVIDENCE_SKILLS[mode]?.includes(skill))throw new TypeError('SKILL_NOT_SUPPORTED_BY_ACTIVITY');
  if(!(observedAt instanceof Date)||Number.isNaN(observedAt.valueOf()))throw new TypeError('INVALID_DATE');
  if(typeof weight!=='number'||!Number.isFinite(weight)||weight<=0||weight>1)
    throw new RangeError('INVALID_WEIGHT');
  if(!gradeResult||!['graded','needs-review','self-rating-required'].includes(gradeResult.status))
    throw new TypeError('INVALID_GRADE');
  if(gradeResult.status!=='graded'){
    return {state:'unassessed',ownerId,activityId,skill,observedAt:observedAt.toISOString(),
      reason:'SUBJECTIVE_OR_UNGRADED_ACTIVITY'};
  }
  if(typeof gradeResult.correct!=='boolean')throw new TypeError('INVALID_CORRECTNESS');
  if(mode==='listening' && reviewer!=='verified-audio-session'){
    return {state:'unassessed',ownerId,activityId,skill,observedAt:observedAt.toISOString(),
      reason:'AUDIO_DELIVERY_UNVERIFIED'};
  }
  return {state:'observed',ownerId,activityId,skill,observedAt:observedAt.toISOString(),
    score:gradeResult.correct?1:0,weight,grader:gradeResult.source,
    activityType:mode,reference:'practice-evidence-v1'};
}
export function summarizeSkills(evidence,ownerId) {
  if(!Array.isArray(evidence))throw new TypeError('INVALID_EVIDENCE');
  const result={};
  for(const skill of SKILL_TYPES){
    const rows=evidence.filter(x=>x?.ownerId===ownerId && x.state==='observed'&& x.skill===skill);
    const total=rows.reduce((s,x)=>s+x.weight,0);
    result[skill]=total ? {state:'observed',observations:rows.length,
       performance:Number((rows.reduce((s,x)=>s+x.score*x.weight,0)/total).toFixed(4)),
       ceFrLevel:null} : {state:'not-tested',observations:0,performance:null,ceFrLevel:null};
  }
  return result;
}
export function initialAssessmentProfile() {
  return Object.fromEntries(SKILL_TYPES.map(skill=>[skill,{
    state:'not-tested',ceFrLevel:null,confidence:null,updatedAt:null,
  }]));
}
