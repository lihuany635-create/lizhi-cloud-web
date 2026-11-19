import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const Sync=require('../sync/finance-sync.js');
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const cloudScope={LizhiAuth:{user:{id:'user-1'}},location:{hostname:'lihuany635-create.github.io'}};
const stamp=day=>`2026-11-${String(day).padStart(2,'0')}T00:00:00.000Z`;
const tx=(day=2,amount=100)=>({id:'tx-1',type:'expense',accountId:'cash',categoryId:'food',amount,date:'2026-11-02',meta:{source:'manual',tags:['a']},createdAt:stamp(1),updatedAt:stamp(day)});
// Mimic a jsonb round trip: keys reordered (also nested) and deletedAt:null added.
const reorder=value=>Array.isArray(value)?value.map(reorder):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).reverse().map(key=>[key,reorder(value[key])])):value;
const remote=record=>({kind:'transactions',id:record.id,payload:{...reorder(record),deletedAt:null},created_at:record.createdAt,updated_at:record.updatedAt,deleted_at:null});

function fakes({local=[],cloud=[]}={}){
  const map=new Map(local.map(row=>[row.id,{...row}])),uploads=[],puts=[];
  const storage={sync:{list:async kind=>kind==='transactions'?[...map.values()]:[],put:async(kind,row)=>{map.set(row.id,{...row});puts.push(row);return row;},referencesPresent:async()=>true}};
  const store={list:async()=>cloud,upsert:async entries=>{uploads.push(...entries);return entries;}};
  return {storage,store,map,uploads,puts};
}

test('AUTO-01 identical records survive a jsonb round trip as equal',()=>{assert.equal(Sync.sameRecord(tx(),remote(tx()).payload),true);assert.equal(Sync.sameRecord(tx(2,100),remote(tx(2,200)).payload),false);});
test('AUTO-02 an unchanged record is not re-uploaded on every sync',async()=>{const fake=fakes({local:[tx()],cloud:[remote(tx())]}),sync=Sync.create({...fake,scope:cloudScope});const result=await sync.sync();assert.equal(result.ok,true);assert.equal(result.uploaded,0);assert.equal(result.applied,0);assert.equal(fake.uploads.length,0);});
test('AUTO-03 a changed record with a newer local timestamp still uploads',async()=>{const fake=fakes({local:[tx(5,300)],cloud:[remote(tx(2,100))]}),sync=Sync.create({...fake,scope:cloudScope});assert.equal((await sync.sync()).uploaded,1);});
test('AUTO-04 a newer record from another device is applied by a quiet sync',async()=>{const fake=fakes({local:[tx(2,100)],cloud:[remote(tx(6,450))]}),sync=Sync.create({...fake,scope:cloudScope});const result=await sync.sync({quiet:true});assert.equal(result.applied,1);assert.equal(fake.map.get('tx-1').amount,450);});
test('AUTO-05 a quiet sync with no visible change does not notify listeners',async()=>{const fake=fakes({local:[tx()],cloud:[remote(tx())]}),sync=Sync.create({...fake,scope:cloudScope});await sync.sync();const seen=[];sync.subscribe(state=>seen.push(state.state));seen.length=0;await sync.sync({quiet:true});assert.deepEqual(seen,[]);assert.equal(sync.getStatus().state,'synced');});
test('AUTO-06 a quiet sync still reports a failure state change',async()=>{const fake=fakes(),sync=Sync.create({...fake,scope:cloudScope});await sync.sync();fake.store.list=async()=>{throw new Error('offline');};const seen=[];sync.subscribe(state=>seen.push(state.state));seen.length=0;await sync.sync({quiet:true});assert.deepEqual(seen,['error']);});
test('AUTO-07 a normal sync keeps emitting the syncing state',async()=>{const fake=fakes(),sync=Sync.create({...fake,scope:cloudScope}),seen=[];sync.subscribe(state=>seen.push(state.state));await sync.sync();assert.deepEqual(seen,['idle','syncing','synced']);});

test('AUTO-08 Finance home pulls on tab return, focus, reconnect and a 60s interval',()=>{
  const home=read('finance/pages/home.js');
  assert.match(home,/function installFinanceAutoSync\(\)/);
  assert.match(home,/installFinanceAutoSync\(\)[\s\S]*visibilitychange[\s\S]*addEventListener\("focus",trigger\);addEventListener\("online",trigger\)/);
  assert.match(home,/FINANCE_AUTO_SYNC_INTERVAL_MS=60000/);
  assert.match(home,/setInterval\(trigger,FINANCE_AUTO_SYNC_INTERVAL_MS\)/);
  assert.match(home,/if\(productionJobBridge\)\{void syncFinance\(\{silent:true\}\);installFinanceAutoSync\(\);/);
});
test('AUTO-09 background sync is quiet, throttled and never re-renders over an open form',()=>{
  const home=read('finance/pages/home.js');
  assert.match(home,/financeSync\.sync\(\{quiet:true\}\)/);
  assert.match(home,/FINANCE_AUTO_SYNC_MIN_GAP_MS=15000/);
  assert.match(home,/document\.visibilityState!=="visible"\|\|navigator\.onLine===false/);
  assert.match(home,/if\(ui\.loaded&&ui\.view!=="goals"&&!financeUserEditing\(\)\)update\(\)/);
  assert.match(home,/Boolean\(ui\.modal\)\|\|Boolean\(root&&active&&root\.contains\(active\)/);
});
