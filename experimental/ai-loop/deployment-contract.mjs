/**
 * Safety contract for an UNDEPLOYED, SINGLE-PROJECT manual Worker candidate.
 * Static CI tripwire, NOT a trusted authorization system or provider billing check.
 * Never interprets caller-supplied claims as proof of owner approval.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';

export const TARGET_PROJECT='61b88bec-9b3e-49e6-8780-d073fc816516';
export const CANDIDATE_PATHS=Object.freeze({
  route:'production/source/app/api/ai-loop/route.ts',
  host:'production/source/lib/ai-loop-v15.mjs',
  sql:'production/source/sql/ai-loop-v15-candidate.sql',
  retention:'experimental/ai-loop/retention-inventory.mjs',
  workflow:'.github/workflows/ai-loop-sandbox.yml',
  evidence:'experimental/ai-loop/acceptance-evidence.mjs'
});
const paths=Object.values(CANDIDATE_PATHS);
export class ContractViolation extends Error{
 constructor(code){super(code);this.name='ContractViolation';this.code=code;}
}
const need=(condition,code)=>{if(!condition)throw new ContractViolation(code);};
const matches=(text,re)=>re.test(text);
export function readCandidateFiles(root=resolve(dirname(fileURLToPath(import.meta.url)),'../..')){
 const files={};for(const [key,path] of Object.entries(CANDIDATE_PATHS))
   files[key]=readFileSync(join(root,path),'utf8');
 return files;
}
export function inspectCandidateFiles(files){
 need(files&&typeof files==='object','FILES_MISSING');
 for(const k of Object.keys(CANDIDATE_PATHS))need(typeof files[k]==='string'&&files[k].length>30,'SOURCE_MISSING');
 const {route,host,sql,retention,workflow,evidence}=files;
 const checks={};
 function check(id,value){need(Boolean(value),id);checks[id]=true;}
 check('DEPLOY_PROJECT_LOCK',
   host.includes(`export const PROJECT='${TARGET_PROJECT}'`) &&
   retention.includes(`export const RETENTION_PROJECT='${TARGET_PROJECT}'`) &&
   !route.includes('export const revalidate=0'));
 // The only allowed command surface: three owner-scoped read operations.
 check('DEPLOY_TOOLS_READONLY',
   matches(host,/export const TOOLS=Object\.freeze\(\['list_projects','get_project_context','get_project_handoff'\]\)/) &&
   matches(host,/need\(TOOLS\.includes\(tool\),'TOOL_DENIED'\)/) &&
   !matches(route,/\b(?:GET|PUT|PATCH|DELETE)\s*\(/));
 // Fail closed if the temporary MANUAL switch has not explicitly been enabled.
 check('DEPLOY_DEFAULT_DISABLED',
   route.includes("AI_LOOP_MANUAL_ENABLED!=='true'") &&
   route.includes("error:'WORKER_DISABLED'") &&
   route.includes("status:503"));
 // A server callback MUST validate owner; a literal user ID header is never sufficient.
 check('DEPLOY_INGRESS_REQUIRED',
   route.includes("typeof verifyIngress!=='function'") &&
   route.includes("error:'INGRESS_VERIFIER_REQUIRED'") &&
   host.includes("typeof verifyIngress==='function'") &&
   host.includes("this.verifyIngress(req)") &&
   host.includes("principal.subjectId===this.owner") &&
   host.includes("principal.expiresAt>this.now()") &&
   host.includes("principal.revoked!==true") &&
   host.includes("principal.isAnonymous!==true"));
 // Credentials cannot ride redirects or leave the fixed Bridge endpoint.
 check('DEPLOY_BRIDGE_FIXED_REDIRECT_DENIED',
   host.includes("const base='https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production'") &&
   host.includes("redirect:'manual'") &&
   host.includes("SOURCE_REDIRECT_DENIED") &&
   !host.includes("redirect:'follow'") &&
   !host.includes("redirect:'error'"));
 // The SQL is an unreleased, additive-only candidate; no migration of existing tables.
 const executableSql=sql.split('\n').filter(line=>!line.trim().startsWith('--')).join('\n');
 check('DEPLOY_SQL_ADDITIVE_ONLY',
   matches(executableSql,/CREATE TABLE ai_loop_grants_v15\s*\(/) &&
   matches(executableSql,/CREATE TABLE ai_loop_audit_v15\s*\(/) &&
   !matches(executableSql,/\b(?:DROP|ALTER|DELETE|UPDATE|INSERT|TRUNCATE|REPLACE|ATTACH|PRAGMA)\b/i) &&
   (executableSql.match(/\bCREATE TABLE\b/gi)||[]).length===2);
 // No mutating retention helper or background pruning.
 check('DEPLOY_RETENTION_READONLY',
   retention.includes("deletionAuthorized:false") &&
   retention.includes("scheduledCleanup:false") &&
   retention.includes("PRESERVE_GRANT_TOMBSTONES") &&
   !matches(retention,/\b(?:db\.exec|db\.batch|db\.transaction|fetch\s*\()/));
 // Existing CI is allowed to test, never deploy, and is not billed as a special runner.
 check('DEPLOY_CI_READONLY',
   matches(workflow,/permissions:\s*\n\s*contents:\s*read/) &&
   workflow.includes('runs-on: ubuntu-latest') &&
   workflow.includes('experimental/ai-loop/acceptance-evidence.mjs') &&
   !matches(workflow,/\b(?:schedule:|cron:|wrangler deploy|npm run deploy|cloudflare\/wrangler-action|\bsecrets\.)/i));
 check('DEPLOY_NOT_E2E_PROOF',
   evidence.includes("liveE2e:'NOT_TESTED'") &&
   evidence.includes("authorApproved:false") &&
   evidence.includes("independentAiWorkers:false"));
 need(paths.length===6,'POLICY_CHANGED');
 return Object.freeze({
  result:'STATIC_CANDIDATE_CONTRACT_PASS',
  checks:Object.freeze(checks),
  checkedCount:Object.keys(checks).length,
  projectId:TARGET_PROJECT,
  liveOwnerAuthorization:'NOT_TESTED',
  actualSiteQuota:'NOT_VERIFIED',
  liveD1:'NOT_TESTED',
  deploymentApproved:false,
  enabled:false,
  paidApiApproved:false,
  assurance:'SOURCE_PATTERN_GUARD_ONLY',
  limitation:'This is an offline PR regression guard, not a verified Site ingress, true billing cap or production deploy policy.'
 });
}
