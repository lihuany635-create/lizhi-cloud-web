import test from "node:test";
import assert from "node:assert/strict";
import {handleSiteCadMcpRequest as handle} from "../sites-migration/cad/site-mcp-route.mjs";

const owner={signedIn:true,verifiedUserEmail:"owner@example.test"};
const secrets={ownerEmail:"owner@example.test",siteMcpToken:"a".repeat(64)};
const sid="11111111-1111-4111-8111-111111111111";
const rid="22222222-2222-4222-8222-222222222222";
const jid="33333333-3333-4333-8333-333333333333";
const readNames=["cad_inspect_drawing","cad_list_entities","cad_read_job"];
const req=(method,params)=>new Request("https://private-site.invalid/mcp",{
 method:"POST",headers:{"Content-Type":"application/json"},
 body:JSON.stringify({jsonrpc:"2.0",id:"site-v4-test",method,...params===undefined?{}:{params}})
});
const json=async(r)=>r.json();
const body=(name,args)=>req("tools/call",{name,arguments:args});
test("default OFF exposes exactly six original tools, opt-in exposes exactly nine",async()=>{
 const normal=await json(await handle(req("tools/list"),owner,secrets));
 assert.equal(normal.result.tools.length,6);
 for(const name of readNames)assert.equal(normal.result.tools.some(t=>t.name===name),false);
 const enabled=await json(await handle(req("tools/list"),owner,{...secrets,entityReadEnabled:true}));
 assert.equal(enabled.result.tools.length,9);
 assert.deepEqual(enabled.result.tools.slice(6).map(t=>t.name),readNames);
});
test("disabled reads do not forward, and identity gate hides tools entirely",async()=>{
 let calls=0;
 const fetcher=async()=>{calls++;throw Error("should not forward")};
 const args={session_id:sid,request_id:rid};
 let r=await json(await handle(body("cad_inspect_drawing",args),owner,secrets,fetcher));
 assert.equal(r.result.isError,true);
 assert.equal(r.result.content[0].text,"CAD_READ_NOT_ENABLED");
 r=await json(await handle(body("cad_read_job",{job_id:jid}),owner,secrets,fetcher));
 assert.equal(r.result.isError,true);
 assert.equal(calls,0);
 assert.equal((await handle(req("tools/list"),{signedIn:true,verifiedUserEmail:"other@example.test"},
  {...secrets,entityReadEnabled:true},fetcher)).status,403);
 assert.equal(calls,0);
});
test("enabled read enqueues once using server-only authorization and returns bounded receipt",async()=>{
 let n=0;
 const fetcher=async(url,init)=>{
   n++;
   assert.equal(init.redirect,"manual");
   assert.equal(init.headers.Authorization,"Bearer "+secrets.siteMcpToken);
   const rpc=JSON.parse(init.body);
   const value=rpc.params.name==="cad_read_job"
    ? {ok:true,job_id:jid,kind:"lizhi.entities",state:"succeeded",
      data:{revision:3,entities:[{handle:"1A",type:"Line",layer:"0",
        geometry:{type:"line",a:{x:0,y:0,z:0},b:{x:800,y:900,z:0}}}]}}
    : {ok:true,job_id:jid,queued:true,completed:false};
   return Response.json({jsonrpc:"2.0",id:rpc.id,
     result:{isError:false,content:[{type:"text",text:JSON.stringify(value)}]}});
 };
 const opt={...secrets,entityReadEnabled:true};
 const enqueue=await json(await handle(body("cad_list_entities",
   {session_id:sid,request_id:rid,limit:8}),owner,opt,fetcher));
 assert.equal(enqueue.result.isError,false);
 assert.equal(JSON.parse(enqueue.result.content[0].text).queued,true);
 const got=await json(await handle(body("cad_read_job",{job_id:jid}),owner,opt,fetcher));
 assert.equal(got.result.isError,false);
 const data=JSON.parse(got.result.content[0].text);
 assert.equal(data.data.entities[0].geometry.b.y,900);
 assert.equal(data.data.revision,3);
 assert.equal(n,2,"each tool call sends exactly one upstream request");
});
test("new read tools cannot smuggle paths or write actions",async()=>{
 let count=0;const fetcher=async()=>{count++;throw Error("unexpected request")};
 const opt={...secrets,entityReadEnabled:true};
 for(const [name,args] of [
   ["cad_list_entities",{session_id:sid,request_id:rid,path:"/private/secret.dxf"}],
   ["cad_inspect_drawing",{session_id:sid,request_id:rid,rawDxf:true}],
   ["cad_read_job",{job_id:jid,write:true}],
   ["cad_move_entity",{session_id:sid,request_id:rid}]
 ]){
  const r=await json(await handle(body(name,args),owner,opt,fetcher));
  assert.equal(r.result.isError,true);
 }
 assert.equal(count,0);
});
