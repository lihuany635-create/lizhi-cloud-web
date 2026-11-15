// P8 acceptance ledger: strictly separates test evidence from real system verification.
// Pure evaluation only. NEVER deploy, merge, update secrets or write private data.
import { REQUIREMENTS, reviewReleaseEvidence, authorizeReleaseScope } from '../p5/release-gate.mjs';
import { evaluateP7Integration } from '../p7/integration-preflight.mjs';

export const GATES=Object.freeze(REQUIREMENTS.map((x,i)=>Object.freeze({
  id:'G'+String(i+1).padStart(2,'0'),
  requirement:x.id,
  label:x.label,
  stage:x.id.split('_')[0].toUpperCase(),
  environment:'real-production-or-approved-staging',
  mustHaveIndependentEvidence:true,
})));
export const FORMAL_STATES=Object.freeze(['NOT_TESTED','BLOCKED','FAILED','PASSED']);
const required=new Set(GATES.map(x=>x.id));
const SECURE=/^https:\/\//;
function safeEvidenceUrl(u){
 if(typeof u!=='string'||!SECURE.test(u))return false;
 try{const t=new URL(u);
  return !t.username&&!t.password&&!t.search&&!t.hash&&
   !['localhost','127.0.0.1'].includes(t.hostname);
 }catch{return false;}
}
function validSha(s){return typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);}
export function evaluateIsolatedChecks({commitSha,checks=[]}={}){
 if(!validSha(commitSha)||!Array.isArray(checks))throw new TypeError('INVALID_ISOLATED_INPUT');
 const known=new Set(['unit','browser','postgres','edge','mcp-legacy']);
 const seen=new Set(),out=[];
 for(const c of checks){
  if(!c||!known.has(c.id)||seen.has(c.id)||!['passed','failed','blocked','not-run'].includes(c.status))
    throw new TypeError('INVALID_ISOLATED_CHECK');
  seen.add(c.id);
  out.push(Object.freeze({id:c.id,status:c.status,environment:'synthetic',
   commitSha,source:'ci-isolated',doesNotVerifyProduction:true}));
 }
 return {commitSha,checks:out,
  isolatedPassed:out.length>0&&out.every(x=>x.status==='passed'),
  productionAccepted:0,canDeploy:false};
}
export function buildFormalAcceptanceMatrix({commitSha,isolated=[],formalStatus={}}={}){
 if(!validSha(commitSha)||!Array.isArray(isolated)||!formalStatus||
    typeof formalStatus!=='object'||Array.isArray(formalStatus))
     throw new TypeError('INVALID_ACCEPTANCE_INPUT');
 for(const [key,value] of Object.entries(formalStatus))
   if(!required.has(key)||!FORMAL_STATES.includes(value))
     throw new TypeError('INVALID_GATE_STATE');
 const rows=GATES.map(g=>({
   ...g,status:formalStatus[g.id]??'NOT_TESTED',
   evidenceVerified:false,
   isolatedCoverage:isolated.filter(x=>x?.coveredGates?.includes(g.id)).map(x=>({
    id:x.id,status:x.status,environment:'synthetic',productionVerified:false
   })),
   note:'Simulated or draft tests never count as formal acceptance',
 }));
 // Report status PASSED cannot be inferred from caller flags; it requires
 // a separately trusted signed/independent verification step.
 for(const row of rows)if(row.status==='PASSED'){
   row.status='BLOCKED';
   row.note='Caller claimed PASSED without independently verified production proof';
 }
 return {version:'p8-matrix-v1',commitSha,rows,
   formalVerified:0,formalTotal:GATES.length,formalStatus:'BLOCKED',
   unresolved:rows.filter(x=>x.status!=='PASSED').map(x=>x.id),
   canDeploy:false,canMergeMain:false,canUsePrivateData:false,
   evaluatedAs:'provisional-not-authoritative'};
}
export async function reviewFormalProofs({commitSha,version='p8-real-review',proofs=[]}={},{
 verifyEvidence
}={}){
 if(!validSha(commitSha))throw new TypeError('INVALID_COMMIT_SHA');
 // The P5 gate always uses an independently configured trust verifier.
 // Without that, this function must not generate a passing formal gate.
 if(typeof verifyEvidence!=='function'){
   return {version,commitSha,state:'BLOCKED',verifiedChecks:[],
     reason:'INDEPENDENT_EVIDENCE_VERIFIER_NOT_CONNECTED',canDeploy:false};
 }
 const r=await reviewReleaseEvidence({version,commitSha,proofs},{verifyEvidence});
 return {...r,formalVerified:r.verifiedChecks.length,formalTotal:GATES.length,
   requiresOwnerReleaseApproval:true,canDeploy:false};
}
export async function reviewReleaseConsent(review,{
 scope,approvalToken,verifyOwnerApproval,verifyReleaseReview
}={}){
 // This merely checks a trust callback. No merge/deploy/storage action exists.
 const r=await authorizeReleaseScope(review,{scope,approvalToken,
   verifyOwnerApproval,verifyReleaseReview});
 return {...r,performedDeployment:false};
}
export function evaluatePreflight({commitSha,envSnapshot}={}){
 if(!validSha(commitSha))throw new TypeError('INVALID_COMMIT_SHA');
 const p7=evaluateP7Integration(envSnapshot);
 return {commitSha,p7,action:'HOLD',
   gate:'NOT_AUTHORIZED_FOR_PRODUCTION',
   requiredFormalGates:GATES.length,
   formalPassed:0,
   canDeploy:false,canMergeMain:false};
}
export function createP8Defect({id,title,severity,gate,source,evidenceUrl='',details=''}={}){
 if(!/^P8-[0-9]{3,5}$/.test(id??'')||typeof title!=='string'||!title.trim()||
    title.length>180||!['critical','high','medium','low'].includes(severity)||
    !required.has(gate)||!['synthetic','real-verified','review'].includes(source)||
    (evidenceUrl!==''&&!safeEvidenceUrl(evidenceUrl))||
    typeof details!=='string'||details.length>2000)
      throw new TypeError('INVALID_DEFECT_RECORD');
 return Object.freeze({id,title:title.trim(),severity,gate,source,evidenceUrl,
   details,status:'open',immutable:true});
}
export function appendP8Defect(history,defect){
 if(!Array.isArray(history)||!defect||defect.immutable!==true||
   history.some(x=>x.id===defect.id))throw new TypeError('INVALID_APPEND_ONLY_DEFECT');
 return [...history,defect];
}
