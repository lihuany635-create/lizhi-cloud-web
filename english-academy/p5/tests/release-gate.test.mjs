import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewReleaseEvidence,authorizeReleaseScope,REQUIREMENTS}
  from '../release-gate.mjs';
const sha='a'.repeat(40);
const proofs=()=>REQUIREMENTS.map(({id})=>({
 requirement:id,commitSha:sha,status:'passed',
 evidenceUrl:'https://trusted.example.invalid/evidence/'+id,
 environment:'production-verified',checkedBy:'independent-auditor',
 signedAttestation:'synthetic-test-only-'+id
}));
const mockVerifier=async({proof})=>proof.signedAttestation==='synthetic-test-only-'+proof.requirement;
test('release gate fails CLOSED with no independent evidence',async()=>{
 const result=await reviewReleaseEvidence({version:'p5-test',commitSha:sha,proofs:[]},{
   verifyEvidence:mockVerifier
 });
 assert.equal(result.state,'BLOCKED');
 assert.equal(result.readyToDeploy,false);
 assert.equal(result.missing.length,REQUIREMENTS.length);
});
test('unit/browser mock evidence is rejected as production evidence',async()=>{
 const p=proofs();
 p[0].environment='synthetic-ci';
 const result=await reviewReleaseEvidence({version:'p5-test',commitSha:sha,proofs:p},{
   verifyEvidence:mockVerifier
 });
 assert.equal(result.state,'BLOCKED');
 assert.match(result.rejected.join(' '),/p1_google_oauth/);
});
test('untrusted self-assessment and wrong commit SHA fail gate',async()=>{
 const p=proofs();
 p[1].checkedBy='self';
 p[2].commitSha='b'.repeat(40);
 const result=await reviewReleaseEvidence({version:'p5-test',commitSha:sha,proofs:p},{
   verifyEvidence:mockVerifier
 });
 assert.equal(result.state,'BLOCKED');
 assert.ok(result.rejected.length>=2);
});
test('evidence callback must independently validate link and digest',async()=>{
 const result=await reviewReleaseEvidence({version:'p5-test',commitSha:sha,proofs:proofs()},{
   verifyEvidence:async()=>false
 });
 assert.equal(result.state,'BLOCKED');
 assert.equal(result.verifiedChecks.length,0);
});
test('even complete synthetic proof cannot authorize release without explicit owner verifier',async()=>{
 const result=await reviewReleaseEvidence({version:'p5-test',commitSha:sha,proofs:proofs()},{
   verifyEvidence:mockVerifier
 });
 assert.equal(result.state,'READY_FOR_OWNER_APPROVAL');
 assert.equal(result.readyToDeploy,false);
 const approval=await authorizeReleaseScope(result,{
   scope:'github_main_merge',approvalToken:'fake-token',
   verifyOwnerApproval:async()=>false,
   verifyReleaseReview:async()=>true
 });
 assert.equal(approval.authorized,false);
 assert.equal(approval.noDeploymentPerformed,true);
});
test('authorization is scoped to an exact release action and commit, with no deployment side effects',async()=>{
 const result=await reviewReleaseEvidence({version:'p5-test',commitSha:sha,proofs:proofs()},{
   verifyEvidence:mockVerifier
 });
 const calls=[];
 const approval=await authorizeReleaseScope(result,{
   scope:'supabase_schema',approvalToken:'synthetic-consent',
   verifyReleaseReview:async()=>true,
   verifyOwnerApproval:async request=>{
     calls.push(request);
     return request.scope==='supabase_schema' && request.commitSha===sha &&
       request.approvalToken==='synthetic-consent';
   }
 });
 assert.equal(approval.authorized,true);
 assert.equal(approval.noDeploymentPerformed,true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].scope,'supabase_schema');
 assert.equal((await authorizeReleaseScope(result,{
    scope:'delete_private_data',approvalToken:'synthetic-consent',
    verifyOwnerApproval:async()=>true,
    verifyReleaseReview:async()=>true
 })).authorized,false);
});
test('cannot authorize release when any required independent test remains blocked',async()=>{
 const p=proofs().slice(1);
 const result=await reviewReleaseEvidence({version:'p5-test',commitSha:sha,proofs:p},{
   verifyEvidence:mockVerifier
 });
 assert.equal(result.state,'BLOCKED');
 assert.equal((await authorizeReleaseScope(result,{
    scope:'github_pages',approvalToken:'anything',
    verifyOwnerApproval:async()=>true,
    verifyReleaseReview:async()=>true
 })).authorized,false);
});
test('missing trust verifier cannot produce passing review',async()=>{
 await assert.rejects(()=>reviewReleaseEvidence({version:'p5-test',
   commitSha:sha,proofs:proofs()}),/UNTRUSTED_RELEASE_REVIEW/);
});

test('forgeable ready state cannot authorize without independently trusted release review',async()=>{
 const forged={state:'READY_FOR_OWNER_APPROVAL',commitSha:sha,
   verifiedChecks:REQUIREMENTS.map(x=>x.id),missing:[],rejected:[]};
 const noVerifier=await authorizeReleaseScope(forged,{
   scope:'github_main_merge',approvalToken:'fake',
   verifyOwnerApproval:async()=>true
 });
 assert.equal(noVerifier.authorized,false);
 const rejected=await authorizeReleaseScope(forged,{
   scope:'github_main_merge',approvalToken:'fake',
   verifyReleaseReview:async()=>false,
   verifyOwnerApproval:async()=>true
 });
 assert.equal(rejected.authorized,false);
});
test('production evidence must use HTTPS URLs without embedded credentials or query tokens',async()=>{
 const p=proofs();
 p[0].evidenceUrl='https://secret@trusted.example.invalid/record?token=oops';
 const rejected=await reviewReleaseEvidence({version:'p5-test',commitSha:sha,proofs:p},{
   verifyEvidence:mockVerifier
 });
 assert.equal(rejected.state,'BLOCKED');
 assert.ok(rejected.rejected.some(x=>x.startsWith('p1_google_oauth')));
});
