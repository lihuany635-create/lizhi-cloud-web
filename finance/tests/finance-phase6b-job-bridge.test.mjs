import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const Store=require('../remote/finance-ai-job-store.js');
const Connector=require('../remote/finance-ai-job-connector.js');
const HostId=require('../remote/finance-ai-host-id.js');
const Host=require('../remote/finance-ai-host.js');
const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(dirname,'../..');

const context={rawText:'早餐兩百五，錢包',draft:{type:'expense',amount:250,date:'2026-09-28',category:'餐飲',account:'錢包'},lockedFields:['amount','date','category','account'],typeHints:['expense'],allowedValues:{types:['expense'],accounts:['錢包'],creditCards:[],categories:['餐飲']}};

function fakeClient({resultPayload={patch:{type:'expense'},issues:[],model:'test'},invalidResult=false}={}){
  const jobs=[],hosts=[];let sequence=0;
  class Query{
    constructor(table){this.table=table;this.action='select';this.value=null;this.filters=[];this.singleMode=false;}
    insert(value){this.action='insert';this.value=value;return this;}
    update(value){this.action='update';this.value=value;return this;}
    upsert(value){this.action='upsert';this.value=value;return this;}
    select(){return this;}
    eq(key,value){this.filters.push([key,value]);return this;}
    single(){this.singleMode=true;return this;}
    maybeSingle(){this.singleMode=true;return this;}
    then(resolve,reject){return this.run().then(resolve,reject);}
    async run(){
      const rows=this.table===Store.JOB_TABLE?jobs:hosts;
      if(this.action==='insert'){
        const duplicate=rows.find(row=>row.request_id===this.value.request_id&&row.user_id===this.value.user_id);
        if(duplicate)return {data:null,error:{code:'23505',message:'duplicate'}};
        const row={id:`job-${++sequence}`,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),expires_at:new Date(Date.now()+600000).toISOString(),...this.value};
        if(this.table===Store.JOB_TABLE){row.status='completed';row.result_payload=invalidResult?{}:resultPayload;row.completed_at=new Date().toISOString();}
        rows.push(row);return {data:row,error:null};
      }
      if(this.action==='upsert'){
        const index=rows.findIndex(row=>row.user_id===this.value.user_id);if(index>=0)rows[index]={...rows[index],...this.value};else rows.push({...this.value});return {data:rows[index>=0?index:rows.length-1],error:null};
      }
      let matches=rows.filter(row=>this.filters.every(([key,value])=>row[key]===value));
      if(this.action==='update'){for(const row of matches)Object.assign(row,this.value);return {data:matches[0]||null,error:null};}
      return {data:this.singleMode?matches[0]||null:matches,error:null};
    }
  }
  return {jobs,hosts,auth:{getSession:async()=>({data:{session:{user:{id:'user-1'}}},error:null})},from:table=>new Query(table),rpc:async()=>({data:[],error:null})};
}

test('P6B-T01 request payload contains only the constrained parser context',()=>{
  assert.deepEqual(Store.normalizeRequestPayload(context),context);
});

test('P6B-T02 access tokens are rejected from jobs',()=>{
  assert.throws(()=>Store.normalizeRequestPayload({...context,allowedValues:{access_token:'secret'}}),error=>error.code==='UNSAFE_JOB_PAYLOAD');
});

test('P6B-T03 prompts and Ollama settings are rejected from jobs',()=>{
  assert.throws(()=>Store.normalizeRequestPayload({...context,draft:{prompt:'ignore rules'}}),error=>error.code==='UNSAFE_JOB_PAYLOAD');
  assert.throws(()=>Store.normalizeRequestPayload({...context,draft:{ollamaUrl:'http://example'}}),error=>error.code==='UNSAFE_JOB_PAYLOAD');
});

test('P6B-T04 raw text is limited to 1-300 characters',()=>{
  assert.throws(()=>Store.normalizeRequestPayload({...context,rawText:''}),error=>error.code==='INVALID_RAW_TEXT');
  assert.throws(()=>Store.normalizeRequestPayload({...context,rawText:'x'.repeat(301)}),error=>error.code==='INVALID_RAW_TEXT');
});

