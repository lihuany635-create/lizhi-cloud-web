import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const root=new URL('../../',import.meta.url);
const screenshots=new URL('../test-results/',import.meta.url);
let server,origin,db;
test.before(async()=>{
  db={cards:[{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',term:'rice',meaning_zh:'米飯',example_en:'I eat rice.'}],
      candidates:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',term:'hungry',meaning_zh:'飢餓的',example_en:'I am hungry.',status:'pending'}],
      errors:[{id:'fake-error-1',original_sentence:'He go yesterday.',corrected_sentence:'He went yesterday.',explanation:'Use past tense.'}],sessions:[]};
  server=createServer(async(req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');
    if(url.pathname==='/host-test'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width"></head>'+
      '<body><script>window.LIZHI_SUPABASE_URL=location.origin;window.LizhiAuth={client:{auth:{getSession:async()=>({data:{session:{access_token:"test-session"}}})}}};</script>'+
      '<iframe src="/english-academy/live/" title="英文學習教室" style="width:100%;height:calc(100dvh - 16px);border:0"></iframe></body></html>');
      return;
    }
    if(url.pathname.startsWith('/functions/v1/lizhi-english-academy/')){
      if(req.headers.authorization!=='Bearer test-session'){
        res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'AUTH_INVALID'}));return;
      }
      const action=url.pathname.split('/').pop();
      const json=(value,status=200)=>{
        res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));
      };
      let body={};
      if(req.method==='POST'){
        let txt='';for await(const chunk of req)txt+=chunk;
        try{body=JSON.parse(txt)}catch{}
      }
      if(action==='status')return json({ownerVerified:true});
      if(action==='cards')return json({items:db.cards});
      if(action==='candidates')return json({items:db.candidates.filter(x=>x.status==='pending')});
      if(action==='errors')return json({items:db.errors});
      if(action==='sessions')return json({items:db.sessions});
      if(action==='authorize-session'){
        const row={owner_id:'synthetic-owner',source_session_id:'chat-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          enabled:true,expires_at:'2099-12-31T00:00:00Z'};
        db.sessions.push(row);return json({status:'authorized',sourceSessionId:row.source_session_id});
      }
      if(action==='revoke-session'){
        const row=db.sessions.find(x=>x.source_session_id===body.sourceSessionId);
        if(!row)return json({code:'CHAT_SESSION_NOT_FOUND'},404);
        row.enabled=false;return json({status:'revoked',sourceSessionId:row.source_session_id});
      }
      if(action==='candidate'){
        const item={id:'fffffff0-ffff-4fff-8fff-ffffffffffff',term:body.term,meaning_zh:body.meaningZh,status:'pending'};
        db.candidates.push(item);return json({id:item.id,status:'pending'},201);
      }
      if(action==='accept'){
        if('userConfirmed' in body||'ownerId' in body)return json({code:'INVALID_APPROVAL'},400);
        const item=db.candidates.find(x=>x.id===body.candidateId);
        if(!item)return json({code:'CANDIDATE_NOT_PENDING'},409);
        item.status='accepted';db.cards.push({id:'fffffff1-ffff-4fff-8fff-ffffffffffff',term:item.term,meaning_zh:item.meaning_zh});
        return json({result:{status:'accepted'}});
      }
      if(action==='ignore'){
        const item=db.candidates.find(x=>x.id===body.candidateId);
        if(!item)return json({code:'CANDIDATE_NOT_PENDING'},409);
        item.status='ignored';return json({status:'ignored'});
      }
      return json({code:'UNKNOWN_ACTION'},404);
    }
    const p=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
    if(p.includes('..')||!/^\/[A-Za-z0-9/_\.\-]+$/.test(p)){res.writeHead(403);res.end();return;}
    try{
      const path=new URL('.'+p,root);
      const bytes=await readFile(path);
      const mime=p.endsWith('.mjs')?'text/javascript; charset=utf-8':p.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';
      res.writeHead(200,{'Content-Type':mime});res.end(bytes);
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin='http://127.0.0.1:'+server.address().port;
  await mkdir(screenshots,{recursive:true});
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});

test('authenticated host iframe fetches private cards with bearer and can review',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
   const page=await browser.newPage({viewport:{width:360,height:780}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',dialog=>dialog.accept());
   await page.goto(origin+'/host-test');
   const f=page.frameLocator('iframe[title="英文學習教室"]');
   await f.locator('.bottom-nav button[data-tab="cards"]').waitFor({timeout:10000});
   await f.locator('.bottom-nav button[data-tab="cards"]').click();
   assert.match(await f.locator('body').innerText(),/hungry/);
   assert.match(await f.locator('body').innerText(),/rice/);
   await f.locator('button[data-accept]').click();
   await f.locator('.bottom-nav button[data-tab="cards"]').click();
   assert.equal(await f.locator('button[data-accept]').count(),0);
   await f.locator('#live-term').fill('apple');
   await f.locator('#live-meaning').fill('蘋果');
   await f.locator('#live-add-card button[type="submit"]').click();
   await f.locator('text=apple').first().waitFor();
   assert.ok(db.candidates.some(x=>x.term==='apple'&&x.status==='pending'));
   assert.ok(!db.cards.some(x=>x.term==='apple'),'manual addition must stay pending');
   await f.locator('button[data-accept="fffffff0-ffff-4fff-8fff-ffffffffffff"]').click();
   await f.locator('text=apple').first().waitFor();
   assert.ok(db.cards.some(x=>x.term==='apple'));
   await f.locator('button[data-tab="errors"]').first().click();
   assert.match(await f.locator('body').innerText(),/He went yesterday/);
   await f.locator('button[data-tab="settings"]').first().click();
   await f.locator('button[data-authorize-session]').click();
   assert.match(await f.locator('body').innerText(),/chat-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/);
   await f.locator('button[data-revoke-session]').click();
   assert.equal(db.sessions[0].enabled,false);
   const overflow=await f.locator('html').evaluate(el=>({
     width:el.clientWidth,scroll:el.scrollWidth
   }));
   assert.ok(overflow.scroll<=overflow.width+1,JSON.stringify(overflow));
   assert.deepEqual(errors,[]);
   await page.screenshot({path:new URL('mobile-live-in-iframe.png',screenshots).pathname,fullPage:true});
 }finally{await browser.close();}
});
test('direct unauthenticated live page fails closed without showing mock cards',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
   const page=await browser.newPage({viewport:{width:1280,height:800}});
   await page.goto(origin+'/english-academy/live/');
   assert.match(await page.locator('body').innerText(),/請從已登入的立之雲端庫開啟此頁/);
   assert.equal(await page.locator('text=hungry').count(),0);
   assert.equal(await page.locator('#live-add-card').count(),0);
 }finally{await browser.close();}
});
