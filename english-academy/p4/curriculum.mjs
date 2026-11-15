// P4 curriculum and skill-specific progression proposal.
// CEFR stages are learning references, not official CEFR certification.
import {SKILLS,LEVELS} from './adaptive-planner.mjs';

const LESSONS=Object.freeze([
 {id:'a0-greetings',level:'A0',title:'打招呼與介紹自己',skills:['vocabulary','speaking'],minutes:7,
   outcomes:['用 Hello 打招呼','練習 I am... 簡短句']},
 {id:'a0-food',level:'A0',title:'食物與餓了怎麼說',skills:['vocabulary','reading'],minutes:8,
   outcomes:['區分 rice、hungry','說明 I am hungry.']},
 {id:'a1-daily',level:'A1',title:'分享一天的生活',skills:['grammar','writing'],minutes:10,
   outcomes:['正確區分現在與過去','用 3 個短句敘述日常']},
 {id:'a1-listening',level:'A1',title:'聽懂簡單邀約',skills:['listening'],minutes:9,
   outcomes:['聽取日期與時間資訊','重述邀約細節']},
 {id:'a2-perfect',level:'A2',title:'I have eaten 的表達',skills:['grammar','writing'],minutes:11,
   outcomes:['區分 have eaten 與 ate','修改常見完成式錯誤']},
 {id:'a2-directions',level:'A2',title:'問路與方位',skills:['listening','speaking'],minutes:10,
   outcomes:['聽懂方向詞','口語說明簡單路線']},
 {id:'b1-experience',level:'B1',title:'分享一次學習經驗',skills:['speaking','writing'],minutes:12,
   outcomes:['說明事件順序','表達個人感受與理由']},
 {id:'b1-reading',level:'B1',title:'理解生活新聞段落',skills:['reading'],minutes:12,
   outcomes:['識別主旨','用自己的話摘要']},
 {id:'b2-opinions',level:'B2',title:'比較兩種看法',skills:['reading','speaking'],minutes:12,
   outcomes:['提取論證依據','提出支持與反對理由']},
 {id:'b2-technical',level:'B2',title:'說明技術流程',skills:['vocabulary','writing'],minutes:12,
   outcomes:['使用轉折與因果語詞','書寫清楚的流程說明']},
 {id:'c1-proposal',level:'C1',title:'撰寫完整改善提案',skills:['writing','grammar'],minutes:14,
   outcomes:['整合多項證據','提出限制與風險']},
 {id:'c1-debate',level:'C1',title:'進階討論與回應',skills:['speaking','listening'],minutes:14,
   outcomes:['精準理解對方觀點','以不同角度回應']},
 {id:'c2-nuance',level:'C2',title:'語氣與隱含意思',skills:['reading','listening'],minutes:15,
   outcomes:['比較微妙語氣差異','依脈絡解讀非字面意思']},
 {id:'c2-synthesis',level:'C2',title:'長篇論述與精煉表達',skills:['writing','speaking'],minutes:15,
   outcomes:['整合複雜觀點','依不同聽眾調整說法']}
]);
const LEVELS_SET=new Set(LEVELS);
const SKILL_SET=new Set(SKILLS);
const validTimestamp=t=>Number.isFinite(Date.parse(t));

export function listCurriculum({ownerId,completedIds=[]}={}){
 if(typeof ownerId!=='string'||!ownerId.trim()||!Array.isArray(completedIds))
   throw new TypeError('INVALID_CURRICULUM_REQUEST');
 const complete=new Set(completedIds);
 return LESSONS.map(x=>({...x,ownerId,status:complete.has(x.id)?'completed':'available',
   outcomes:[...x.outcomes],skills:[...x.skills]}));
}
export function buildSkillRoadmap({ownerId,completedIds=[],currentLevels={}}={}){
 const lessons=listCurriculum({ownerId,completedIds});
 const out={};
 for(const skill of SKILLS){
   const current=currentLevels[skill]??null;
   if(current!==null&&!LEVELS_SET.has(current))throw new TypeError('INVALID_CURRENT_LEVEL');
   out[skill]={observedLevel:current,certifiedLevel:null,
     stageStatus:current?'recorded-learner-level':'unassessed',
     totalLessons:lessons.filter(l=>l.skills.includes(skill)).length,
     completedLessons:lessons.filter(l=>l.skills.includes(skill)&&l.status==='completed').length,
     recommendedLessonIds:lessons.filter(l=>l.skills.includes(skill)&&l.status!=='completed')
       .filter(l=>current===null||LEVELS.indexOf(l.level)<=LEVELS.indexOf(current)+1)
       .slice(0,3).map(x=>x.id)};
 }
 return out;
}
function daysFor(entries){
 return new Set(entries.map(x=>new Date(x.observedAt).toISOString().slice(0,10))).size;
}
export function proposeSkillAdvancement({
 ownerId,skill,currentLevel,evidence=[],verifiedAssessments=[]
}){
 if(!SKILL_SET.has(skill)||!LEVELS_SET.has(currentLevel)||typeof ownerId!=='string'||!ownerId)
   throw new TypeError('INVALID_LEVEL_CONTEXT');
 if(!Array.isArray(evidence)||!Array.isArray(verifiedAssessments))throw new TypeError('INVALID_EVIDENCE');
 // Both evidence and assessments must be pre-scoped by the trusted backend.
 for(const row of [...evidence,...verifiedAssessments]){
   if(row?.ownerId!==ownerId)throw new Error('OWNER_SCOPE_MISMATCH');
 }
 const currentIndex=LEVELS.indexOf(currentLevel);
 const nextLevel=LEVELS[currentIndex+1]??null;
 if(!nextLevel)return {skill,currentLevel,nextLevel:null,status:'top-stage',officialCertification:null};
 const matching=evidence.filter(x=>x.skill===skill&&x.state==='observed'&&
   typeof x.score==='number'&&x.score>=0&&x.score<=1&&validTimestamp(x.observedAt));
 const unique=new Map(matching.map(x=>[x.activityId,x]));
 const assessments=verifiedAssessments.filter(x=>x.skill===skill&&x.level===nextLevel&&
   x.verificationSource==='trusted-assessment-service'&&x.rubricVersion==='p4-rubric-v1'&&
   x.passed===true&&validTimestamp(x.issuedAt));
 const uniqueAssessments=new Set(assessments.map(x=>x.assessmentId));
 const evidenceDays=daysFor([...unique.values()]);
 // The proposal is not a promotion. Even with evidence, a trusted
 // backend must enforce provenance and record human/approved decisions.
 const needs=[];
 if(unique.size<6||evidenceDays<2)needs.push('MORE_MULTI_DAY_PRACTICE_EVIDENCE');
 if(uniqueAssessments.size<2)needs.push('TWO_RUBRIC_BACKED_ASSESSMENTS');
 if(['speaking','listening'].includes(skill) &&
   !assessments.every(x=>x.deliveryVerified===true))needs.push('VERIFIED_VOICE_OR_AUDIO_SESSION');
 return {skill,currentLevel,nextLevel,
   status:needs.length?'insufficient-evidence':'ready-for-manual-review',
   reasons:needs,observations:unique.size,evidenceDays,
   verifiedAssessments:uniqueAssessments.size,
   officialCertification:null,autoPromoted:false};
}
