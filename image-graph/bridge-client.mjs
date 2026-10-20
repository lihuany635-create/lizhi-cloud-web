import {BRIDGE_CHANNEL} from './bridge-protocol.mjs?v=28';
export function createBridgeClient({backendOrigin,scope=window,timeoutMs=60000}){
 if(!/^https:\/\/[a-z0-9.-]+\.chatgpt\.site$/.test(backendOrigin))throw Error('私人交接來源無效');
 let popup=null,nonce=null,ready=false,approved=false,phase='idle',watch=null,lastReady=0;const pending=new Map(),listeners=new Set();
 const status=()=>ready&&popup&&!popup.closed;
 const state=()=>({phase,approved,connected:!!status()});
 const update=()=>{for(const fn of listeners)fn(!!status(),state())};
 const stopWatch=()=>{if(watch!==null)scope.clearInterval?.(watch);watch=null};
 function rejectPending(message){for(const p of [...pending.values()])p.reject(Error(message));pending.clear()}
 function disconnect(){
  if(popup&&!popup.closed)try{popup.postMessage({channel:BRIDGE_CHANNEL,nonce,type:'disconnect'},backendOrigin)}catch{}
  stopWatch();popup=null;ready=false;approved=false;phase='disconnected';rejectPending('私人交接連線已中斷，請重新連接');update();
 }
 function check(){
  if(!popup)return;
  if(popup.closed){stopWatch();ready=false;phase='closed';rejectPending('連接分頁已關閉，請重新連接私人交接');update();return}
  if(ready&&Date.now()-lastReady>15000){ready=false;phase='waiting';update()}
  try{popup.postMessage({channel:BRIDGE_CHANNEL,nonce,type:'hello'},backendOrigin)}catch{}
 }
 scope.addEventListener('message',event=>{
  const m=event.data;if(event.origin!==backendOrigin||event.source!==popup||m?.channel!==BRIDGE_CHANNEL||m.nonce!==nonce)return;
  if(m.type==='ready'){
   const changed=!ready;ready=true;approved=true;phase='connected';lastReady=Date.now();
   popup.postMessage({channel:BRIDGE_CHANNEL,nonce,type:'accepted'},backendOrigin);
   if(changed)update();return;
  }
  if(m.type==='closed'){disconnect();return}
  if(m.type!=='response')return;const p=pending.get(m.id);if(!p)return;
  if(m.error)p.reject(Object.assign(Error(m.error),{status:m.status}));else p.resolve(m.result);
 });
 function connect(){
  disconnect();nonce=crypto.randomUUID();phase='connecting';
  const url=new URL('/workbench/bridge.html',backendOrigin);url.searchParams.set('client_origin',scope.location.origin);url.searchParams.set('nonce',nonce);
  // Called directly from an explicit button; never open a popup during fetch.
  popup=scope.open(url.href,'yinggou-library-'+nonce,'popup,width=520,height=660');
  if(!popup){phase='blocked';update();throw Error('瀏覽器阻擋連接視窗，請允許此網站開啟視窗後再按連接')}
  update();if(scope.setInterval)watch=scope.setInterval(check,1500);
  return popup;
 }
 function request(action,fields={},signal){
  check();
  if(!status())return Promise.reject(Error('請先按「連接私人交接」，並在映構視窗允許連線'));
  if(signal?.aborted)return Promise.reject(new DOMException('已取消','AbortError'));
  const id=crypto.randomUUID();return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>finish(reject,Error('私人交接逾時，請確認連接視窗仍開啟後重試')),timeoutMs);
   const abort=()=>finish(reject,new DOMException('已取消','AbortError'));
   function finish(fn,value){clearTimeout(timer);signal?.removeEventListener('abort',abort);pending.delete(id);fn(value)}
   pending.set(id,{resolve:value=>finish(resolve,value),reject:error=>finish(reject,error)});signal?.addEventListener('abort',abort,{once:true});
   try{popup.postMessage({channel:BRIDGE_CHANNEL,nonce,type:'request',id,action,...fields},backendOrigin)}catch(e){finish(reject,e)}
  });
 }
 async function fetcher(path,options={}){
  const h=new Headers(options.headers),result=await request('api',{path,method:options.method||'GET',body:options.body,contentType:h.get('Content-Type')||undefined},options.signal);
  return new Response(result.body,{status:result.status,headers:result.headers});
 }
 scope.addEventListener('focus',check);scope.addEventListener('pageshow',check);
 scope.document?.addEventListener('visibilitychange',()=>{if(!scope.document.hidden)check()});
 return {connect,disconnect,request,fetch:fetcher,connected:()=>!!status(),state,subscribe:fn=>{listeners.add(fn);fn(!!status(),state());return()=>listeners.delete(fn)}};
}
