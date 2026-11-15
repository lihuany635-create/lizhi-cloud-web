// P9 recovery rehearsal planner. Emits steps only and never runs them.
// Explicitly preserves old MCP tools, backups and private learning data.
const allowedSubsystems=new Set(['english-ui','english-edge','english-mcp-adapter','learning-schema','legacy-site']);
const safeCommit=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const unique=a=>new Set(a).size===a.length;
export function buildRollbackDryRun({fromCommit,toCommit,affectedSubsystems=[],
 legacyToolsBefore=[],legacyToolsAfter=[],backupVerified=false,
 independentReviewVerified=false,ownerAuthorized=false}={}){
 if(!safeCommit(fromCommit)||!safeCommit(toCommit)||
    fromCommit===toCommit||!Array.isArray(affectedSubsystems)||affectedSubsystems.length===0||
    affectedSubsystems.some(x=>!allowedSubsystems.has(x))||!unique(affectedSubsystems)||
    !Array.isArray(legacyToolsBefore)||!Array.isArray(legacyToolsAfter)||
    !legacyToolsBefore.every(x=>typeof x==='string'&&x.trim())||
    !legacyToolsAfter.every(x=>typeof x==='string'&&x.trim())||
    !unique(legacyToolsBefore)||!unique(legacyToolsAfter))throw new TypeError('INVALID_ROLLBACK_PLAN');
 const lostTools=legacyToolsBefore.filter(x=>!legacyToolsAfter.includes(x));
 const conditions=[];
 if(!backupVerified)conditions.push('BACKUP_RESTORE_NOT_REAL_VERIFIED');
 if(!independentReviewVerified)conditions.push('INDEPENDENT_REVIEW_REQUIRED');
 if(!ownerAuthorized)conditions.push('OWNER_RELEASE_APPROVAL_REQUIRED');
 if(lostTools.length)conditions.push('LEGACY_TOOLS_MISSING');
 const steps=[
  'Open incident record and identify exact release commit',
  'Disable newly introduced English routing and new mutations, not existing tools',
  'Freeze English requests and retain immutable audit evidence',
  'Verify legacy MCP tool IDs and URLs against pre-release inventory',
  'Verify known-good version and independently reviewed backup',
  'Seek owner approval before touching real services or restoring real records',
  'Operator restores approved prior English adapter and UI version only',
  'Independently verify original AI workbench, photos, Side and LiCut routes',
  'Verify owner identity and data isolation after restoration',
  'Write post-incident and owner-approval evidence'
 ];
 return Object.freeze({
  mode:'DRY_RUN_ONLY',fromCommit,toCommit,affectedSubsystems:[...affectedSubsystems],
  lostLegacyTools:lostTools,blockingConditions:conditions,
  steps,
  databaseDisposition:'PRESERVE_ALL_PRIVATE_DATA_NO_DROP',
  restoreBackupAutomatically:false,
  stopsExistingWorkflows:false,
  changesProduction:false,rollsBackProduction:false,
  requiresOperator:true,
  readyForOperatorReview:conditions.length===0
 });
}
export function createMaintenanceRecord({id,kind,commitSha,environment,summary,referenceUrl}={}){
 if(!/^P9-MAINT-[0-9]{3,5}$/.test(id??'')||
   !['inspection','patch-plan','incident','rollback-rehearsal','release-review'].includes(kind)||
   !safeCommit(commitSha)||
   !['isolated','approved-staging','production-observed'].includes(environment)||
   typeof summary!=='string'||!summary.trim()||summary.length>1000||
   typeof referenceUrl!=='string'||!/^https:\/\//.test(referenceUrl)||
   /[?#@]/.test(referenceUrl))throw new TypeError('INVALID_MAINTENANCE_RECORD');
 return Object.freeze({id,kind,commitSha,environment,summary,
   referenceUrl,status:'append-only-draft',noApprovalImplied:true});
}
export function appendMaintenanceRecord(history,record){
 if(!Array.isArray(history)||record?.status!=='append-only-draft'||
   history.some(x=>x.id===record.id))throw new TypeError('INVALID_MAINTENANCE_APPEND');
 return [...history,record];
}
export function assessLegacyToolInventory({before,after}={}){
 if(!Array.isArray(before)||!Array.isArray(after)||
   !before.every(x=>typeof x==='string'&&x.trim())||
   !after.every(x=>typeof x==='string'&&x.trim())||
   !unique(before)||!unique(after))throw new TypeError('INVALID_TOOL_INVENTORY');
 const missing=before.filter(name=>!after.includes(name));
 const added=after.filter(name=>!before.includes(name));
 return {state:missing.length?'BLOCKED':'CANDIDATE_COMPATIBLE',missing,added,
  unchanged:before.length-missing.length,
  realToolCallsVerified:false,
  readyForProduction:false};
}
