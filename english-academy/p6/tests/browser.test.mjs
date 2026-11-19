import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const root=new URL('../../../',import.meta.url);
const screenshots=new URL('../test-results/',import.meta.url);
let server,base;
test.before(async()=>{
 server=createServer(async(req,res)=>{
   const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   let relative=path==='/'?'english-academy/p6/preview/index.html':path.slice(1);
   if(relative.endsWith('/'))relative+='index.html';
   if(relative.includes('..')||!/^[A-Za-z0-9._/-]+$/.test(relative)){
     res.writeHead(403);res.end();return;
   }
   try{
     const bytes=await readFile(new URL(relative,root));
     const mime=relative.endsWith('.mjs')?'text/javascript; charset=utf-8':
       relative.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';
     res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});res.end(bytes);
   }catch(e){res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/';
 await mkdir(screenshots,{recursive:true});
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
test('P6 360px phone demo: seven modes, review, listening unverified, no overflow',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:360,height:780}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'english-academy/p6/preview/');
  assert.match(await p.locator('body').innerText(),/隔離展示/);
  await p.locator('button[data-mode-index="1"]').click();
  await p.locator('button[data-choice="am"]').click();
  assert.match(await p.locator('[role="status"]').innerText(),/正確/);
  await p.locator('button[data-mode-index="2"]').click();
  await p.locator('#practice-answer input').fill('apple');
  await p.locator('#practice-answer button[type="submit"]').click();
  assert.match(await p.locator('[role="status"]').innerText(),/正確/);
  await p.locator('button[data-mode-index="5"]').click();
  await p.locator('#practice-answer input').fill('I am hungry');
  await p.locator('#practice-answer button[type="submit"]').click();
  assert.match(await p.locator('[role="status"]').innerText(),/音訊驗證/);
  await p.locator('button[data-mode-index="6"]').click();
  await p.locator('#practice-answer textarea').fill('I feel sleepy after lunch.');
  await p.locator('#practice-answer button[type="submit"]').click();
  assert.match(await p.locator('body').innerText(),/固定參考句（不是 AI 實際分析）/);
  await p.locator('#self-review input').first().check();
  await p.locator('#self-review button[type="submit"]').click();
  assert.match(await p.locator('[role="status"]').innerText(),/不是由後端驗證/);
  const size=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,
    viewport:document.documentElement.clientWidth}));
  assert.ok(size.scroll<=size.viewport+1,'P6 horizontal overflow '+JSON.stringify(size));
  assert.deepEqual(errors,[]);
  await p.screenshot({path:new URL('p6-mobile-practice.png',screenshots).pathname,fullPage:true});
 }finally{await browser.close();}
});
test('P6 desktop demo: diagnostic shows six skills without invented CEFR',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'english-academy/p6/preview/');
  await p.locator('button[data-theme="1"]').click();
  assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');
  await p.locator('button[data-page="diagnostic"]').click();
  assert.match(await p.locator('body').innerText(),/題目參考級別 A0/);
  await p.locator('button[data-choice="餓的"]').click();
  for(let i=0;i<14;i++)await p.locator('button[data-diag-next="1"]').click();
  assert.match(await p.locator('body').innerText(),/測驗結果（非官方）/);
  assert.match(await p.locator('body').innerText(),/不足以認證 CEFR/);
  await p.screenshot({path:new URL('p6-desktop-diagnostic.png',screenshots).pathname,fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
