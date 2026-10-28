/**
 * P3 v1.9 OFFLINE-REVIEW-ONLY retention inventory for the candidate D1 ledger.
 * No DELETE/UPDATE/INSERT or cleanup scheduling; no true billing meter.
 * Never publish this as an API without an independently verified owner session.
 */
export const RETENTION_PROJECT='61b88bec-9b3e-49e6-8780-d073fc816516';
export class RetentionInventoryError extends Error {
 constructor(code){super(code);this.name='RetentionInventoryError';this.code=code;}
}
const need=(ok,code)=>{if(!ok)throw new RetentionInventoryError(code);};
const safeOwner=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x);
const counts=['total','revoked','expired','potentiallyActive','replayLocks'];
const auditCounts=['total','olderThanCandidate'];
async function first(db,sql,...args){
 try{return await db.prepare(sql).bind(...args).first();}
 catch{throw new RetentionInventoryError('INVENTORY_READ_FAILED');}
}
function validate(row,fields){
 need(row&&typeof row==='object','INVENTORY_READ_FAILED');
 for(const k of fields)need(Number.isSafeInteger(row[k])&&row[k]>=0,'INVALID_INVENTORY_COUNTS');
}
export async function previewRetention({
 db,owner,projectId=RETENTION_PROJECT,now=Date.now(),candidateDays=30
}={}){
 need(db&&typeof db.prepare==='function','READONLY_DATABASE_REQUIRED');
 need(safeOwner(owner),'OWNER_INVALID');
 need(projectId===RETENTION_PROJECT,'PROJECT_DENIED');
 need(Number.isSafeInteger(now)&&now>0,'CLOCK_INVALID');
 need(Number.isSafeInteger(candidateDays)&&candidateDays>=1&&candidateDays<=90,'RETENTION_POLICY_INVALID');
 const cutoff=now-candidateDays*24*60*60*1000;
 need(Number.isSafeInteger(cutoff)&&cutoff>=0,'CLOCK_INVALID');
 // All queries are SELECT-only and scoped by both verified owner and fixed project ID.
 const g=await first(db,`SELECT COUNT(*) AS total,
  COALESCE(SUM(CASE WHEN revoked=1 THEN 1 ELSE 0 END),0) AS revoked,
  COALESCE(SUM(CASE WHEN expires<=? THEN 1 ELSE 0 END),0) AS expired,
  COALESCE(SUM(CASE WHEN revoked=0 AND expires>? AND state IN ('ISSUED','RUNNING') THEN 1 ELSE 0 END),0) AS potentiallyActive,
  COALESCE(SUM(CASE WHEN request_id IS NOT NULL THEN 1 ELSE 0 END),0) AS replayLocks
  FROM ai_loop_grants_v15 WHERE owner=? AND project=?`,now,now,owner,projectId);
 const a=await first(db,`SELECT COUNT(*) AS total,
  COALESCE(SUM(CASE WHEN a.at<? THEN 1 ELSE 0 END),0) AS olderThanCandidate
  FROM ai_loop_audit_v15 a
  INNER JOIN ai_loop_grants_v15 g ON g.id=a.grant_id
  WHERE g.owner=? AND g.project=?`,cutoff,owner,projectId);
 validate(g,counts);validate(a,auditCounts);
 need(g.revoked<=g.total&&g.expired<=g.total&&g.potentiallyActive<=g.total&&g.replayLocks<=g.total,'INVALID_INVENTORY_COUNTS');
 need(a.olderThanCandidate<=a.total,'INVALID_INVENTORY_COUNTS');
 return Object.freeze({
  projectId,scope:'LOCAL_READONLY_PREVIEW',candidateDays,cutoff,
  grants:{total:g.total,revoked:g.revoked,expired:g.expired,potentiallyActive:g.potentiallyActive,replayLocks:g.replayLocks},
  audit:{total:a.total,olderThanCandidate:a.olderThanCandidate},
  requestReplayProtection:'PRESERVE_GRANT_TOMBSTONES',
  auditCleanup:'OWNER_APPROVAL_AND_ARCHIVE_REQUIRED',
  unlinkedAuditRows:'NOT_ASSESSED',
  liveD1Consistency:'NOT_TESTED',
  actualSiteQuota:'NOT_VERIFIED',
  deletionAuthorized:false,scheduledCleanup:false,
  deploymentAuthorized:false,authorApproved:false,
  message:'Inventory only: do not delete replay-lock grant rows or audit evidence automatically.'
 });
}
