import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const Sync=require('../sync/finance-sync.js');
const Store=require('../sync/finance-sync-store.js');
const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(dirname,'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const cloudScope={LizhiAuth:{user:{id:'user-1'}},location:{hostname:'lihuany635-create.github.io'}};
const localScope={LizhiAuth:{user:{id:'user-1'}},location:{hostname:'127.0.0.1'}};
const stamp=(day=1)=>`2026-09-${String(day).padStart(2,'0')}T00:00:00.000Z`;
const account=(id='cash',day=1)=>({id,name:'現金',type:'cash',initialBalance:0,createdAt:stamp(1),updatedAt:stamp(day),archived:false});
const remote=(kind,record)=>({kind,id:record.id,payload:{...record},created_at:record.createdAt,updated_at:record.updatedAt,deleted_at:record.deletedAt||null});

function fakes({local={},cloud=[],failList=false,failUpsert=false,missingReferences=false}={}){
  const maps=new Map(Sync.ORDER.map(kind=>[kind,new Map((local[kind]||[]).map(row=>[row.id,{...row}]))]));
  const rows=cloud.map(row=>({...row,payload:{...row.payload}})),uploads=[],puts=[];
  const storage={sync:{
    list:async kind=>[...maps.get(kind).values()].map(row=>({...row})),
    get:async(kind,id)=>maps.get(kind).get(id),
    put:async(kind,row)=>{maps.get(kind).set(row.id,{...row});puts.push({kind,row:{...row}});return row;},
    referencesPresent:async()=>!missingReferences
  }};
  const store={
    list:async()=>{if(failList)throw new Error('offline');return rows.map(row=>({...row,payload:{...row.payload}}));},
    upsert:async entries=>{if(failUpsert)throw new Error('offline');uploads.push(...entries.map(entry=>({kind:entry.kind,record:{...entry.record}})));return entries;}
  };
  return {storage,store,maps,rows,uploads,puts};
}

test('P8-01 sync kinds are limited to the four Finance ledger collections',()=>assert.deepEqual(Store.KINDS,['accounts','creditCards','categories','transactions']));
test('P8-02 sync uses a dedicated Finance table',()=>assert.equal(Store.TABLE,'lizhi_finance_records'));
test('P8-03 payload rejects access tokens',()=>assert.throws(()=>Store.assertSafe({access_token:'x'}),error=>error.code==='UNSAFE_SYNC_PAYLOAD'));
test('P8-04 payload rejects audio data',()=>assert.throws(()=>Store.assertSafe({nested:{audioBlob:'x'}}),error=>error.code==='UNSAFE_SYNC_PAYLOAD'));
test('P8-04B payloads over 64 KiB are rejected',()=>assert.throws(()=>Store.assertPayloadSize({note:'x'.repeat(70000)}),error=>error.code==='SYNC_PAYLOAD_TOO_LARGE'));
test('P8-05 normalizing a local row pins it to the authenticated user',()=>assert.equal(Store.normalizeLocalRow('accounts',account(),'user-1').user_id,'user-1'));
test('P8-06 remote timestamps are restored into the local payload',()=>assert.equal(Store.normalizeRemoteRow(remote('accounts',account('cash',3))).payload.updatedAt,stamp(3)));
test('P8-07 production GitHub Pages is a cloud-sync surface',()=>assert.equal(Sync.isCloud(cloudScope),true));
test('P8-08 localhost remains a local-only development surface',()=>assert.equal(Sync.isCloud(localScope),false));
test('P8-09 references always synchronize before transactions',()=>assert.deepEqual(Sync.ORDER,['accounts','categories','creditCards','transactions']));

test('P8-10 a local-only record uploads',async()=>{const fake=fakes({local:{accounts:[account()]}}),sync=Sync.create({...fake,scope:cloudScope});const result=await sync.sync();assert.equal(result.uploaded,1);assert.equal(fake.uploads[0].record.id,'cash');});
test('P8-11 a remote-only record is written locally',async()=>{const fake=fakes({cloud:[remote('accounts',account())]}),sync=Sync.create({...fake,scope:cloudScope});const result=await sync.sync();assert.equal(result.applied,1);assert.equal(fake.maps.get('accounts').get('cash').name,'現金');});
test('P8-12 a newer local record wins and uploads',async()=>{const fake=fakes({local:{accounts:[account('cash',5)]},cloud:[remote('accounts',account('cash',2))]}),sync=Sync.create({...fake,scope:cloudScope});await sync.sync();assert.equal(fake.uploads.length,1);assert.equal(fake.puts.length,0);});
test('P8-13 a newer remote record wins and applies locally',async()=>{const fake=fakes({local:{accounts:[account('cash',2)]},cloud:[remote('accounts',account('cash',5))]}),sync=Sync.create({...fake,scope:cloudScope});await sync.sync();assert.equal(fake.puts.length,1);assert.equal(fake.uploads.length,0);});
test('P8-14 equal timestamps resolve deterministically',()=>{const local=account('cash',2),cloud=remote('accounts',{...local,name:'錢包'});assert.equal(Sync.compare(local,cloud),Sync.compare(local,cloud));});
test('P8-14B fresh built-in categories cannot overwrite an existing cloud category',async()=>{const local={id:'system-food',name:'餐飲',type:'expense',system:true,archived:false,createdAt:stamp(8),updatedAt:stamp(8)},saved={...local,name:'外食',createdAt:stamp(1),updatedAt:stamp(2)},fake=fakes({local:{categories:[local]},cloud:[remote('categories',saved)]}),sync=Sync.create({...fake,scope:cloudScope});await sync.sync();assert.equal(fake.maps.get('categories').get('system-food').name,'外食');assert.equal(fake.uploads.length,0);});
test('P8-15 a transaction with missing references is deferred',async()=>{const tx={id:'tx-1',type:'expense',accountId:'missing',categoryId:'food',amount:100,date:'2026-09-28',createdAt:stamp(2),updatedAt:stamp(2)},fake=fakes({cloud:[remote('transactions',tx)],missingReferences:true}),sync=Sync.create({...fake,scope:cloudScope});const result=await sync.sync();assert.equal(result.deferred,1);assert.equal(fake.puts.length,0);});
test('P8-16 a transaction with available references is pulled',async()=>{const tx={id:'tx-1',type:'expense',accountId:'cash',categoryId:'food',amount:100,date:'2026-09-28',createdAt:stamp(2),updatedAt:stamp(2)},fake=fakes({cloud:[remote('transactions',tx)]}),sync=Sync.create({...fake,scope:cloudScope});const result=await sync.sync();assert.equal(result.applied,1);assert.equal(fake.puts[0].kind,'transactions');});
test('P8-17 a pull failure reports error without touching local data',async()=>{const fake=fakes({local:{accounts:[account()]},failList:true}),sync=Sync.create({...fake,scope:cloudScope});const result=await sync.sync();assert.equal(result.ok,false);assert.equal(fake.maps.get('accounts').has('cash'),true);assert.match(result.error.message,/本機帳本已保留/);});
test('P8-18 a failed sync can be retried successfully',async()=>{const fake=fakes({local:{accounts:[account()]},failUpsert:true}),sync=Sync.create({...fake,scope:cloudScope});assert.equal((await sync.sync()).ok,false);fake.store.upsert=async entries=>{fake.uploads.push(...entries);return entries;};assert.equal((await sync.sync()).ok,true);});
test('P8-19 scheduling on production creates pending work',()=>{const fake=fakes(),sync=Sync.create({...fake,scope:cloudScope,delayMs:60000});assert.equal(sync.schedule().state,'pending');sync.cancel();});
test('P8-20 scheduling on localhost does not create a false pending state',()=>{const fake=fakes(),sync=Sync.create({...fake,scope:localScope});assert.equal(sync.schedule().state,'idle');});
test('P8-21 tombstones are uploaded instead of being discarded',async()=>{const deleted={...account(),deletedAt:stamp(4),updatedAt:stamp(4)},fake=fakes({local:{accounts:[deleted]}}),sync=Sync.create({...fake,scope:cloudScope});await sync.sync();assert.equal(fake.uploads[0].record.deletedAt,stamp(4));});
test('P8-22 a newer remote tombstone removes the record from normal local reads',async()=>{const deleted={...account('cash',4),deletedAt:stamp(4)},fake=fakes({local:{accounts:[account('cash',2)]},cloud:[remote('accounts',deleted)]}),sync=Sync.create({...fake,scope:cloudScope});await sync.sync();assert.equal(fake.maps.get('accounts').get('cash').deletedAt,stamp(4));});
test('P8-23 repeating a pull uses stable IDs rather than creating duplicates',async()=>{const fake=fakes({cloud:[remote('accounts',account())]}),sync=Sync.create({...fake,scope:cloudScope});await sync.sync();await sync.sync();assert.equal(fake.maps.get('accounts').size,1);});

test('P8-24 AI result exposes an explicit confirmation button only for commit-eligible validation',()=>{const home=read('finance/pages/home.js');assert.match(home,/canConfirm=validation\?\.status==="ready"&&validation\.commitEligible/);assert.match(home,/data-finance-action="confirm-ai-transaction"/);});
test('P8-25 automatic entry is disabled on every environment',()=>assert.match(read('finance/pages/home.js'),/aiAutoEntryEnabled=false/));
test('P8-26 voice final text still only appends and never commits',()=>{const home=read('finance/pages/home.js');assert.match(home,/onFinal:appendVoiceTranscript/);assert.doesNotMatch(home,/onFinal:[^,}]*confirmAiTransaction/);});
test('P8-27 local transaction creation precedes sync scheduling',()=>assert.match(read('finance/pages/home.js'),/await FinanceStorage\.transactions\.create\(payload\);financeSync\.schedule\(\)/));
test('P8-28 deleting a transaction creates a tombstone',()=>assert.match(read('finance/storage/finance-db.js'),/tombstoneTransaction[\s\S]*deletedAt:stamp,updatedAt:stamp/));
test('P8-29 the IndexedDB schema remains v1',()=>assert.match(read('finance/storage/finance-db.js'),/DB_VERSION=1/));
test('P8-30 migration enables RLS and isolates every operation by auth.uid',()=>{const sql=read('supabase/migrations/005_lizhi_finance_sync.sql');assert.match(sql,/enable row level security/);assert.equal((sql.match(/user_id = auth\.uid\(\)/g)||[]).length,5);});
test('P8-31 migration denies anonymous table access',()=>assert.match(read('supabase/migrations/005_lizhi_finance_sync.sql'),/revoke all on table public\.lizhi_finance_records from anon/));
test('P8-32 production assets load sync before the Finance page controller',()=>assert.match(read('index.html'),/finance\/sync\/finance-sync-store\.js\?v=1[\s\S]*finance\/sync\/finance-sync\.js\?v=1[\s\S]*finance\/pages\/home\.js\?v=63/));
test('P8-33 service worker caches the complete Phase 8 surface',()=>{const sw=read('sw.js');assert.match(sw,/lizhi-cloud-v71/);assert.match(sw,/finance\/sync\/finance-sync-store\.js\?v=1/);assert.match(sw,/finance\/sync\/finance-sync\.js\?v=1/);});
test('P8-34 Finance sync source contains no audio capture or service-role secret',()=>{const source=read('finance/sync/finance-sync-store.js')+read('finance/sync/finance-sync.js');assert.doesNotMatch(source,/MediaRecorder|getUserMedia|service_role/i);});
test('P8-35 cloud sync remains separate from the general workspace sync module',()=>{assert.doesNotMatch(read('sync.js'),/lizhi_finance_records|FinanceSync/);assert.match(read('finance/sync/finance-sync.js'),/FinanceSync/);});
