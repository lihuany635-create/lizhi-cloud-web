/**
 * v2.2 Node --experimental-strip-types runtime mock of the ACTUAL candidate
 * production/source/backend/index.ts handler. In-memory fixture only.
 * Never calls Supabase, never reads secrets, does not alter any site.
 */
import assert from 'node:assert/strict';
import {PROJECT} from '../../production/source/lib/ai-loop-compact.mjs';

const state={rows:[],portfolio:[{
 id:PROJECT,kind:'software',title:'PRIVATE PROJECT',objective:'PRIVATE',
 revision:123,archived:false,createdAt:'2026-01-01T00:00:00Z',
 updatedAt:'2026-01-01T00:00:00Z',journal:[],tasks:[],history:[],
 stages:[{id:'stage-1',key:'ONE',title:'ONE',order:0}],
 managedTasks:[{id:'task-1',key:'worker',status:'IN_PROGRESS',title:'PRIVATE TASK'}],
 records:[{id:'record-1',key:'last-work',summary:'PRIVATE SUMMARY',status:'IN_PROGRESS'}],
 artifacts:[{id:'art-1',secret:'PRIVATE'.repeat(100000)}],sources:[],issues:[],
 restrictions:[],images:[]
 },{
 id:'foreign-id',kind:'software',title:'FOREIGN',objective:'PRIVATE',
 revision:8,archived:false,createdAt:'2026-01-01T00:00:00Z',
 updatedAt:'2026-01-01T00:00:00Z',journal:[],tasks:[],history:[]
}]};
let calls=[];
globalThis.Deno={env:{get:(name)=>name==='SUPABASE_URL'?'https://supabase.test.invalid':'TEST_SERVICE_KEY'},serve:(handler)=>{globalThis.__candidateHandler=handler;}};
globalThis.fetch=async (url,options={})=>{
 calls.push({url:String(url),method:options.method??'GET'});
 const s=String(url);
 if(s.includes('lizhi_production_ai_keys?'))return Response.json([{owner_id:'owner-db',chatgpt_owner:'owner-user'}]);
 if(s.includes('lizhi_production_state?owner_id=eq.owner-db'))return Response.json([{revision:100,data:state}]);
 if(s.includes('/auth/v1/user'))return new Response(null,{status:401});
 throw new Error('UNEXPECTED_TEST_NETWORK_CALL');
};
await import('../../production/source/backend/index.ts');
const handler=globalThis.__candidateHandler;
assert.equal(typeof handler,'function');
async function query(op,args,extra={}){
 return handler(new Request('https://supabase.test.invalid/functions/v1/lizhi-production/bridge',{
  method:'POST',headers:{authorization:'Bearer lzp_TEST_KEY','content-type':'application/json'},
  body:JSON.stringify({op,args,...extra})
 }));
}
const list=await query('listManagedProjectsCompactV1',[]);
assert.equal(list.status,200);
assert.deepEqual(await list.json(),[{projectId:PROJECT,revision:123}]);
const context=await query('getProjectContextCompactV1',[PROJECT]);
assert.equal(context.status,200);
const result=await context.json();
assert.deepEqual(result,{projectId:PROJECT,revision:123,tasks:[{id:'task-1',key:'worker',status:'IN_PROGRESS'}]});
assert.ok(!JSON.stringify(result).includes('PRIVATE'));
const handoff=await query('getProjectHandoffCompactV1',[PROJECT]);
assert.equal(handoff.status,200);
assert.deepEqual(await handoff.json(),{projectId:PROJECT,revision:123,lastWork:{key:'last-work'},unfinishedCount:1});
const foreign=await query('getProjectContextCompactV1',['foreign-id']);
assert.equal(foreign.status,422);
assert.ok(!JSON.stringify(await foreign.json()).includes('PRIVATE'));
const extra=await query('getProjectContextCompactV1',[PROJECT],{owner:'spoof'});
assert.equal(extra.status,400);
const noAuth=await handler(new Request('https://supabase.test.invalid/functions/v1/lizhi-production/bridge',{
 method:'POST',body:JSON.stringify({op:'getProjectContextCompactV1',args:[PROJECT]})
}));
assert.equal(noAuth.status,401);
// Existing operations must remain separately mapped through operateManaged.
const legacy=await query('getProjectContext',[PROJECT]);
assert.equal(legacy.status,200);
const legacyResult=await legacy.json();
assert.ok(legacyResult.artifacts.length===1&&legacyResult.artifacts[0].secret.includes('PRIVATE'));
assert.ok(calls.every(x=>x.method==='GET'));
assert.ok(calls.some(x=>x.url.includes('owner_id=eq.owner-db')));
process.stdout.write('BACKEND_HANDLER_SIMULATION_PASS cases=7 sourceScoped=owner-db liveE2e=NOT_TESTED\n');
