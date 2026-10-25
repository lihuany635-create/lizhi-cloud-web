import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../finance/remote/finance-browser-ui-agent.js", import.meta.url), "utf8");

function mount({authenticated=true,confirm=false}={}) {
  let clicked=0, deleted=0, agreed=confirm, banner;
  const controls = [];
  const base = (tag,label,name,action) => ({
    tagName:tag,textContent:label,name,dataset:{financeAction:action},
    disabled:false,isConnected:true,readOnly:false,
    getAttribute:()=>null,getClientRects:()=>[{}],
    closest:()=>null,
    contains:()=>false,
    dispatchEvent:()=>{},
    click() {if(action==="delete-transaction")deleted++;else clicked++;}
  });
  const add=base("BUTTON","新增支出","", "new-expense");
  const remove=base("BUTTON","刪除交易","", "delete-transaction");
  const input=base("INPUT","","description","");
  input.type="text";input.value="";
  const secret=base("INPUT","","password","");
  secret.type="password";
  controls.push(add,remove,input,secret);
  const workspace={querySelectorAll:()=>controls,contains:n=>controls.includes(n)};
  const events=new Map();
  const document={
    body:{append(v){banner=v;v.isConnected=true;}},
    createElement(tag){return {
      tagName:tag.toUpperCase(),style:{},hidden:false,textContent:"",
      isConnected:false,attrs:{},listeners:{},
      setAttribute(k,v){this.attrs[k]=v},
      getAttribute(k){return this.attrs[k]??null},
      addEventListener(k,cb){this.listeners[k]=cb}
    }},
    querySelector:selector=>selector==="[data-finance-root]"?workspace:null,
    addEventListener(k,cb){events.set(k,cb)}
  };
  const ctx={
    document,Math,Date,setTimeout:()=>42,clearTimeout:()=>{},
    MutationObserver:class { observe(){} },
    Event:class {constructor(name,opts){this.name=name;this.bubbles=opts.bubbles}},
    CustomEvent:class {constructor(name,opts){this.name=name;this.detail=opts.detail}},
    dispatchEvent:()=>{},
    getComputedStyle:()=>({visibility:"visible",display:"block"}),
    LizhiAuth:{user:authenticated?{id:"owner"}:null,client:{}},
    crypto:{randomUUID:()=>"inspection-1"},
    confirm:()=>agreed,
    addEventListener:()=>{}
  };
  ctx.globalThis=ctx;
  vm.runInNewContext(source,ctx,{filename:"finance-browser-ui-agent.js"});
  const driver=ctx.LizhiFinanceUIAgent;
  driver.install();
  return {driver,banner:()=>banner,add,remove,input,secret,counters:()=>({clicked,deleted}),setConfirm:v=>{agreed=v}};
}
test("FIN-UI-01 session defaults off and requires a trusted gesture",()=>{
  const p=mount();
  assert.equal(p.driver.inspect().ok,false);
  p.banner().listeners.click({isTrusted:false});
  assert.equal(p.driver.state.enabled,false);
  p.banner().listeners.click({isTrusted:true});
  assert.equal(p.driver.state.enabled,true);
  assert.equal(p.banner().textContent,"停止理財 AI 操作");
});
test("FIN-UI-02 login is mandatory",()=>{
  const p=mount({authenticated:false});
  p.banner().listeners.click({isTrusted:true});
  assert.equal(p.driver.state.enabled,false);
});
test("FIN-UI-03 only UI controls, no password values or direct ledger I/O",()=>{
  const p=mount();
  p.banner().listeners.click({isTrusted:true});
  const result=p.driver.inspect();
  assert.equal(result.controls.length,3);
  assert.equal(result.controls.some(c=>c.label.toLowerCase().includes("password")),false);
  assert.ok(result.revision);
  assert.doesNotMatch(JSON.stringify(result),/IndexedDB|access_token|credential|SQL|<html/i);
});
test("FIN-UI-04 dispatches existing UI events and invalidates old inspection",()=>{
  const p=mount();
  p.banner().listeners.click({isTrusted:true});
  const a=p.driver.inspect();
  const ok=p.driver.interact({action:"click",revision:a.revision,ref:"u0"});
  assert.equal(ok.ok,true);
  assert.equal(ok.completed,false);
  assert.equal(p.counters().clicked,1);
  assert.equal(p.driver.interact({action:"click",revision:a.revision,ref:"u0"}).code,"STALE_UI_INSPECTION");
});
test("FIN-UI-05 delete is denied without native human confirmation",()=>{
  const p=mount();
  p.banner().listeners.click({isTrusted:true});
  const a=p.driver.inspect();
  assert.equal(p.driver.interact({action:"click",revision:a.revision,ref:"u1"}).code,"EXPLICIT_CONFIRMATION_REQUIRED");
  assert.equal(p.driver.interact({action:"click",revision:a.revision,ref:"u1",confirm:true}).code,"USER_REJECTED");
  assert.equal(p.counters().deleted,0);
  p.setConfirm(true);
  assert.equal(p.driver.interact({action:"click",revision:a.revision,ref:"u1",confirm:true}).ok,true);
  assert.equal(p.counters().deleted,1);
});
test("FIN-UI-06 disable revokes the session and clears references",()=>{
  const p=mount();
  p.banner().listeners.click({isTrusted:true});
  const state=p.driver.inspect();
  p.driver.stop();
  assert.equal(p.driver.interact({action:"click",revision:state.revision,ref:"u0"}).ok,false);
  assert.equal(p.driver.state.enabled,false);
});
test("FIN-UI-07 untrusted arbitrary scripts cannot be used as commands",()=>{
  const p=mount();
  p.banner().listeners.click({isTrusted:true});
  const state=p.driver.inspect();
  const out=p.driver.interact({action:"eval",value:"alert(1)",ref:"u0",revision:state.revision});
  assert.equal(out.code,"UNSUPPORTED_ACTION");
  assert.equal(p.counters().clicked,0);
});
