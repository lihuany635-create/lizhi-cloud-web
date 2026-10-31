import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
import {encodeJpeg} from '../supabase/functions/lizhi-viewer-cloud/jpeg-encoder.mjs';
const TEST_JPEG=Buffer.from(encodeJpeg(new Uint8Array(640*360*4).fill(128),640,360,60)).toString('base64');
const SITE='appgprj_6ae0c336243881919e9ba2bbf450f1fb';
const sha='80b4390068b5f78e805de7386ef53b9489d57f31f52e9a09ab1c01557fdf1c52';
const token='a'.repeat(96);
const hex=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const tokenHash=await hex(token);
let current={revision:0,state:{avatars:[],selected_id:null,camera:{mode:'free'},checkpoints:[]}};
const requests=new Map();
let screenshot=null,sceneReadHook=null,sceneReadCount=0,manifestSha=sha,glbFault=null,streamCancelled=false;
const testEnv={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'TEST_ONLY_SERVICE_KEY'};let glbDownloads=0;
globalThis.Deno={env:{get:k=>testEnv[k]},serve(){}};
globalThis.fetch=async(url,options={})=>{
 const u=String(url);
 if(u.endsWith('/storage/v1/object/lizhi-models/lahudi-academy.glb')){
  glbDownloads++;assert.equal(options.redirect,'manual');
  if(glbFault==='header')return new Response('',{headers:{'content-length':'16777217'}});
  if(glbFault==='redirect')return new Response('',{status:302,headers:{location:'https://unapproved.invalid/'}});
  if(glbFault==='network')throw Error('TEST_ONLY_SERVICE_KEY');
  if(glbFault==='stream'){let n=0;const chunk=new Uint8Array(1024*1024);return new Response(new ReadableStream({pull(c){if(n++<100)c.enqueue(chunk);else c.close();},cancel(){streamCancelled=true;}}));}
  const data=readFileSync('model-viewer/lahudi-academy.glb');if(glbFault==='sha')data[0]^=1;
  return new Response(data);
 }
 if(u.includes('current-models.json'))return Response.json({models:[{model:'lahudi-academy.glb',version:'R09',current_sha256:manifestSha}]});
 if(u.includes('/rest/v1/lizhi_viewer_config'))return Response.json([{token_hash:tokenHash}]);
 if(u.includes('/rest/v1/lizhi_viewer_cloud_scenes'))return Response.json([{model_key:'lahudi-academy',model_sha:sha,revision:current.revision}]);
 if(u.includes('/rest/v1/lizhi_viewer_cloud_snapshots?'))return Response.json(screenshot?[screenshot]:[]);
 if(u.includes('/rest/v1/lizhi_viewer_cloud_requests?')){
  const match=u.match(/request_id=eq\.([0-9a-f-]+)/);
  return Response.json(requests.has(match?.[1])?[requests.get(match[1])]:[]);
 }
 if(u.endsWith('/rpc/lizhi_viewer_cloud_read')){const answer={ok:true,...structuredClone(current),model_key:'lahudi-academy',model_sha:sha};if(sceneReadHook)await sceneReadHook(++sceneReadCount);return Response.json(answer);}
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
const renderURL=new URL('../supabase/functions/lizhi-viewer-cloud/render.mjs',import.meta.url).href;
const source=readFileSync('supabase/functions/lizhi-viewer-cloud/index.ts','utf8').replace("'./nav.mjs'",JSON.stringify(navURL)).replace("'./render.mjs'",JSON.stringify(renderURL));
const {handler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const owner=SITE+':test-user';
async function invoke(name,args={},withToken=true,selectedHandler=handler){
 const req=new Request('https://test.supabase.co/functions/v1/lizhi-viewer-cloud',{method:'POST',
  headers:{authorization:'Bearer '+(withToken?token:'invalid'),'content-type':'application/json'},
  body:JSON.stringify({kind:'tool',owner,name,args})});
 const r=await selectedHandler(req);return {status:r.status,data:await r.json()};
}
test('rejects missing or invalid Site token',async()=>{
 const {status,data}=await invoke('viewer_status',{},false);
 assert.equal(status,401);assert.equal(data.code,'UNAUTHORIZED');
});
test('cloud-direct reports no browser requirement and a cloud renderer',async()=>{
 const {data}=await invoke('viewer_status');assert.equal(data.mode,'cloud_direct');assert.equal(data.requires_browser,false);assert.equal(data.cloud_rendering,true);
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
test('cloud screenshot renders the current scene server-side and rejects mismatches',async()=>{
 const saved=current;
 const gate={id:'gate-avatar',name:'校門',position:[0,2.2,-120],yaw:0,pitch:0.05,mode:'first'};
 const other={id:'other-avatar',name:'走廊',position:[1.5,2.2,-116],yaw:3.1,pitch:0,mode:'third'};
 current={revision:7,state:{avatars:[gate,other],selected_id:'gate-avatar',camera:{mode:'first',avatar_id:'gate-avatar'},checkpoints:[]}};
 const model={model_key:'lahudi-academy',model_sha:sha};
 glbDownloads=0;
 const shot=(await invoke('viewer_get_screenshot',model)).data;
 assert.equal(shot.ok,true,JSON.stringify(shot).slice(0,300));
 assert.equal(shot.real_screenshot,true);assert.equal(shot.source,'cloud_cpu_render');assert.equal(shot.requires_browser,false);
 assert.equal(shot.model_key,'lahudi-academy');assert.equal(shot.model_sha,sha);assert.equal(shot.revision,7);
 assert.equal(shot.avatar_id,'gate-avatar');assert.equal(shot.camera.mode,'first');
 assert.deepEqual(shot.camera.position,[0,3.8,-120]); // feet + 1.6 m eye height, same as the viewer
 assert(Math.abs(Date.now()-Date.parse(shot.captured_at))<10000,'fresh capture time');
 const jpeg=Buffer.from(shot.image.data,'base64');
 assert.equal(shot.image.mimeType,'image/jpeg');assert.equal(jpeg[0],0xff);assert.equal(jpeg[1],0xd8);
 assert.equal(jpeg.at(-2),0xff);assert.equal(jpeg.at(-1),0xd9);assert(jpeg.length>5000,'non-trivial frame');
 assert(shot.triangles_drawn>1000,'model geometry actually rasterised');
 // Same request again: no second model download (warm cache); another avatar gives a different frame.
 const otherShot=(await invoke('viewer_get_screenshot',{...model,avatar_id:'other-avatar'})).data;
 assert.equal(otherShot.ok,true);assert.equal(otherShot.avatar_id,'other-avatar');assert.equal(otherShot.camera.mode,'third');
 assert.notEqual(otherShot.image.data,shot.image.data);assert.equal(glbDownloads,1);
 // MCP image block conversion keeps the JPEG out of the text block.
 const {viewerCloudToMcpContent}=await import('../sites-migration/viewer-cloud-direct/site-cloud-direct-mcp.mjs');
 const blocks=viewerCloudToMcpContent(shot);
 assert.equal(blocks.length,2);assert.equal(blocks[1].type,'image');assert.equal(blocks[1].data,shot.image.data);
 assert.equal(blocks[0].text.includes(shot.image.data),false);
 // Mismatched state is refused instead of rendering something else.
 const stale=(await invoke('viewer_get_screenshot',{...model,expected_revision:6})).data;
 assert.equal(stale.ok,false);assert.equal(stale.code,'REVISION_CONFLICT');assert.equal(stale.actual_revision,7);assert.equal(stale.real_screenshot,false);
 const unknown=(await invoke('viewer_get_screenshot',{...model,avatar_id:'nobody'})).data;
 assert.equal(unknown.code,'NO_AVATAR_FOR_SCREENSHOT');
 const wrongSha=(await invoke('viewer_get_screenshot',{model_key:'lahudi-academy',model_sha:'0'.repeat(64)})).data;
 assert.equal(wrongSha.ok,false);assert.equal(wrongSha.code,'MODEL_VERSION_CONFLICT');
 const extra=(await invoke('viewer_get_screenshot',{...model,image:'/9j/fake'})).data;
 assert.equal(extra.ok,false);assert.equal(extra.code,'INVALID_ARGUMENTS');
 current={revision:8,state:{avatars:[],selected_id:null,camera:{mode:'free'},checkpoints:[]}};
 const none=(await invoke('viewer_get_screenshot',model)).data;
 assert.equal(none.code,'NO_AVATAR_FOR_SCREENSHOT');
 // Owner kill switch (Edge secret) stops all rendering.
 current={revision:7,state:{avatars:[gate],selected_id:'gate-avatar',camera:{mode:'first'},checkpoints:[]}};
 testEnv.LIZHI_VIEWER_RENDER_DISABLED='1';
 const revoked=(await invoke('viewer_get_screenshot',model)).data;
 delete testEnv.LIZHI_VIEWER_RENDER_DISABLED;
 assert.equal(revoked.ok,false);assert.equal(revoked.code,'CLOUD_RENDER_REVOKED');
 current=saved;
});
test('checkpoint findings still require real screenshot evidence; stop is immediate',async()=>{
 const f=(await invoke('viewer_save_checkpoint',{model_key:'lahudi-academy',model_sha:sha,request_id:crypto.randomUUID(),expected_revision:4,note:'manual note',findings:[{screenshot_id:crypto.randomUUID(),finding:'hall clear'}]})).data;
 assert.equal(f.code,'REAL_SCREENSHOT_EVIDENCE_REQUIRED');assert.equal(current.revision,4);
 const stop=(await invoke('viewer_stop')).data;assert.equal(stop.mode,'cloud_direct');assert.equal(stop.pending_operations,0);
});
test('browser image opt-in and renderer evidence are explicit in viewer source',()=>{
 const html=readFileSync('model-viewer/index.html','utf8');
 assert.match(html,/id="tCloudCapture"/);
 assert.match(html,/let cloudCaptureEnabled=false/);
 assert.match(html,/p_jpeg_base64:base64/);
 assert.match(html,/window\.GLBPreview\.active/);
});

test('Site MCP exposes JPEG as an actual image block, not as base64 text',async()=>{
 const {viewerCloudToMcpContent}=await import('../sites-migration/viewer-cloud-direct/site-cloud-direct-mcp.mjs');
 const sample={ok:true,real_screenshot:true,image:{mimeType:'image/jpeg',data:TEST_JPEG},revision:5};
 const blocks=viewerCloudToMcpContent(sample);
 assert.equal(blocks.length,2);assert.equal(blocks[1].type,'image');
 assert.equal(blocks[1].mimeType,'image/jpeg');assert.equal(JSON.parse(blocks[0].text).revision,5);
 assert.equal(blocks[0].text.includes(sample.image.data),false);
 const fail=viewerCloudToMcpContent({ok:false,code:'BROWSER_FRAME_STALE'});
 assert.equal(fail.length,1);assert.equal(fail[0].type,'text');
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

// Execute the actual browser revocation functions, with controlled delayed RPC responses.
test('revoke retries preserve original model/SHA and delayed successes cannot erase other targets',async()=>{
 const {runInNewContext}=await import('node:vm');
 const html=readFileSync('model-viewer/index.html','utf8');
 const source=html.slice(html.indexOf('let cloudCaptureRevokePending=null;'),html.indexOf('function cloudCaptureSet(on)'));
 const calls=[],button={},messages=[];
 const ctx={modelKey:'model-a',sourceInfo:{manifestVerified:true,actualSHA:'a'.repeat(64)},cloudCaptureEnabled:false,
  $:()=>button,cloudSay:s=>messages.push(s),cloudSupabase:()=>({rpc:(_name,args)=>new Promise(resolve=>calls.push({args,resolve}))})};
 runInNewContext(source+'\nthis.revoke=cloudCaptureRevoke;this.pending=()=>cloudCaptureRevokePending;this.count=()=>cloudCaptureRevokeTargets.size;',ctx);
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 const a=ctx.revoke();await tick();calls[0].resolve({error:{message:'offline'}});assert.equal(await a,false);
 ctx.modelKey='model-b';ctx.sourceInfo.actualSHA='b'.repeat(64);
 const retry=ctx.revoke();await tick();assert.equal(calls[1].args.p_model_key,'model-a');assert.equal(calls[1].args.p_model_sha,'a'.repeat(64));
 const b=ctx.revoke({key:'model-b',sha:'b'.repeat(64)});await tick();
 calls[2].resolve({error:{message:'offline'}});await b;
 calls[1].resolve({data:{revoked:true}});await retry;
 assert.equal(ctx.count(),1);assert.equal(ctx.pending().key,'model-b');assert.match(messages.at(-1),/未確認刪除/);
 const last=ctx.revoke();const same=ctx.revoke();assert.equal(last,same);await tick();assert.equal(calls.length,4);
 calls[3].resolve({data:{revoked:true}});await last;assert.equal(ctx.count(),0);assert.equal(ctx.pending(),null);
 assert.match(messages.at(-1),/已確認刪除/);
});
test('retention copy does not promise unsupported five-minute physical deletion',()=>{
 const html=readFileSync('model-viewer/index.html','utf8');
 assert(!html.includes('最多保留 5 分鐘'));
 const policy=readFileSync('docs/ai-agent-guides/VIEWER_BROWSER_CAPTURE_DRAFT_20261031.md','utf8');
 assert.match(policy,/remain indefinitely/);assert.match(policy,/nearly ten minutes/);assert.match(policy,/cron.job_run_details/);
});
test('delayed capture completion revokes captured model after stop and model switch',async()=>{
 const {runInNewContext}=await import('node:vm');
 const html=readFileSync('model-viewer/index.html','utf8');
 const source=html.slice(html.indexOf('async function cloudCaptureFrame(sb,key)'),html.indexOf('function cloudSupabase()'));
 let resume;const revoked=[];
 const ctx={cloudCaptureEnabled:true,cloudCaptureBusy:false,cloudCaptureUntil:Date.now()+60000,cloudCaptureCount:0,document:{hidden:false},agentActive:false,window:{GLBPreview:{active:false}},cloudOn:true,cloudFollowOn:true,model:{},sourceInfo:{manifestVerified:true,actualSHA:'a'.repeat(64)},modelKey:'model-a',cloudRev:1,cloudCaptureLastRevision:-1,cloudSelected:'avatar',cloudFigs:new Map([['avatar',{route:[]}]]),cloudCaptureLastAt:0,cloudKey:'model-a|sha',requestAnimationFrame:f=>{resume=f;},cloudCaptureRevoke:t=>revoked.push(t),cloudCaptureSet:()=>{}};
 runInNewContext(source+'\nthis.capture=cloudCaptureFrame;',ctx);
 const capture=ctx.capture({},ctx.cloudKey);
 ctx.cloudCaptureEnabled=false;ctx.modelKey='model-b';ctx.sourceInfo={manifestVerified:true,actualSHA:'b'.repeat(64)};ctx.cloudKey='model-b|sha';
 resume();await capture;
 assert.equal(revoked.length,1);assert.equal(revoked[0].key,'model-a');assert.equal(revoked[0].sha,'a'.repeat(64));
});

test('Edge screenshot enforces the same required model fields as Site schema',async()=>{
 for(const args of [{},{model_key:'lahudi-academy'},{model_sha:sha},{model_key:7,model_sha:sha}]){
  const r=(await invoke('viewer_get_screenshot',args)).data;
  assert.equal(r.ok,false);assert.equal(r.code,'MODEL_KEY_AND_SHA_REQUIRED');assert(!r.image);
 }
});
test('cloud render refuses scene changes and revocation during an in-flight request',async()=>{
 const saved=current;const base={revision:101,state:{avatars:[{id:'qa',position:[0,2.2,-120],mode:'first',yaw:0,pitch:0}],selected_id:'qa'}};
 const args={model_key:'lahudi-academy',model_sha:sha,expected_revision:101};
 try{
  current=structuredClone(base);sceneReadCount=0;sceneReadHook=n=>{if(n===1)current.revision++;};
  const changed=(await invoke('viewer_get_screenshot',args)).data;assert.equal(changed.code,'REVISION_CONFLICT');assert(!changed.image);
  current=structuredClone(base);sceneReadCount=0;sceneReadHook=n=>{if(n===1)testEnv.LIZHI_VIEWER_RENDER_DISABLED='1';};
  const stopped=(await invoke('viewer_get_screenshot',args)).data;assert.equal(stopped.code,'CLOUD_RENDER_REVOKED');assert(!stopped.image);
  const stop=(await invoke('viewer_stop')).data;assert.equal(stop.render_revoked,true);
 }finally{current=saved;sceneReadHook=null;delete testEnv.LIZHI_VIEWER_RENDER_DISABLED;}
});
test('only one render is admitted per isolate; no queue or browser fallback',async()=>{
 const saved=current;let reached,release;
 const entered=new Promise(r=>reached=r),gate=new Promise(r=>release=r);
 current={revision:111,state:{avatars:[{id:'qa',position:[0,2.2,-120],mode:'first',yaw:0,pitch:0}],selected_id:'qa'}};
 sceneReadCount=0;sceneReadHook=async n=>{if(n===1){reached();await gate;}};
 const args={model_key:'lahudi-academy',model_sha:sha};
 try{
  const pending=invoke('viewer_get_screenshot',args);await entered;
  const busy=(await invoke('viewer_get_screenshot',args)).data;assert.equal(busy.code,'CLOUD_RENDER_BUSY');assert(!busy.image);assert.equal(busy.requires_browser,false);
  release();const done=(await pending).data;assert.equal(done.ok,true);assert.equal(done.source,'cloud_cpu_render');
 }finally{release();current=saved;sceneReadHook=null;}
});
test('canonical manifest SHA is rechecked before returning a rendered frame',async()=>{
 const saved=current;current={revision:112,state:{avatars:[{id:'qa',position:[0,2.2,-120],mode:'first',yaw:0,pitch:0}],selected_id:'qa'}};
 sceneReadCount=0;sceneReadHook=n=>{if(n===2)manifestSha='c'.repeat(64);};
 try{const r=(await invoke('viewer_get_screenshot',{model_key:'lahudi-academy',model_sha:sha})).data;assert.equal(r.code,'MODEL_VERSION_CONFLICT');assert(!r.image);}
 finally{manifestSha=sha;sceneReadHook=null;current=saved;}
});

test('private GLB download failures and resource limits are bounded, sanitized and release render lock',async()=>{
 const saved=current;current={revision:121,state:{avatars:[{id:'qa',position:[0,2.2,-120],mode:'first',yaw:0,pitch:0}],selected_id:'qa'}};
 const args={model_key:'lahudi-academy',model_sha:sha};
 try{
  for(const [fault,code] of [['header','GLB_TOO_LARGE_FOR_EDGE'],['stream','GLB_TOO_LARGE_FOR_EDGE'],['sha','GLB_SHA_MISMATCH'],['redirect','GLB_DOWNLOAD_FAILED'],['network','VIEWER_CLOUD_ERROR']]){
   const {handler:fresh}=await import('data:text/javascript;base64,'+Buffer.from(source+'\n// isolated resource fault '+fault).toString('base64'));
   glbFault=fault;streamCancelled=false;const before=glbDownloads;
   const r=(await invoke('viewer_get_screenshot',args,true,fresh)).data;
   assert.equal(r.code,code);assert(!r.image);assert(!JSON.stringify(r).includes('TEST_ONLY_SERVICE_KEY'));assert.equal(glbDownloads,before+1);
   if(fault==='stream')assert.equal(streamCancelled,true);
   glbFault=null;const recovered=(await invoke('viewer_get_screenshot',args,true,fresh)).data;assert.equal(recovered.ok,true);
  }
 }finally{current=saved;glbFault=null;}
});
