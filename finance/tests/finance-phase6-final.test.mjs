import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {validateFinanceParseRequest} from '../gateway/gateway-request-validator.mjs';

const require=createRequire(import.meta.url);
const Store=require('../remote/finance-ai-job-store.js');
const Connector=require('../remote/finance-ai-job-connector.js');
const Host=require('../remote/finance-ai-host.js');
const SmallModel=require('../ai/finance-small-model-parser.js');
const RuleEngine=require('../domain/finance-rule-engine.js');
const Context=require('../ai/finance-ai-context.js');
const Template=require('../domain/finance-transaction-template.js');
const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(dirname,'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const references={accounts:[{id:'wallet',name:'錢包',active:true}],creditCards:[],categories:[]};
const ruleResult=RuleEngine.parseFinanceRulesToDraft('花了500，錢包',{currentDate:'2026-09-28',...references});
const aiContext=Context.buildFinanceAiContext({rawText:'花了500，錢包',draft:ruleResult.draft,ruleResult,references});

test('P6-FINAL-01 connector errorCode is preserved safely',()=>{
  const mapped=Connector.mapError(new Store.FinanceAIJobError('JOB_ENQUEUE_FAILED','unsafe',{supabaseCode:'42501'},undefined,'enqueue'));
  assert.equal(mapped.code,'JOB_ENQUEUE_FAILED');assert.equal(mapped.stage,'enqueue');assert.deepEqual(mapped.details,{supabaseCode:'42501'});
});

test('P6-FINAL-02 JOB_ENQUEUE_FAILED is not mapped only to ai_unavailable',async()=>{
  const connector={generateConstrainedFinancePatch:async()=>{throw new Store.FinanceAIJobError('JOB_ENQUEUE_FAILED','unsafe',{},undefined,'enqueue');}};
  const result=await SmallModel.parseFinanceWithSmallModel({rawText:'花了500，錢包',draft:ruleResult.draft,ruleResult,references,connector});
  assert.deepEqual(result.aiResult.issues,['ai_unavailable']);assert.equal(result.aiResult.errorCode,'JOB_ENQUEUE_FAILED');
});

test('P6-FINAL-03 safe errorStage is preserved',()=>{
  assert.deepEqual(SmallModel.safeErrorMetadata({code:'JOB_READ_FAILED',stage:'wait'}),{code:'JOB_READ_FAILED',stage:'wait'});
  assert.deepEqual(SmallModel.safeErrorMetadata({code:'SECRET_DB_ERROR',stage:'sql'}),{code:'INTERNAL_ERROR',stage:'result'});
});

test('P6-FINAL-04 enqueue diagnostics expose no token or secret',async()=>{
  class Query{insert(){return this;}select(){return this;}single(){return Promise.resolve({data:null,error:{code:'42501',message:'token=secret service_role'}});}eq(){return this;}maybeSingle(){return Promise.resolve({data:null,error:{code:'42501'}});}}
  const client={auth:{getSession:async()=>({data:{session:{user:{id:'user-1'},access_token:'secret'}}})},from:()=>new Query(),rpc:async()=>({data:[]})};
  await assert.rejects(()=>Store.enqueue(aiContext,{requestId:'safe-request',client}),error=>{const visible=JSON.stringify({code:error.code,stage:error.stage,details:error.details,message:error.message});return error.code==='JOB_ENQUEUE_FAILED'&&error.stage==='enqueue'&&!/token=|service_role|access_token/i.test(visible);});
});

test('P6-FINAL-05 healthy heartbeat plus job failure keeps Host online',()=>{
  const availability=Store.hostAvailability({status:'online',last_seen_at:new Date(95000).toISOString()},100000);
  const home=read('finance/pages/home.js');assert.equal(availability.state,'online');assert.match(home,/hostHeartbeatHealthy\(\).*家中 AI 主機在線/s);
});

test('P6-FINAL-06 Host offline depends on last_seen_at freshness',()=>{
  assert.equal(Store.hostAvailability({status:'online',last_seen_at:new Date(39000).toISOString()},100000).state,'offline');
  assert.equal(Store.hostAvailability({status:'offline',last_seen_at:new Date(95000).toISOString()},100000).state,'online');
});

test('P6-FINAL-07 production Host status refresh uses a 12 second timer',()=>{
  const home=read('finance/pages/home.js');assert.match(home,/setInterval\(\(\)=>void refreshOllamaStatus\(\{silent:true\}\),12000\)/);
});

test('P6-FINAL-08 visibilitychange refreshes Host status on foreground',()=>{
  const home=read('finance/pages/home.js');assert.match(home,/visibilitychange/);assert.match(home,/visibilityState==="visible"/);
});

test('P6-FINAL-09 花了500，錢包 requires AI because type and category remain missing',()=>{
  assert.equal(aiContext.shouldCallAI,true);assert.ok(aiContext.missingFields.includes('type'));assert.ok(aiContext.missingFields.includes('category'));
});

test('P6-FINAL-10 real Canonical Draft passes Gateway request validation',()=>{
  const draft=Template.sanitizeFinanceTransactionTemplate(ruleResult.draft);
  const request=validateFinanceParseRequest({task:'finance_parse',requestId:'phase6-final-canonical',rawText:'花了500，錢包',draft,lockedFields:ruleResult.lockedFields,typeHints:ruleResult.typeHints,allowedValues:{types:['expense','income','transfer','credit_card_purchase','credit_card_payment'],accounts:['錢包'],creditCards:[],categories:[]}});
  assert.equal(request.draft.version,'1.0');for(const field of ['version','action','type','amount','category','account','creditCard','fromAccount','toAccount','merchant','dateToken','date','note','rawText','source','confidence'])assert.ok(Object.hasOwn(request.draft,field));
});

test('P6-FINAL-11 Browser Host processes a valid Canonical Job',async()=>{
  const calls=[],store={heartbeat:async()=>{},claim:async()=>null,complete:async(id,hostId,result)=>calls.push({id,hostId,result}),fail:async()=>{throw new Error('unexpected fail');}};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async(_prompt,_settings,{context})=>{assert.equal(context.draft.version,'1.0');return {rawText:'{"type":"expense"}',model:'gateway',metrics:{issues:[]}};}};
  const host=Host.createFinanceAIHost({store,gateway,hostId:'browser-final'});await host.processJob({id:'job-1',request_id:'req-1',request_payload:aiContext});assert.equal(calls[0].result.patch.type,'expense');
});

