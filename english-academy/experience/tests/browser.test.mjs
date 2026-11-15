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
  if(path==='/__english_portal_layout__'){
   res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
   res.end(`<!doctype html><html lang="zh-Hant"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/study.css"><link rel="stylesheet" href="/workspace-ui.css"></head><body><script>window.LizhiAuth={user:{email:"test-owner@example.invalid"},allowedEmail:"test-owner@example.invalid"};</script><div class="shell route-english"><header class="topbar">立之雲端庫</header><main class="main"><div class="workspace-panel" data-panel="english"><section class="study-embedded english-academy-embedded"><header class="study-embedded-toolbar"><div><div class="eyebrow">ENGLISH LEARNING · EXPERIENCE</div><h1>英文學習教室</h1><p>七種練習題型與入門測驗；目前為不儲存資料的體驗版。</p></div><div class="actions"><span class="chip">限本人從主站登入使用</span></div></header><div class="study-frame-wrap"><iframe id="english-frame" title="英文學習教室" src="/english-academy/experience/"></iframe></div></section></div></main></div></body></html>`);
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

test('real portal CSS gives English lessons the remaining viewport on phones, landscape and desktop',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,640],[360,780],[393,852],[667,375],[1280,900]]){
   const p=await browser.newPage({viewport:{width,height},isMobile:width<700,hasTouch:width<700});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+'/__english_portal_layout__');
   const frame=p.frameLocator('#english-frame');
   await frame.getByText('七種英文練習').waitFor();
   const d=await p.locator('#english-frame').evaluate(el=>{
    const r=el.getBoundingClientRect();
    const main=document.querySelector('.route-english .main');
    const panel=el.closest('.workspace-panel');
    const embedded=el.closest('.study-embedded');
    return {top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight,
      parentHeight:el.parentElement.clientHeight,
      mainHeight:main.getBoundingClientRect().height,
      panelHeight:panel.getBoundingClientRect().height,
      sectionHeight:embedded.getBoundingClientRect().height,
      documentWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
   });
   assert.ok(d.panelHeight>=d.mainHeight-2,'Workspace panel lost main viewport height at '+width+'x'+height+': '+JSON.stringify(d));
   assert.ok(d.sectionHeight>=d.panelHeight-2,'Embedded lesson lost workspace panel height at '+width+'x'+height+': '+JSON.stringify(d));
   assert.ok(d.height>=d.viewport*.52,'Lesson frame too small for '+width+'x'+height+': '+JSON.stringify(d));
   assert.ok(Math.abs(d.viewport-d.bottom)<=4,'Unused blank space below iframe at '+width+'x'+height+': '+JSON.stringify(d));
   assert.ok(d.documentWidth<=d.clientWidth+1,'Portal horizontal overflow at '+width+'x'+height+': '+JSON.stringify(d));
   await frame.locator('button[data-flip="3"]').click();
   assert.match(await frame.locator('[role="status"]').innerText(),/已記錄示範操作/);
   assert.deepEqual(errors,[],'Page errors at '+width+'x'+height);
   await p.close();
  }
 }finally{await browser.close();}
});

test('all seven exercise modes and all 14 diagnostic stages stay usable without persisted personal records',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/__english_portal_layout__');
  const frame=p.frameLocator('#english-frame');
  await frame.getByText('七種英文練習').waitFor();
  await frame.locator('button[data-flip="3"]').click();
  assert.match(await frame.locator('[role="status"]').innerText(),/已記錄示範操作/);

  await frame.locator('button[data-mode-index="1"]').click();
  await frame.locator('button[data-choice="am"]').click();
  assert.match(await frame.locator('[role="status"]').innerText(),/正確/);

  const inputs=[
   [2,'apple'],[3,'haven’t'],[4,"I haven't eaten anything."],
   [5,'I am hungry'],[6,'I feel sleepy after lunch.']
  ];
  for(const [mode,answer] of inputs){
   await frame.locator('button[data-mode-index="'+mode+'"]').click();
   await frame.locator('#practice-answer [name="answer"]').fill(answer);
   await frame.locator('#practice-answer button[type="submit"]').click();
   assert.equal(await frame.locator('[role="status"]').count(),1,'Missing outcome for exercise mode '+mode);
  }
  assert.match(await frame.locator('body').innerText(),/已完成 7 次示範作答/);
  assert.match(await frame.locator('body').innerText(),/不是 AI 實際分析/);
  await frame.locator('button[data-page="diagnostic"]').click();
  for(let i=0;i<14;i++){
   assert.match(await frame.locator('body').innerText(),new RegExp('(?:^|[^0-9])'+(i+1)+' / 14'));
   await frame.locator('button[data-diag-next]').click();
  }
  assert.match(await frame.locator('body').innerText(),/測驗結果（非官方）/);
  assert.match(await frame.locator('body').innerText(),/尚未評估/);
  await frame.locator('button[data-page="practice"]').click();
  await p.reload();
  await frame.getByText('七種英文練習').waitFor();
  assert.match(await frame.locator('body').innerText(),/已完成 0 次示範作答/);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
