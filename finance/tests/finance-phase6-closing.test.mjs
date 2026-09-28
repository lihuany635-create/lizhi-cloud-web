import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const Store=require('../remote/finance-ai-job-store.js');
const Host=require('../remote/finance-ai-host.js');
const Context=require('../ai/finance-ai-context.js');
const SmallModel=require('../ai/finance-small-model-parser.js');
const Template=require('../domain/finance-transaction-template.js');
const Validator=require('../domain/finance-draft-validator.js');
const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(dirname,'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const home=()=>read('finance/pages/home.js');
const context={rawText:'花了500，錢包',draft:Template.sanitizeFinanceTransactionTemplate({amount:500,account:'錢包',dateToken:'today',date:'2026-09-28',rawText:'花了500，錢包',source:'text'}),lockedFields:['amount','account','dateToken','date'],typeHints:['expense'],allowedValues:{types:['expense','income','transfer','credit_card_purchase','credit_card_payment'],accounts:['錢包'],creditCards:[],categories:[]}};

test('P6-CLOSE-01 silent host refresh does not full-render page',()=>{
  assert.match(home(),/if\(silent&&productionJobBridge&&!aiHostMode\)updateHostStatusIndicators\(\);else update\(\)/);
});

test('P6-CLOSE-02 AI textarea preserves input across host refresh',()=>{
  assert.match(home(),/addEventListener\("input"[\s\S]*ui\.ai\.input=event\.target\.value/);
});

test('P6-CLOSE-03 textarea focus is restored after a necessary render',()=>{
  const source=home();assert.match(source,/document\.activeElement===currentInput/);assert.match(source,/nextInput\.focus\(\{preventScroll:true\}\)/);
});

test('P6-CLOSE-04 textarea cursor selection is restored',()=>{
  const source=home();assert.match(source,/selectionStart/);assert.match(source,/selectionEnd/);assert.match(source,/setSelectionRange\(restoreInput\.start,restoreInput\.end/);
});

test('P6-CLOSE-05 host status still refreshes every 12 seconds',()=>{
  assert.match(home(),/setInterval\(\(\)=>void refreshOllamaStatus\(\{silent:true\}\),12000\)/);
});

test('P6-CLOSE-06 visibilitychange refresh works',()=>{
  assert.match(home(),/visibilitychange[\s\S]*visibilityState==="visible"[\s\S]*refreshOllamaStatus\(\{silent:true\}\)/);
});

test('P6-CLOSE-07 offline host is reported after more than 60 seconds',()=>{
  assert.equal(Store.hostAvailability({status:'online',last_seen_at:new Date(30000).toISOString()},100000).state,'offline');
});

test('P6-CLOSE-08 offline pending job does not commit a transaction',()=>{
  const remote=['finance-ai-job-store.js','finance-ai-job-connector.js','finance-ai-host.js'].map(file=>read(`finance/remote/${file}`)).join('\n');assert.doesNotMatch(remote,/FinanceStorage\.transactions|transactions\.(?:create|update|delete)/);
});

test('P6-CLOSE-09 host restart claims a pending unexpired job',async()=>{
  let claimed=false,completed=false;const store={heartbeat:async()=>{},claim:async()=>claimed?null:(claimed=true,{id:'pending-1',request_id:'restart-1',request_payload:context,status:'processing'}),complete:async()=>{completed=true;},fail:async()=>{}};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>({rawText:'{}',metrics:{issues:[]}})};
  const host=Host.createFinanceAIHost({store,gateway,hostId:'restart-host',pollMs:250});await host.start();for(let i=0;i<20&&!completed;i++)await new Promise(resolve=>setTimeout(resolve,20));await host.stop();assert.equal(completed,true);
});

test('P6-CLOSE-10 expired job is not claimed',()=>{
  const sql=read('supabase/migrations/004_lizhi_finance_ai_jobs.sql');assert.match(sql,/status = 'pending'[\s\S]*expires_at > now\(\)/);
});

test('P6-CLOSE-11 cancelled job is not claimed',()=>{
  const sql=read('supabase/migrations/004_lizhi_finance_ai_jobs.sql');assert.match(sql,/where user_id = auth\.uid\(\)[\s\S]*and status = 'pending'/);assert.doesNotMatch(sql,/status\s+in\s*\('pending',\s*'cancelled'\)/i);
});

test('P6-CLOSE-12 Ollama failure keeps heartbeat online',async()=>{
  const beats=[];const store={heartbeat:async(_id,status)=>beats.push(status),claim:async()=>null,complete:async()=>{},fail:async()=>{}};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>{throw Object.assign(new Error('offline'),{code:'OLLAMA_UNAVAILABLE'});}};
  await Host.createFinanceAIHost({store,gateway,hostId:'failure-host'}).processJob({id:'failed-1',request_id:'failed-1',request_payload:context});assert.deepEqual(beats,['busy','online']);
});

test('P6-CLOSE-13 Ollama failure returns safe errorCode',async()=>{
  const failures=[];const store={heartbeat:async()=>{},claim:async()=>null,complete:async()=>{},fail:async(_id,_host,code)=>failures.push(code)};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>{throw Object.assign(new Error('private stack'),{code:'OLLAMA_UNAVAILABLE'});}};
  await Host.createFinanceAIHost({store,gateway,hostId:'failure-host'}).processJob({id:'failed-2',request_id:'failed-2',request_payload:context});assert.deepEqual(failures,['OLLAMA_UNAVAILABLE']);
});

