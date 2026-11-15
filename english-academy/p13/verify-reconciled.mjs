// P13 provenance verification for a main-based, non-deploying English release PR.
// Original P10 historical ancestry is intentionally NOT represented by this
// squash-style content import. This check instead proves exact blob provenance
// from the pinned P12 commit AND no changes to preexisting main assets.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const m=JSON.parse(readFileSync(new URL('./reconciliation-manifest.json',import.meta.url),'utf8'));
const git=(args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:15*1024*1024}).trim();
const SHA=/^[0-9a-f]{40}$/;
if(m.schema!=='lizhi-english-main-reconcile/v1'||
 !SHA.test(m.baseMainCommit)||!SHA.test(m.p12CandidateCommit)||
 !Array.isArray(m.sourcePrefixes)||!Array.isArray(m.mustPreserve)||
 !Array.isArray(m.reviewedLocalChanges)||
 m.independentSecurityApproval!=='PENDING' || m.status!=='draft-not-deployed')
 throw Error('INVALID_P13_MANIFEST');
git(['cat-file','-e',m.baseMainCommit+'^{commit}']);
git(['cat-file','-e',m.p12CandidateCommit+'^{commit}']);
git(['merge-base','--is-ancestor',m.baseMainCommit,'HEAD']);
const filesAt=(sha)=>{
 const rows=git(['ls-tree','-r','--full-tree',sha]).split('\n');
 const map=new Map();
 for(const row of rows){
  const match=row.match(/^[0-7]{6} blob ([0-9a-f]{40})\t(.+)$/);
  if(match)map.set(match[2],match[1]);
 }
 return map;
};
const baseline=filesAt(m.baseMainCommit);
const candidate=filesAt(m.p12CandidateCommit);
const actual=filesAt('HEAD');
const permitted=(path)=>m.sourcePrefixes.some(prefix=>path.startsWith(prefix));
for(const name of m.mustPreserve){
 if(!baseline.has(name)||actual.get(name)!==baseline.get(name))
  throw Error('MAIN_FILE_CHANGED:'+name);
}
const diff=git(['diff','--name-status',m.baseMainCommit,'HEAD'])
  .split('\n').filter(Boolean).map(line=>{
   const [status,...parts]=line.split('\t');return {status,path:parts.at(-1)};
  });
for(const file of diff){
 if(file.status!=='A'&&file.status!=='M')throw Error('NON_ADDITIVE_CHANGE:'+file.path);
 if(!permitted(file.path))throw Error('UNRELATED_PRODUCTION_CHANGE:'+file.path);
 if(file.status==='M'&&!m.reviewedLocalChanges.includes(file.path))
  throw Error('UNREVIEWED_SOURCE_OVERRIDE:'+file.path);
 if(file.path.includes('..'))throw Error('UNSAFE_PATH');
}
let exact=0,added=0,shared=0;
for(const [path,blob] of candidate){
 if(!permitted(path))continue;
 if(m.reviewedLocalChanges.includes(path))continue;
 if(actual.get(path)!==blob)throw Error('PINNED_P12_CONTENT_DRIFT:'+path);
 exact++;
 if(baseline.has(path)){
  if(baseline.get(path)!==blob)throw Error('OVERLAPPING_MAIN_CONFLICT:'+path);
  shared++;
 }else added++;
}
if(added+shared!==exact||added < m.importedNewBlobs-2||
 shared!==m.matchingExistingBlobs)
 throw Error('RECONCILIATION_COUNT_MISMATCH');
for(const [path,blob] of baseline){
 if(!permitted(path))continue;
 if(!candidate.has(path)&&actual.get(path)!==blob)
  throw Error('MAIN_ENGLISH_EXPERIENCE_CHANGED:'+path);
}
const lock=JSON.parse(readFileSync('english-academy/p10/upstream-lock.json','utf8'));
if(lock.upstream?.length!==9||lock.formalAcceptance?.passed!==0||
 Object.values(lock.approvalScopes||{}).some(Boolean))
 throw Error('P10_RELEASE_LOCK_BYPASSED');
console.log('P13_SAFE_MAIN_RECONCILIATION_PASS',JSON.stringify({
 exactSourceBlobs:exact,newSourceBlobs:added,unchangedOverlaps:shared,
 reviewedOverrides:m.reviewedLocalChanges,changedFiles:diff.length,
 productionMainUpdated:false,formalG09:'PENDING'
}));
