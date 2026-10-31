'use strict';
// Real WebGL bridge test. Parent origin rewritten ONLY in an in-memory test response.
// Does not claim production Site authentication or full ChatGPT end-to-end acceptance.
const {chromium}=require('playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const ROOT=process.cwd(),PARENT='http://127.0.0.1:8772',CHILD='http://127.0.0.1:8771';
const allowed='https://lizhi-viewer-agent-20261027.lihuany635.chatgpt.site';
let nextCommand=0;
const wrapper=`<!doctype html><html><body><iframe id="viewer" width="1280" height="900" src="${CHILD}/model-viewer/#lahudi-academy"></iframe><script>
const frame=document.querySelector('iframe'),nonce=crypto.randomUUID();window.results={};window.ready=null;window.stopped=false;
const post=(type,extra={})=>frame.contentWindow.postMessage({channel:'lizhi-viewer-v1',type,nonce,...extra},'${CHILD}');
frame.onload=()=>post('init');
addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.origin!=='${CHILD}'||e.data.nonce!==nonce)return;const m=e.data;if(m.type==='ready')window.ready=m.scene;if(m.type==='result')window.results[m.request_id]=m.result;if(m.type==='stopped'){window.stopped=true;window.stopReason=m.reason;}});
window.send=c=>post('command',{command:c});window.stopAgent=()=>post('stop');setInterval(()=>post('heartbeat'),1000);
</script></body></html>`;
async function main(){
 const server=http.createServer(async(req,res)=>{try{let p=path.join(ROOT,decodeURIComponent(new URL(req.url,CHILD).pathname));if(p.endsWith(path.sep))p+='index.html';let b=await fs.readFile(p);if(p.endsWith('model-viewer/index.html'))b=Buffer.from(b.toString().replace(`const agentOrigin='${allowed}'`,`const agentOrigin='${PARENT}'`));res.setHeader('content-type',p.endsWith('.html')?'text/html':p.endsWith('.js')?'text/javascript':p.endsWith('.json')?'application/json':'application/octet-stream');res.end(b);}catch{res.writeHead(404).end();}});
 const parent=http.createServer((req,res)=>{res.setHeader('content-type','text/html');res.end(wrapper);});
 await new Promise(r=>server.listen(8771,'127.0.0.1',r));await new Promise(r=>parent.listen(8772,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1360,height:1100}});
 // Models are owner-only in production (private storage + login). This test has no real login,
 // so supabase-js is replaced in-memory by a stub whose "signed URL" points at the local repo copy.
 // Production code paths (private-assets.js, SHA check, cache) still run; RLS itself is not exercised here.
 await page.route('**/@supabase/supabase-js**',route=>route.fulfill({contentType:'text/javascript',body:`window.supabase={createClient(){return {
  auth:{getSession:async()=>({data:{session:{access_token:'test-only'}},error:null}),onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};}},
  storage:{from(){return {createSignedUrl:async p=>({data:{signedUrl:'${CHILD}/model-viewer/'+p},error:null})};}},
  rpc:async(name,args)=>{
    if(name==='lizhi_viewer_cloud_browser_read')return {data:window.__bridgeCloudState||{ok:true,revision:0,state:{avatars:[],selected_id:null}},error:null};
    if(name==='lizhi_viewer_cloud_snapshot_submit'){window.__bridgeCloudFrame=args;return {data:{ok:true},error:null};}
    if(name==='lizhi_viewer_cloud_snapshot_revoke'){window.__bridgeCloudRevokes=(window.__bridgeCloudRevokes||0)+1;return window.__bridgeRevokeFail?{data:null,error:{message:'TEST_REVOKE_FAILURE'}}:{data:{ok:true,revoked:true},error:null};}
    return {data:null,error:{message:'TEST_STUB_NO_DATABASE'}};
  },
  from(){return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:null,error:null})};}};}};`}));
 page.on('pageerror',error=>console.error('PLAYWRIGHT_PAGE_ERROR',error.message));
 page.on('console',msg=>{if(msg.type()==='error')console.error('PLAYWRIGHT_CONSOLE_ERROR',msg.text());});
 await page.goto(PARENT);await page.waitForFunction(()=>window.ready?.render_ready,null,{timeout:90000});
 let state=await page.evaluate(()=>window.ready);assert.equal(state.model_key,'lahudi-academy');assert.equal(state.source.manifestVerified,true);
 const overview={position:state.camera.position,target:state.camera.target};
 const expected=JSON.parse(await fs.readFile('model-viewer/current-models.json','utf8')).models.find(x=>x.model==='lahudi-academy.glb').current_sha256;assert.equal(state.source.actualSHA,expected);
 async function command(name,args={},expect=true,id=randomUUID()){
   console.log('BRIDGE_COMMAND',name,'revision',state.revision);
   await page.evaluate(c=>window.send(c),{name,args:{...args,request_id:id},request_id:id,deadline:new Date(Date.now()+20000).toISOString()});
   try{await page.waitForFunction(id=>window.results[id]||window.stopped,id,{timeout:30000});}
   catch(e){console.error('BRIDGE_TIMEOUT',name,
     await page.evaluate(id=>({ready:!!window.ready,stopped:window.stopped,stopReason:window.stopReason,
        resultCount:Object.keys(window.results).length,requested:id,frameVisible:!!document.querySelector('iframe')}),id));
     throw e;
   }const r=await page.evaluate(id=>window.results[id],id);assert(r,'controller stopped: '+await page.evaluate(()=>window.stopReason));if(expect)assert.equal(r.ok,true,JSON.stringify(r));if(r.scene)state=r.scene;return r;
 }
 const write=(name,args)=>command(name,{revision:state.revision,model_sha:state.source.actualSHA,...args});
 // Real academy gate/grounds grid. Rejected placements do not create avatars.
 const created=[];
 for(const x of [-2,0,2,4,-4]){
  let found=null;
  for(const z of [-138,-130,-120,-100,-80]){
   const r=await command('viewer_create_avatar',{name:'Bridge QA '+(created.length+1),position:[x,state.model_transform.position[1],z],revision:state.revision,model_sha:state.source.actualSHA},false);
   if(r.ok){found=state.avatars.at(-1);break;}
  }
  assert(found,'valid academy surface for mannequin');created.push(found.id);
 }
 assert.equal(state.avatars.length,5);
 await write('viewer_select_avatar',{avatar_id:created[1]});
 await write('viewer_set_camera',{avatar_id:created[1],mode:'first',yaw:0,pitch:0});assert.equal(state.camera.mode,'first');
 // Gate POV may legitimately face a stone pier; use the original unobstructed
 // whole-model camera for image-content assertions, without altering geometry.
 await write('viewer_set_camera',{avatar_id:created[1],mode:'free',position:overview.position,target:overview.target});
 const shot=await command('viewer_get_screenshot');assert.equal(shot.image.mimeType,'image/jpeg');const bytes=Buffer.from(shot.image.data,'base64');
 // Test the production-bound MCP output encoder against actual rendered JPEG bytes.
 // This is the adapter's image block shape, not an end-to-end deployed Site result.
 const {viewerCloudToMcpContent}=await import('../sites-migration/viewer-cloud-direct/site-cloud-direct-mcp.mjs');
 const mcpContent=viewerCloudToMcpContent({ok:true,source:'test_webgl_frame',image:shot.image});
 assert.equal(mcpContent[1]?.type,'image');assert.equal(mcpContent[1].mimeType,'image/jpeg');
 assert.deepEqual(Buffer.from(mcpContent[1].data,'base64'),bytes);
 assert.equal(mcpContent[0].text.includes(shot.image.data),false);
 await fs.mkdir('viewer-qa-evidence',{recursive:true});await fs.writeFile('viewer-qa-evidence/academy-real-frame.jpg',bytes);
 assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 const pixels=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch('data:image/jpeg;base64,'+data)).blob());const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const p=ctx.getImageData(0,0,image.width,image.height).data;const colors=new Set();for(let i=0;i<p.length;i+=64)colors.add([p[i]>>3,p[i+1]>>3,p[i+2]>>3].join(','));return {width:image.width,height:image.height,colors:colors.size};},shot.image.data);
 assert.equal(pixels.width,640);assert.equal(pixels.height,360);assert(pixels.colors>12,'real rendered frame contains nonuniform geometry/color evidence');
 const other=state.avatars.filter(a=>a.id!==created[1]).map(a=>a.position);
 const moved=await write('viewer_move_avatar',{avatar_id:created[1],delta:[.25,0,0]});assert(moved.moved_steps>0,'real movement occurs');assert.deepEqual(state.avatars.filter(a=>a.id!==created[1]).map(a=>a.position),other);
 await write('viewer_set_camera',{avatar_id:created[1],mode:'third'});assert.equal(state.camera.mode,'third');
 await write('viewer_set_camera',{avatar_id:created[2],mode:'top'});assert.equal(state.camera.mode,'top');
 await write('viewer_set_camera',{avatar_id:created[3],mode:'free'});assert.equal(state.camera.mode,'free');
 const cp=await write('viewer_save_checkpoint',{note:'bridge rendering QA; not a completed area inspection',findings:[{screenshot_id:shot.screenshot_id,finding:'Test frame captured; visible-frame scope only.'}]});assert.equal(cp.findings.length,1);assert.equal(cp.unobserved_areas,'NOT_INSPECTED');
 const invalid=await command('viewer_save_checkpoint',{revision:state.revision,model_sha:state.source.actualSHA,findings:[{screenshot_id:randomUUID(),finding:'unobserved'}]},false);assert.equal(invalid.code,'OBSERVATION_REQUIRES_REAL_SCREENSHOT');
 const stale=await command('viewer_select_avatar',{avatar_id:created[0],revision:-1,model_sha:state.source.actualSHA},false);assert.equal(stale.code,'SCENE_REVISION_CONFLICT');
 await write('viewer_delete_avatar',{avatar_id:created[4]});assert.equal(state.avatars.length,4);
 await page.evaluate(()=>window.stopAgent());await page.waitForFunction(()=>window.stopped);const rid=randomUUID();await page.evaluate(c=>window.send(c),{name:'viewer_create_avatar',args:{position:[0,0,0],name:'should not happen'},request_id:rid,deadline:new Date(Date.now()+5000).toISOString()});await page.waitForTimeout(300);assert.equal(await page.evaluate(id=>window.results[id],rid),undefined);
 // The NEW opt-in cloud-avatar screenshot sender must be exercised separately
 // from the legacy parent-iframe AI capture. This uses the SAME real WebGL
 // renderer and actual academy GLB, but mocks the authenticated browser RPC.
 const child=page.frames().find(f=>f.url().includes('/model-viewer/'));
 assert(child,'loaded academy iframe');
 // Poll with plain evaluate calls: Playwright's in-frame waitForFunction can starve while the
 // software WebGL renderer keeps the iframe busy (observed locally; CI passed by timing luck).
 const until=async(fn,arg,ms,what)=>{const end=Date.now()+ms;while(Date.now()<end){if(await child.evaluate(fn,arg))return;await child.waitForTimeout(250);}throw Error('Timed out waiting for '+what);};
 const activePosition=state.avatars[0].position;
 await child.evaluate(pos=>{window.__bridgeCloudState={ok:true,revision:101,
   state:{selected_id:'bridge-cloud-avatar',avatars:[{id:'bridge-cloud-avatar',name:'Capture QA',
   position:pos,yaw:0,pitch:0,mode:'first',last_path:null}]}};},activePosition);
 assert.equal(await child.locator('#tCloudCapture').getAttribute('aria-pressed'),'false');
 await child.locator('#tCloudCapture').click();
 await until(()=>!!window.__bridgeCloudFrame,null,30000,'browser frame upload');
 const sent=await child.evaluate(()=>window.__bridgeCloudFrame);
 assert.equal(sent.p_model_key,'lahudi-academy');
 assert.equal(sent.p_model_sha,expected);
 assert.equal(sent.p_revision,101);
 assert.equal(sent.p_avatar_id,'bridge-cloud-avatar');
 const uploadedJpeg=Buffer.from(sent.p_jpeg_base64,'base64');
 assert(uploadedJpeg.length>500,'browser shared a non-empty JPEG');
 assert.equal(uploadedJpeg[0],0xff);assert.equal(uploadedJpeg[1],0xd8);
 assert.equal(uploadedJpeg.at(-2),0xff);assert.equal(uploadedJpeg.at(-1),0xd9);
 await fs.writeFile('viewer-qa-evidence/academy-cloud-browser-frame.jpg',uploadedJpeg);
 // Stop sharing while the cloud delete fails: the page must say so and offer a retry.
 await child.evaluate(()=>{window.__bridgeRevokeFail=true;});
 await child.locator('#tCloudCapture').click();
 await until(()=>window.__bridgeCloudRevokes>0&&document.getElementById('cloudText').textContent.includes('未能刪除'),null,15000,'failed-revoke notice');
 assert.equal(await child.locator('#tCloudCapture').getAttribute('aria-pressed'),'false');
 assert.equal((await child.locator('#tCloudCapture').textContent()).trim(),'重試刪除雲端畫面');
 // Retry succeeds: confirmed deletion is reported and the button returns to normal.
 await child.evaluate(()=>{window.__bridgeRevokeFail=false;});
 const before=await child.evaluate(()=>window.__bridgeCloudRevokes);
 await child.locator('#tCloudCapture').click();
 await until(n=>window.__bridgeCloudRevokes>n&&document.getElementById('cloudText').textContent.includes('已刪除'),before,15000,'confirmed delete');
 assert.equal((await child.locator('#tCloudCapture').textContent()).trim(),'共享 AI 巡查畫面');
 assert.equal(await child.locator('#tCloudCapture').getAttribute('aria-pressed'),'false');
 console.log('PASS CLOUD BROWSER WEBGL: 640x360 owner-consent image submitted; failed revoke shown with retry; retry confirmed delete (mock RPC, actual GLB).');
 await fs.writeFile('viewer-qa-evidence/report.json',JSON.stringify({status:'PASS',scope:'real academy GLB + Chromium WebGL + postMessage bridge; production Site/DB chain NOT covered',model_sha:expected,checks:['5 avatars','isolated movement','camera first/third/top/free','real JPEG','screenshot-bound findings','unknown evidence rejected','stale revision rejected','delete','STOP blocks new commands']},null,2));
 console.log('PASS REAL WEBGL BRIDGE: academy SHA, five avatars, cameras, movement, JPEG, screenshot-bound checkpoint payload, stale CAS rejection, delete, STOP. Production Site E2E remains separate.');
 }finally{await browser.close();server.close();parent.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
