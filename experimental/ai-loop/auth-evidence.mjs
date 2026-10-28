/** AUTH01–AUTH10 OFFLINE PREFLIGHT REPORT ONLY; never live owner authorization. */
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const base=dirname(fileURLToPath(import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex');
const ids=Array.from({length:10},(_,i)=>'AUTH'+String(i+1).padStart(2,'0'));
export class AuthEvidenceError extends Error{constructor(code){super(code);this.code=code;}}
const need=(ok,code)=>{if(!ok)throw new AuthEvidenceError(code);};
export function parseAuthTap(tap){
 need(typeof tap==='string'&&tap.length>0,'EMPTY_LOG');
 const all=tap.split(/\r?\n/),summ={},labels=[];
 for(const s of all){const x=s.match(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/);
  if(x){need(!(x[1] in summ),'DUPLICATE_SUMMARY');summ[x[1]]=Number(x[2]);}
  const y=s.match(/^ok \d+ - (AUTH\d\d)\b/);if(y)labels.push(y[1]);
 }
 for(const x of ['tests','pass','fail','cancelled','skipped','todo'])need(Number.isSafeInteger(summ[x]),'MISSING_SUMMARY');
 need(summ.tests===10&&summ.pass===10&&summ.fail===0&&summ.cancelled===0&&summ.skipped===0&&summ.todo===0,'TESTS_NOT_ALL_PASS');
 need(labels.length===10&&new Set(labels).size===10&&ids.every(x=>labels.includes(x)),'AUTH_COVERAGE_MISSING');
 return {summary:summ,ids};
}
export function evidenceFor({tap,source,at=new Date().toISOString()}){
 const x=parseAuthTap(tap);
 need(typeof source==='string'&&source.includes('AUTH10'),'SOURCE_MISSING');
 return {schema:'LIZHI-AI-LOOP-AUTH-PREFLIGHT/1',createdAt:at,
  result:'LOCAL_MOCK_PREFLIGHT_PASS',liveOwnerAuthorization:'NOT_TESTED',
  actualIndependentWorker:'NOT_TESTED',formalWriteBack:'NOT_TESTED',
  authenticOwnerConsent:'NOT_OBTAINED',mode:'OFF_BY_DEFAULT',paidApiUsed:false,
  coverage:Object.fromEntries(x.ids.map(id=>[id,{localMock:'PASS',liveServer:'NOT_TESTED'}])),
  summary:x.summary,sourceSha256:sha(source),tapSha256:sha(tap),
  limitations:['All sessions, bearer tokens, HTTP replies and owner verification callbacks are local test fixtures',
   'No owner-scoped read-only token was issued by production backend',
   'No cross-account or revocation test was executed against live MCP',
   'Client-side tool allowlist cannot substitute for server-side authorization']};
}
export function runAuthEvidence(){
 const testPath=join(base,'auth-preflight.test.mjs');
 const p=spawnSync(process.execPath,['--test','--test-reporter=tap',testPath],
  {encoding:'utf8',timeout:30000,maxBuffer:1024*1024,env:{...process.env,NODE_NO_WARNINGS:'1'}});
 need(!p.error&&p.status===0,'TEST_COMMAND_FAILED');
 return evidenceFor({tap:p.stdout,source:readFileSync(testPath,'utf8')});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2);need(args.length===2&&args[0]==='--output'&&args[1].endsWith('.json'),'INVALID_ARGS');
  const e=runAuthEvidence();writeFileSync(resolve(args[1]),JSON.stringify(e,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({result:e.result,localPass:e.summary.pass,liveOwnerAuthorization:e.liveOwnerAuthorization,sourceSha256:e.sourceSha256}));
 }catch(e){console.error('AUTH_PREFLIGHT_FAILED: '+(e instanceof AuthEvidenceError?e.code:'INTERNAL'));process.exitCode=1;}
}