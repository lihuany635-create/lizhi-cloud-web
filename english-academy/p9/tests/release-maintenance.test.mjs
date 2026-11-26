import test from 'node:test';
import assert from 'node:assert/strict';
import {assessP9ReleaseCandidate,assessReleaseScope,planCanaryDryRun,RELEASE_SCOPES,DEPLOYMENT_SEQUENCE} from '../release-coordinator.mjs';
import {MONITOR_METRICS,sanitizeTelemetry,evaluateHealthWindow,evaluateIncidentSequence,redactIncidentReport} from '../privacy-monitor.mjs';
import {buildRollbackDryRun,createMaintenanceRecord,appendMaintenanceRecord,assessLegacyToolInventory} from '../recovery-runbook.mjs';
import {GATES} from '../../p8/acceptance-matrix.mjs';
const SHA='a'.repeat(40),OLD='b'.repeat(40);
const metrics=(extra={})=>({
 requestCount:100,failureCount:0,p95LatencyMs:100,
 deniedAuthCount:0,syncConflictCount:0,unverifiedOwnerAttempts:0,
 legacyMissingTools:0,crossOwnerViolationCount:0,databaseRollbackFailures:0,...extra
});
test('P9 releases are always non-deploying, G01-G12 absent implies NO_GO',async()=>{
 const r=await assessP9ReleaseCandidate({commitSha:SHA});
 assert.equal(r.status,'NO_GO');
 assert.equal(r.p8bVerified,0);assert.equal(r.missingReal.length,GATES.length);
 assert.equal(r.canDeploy,false);assert.equal(r.canMergeMain,false);assert.equal(r.performedAction,false);
 assert.deepEqual(r.requiredReleaseScopes,RELEASE_SCOPES);
});
test('synthetic P8 proof for each gate never permits launch',async()=>{
 const proofs=GATES.map(g=>({requirement:g.requirement,commitSha:SHA,
  status:'passed',environment:'synthetic',checkedBy:'self',
  evidenceUrl:'https://ci.example.invalid/fake'}));
 const r=await assessP9ReleaseCandidate({commitSha:SHA,proofs},{verifyEvidence:async()=>true});
 assert.equal(r.p8bVerified,0);assert.equal(r.status,'NO_GO');
});
test('independently verified simulated proofs alone do not override blocked P7',async()=>{
 const proofs=GATES.map(g=>({requirement:g.requirement,commitSha:SHA,
  status:'passed',environment:'production-verified',checkedBy:'reviewer',
  evidenceUrl:'https://qa.example.invalid/evidence'}));
 const r=await assessP9ReleaseCandidate({commitSha:SHA,proofs},{verifyEvidence:async()=>true});
 assert.equal(r.p8bVerified,GATES.length);
 assert.equal(r.status,'NO_GO');
 assert.ok(r.p7Blockers.length>0);
 assert.equal(r.canDeploy,false);
});
test('all hypothetical independent checks only progress to separate owner approval',async()=>{
 const proofs=GATES.map(g=>({requirement:g.requirement,commitSha:SHA,
  status:'passed',environment:'production-verified',checkedBy:'independent',
  evidenceUrl:'https://qa.example.invalid/evidence'}));
 const snap=Object.fromEntries(['englishMainRoute','englishSchema','englishEdge',
  'oauthOwnerLink','siteCompatibility','independentSecurity','formalApproval',
  'backupRollback','androidVerified','mcpEndToEnd'].map(x=>[x,true]));
 const r=await assessP9ReleaseCandidate({commitSha:SHA,proofs,environmentSnapshot:snap},
  {verifyEvidence:async()=>true});
 assert.equal(r.status,'READY_FOR_SEPARATE_OWNER_APPROVAL');
 assert.equal(r.canDeploy,false);assert.equal(r.canModifySupabase,false);
 assert.equal(DEPLOYMENT_SEQUENCE.at(-1),'post_release_real_world_monitoring');
});
test('each scope fails closed without independent release review or owner approval',async()=>{
 const review={state:'READY_FOR_OWNER_APPROVAL',commitSha:SHA};
 const missing=await assessReleaseScope({review,scope:'github_pages',
  approvalToken:'fake',verifyOwnerApproval:async()=>true});
 assert.equal(missing.authorized,false);assert.equal(missing.performedAction,false);
 const fake=await assessReleaseScope({review,scope:'github_pages',
  approvalToken:'fake',verifyReleaseReview:async()=>true,
  verifyOwnerApproval:async()=>false});
 assert.equal(fake.authorized,false);
 const illegal=await assessReleaseScope({review,scope:'delete_data',
  approvalToken:'fake',verifyReleaseReview:async()=>true,verifyOwnerApproval:async()=>true});
 assert.equal(illegal.authorized,false);
});
test('simulated approved scope is still only an assertion, never a deployment',async()=>{
 const review={state:'READY_FOR_OWNER_APPROVAL',commitSha:SHA};
 const approved=await assessReleaseScope({review,scope:'supabase_schema',
  approvalToken:'synthetic-token',
  verifyReleaseReview:async()=>true,verifyOwnerApproval:async()=>true});
 assert.equal(approved.authorized,true);
 assert.equal(approved.canDeploy,false);assert.equal(approved.performedAction,false);
 assert.equal(approved.requiresSeparateOperatorExecution,true);
});
test('canary dry run contains hard-stop triggers and no production operations',()=>{
 const c=planCanaryDryRun({commitSha:SHA,expectedVersion:'english-p9-v1'});
 assert.equal(c.mode,'shadow-only');
 assert.equal(c.canDeploy,false);
 assert.ok(c.rollbackTriggers.some(x=>x.includes('cross-owner')));
 assert.equal(c.noAutomaticProductionAction,true);
});
test('telemetry strict allowlist removes all tokens, user and sentence fields',()=>{
 const x=sanitizeTelemetry({...metrics(),url:'https://private.example/?token=secret',
  email:'person@example.invalid',ownerId:'private-user',payload:'I havent eaten'});
 assert.equal(x.includesPersonalData,false);
 assert.equal(JSON.stringify(x).includes('secret'),false);
 assert.equal(JSON.stringify(x).includes('private-user'),false);
 assert.deepEqual(x.safeFields,MONITOR_METRICS);
 assert.ok(!('email' in x.metrics));
});
test('missing or inconsistent metrics fail closed rather than claim healthy',()=>{
 assert.throws(()=>sanitizeTelemetry({requestCount:100}),/INVALID_HEALTH_METRIC/);
 assert.throws(()=>sanitizeTelemetry(metrics({failureCount:101})),/INCONSISTENT_HEALTH_METRICS/);
 assert.throws(()=>sanitizeTelemetry(metrics({p95LatencyMs:-1})),/INVALID_HEALTH_METRIC/);
});
test('empty or tiny samples are warning, never labelled healthy',()=>{
 assert.equal(evaluateHealthWindow({sample:metrics({requestCount:0,failureCount:0})}).state,'warning');
 assert.equal(evaluateHealthWindow({sample:metrics({requestCount:10})}).state,'warning');
});
test('healthy synthetic metrics are healthy but NOT independently verified',()=>{
 const r=evaluateHealthWindow({sample:metrics()});
 assert.equal(r.state,'healthy');assert.equal(r.sampleVerified,false);
 assert.equal(r.automaticallyAlerted,false);
});
test('elevated failure ratio and latency are warnings; extreme ratios critical',()=>{
 assert.equal(evaluateHealthWindow({sample:metrics({failureCount:10})}).state,'warning');
 assert.equal(evaluateHealthWindow({sample:metrics({failureCount:21})}).state,'critical');
 assert.ok(evaluateHealthWindow({sample:metrics({p95LatencyMs:8000})})
  .blockers.includes('CRITICAL_LATENCY'));
});
test('cross-owner violation, lost tool or failed rollback is always critical',()=>{
 for(const extra of [{crossOwnerViolationCount:1},{legacyMissingTools:1},
  {databaseRollbackFailures:1},{unverifiedOwnerAttempts:1}]){
  const r=evaluateHealthWindow({sample:metrics({...extra,requestCount:10})});
  assert.equal(r.state,'critical');assert.equal(r.automaticallyRolledBack,false);
 }
});
test('two warning windows trigger review but do not dispatch notifications',()=>{
 const r=evaluateIncidentSequence([metrics({failureCount:8}),metrics({failureCount:8})]);
 assert.equal(r.severity,'SEV2');assert.equal(r.requireHumanReview,true);
 assert.equal(r.noNotificationsSent,true);
 const single=evaluateIncidentSequence([metrics({failureCount:8})]);
 assert.equal(single.severity,'OBSERVE');
});
test('health snapshots count loss as blocker; equal counts do not prove identity',()=>{
 const r=evaluateHealthWindow({sample:metrics(),expectedLegacyToolCount:8,
  observedLegacyToolCount:7});
 assert.equal(r.state,'critical');
 const equal=evaluateHealthWindow({sample:metrics(),expectedLegacyToolCount:8,
  observedLegacyToolCount:8});
 assert.equal(equal.state,'healthy');assert.equal(equal.sampleVerified,false);
});
test('incident log strips raw English sentence, owner/token and exact time',()=>{
 const r=redactIncidentReport({id:'P9-INC-001',severity:'SEV1',
  startedAt:'2026-11-15T09:12:33Z',affectedSubsystem:'english-api',
  commitSha:SHA,summary:'alice@example.invalid said I havent eaten; secret token abc'});
 assert.equal(JSON.stringify(r).includes('alice@'),false);
 assert.equal(JSON.stringify(r).includes('abc'),false);
 assert.equal(r.date,'2026-11-15');
 assert.equal(r.reported,false);
});
test('rollback dry run never drops private English tables or changes old Site',()=>{
 const r=buildRollbackDryRun({fromCommit:SHA,toCommit:OLD,
  affectedSubsystems:['english-ui','english-edge','legacy-site'],
  legacyToolsBefore:['aiwb_overview','list_projects'],
  legacyToolsAfter:['aiwb_overview','list_projects']});
 assert.equal(r.mode,'DRY_RUN_ONLY');assert.equal(r.changesProduction,false);
 assert.equal(r.rollsBackProduction,false);
 assert.equal(r.databaseDisposition,'PRESERVE_ALL_PRIVATE_DATA_NO_DROP');
 assert.ok(r.blockingConditions.includes('OWNER_RELEASE_APPROVAL_REQUIRED'));
});
test('lost legacy tool blocks recovery plan even with fake approvals',()=>{
 const r=buildRollbackDryRun({fromCommit:SHA,toCommit:OLD,
  affectedSubsystems:['english-mcp-adapter'],legacyToolsBefore:['aiwb_overview','list_projects'],
  legacyToolsAfter:['aiwb_overview'],ownerAuthorized:true,
  independentReviewVerified:true,backupVerified:true});
 assert.ok(r.blockingConditions.includes('LEGACY_TOOLS_MISSING'));
 assert.deepEqual(r.lostLegacyTools,['list_projects']);
});
test('baseline inventory compares exact names, not just counts',()=>{
 const r=assessLegacyToolInventory({before:['aiwb_get_task','list_projects'],
  after:['aiwb_get_task','english_sync']});
 assert.equal(r.state,'BLOCKED');
 assert.deepEqual(r.missing,['list_projects']);
 assert.equal(r.realToolCallsVerified,false);
});
test('maintenance records require clean URL and append-only unique IDs',()=>{
 const r=createMaintenanceRecord({id:'P9-MAINT-001',kind:'rollback-rehearsal',
  commitSha:SHA,environment:'isolated',summary:'Synthetic restoration exercise only',
  referenceUrl:'https://github.com/example/repo/actions/runs/1'});
 assert.equal(r.noApprovalImplied,true);
 const arr=appendMaintenanceRecord([],r);
 assert.equal(arr.length,1);
 assert.throws(()=>appendMaintenanceRecord(arr,r),/INVALID_MAINTENANCE_APPEND/);
 assert.throws(()=>createMaintenanceRecord({...r,id:'P9-MAINT-002',
  referenceUrl:'https://example.invalid/?token=secret'}),/INVALID_MAINTENANCE_RECORD/);
});
