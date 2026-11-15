// Candidate-only browser smoke tests using Playwright.
// No Supabase, account, production host, external API or real learner data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = new URL('../preview/', import.meta.url);
const captureDir = new URL('../test-results/', import.meta.url);
let server;
let origin;

test.before(async () => {
  server = createServer(async (req,res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = path==='/'?'index.html':path.slice(1);
    if(relative.includes('..') || !/^[a-zA-Z0-9._/-]+$/.test(relative)){
      res.writeHead(403);res.end();return;
    }
    try{
      const file = new URL(relative,root);
      const data = await readFile(file);
      const type = relative.endsWith('.mjs')?'text/javascript; charset=utf-8':relative.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';
      res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(data);
    }catch{
      res.writeHead(404);res.end();
    }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin='http://127.0.0.1:'+server.address().port;
  await mkdir(captureDir,{recursive:true});
});
test.after(async()=>{
 if(server) await new Promise(resolve=>server.close(resolve));
});

test('mobile candidate flow: responsive layout, review, search, sentence practice',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
   const page=await browser.newPage({viewport:{width:360,height:780},deviceScaleFactor:1});
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto(origin,{waitUntil:'load'});
   assert.match(await page.locator('body').innerText(),/展示模式/);
   assert.match(await page.locator('body').innerText(),/尚未評估/);
   assert.equal(await page.locator('.bottom-nav').isVisible(),true);
   await page.screenshot({path:new URL('mobile-home.png',captureDir).pathname,fullPage:true});
   await page.locator('.bottom-nav button[data-tab="cards"]').click();
   assert.equal(await page.locator('[data-accept="cand-1"]').count(),1);
   await page.locator('[data-accept="cand-1"]').click();
   assert.match(await page.locator('[role="status"]').innerText(),/APPROVED/);
   await page.locator('#word-search').fill('HUNGRY');
   assert.match(await page.locator('#demo-card-rows').innerText(),/hungry/);
   assert.doesNotMatch(await page.locator('#demo-card-rows').innerText(),/rice/);
   await page.locator('#word-search').fill('');
   await page.locator('#word-term').fill('apple');
   await page.locator('#word-meaning').fill('蘋果');
   await page.locator('#add-word button[type="submit"]').click();
   assert.match(await page.locator('#demo-card-rows').innerText(),/apple/);
   await page.locator('.bottom-nav button[data-tab="practice"]').click();
   await page.locator('button[data-mode="sentence"]').click();
   await page.locator('#practice-form textarea').fill('I eat rice.');
   await page.locator('#practice-form button').click();
   assert.match(await page.locator('.notice').allInnerTexts().then(x=>x.join(' ')),/I eat rice/);
   await page.locator('button[data-grade="true"]').click();
   await page.locator('.bottom-nav button[data-tab="analytics"]').click();
   assert.match(await page.locator('body').innerText(),/本次練習/);
   const scroll = await page.evaluate(()=>({
     doc:document.documentElement.scrollWidth,
     viewport:document.documentElement.clientWidth
   }));
   assert.ok(scroll.doc<=scroll.viewport+1,'mobile horizontal overflow: '+JSON.stringify(scroll));
   assert.deepEqual(pageErrors,[]);
   await page.screenshot({path:new URL('mobile-analysis.png',captureDir).pathname,fullPage:true});
 } finally {await browser.close();}
});

test('desktop candidate: navigation, dark theme and no console exception',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
   const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto(origin,{waitUntil:'load'});
   assert.equal(await page.locator('.nav').isVisible(),true);
   await page.locator('.nav button[data-tab="settings"]').click();
   await page.locator('button[data-theme="1"]').click();
   assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   await page.locator('.nav button[data-tab="courses"]').click();
   assert.match(await page.locator('body').innerText(),/CEFR/);
   const scroll=await page.evaluate(()=>({
     doc:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth
   }));
   assert.ok(scroll.doc<=scroll.viewport+1,'desktop horizontal overflow: '+JSON.stringify(scroll));
   assert.deepEqual(pageErrors,[]);
   await page.screenshot({path:new URL('desktop-courses-dark.png',captureDir).pathname,fullPage:true});
 } finally {await browser.close();}
});
