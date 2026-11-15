// P5 release gate. Evaluation alone NEVER deploys or grants permission.
// Trust anchors are injected by an independently configured verifier. In this
// repository every test verifier is synthetic and MUST NOT be used in production.
export const REQUIREMENTS = Object.freeze([
 ['p1_google_oauth','本人 Google OAuth 與無效／未授權帳號拒絕'],
 ['p1_real_rls','正式資料庫真實 RLS 與跨 owner 拒絕'],
 ['p1_android','Android 實機登入／導航／發音'],
 ['p2_fsrs_persistence','FSRS 排程與歷史在正式資料庫一致且可還原'],
 ['p2_assessment','客觀／主觀題型、六技能測驗與覆核'],
 ['p3_chatgpt_mcp','ChatGPT 真實 MCP 工具端到端同步'],
 ['p3_oauth_metadata','實際 OAuth token、audience、client 與撤銷'],
 ['p4_real_adaptation','真實學習資料驅動適性建議及 AI 覆核'],
 ['p5_security','獨立技術與安全審查'],
 ['p5_legacy_regression','既有讀書室／工作台／照片工具／圖書館回歸'],
 ['p5_disaster_restore','備份、完整還原與回退演練'],
 ['p5_end_to_end','從對話到正式卡、作答、FSRS、課程調整全鏈測試']
].map(([id,label])=>Object.freeze({id,label})));
const ALLOWED_SCOPES=Object.freeze(['github_main_merge','supabase_schema','supabase_edge','private_site','github_pages']);
const validSha=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const validHttps=x=>typeof x==='string'&&/^https:\/\/[^\s#?]+/.test(x);

export async function reviewReleaseEvidence({version,commitSha,proofs=[]}={},{
 verifyEvidence,
}={}) {
 if(!validSha(commitSha)||typeof version!=='string'||!version.trim()||
   !Array.isArray(proofs)||typeof verifyEvidence!=='function')
   throw new TypeError('UNTRUSTED_RELEASE_REVIEW');
 const missing=[],rejected=[],accepted=[];
 const byId=new Map();
 for(const proof of proofs){
   if(!proof||typeof proof!=='object'||typeof proof.requirement!=='string')continue;
   if(!REQUIREMENTS.some(x=>x.id===proof.requirement))continue;
   if(byId.has(proof.requirement)){rejected.push(proof.requirement+':DUPLICATE');continue;}
   byId.set(proof.requirement,proof);
 }
 for(const requirement of REQUIREMENTS){
   const p=byId.get(requirement.id);
   if(!p){missing.push(requirement.id);continue;}
   if(p.status!=='passed'||p.commitSha!==commitSha||!validHttps(p.evidenceUrl)||
      p.environment!=='production-verified' || p.checkedBy==='self'){
      rejected.push(requirement.id+':NOT_PRODUCTION_VERIFIED');continue;
   }
   let verified=false;
   try{verified=await verifyEvidence({requirementId:requirement.id,proof:p,commitSha})===true;}catch{}
   if(!verified)rejected.push(requirement.id+':INDEPENDENT_VERIFICATION_FAILED');
   else accepted.push(requirement.id);
 }
 return {version,commitSha,verifiedChecks:accepted,missing,rejected,
   state:missing.length||rejected.length?'BLOCKED':'READY_FOR_OWNER_APPROVAL',
   readyToDeploy:false,releaseApproved:false,
   evaluatedWith:'trusted-evidence-callback-required'};
}
export async function authorizeReleaseScope(review,{scope,approvalToken,verifyOwnerApproval}={}){
 if(review?.state!=='READY_FOR_OWNER_APPROVAL'||!validSha(review.commitSha)||
    !ALLOWED_SCOPES.includes(scope)||typeof verifyOwnerApproval!=='function'||
    typeof approvalToken!=='string'||!approvalToken){
   return {authorized:false,reason:'NOT_APPROVED'};
 }
 let authorized=false;
 try{
   authorized=await verifyOwnerApproval({commitSha:review.commitSha,
     scope,approvalToken})===true;
 }catch{}
 return {authorized,reason:authorized?'TRUSTED_OWNER_APPROVAL_VERIFIED':'OWNER_APPROVAL_NOT_VERIFIED',
    scope,commitSha:review.commitSha,noDeploymentPerformed:true};
}