test('P6-CLOSE-14 job failure does not set Host disconnected',()=>{
  const source=home();assert.match(source,/jobFailureMessage[\s\S]*hostHeartbeatHealthy/);assert.doesNotMatch(source,/jobFailureMessage[^{]*\{[^}]*status="disconnected"/);
});

test('P6-CLOSE-15 busy heartbeat continues during a long process',async()=>{
  const beats=[];let release;const pending=new Promise(resolve=>{release=resolve;});let claimed=false;
  const store={heartbeat:async(_id,status)=>beats.push(status),claim:async()=>claimed?null:(claimed=true,{id:'busy-1',request_id:'busy-1',request_payload:context}),complete:async()=>{},fail:async()=>{}};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>{await pending;return {rawText:'{}',metrics:{issues:[]}};}};
  const host=Host.createFinanceAIHost({store,gateway,hostId:'busy-host',heartbeatMs:1000,pollMs:250});await host.start();await new Promise(resolve=>setTimeout(resolve,1150));assert.ok(beats.filter(status=>status==='busy').length>=2);release();await new Promise(resolve=>setTimeout(resolve,20));await host.stop();
});

test('P6-CLOSE-16 same-account transfer remains blocked',()=>{
  const refs={accounts:[{id:'wallet',name:'錢包',active:true}],categories:[],creditCards:[]};const draft=Template.sanitizeFinanceTransactionTemplate({type:'transfer',amount:1000,fromAccount:'錢包',toAccount:'錢包',dateToken:'today',date:'2026-09-28',rawText:'從錢包轉1000到錢包',source:'text'});const result=Validator.validateFinanceDraftForCommit(draft,{references:refs});assert.equal(result.status,'blocked');assert.equal(result.invalidFields[0].code,'same_transfer_account');assert.equal(result.invalidFields[0].message,'轉出與轉入帳戶不可相同');
});

test('P6-CLOSE-17 a complete rule draft skips the AI connector',async()=>{
  let calls=0;const draft=Template.sanitizeFinanceTransactionTemplate({type:'expense',amount:250,category:'餐飲',account:'錢包',dateToken:'today',date:'2026-09-28',rawText:'早餐兩百五，錢包',source:'rules'}),ruleResult={draft,lockedFields:['type','amount','category','account','dateToken','date'],issues:[],typeHints:['expense'],sourceTrace:{}};
  const result=await SmallModel.parseFinanceWithSmallModel({rawText:draft.rawText,draft,ruleResult,references:{accounts:[{name:'錢包'}],categories:[{name:'餐飲',type:'expense'}],creditCards:[]},connector:{generateConstrainedFinancePatch:async()=>{calls+=1;}}});assert.equal(result.context.shouldCallAI,false);assert.equal(calls,0);
});

test('P6-CLOSE-18 AI-required case completes the Job lifecycle',async()=>{
  const states=['pending'],store={heartbeat:async()=>{},claim:async()=>null,complete:async()=>states.push('completed'),fail:async()=>{}};const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>{states.push('processing');return {rawText:'{}',metrics:{issues:[]}};}};await Host.createFinanceAIHost({store,gateway,hostId:'lifecycle-host'}).processJob({id:'life-1',request_id:'life-1',request_payload:context});assert.deepEqual(states,['pending','processing','completed']);
});

test('P6-CLOSE-19 production autoEntry remains disabled',()=>{
  assert.match(home(),/aiAutoEntryEnabled=false/);
});

test('P6-CLOSE-20 Finance DB_VERSION remains 1',()=>{
  assert.match(read('finance/storage/finance-db.js'),/DB_VERSION=1/);
});
