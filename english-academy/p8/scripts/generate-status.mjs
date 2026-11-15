// Machine-readable P8-A declaration: NEVER asserts formal G01-G12 passed.
import {writeFile,mkdir} from 'node:fs/promises';
import { GATES, buildFormalAcceptanceMatrix } from '../acceptance-matrix.mjs';
const sha=process.env.GITHUB_SHA?.match(/^[0-9a-f]{40}$/)?.[0]??'0'.repeat(40);
const matrix=buildFormalAcceptanceMatrix({commitSha:sha});
const report={
  ...matrix,
  project:'立之英文學習教室',
  stage:'P8-A',
  scope:'isolated-acceptance-only',
  generatedAt:new Date().toISOString(),
  note:'No valid production verified proof attached. All twelve G01-G12 formal gates remain pending. No service was deployed.',
  source:'GitHub Actions synthetic candidate',
  requirementIds:GATES.map(x=>x.requirement),
  gatedActions:{github_main_merge:false,github_pages:false,supabase_schema:false,
    supabase_edge:false,private_site:false},
};
await mkdir(new URL('../test-results/',import.meta.url),{recursive:true});
await writeFile(new URL('../test-results/formal-gates.json',import.meta.url),
  JSON.stringify(report,null,2)+'\n',{encoding:'utf8'});
console.log('P8-A_PROVISIONAL_MATRIX_WRITTEN_12_FORMAL_GATES_BLOCKED');
