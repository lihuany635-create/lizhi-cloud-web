/**
 * Incremental-cost preflight for the isolated AI-loop prototype.
 * NO provider SDK, credentials, entitlement mutation, service activation or network.
 * A success receipt is NOT authorization to deploy, spend, call MCP, or run AUTO.
 * Only a real provider billing cap can guarantee billing outcomes.
 */
import {createHash} from 'node:crypto';

export class CostGuardError extends Error {
  constructor(code) { super(code); this.name='CostGuardError'; this.code=code; }
}
const requireOk=(condition,code)=>{if(!condition)throw new CostGuardError(code);};
const cleanId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x);
const choices=Object.freeze({
  local_sandbox_test:{provider:'local',network:false},
  github_public_standard_ci:{provider:'github',network:true},
  existing_workbench_readonly:{provider:'workbench',network:true},
});
const forbidden=/^(?:openai_paid_api|create_deployment|enable_cron|create_secret|upgrade_plan|write_business_data|invoke_ai_model)$/;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export class ZeroNewSpendPreflight {
  constructor({projectId,getTrustedUsage,now=Date.now,usageMaxAgeMs=5*60*1000,minimumRemaining=2}){
    requireOk(cleanId(projectId)&&typeof getTrustedUsage==='function'&&typeof now==='function', 'INVALID_POLICY');
    requireOk(Number.isSafeInteger(usageMaxAgeMs)&&usageMaxAgeMs>0&&usageMaxAgeMs<=300000,'INVALID_POLICY');
    requireOk(Number.isSafeInteger(minimumRemaining)&&minimumRemaining>=1,'INVALID_POLICY');
    this.projectId=projectId;this.getTrustedUsage=getTrustedUsage;this.now=now;
    this.usageMaxAgeMs=usageMaxAgeMs;this.minimumRemaining=minimumRemaining;
  }
  async examine(input){
    // Never trust client-provided usage, auth, freeTier, price, or project overrides.
    requireOk(input&&typeof input==='object'&&!Array.isArray(input),'INVALID_REQUEST');
    const {projectId,operation,mode='OFF',riskTier='L0',newPaidApi=false,
      newSubscription=false,writeBusinessData=false,deploy=false,enableCron=false,
      additionalCostNtd=0,externalModel=false}=input;
    requireOk(projectId===this.projectId,'PROJECT_NOT_ALLOWED');
    requireOk(typeof operation==='string'&&!forbidden.test(operation)&&!!choices[operation],'OPERATION_DENIED');
    requireOk(mode==='MANUAL','AUTO_DISABLED');
    requireOk(riskTier==='L0'&&newPaidApi===false&&newSubscription===false&&
      writeBusinessData===false&&deploy===false&&enableCron===false&&
      externalModel===false&&additionalCostNtd===0,'NEW_SPEND_OR_RISK_DENIED');
    const selected=choices[operation];
    if(!selected.network)return Object.freeze({
      projectId,operation,kind:'LOCAL_ONLY',incrementalBudgetNtd:0,
      costEligibility:'LOCAL_SANDBOX_ONLY',authorApproved:false,
      executionAuthorized:false,networkCallAuthorized:false,autoEnabled:false,
    });
    let proof;
    try{proof=await this.getTrustedUsage(selected.provider);}catch{throw new CostGuardError('USAGE_UNVERIFIED');}
    // In production the supplied function must come from a trusted SERVER that validates
    // plan, billable usage, hard caps and account identity, not an app/browser callback.
    requireOk(proof&&typeof proof==='object'&&!Array.isArray(proof),'USAGE_UNVERIFIED');
    const time=this.now();
    requireOk(Number.isSafeInteger(time)&&Number.isSafeInteger(proof.checkedAt)&&
      proof.checkedAt<=time&&time-proof.checkedAt<=this.usageMaxAgeMs,'USAGE_STALE');
    requireOk(proof.provider===selected.provider&&proof.projectId===projectId&&
      proof.source==='TRUSTED_SERVER_METER'&&proof.accountPlanVerified===true,
      'USAGE_UNVERIFIED');
    requireOk(proof.overageChargesDisabled===true&&proof.planUpgradeRequired===false&&
      proof.estimatedAdditionalCostNtd===0,'NEW_SPEND_OR_RISK_DENIED');
    requireOk(Number.isSafeInteger(proof.used)&&Number.isSafeInteger(proof.freeLimit)&&
      proof.used>=0&&proof.freeLimit>0&&proof.used+this.minimumRemaining<=proof.freeLimit,
      'FREE_TIER_LIMIT_UNKNOWN_OR_NEAR');
    if(selected.provider==='github')requireOk(proof.repoVisibility==='public'&&
      proof.runnerClass==='standard-hosted'&&proof.largerRunner===false&&
      proof.billableArtifactStorage===false,'BILLING_CONFIGURATION_UNVERIFIED');
    if(selected.provider==='workbench')requireOk(proof.readOnlyCapVerified===true&&
      proof.signedInOwnerVerified===true,'BILLING_CONFIGURATION_UNVERIFIED');
    const allowlistedSummary={projectId,operation,checkedAt:proof.checkedAt,
      freeLimit:proof.freeLimit,used:proof.used,provider:selected.provider};
    return Object.freeze({
      ...allowlistedSummary,proofDigest:digest(allowlistedSummary),
      kind:'REMOTE_PRECHECK_ONLY',incrementalBudgetNtd:0,
      costEligibility:'FREE_TIER_PRECHECK_ONLY',authorApproved:false,
      executionAuthorized:false,networkCallAuthorized:false,autoEnabled:false,
    });
  }
}
