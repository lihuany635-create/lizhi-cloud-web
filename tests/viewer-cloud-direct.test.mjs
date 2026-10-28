import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
const SITE='appgprj_6ae0c336243881919e9ba2bbf450f1fb';
const sha='80b4390068b5f78e805de7386ef53b9489d57f31f52e9a09ab1c01557fdf1c52';
const token='a'.repeat(96);
const hex=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const tokenHash=await hex(token);
let current={revision:0,state:{avatars:[],selected_id:null,camera:{mode:'free'},checkpoints:[]}};
const requests=new Map();
globalThis.Deno={env:{get:k=>k==='SUPABASE_URL'?'https://test.supabase.co':k==='SUPABASE_SERVICE_ROLE_KEY'?'TEST_ONLY_SERVICE_KEY':undefined},serve(){}};
globalThis.fetch=async(url,options={})=>{
 const u=String(url);
 if(u.includes('current-models.json'))return Response.json({models:[{model:'lahudi-academy.glb',version:'R09',current_sha256:sha}]});
 if(u.includes('/rest/v1/lizhi_viewer_config'))return Response.json([{token_hash:tokenHash}]);
 if(u.includes('/rest/v1/lizhi_viewer_cloud_scenes'))return Response.json([{model_key:'lahudi-academy',model_sha:sha,revision:current.revision}]);
 if(u.includes('/rest/v1/lizhi_viewer_cloud_requests?')){
  const match=u.match(/request_id=eq\.([0-9a-f-]+)/);
  return Response.json(requests.has(match?.[1])?[requests.get(match[1])]:[]);
 }
 if(u.endsWith('/rpc/lizhi_viewer_cloud_read'))return Response.json({ok:true,...current,model_key:'lahudi-academy',model_sha:sha});
 if(u.endsWith('/rpc/lizhi_viewer_cloud_write')){
  const b=JSON.parse(options.body);
  if(requests.has(b.p_request))return Response.json(requests.get(b.p_request).response);
  if(b.p_expected_revision!==current.revision)return Response.json({ok:false,code:'REVISION_CONFLICT',revision:current.revision});
  current={revision:current.revision+1,state:b.p_state};
  const result={ok:true,revision:current.revision,state:current.state,model_key:b.p_model_key,model_sha:b.p_model_sha};
  requests.set(b.p_request,{fingerprint:b.p_fingerprint,response:result});return Response.json(result);
 }
 throw Error('UNMOCKED_URL: '+u);
};
const navURL=new URL('../supabase/functions/lizhi-viewer-cloud/nav.mjs',import.meta.url).href;
const source=readFileSync('supabase/functions/lizhi-viewer-cloud/index.ts','utf8').replace("'./nav.mjs'",JSON.stringify(navURL));
const {handler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const owner=SITE+':test-user';
async function invoke(name,args={},withToken=true){
 const req=new Request('https://test.supabase.co/functions/v1/lizhi-viewer-cloud',{method:'POST',
  headers:{authorization:'Bearer '+(withToken?token:'invalid'),'content-type':'application/json'},
  body:JSON.stringify({kind:'tool',owner,name,args})});
 const r=await handler(req);return {status:r.status,data:await r.json()};
}
test('rejects missing or invalid Site token',async()=>{
 const {status,data}=await invoke('viewer_status',{},false);
 assert.equal(status,401);assert.equal(data.code,'UNAUTHORIZED');
});
test('cloud-direct reports no browser requirement and no renderer',async()=>{
 const {data}=await invoke('viewer_status');assert.equal(data.mode,'cloud_direct');assert.equal(data.requires_browser,false);assert.equal(data.cloud_rendering,false);
});
test('official model list is independently readable',async()=>{
 const {data}=await invoke('viewer_list_models');assert.equal(data.models[0].current_sha256,sha);
});
test('create, idempotence, CAS, independent avatars and camera transitions',async()=>{
 const a=crypto.randomUUID(),req=crypto.randomUUID();
 const args={model_key:'lahudi-academy',model_sha:sha,expected_revision:0,request_id:req,name:'校門',position:[0,0,-60]};
 const first=(await invoke('viewer_create_avatar',args)).data;
 assert.equal(first.ok,true);assert.equal(first.revision,1);assert.equal(first.state.avatars.length,1);
 assert.equal(first.state.avatars[0].surface_verified,false);
 const again=(await invoke('viewer_create_avatar',args)).data;assert.equal(again.revision,1);assert.equal(current.state.avatars.length,1);
 const conflict=(await invoke('viewer_create_avatar',{...args,request_id:a})).data;assert.equal(conflict.code,'REVISION_CONFLICT');
 const second=(await invoke('viewer_create_avatar',{...args,request_id:crypto.randomUUID(),expected_revision:1,name:'教室',position:[2,0,-99]})).data;
 assert.equal(second.state.avatars.length,2);const id=second.state.avatars[0].id;
 const moved=(await invoke('viewer_move_avatar',{model_key:'lahudi-academy',model_sha:sha,request_id:crypto.randomUUID(),expected_revision:2,avatar_id:id,delta:[1,0,0]})).data;
 assert.equal(moved.state.avatars[0].position[0],1);assert.deepEqual(moved.state.avatars[1].position,[2,0,-99]);assert.equal(moved.collision_verified,false);
 const camera=(await invoke('viewer_set_camera',{model_key:'lahudi-academy',model_sha:sha,request_id:crypto.randomUUID(),expected_revision:3,avatar_id:id,mode:'third'})).data;
 assert.equal(camera.state.camera.mode,'third');
 const scene=(await invoke('viewer_get_scene',{model_key:'lahudi-academy'})).data;assert.equal(scene.revision,4);
});
test('screenshot fails explicitly and checkpoint evidence cannot be fabricated',async()=>{
 assert.equal((await invoke('viewer_get_screenshot')).data.code,'CLOUD_3D_RENDERER_NOT_IMPLEMENTED');
 const f=(await invoke('viewer_save_checkpoint',{model_key:'lahudi-academy',model_sha:sha,request_id:crypto.randomUUID(),expected_revision:4,note:'manual note',findings:[{screenshot_id:crypto.randomUUID(),finding:'hall clear'}]})).data;
 assert.equal(f.code,'REAL_SCREENSHOT_EVIDENCE_REQUIRED');assert.equal(current.revision,4);
 const stop=(await invoke('viewer_stop')).data;assert.equal(stop.mode,'cloud_direct');assert.equal(stop.pending_operations,0);
});

test('Site adapter exposes 15 cloud-native tools without online session fields',async()=>{
 const {VIEWER_CLOUD_TOOLS}=await import('../sites-migration/viewer-cloud-direct/site-cloud-direct-tools.mjs');
 assert.equal(VIEWER_CLOUD_TOOLS.length,15);
 for(const t of VIEWER_CLOUD_TOOLS){
  assert(!('session_id' in t.inputSchema.properties),'No browser session in '+t.name);
  if(!['viewer_status','viewer_list_models','viewer_get_scene','viewer_list_avatars','viewer_get_screenshot','viewer_stop'].includes(t.name)){
    assert(t.inputSchema.required.includes('expected_revision'),'CAS required for '+t.name);
    assert(t.inputSchema.required.includes('request_id'),'idempotency required for '+t.name);
  }
 }
 const {callViewerCloud}=await import('../sites-migration/viewer-cloud-direct/site-cloud-direct-mcp.mjs');
 let called=false;
 const result=await callViewerCloud({name:'viewer_status',args:{},owner,token,fetcher:async(url,opts)=>{
  called=true;assert.match(url,/lizhi-viewer-cloud$/);assert.equal(JSON.parse(opts.body).owner,owner);
  assert.equal(opts.redirect,'manual');return Response.json({ok:true,mode:'cloud_direct'});
 }});
 assert(called);assert.equal(result.mode,'cloud_direct');
});
