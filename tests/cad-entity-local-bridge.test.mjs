import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createContext,runInContext} from "node:vm";
import {randomUUID} from "node:crypto";

// Runs the real embedded CAD host in an isolated fake same-origin iframe,
// with no Supabase, site, filesystem or native drawing mutation.
async function setup(allowMove=true){
  const code=await readFile(new URL("../cad/cad-host.js",import.meta.url),"utf8");
  const messages=[],handlers={};
  let confirmCalls=0;
  const status={textContent:"",dataset:{}};
  const frame={contentWindow:{postMessage(m,origin){
    messages.push({m,origin});
    queueMicrotask(()=>handlers.message({source:frame.contentWindow,origin,data:{
      type:"cadcraft:command-result",requestId:m.requestId,ok:true,
      result:{echo:m.command}
    }}));
  }},addEventListener(){}};
  const node={setAttribute(){},removeAttribute(){},textContent:""};
  const panel={
    querySelector(selector){
      if(selector==="#cad-frame")return frame;
      if(selector==="#cad-status")return status;
      return node;
    },
    addEventListener(type,handler){handlers[type]=handler;}
  };
  const context=createContext({
    window:{addEventListener(type,handler){handlers[type]=handler;}},
    location:{origin:"https://cad-test.example"},
    confirm:()=>++confirmCalls===1 ? true : allowMove,
    crypto:{randomUUID},
    setTimeout,clearTimeout,Promise,queueMicrotask,
  });
  runInContext(code,context);
  const api=context.window.LizhiCadHost;
  api.mount(panel);
  handlers.message({source:frame.contentWindow,origin:"https://cad-test.example",data:{type:"cadcraft:ready"}});
  const target={closest(selector){return selector==="[data-cad-action]"?{dataset:{cadAction:"ai-enable"}}:null;}};
  await handlers.click({target});
  assert.equal(api.commandStatus.enabled,true);
  return {api,messages};
}
test("bounded engine-native inspection commands reach only the active same-origin iframe",async()=>{
 const {api,messages}=await setup();
 const summary=await api.command("lizhi.inspect",{});
 const listed=await api.command("lizhi.entities",{limit:8,offset:0,type:"Line",selected:false});
 assert.equal(summary.echo,"lizhi.inspect");
 assert.equal(listed.echo,"lizhi.entities");
 assert.equal(messages.length,2);
 assert.ok(messages.every(({m,origin})=>m.type==="cadcraft:command"&&origin==="https://cad-test.example"));
});
test("inspection cannot request full drawing, paths, scripts, or unlimited geometry",async()=>{
 const {api,messages}=await setup();
 const bad=[
  ["lizhi.inspect",{entities:true}],
  ["lizhi.entities",{limit:1000}],
  ["lizhi.entities",{offset:10001}],
  ["lizhi.entities",{path:"C:\\private.dxf"}],
  ["lizhi.entities",{window:[[0,0],[800,900]]}],
  ["lizhi.entities",{type:23}],
  ["lizhi.entities",{selected:"true"}],
  ["erase",{handles:["A"]}],
  ["move",{delta:[100,0]}],
  ["execute",{command:"script"}]
 ];
 for(const [name,args] of bad)await assert.rejects(api.command(name,args),/不支援/);
 assert.equal(messages.length,0);
});

test("a single native move is version-bound and requires actual browser confirmation",async()=>{
 const params={handles:["1A"],delta:[100,0],expectedRevision:3,confirmed:true};
 const yes=await setup(true);
 const result=await yes.api.command("lizhi.move",params);
 assert.equal(result.echo,"lizhi.move");
 assert.equal(yes.messages.length,1);
 const no=await setup(false);
 await assert.rejects(no.api.command("lizhi.move",params),/取消/);
 assert.equal(no.messages.length,0);
 await assert.rejects(yes.api.command("lizhi.move",{...params,expectedRevision:null}),/不支援/);
 await assert.rejects(yes.api.command("lizhi.move",{...params,handles:["1A","1B"]}),/不支援/);
 await assert.rejects(yes.api.command("lizhi.move",{...params,delta:[0,0]}),/不支援/);
 await assert.rejects(yes.api.command("lizhi.move",{...params,confirmed:false}),/不支援/);
 assert.equal(yes.messages.length,1);
});
