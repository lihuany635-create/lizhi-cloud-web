import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const contract=JSON.parse(await readFile(new URL('../schema/p1-data-contract.proposal.json',import.meta.url),'utf8'));

test('P1 database contract is an unapplied draft',()=>{
 assert.equal(contract.status,'draft-not-applied');
 assert.equal(contract.productionMigrationAllowed,false);
});
test('every P1 learner data table is owner-scoped and has owner_id',()=>{
 for(const t of contract.tables){
   assert.equal(t.ownerScoped,true,t.name);
   assert.ok(t.columns.some(c=>c==='owner_id:uuid'),t.name);
 }
});
test('no direct web/MCP write is planned before a trusted backend',()=>{
 for(const t of contract.tables){
   for(const channel of ['web','mcp'])
     assert.ok(t.operations[channel].every(op=>op==='read'),t.name+' '+channel);
 }
});
test('audit and grading history is append only in the contract',()=>{
 for(const name of ['english_practice_events','english_audit_events']){
   const t=contract.tables.find(t=>t.name===name);
   assert.ok(t?.appendOnly,name);
   assert.deepEqual(t.operations.backend,['read','append']);
 }
});
test('official card promotion requires explicit approval and idempotency checks',()=>{
 assert.ok(contract.constraints.some(v=>v.includes('explicit approval')));
 assert.ok(contract.constraints.some(v=>v.includes('payload digest')));
});
