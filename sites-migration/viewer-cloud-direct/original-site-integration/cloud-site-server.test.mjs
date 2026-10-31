import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TOOLS,validate,handle,invoke} from './cloud-site-server.mjs';
import {encodeJpeg} from '../../../supabase/functions/lizhi-viewer-cloud/jpeg-encoder.mjs';
const TEST_JPEG=Buffer.from(encodeJpeg(new Uint8Array(640*360*4).fill(128),640,360,60)).toString('base64');
const ORIGIN='https://lizhi-viewer-agent-20261027.lihuany635.chatgpt.site';
const env={VIEWER_CONTROL_TOKEN:'a'.repeat(96)};
const owner='appgprj_6ae0c336243881919e9ba2bbf450f1fb:owner-fixture';
const write={model_key:'lahudi-academy',model_sha:'b'.repeat(64),expected_revision:0,request_id:'a1111111-1111-4111-8111-111111111111',name:'TEST ONLY',position:[0,0,0]};
const request=(path,body,auth=true,extra={})=>new Request(ORIGIN+path,{method:'POST',headers:{'content-type':'application/json',...(auth?{'oai-authenticated-user-id':'owner-fixture','oai-authenticated-user-email':'owner@example.test'}:{}),...extra},body:JSON.stringify(body)});
const call=(name,args={})=>({jsonrpc:'2.0',id:'test-id',method:'tools/call',params:{name,arguments:args}});
test('original MCP route delivers image with bound metadata and keeps UI JSON compatibility',async()=>{
 const args={model_key:'lahudi-academy',model_sha:'b'.repeat(64)};
 const value={ok:true,real_screenshot:true,source:'cloud_cpu_render',render_attested:true,requires_browser:false,camera:{mode:'first',width:640,height:360,position:[0,1.6,0],target:[0,1.6,1]},limitations:'Synthetic unit fixture; not real model evidence',...args,revision:4,avatar_id:'fixture-avatar',captured_at:new Date().toISOString(),image:{mimeType:'image/jpeg',data:TEST_JPEG}};
 const f=async()=>Response.json(value);
 const rpc=await(await handle(request('/mcp',call('viewer_get_screenshot',args)),env,'',f)).json();
 assert.equal(rpc.result.isError,false);assert.equal(rpc.result.content[1].type,'image');assert.equal(rpc.result.content[1].mimeType,'image/jpeg');
 const metadata=JSON.parse(rpc.result.content[0].text);for(const k of ['model_key','model_sha','revision','avatar_id','captured_at'])assert.equal(metadata[k],value[k]);
 assert(!rpc.result.content[0].text.includes(value.image.data));
 const ui=await(await handle(request('/api/tool',call('viewer_get_screenshot',args),true,{origin:ORIGIN,'x-viewer-ui':'1'}),env,'',f)).json();
 assert.equal(ui.result.content.length,1);assert.equal(JSON.parse(ui.result.content[0].text).image.data,value.image.data);
 for(const bad of [{model_sha:'c'.repeat(64)},{captured_at:new Date(Date.now()-91000).toISOString()},{revision:-1},{avatar_id:''}])await assert.rejects(invoke('viewer_get_screenshot',args,owner,env,async()=>Response.json({...value,...bad})),/INVALID_SCREENSHOT/);
});

test('required screenshot model fields reject omission before any upstream request',async()=>{
 let calls=0;const f=async()=>{calls++;return Response.json({ok:true});};
 for(const args of [{},{model_key:'lahudi-academy'},{model_sha:'b'.repeat(64)},{model_key:'lahudi-academy',model_sha:'b'.repeat(64),owner:'other'}]){
  const r=await(await handle(request('/mcp',call('viewer_get_screenshot',args)),env,'',f)).json();
  assert.equal(r.result.isError,true);assert.equal(JSON.parse(r.result.content[0].text).code,'VIEWER_INVALID_ARGUMENTS');
 }
 assert.equal(calls,0);
});
test('successful cloud screenshot metadata cannot silently substitute browser/image/revision/avatar',async()=>{
 const args={model_key:'lahudi-academy',model_sha:'b'.repeat(64),expected_revision:42,avatar_id:'chosen'};
 const value={ok:true,real_screenshot:true,render_attested:true,requires_browser:false,source:'cloud_cpu_render',...args,revision:42,captured_at:new Date().toISOString(),camera:{mode:'first',width:640,height:360,position:[0,1.6,0],target:[0,1.6,1]},limitations:'Unit fixture only',image:{mimeType:'image/jpeg',data:TEST_JPEG}};
 assert.equal((await invoke('viewer_get_screenshot',args,owner,env,async()=>Response.json(value))).ok,true);
 for(const change of [{source:'owner_browser_uploaded_jpeg'},{requires_browser:true},{revision:41},{avatar_id:'another'},{image:{mimeType:'image/jpeg',data:'/9j/'+'A'.repeat(1100)}},{camera:{...value.camera,width:1280}}])await assert.rejects(invoke('viewer_get_screenshot',args,owner,env,async()=>Response.json({...value,...change})),/INVALID_SCREENSHOT/);
});

test('owner-managed Site render gate revokes screenshots without blocking navigation/status',async()=>{
 const disabled={...env,VIEWER_RENDER_DISABLED:'1'};let calls=0;
 const f=async()=>{calls++;return Response.json({ok:true,mode:'cloud_direct',cloud_rendering:true});};
 await assert.rejects(invoke('viewer_get_screenshot',{model_key:'lahudi-academy',model_sha:'b'.repeat(64)},owner,disabled,f),/CLOUD_RENDER_REVOKED/);
 assert.equal(calls,0);
 const status=await invoke('viewer_status',{},owner,disabled,f);assert.equal(status.cloud_rendering,false);assert.equal(status.render_revoked,true);
 const stop=await invoke('viewer_stop',{},owner,disabled,f);assert.equal(stop.render_revoked,true);assert.equal(calls,2);
});
