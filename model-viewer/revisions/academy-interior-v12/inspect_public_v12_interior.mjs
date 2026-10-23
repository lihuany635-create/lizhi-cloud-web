#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {mkdir,writeFile,rm} from 'node:fs/promises';
const fsroot='/tmp/rg-v12-cdp';
await rm(fsroot,{recursive:true,force:true});await mkdir(fsroot,{recursive:true});
const chrome=process.env.CHROME||'/usr/bin/google-chrome';
const url='https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/#lahudi-academy';
const child=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--disable-extensions','--disable-background-networking',
 '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--remote-debugging-port=9225','--remote-allow-origins=*',
 '--user-data-dir='+fsroot,'--window-size=720,1380',
 url],{stdio:['ignore','pipe','pipe']});
let chromeErr='';
child.stderr.on('data',s=>{chromeErr+=s.toString();if(chromeErr.length>200000)chromeErr=chromeErr.slice(-100000)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let tab;
for(let i=0;i<120;i++){
 try{
  const response=await fetch('http://127.0.0.1:9225/json/list');
  const j=await response.json();
  tab=j.find(x=>x.type==='page'&&x.url.startsWith('https://lihuany635-create.github.io/'));
  if(tab)break;
 }catch(e){}
 await sleep(500);
}
if(!tab)throw Error('Chrome CDP page unavailable '+chromeErr.slice(-1000));
const ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
let id=0;const pending=new Map(),events=[];
ws.onmessage=event=>{
 let obj;try{obj=JSON.parse(event.data)}catch{return}
 if(obj.id){
  const waiter=pending.get(obj.id);
  if(waiter){pending.delete(obj.id);(obj.error?waiter.reject:waiter.resolve)(obj.error||obj.result)}
 }else if(['Runtime.consoleAPICalled','Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed'].includes(obj.method)){
  events.push({method:obj.method,params:obj.params});
 }
};
function cmd(method,params={}){
 const commandId=++id;
 return new Promise((resolve,reject)=>{
  pending.set(commandId,{resolve,reject});
  ws.send(JSON.stringify({id:commandId,method,params}));
  setTimeout(()=>{const c=pending.get(commandId);if(c){pending.delete(commandId);reject(new Error('CDP timeout: '+method))}},45000);
 });
}
await cmd('Runtime.enable');await cmd('Log.enable');await cmd('Page.enable');
let sample;
const expr="(()=>{try{return {at:new Date().toISOString(),preview:window.GLBPreview?.active,modelKey:typeof modelKey!=='undefined'?modelKey:'N/A',modelName:typeof modelName!=='undefined'?modelName:'N/A',visibleMeshes:typeof meshLayers!=='undefined'?meshLayers.filter(x=>x.object.visible).length:-1,totalMeshes:typeof meshLayers!=='undefined'?meshLayers.length:-1,canvasSize:typeof renderer!=='undefined'?[renderer.domElement.width,renderer.domElement.height]:null,render:typeof renderer!=='undefined'?{...renderer.info.render}:null,webglLost:typeof renderer!=='undefined'?renderer.getContext().isContextLost():null,sceneChildren:typeof scene!=='undefined'?scene.children.length:null,modelVisible:typeof model!=='undefined'?model?.visible:null,camera:typeof camera!=='undefined'?camera.position.toArray():null,target:typeof controls!=='undefined'?controls.target.toArray():null,cut:typeof activeCutHeight!=='undefined'?activeCutHeight:null,overlay:document.querySelector('#ov')?.hidden,version:document.querySelector('#viewerVersion')?.textContent,grid:typeof grid!=='undefined'?grid?.visible:null}}catch(e){return {error:String(e)}}})()";
for(let i=0;i<50;i++){
 await sleep(1000);
 const ans=await cmd('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
 sample=ans.result?.value||{exception:ans.exceptionDetails};
 if(sample.modelName?.includes('拉乎迪') || sample.modelKey==='lahudi-academy') break;
}
await sleep(6500);
sample=(await cmd('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result?.value||sample;

const output='candidate-output/academy-v12-interior-diagnostic';
await mkdir(output,{recursive:true});
const sections=['B1','B2','C1','G1','H1'];
const samples={};
for(const section of sections){
 const evalResult=await cmd('Runtime.evaluate',{
   expression:"(()=>{const s=document.querySelector('#academyInteriorSelect');if(!s)return {error:'no select'};s.value="+JSON.stringify(section)+";s.dispatchEvent(new Event('change',{bubbles:true}));return {selected:s.value,cut:typeof activeCutHeight!=='undefined'?activeCutHeight:null,visibleMeshes:typeof meshLayers!=='undefined'?meshLayers.filter(x=>x.object.visible).length:0};})()",
   returnByValue:true,awaitPromise:true
 });
 await sleep(2200);
 const status=(await cmd('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result?.value;
 samples[section]={control:evalResult.result?.value,viewer:status};
 const shot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
 if(shot.data)await writeFile(output+'/furniture-'+section+'-mobile.png',Buffer.from(shot.data,'base64'));
}
await writeFile(output+'/interior-qa.json',JSON.stringify({sections:samples,initial:sample,events,chromeStderr:chromeErr.slice(-6000)},null,2));
console.log(JSON.stringify({controls:Object.fromEntries(Object.entries(samples).map(([k,v])=>[k,{selection:v.control,renderer:v.viewer?.render,webglLost:v.viewer?.webglLost,visibleMeshes:v.viewer?.visibleMeshes}])),errors:events.slice(-6).map(e=>({method:e.method,text:JSON.stringify(e.params).slice(0,500)}))},null,2));
ws.close();child.kill('SIGTERM');
