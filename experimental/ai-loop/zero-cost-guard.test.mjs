import test from 'node:test';
import assert from 'node:assert/strict';
import {ZeroNewSpendPreflight,CostGuardError} from './zero-cost-guard.mjs';

const P='61b88bec-9b3e-49e6-8780-d073fc816516';
const NOW=2500000;
const request=(operation='github_public_standard_ci')=>({projectId:P,operation,mode:'MANUAL'});
const usage=(overrides={})=>({provider:'github',projectId:P,source:'TRUSTED_SERVER_METER',
  accountPlanVerified:true,overageChargesDisabled:true,planUpgradeRequired:false,
  estimatedAdditionalCostNtd:0,used:10,freeLimit:1000,checkedAt:NOW,
  repoVisibility:'public',runnerClass:'standard-hosted',largerRunner:false,
  billableArtifactStorage:false,...overrides});
const make=(overrides={})=>new ZeroNewSpendPreflight({projectId:P,now:()=>NOW,
  getTrustedUsage:async()=>usage(overrides)});
const rejects=(cb,code)=>assert.rejects(cb,e=>e instanceof CostGuardError&&e.code===code);

test('COST-01 local sandbox may be classified without external meter, never authorizes execution',async()=>{
 const g=new ZeroNewSpendPreflight({projectId:P,getTrustedUsage:async()=>{throw Error('no meter');},now:()=>NOW});
 const r=await g.examine(request('local_sandbox_test'));
 assert.equal(r.costEligibility,'LOCAL_SANDBOX_ONLY');
 assert.equal(r.executionAuthorized,false);assert.equal(r.incrementalBudgetNtd,0);
});
test('COST-02 public standard GitHub Actions receives conditional precheck, not spending permission',async()=>{
 const r=await make().examine(request());assert.equal(r.costEligibility,'FREE_TIER_PRECHECK_ONLY');
 assert.equal(r.authorApproved,false);assert.equal(r.networkCallAuthorized,false);
 assert.equal(r.used,10);assert.equal(r.freeLimit,1000);
});
test('COST-03 default OFF and AUTO both refuse remote execution precheck',async()=>{
 await rejects(()=>make().examine({projectId:P,operation:'github_public_standard_ci'}),'AUTO_DISABLED');
 await rejects(()=>make().examine({...request(),mode:'AUTO'}),'AUTO_DISABLED');
});
test('COST-04 denies unapproved external model and paid API',async()=>{
 for(const k of ['newPaidApi','externalModel'])await rejects(()=>make().examine({...request(),[k]:true}),'NEW_SPEND_OR_RISK_DENIED');
});
test('COST-05 denies new subscription and planned cost',async()=>{
 for(const data of [{newSubscription:true},{additionalCostNtd:1}])await rejects(()=>make().examine({...request(),...data}),'NEW_SPEND_OR_RISK_DENIED');
});
test('COST-06 denies any deployment, cron or business data write',async()=>{
 for(const k of ['deploy','enableCron','writeBusinessData'])await rejects(()=>make().examine({...request(),[k]:true}),'NEW_SPEND_OR_RISK_DENIED');
});
test('COST-07 denies risk tiers other than L0',async()=>{
 for(const riskTier of ['L1','L2','L3'])await rejects(()=>make().examine({...request(),riskTier}),'NEW_SPEND_OR_RISK_DENIED');
});
test('COST-08 denies known cost-creating operations before metering',async()=>{
 for(const operation of ['openai_paid_api','create_deployment','enable_cron','create_secret','upgrade_plan','write_business_data','invoke_ai_model'])
   await rejects(()=>make().examine(request(operation)),'OPERATION_DENIED');
});
test('COST-09 denies unknown operation and cross-project',async()=>{
 await rejects(()=>make().examine(request('unapproved')),'OPERATION_DENIED');
 await rejects(()=>make().examine({...request(),projectId:'OTHER'}),'PROJECT_NOT_ALLOWED');
});
test('COST-10 denies absent trusted provider meter',async()=>{
 const g=new ZeroNewSpendPreflight({projectId:P,now:()=>NOW,getTrustedUsage:async()=>null});
 await rejects(()=>g.examine(request()),'USAGE_UNVERIFIED');
});
test('COST-11 denies forged source or incorrect project even if free',async()=>{
 for(const data of [{source:'USER_INPUT'},{projectId:'OTHER'},{provider:'not_github'},{accountPlanVerified:false}])
   await rejects(()=>make(data).examine(request()),'USAGE_UNVERIFIED');
});
test('COST-12 denies stale or future-dated usage evidence',async()=>{
 for(const checkedAt of [NOW-300001,NOW+1])await rejects(()=>make({checkedAt}).examine(request()),'USAGE_STALE');
});
test('COST-13 denies overage enabled, required upgrade and nonzero estimated charge',async()=>{
 for(const data of [{overageChargesDisabled:false},{planUpgradeRequired:true},{estimatedAdditionalCostNtd:0.01}])
  await rejects(()=>make(data).examine(request()),'NEW_SPEND_OR_RISK_DENIED');
});
test('COST-14 rejects near free tier limit',async()=>{
 await rejects(()=>make({used:999}).examine(request()),'FREE_TIER_LIMIT_UNKNOWN_OR_NEAR');
 await rejects(()=>make({used:-1}).examine(request()),'FREE_TIER_LIMIT_UNKNOWN_OR_NEAR');
});
test('COST-15 GitHub runner must be standard in public repo',async()=>{
 for(const data of [{repoVisibility:'private'},{runnerClass:'larger'},{largerRunner:true},{billableArtifactStorage:true}])
  await rejects(()=>make(data).examine(request()),'BILLING_CONFIGURATION_UNVERIFIED');
});
test('COST-16 existing workbench read needs owner + read-only verified evidence',async()=>{
 const r=request('existing_workbench_readonly');
 const good=usage({provider:'workbench',signedInOwnerVerified:true,readOnlyCapVerified:true});
 const policy=new ZeroNewSpendPreflight({projectId:P,now:()=>NOW,getTrustedUsage:async()=>good});
 const out=await policy.examine(r);assert.equal(out.executionAuthorized,false);
 for(const data of [{readOnlyCapVerified:false},{signedInOwnerVerified:false}]){
  const x=new ZeroNewSpendPreflight({projectId:P,now:()=>NOW,getTrustedUsage:async()=>({...good,...data})});
  await rejects(()=>x.examine(r),'BILLING_CONFIGURATION_UNVERIFIED');
 }
});
test('COST-17 provider errors do not leak secrets',async()=>{
 const policy=new ZeroNewSpendPreflight({projectId:P,now:()=>NOW,
  getTrustedUsage:async()=>{throw Error('SECRET_INTERNAL_PROVIDER_TOKEN');}});
 await rejects(()=>policy.examine(request()),'USAGE_UNVERIFIED');
});
test('COST-18 caller-supplied fake usage does not override trusted meter',async()=>{
 await rejects(()=>make({used:999}).examine({...request(),usage:{used:0,freeLimit:999999},authenticated:true,ownerApproved:true}),
  'FREE_TIER_LIMIT_UNKNOWN_OR_NEAR');
});
