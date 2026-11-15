import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const root=new URL('../../../',import.meta.url);
const evidence=new URL('../test-results/',import.meta.url);
let server,origin;
test.before(async()=>{
 server=createServer(async(req,res)=>{
   let p=new URL(req.url,'http://127.0.0.1').pathname;
   if(p.endsWith('/'))p+='index.html';
   if(p.includes('..')||!/^\/[\w./-]+$/.test(p)){res.writeHead(403);res.end();return;}
   try {
     const data=await readFile(new URL('.'+p,root));
     res.writeHead(200,{'content-type':p.endsWith('.mjs')?'text/javascript':p.endsWith('.css')?'text/css':'text/html'});
     res.end(data);
   }catch(e){res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port;
 await mkdir(evidence,{recursive:true});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
});
test('360px simulated mobile: plan, preference, evidence explanations, lesson completion',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:360,height:780}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/english-academy/p4/preview/',{waitUntil:'load'});
  assert.match(await page.locator('body').innerText(),/隔離展示候選版/);
  assert.match(await page.locator('body').innerText(),/建議加強：文法/);
  assert.match(await page.locator('body').innerText(),/FSRS 到期示範卡/);
  await page.screenshot({path:new URL('p4-mobile-plan.png',evidence).pathname,fullPage:true});
  await page.locator('[data-goal="5"]').click();
  assert.match(await page.locator('body').innerText(),/25/);
  await page.locator('#focus-skill').selectOption('speaking');
  assert.match(await page.locator('body').innerText(),/建議加強：口說/);
  await page.locator('[data-complete]').first().click();
  assert.match(await page.locator('body').innerText(),/已在本頁展示資料中標記課程完成/);
  await page.locator('[data-tab="roadmap"]').click();
  assert.match(await page.locator('body').innerText(),/A0～C2 課程地圖/);
  assert.match(await page.locator('body').innerText(),/示範完成/);
  await page.locator('[data-tab="report"]').click();
  assert.match(await page.locator('body').innerText(),/客觀題正確率/);
  await page.locator('[data-tab="errors"]').click();
  await page.locator('[data-answer="present-perfect"][data-choice="1"]').click();
  assert.match(await page.locator('body').innerText(),/回答正確/);
  const dims=await page.evaluate(()=>({client:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth}));
  assert.ok(dims.scroll<=dims.client+1,JSON.stringify(dims));
  assert.deepEqual(errors,[]);
  await page.screenshot({path:new URL('p4-mobile-drills.png',evidence).pathname,fullPage:true});
 }finally{await browser.close();}
});
test('desktop 1280px responsive dark-mode screen and report remain accurate',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/english-academy/p4/preview/',{waitUntil:'load'});
  await page.locator('button[data-theme="1"]').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.locator('[data-tab="report"]').click();
  assert.match(await page.locator('body').innerText(),/示範練習紀錄/);
  assert.match(await page.locator('body').innerText(),/未練習日不扣分/);
  assert.match(await page.locator('body').innerText(),/尚未測驗/);
  const dims=await page.evaluate(()=>({client:document.documentElement.clientWidth,
   scroll:document.documentElement.scrollWidth}));
  assert.ok(dims.scroll<=dims.client+1,JSON.stringify(dims));
  assert.deepEqual(errors,[]);
  await page.screenshot({path:new URL('p4-desktop-report-dark.png',evidence).pathname,fullPage:true});
 }finally{await browser.close();}
});
