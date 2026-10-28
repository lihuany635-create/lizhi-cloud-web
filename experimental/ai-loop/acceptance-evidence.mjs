/**
 * P5 sandbox-only repeatable acceptance recorder.
 * Runs the full offline Node test suite; checks AT01..AT10 are represented.
 * Evidence is about isolated mocks/local SQLite ONLY; never proves live MCP,
 * owner authorization, external AI inference, remote writes or deployment.
 * No network, credentials, external API, database migration, or background job.
 */
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';

const root=dirname(fileURLToPath(import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const labels=Object.freeze(Array.from({length:10},(_,i)=>'AT'+String(i+1).padStart(2,'0')));
const reservedChecks=Object.freeze({
 AT01:['AT01','INT-01'],AT02:['AT02','P2-03'],AT03:['AT03','INT-02'],
 AT04:['AT04','INT-03'],AT05:['AT05','INT-12'],AT06:['AT06','INT-10'],
 AT07:['AT07','P3-HTTP-05'],AT08:['AT08','INT-15'],AT09:['AT09','INT-14'],
 AT10:['AT10','P3-MCP-07']
});
export class EvidenceError extends Error{constructor(code){super(code);this.code=code;}}
const need=(ok,code)=>{if(!ok)throw new EvidenceError(code);};
export function parseTap(tap){
 need(typeof tap==='string'&&tap.length>0,'TAP_EMPTY');
 const summary={};const names=[];const cases=new Set();
 for(const line of tap.split(/\r?\n/)){
  let m=line.match(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/);
  if(m){need(!(m[1] in summary),'DUPLICATE_SUMMARY');summary[m[1]]=Number(m[2]);}
  m=line.match(/^ok \d+ - ([^\r\n]+)$/);
  if(m){names.push(m[1]);const label=m[1].match(/^(AT\d\d|P2-\d\d|P3-HTTP-\d\d|P3-MCP-\d\d|INT-\d\d)\b/)?.[1];if(label)cases.add(label);}
 }
 for(const k of ['tests','pass','fail','cancelled','skipped','todo'])need(Number.isSafeInteger(summary[k]),'TAP_INCOMPLETE');
 need(summary.tests===summary.pass&&summary.fail===0&&summary.cancelled===0&&summary.skipped===0&&summary.todo===0,'TESTS_NOT_PASS');
 need(names.length===summary.tests,'TAP_CASE_COUNT_MISMATCH');
 // Require an explicit direct AT test AND an independent simulation mapping.
 const coverage={};
 for(const label of labels){const refs=reservedChecks[label];const matching=refs.filter(id=>cases.has(id));coverage[label]={scope:'LOCAL_SANDBOX_ONLY',references:matching,verified:matching.length===refs.length};need(coverage[label].verified,'MISSING_'+label);}
 return {summary,coverage,names};
}
export function createEvidence({tap,files,executable=process.execPath,at=new Date().toISOString()}){
 need(files&&typeof files==='object','FILES_MISSING');
 const verified=parseTap(tap);
 need(verified.summary.tests>=120,'BASELINE_REGRESSION');
 const sourceFiles=Object.keys(files).sort().map(name=>({path:name,sha256:hash(files[name]),bytes:Buffer.byteLength(files[name])}));
 need(sourceFiles.some(x=>x.path==='durable-queue.mjs')&&sourceFiles.some(x=>x.path==='durable-review-integration.mjs')&&sourceFiles.some(x=>x.path==='workbench-readonly.mjs'),'SOURCES_MISSING');
 return {schema:'LIZHI-AI-LOOP-P5-EVIDENCE/1',at,environment:{runtime:process.version,executable:executable.split(/[\\/]/).at(-1)},
   boundaries:{mode:'OFF_BY_DESIGN',networkUse:'NOT_INSTRUMENTED',externalPaidApis:false,independentAiWorkers:false,workbenchWrite:false,authorApproved:false,
     statement:'PASS covers only offline Node mock and local SQLite acceptance, NOT live MCP or human acceptance'},
   summary:verified.summary,acceptance:verified.coverage,sources:sourceFiles,tapSha256:hash(tap),
   result:'SANDBOX_PASS',liveE2e:'NOT_TESTED',ownerApproval:'NOT_OBTAINED'};
}
export function runSuite({dir=root,outputPath=null}={}){
 need(resolve(dir)===resolve(root),'DIRECTORY_NOT_ALLOWLISTED');
 const sourceFiles=readdirSync(root).filter(x=>x.endsWith('.mjs')).sort();
 const tests=sourceFiles.filter(x=>x.endsWith('.test.mjs'));
 need(tests.length>=8,'TEST_FILES_MISSING');
 const args=['--disable-warning=ExperimentalWarning','--test','--test-reporter=tap',...tests.map(x=>join(root,x))];
 const proc=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:16*1024*1024,timeout:45000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
 need(!proc.error&&proc.status===0,'TEST_COMMAND_FAILED');
 const files=Object.fromEntries(sourceFiles.map(x=>[x,readFileSync(join(root,x))]));
 for(const path of ['../../production/source/lib/ai-loop-v15.mjs','../../production/source/app/api/ai-loop/route.ts','../../production/source/sql/ai-loop-v15-candidate.sql'])files[path]=readFileSync(join(root,path));
 const evidence=createEvidence({tap:proc.stdout,files});
 if(outputPath)writeFileSync(resolve(outputPath),JSON.stringify(evidence,null,2)+'\n',{flag:'w',mode:0o600});
 return evidence;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
   const args=process.argv.slice(2);
   need(args.length===0||(args.length===2&&args[0]==='--output'&&args[1].endsWith('.json')),'INVALID_ARGS');
   const e=runSuite({outputPath:args.length?args[1]:null});
   process.stdout.write(JSON.stringify({result:e.result,liveE2e:e.liveE2e,total:e.summary.tests,passed:e.summary.pass,
     checkedCases:Object.keys(e.acceptance).length,sourceCount:e.sources.length,tapSha256:e.tapSha256})+'\n');
 }catch(e){process.stderr.write('ACCEPTANCE_FAILED: '+(e instanceof EvidenceError?e.code:'INTERNAL')+'\n');process.exitCode=1;}
}