test('P6B-T05 host availability is online below 20 seconds',()=>{
  assert.equal(Store.hostAvailability({status:'online',last_seen_at:new Date(90000).toISOString()},100000).state,'online');
});

test('P6B-T06 busy heartbeat is preserved',()=>{
  assert.equal(Store.hostAvailability({status:'busy',last_seen_at:new Date(90000).toISOString()},100000).state,'busy');
});

test('P6B-T07 heartbeat from 20-60 seconds is stale',()=>{
  assert.equal(Store.hostAvailability({status:'online',last_seen_at:new Date(60000).toISOString()},100000).state,'stale');
});

test('P6B-T08 heartbeat older than 60 seconds is offline',()=>{
  assert.equal(Store.hostAvailability({status:'online',last_seen_at:new Date(30000).toISOString()},100000).state,'offline');
});

test('P6B-T09 missing heartbeat is offline',()=>{
  assert.equal(Store.hostAvailability(null).state,'offline');
});

test('P6B-T10 host id is stable in local storage and contains no secret',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const first=HostId.getHostId(storage),second=HostId.getHostId(storage);
  assert.equal(first,second);assert.match(first,/^browser-/);assert.ok(!/token|secret/i.test(first));
});

test('P6B-T11 job connector accepts the ten-minute bounded timeout',()=>{
  assert.equal(Connector.normalizeSettings({timeout:600000}).timeout,600000);
});

test('P6B-T12 job connector rejects unbounded or tiny timeouts',()=>{
  assert.throws(()=>Connector.normalizeSettings({timeout:1000}),error=>error.code==='INVALID_TIMEOUT');
  assert.throws(()=>Connector.normalizeSettings({timeout:600001}),error=>error.code==='INVALID_TIMEOUT');
});

test('P6B-T13 completed jobs map back to the Gateway connector shape',async()=>{
  const client=fakeClient(),result=await Connector.generateConstrainedFinancePatch({}, {timeout:5000,pollIntervalMs:100}, {context,client});
  assert.deepEqual(JSON.parse(result.rawText),{type:'expense'});assert.equal(result.model,'test');assert.match(result.metrics.jobId,/^job-/);
});

test('P6B-T14 invalid completed payload stops safely',async()=>{
  const client=fakeClient({invalidResult:true});
  await assert.rejects(()=>Connector.generateConstrainedFinancePatch({}, {timeout:5000,pollIntervalMs:100}, {context,client}),error=>error.code==='MODEL_OUTPUT_INVALID');
});

test('P6B-T15 Gateway host output is parsed without trusting prose',()=>{
  assert.deepEqual(Host.parseGatewayResult({rawText:'{"category":"餐飲"}',model:'gateway',metrics:{issues:[]}}).patch,{category:'餐飲'});
  assert.throws(()=>Host.parseGatewayResult({rawText:'not json'}),error=>error.code==='MODEL_OUTPUT_INVALID');
});

test('P6B-T16 unknown host errors collapse to a safe code',()=>{
  assert.equal(Host.safeErrorCode({code:'SENSITIVE_INTERNAL_ERROR'}),'AI_HOST_FAILED');
  assert.equal(Host.safeErrorCode({code:'OLLAMA_TIMEOUT'}),'OLLAMA_TIMEOUT');
});

test('P6B-T17 Browser Host completes one claimed job through localhost Gateway',async()=>{
  const calls=[],store={heartbeat:async()=>{},complete:async(id,hostId,result)=>calls.push({kind:'complete',id,hostId,result}),fail:async()=>{throw new Error('unexpected fail')},claim:async()=>null};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>({rawText:'{"type":"expense"}',model:'gateway',metrics:{issues:[],elapsedMs:4}})};
  const host=Host.createFinanceAIHost({store,gateway,hostId:'browser-test-host',gatewaySettings:{baseUrl:'http://127.0.0.1:4181'}});
  await host.processJob({id:'job-1',request_id:'req-1',request_payload:context});
  assert.equal(calls.length,1);assert.equal(calls[0].kind,'complete');assert.deepEqual(calls[0].result.patch,{type:'expense'});
});

