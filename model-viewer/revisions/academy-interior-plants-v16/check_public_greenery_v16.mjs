#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {mkdir,writeFile,rm} from 'node:fs/promises';
const fsroot='/tmp/rg-v16-plants-cdp';
await rm(fsroot,{recursive:true,force:true});await mkdir(fsroot,{recursive:true});
const chrome=process.env.CHROME||'/usr/bin/google-chrome';
const url='https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/#lahudi-academy';
const child=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--disable-extensions','--disable-background-networking',
 '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--remote-debugging-port=9223','--remote-allow-origins=*',
 '--user-data-dir='+fsroot,'--window-size=720,1380',
 url],{stdio:['ignore','pipe','pipe']});
let chromeErr='';
child.stderr.on('data',s=>{chromeErr+=s.toString();if(chromeErr.length>200000)chromeErr=chromeErr.slice(-100000)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let tab;
for(let i=0;i<120;i++){
 try{
  const response=await fetch('http://127.0.0.1:9223/json/list');
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
await sleep(6000);
// Switch to the new V16 classroom greenery camera (real viewer control), then capture.
const plantsClick=await cmd('Runtime.evaluate',{expression:"(()=>{const b=document.querySelector('#academyPlants');if(!b)return 'MISSING_PLANTS_BUTTON';b.click();return 'PLANTS_BUTTON_CLICKED'})()",returnByValue:true});
await sleep(4500);
sample=(await cmd('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result?.value||sample;
sample.plantsButton=plantsClick.result?.value;
const stat=await cmd('Runtime.evaluate',{expression:"(()=>({label:document.querySelector('#academyPlants')?.textContent,selected:document.querySelector('#academyPlants')?.getAttribute('aria-pressed'),camera:typeof camera!=='undefined'?camera.position.toArray():[],visibleMeshes:typeof meshLayers!=='undefined'?meshLayers.filter(x=>x.object.visible).length:0,sha:document.querySelector('#viewerVersion')?.textContent}))()",returnByValue:true});
sample.plantsStats=stat.result?.value;
if(sample.plantsButton!=='PLANTS_BUTTON_CLICKED'||sample.plantsStats?.selected!=='true')throw Error('V16 public plants view control unavailable');
if(!String(sample.plantsStats?.label).includes('V16'))throw Error('V16 plants button label missing');
if(!String(sample.plantsStats?.sha).includes('ACADEMY-V16-INDOOR-GREENERY-PHASE1-REVIEW'))throw Error('Public school version is not V16 yet: '+sample.plantsStats?.sha);
sample.webglRenderReady=!!(sample.render && sample.render.triangles>0 && sample.render.calls>0 && !sample.webglLost);if(!sample.webglRenderReady)console.warn('V16 model identity is verified but headless WebGL failed to draw; screenshot and diagnosis will be saved as unverified visual evidence.');
const screenshot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
const output='candidate-output/academy-v16-plants-diagnostic';
await mkdir(output,{recursive:true});
if(screenshot.data)await writeFile(output+'/plants-actual-cdp.png',Buffer.from(screenshot.data,'base64'));
await writeFile(output+'/chrome-diagnostic.json',JSON.stringify({sample,events,chromeStderr:chromeErr.slice(-6000)},null,2));
console.log(JSON.stringify({sample,errors:events.slice(-12).map(e=>({method:e.method,text:JSON.stringify(e.params).slice(0,400)})),stderrTail:chromeErr.slice(-1600)},null,2));
ws.close();child.kill('SIGTERM');
