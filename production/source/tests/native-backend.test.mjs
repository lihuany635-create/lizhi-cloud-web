import {readFileSync} from 'node:fs';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
import {test,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
const compile=(path,replacements=[])=>{let s=readFileSync(path,'utf8');for(const [a,b]of replacements)s=s.replaceAll(a,b);return 'data:text/javascript;base64,'+Buffer.from(transpileModule(s,{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022}}).outputText).toString('base64');};
const model=compile('lib/model-flow.ts'),domain=compile('lib/workflow.ts',[["from './model-flow'",`from '${model}'`]]),portfolio=compile('lib/portfolio.ts',[["from './workflow.ts'",`from '${domain}'`]]),managed=compile('lib/project-management.ts',[["from './workflow.ts'",`from '${domain}'`],["from './portfolio.ts'",`from '${portfolio}'`]]);
const {makeProject,makeWork}=await import(domain);
const env={SUPABASE_URL:'https://supabase.test',SUPABASE_SERVICE_ROLE_KEY:'dummy-test-server-key'};
globalThis.__NATIVE_TEST_ENV=env;
const imageDomain=compile('lib/project-images.ts',[["from './workflow.ts'",`from '${domain}'`],["from './project-management.ts'",`from '${managed}'`]]);
const imageBackend=compile('backend/images.ts',[["from '../lib/workflow.ts'",`from '${domain}'`],["from '../lib/project-management.ts'",`from '${managed}'`],["from '../lib/project-images.ts'",`from '${imageDomain}'`]]);
const recycleBackend=compile('lib/recycle-bin.ts',[["from './workflow.ts'",`from '${domain}'`],["from './project-management.ts'",`from '${managed}'`],["from './project-images.ts'",`from '${imageDomain}'`]]);
const assetsDomain=compile('lib/project-assets.ts',[["from './workflow.ts'",`from '${domain}'`],["from './project-management.ts'",`from '${managed}'`],["from './recycle-bin.ts'",`from '${recycleBackend}'`]]);
const state=compile('backend/state.ts',[["from '../lib/project-assets.ts'",`from '${assetsDomain}'`],["from '../lib/workflow.ts'",`from '${domain}'`],["from '../lib/portfolio.ts'",`from '${portfolio}'`],["from '../lib/project-management.ts'",`from '${managed}'`]]);
const {operate}=await import(state);
const {handler}=await import(compile('backend/index.ts',[["from '../lib/project-assets.ts'",`from '${assetsDomain}'`],["from '../lib/recycle-bin.ts'",`from '${recycleBackend}'`],["from './images.ts'",`from '${imageBackend}'`],["from '../lib/project-images.ts'",`from '${imageDomain}'`],["from './state.ts'",`from '${state}'`],["from '../lib/project-management.ts'",`from '${managed}'`],["from '../lib/workflow.ts'",`from '${domain}'`],["Deno.env.get(","globalThis.__NATIVE_TEST_ENV["]].slice(0,7).concat([["Deno.env.get('SUPABASE_URL')","globalThis.__NATIVE_TEST_ENV.SUPABASE_URL"],["Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')","globalThis.__NATIVE_TEST_ENV.SUPABASE_SERVICE_ROLE_KEY"],["Deno.serve(handler);",""]])));
const actualFetch=globalThis.fetch,ORIGIN='https://lihuany635-create.github.io',states=new Map();let conflict=false;
const aiKey='lzp_test-scoped-bridge',hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(aiKey))).toString('hex');
const response=(v,status=200)=>Response.json(v,{status});
let p;
beforeEach(()=>{
 states.clear();conflict=false;p=makeProject('真實使用者專案','EP01');states.set('owner',{revision:1,data:{rows:[p]}});states.set('other',{revision:1,data:{rows:[]}});
 globalThis.fetch=async(url,init={})=>{const u=new URL(url),h=new Headers(init.headers);
  if(u.pathname==='/auth/v1/user'){const token=h.get('authorization');return token==='Bearer valid-user'?response({id:'owner',email:'owner@test'}):token==='Bearer other-user'?response({id:'other',email:'other@test'}):response({},401);}
  assert.equal(h.get('apikey'),env.SUPABASE_SERVICE_ROLE_KEY);
  if(u.pathname==='/rest/v1/lizhi_production_ai_keys')return response(u.searchParams.get('key_hash')==='eq.'+hash?[{owner_id:'owner',chatgpt_owner:'chatgpt-owner'}]:[]);
  assert.equal(u.pathname,'/rest/v1/lizhi_production_state');const owner=u.searchParams.get('owner_id')?.slice(3);
  if(init.method==='PATCH'){const old=states.get(owner);if(conflict||String(old?.revision)!==u.searchParams.get('revision')?.slice(3))return response([]);const next={...old,...JSON.parse(init.body)};states.set(owner,next);return response([next]);}
  if(init.method==='POST'){const row=JSON.parse(init.body);if(states.has(row.owner_id))return response({},409);states.set(row.owner_id,{revision:row.revision,data:row.data});return new Response(null,{status:201});}
  return response(states.has(owner)?[states.get(owner)]:[]);
 };
});
after(()=>{globalThis.fetch=actualFetch;delete globalThis.__NATIVE_TEST_ENV;});
const request=(path,{token='valid-user',body,origin=ORIGIN,method}={})=>new Request('https://supabase.test/functions/v1/lizhi-production/'+path,{method:method??(body?'POST':'GET'),headers:{Authorization:'Bearer '+token,...origin?{Origin:origin}:{},'Content-Type':'application/json'},...body?{body:JSON.stringify(body)}:{}});
const bridge=(op,args=[])=>request('bridge',{token:aiKey,origin:null,body:{op,args}});
test('主站與ChatGPT工具讀取同一份資料，工具憑證不能冒充作者',async()=>{
 const web=await handler(request('projects?id='+p.id)),tool=await handler(bridge('getProject',[p.id]));assert.equal(web.status,200);assert.deepEqual(await web.json(),await tool.json());
 const r=await handler(bridge('mutate',[p.id,p.revision,'approve_stage',{stageId:'01'}]));assert.equal(r.status,403);assert.equal(states.get('owner').revision,1);
});
test('網頁儲存後工具即時讀到，過期版本與CAS衝突不覆寫資料',async()=>{
 const body={projectId:p.id,revision:p.revision,action:'save_stage',args:{stageId:'01',checks:[false,false,false],evidence:'',note:'原作整理到第三段'}};
 let r=await handler(request('projects',{body}));assert.equal(r.status,200);const saved=await r.json();assert.equal((await(await handler(bridge('getProject',[p.id]))).json()).stages['01'].note,body.args.note);
 assert.equal((await handler(request('projects',{body}))).status,409);const before=JSON.stringify(states.get('owner'));conflict=true;r=await handler(request('projects',{body:{...body,revision:saved.revision,args:{...body.args,note:'不可覆寫'}}}));assert.equal(r.status,409);assert.equal(JSON.stringify(states.get('owner')),before);
});
test('匿名、無效憑證、偽造跨帳號與外部來源均無法讀取資料',async()=>{
 assert.equal((await handler(request('projects',{token:''}))).status,401);assert.equal((await handler(request('projects',{token:'bad'}))).status,401);
 assert.equal((await handler(request('projects?id='+p.id,{token:'other-user'}))).status,404);assert.equal((await handler(request('projects',{origin:'https://evil.test'}))).status,403);
 assert.equal((await handler(request('bridge',{body:{op:'getProject',args:[p.id]}}))).status,403);
 assert.equal((await handler(request('projects',{token:aiKey}))).status,403);
 const preflight=await handler(request('projects',{method:'OPTIONS',token:''}));assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),ORIGIN);
});
test('搬移只接受綁定來源，完整保留ID與資料且重送不覆寫後續工作',async()=>{
 states.delete('owner');const rows=[p,makeWork('共用作品')],req=()=>request('bridge',{token:aiKey,origin:null,body:{op:'migrate',sourceOwner:'chatgpt-owner',rows}});
 assert.equal((await handler(request('bridge',{token:aiKey,origin:null,body:{op:'migrate',sourceOwner:'other',rows}}))).status,400);
 let r=await handler(req());assert.equal(r.status,200);assert.equal((await r.json()).count,2);assert.deepEqual(states.get('owner').data.rows,rows);
 states.get('owner').data.rows[0].stages['01'].note='搬移後的新工作';r=await handler(req());assert.equal(r.status,200);assert.equal(states.get('owner').data.rows[0].stages['01'].note,'搬移後的新工作');
 const changed=structuredClone(rows);changed[0].title='企圖覆寫';assert.equal((await handler(request('bridge',{token:aiKey,origin:null,body:{op:'migrate',sourceOwner:'chatgpt-owner',rows:changed}}))).status,409);
});
test('作品及集數建立原子保存，重複集數遭拒絕且原狀態不變',()=>{
 const a={id:'owner',name:'作者',kind:'author'},initial={rows:[]};let result=operate(initial,'createWork',['作品A'],a);const w=result.result.work,ep=result.result.episode;assert.equal(initial.rows.length,0);assert.equal(result.state.rows.length,2);
 const before=JSON.stringify(result.state);assert.throws(()=>operate(result.state,'createEpisode',[w.id,w.revision,'EP01','重複集數'],a),/已有/);assert.equal(JSON.stringify(result.state),before);
 const next=operate(result.state,'createEpisode',[w.id,w.revision,'EP02','第二集'],a);assert.equal(next.state.rows.length,3);assert.equal(next.result.work.revision,w.revision+1);assert.equal(next.result.episode.workId,w.id);assert.equal(ep.episode,'EP01');
});
test('專案清單將既有作品包成動畫專案，讀取不改動任何動畫及模型資料',()=>{
 const w=makeWork('現實遊戲');p.workId=w.id;p.entityType='episode';w.modelFlow={models:[],issues:[],packs:[],pins:[],history:[]};const initial={rows:[w,p],migration:{sourceOwner:'old',digest:'untouched',at:'then'}},before=JSON.stringify(initial);
 const listed=operate(initial,'listWorkspaceProjects',[],{id:'owner',name:'作者',kind:'author'});assert.equal(listed.changed,false);assert.equal(listed.result.length,1);assert.equal(listed.result[0].id,w.id);assert.equal(listed.result[0].episodeCount,1);assert.equal(JSON.stringify(initial),before);assert.deepEqual(listed.state,initial);
});
test('軟體及一般專案獨立保存，動畫專案一次建立作品與EP01',()=>{
 const actor={id:'owner',name:'AI',kind:'ai'},initial={rows:[p]},before=JSON.stringify(initial);let software=operate(initial,'createWorkspaceProject',[{kind:'software',title:'測試軟體',objective:'記錄實作'}],actor);
 assert.equal(software.result.kind,'software');assert.equal(software.state.rows.length,1);assert.equal(software.result.animation,null);assert.equal(JSON.stringify(initial),before);
 const animation=operate(software.state,'createWorkspaceProject',[{kind:'animation',title:'另一部動畫',objective:'動畫與模型'}],actor);assert.equal(animation.state.rows.length,3);assert.equal(animation.result.animation.episodes.length,1);assert.equal(animation.result.animation.episodes[0].episode,'EP01');
 const read=operate(animation.state,'getWorkspaceProject',[software.result.id],actor);assert.equal(read.result.journal.length,0);assert.equal(read.result.workId,undefined);
});
test('工作紀錄需有效階段及完成依據、保留AI身份、拒絕重複及過期寫入',()=>{
 const actor={id:'owner',name:'AI',kind:'ai'};let made=operate({rows:[p]},'createWorkspaceProject',[{kind:'software',title:'軟體',objective:''}],actor);const pr=made.result,a={key:'run-1',phase:'實作',status:'completed',summary:'新增功能',evidence:'repo/commit123',verification:'單元測試通過；尚未手機實測',nextStep:'手機檢查'};
 assert.throws(()=>operate(made.state,'appendWorkspaceRecord',[pr.id,1,{...a,evidence:''}],actor),/有效內容/);assert.throws(()=>operate(made.state,'appendWorkspaceRecord',[pr.id,1,{...a,phase:'模型製作'}],actor),/階段/);
 const next=operate(made.state,'appendWorkspaceRecord',[pr.id,1,a],actor);assert.equal(next.result.journal[0].actor,'ai');assert.equal(next.result.handoff.nextStep,'手機檢查');assert.equal(next.result.revision,2);assert.deepEqual(next.state.rows,made.state.rows);
 assert.throws(()=>operate(next.state,'appendWorkspaceRecord',[pr.id,1,{...a,key:'run-2'}],actor),/已更新/);assert.throws(()=>operate(next.state,'appendWorkspaceRecord',[pr.id,2,a],actor),/識別鍵已存在/);
 const second=operate(next.state,'appendWorkspaceRecord',[pr.id,2,{...a,key:'run-2',summary:'補測結果'}],actor);assert.equal(second.result.journal.length,2);assert.equal(second.result.journal[0].summary,'新增功能');
});
test('不同專案不能更新同一待辦，封存後阻止新增，可還原續作',()=>{
 const actor={id:'owner',name:'作者',kind:'author'};let a=operate({rows:[]},'createWorkspaceProject',[{kind:'general',title:'A',objective:''}],actor);const aid=a.result.id;let b=operate(a.state,'createWorkspaceProject',[{kind:'general',title:'B',objective:''}],actor);const bid=b.result.id;
 const task={title:'整理',phase:'規劃',status:'todo'};const saved=operate(b.state,'saveWorkspaceTask',[aid,1,task],actor),id=saved.result.tasks[0].id;assert.throws(()=>operate(saved.state,'saveWorkspaceTask',[bid,1,{...task,id}],actor),/找不到/);assert.throws(()=>operate(saved.state,'saveWorkspaceTask',[aid,2,{...task,id,status:'done'}],actor),/有效內容/);
 const archived=operate(saved.state,'updateWorkspaceProject',[aid,2,{archived:true}],actor);assert.throws(()=>operate(archived.state,'saveWorkspaceTask',[aid,3,task],actor),/還原/);const restored=operate(archived.state,'updateWorkspaceProject',[aid,3,{archived:false}],actor);assert.equal(operate(restored.state,'saveWorkspaceTask',[aid,4,task],actor).result.tasks.length,2);
});
test('專案網頁與AI橋接共用雲端資料，跨帳號及CAS衝突遭阻止',async()=>{
 let r=await handler(request('workspace',{body:{action:'createWorkspaceProject',args:{kind:'software',title:'正式介面測試',objective:'QA'}}}));assert.equal(r.status,200);const pr=await r.json();
 r=await handler(bridge('getWorkspaceProject',[pr.id]));assert.equal(r.status,200);assert.equal((await r.json()).title,pr.title);assert.equal((await handler(request('workspace?id='+pr.id,{token:'other-user'}))).status,404);
 const args={key:'qa-run',phase:'測試',status:'partial',summary:'測試共享資料',verification:'透過API檢查',nextStep:'檢查網頁'};
 r=await handler(bridge('appendWorkspaceRecord',[pr.id,1,args]));assert.equal(r.status,200);const read=await(await handler(request('workspace?id='+pr.id))).json();assert.equal(read.journal[0].actor,'ai');
 conflict=true;const before=JSON.stringify(states.get('owner'));r=await handler(bridge('appendWorkspaceRecord',[pr.id,read.revision,{...args,key:'next'}]));assert.equal(r.status,409);assert.equal(JSON.stringify(states.get('owner')),before);
});
const managedActor={id:'owner',name:'AI測試',kind:'ai'};
const makeManaged=(type='software',title='隔離軟體')=>operate({rows:[p]},'createManagedProject',[{key:'create-'+title,type,name:title,description:'驗證通用專案',initialStages:[{key:'M0',title:'調查'},{key:'M1',title:'Bridge'}]}],managedActor);
const managedWrite=(x,op,args,actor=managedActor)=>operate(x.state,op,[x.result.id,x.result.revision,{key:crypto.randomUUID(),...args}],actor);
test('四種專案範本可建立；模型與軟體不產生動畫EP，既有資料位元不變',()=>{for(const type of ['software','general','model','animation']){const initial=JSON.stringify(p),x=makeManaged(type,type);assert.equal(x.result.type,type);assert.equal(x.result.stages.length,2);assert.equal(x.state.rows.length,type==='animation'?3:1);assert.equal(JSON.stringify(p),initial);assert.equal(x.result.records.length,0);}});
test('沒有證據或未執行的PASS回報降為NOT_TESTED，保留原主張且不核定動畫',()=>{let x=makeManaged();x=managedWrite(x,'createProjectTask',{taskKey:'a',stageId:x.result.stages[0].id,title:'真正CADCraft',status:'PLANNED'});const task=x.result.managedTasks[0];x=managedWrite(x,'appendWorkRecord',{stageId:task.stageId,taskId:task.id,status:'PASS',mode:'not_run',scope:'CADCraft',summary:'自稱完成',method:'未執行',result:'無',nextStep:'實機測試'});assert.equal(x.result.records[0].status,'NOT_TESTED');assert.equal(x.result.records[0].requestedStatus,'PASS');assert.equal(x.result.managedTasks[0].status,'NOT_TESTED');assert.equal(x.state.rows[0].stages['01'].author,null);});
test('只有連結或未檢查成果不能作為PASS證據',()=>{let x=makeManaged();x=managedWrite(x,'registerProjectArtifact',{artifactKey:'url',title:'只有URL',location:'https://drive.google.com/file/d/example',availability:'reference'});x=managedWrite(x,'appendWorkRecord',{stageId:x.result.stages[0].id,status:'PASS',mode:'actual',scope:'link-only',summary:'不能只靠URL',method:'聲稱測試',result:'通過',evidenceIds:[x.result.artifacts[0].id],nextStep:'讀檔'});assert.equal(x.result.records[0].status,'NOT_TESTED');});
test('模擬PASS只更新精確任務，不會把真正引擎或其他階段標為PASS',()=>{let x=makeManaged();const st=x.result.stages[0].id;for(const key of ['mock','real'])x=managedWrite(x,'createProjectTask',{stageId:st,taskKey:key,title:key});x=managedWrite(x,'registerProjectArtifact',{artifactKey:'log',title:'模擬原始測試log',location:'mock.log',availability:'inspected',sha256:'a'.repeat(64),inspection:'讀取3個測試結果'});x=managedWrite(x,'appendWorkRecord',{stageId:st,taskId:x.result.managedTasks[0].id,status:'PASS',mode:'simulation',scope:'mock_cadcraft.py',summary:'模擬通過',method:'unittest',result:'3/3',evidenceIds:[x.result.artifacts[0].id],nextStep:'真實引擎'});assert.equal(x.result.records[0].status,'PASS');assert.equal(x.result.managedTasks[0].status,'PASS');assert.equal(x.result.managedTasks[1].status,'PLANNED');assert.equal(x.result.stages[0].status,'IN_PROGRESS');assert.equal(x.result.handoff.passed[0].mode,'simulation');});
test('文件來源未讀不能PASS；已讀必須具內容雜湊與閱讀觀察',()=>{let x=makeManaged();assert.throws(()=>managedWrite(x,'registerProjectSource',{sourceKey:'s',title:'來源',location:'url',readStatus:'read'}),/快照/);x=managedWrite(x,'registerProjectSource',{sourceKey:'s',title:'來源',location:'url',readStatus:'read',snapshot:'讀取原文',sha256:'a'.repeat(64),observation:'只查文件合約'});x=managedWrite(x,'appendWorkRecord',{stageId:x.result.stages[0].id,status:'PASS',mode:'document',scope:'靜態合約調查',summary:'讀取來源',method:'逐段查核',result:'有CLI合約',sourceIds:[x.result.sources[0].id],nextStep:'實機測試'});assert.equal(x.result.records[0].status,'PASS');});
test('跨專案的階段、任務、成果引用全部拒絕',()=>{const a=makeManaged('software','A'),b=operate(a.state,'createManagedProject',[{key:'B',type:'general',name:'B',description:''}],managedActor);assert.throws(()=>managedWrite(b,'createProjectTask',{stageId:a.result.stages[0].id,taskKey:'x',title:'x'}),/階段/);assert.throws(()=>managedWrite(b,'appendWorkRecord',{stageId:b.result.stages[0].id,status:'PASS',mode:'actual',scope:'x',summary:'x',method:'x',result:'x',evidenceIds:['other'],nextStep:'x'}),/同一專案/);assert.throws(()=>managedWrite(b,'updateProjectTask',{stageId:b.result.stages[0].id,taskId:'other',title:'x',status:'PASS'}),/任務/);});
test('專案、任務及每次異動防重；過期revision衝突不覆寫',()=>{let x=makeManaged();assert.throws(()=>operate(x.state,'createManagedProject',[{key:'create-隔離軟體',type:'software',name:'重複'}],managedActor),/識別鍵/);const args={key:'same-write',taskKey:'same-task',stageId:x.result.stages[0].id,title:'任務'};x=managedWrite(x,'createProjectTask',args);assert.throws(()=>managedWrite(x,'createProjectTask',args),/重複提交/);assert.throws(()=>managedWrite(x,'createProjectTask',{...args,key:'new'}),/任務識別鍵/);assert.throws(()=>operate(x.state,'updateManagedProject',[x.result.id,1,{key:'old',description:'不得覆寫'}],managedActor),/已更新/);});
test('新增與解決問題、操作限制與下一步可由交接讀回，AI無法正式結案',()=>{let x=makeManaged();x=managedWrite(x,'reportProjectIssue',{issueKey:'env',title:'缺少證據',detail:'須核對實機log'});assert.equal(x.result.status,'blocked');let h=operate(x.state,'getProjectHandoff',[x.result.id],managedActor).result;assert.equal(h.blockers.length,1);assert.ok(h.restrictions.length);assert.throws(()=>managedWrite(x,'updateManagedProject',{status:'completed'}),/作者確認/);x=managedWrite(x,'resolveProjectIssue',{issueId:x.result.issues[0].id,resolution:'取得原始log，尚未結束測試'});assert.equal(x.result.issues[0].status,'resolved');});
test('v6紀錄無證據不自動升PASS；讀取不破壞原journal及rows',()=>{let x=operate({rows:[p]},'createWorkspaceProject',[{kind:'software',title:'舊版',objective:''}],managedActor);x=operate(x.state,'appendWorkspaceRecord',[x.result.id,1,{key:'old',phase:'測試',status:'completed',summary:'舊回報',evidence:'url',verification:'聲稱通過',nextStep:'補證據'}],managedActor);const before=JSON.stringify(x.state),v=operate(x.state,'getManagedProject',[x.result.id],managedActor);assert.equal(v.result.records[0].status,'NOT_TESTED');assert.equal(v.changed,false);assert.equal(JSON.stringify(x.state),before);});
test('備份回復建立新revision並保留回復前快照，AI及錯專案備份遭拒絕',()=>{let x=makeManaged();const backup=structuredClone(x.result),author={...managedActor,name:'作者',kind:'author'};x=managedWrite(x,'createProjectStage',{stageKey:'M2',title:'新階段'});assert.throws(()=>managedWrite(x,'restoreProjectBackup',{backup}),/作者/);assert.throws(()=>managedWrite(x,'restoreProjectBackup',{backup:{...backup,id:'other'}},author),/不相符/);const rows=JSON.stringify(x.state.rows),oldRev=x.result.revision;x=managedWrite(x,'restoreProjectBackup',{backup},author);assert.equal(x.result.stages.length,2);assert.equal(x.result.revision,oldRev+1);assert.equal(JSON.stringify(x.state.rows),rows);assert.ok(x.result.history.some(h=>h.action==='restore_snapshot_before'));});
test('通用API寫入讀回、重新請求後仍存在，權限、CAS及來源雜湊驗證',async()=>{
 let r=await handler(request('workspace',{body:{action:'createManagedProject',args:{key:'new',type:'software',name:'CAD專案',description:'隔離'}}}));assert.equal(r.status,200);let x=await r.json();assert.equal((await(await handler(request('workspace?view=managed&id='+x.id))).json()).name,'CAD專案');assert.equal((await handler(request('workspace?view=managed&id='+x.id,{token:'other-user'}))).status,404);
 const record={key:'note',stageId:x.stages[0].id,status:'IN_PROGRESS',mode:'document',scope:'進度補登',summary:'實際寫入',nextStep:'確認保存'};r=await handler(bridge('appendWorkRecord',[x.id,x.revision,record]));assert.equal(r.status,200);x=await r.json();assert.equal(x.records[0].actor,'ai');assert.equal((await(await handler(request('workspace?view=managed&id='+x.id))).json()).records.length,1);assert.equal((await handler(bridge('appendWorkRecord',[x.id,1,{...record,key:'stale'}]))).status,409);
 const invalid={key:'bad-hash',sourceKey:'s',title:'來源',location:'url',readStatus:'read',snapshot:'actual',sha256:'a'.repeat(64),observation:'read'};assert.equal((await handler(bridge('registerProjectSource',[x.id,x.revision,invalid]))).status,400);
});
test('來源保留原文前後空白，伺服器核對的SHA256與存入快照一致',async()=>{
 let r=await handler(request('workspace',{body:{action:'createManagedProject',args:{key:'source-whitespace',type:'software',name:'來源精確性',description:''}}}));const x=await r.json(),snapshot='  原始內容\n';const digest=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(snapshot))).toString('hex');
 r=await handler(bridge('registerProjectSource',[x.id,x.revision,{key:'preserve',sourceKey:'raw',title:'原文',location:'https://example.test/source',readStatus:'read',snapshot,sha256:digest,observation:'實際原文含空白'}]));assert.equal(r.status,200);const saved=await r.json();assert.equal(saved.sources[0].snapshot,snapshot);assert.equal(Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(saved.sources[0].snapshot))).toString('hex'),saved.sources[0].sha256);
});

