// P4 deterministic adaptive teaching engine – pure, anonymous-data candidate.
// No LLM, network calls, account access, CEFR certification or DB mutation.
export const SKILLS=Object.freeze(['vocabulary','grammar','reading','writing','listening','speaking']);
export const LEVELS=Object.freeze(['A0','A1','A2','B1','B2','C1','C2']);
const SKILL_SET=new Set(SKILLS);
const LEVEL_SET=new Set(LEVELS);
const DAY=86400000;
const dateMs=v=>v instanceof Date?v.getTime():typeof v==='string'?Date.parse(v):NaN;
const goodDate=v=>Number.isFinite(dateMs(v));
const round=x=>Math.round(x*100)/100;
function validOwner(row,owner,label){
 if(!row||typeof row!=='object'||row.ownerId!==owner)throw new Error('OWNER_SCOPE_MISMATCH:'+label);
}
function validTime(row,field,asOf,label){
 const t=dateMs(row[field]);
 if(!Number.isFinite(t)||t>asOf)throw new TypeError('INVALID_OR_FUTURE_DATE:'+label);
 return t;
}
function safeRows(rows,owner,label){
 if(!Array.isArray(rows)||rows.length>5000)throw new TypeError('INVALID_DATASET:'+label);
 for(const row of rows)validOwner(row,owner,label);
 return rows;
}
export function analyzeSkills({ownerId,evidence=[],errors=[],asOf}){
 if(typeof ownerId!=='string'||!ownerId.trim()||!goodDate(asOf))throw new TypeError('INVALID_CONTEXT');
 const now=dateMs(asOf);
 const e=safeRows(evidence,ownerId,'evidence');
 const errs=safeRows(errors,ownerId,'errors');
 const seenActivities=new Set();
 const summary=Object.fromEntries(SKILLS.map(skill=>[skill,{
   skill,state:'not-tested',observations:0,correctRate:null,priority:0,
   weaknessEvidenceIds:[],errorCount:0,cefrLevel:null
 }]));
 const sums=Object.fromEntries(SKILLS.map(s=>[s,{weighted:0,total:0}]));
 for(const row of e){
   if(!SKILL_SET.has(row.skill)||row.state!=='observed')continue;
   if(typeof row.activityId!=='string'||row.activityId.length<2)throw new TypeError('INVALID_ACTIVITY_ID');
   const at=validTime(row,'observedAt',now,'evidence');
   if(typeof row.score!=='number'||row.score<0||row.score>1||!Number.isFinite(row.score)||
     typeof row.weight!=='number'||row.weight<=0||row.weight>1||!Number.isFinite(row.weight))
     throw new TypeError('INVALID_SCORE');
   const key=row.skill+'|'+row.activityId;
   if(seenActivities.has(key))continue;
   seenActivities.add(key);
   const s=summary[row.skill];
   s.state='observed';
   s.observations++;
   // A mild recency adjustment prevents very old results from dominating,
   // but does not erase learning history or punish missed days.
   const days=Math.max(0,(now-at)/DAY);
   const recency=0.5+0.5*Math.exp(-days/60);
   const weight=row.weight*recency;
   sums[row.skill].weighted+=row.score*weight;
   sums[row.skill].total+=weight;
   if(row.score<0.6)s.weaknessEvidenceIds.push(row.activityId);
 }
 const seenErrors=new Set();
 for(const row of errs){
   if(!SKILL_SET.has(row.skill))continue;
   const at=validTime(row,'at',now,'error');
   if(typeof row.id!=='string'||!row.id.trim())throw new TypeError('INVALID_ERROR_ID');
   if(seenErrors.has(row.id))continue;
   seenErrors.add(row.id);
   if(now-at>90*DAY)continue;
   const s=summary[row.skill];
   s.errorCount++;
   s.weaknessEvidenceIds.push(row.id);
 }
 for(const skill of SKILLS){
   const s=summary[skill];
   if(sums[skill].total>0)s.correctRate=round(sums[skill].weighted/sums[skill].total);
   // No reliable conclusion from one or two observations.
   if(s.observations>=3){
     s.priority=round((1-s.correctRate)*60+
       Math.min(5,s.errorCount)*5);
   }else{
     s.priority=Math.min(12,s.errorCount*3);
   }
   s.weaknessEvidenceIds=[...new Set(s.weaknessEvidenceIds)].slice(0,20);
 }
 return summary;
}
export function selectDueCards({ownerId,cards=[],asOf,maxCards=30}){
 if(!goodDate(asOf)||!Number.isInteger(maxCards)||maxCards<1||maxCards>100)
   throw new TypeError('INVALID_DUE_QUERY');
 const now=dateMs(asOf);
 const rows=safeRows(cards,ownerId,'cards');
 const byId=new Map();
 for(const card of rows){
   if(typeof card.cardId!=='string'||!card.cardId.trim()||!goodDate(card.dueAt))
     throw new TypeError('INVALID_REVIEW_CARD');
   const due=dateMs(card.dueAt);
   if(card.scheduleStatus==='suspended'||due>now)continue;
   const old=byId.get(card.cardId);
   if(!old||due<old.dueAt)byId.set(card.cardId,{cardId:card.cardId,dueAt:due});
 }
 return [...byId.values()].sort((a,b)=>a.dueAt-b.dueAt||
   a.cardId.localeCompare(b.cardId)).slice(0,maxCards).map(x=>({
   cardId:x.cardId,dueAt:new Date(x.dueAt).toISOString(),
 }));
}
function chooseWeakSkill(skillAnalysis){
 return SKILLS.map(skill=>skillAnalysis[skill])
   .filter(x=>x.state==='observed'&&x.observations>=3)
   .sort((a,b)=>b.priority-a.priority||SKILLS.indexOf(a.skill)-SKILLS.indexOf(b.skill))[0]??null;
}
export function createAdaptiveDailyPlan({
 ownerId,asOf,goalMinutes=20,evidence=[],errors=[],reviewCards=[],
 lessons=[],completedLessonIds=[],lastSessionAt=null,skillPreference=null
}){
 if(typeof ownerId!=='string'||!ownerId.trim()||!goodDate(asOf)||
   !Number.isInteger(goalMinutes)||goalMinutes<5||goalMinutes>90)
   throw new TypeError('INVALID_PLAN_CONTEXT');
 if(skillPreference!==null&&!SKILL_SET.has(skillPreference))throw new TypeError('UNKNOWN_SKILL_PREFERENCE');
 if(!Array.isArray(completedLessonIds))throw new TypeError('INVALID_COMPLETION');
 const completed=new Set(completedLessonIds);
 const skills=analyzeSkills({ownerId,evidence,errors,asOf});
 const due=selectDueCards({ownerId,cards:reviewCards,asOf,maxCards:100});
 const focus=skillPreference??chooseWeakSkill(skills)?.skill??'vocabulary';
 const knownEvidence=skills[focus].state==='observed'&&skills[focus].observations>=3;
 const at=dateMs(asOf);
 const last=lastSessionAt===null?null:dateMs(lastSessionAt);
 if(lastSessionAt!==null&&(!Number.isFinite(last)||last>at))
   throw new TypeError('INVALID_LAST_SESSION');
 const hiatusDays=last===null?null:Math.floor((at-last)/DAY);
 const gentleRestart=hiatusDays!==null&&hiatusDays>=7;
 const tasks=[];
 let budget=goalMinutes;
 const reviewMin=due.length?Math.min(budget,Math.max(3,Math.min(15,Math.ceil(due.length*1.5)))):0;
 if(reviewMin){
   tasks.push({type:'review',minutes:reviewMin,cardIds:due.slice(0,Math.max(1,Math.floor(reviewMin/1.5))).map(c=>c.cardId),
     evidenceRefs:due.slice(0,3).map(c=>c.cardId),
     reason:'來自 FSRS 已到期的單字卡；逾期不扣分'});
   budget-=reviewMin;
 }
 const relevantLessons=safeRows(lessons,ownerId,'lessons')
   .filter(x=>!completed.has(x.id)&&x.skills?.includes(focus))
   .sort((a,b)=>(LEVELS.indexOf(a.level)-LEVELS.indexOf(b.level))||a.id.localeCompare(b.id));
 const fallbackLessons=safeRows(lessons,ownerId,'lessons')
   .filter(x=>!completed.has(x.id)&&!relevantLessons.includes(x))
   .sort((a,b)=>(LEVELS.indexOf(a.level)-LEVELS.indexOf(b.level))||a.id.localeCompare(b.id));
 const lesson=(relevantLessons[0]??fallbackLessons[0]??null);
 if(lesson && budget>0){
   if(!LEVEL_SET.has(lesson.level)||!Array.isArray(lesson.skills)||
      lesson.skills.some(skill=>!SKILL_SET.has(skill)))
     throw new TypeError('INVALID_LESSON');
   const recommended=Math.max(3,Math.min(gentleRestart?8:12,lesson.minutes??8));
   const minutes=Math.min(budget,recommended);
   tasks.push({type:'lesson',lessonId:lesson.id,minutes,focusSkill:focus,
     reason:knownEvidence?'依技能紀錄推薦加強；不表示正式程度降級':'先累積實際證據，不假設英文程度',
     evidenceRefs:knownEvidence?skills[focus].weaknessEvidenceIds.slice(0,5):[]});
   budget-=minutes;
 }
 if(budget>0){
   tasks.push({type:gentleRestart?'light-conversation':'practice',minutes:budget,
     focusSkill:focus,reason:gentleRestart?'中斷後以短時間、無懲罰的練習重新開始':
       skillPreference?'依本人指定的技能練習':'由已觀測證據或初始探索安排',
     evidenceRefs:knownEvidence?skills[focus].weaknessEvidenceIds.slice(0,5):[]});
   budget=0;
 }
 return {ownerId,plannedFor:new Date(at).toISOString(),goalMinutes,allocatedMinutes:tasks.reduce((n,t)=>n+t.minutes,0),
   focusSkill:focus,focusBasis:skillPreference?'user-preference':knownEvidence?'observed-weakness':'initial-exploration',
   hiatusDays,gentleRestart,dueCount:due.length,tasks,
   skillSummary:skills,officialCefrLevel:null,
   status:'suggested-not-completed',policyVersion:'p4-adaptive-v1'};
}
