import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {previewRetention,RetentionInventoryError,RETENTION_PROJECT} from './retention-inventory.mjs';

const NOW=2000000000000,DAY=86400000,OWNER='owner-a';
const schema=readFileSync(new URL('../../production/source/sql/ai-loop-v15-candidate.sql',import.meta.url),'utf8');
const mockD1=db=>({prepare(sql){
 assert.match(sql.trim(),/^SELECT /i,'Inventory may execute SELECT only');
 return {bind(...args){return {async first(){return db.prepare(sql).get(...args)??null;}}}};
}});
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(schema);
 const grant=(id,owner,expires,revoked,state,requestId)=>db.prepare(
 'INSERT INTO ai_loop_grants_v15(id,token_hash,owner,project,expires,revoked,state,request_id,calls) VALUES(?,?,?,?,?,?,?,?,?)')
 .run(id,'hash-'+id,owner,RETENTION_PROJECT,expires,revoked,state,requestId,0);
 const audit=(id,grantId,when)=>db.prepare(
 'INSERT INTO ai_loop_audit_v15(id,grant_id,request_id,event,tool,at) VALUES(?,?,?,?,?,?)')
 .run(id,grantId,null,'READ_ATTEMPT','get_project_context',when);
 grant('g1',OWNER,NOW+DAY,0,'RUNNING','req1');
 grant('g2',OWNER,NOW-DAY,1,'DONE','req2');
 grant('g3',OWNER,NOW-60*DAY,0,'DONE',null);
 grant('g4','owner-b',NOW-DAY,1,'DONE','private-request');
 audit('a1','g1',NOW-DAY);
 audit('a2','g2',NOW-31*DAY);
 audit('a3','g3',NOW-61*DAY);
 audit('a4','g4',NOW-80*DAY);
 return {db,proxy:mockD1(db)};
}
const preview=(f,override={})=>previewRetention({db:f.proxy,owner:OWNER,projectId:RETENTION_PROJECT,now:NOW,...override});
const expectCode=(cb,code)=>assert.rejects(cb,e=>e instanceof RetentionInventoryError&&e.code===code);

test('RETAIN-01 counts owner-specific grants and audit without authorising cleanup',async()=>{
 const f=fixture();try{
  const r=await preview(f);
  assert.deepEqual(r.grants,{total:3,revoked:1,expired:2,potentiallyActive:1,replayLocks:2});
  assert.deepEqual(r.audit,{total:3,olderThanCandidate:2});
  assert.equal(r.deletionAuthorized,false);
  assert.equal(r.deploymentAuthorized,false);
  assert.equal(r.actualSiteQuota,'NOT_VERIFIED');
 }finally{f.db.close();}
});
test('RETAIN-02 query never exposes other owner records',async()=>{
 const f=fixture();try{
  const r=await preview(f,{owner:'owner-b'});
  assert.equal(r.grants.total,1);
  assert.equal(r.audit.total,1);
  assert.equal(r.audit.olderThanCandidate,1);
  assert.equal(JSON.stringify(r).includes('private-request'),false);
 }finally{f.db.close();}
});
test('RETAIN-03 exact project allowlist rejects cross-project request',async()=>{
 const f=fixture();try{
  await expectCode(()=>preview(f,{projectId:'foreign'}),'PROJECT_DENIED');
 }finally{f.db.close();}
});
test('RETAIN-04 missing, illegal and manipulated owner IDs fail closed',async()=>{
 const f=fixture();try{
  for(const owner of [undefined,'','owner/x','a\nINJECT',99]){
   await expectCode(()=>preview(f,{owner}),'OWNER_INVALID');
  }
 }finally{f.db.close();}
});
test('RETAIN-05 candidate window is adjustable only 1..90 days and is not an approved policy',async()=>{
 const f=fixture();try{
  const r=await preview(f,{candidateDays:60});
  assert.equal(r.audit.olderThanCandidate,1);
  assert.equal(r.auditCleanup,'OWNER_APPROVAL_AND_ARCHIVE_REQUIRED');
  for(const candidateDays of [0,91,-1,0.5,Infinity,'30'])
    await expectCode(()=>preview(f,{candidateDays}),'RETENTION_POLICY_INVALID');
 }finally{f.db.close();}
});
test('RETAIN-06 no grant or audit row is deleted or changed by inventory',async()=>{
 const f=fixture();try{
  const before=f.db.prepare('SELECT * FROM ai_loop_grants_v15 ORDER BY id').all();
  const auditBefore=f.db.prepare('SELECT * FROM ai_loop_audit_v15 ORDER BY id').all();
  await preview(f);await preview(f);
  assert.deepEqual(f.db.prepare('SELECT * FROM ai_loop_grants_v15 ORDER BY id').all(),before);
  assert.deepEqual(f.db.prepare('SELECT * FROM ai_loop_audit_v15 ORDER BY id').all(),auditBefore);
 }finally{f.db.close();}
});
test('RETAIN-07 missing schema or DB errors return sanitized error',async()=>{
 const f=fixture();try{
  f.db.exec('DROP TABLE ai_loop_audit_v15');
  await expectCode(()=>preview(f),'INVENTORY_READ_FAILED');
 }finally{f.db.close();}
});
test('RETAIN-08 invalid result counts and missing read-only DB fail closed',async()=>{
 const fake={prepare:()=>({bind:()=>({first:async()=>({total:-1,revoked:0,expired:0,potentiallyActive:0,replayLocks:0})})})};
 await expectCode(()=>previewRetention({db:fake,owner:OWNER,now:NOW}),'INVALID_INVENTORY_COUNTS');
 await expectCode(()=>previewRetention({db:null,owner:OWNER,now:NOW}),'READONLY_DATABASE_REQUIRED');
});
test('RETAIN-09 existing request-id tombstones cannot be deleted by an inventory call',async()=>{
 const f=fixture();try{
  const r=await preview(f);
  assert.equal(r.grants.replayLocks,2);
  assert.equal(r.requestReplayProtection,'PRESERVE_GRANT_TOMBSTONES');
  assert.equal(r.scheduledCleanup,false);
  assert.equal(r.liveD1Consistency,'NOT_TESTED');
 }finally{f.db.close();}
});
test('RETAIN-10 source report is minimal and excludes account subject or bearer',async()=>{
 const f=fixture();try{
  const serial=JSON.stringify(await preview(f));
  for(const forbidden of [OWNER,'owner-b','hash-g1','req1','private-request'])assert.equal(serial.includes(forbidden),false);
  assert.equal(serial.includes('token_hash'),false);
 }finally{f.db.close();}
});