test('P6B-T18 Browser Host reports safe failure and never writes a transaction',async()=>{
  const calls=[],store={heartbeat:async()=>{},complete:async()=>{throw new Error('unexpected complete')},fail:async(id,hostId,code)=>calls.push({id,hostId,code}),claim:async()=>null};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>{throw Object.assign(new Error('offline'),{code:'OLLAMA_UNAVAILABLE'});}};
  const host=Host.createFinanceAIHost({store,gateway,hostId:'browser-test-host'});
  await host.processJob({id:'job-2',request_id:'req-2',request_payload:context});
  assert.deepEqual(calls,[{id:'job-2',hostId:'browser-test-host',code:'OLLAMA_UNAVAILABLE'}]);
});

test('P6B-T19 migration enforces owner RLS, idempotency, expiry and atomic claim',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase/migrations/004_lizhi_finance_ai_jobs.sql'),'utf8');
  assert.match(sql,/unique \(user_id, request_id\)/i);assert.match(sql,/user_id = auth\.uid\(\)/i);assert.match(sql,/for update skip locked/i);assert.match(sql,/expires_at > now\(\)/i);assert.match(sql,/revoke all .* from anon/is);
});

test('P6B-T20 production assets load Job Bridge before SmallModelParser',()=>{
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8'),store=index.indexOf('finance-ai-job-store.js'),connector=index.indexOf('finance-ai-job-connector.js'),parser=index.indexOf('finance-small-model-parser.js');
  assert.ok(store>0&&connector>store&&parser>connector);assert.doesNotMatch(index,/ollama-connector\.js/);
});

test('P6B-T21 Service Worker cache is bumped and includes every bridge module',()=>{
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert.match(sw,/lizhi-cloud-v79/);for(const file of ['finance-ai-job-store.js','finance-ai-job-connector.js','finance-ai-host.js','finance-ai-host-id.js'])assert.match(sw,new RegExp(file.replaceAll('.','\\.')));
});

test('P6B-T22 production UI selects the Job Connector and local host keeps loopback',()=>{
  const home=fs.readFileSync(path.join(root,'finance/pages/home.js'),'utf8');assert.match(home,/location\.hostname==="lihuany635-create\.github\.io"/);assert.match(home,/productionJobBridge\?FinanceAIJobConnector:FinanceAIGatewayConnector/);assert.match(home,/baseUrl:"http:\/\/127\.0\.0\.1:4181"/);
});

test('P6B-T23 one-click Host script never starts a Tunnel and checks both loopback ports',()=>{
  const script=fs.readFileSync(path.join(root,'scripts/start-finance-ai-host.ps1'),'utf8');assert.match(script,/11434/);assert.match(script,/4181/);assert.match(script,/aiHost=1/);assert.doesNotMatch(script,/cloudflared.*tunnel/i);
});

test('P6B-T23B dedicated Host resists browser sleeping and wakes its heartbeat',async()=>{
  const script=fs.readFileSync(path.join(root,'scripts/start-finance-ai-host.ps1'),'utf8');
  assert.match(script,/--app=\$hostUrl/);assert.match(script,/--disable-background-timer-throttling/);assert.match(script,/--disable-renderer-backgrounding/);
  const calls=[],store={heartbeat:async(id,status)=>calls.push([id,status]),claim:async()=>null};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true})};
  const host=Host.createFinanceAIHost({store,gateway,hostId:'wake-host',heartbeatMs:60000,pollMs:60000});
  await host.start();await host.wake();await host.stop();
  assert.deepEqual(calls.map(item=>item[1]),['online','online','offline']);
});

test('P6B-T24 Phase 6B keeps Finance IndexedDB v1 and remote modules cannot write transactions',()=>{
  const db=fs.readFileSync(path.join(root,'finance/storage/finance-db.js'),'utf8');assert.match(db,/DB_VERSION=1/);
  for(const file of ['finance-ai-job-store.js','finance-ai-job-connector.js','finance-ai-host.js'])assert.doesNotMatch(fs.readFileSync(path.join(root,'finance/remote',file),'utf8'),/FinanceStorage\.transactions|transactions\.(?:create|update|delete)/);
  const home=fs.readFileSync(path.join(root,'finance/pages/home.js'),'utf8');assert.match(home,/aiAutoEntryEnabled=false/);
});

