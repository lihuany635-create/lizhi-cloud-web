import {readFileSync} from 'node:fs';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
import {test,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
const compile=(path,replacements=[])=>{let s=readFileSync(path,'utf8');for(const [a,b]of replacements)s=s.replaceAll(a,b);return 'data:text/javascript;base64,'+Buffer.from(transpileModule(s,{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022}}).outputText).toString('base64');};
const model=compile('lib/model-flow.ts'),domain=compile('lib/workflow.ts',[["from './model-flow'",`from '${model}'`]]),state=compile('backend/state.ts',[["from '../lib/workflow.ts'",`from '${domain}'`]]);
const {makeProject,makeWork}=await import(domain),{operate}=await import(state);
const env={SUPABASE_URL:'https://supabase.test',SUPABASE_SERVICE_ROLE_KEY:'dummy-test-server-key'};
globalThis.__NATIVE_TEST_ENV=env;
const {handler}=await import(compile('backend/index.ts',[["from './state.ts'",`from '${state}'`],["from '../lib/workflow.ts'",`from '${domain}'`],["Deno.env.get(","globalThis.__NATIVE_TEST_ENV["]].slice(0,2).concat([["Deno.env.get('SUPABASE_URL')","globalThis.__NATIVE_TEST_ENV.SUPABASE_URL"],["Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')","globalThis.__NATIVE_TEST_ENV.SUPABASE_SERVICE_ROLE_KEY"],["Deno.serve(handler);",""]])));
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