test('圖片入口同樣阻擋匿名、無效憑證、外部來源與跨帳號',async()=>{
 const path='images?projectId='+p.id+'&imageId='+crypto.randomUUID();
 assert.equal((await handler(request(path,{token:''}))).status,401);
 assert.equal((await handler(request(path,{token:'bad'}))).status,401);
 assert.equal((await handler(request(path,{origin:'https://evil.test'}))).status,403);
 assert.equal((await handler(request(path,{token:'other-user'}))).status,404);
 assert.equal((await handler(request(path,{token:aiKey}))).status,403);
});

test('垃圾桶只接受本人網頁，AI工具及未登入不能刪除或還原',async()=>{assert.equal((await handler(request('trash',{token:aiKey,origin:null}))).status,403);assert.equal((await handler(request('trash',{token:'invalid'}))).status,401);assert.equal((await handler(request('trash',{token:aiKey,origin:null,body:{action:'trash'}}))).status,403);assert.equal((await handler(request('trash'))).status,200);});
test('本人刪除專案移入垃圾桶，另一帳號不可讀回或還原，過期版本被擋',async()=>{const created=await handler(request('workspace',{body:{action:'createManagedProject',args:{key:'trash-qa',type:'general',name:'垃圾桶測試',description:''}}}));const project=await created.json();let state=states.get('owner');const result=await handler(request('trash',{body:{action:'trash',kind:'project',projectId:project.id,projectRevision:project.revision,revision:state.revision,key:'trash-one'}}));assert.equal(result.status,200);const bin=await result.json();assert.equal(bin.items.length,1);assert.equal((await handler(bridge('getManagedProject',[project.id]))).status,404);const other=await handler(request('trash',{token:'other-user',body:{action:'restore',trashId:bin.items[0].id,projectId:project.id,revision:1,key:'cross-owner'}}));assert.equal(other.status,404);const old=await handler(request('trash',{body:{action:'restore',trashId:bin.items[0].id,projectId:project.id,revision:state.revision,key:'old'}}));assert.equal(old.status,409);const restored=await handler(request('trash',{body:{action:'restore',trashId:bin.items[0].id,projectId:project.id,revision:bin.revision,key:'restore-one'}}));assert.equal(restored.status,200);assert.equal((await handler(bridge('getManagedProject',[project.id]))).status,200);});
test('素材API與AI橋接共用持久化資料夾，跨帳號隔離及AI核定拒絕',async()=>{let r=await handler(request('workspace',{body:{action:'createManagedProject',args:{key:'asset-api-project',type:'model',name:'素材API隔離',description:''}}}));assert.equal(r.status,200);const p=await r.json();r=await handler(bridge('createProjectFolder',[p.id,p.revision,{key:'folder-api',name:'人物參考'}]));assert.equal(r.status,200);const saved=await r.json(),id=saved.results[0].id;const read=await handler(request('workspace',{body:{action:'listProjectFolders',id:p.id,args:{}}}));assert.equal(read.status,200);assert.equal((await read.json()).folders[0].id,id);assert.equal((await handler(request('workspace',{token:'other-user',body:{action:'listProjectFolders',id:p.id,args:{}}}))).status,404);assert.equal((await handler(bridge('adoptDrawingBaseline',[p.id,saved.revision,{key:'no-adopt',drawingId:'anything',reason:'AI不得核定',currentBaselineId:''}]))).status,403);assert.equal((await handler(bridge('createProjectFolder',[p.id,p.revision,{key:'stale-folder',name:'過期'}]))).status,409);});