test('P6-FINAL-12 Job lifecycle is pending to processing to completed',async()=>{
  const states=['pending'],store={heartbeat:async()=>{},claim:async()=>null,complete:async()=>states.push('completed'),fail:async()=>{}};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>{states.push('processing');return {rawText:'{}',metrics:{issues:[]}};}};
  await Host.createFinanceAIHost({store,gateway,hostId:'browser-final'}).processJob({id:'job-2',request_id:'req-2',request_payload:aiContext});assert.deepEqual(states,['pending','processing','completed']);
});

test('P6-FINAL-13 failed Job returns the correct safe errorCode',async()=>{
  const failures=[],store={heartbeat:async()=>{},claim:async()=>null,complete:async()=>{},fail:async(_id,_host,code)=>failures.push(code)};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>{throw Object.assign(new Error('private detail'),{code:'OLLAMA_UNAVAILABLE'});}};
  await Host.createFinanceAIHost({store,gateway,hostId:'browser-final'}).processJob({id:'job-3',request_id:'req-3',request_payload:aiContext});assert.deepEqual(failures,['OLLAMA_UNAVAILABLE']);
});

test('P6-FINAL-14 heartbeat continues while Host is busy',async()=>{
  const beats=[];let releaseModel;const modelPending=new Promise(resolve=>{releaseModel=resolve;});let claimed=false;
  const store={heartbeat:async(_id,status)=>beats.push(status),claim:async()=>claimed?null:(claimed=true,{id:'job-busy',request_id:'req-busy',request_payload:aiContext}),complete:async()=>{},fail:async()=>{}};
  const gateway={DEFAULT_SETTINGS:{},checkGatewayHealth:async()=>({connected:true}),generateConstrainedFinancePatch:async()=>{await modelPending;return {rawText:'{}',metrics:{issues:[]}};}};
  const host=Host.createFinanceAIHost({store,gateway,hostId:'browser-final',heartbeatMs:1000,pollMs:250});await host.start();await new Promise(resolve=>setTimeout(resolve,1150));assert.ok(beats.filter(value=>value==='busy').length>=2);releaseModel();await new Promise(resolve=>setTimeout(resolve,20));await host.stop();
});

test('P6-FINAL-15 production autoEntry remains disabled',()=>{
  assert.match(read('finance/pages/home.js'),/aiAutoEntryEnabled=location\.hostname!=="lihuany635-create\.github\.io"/);
});

test('P6-FINAL-16 Finance DB_VERSION remains 1',()=>{
  assert.match(read('finance/storage/finance-db.js'),/DB_VERSION=1/);
});

test('P6-FINAL-17 launcher supports Windows PowerShell without pwsh',()=>{
  const script=read('scripts/start-finance-ai-host.ps1');assert.match(script,/Get-Process -Id \$PID/);assert.doesNotMatch(script,/Get-Command pwsh/);assert.match(script,/@\(Get-Listeners 11434\)/);assert.match(script,/@\(Get-Listeners 4181\)/);
});

test('P6-FINAL-18 launcher and Gateway remain loopback-only',()=>{
  const launcher=read('scripts/start-finance-ai-host.ps1'),gateway=read('finance/gateway/gateway-config.mjs');assert.match(launcher,/OLLAMA_HOST = '127\.0\.0\.1:11434'/);assert.match(launcher,/127\.0\.0\.1.*4181/s);assert.doesNotMatch(launcher,/cloudflared|tunnel/i);assert.match(gateway,/127\.0\.0\.1/);assert.doesNotMatch(gateway,/host.*0\.0\.0\.0/i);
});
