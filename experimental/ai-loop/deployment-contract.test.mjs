import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCandidateFiles,readCandidateFiles,ContractViolation,TARGET_PROJECT} from './deployment-contract.mjs';

const base=readCandidateFiles();
const rejectCode=(f,code)=>assert.throws(f,e=>e instanceof ContractViolation&&e.code===code);
const changed=(k,a,b)=>({...base,[k]:base[k].replace(a,b)});
const requireContains=(k,txt)=>assert.ok(base[k].includes(txt),'Expected baseline missing: '+k);
test('SHIP-01 current PR candidate passes all nine structural checks, never authorizes production',()=>{
 const r=inspectCandidateFiles(base);
 assert.equal(r.result,'STATIC_CANDIDATE_CONTRACT_PASS');
 assert.equal(r.checkedCount,9);
 assert.equal(r.projectId,TARGET_PROJECT);
 assert.equal(r.deploymentApproved,false);
 assert.equal(r.enabled,false);
 assert.equal(r.liveOwnerAuthorization,'NOT_TESTED');
 assert.equal(r.actualSiteQuota,'NOT_VERIFIED');
});
test('SHIP-02 default-OFF switch changed to fail open must fail CI',()=>{
 const key="AI_LOOP_MANUAL_ENABLED!=='true'";requireContains('route',key);
 rejectCode(()=>inspectCandidateFiles(changed('route',key,"AI_LOOP_MANUAL_ENABLED==='false'")),'DEPLOY_DEFAULT_DISABLED');
});
test('SHIP-03 removing trusted verifier even if header is present must fail CI',()=>{
 const key="typeof verifyIngress!=='function'";requireContains('route',key);
 rejectCode(()=>inspectCandidateFiles(changed('route',key,'typeof verifyIngress===\'function\'')),'DEPLOY_INGRESS_REQUIRED');
});
test('SHIP-04 removing principal expiry or revoke check must fail CI',()=>{
 for(const marker of ['principal.expiresAt>this.now()','principal.revoked!==true','principal.isAnonymous!==true']){
  requireContains('host',marker);
  rejectCode(()=>inspectCandidateFiles(changed('host',marker,'true')),'DEPLOY_INGRESS_REQUIRED');
 }
});
test('SHIP-05 allowlisting write tools or foreign project must fail CI',()=>{
 const tool="'get_project_handoff'";requireContains('host',tool);
 rejectCode(()=>inspectCandidateFiles(changed('host',tool,"'append_work_record'")),'DEPLOY_TOOLS_READONLY');
 const project="export const PROJECT='"+TARGET_PROJECT+"'";
 requireContains('host',project);
 rejectCode(()=>inspectCandidateFiles(changed('host',project,"export const PROJECT='other-project'")),'DEPLOY_PROJECT_LOCK');
});
test('SHIP-06 Bridge redirect auto-follow fails CI',()=>{
 const key="redirect:'manual'";requireContains('host',key);
 rejectCode(()=>inspectCandidateFiles(changed('host',key,"redirect:'follow'")),'DEPLOY_BRIDGE_FIXED_REDIRECT_DENIED');
});
test('SHIP-07 introducing SQL mutations fails CI',()=>{
 rejectCode(()=>inspectCandidateFiles({...base,sql:base.sql+'\nDELETE FROM animation_projects;\n'}),'DEPLOY_SQL_ADDITIVE_ONLY');
 rejectCode(()=>inspectCandidateFiles({...base,sql:base.sql+'\nCREATE TABLE extra_table(a TEXT);\n'}),'DEPLOY_SQL_ADDITIVE_ONLY');
});
test('SHIP-08 changing workflow to privileged or adding cron fails CI',()=>{
 requireContains('workflow','contents: read');
 rejectCode(()=>inspectCandidateFiles(changed('workflow','contents: read','contents: write')),'DEPLOY_CI_READONLY');
 rejectCode(()=>inspectCandidateFiles({...base,workflow:base.workflow+'\n  schedule:\n    - cron: "0 0 * * *"\n'}),'DEPLOY_CI_READONLY');
});
test('SHIP-09 removing non-destructive retention safeguards fails CI',()=>{
 requireContains('retention','deletionAuthorized:false');
 rejectCode(()=>inspectCandidateFiles(changed('retention','deletionAuthorized:false','deletionAuthorized:true')),'DEPLOY_RETENTION_READONLY');
});
test('SHIP-10 cannot rewrite isolated evidence as live success',()=>{
 const key="liveE2e:'NOT_TESTED'";requireContains('evidence',key);
 rejectCode(()=>inspectCandidateFiles(changed('evidence',key,"liveE2e:'PASS'")),'DEPLOY_NOT_E2E_PROOF');
});
test('SHIP-11 missing or malformed source fails closed',()=>{
 rejectCode(()=>inspectCandidateFiles({route:base.route}),'SOURCE_MISSING');
 rejectCode(()=>inspectCandidateFiles({}),'SOURCE_MISSING');
});
