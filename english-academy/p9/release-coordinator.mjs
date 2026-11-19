// P9 non-deploying release coordinator. Real rollout must be a separately
// approved operator action after P8-B independent verification.
import {GATES,reviewFormalProofs,reviewReleaseConsent} from '../p8/acceptance-matrix.mjs';
import {evaluateP7Integration} from '../p7/integration-preflight.mjs';

export const RELEASE_SCOPES=Object.freeze([
 'supabase_schema','supabase_edge','private_site','github_main_merge','github_pages'
]);
const validSha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const flags=Object.freeze({
 canDeploy:false,canMergeMain:false,canModifySupabase:false,
 canUpdateSite:false,performedAction:false
});
export const DEPLOYMENT_SEQUENCE=Object.freeze([
 'independent_security_review',
 'owner_authorizes_test_environment',
 'backups_and_restore_drill',
 'owner_authorizes_schema',
 'staging_schema_rls_and_identity_evidence',
 'owner_authorizes_edge',
 'staging_edge_and_formal_approval_evidence',
 'owner_authorizes_private_site',
 'site_preservation_and_mcp_evidence',
 'complete_p8b_g01_to_g12',
 'owner_authorizes_main_merge',
 'owner_authorizes_pages',
 'post_release_real_world_monitoring'
]);

// A gate is allowed to be reviewed, not deployed, only when ALL independent,
// environment-bound, commit-bound proofs have been independently verified.
// Even then a distinct verified owner consent is required for EACH scope.
export async function assessP9ReleaseCandidate({commitSha,proofs=[],
  environmentSnapshot={},version='p9-dry-run'}={},{
    verifyEvidence
  }={}) {
 if(!validSha(commitSha))throw new TypeError('INVALID_RELEASE_SHA');
 const p7=evaluateP7Integration(environmentSnapshot);
 const real=await reviewFormalProofs({commitSha,proofs,version},{verifyEvidence});
 const missingReal=GATES.filter(g=>!real.verifiedChecks?.includes(g.requirement)).map(g=>g.id);
 const readyForSeparateApproval=real.state==='READY_FOR_OWNER_APPROVAL'&&
   p7.blockers.length===0&&missingReal.length===0;
 return Object.freeze({
  version,commitSha,
  status:readyForSeparateApproval?'READY_FOR_SEPARATE_OWNER_APPROVAL':'NO_GO',
  p8bVerified:real.verifiedChecks?.length??0,
  p8bRequired:GATES.length,missingReal,
  p7Blockers:[...p7.blockers],
  requiredReleaseScopes:[...RELEASE_SCOPES],
  requiredIndependentApproval:true,
  nextSteps:readyForSeparateApproval?
    ['Owner must authorize each release scope for the exact commit and environment']:
    ['Obtain independent P8-B evidence','Complete P7 safety gates','Request separate owner approvals'],
  ...flags
 });
}
export async function assessReleaseScope({review,scope,approvalToken,
  verifyOwnerApproval,verifyReleaseReview
}={}) {
 if(!RELEASE_SCOPES.includes(scope))return {...flags,scope,authorized:false,reason:'UNKNOWN_SCOPE'};
 const result=await reviewReleaseConsent(review,{scope,approvalToken,verifyOwnerApproval,verifyReleaseReview});
 return {...flags,scope,authorized:result.authorized===true,
    reason:result.reason??'NOT_APPROVED',
    requiresSeparateOperatorExecution:true};
}
export function planCanaryDryRun({commitSha,expectedVersion,shadowOnly=true}={}){
 if(!validSha(commitSha)||typeof expectedVersion!=='string'||!expectedVersion.trim())
   throw new TypeError('INVALID_CANARY_PLAN');
 return Object.freeze({
  commitSha,expectedVersion,mode:shadowOnly?'shadow-only':'unapproved-preview',
  preconditions:[
   'True independent approval and G01-G12 confirmation',
   'Restore-tested backup and verified rollback artifact',
   'Owner scoped approvals for each production mutation',
   'Pre/post legacy tools snapshots and negative auth checks'
  ],
  rollbackTriggers:[
   'Any cross-owner leak or unauthorized write',
   'Loss of any existing Site tool or main route',
   'Data corruption or failed confirmed consent',
   'Unrecoverable error or failed real health check'
  ],
  noAutomaticProductionAction:true,...flags
 });
}
