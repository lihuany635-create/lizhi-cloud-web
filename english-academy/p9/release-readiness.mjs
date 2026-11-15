// P9-A deployment readiness evaluator. Pure, non-deploying.
import {GATES,reviewFormalProofs} from '../p8/acceptance-matrix.mjs';
export const OPERATIONS_VERSION='p9-ops-candidate-v1';
const SHA=/^[a-f0-9]{40}$/;
export const RELEASE_COMPONENTS=Object.freeze([
  {id:'supabase_schema',name:'English schema + RLS + private consent RPC'},
  {id:'supabase_edge',name:'Undeployed English Edge + secrets verification'},
  {id:'private_site',name:'Existing private Site MCP compatible additive route'},
  {id:'github_main_merge',name:'Merge reviewed candidate to main'},
  {id:'github_pages',name:'Publish existing GitHub Pages site'}
]);
export const RELEASE_CRITERIA=Object.freeze([
  'all_12_independently_verified',
  'current_commit_pinned',
  'scope_bound_owner_approval',
  'legacy_inventory_match',
  'staged_backups_verified',
  'real_android_and_mcp_complete',
  'rollback_plan_reviewed'
]);
const flag=(x,k)=>x&&x[k]===true;
export function getReleaseChecklist({commitSha,environment='isolated',
  snapshot={},approvals=[]}={}){
 if(!SHA.test(commitSha??'')||!['isolated','staging','production'].includes(environment)||
  !snapshot||typeof snapshot!=='object'||Array.isArray(snapshot)||
  !Array.isArray(approvals))throw new TypeError('INVALID_RELEASE_SNAPSHOT');
 const approvalByScope=new Map(approvals.filter(a=>a&&typeof a==='object'&&
   RELEASE_COMPONENTS.some(c=>c.id===a.scope)&&a.commitSha===commitSha&&
   a.ownerVerified===true&&a.environment===environment).map(a=>[a.scope,a]));
 const steps=RELEASE_COMPONENTS.map(c=>({
   ...c,approvedInRecord:approvalByScope.has(c.id),
   status:approvalByScope.has(c.id)?'record-only-needs-independent-check':'approval-required',
   executed:false
 }));
 const criteria=Object.fromEntries(RELEASE_CRITERIA.map(k=>[k,flag(snapshot,k)]));
 const missing=Object.entries(criteria).filter(([,v])=>!v).map(([k])=>k);
 return {version:OPERATIONS_VERSION,commitSha,environment,
   criteria,missing,steps,requiredFormalGates:GATES.length,
   candidateStatus:missing.length?'BLOCKED':'READY_TO_REQUEST_INDEPENDENT_RELEASE_CHECK',
   productionStatus:'NOT_DEPLOYED',
   canDeploy:false,canMerge:false,
   note:'Client flags and purported approval records do not perform or authorize any deployment'};
}
export async function prepareFormalRelease({commitSha,proofs=[],verifyEvidence}={}){
 if(!SHA.test(commitSha??''))throw new TypeError('INVALID_COMMIT');
 // No trustworthy verifier can be provided by GitHub CI test fixtures in production.
 const r=await reviewFormalProofs({commitSha,version:OPERATIONS_VERSION,proofs},{verifyEvidence});
 return {commitSha,state:r.state,
   independentlyVerified:r.verifiedChecks?.length??0,
   required:GATES.length,ownerApprovalStillRequired:true,
   noDeploymentPerformed:true,canDeploy:false,
   blockers:r.missing??GATES.map(g=>g.requirement)};
}
export function verifyReleaseSequence(steps=[]){
 if(!Array.isArray(steps))throw new TypeError('INVALID_SEQUENCE');
 const expected=RELEASE_COMPONENTS.map(x=>x.id);
 const ids=steps.map(x=>typeof x==='string'?x:x?.id);
 return {valid:ids.length===expected.length&&ids.every((x,i)=>x===expected[i]),
   expected,provided:ids,noDeploymentPerformed:true};
}
