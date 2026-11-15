import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const repoRoot=new URL('../../../',import.meta.url);
const screenshots=new URL('../test-results/',import.meta.url);
let server,base;
test.before(async()=>{
 server=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/__english_parent__'){
   res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
   res.end('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body><script>window.LizhiAuth={user:{email:"test-owner@example.invalid"},allowedEmail:"test-owner@example.invalid"};</script><iframe id="english-frame" src="/english-academy/experience/" style="border:0;width:100%;height:730px"></iframe></body></html>');
   return;
  }
  const relative=path.endsWith('/')?path.slice(1)+'index.html':path.slice(1);
  if(!/^[A-Za-z0-9._/-]+$/.test(relative)||relative.includes('..')){
   res.writeHead(403);res.end();return;
  }
  try{
   const data=await readFile(new URL(relative,repoRoot));
   const ct=/\.mjs$/.test(relative)?'text/javascript':/\.css$/.test(relative)?'text/css':
     /\.html$/.test(relative)?'text/html':'text/plain';
   res.writeHead(200,{'content-type':ct+'; charset=utf-8','cache-control':'no-store'});
   res.end(data);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port;
 await mkdir(screenshots,{recursive:true});
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});

test('portal and OAuth route contain same English route and accessible navigation',async()=>{
 const auth=await readFile(new URL('auth.js',repoRoot),'utf8');
 const app=await readFile(new URL('app.js',repoRoot),'utf8');
 const workspace=await readFile(new URL('workspace-ui.js',repoRoot),'utf8');
 assert.match(auth,/allowedRoutes.*"english"/);
 assert.match(app,/OPEN_ROUTES=.*"english"/);
 assert.match(app,/data-route.*route/);
 assert.match(app,/function renderEnglish\(/);
 assert.match(app,/英文學習教室/);
 assert.match(workspace,/state\.route === 'english'/);
 assert.match(workspace,/renderEnglish\(\)/);
});
test('direct static path refuses to render study exercises outside logged-in portal',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:780}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/english-academy/experience/');
  await p.getByText('請先透過立之雲端庫使用核准的 Google 帳號登入', {exact:false}).waitFor();
  assert.equal(await p.locator('.p6-question').count(),0);
  assert.deepEqual(errors,[]);
 } finally{await browser.close();}
});
test('same-origin portal-gated experience works on 360px mobile simulation',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:360,height:780}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/__english_parent__');
  const frame=p.frameLocator('#english-frame');
  await frame.getByText('七種英文練習').waitFor();
  assert.match(await frame.locator('body').innerText(),/體驗版/);
  await frame.locator('button[data-mode-index="1"]').click();
  await frame.locator('button[data-choice="am"]').click();
  assert.match(await frame.locator('[role="status"]').innerText(),/正確/);
  await frame.locator('button[data-mode-index="6"]').click();
  await frame.locator('#practice-answer textarea').fill('I am sleepy after lunch.');
  await frame.locator('#practice-answer button[type="submit"]').click();
  assert.match(await frame.locator('body').innerText(),/固定參考句（不是 AI 實際分析）/);
  await frame.locator('#self-review button[type="submit"]').click();
  assert.match(await frame.locator('[role="status"]').innerText(),/不是由後端驗證/);
  const width=await frame.locator('html').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth}));
  assert.ok(width.scroll<=width.client+1,JSON.stringify(width));
  assert.deepEqual(errors,[]);
  await p.screenshot({path:new URL('english-experience-360px.png',screenshots).pathname,fullPage:true});
 }finally{await browser.close();}
});
test('diagnostic route and dark theme remain operable with no cloud writes',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900}});
  const requests=[];p.on('request',q=>requests.push({url:q.url(),method:q.method()}));
  await p.goto(base+'/__english_parent__');
  const frame=p.frameLocator('#english-frame');
  await frame.getByText('七種英文練習').waitFor();
  await frame.locator('button[data-page="diagnostic"]').click();
  await frame.getByText('題目參考級別 A0',{exact:false}).waitFor();
  await frame.locator('button[data-theme="1"]').click();
  assert.equal(await frame.locator('html').getAttribute('data-theme'),'dark');
  await frame.locator('button[data-choice="餓的"]').click();
  assert.match(await frame.locator('[role="status"]').innerText(),/答對了/);
  assert.ok(requests.every(q=>q.method==='GET'));
  assert.ok(requests.every(q=>q.url.startsWith(base)));
  await p.screenshot({path:new URL('english-experience-desktop.png',screenshots).pathname,fullPage:true});
 }finally{await browser.close();}
});
