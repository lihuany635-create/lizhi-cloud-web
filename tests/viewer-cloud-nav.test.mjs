// Movement against the real hades-house nav grid (static floor/stair/wall screening).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const SITE='appgprj_6ae0c336243881919e9ba2bbf450f1fb';
const navDoc=readFileSync('model-viewer/nav/hades-house.nav.json','utf8');
const sha=JSON.parse(navDoc).model_sha;
const token='b'.repeat(96);
const hex=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const tokenHash=await hex(token);
let current={revision:0,state:{avatars:[],selected_id:null,camera:{mode:'free'},checkpoints:[]}};
const requests=new Map();let navFetches=0,manifestFetches=0;
globalThis.Deno={env:{get:k=>k==='SUPABASE_URL'?'https://test.supabase.co':k==='SUPABASE_SERVICE_ROLE_KEY'?'TEST_ONLY':undefined},serve(){}};
globalThis.fetch=async(url,options={})=>{
 const u=String(url);
 if(u.includes('current-models.json')){manifestFetches++;return Response.json({models:[{model:'hades-house.glb',version:'v3.3',current_sha256:sha}]});}
 if(u.includes('/storage/v1/object/lizhi-models/nav/hades-house.nav.json')){navFetches++;return new Response(navDoc,{headers:{'content-type':'application/json'}});}
 if(u.includes('/rest/v1/lizhi_viewer_config'))return Response.json([{token_hash:tokenHash}]);
 if(u.includes('/rest/v1/lizhi_viewer_cloud_requests?')){const m=u.match(/request_id=eq\.([0-9a-f-]+)/);return Response.json(requests.has(m?.[1])?[requests.get(m[1])]:[]);}
 if(u.endsWith('/rpc/lizhi_viewer_cloud_read'))return Response.json({ok:true,...current});
 if(u.endsWith('/rpc/lizhi_viewer_cloud_write')){
  const b=JSON.parse(options.body);
  if(b.p_expected_revision!==current.revision)return Response.json({ok:false,code:'REVISION_CONFLICT',revision:current.revision});
  current={revision:current.revision+1,state:b.p_state};
  const result={ok:true,revision:current.revision,state:current.state};
  requests.set(b.p_request,{fingerprint:b.p_fingerprint,response:result});return Response.json(result);
 }
 throw Error('UNMOCKED_URL: '+u);
};
const navURL=new URL('../supabase/functions/lizhi-viewer-cloud/nav.mjs',import.meta.url).href;
const source=readFileSync('supabase/functions/lizhi-viewer-cloud/index.ts','utf8').replace("'./nav.mjs'",JSON.stringify(navURL));
const {handler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
async function call(name,args={}){
 const write=!['viewer_get_scene','viewer_status'].includes(name);
 const body={kind:'tool',owner:SITE+':nav-test',name,args:write?{model_key:'hades-house',model_sha:sha,request_id:crypto.randomUUID(),expected_revision:current.revision,...args}:args};
 const r=await handler(new Request('https://x/functions/v1/lizhi-viewer-cloud',{method:'POST',headers:{authorization:'Bearer '+token},body:JSON.stringify(body)}));
 return r.json();
}
let id;
test('create snaps to the 1F floor at the entry (C03 camera spot)',async()=>{
 const r=await call('viewer_create_avatar',{name:'主角',position:[-2.8,1.6,3.4]});
 assert.equal(r.ok,true);id=r.state.avatars[0].id;
 assert.deepEqual(r.state.avatars[0].position,[-2.8,0.31,3.4]);
 assert.equal(r.state.avatars[0].surface_verified,true);
});
test('walk_to climbs the U-stair and reaches the 2F desk',async()=>{
 const r=await call('viewer_walk_to',{avatar_id:id,target:[2.8,3.3,2.7]});
 assert.equal(r.ok,true,JSON.stringify(r));
 const p=r.state.avatars[0].position;assert(p[1]>3.2&&p[1]<3.4,'on 2F: '+p);
 const path=r.state.avatars[0].last_path;assert(path.some(q=>q[1]>1.4&&q[1]<1.8),'passes the stair landing');
 assert(r.movement.travelled_m>12&&r.movement.travelled_m<25);
});
test('move into a wall stops at the wall and reports blocked',async()=>{
 const before=current.revision;
 const r=await call('viewer_move_avatar',{avatar_id:id,delta:[10,0,0]});
 assert.equal(r.ok,true);assert(r.movement.blocked,'blocked reported');assert(r.movement.travelled_m<10);
 assert.equal(current.revision,before+1);
 const again=await call('viewer_move_avatar',{avatar_id:id,delta:[1,0,0]});
 assert.equal(again.code,'MOVE_BLOCKED');assert.equal(again.written,false);assert.equal(current.revision,before+1);
});
test('teleport into empty space is refused with a nearby suggestion and no write',async()=>{
 const before=current.revision;
 const r=await call('viewer_teleport_avatar',{avatar_id:id,position:[2.8,5.2,2.7]});
 assert.equal(r.ok,false);assert.match(r.code,/NO_WALKABLE_SURFACE/);assert.equal(current.revision,before);
});
test('manifest and grid are cached between calls',async()=>{
 assert.equal(navFetches,1);assert.equal(manifestFetches,1);
});
test('every registered model has a nav grid matching its current GLB SHA',()=>{
 const manifest=JSON.parse(readFileSync('model-viewer/current-models.json','utf8'));
 for(const m of manifest.models){
  const key=m.model.replace(/\.glb$/,'');
  const doc=JSON.parse(readFileSync(`model-viewer/nav/${key}.nav.json`,'utf8'));
  assert.equal(doc.model_sha,m.current_sha256,`${key}: rebuild with python3 model-viewer/nav/build_nav_grid.py model-viewer/${key}.glb model-viewer/nav/${key}.nav.json`);
 }
});
