import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestErrorDrills,validateTeacherProposal,ERROR_CATEGORIES} from '../error-drills.mjs';
const owner='owner-a',now='2026-11-15T08:00:00Z';
const error=(id,category,at='2026-11-14T08:00:00Z')=>({
 ownerId:owner,id,category,skill:'grammar',at,
 original:'private conversation text not for display'
});
test('repeat mistakes produce evidence-backed remedial drill',()=>{
 const rows=[error('e1','present-perfect'),error('e2','present-perfect'),
   error('e3','past-participle')];
 const drills=suggestErrorDrills({ownerId:owner,errors:rows,asOf:now});
 assert.equal(drills[0].category,'present-perfect');
 assert.deepEqual(drills[0].evidenceRefs,['e1','e2']);
 assert.equal(drills[0].grading,'deterministic');
 assert.equal(drills[0].correctIndex,1);
 assert.equal(drills[0].status,'suggested-not-completed');
 assert.ok(drills[0].rationale.includes('2'));
});
test('old evidence excluded and input source sentence is not reproduced',()=>{
 const rows=[error('old','present-perfect','2026-07-01T00:00:00Z'),
    error('new','articles')];
 const drills=suggestErrorDrills({ownerId:owner,errors:rows,asOf:now});
 assert.equal(drills.length,1);
 assert.equal(drills[0].category,'articles');
 assert.ok(!JSON.stringify(drills).includes('private conversation text'));
});
test('subjective word-order drill is not auto-graded',()=>{
 const drills=suggestErrorDrills({ownerId:owner,errors:[error('e1','sentence-order')],asOf:now});
 assert.equal(drills[0].grading,'subjective-review-required');
 assert.equal(drills[0].correctIndex,null);
});
test('unknown category ignored, no fictional practice item',()=>{
 assert.deepEqual(suggestErrorDrills({ownerId:owner,errors:[error('e1','nonexistent')],asOf:now}),[]);
 assert.ok(ERROR_CATEGORIES.includes('present-perfect'));
});
test('cross-owner and future error data rejected',()=>{
 assert.throws(()=>suggestErrorDrills({ownerId:owner,asOf:now,
  errors:[{...error('e1','articles'),ownerId:'other'}]}),/OWNER_SCOPE/);
 assert.throws(()=>suggestErrorDrills({ownerId:owner,asOf:now,
  errors:[error('e1','articles','2026-12-01T00:00:00Z')]}),/INVALID_ERROR_DATE/);
});
test('model proposal requires known evidence and cannot auto-promote',()=>{
 const suggestion=validateTeacherProposal({ownerId:owner,allowedEvidenceIds:['e1','e2'],
  proposal:{ownerId:owner,skill:'grammar',explanation:'補強現在完成式',evidenceRefs:['e1','e2']}});
 assert.equal(suggestion.status,'suggestion-only');
 assert.equal(suggestion.userApprovalRequiredForChanges,true);
 assert.throws(()=>validateTeacherProposal({ownerId:owner,allowedEvidenceIds:['e1'],
  proposal:{ownerId:owner,skill:'grammar',explanation:'錯誤建議',evidenceRefs:['madeup']}}),/EVIDENCE_NOT_SUPPORTED/);
 assert.throws(()=>validateTeacherProposal({ownerId:owner,allowedEvidenceIds:['e1'],
  proposal:{ownerId:owner,skill:'grammar',explanation:'自動升級',evidenceRefs:['e1'],autoPromote:true}}),/UNAUTHORIZED_ACTION/);
});
test('model proposal cannot fabricate certified CEFR level or owner',()=>{
 const base={ownerId:owner,skill:'reading',explanation:'加強閱讀',evidenceRefs:['e1']};
 assert.throws(()=>validateTeacherProposal({ownerId:owner,allowedEvidenceIds:['e1'],
  proposal:{...base,officialCefrLevel:'C2'}}),/UNAUTHORIZED_CEFR_CLAIM/);
 assert.throws(()=>validateTeacherProposal({ownerId:owner,allowedEvidenceIds:['e1'],
  proposal:{...base,ownerId:'someone-else'}}),/OWNER_SCOPE/);
});
