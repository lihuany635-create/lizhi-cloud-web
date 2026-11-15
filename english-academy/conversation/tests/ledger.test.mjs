import test from 'node:test';
import assert from 'node:assert/strict';
import { createLedger, addCandidate, recordReview, entryProgress,
  exportLedger, importLedger, LEDGER_SCHEMA } from '../ledger.mjs';

const sentence = {kind:'sentence',original:'I am prefer salty.',correction:'I prefer salty food.',
  meaning:'我比較喜歡鹹食',topic:'food'};
const newSentence = (ledger,id='s1',at='2026-11-15T10:00:00.000Z') =>
  addCandidate(ledger,sentence,{id,at});
const review = (ledger,{reviewId='r1',verdict='correct',reviewer='self',
  at='2026-11-16T10:00:00.000Z',answer='I prefer salty food.'}={}) =>
  recordReview(ledger,{entryId:'s1',reviewId,verdict,reviewer,at,answer});

test('separates original, correction, meaning and topic without storing AI claims',()=>{
 const ledger=newSentence(createLedger());
 assert.equal(ledger.schema,LEDGER_SCHEMA);
 assert.equal(ledger.entries[0].original,sentence.original);
 assert.equal(ledger.entries[0].correction,sentence.correction);
 assert.equal(ledger.entries[0].topic,'food');
 assert.equal(ledger.events.length,0);
});
test('repeated mistake is a single candidate and ID collisions are rejected',()=>{
 const one=newSentence(createLedger());
 assert.deepEqual(newSentence(one),one);
 assert.equal(newSentence(one,'s2').entries.length,1);
 assert.throws(()=>addCandidate(one,{...sentence,original:'I went home.'},
  {id:'s1',at:'2026-11-15T10:00:00.000Z'}),/collision/);
});
test('self-assessment cannot mark as mastered',()=>{
 const one=newSentence(createLedger());
 const two=review(one);
 const three=review(two,{reviewId:'r2',at:'2026-11-18T10:00:00.000Z'});
 assert.equal(entryProgress(three,'s1').status,'reviewing');
 assert.equal(three.events.length,2);
 assert.equal(one.events.length,0);
});
test('two human verified correct reviews on different days permit mastery',()=>{
 let l=newSentence(createLedger());
 l=review(l,{reviewer:'human'});
 l=review(l,{reviewId:'r2',reviewer:'human',at:'2026-11-17T09:00:00.000Z'});
 assert.equal(entryProgress(l,'s1').status,'mastered');
 l=review(l,{reviewId:'r3',reviewer:'human',verdict:'incorrect',
  at:'2026-11-18T10:00:00.000Z',answer:'I am prefer'});
 assert.equal(entryProgress(l,'s1').status,'needs-practice');
});
test('review event is append only, replay idempotent, conflicting replay rejected',()=>{
 const once=review(newSentence(createLedger()));
 assert.deepEqual(review(once),once);
 assert.throws(()=>review(once,{answer:'different'}),/collision/);
});
test('export/import preserves review evidence but rejects duplicate imported entries',()=>{
 const l=review(newSentence(createLedger()));
 assert.deepEqual(importLedger(exportLedger(l)),l);
 const bad=JSON.parse(exportLedger(l));
 bad.entries.push({...bad.entries[0],id:'s9'});
 assert.throws(()=>importLedger(JSON.stringify(bad)),/duplicate/);
});
test('invalid input is rejected; no official skill grade is generated',()=>{
 assert.throws(()=>addCandidate(createLedger(),{...sentence,kind:'speaking'},
  {id:'s1',at:'2026-11-15T10:00:00Z'}),/unsupported/);
 const l=newSentence(createLedger());
 assert.throws(()=>recordReview(l,{entryId:'s1',reviewId:'r1',answer:'',
  reviewer:'self',verdict:'correct',at:'2026-11-16'}),/length/);
 assert.equal('cefr' in entryProgress(l,'s1'),false);
});
