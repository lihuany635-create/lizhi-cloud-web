// P4 safe guided error review – uses known categories only, never free-text
// learner submissions as executable instructions or as authoritative facts.
const DRILL_TEMPLATES=Object.freeze({
 'present-perfect':{
   title:'現在完成式補強',skill:'grammar',prompt:'Choose the correct form: I ___ eaten.',
   options:['has','have','having'],correctIndex:1,
   explanation:'I 搭配 have + 過去分詞；he/she/it 才搭配 has。'
 },
 'past-participle':{
   title:'過去分詞練習',skill:'grammar',prompt:'Complete: She has ___ lunch.',
   options:['eat','ate','eaten'],correctIndex:2,
   explanation:'在 have/has 後面使用 eat 的過去分詞 eaten。'
 },
 'articles':{
   title:'冠詞練習',skill:'grammar',prompt:'Choose: I bought ___ apple.',
   options:['a','an','the apple'],correctIndex:1,
   explanation:'單數可數名詞前依語音選擇 a/an；apple 開頭母音音素用 an。'
 },
 'daily-food':{
   title:'生活用語與食物',skill:'vocabulary',prompt:'Which means「我餓了」?',
   options:['I am sleepy.','I am hungry.','I am happy.'],correctIndex:1,
   explanation:'hungry 是餓的；sleepy 是想睡的。'
 },
 'sentence-order':{
   title:'句型順序',skill:'writing',prompt:'Arrange a sentence with「I / eat / rice」.',
   options:[],correctIndex:null,
   explanation:'可以練習主詞 + 動詞 + 受詞，例如 I eat rice.；自由造句仍需人類或 AI 覆核。'
 }
});
export const ERROR_CATEGORIES=Object.freeze(Object.keys(DRILL_TEMPLATES));
export function suggestErrorDrills({ownerId,errors=[],asOf,maxDrills=4}={}){
 if(typeof ownerId!=='string'||!ownerId.trim()||
   !Number.isFinite(Date.parse(asOf))||!Number.isInteger(maxDrills)||maxDrills<1||maxDrills>10)
   throw new TypeError('INVALID_DRILL_CONTEXT');
 if(!Array.isArray(errors)||errors.length>1000)throw new TypeError('INVALID_ERRORS');
 const now=Date.parse(asOf),selected=new Map();
 for(const e of errors){
   if(e?.ownerId!==ownerId)throw new Error('OWNER_SCOPE_MISMATCH');
   if(!ERROR_CATEGORIES.includes(e.category))continue;
   const date=Date.parse(e.at);
   if(!Number.isFinite(date)||date>now)throw new TypeError('INVALID_ERROR_DATE');
   // Recent evidence within 90 days; no punishment for old or missing work.
   if(now-date>90*86400000)continue;
   if(typeof e.id!=='string'||!e.id.trim())throw new TypeError('INVALID_ERROR_ID');
   const bucket=selected.get(e.category)??{count:0,refs:[],lastAt:0};
   bucket.count++;bucket.refs.push(e.id);bucket.lastAt=Math.max(bucket.lastAt,date);
   selected.set(e.category,bucket);
 }
 return [...selected.entries()].sort((a,b)=>b[1].count-a[1].count||
   b[1].lastAt-a[1].lastAt||a[0].localeCompare(b[0]))
   .slice(0,maxDrills).map(([category,meta])=>{
     const t=DRILL_TEMPLATES[category];
     return {category,title:t.title,skill:t.skill,question:t.prompt,
       options:[...t.options],correctIndex:t.correctIndex,explanation:t.explanation,
       rationale:'根據 '+meta.count+' 筆已保存的同類練習錯誤推薦',
       evidenceRefs:[...new Set(meta.refs)].slice(0,5),
       grading:t.correctIndex===null?'subjective-review-required':'deterministic',
       status:'suggested-not-completed'};
   });
}
export function validateTeacherProposal({ownerId,proposal,allowedEvidenceIds=[]}={}){
 if(typeof ownerId!=='string'||!ownerId||!proposal||typeof proposal!=='object'||
   Array.isArray(proposal)||!Array.isArray(allowedEvidenceIds))
   throw new TypeError('INVALID_PROPOSAL');
 if(proposal.ownerId!==ownerId)throw new Error('OWNER_SCOPE_MISMATCH');
 if(!['vocabulary','grammar','reading','writing','listening','speaking'].includes(proposal.skill))
   throw new TypeError('UNKNOWN_SKILL');
 if(typeof proposal.explanation!=='string'||!proposal.explanation.trim()||
   proposal.explanation.length>500)throw new TypeError('INVALID_EXPLANATION');
 if(!Array.isArray(proposal.evidenceRefs)||proposal.evidenceRefs.length===0||
    proposal.evidenceRefs.length>10 ||
    proposal.evidenceRefs.some(id=>typeof id!=='string'||!allowedEvidenceIds.includes(id)))
   throw new TypeError('EVIDENCE_NOT_SUPPORTED');
 if(proposal.officialCefrLevel!==null && proposal.officialCefrLevel!==undefined)
   throw new Error('UNAUTHORIZED_CEFR_CLAIM');
 if(proposal.autoPromote===true||proposal.writeApproved===true||
    proposal.deleteHistory===true)throw new Error('UNAUTHORIZED_ACTION');
 return {valid:true,skill:proposal.skill,explanation:proposal.explanation,
   evidenceRefs:[...new Set(proposal.evidenceRefs)],status:'suggestion-only',
   userApprovalRequiredForChanges:true};
}
