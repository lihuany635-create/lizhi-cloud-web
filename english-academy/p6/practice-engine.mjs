// P6 seven-mode practice engine. Synthetic, deterministic and side-effect free.
// AI suggestions never become graded outcomes without a verified human review.
import { gradePractice, normalizeEnglish } from '../p2/practice-evidence.mjs';

export const MODES=Object.freeze(['flip','choice','spelling','fill','translation','listening','sentence']);
const SET=new Set(MODES);
const SKILLS=Object.freeze({
  flip:['vocabulary'],choice:['vocabulary'],spelling:['vocabulary','writing'],
  fill:['grammar','vocabulary'],translation:['reading','writing'],
  listening:['listening'],sentence:['writing','grammar']
});
const isText=(x,max=500)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
const unique=(arr)=>new Set(arr).size===arr.length;
const asciiApostrophe=value=>String(value).replace(/[‘’]/gu,"'");

export function validateExercise(q) {
  if(!q||typeof q!=='object'||Array.isArray(q)||!isText(q.id,80)||!SET.has(q.mode)||
      !isText(q.prompt,500)||!isText(q.cardId,80)) throw new TypeError('INVALID_EXERCISE');
  const x={id:q.id,cardId:q.cardId,mode:q.mode,prompt:q.prompt,
    explanation:typeof q.explanation==='string'?q.explanation.slice(0,500):'',
    expected:typeof q.expected==='string'?q.expected.trim():'',
    acceptedAnswers:Array.isArray(q.acceptedAnswers)?q.acceptedAnswers:[],
    choices:Array.isArray(q.choices)?q.choices:[],
    audioText:typeof q.audioText==='string'?q.audioText:'',
    skillTags:[...SKILLS[q.mode]],
    rubricId:q.mode==='sentence'?'sentence-rubric-v1':null,
  };
  if(x.mode==='choice'){
    if(x.choices.length<2||x.choices.length>5||!x.choices.every(c=>isText(c,120))||
       !unique(x.choices)||!x.choices.includes(x.expected)) throw new TypeError('INVALID_CHOICES');
  }
  if(['spelling','fill','translation','listening'].includes(x.mode)&&
     !isText(x.expected,200)) throw new TypeError('MISSING_EXPECTED_ANSWER');
  if(x.mode==='translation'&&(!x.acceptedAnswers.length||
     x.acceptedAnswers.length>5||!x.acceptedAnswers.every(c=>isText(c,200))||
     !x.acceptedAnswers.some(c=>normalizeEnglish(c)===normalizeEnglish(x.expected))))
      throw new TypeError('INVALID_TRANSLATION_VARIANTS');
  if(x.mode==='listening'&&(!isText(x.audioText,200)||!x.audioText.toLowerCase().startsWith('en:')))
    throw new TypeError('INVALID_AUDIO_REFERENCE');
  return Object.freeze(x);
}
export function gradeExercise({exercise,response,ownerId,attemptId,audioDelivered=false,
   recalledRating=null,createdAt}) {
  const q=validateExercise(exercise);
  if(!isText(ownerId,100)||!isText(attemptId,100)||
     !(createdAt instanceof Date)||!Number.isFinite(createdAt.getTime()))
       throw new TypeError('INVALID_ATTEMPT');
  const base={ownerId,attemptId,exerciseId:q.id,cardId:q.cardId,mode:q.mode,
    timestamp:createdAt.toISOString(),skills:q.skillTags,evidenceStatus:'unassessed'};
  if(q.mode==='flip'){
    if(![1,2,3,4].includes(recalledRating))return {...base,status:'needs-self-rating',correct:null};
    return {...base,status:'self-rated',correct:null,recalledRating,
      note:'Self-rating updates FSRS, not automatic objective skill mastery'};
  }
  if(q.mode==='sentence'){
    if(!isText(response,2000))throw new TypeError('INVALID_SENTENCE');
    return {...base,status:'needs-human-review',correct:null,
      response:response.trim(),rubricId:q.rubricId};
  }
  if(!isText(response,500))throw new TypeError('INVALID_RESPONSE');
  if(q.mode==='listening'&&!audioDelivered)
    return {...base,status:'audio-unverified',correct:null,
      note:'Listening playback is not verified; cannot create listening score'};
  if(q.mode==='choice'&&!q.choices.includes(response.trim()))
    throw new TypeError('CHOICE_NOT_OFFERED');
  let outcome;
  if(q.mode==='translation'){
    outcome=q.acceptedAnswers.some(a=>normalizeEnglish(asciiApostrophe(a))===normalizeEnglish(asciiApostrophe(response)));
  }else{
    outcome=gradePractice({mode:q.mode,expected:asciiApostrophe(q.expected),answer:asciiApostrophe(response)}).correct;
  }
  return {...base,status:'objective-graded',correct:outcome,
    evidenceStatus:'observed',grader:'exact-match-v1',
    note:q.mode==='translation'?'Only configured equivalent translations are accepted':'',
    explanation:q.explanation};
}
export function proposeFeedback({draft,reviewerType='ai',comment,rubricChecks}){
  if(draft?.status!=='needs-human-review'||!isText(comment,500)||
     !['ai','template'].includes(reviewerType)||!Array.isArray(rubricChecks)||rubricChecks.length!==4||
     !rubricChecks.every(x=>x===true||x===false||x===null))
       throw new TypeError('INVALID_REVIEW_PROPOSAL');
  return {ownerId:draft.ownerId,attemptId:draft.attemptId,rubricId:draft.rubricId,
    reviewerType:reviewerType==='ai'?'ai-proposal':'template-proposal',rubricChecks:[...rubricChecks],comment:comment.trim(),
    state:'proposal-only',correct:null,evidenceStatus:'unassessed'};
}
export const RUBRIC=Object.freeze([
  {id:'meaning',criterion:'The intended meaning is clear'},
  {id:'grammar',criterion:'Grammar supports the intended meaning'},
  {id:'target',criterion:'Target vocabulary is used appropriately'},
  {id:'naturalness',criterion:'Sentence sounds natural in context'}
]);
export function confirmSentenceReview({draft,proposal,verifiedReviewer,approved,
    finalChecks,reviewedAt}) {
  if(draft?.status!=='needs-human-review'||proposal?.state!=='proposal-only'||
     proposal.ownerId!==draft.ownerId||proposal.attemptId!==draft.attemptId||
     verifiedReviewer?.trusted!==true||verifiedReviewer.ownerId!==draft.ownerId||
     verifiedReviewer.role!=='learner' || typeof approved!=='boolean'||
     !Array.isArray(finalChecks)||finalChecks.length!==4||
     !finalChecks.every(v=>typeof v==='boolean')||
     !(reviewedAt instanceof Date)||!Number.isFinite(reviewedAt.valueOf()))
     throw new TypeError('TRUSTED_HUMAN_REVIEW_REQUIRED');
  const pass=approved && finalChecks.every(Boolean);
  return {ownerId:draft.ownerId,attemptId:draft.attemptId,exerciseId:draft.exerciseId,
    mode:'sentence',status:'human-reviewed',correct:pass,
    evidenceStatus:'observed',grader:'verified-learner-review',
    rubricId:draft.rubricId,finalChecks:[...finalChecks],
    reviewedAt:reviewedAt.toISOString(),provisional:true,
    note:'This is a learner review, not professional CEFR certification'};
}
