import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
test('QA-07 Google 登入保留允許的工作台路由，拒絕任意轉址',async()=>{
 const source=await readFile(new URL('../auth.js',import.meta.url),'utf8');
 for(const [search,expected] of [['?open=imagegraph','?open=imagegraph'],['?open=https://evil.example','']]){
 let click,oauth;const button={disabled:false,textContent:'',addEventListener:(name,fn)=>{click=fn}};const client={auth:{getSession:async()=>({data:{session:null},error:null}),signInWithOAuth:async args=>{oauth=args;return {error:null}}}};
 const context={URL,URLSearchParams,window:{supabase:{createClient:()=>client}},document:{body:{innerHTML:''},querySelector:()=>button},location:{origin:'https://lihuany635-create.github.io',pathname:'/lizhi-cloud-web/',search}};
 vm.runInNewContext(source,context);await context.window.LizhiAuth.requireUser();await click();assert.equal(new URL(oauth.options.redirectTo).search,expected);
 }
});
