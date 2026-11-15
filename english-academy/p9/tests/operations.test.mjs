import test from 'node:test';
import assert from 'node:assert/strict';
import {RELEASE_COMPONENTS,RELEASE_CRITERIA,getReleaseChecklist,prepareFormalRelease,
 verifyReleaseSequence} from '../release-readiness.mjs';
import {ALERT_CATALOG,createSanitizedHealthEvent,aggregateHealthSignals,
 reconcileAlertHistory} from '../health-monitor.mjs';
import {ROLLBACK_PLAN,createIncident,transitionIncident,prepareRollback,
 dryRunRollback} from '../incident-rollback.mjs';

const SHA='a'.repeat(40),NOW=new Date('2026-11-15T08:00:00Z');
const evt=(type,when=NOW)=>createSanitizedHealthEvent({type,component:'english-edge',
 at:when});
const incident=()=>createIncident({id:'ENG-0001',severity:'SEV1',
 type:'data',detectedAt:NOW,summary:'Synthetic owner isolation alert'});
test('P9 release scope inventory is ordered and explicit',()=>{
 assert.deepEqual(RELEASE_COMPONENTS.map(x=>x.id),[
 'supabase_schema','supabase_edge','private_site','github_main_merge','github_pages']);
 assert.equal(RELEASE_CRITERIA.length,7);
});
test('no evidence or owner approval means P9 readiness BLOCKED, no production deployment',()=>{
 const r=getReleaseChecklist({commitSha:SHA});
 assert.equal(r.candidateStatus,'BLOCKED');assert.equal(r.canDeploy,false);
 assert.equal(r.missing.length,7);assert.equal(r.steps.length,5);
 assert.ok(r.steps.every(x=>x.executed===false));
});
test('forged all-true readiness and approval flags cannot trigger deploy',()=>{
 const snapshot=Object.fromEntries(RELEASE_CRITERIA.map(x=>[x,true]));
 const approvals=RELEASE_COMPONENTS.map(x=>({
  scope:x.id,commitSha:SHA,ownerVerified:true,environment:'production'}));
 const x=getReleaseChecklist({commitSha:SHA,environment:'production',
   snapshot,approvals});
 assert.equal(x.missing.length,0);
 assert.equal(x.canDeploy,false);assert.equal(x.canMerge,false);
 assert.ok(x.steps.every(s=>s.approvedInRecord));
 assert.ok(x.steps.every(s=>s.executed===false));
});
test('wrong commit SHA and environment cannot be used as owner approval',()=>{
 const x=getReleaseChecklist({commitSha:SHA,approvals:[{
  scope:'supabase_schema',commitSha:'b'.repeat(40),ownerVerified:true,environment:'isolated'}]});
 assert.equal(x.steps[0].approvedInRecord,false);
});
test('P8 formal G01-G12 not verified blocks P9 release even when synthetics green',async()=>{
 const r=await prepareFormalRelease({commitSha:SHA});
 assert.equal(r.state,'BLOCKED');assert.equal(r.required,12);
 assert.equal(r.independentlyVerified,0);assert.equal(r.canDeploy,false);
 assert.equal(r.noDeploymentPerformed,true);
});
test('wrong release ordering is flagged but never modifies infrastructure',()=>{
 assert.equal(verifyReleaseSequence(RELEASE_COMPONENTS).valid,true);
 assert.equal(verifyReleaseSequence([...RELEASE_COMPONENTS].reverse()).valid,false);
 assert.equal(verifyReleaseSequence([]).noDeploymentPerformed,true);
});
test('sanitized monitor event strips arbitrary raw error / token / English sentence',()=>{
 const x=createSanitizedHealthEvent({type:'edge_5xx',component:'academy-edge',at:NOW,
  token:'super-secret',email:'abc@example.invalid',sentence:'I have eaten rice'});
 assert.deepEqual(Object.keys(x).sort(),['at','component','environment','type']);
 assert.ok(!JSON.stringify(x).includes('super-secret'));
});
test('no live telemetry cannot claim production monitoring activated',()=>{
 const x=aggregateHealthSignals({now:NOW,events:[]});
 assert.equal(x.status,'HEALTHY_IN_SAMPLE');
 assert.equal(x.liveMonitoringConfigured,false);
 assert.equal(x.noExternalNotificationSent,true);
});
test('server failure threshold triggers warning or critical only on windowed events',()=>{
 const events=Array.from({length:5},()=>evt('edge_5xx'));
 const x=aggregateHealthSignals({now:NOW,events});
 assert.equal(x.status,'CRITICAL');assert.equal(x.alerts.length,1);
 assert.equal(x.alerts[0].privateDataIncluded,false);
 assert.equal(x.alerts[0].threshold,ALERT_CATALOG.edge_5xx.threshold);
});
test('one cross-owner violation produces critical, older events ignored',()=>{
 const x=aggregateHealthSignals({now:NOW,events:[
  evt('cross_owner_violation'),evt('edge_5xx',new Date('2026-11-15T07:00:00Z'))]});
 assert.equal(x.counts.cross_owner_violation,1);
 assert.equal(x.counts.edge_5xx,0);
 assert.equal(x.status,'CRITICAL');
});
test('alerts dedupe within same observation bucket without erasing history',()=>{
 const a=aggregateHealthSignals({now:NOW,events:[evt('consent_bypass_attempt')]}).alerts;
 const b=reconcileAlertHistory([],a);
 const c=reconcileAlertHistory(b,a);
 assert.equal(b.length,1);assert.equal(c.length,1);
 assert.equal(c[0].acknowledged,false);
});
test('monitor rejects arbitrary / risky components, token-like text and unknown type',()=>{
 assert.throws(()=>createSanitizedHealthEvent({type:'edge_5xx',
  component:'user@example.invalid secret',at:NOW}),/INVALID_EVENT/);
 assert.throws(()=>createSanitizedHealthEvent({type:'password_exposed',
  component:'edge',at:NOW}),/INVALID_EVENT/);
});
test('incident starts detected with append-only audit history',()=>{
 const x=incident();
 assert.equal(x.state,'detected');assert.equal(x.history.length,1);
 assert.equal(x.productionMutated,false);assert.equal(x.requiresOwnerForChanges,true);
});
test('incident lifecycle accepts only sequential states and nondecreasing timestamps',()=>{
 const x=incident(),later=new Date(NOW.getTime()+1000);
 const y=transitionIncident(x,{state:'triaged',at:later,actor:'synthetic-review'});
 assert.equal(y.state,'triaged');assert.equal(y.history.length,2);
 assert.equal(x.state,'detected');assert.equal(x.history.length,1);
 assert.throws(()=>transitionIncident(y,{state:'recovered',at:later,
  actor:'reviewer'}),/INCIDENT_INVALID_TRANSITION/);
 assert.throws(()=>transitionIncident(y,{state:'contained',
  at:new Date('2026-11-14T00:00:00Z'),actor:'reviewer'}),/INCIDENT_INVALID_TRANSITION/);
});
test('rollback plan retains existing workbench/photo routes; destructive actions forbidden',()=>{
 const x=prepareRollback({incident:incident(),commitSha:SHA,
  existingToolInventory:['aiwb_overview','aiwb_get_task','list_projects','get_project']});
 assert.equal(x.warnings.includes('LEGACY_INVENTORY_NOT_VERIFIED'),false);
 assert.ok(x.prohibitedActions.includes('drop_english_tables'));
 assert.ok(x.prohibitedActions.includes('replace_entire_mcp_route'));
 assert.equal(x.canExecute,false);
 assert.equal(x.steps.length,ROLLBACK_PLAN.length);
});
test('missing old tool inventory generates fail-closed warning',()=>{
 const x=prepareRollback({incident:incident(),commitSha:SHA,existingToolInventory:[]});
 assert.ok(x.warnings.includes('LEGACY_INVENTORY_NOT_VERIFIED'));
 assert.ok(x.warnings.includes('INCIDENT_NOT_TRIAGED'));
});
test('fake owner approvals cannot execute any rollback in test code',()=>{
 const x=prepareRollback({incident:incident(),commitSha:SHA,
  authorizations:ROLLBACK_PLAN.map(p=>({scope:p.scope,commitSha:SHA,
   trustedVerifier:true,incidentId:'ENG-0001'}))});
 assert.ok(x.steps.every(s=>s.approvedOnRecord));
 assert.equal(x.hasPerformedRollback,false);assert.equal(x.canExecute,false);
 const good=dryRunRollback({plan:x});
 assert.equal(good.status,'SIMULATED_PASS');assert.equal(good.productionActions,0);
 assert.equal(good.databaseWrites,0);
});
test('rehearsal detects failed recovery step, no false success claims',()=>{
 const x=prepareRollback({incident:incident(),commitSha:SHA});
 const r=dryRunRollback({plan:x,simulatedFailures:['disable-english-mcp-namespace']});
 assert.equal(r.status,'SIMULATED_FAILURE');assert.equal(r.realRollbackPerformed,false);
 assert.throws(()=>dryRunRollback({plan:x,simulatedFailures:['drop_owner_data']}),
  /UNKNOWN_SIMULATED_STEP/);
});
