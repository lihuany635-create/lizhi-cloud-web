import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';

const modules={
  '@capacitor/core':'export const Capacitor={isNativePlatform:()=>true};',
  '@capacitor/app':'export const App=globalThis.testApp;',
  '@capacitor/browser':'export const Browser=globalThis.testBrowser;',
  '@capacitor/filesystem':'export const Filesystem={};export const Directory={Cache:"CACHE"};',
  '@capacitor/share':'export const Share={};',
  '@supabase/supabase-js':'export const createClient=()=>{};'
};
const built=await build({entryPoints:[new URL('../native-entry.mjs',import.meta.url).pathname],bundle:true,write:false,format:'iife',plugins:[{name:'native-test-platform',setup(b){b.onResolve({filter:/^@/},args=>({path:args.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:modules[args.path],loader:'js'}));}}]});
function runtime(launchURL) {
  const listeners={},exchanges=[],opened=[];let reloads=0,minimized=0,backs=0;
  const memory=new Map();
  const context={URL,Blob,btoa,crypto,TextEncoder,sessionStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},document:{addEventListener(){},querySelector(){return null;},createElement(){return {dataset:{}};}},location:{origin:'https://localhost',pathname:'/',reload(){reloads++;}},testApp:{addListener:async(name,fn)=>{listeners[name]=fn;},getLaunchUrl:async()=>launchURL?{url:launchURL}:null,minimizeApp:async()=>{minimized++;}},testBrowser:{open:async({url})=>{opened.push(url);},close:async()=>{}},LizhiNavigation:{back:()=>{backs++;return true;}}};
  context.window=context;
  vm.runInNewContext(built.outputFiles[0].text,context);
  const client={auth:{exchangeCodeForSession:async(code)=>{exchanges.push(code);return {error:null};},signInWithOAuth:async()=>({data:{url:'https://project.supabase.co/auth/v1/authorize?provider=google'},error:null})}};
  context.LizhiMobile.attachAuth(client);
  return {context,client,listeners,exchanges,opened,stats:()=>({reloads,minimized,backs})};
}
test('Cold-start authentication waits for auth initialization and completes without reload loops',async()=>{
  const r=runtime('lizhi-cloud://auth/callback?code=cold');await r.context.LizhiMobile.ready;assert.deepEqual(r.exchanges,['cold']);assert.equal(r.stats().reloads,0);
});
test('Warm-start callback is processed once and invalid origins never exchange codes',async()=>{
  const r=runtime();await r.context.LizhiMobile.ready;
  r.listeners.appUrlOpen({url:'https://evil.example/?code=secret'});
  r.listeners.appUrlOpen({url:'lizhi-cloud://auth/callback?code=warm'});
  r.listeners.appUrlOpen({url:'lizhi-cloud://auth/callback?code=warm'});
  for(let i=0;i<20&&r.stats().reloads===0;i++)await new Promise(resolve=>setTimeout(resolve,5));assert.deepEqual(r.exchanges,['warm']);assert.equal(r.stats().reloads,1);
  assert.notEqual(r.context.sessionStorage.getItem('lizhi-mobile-auth-return'),'warm');
});
test('Native login opens the authorization service in the external browser',async()=>{
  const r=runtime();await r.context.LizhiMobile.ready;r.context.LIZHI_SUPABASE_URL='https://project.supabase.co';await r.context.LizhiMobile.signIn(r.client);assert.equal(r.opened.length,1);
});
test('Android back button delegates to app navigation before minimizing',async()=>{
  const r=runtime();await r.context.LizhiMobile.ready;r.listeners.backButton();assert.equal(r.stats().backs,1);assert.equal(r.stats().minimized,0);
  r.context.LizhiNavigation.back=()=>false;r.listeners.backButton();assert.equal(r.stats().minimized,1);
});
