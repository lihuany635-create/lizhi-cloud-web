// Read-only static analysis of P10's CI workflow, never runs a deployment.
import {readFile} from 'node:fs/promises';
const path='.github/workflows/english-academy-p10-ci.yml';
const workflow=await readFile(path,'utf8');
if(!/^\s*contents:\s*read\s*$/m.test(workflow))
 throw Error('P10_WORKFLOW_NOT_READ_ONLY');
const blocked=[
 /\bsupabase\s+(?:db\s+push|functions\s+deploy|migration\s+up)\b/i,
 /\bgh\s+(?:pr\s+merge|release\s+create)\b/i,
 /\bdeploy-pages\b/i,
 /\bsecrets\.[A-Za-z_0-9]+/i,
 /GITHUB_TOKEN|SUPABASE_SERVICE_ROLE_KEY/i,
 /(?:^|\n)\s*contents:\s*write\s*$/m
];
for(let i=0;i<blocked.length;i++)
 if(blocked[i].test(workflow))throw Error('FORBIDDEN_P10_CI_ACTION:'+i);
console.log('P10_READ_ONLY_CI_PASS');
