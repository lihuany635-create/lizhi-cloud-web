// P6 initial diagnostic candidate. Scoring is scoped to secure server-side answer keys.
// This produces learning advice, NEVER an official CEFR certification.
import { gradeExercise, validateExercise } from './practice-engine.mjs';
import { SKILLS, LEVELS } from '../p4/adaptive-planner.mjs';

const SAMPLE=[
 {id:'diag-a0-vocab',cardId:'diagnostic-1',mode:'choice',level:'A0',skill:'vocabulary',
   prompt:'Choose the meaning of hungry.',expected:'餓的',choices:['餓的','漂亮的','安靜的']},
 {id:'diag-a0-grammar',cardId:'diagnostic-2',mode:'choice',level:'A0',skill:'grammar',
   prompt:'I ___ a student.',expected:'am',choices:['am','are','is']},
 {id:'diag-a1-reading',cardId:'diagnostic-3',mode:'choice',level:'A1',skill:'reading',
   prompt:'Tom is at home. Where is Tom?',expected:'At home',choices:['At school','At home','At work']},
 {id:'diag-a1-spelling',cardId:'diagnostic-4',mode:'spelling',level:'A1',skill:'writing',
   prompt:'Spell the English word meaning 早餐.',expected:'breakfast'},
 {id:'diag-a2-grammar',cardId:'diagnostic-5',mode:'fill',level:'A2',skill:'grammar',
   prompt:'I have ___ lunch.',expected:'eaten'},
 {id:'diag-a2-listening',cardId:'diagnostic-6',mode:'listening',level:'A2',skill:'listening',
   prompt:'Listen and type the phrase.',expected:'I have eaten',audioText:'en:I have eaten'},
 {id:'diag-b1-writing',cardId:'diagnostic-7',mode:'sentence',level:'B1',skill:'writing',
   prompt:'Write a sentence about something you learned yesterday.'},
 {id:'diag-b1-translation',cardId:'diagnostic-8',mode:'translation',level:'B1',skill:'reading',
   prompt:'Translate: 我已經吃過午餐了。',expected:'I have already eaten lunch.',
   acceptedAnswers:['I have already eaten lunch.','I have eaten lunch already.']},
 {id:'diag-b2-reading',cardId:'diagnostic-9',mode:'choice',level:'B2',skill:'reading',
   prompt:'Despite the rain, the event continued. What does despite indicate?',
   expected:'Contrast',choices:['Contrast','Cause','Sequence']},
 {id:'diag-b2-writing',cardId:'diagnostic-10',mode:'sentence',level:'B2',skill:'writing',
   prompt:'Explain one advantage and one limitation of using AI to learn English.'},
 {id:'diag-c1-grammar',cardId:'diagnostic-11',mode:'choice',level:'C1',skill:'grammar',
   prompt:'Had I known earlier, I ___ acted differently.',expected:'would have',
   choices:['would have','will have','have']},
 {id:'diag-c1-reading',cardId:'diagnostic-12',mode:'choice',level:'C1',skill:'reading',
   prompt:'"A plausible claim is not necessarily substantiated." What is emphasized?',
   expected:'Evidence is still required',choices:['Evidence is still required','All claims are false','Plausibility proves truth']},
 {id:'diag-c2-writing',cardId:'diagnostic-13',mode:'sentence',level:'C2',skill:'writing',
   prompt:'Discuss how subtle changes in tone affect professional communication.'},
 {id:'diag-c2-vocabulary',cardId:'diagnostic-14',mode:'choice',level:'C2',skill:'vocabulary',
   prompt:'In a scholarly context, equivocal most nearly means:',
   expected:'Ambiguous',choices:['Ambiguous','Unavoidable','Definite']},
];
const LEVELS_SET=new Set(LEVELS);
const SKILLS_SET=new Set(SKILLS);
export const DIAGNOSTIC_VERSION='diagnostic-prototype-v1';
export const DIAGNOSTIC_BANK=Object.freeze(SAMPLE.map(row=>{
 const exercise=validateExercise(row);
 if(!LEVELS_SET.has(row.level)||!SKILLS_SET.has(row.skill))throw Error('INVALID_DIAGNOSTIC_BANK');
 return Object.freeze({...exercise,level:row.level,skill:row.skill});
}));
const plain=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
export function publicDiagnosticQuestions(bank=DIAGNOSTIC_BANK) {
  return bank.map(({id,mode,level,skill,prompt,choices,cardId})=>({
    id,mode,level,skill,prompt,choices:[...choices],cardId
  }));
}
export function createDiagnostic({ownerId,sessionId,startedAt,bank=DIAGNOSTIC_BANK}) {
 if(typeof ownerId!=='string'||!ownerId.trim()||
    typeof sessionId!=='string'||sessionId.length<12||
    !(startedAt instanceof Date)||!Number.isFinite(startedAt.valueOf())||
    !Array.isArray(bank)||new Set(bank.map(q=>q.id)).size!==bank.length)
   throw new TypeError('INVALID_DIAGNOSTIC_SESSION');
 return Object.freeze({ownerId,sessionId,startedAt:startedAt.toISOString(),
   version:DIAGNOSTIC_VERSION,questionIds:bank.map(q=>q.id),attempts:[]});
}
export function recordDiagnosticAnswer({
 session,bank=DIAGNOSTIC_BANK,questionId,response,attemptId,createdAt,
 recalledRating=null,verifiedAudioReceipt=null
}) {
 if(!plain(session)||!Array.isArray(session.attempts)||session.version!==DIAGNOSTIC_VERSION||
    typeof questionId!=='string'||!session.questionIds.includes(questionId))
     throw new TypeError('INVALID_DIAGNOSTIC_QUESTION');
 const q=bank.find(x=>x.id===questionId);
 if(!q||!session.questionIds.includes(q.id))throw new TypeError('BANK_ITEM_MISSING');
 if(session.attempts.some(a=>a.questionId===questionId))throw new Error('QUESTION_ALREADY_ANSWERED');
 if(session.attempts.some(a=>a.attemptId===attemptId))throw new Error('DUPLICATE_ATTEMPT_ID');
 const delivered=q.mode==='listening'&&verifiedAudioReceipt?.trusted===true&&
    verifiedAudioReceipt.ownerId===session.ownerId&&verifiedAudioReceipt.questionId===q.id;
 const outcome=gradeExercise({exercise:q,response,ownerId:session.ownerId,
   attemptId,createdAt,recalledRating,audioDelivered:delivered});
 const row={...outcome,questionId:q.id,level:q.level,skill:q.skill};
 return {...session,attempts:[...session.attempts,row]};
}
export function diagnosticSummary(session,bank=DIAGNOSTIC_BANK) {
 if(!plain(session)||!Array.isArray(session.attempts)||
    !Array.isArray(session.questionIds)||session.version!==DIAGNOSTIC_VERSION)
   throw new TypeError('INVALID_DIAGNOSTIC');
 const byId=new Map(bank.map(q=>[q.id,q]));
 const scores={};
 for(const skill of SKILLS){
   const all=bank.filter(q=>session.questionIds.includes(q.id)&&q.skill===skill);
   const graded=session.attempts.filter(a=>a.ownerId===session.ownerId&&a.skill===skill&&
     a.status==='objective-graded'&&a.evidenceStatus==='observed');
   const correct=graded.filter(x=>x.correct===true).length;
   const unverified=session.attempts.filter(x=>x.skill===skill&&x.ownerId===session.ownerId&&
      x.status!=='objective-graded').length;
   scores[skill]={state:graded.length?'observed-sample':'not-assessed',assigned:all.length,
     reviewed:graded.length,correct,accuracy:graded.length?correct/graded.length:null,
     pendingReview:unverified,officialLevel:null};
 }
 const missingSkills=SKILLS.filter(x=>scores[x].reviewed===0);
 const maxPossible=LEVELS.length;
 // A diagnostic sample (even perfect) is never an official CEFR test.
 // Levels require validated item counts, independent rubrics and delivered
 // speaking/listening assessments not supplied by this sample bank.
 return {
   version:DIAGNOSTIC_VERSION,
   ownerId:session.ownerId,answered:session.attempts.length,
   total:session.questionIds.length,skills:scores,missingSkills,
   suggestedFocus:SKILLS.filter(s=>scores[s].reviewed>0 && scores[s].accuracy<0.75),
   evidenceSufficiency:'prototype-sample-only',proposedLevel:null,
   officialCEFR:null,maxSampleLevel:maxPossible,
   note:'此測驗僅提供學習建議；未包含有效的完整聽說測驗或官方 CEFR 認證。'
 };
}
