import {readFile} from 'node:fs/promises';
const path=process.argv[2]??'.github/workflows/english-academy-p9-ci.yml';
if(path!=='.github/workflows/english-academy-p9-ci.yml')throw Error('UNEXPECTED_WORKFLOW');
const content=await readFile(path,'utf8');
// Do not run deployments, credential export, commands with write permissions,
// or release actions from this candidate CI. This is only a static safeguard;
// a human still must review the workflow and third-party actions.
const blocked=[
 /(?:supabase|npx\s+supabase)\s+(?:db\s+push|functions\s+deploy|migration\s+up)\b/i,
 /\bgh\s+(?:pr\s+merge|release\s+create|workflow\s+run)\b/i,
 /(?:^|\n)\s+permissions:\s*\n\s*contents:\s*write\b/i,
 /(?:deploy-pages|azure\/webapps-deploy|cloudflare\/wrangler-action)/i,
 /\b(?:secrets\.\w+|GITHUB_TOKEN|SUPABASE_SERVICE_ROLE_KEY)\b/
];
for(let i=0;i<blocked.length;i++){
 if(blocked[i].test(content))throw Error('P9_WORKFLOW_PRODUCTION_OR_SECRET_OPERATION:'+i);
}
if(!/^\s*contents:\s*read\s*$/m.test(content))throw Error('MISSING_READ_ONLY_PERMISSIONS');
console.log('P9_CI_STATIC_PRODUCTION_ACTIONS_BLOCKED');
