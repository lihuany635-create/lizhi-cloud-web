import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { callbackCode, oauthURL } from '../auth-contract.mjs';

test('Android callback accepts only the intended PKCE endpoint and a single code', () => {
  assert.equal(callbackCode('lizhi-cloud://auth/callback?code=abc-123'),'abc-123');
  for (const url of ['https://auth/callback?code=x','lizhi-cloud://evil/callback?code=x','lizhi-cloud://auth/other?code=x','lizhi-cloud://auth/callback?code=a&code=b','lizhi-cloud://auth/callback#access_token=secret','lizhi-cloud://auth/callback?code=','lizhi-cloud://user@auth/callback?code=x']) assert.equal(callbackCode(url),null,url);
  assert.throws(()=>callbackCode('lizhi-cloud://auth/callback?error=access_denied'));
});
test('OAuth can open only this project authorization service', () => {
  assert.equal(oauthURL('https://project.supabase.co/auth/v1/authorize?provider=google','https://project.supabase.co'),'https://project.supabase.co/auth/v1/authorize?provider=google');
  for (const url of ['https://evil.example/auth/v1/authorize','http://project.supabase.co/auth/v1/authorize','https://project.supabase.co/other']) assert.throws(()=>oauthURL(url,'https://project.supabase.co'));
});

const source = await readFile(new URL('../../auth.js',import.meta.url),'utf8');
function harness({native=true,email=null}={}) {
  let click, config, signedOut=0, nativeLogins=0, webLogins=0, attached;
  const button={disabled:false,textContent:'',addEventListener:(_,fn)=>{click=fn;}};
  const client={auth:{getSession:async()=>({data:{session:email?{user:{email}}:null},error:null}),signOut:async()=>{signedOut++;},signInWithOAuth:async()=>{webLogins++;return {error:null};}}};
  const context={URL,URLSearchParams,window:{LizhiPlatform:{isNative:native},LizhiMobile:{attachAuth:c=>{attached=c;},signIn:async()=>{nativeLogins++;}},supabase:{createClient:(_url,_key,options)=>{config=options;return client;}}},document:{body:{innerHTML:''},querySelector:()=>button},location:{origin:'https://example.github.io',pathname:'/lizhi-cloud-web/',search:''}};
  vm.runInNewContext(source,context);
  return {context,client,click:()=>click(),stats:()=>({config,signedOut,nativeLogins,webLogins,attached})};
}
test('Native sign-in retains the account gate and uses the external-browser PKCE route',async()=>{
  const h=harness(); assert.equal(await h.context.window.LizhiAuth.requireUser(),null); await h.click();
  assert.equal(h.stats().config.auth.flowType,'pkce');assert.equal(h.stats().config.auth.detectSessionInUrl,false);
  assert.equal(h.stats().nativeLogins,1);assert.equal(h.stats().webLogins,0);assert.equal(h.stats().attached,h.client);
});
test('Unapproved native sessions are signed out before module access',async()=>{
  const h=harness({email:'unapproved@example.com'});assert.equal(await h.context.window.LizhiAuth.requireUser(),null);assert.equal(h.stats().signedOut,1);
});
test('Existing approved cached sessions can reopen modules',async()=>{
  const h=harness({email:'lihuany635@gmail.com'});assert.equal((await h.context.window.LizhiAuth.requireUser()).email,'lihuany635@gmail.com');assert.equal(h.stats().signedOut,0);
});
test('Web sign-in keeps its current redirect flow',async()=>{
  const h=harness({native:false});await h.context.window.LizhiAuth.requireUser();await h.click();assert.equal(h.stats().webLogins,1);assert.equal(h.stats().nativeLogins,0);assert.equal(h.stats().config.auth.detectSessionInUrl,true);
});
