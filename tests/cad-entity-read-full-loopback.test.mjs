import test from "node:test";
import assert from "node:assert/strict";
import {handleCadEntityReadSiteTool} from "../sites-migration/cad/site-entity-read.mjs";
const session_id="22222222-2222-4222-8222-222222222222";
const request_id="44444444-4444-4444-8444-444444444444";
const job_id="33333333-3333-4333-8333-333333333333";
const owner={signedIn:true,verifiedUserEmail:"owner@example.test"};
const secrets={ownerEmail:"owner@example.test",siteMcpToken:"a".repeat(64),entityReadEnabled:true};
const url="http://127.0.0.1:8000/";
let postCount=0;
const fetcher=async(external,init)=>{
 assert.equal(new URL(external).pathname,"/functions/v1/lizhi-cad-site-mcp");
 assert.equal(init.redirect,"manual");
 assert.equal(init.headers.Authorization,"Bearer "+secrets.siteMcpToken);
 postCount++;
 return fetch(url,init);
};
const call=async(name,args)=>handleCadEntityReadSiteTool(name,args,owner,secrets,fetcher);
const read=async(response)=>{
 assert.equal(response.isError,false,JSON.stringify(response));
 assert.equal(response.content.length,1);
 return JSON.parse(response.content[0].text);
};
test("owner/secret gate rejects without any upstream HTTP",async()=>{
 const before=postCount;
 const x=await handleCadEntityReadSiteTool("cad_list_entities",{session_id,request_id},
  {signedIn:true,verifiedUserEmail:"attacker@example.test"},secrets,fetcher);
 assert.equal(x.isError,true);
 const noSecret=await handleCadEntityReadSiteTool("cad_list_entities",{session_id,request_id},
  owner,{...secrets,siteMcpToken:""},fetcher);
 assert.equal(noSecret.isError,true);
 const off=await handleCadEntityReadSiteTool("cad_inspect_drawing",{session_id,request_id},
  owner,{...secrets,entityReadEnabled:false},fetcher);
 assert.equal(off.isError,true);
 assert.equal(postCount,before);
});
test("real Site adapter -> Deno Edge HTTP -> fake PostgREST returns geometry with no private extras",async()=>{
 const enq=await read(await call("cad_list_entities",{session_id,request_id,limit:8,offset:0,type:"Line"}));
 assert.equal(enq.queued,true);assert.equal(enq.completed,false);assert.equal(enq.job_id,job_id);
 const receipt=await read(await call("cad_read_job",{job_id}));
 assert.equal(receipt.ok,true);assert.equal(receipt.completed,true);
 assert.equal(receipt.kind,"lizhi.entities");
 assert.equal(receipt.data.revision,7);
 assert.equal(receipt.data.entities.length,1);
 const line=receipt.data.entities[0];
 assert.equal(line.handle,"1A");
 assert.equal(line.geometryAvailable,true);
 assert.equal(line.geometry.a.x,0);assert.equal(line.geometry.b.y,900);
 assert.equal(JSON.stringify(receipt).includes("PRIVATE"),false);
 assert.equal(JSON.stringify(receipt).includes("MUST_NOT_LEAK"),false);
 const inspect=await read(await call("cad_inspect_drawing",{session_id,request_id}));
 assert.equal(inspect.queued,true);
 const overview=await read(await call("cad_read_job",{job_id}));
 assert.equal(overview.kind,"lizhi.inspect");
 assert.equal(overview.data.revision,7);
 assert.deepEqual(overview.data.extents,[[0,0],[800,900]]);
 assert.equal(overview.data.entityCount,1);
 assert.equal(JSON.stringify(overview).includes("PRIVATE"),false);
 const probe=await (await fetch("http://127.0.0.1:54321/probe")).json();
 assert.deepEqual(probe.enqueued.map(x=>x.command),["lizhi.entities","lizhi.inspect"]);
 assert.equal(probe.polls,2);
 assert.deepEqual(probe.credentialChecks,[true,true,true,true]);
 assert.equal(postCount,4,"each operation must send exactly one upstream POST");
});
