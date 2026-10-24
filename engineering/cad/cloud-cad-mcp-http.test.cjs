"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),http=require("node:http");
const {createCadMcpHttpHandler}=require("./cloud-cad-mcp-http.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789";
const spec={schema_version:"cad-drawing-spec@1",units:"mm",view:"front",source_identity:{design_id:"cab",revision:1},entities:[{type:"polyline",layer:"FURNITURE",closed:true,points:[[0,0],[1,0],[1,1],[0,1]]}]};
async function harness(fn){
 const calls=[];
 const handler=createCadMcpHttpHandler({
  verifyBearer:async token=>token==="good"?{userId:owner}:null,
  allowedOrigins:["https://example.test"],
  service:{
   async submit(o,args){calls.push(["submit",o,args]);return {status:"queued",job_key:"f".repeat(64)};},
   async status(o,args){calls.push(["status",o,args]);return {status:"completed",output_revision:2};}
  }
 });
 const server=http.createServer(handler);
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const url="http://127.0.0.1:"+server.address().port+"/mcp";
 const rpc=(method,params,id=1)=>({jsonrpc:"2.0",id,method,params});
 const post=(message,opts={})=>fetch(url,{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer good",...opts.headers},body:typeof message==="string"?message:JSON.stringify(message)});
 try{await fn({rpc,post,url,calls});}finally{await new Promise(resolve=>server.close(resolve));}
}
test("MCP initialize and whitelisted tools/list",async()=>harness(async({rpc,post})=>{
 const init=await post(rpc("initialize",{protocolVersion:"2025-03-26"})),v=await init.json();
 assert.equal(init.status,200);assert.equal(v.result.protocolVersion,"2025-03-26");
 const tools=(await (await post(rpc("tools/list",{}))).json()).result.tools;
 assert.deepEqual(tools.map(x=>x.name),["cad_submit_drawing","cad_job_status"]);
 assert.equal(tools.some(x=>["execute","command_line","shell","delete_file"].includes(x.name)),false);
}));
test("MCP tool call propagates verified server subject, never claimed client identity",async()=>harness(async({rpc,post,calls})=>{
 const r=await post(rpc("tools/call",{name:"cad_submit_drawing",arguments:{ownerId:"attacker",projectId:"p1",drawingId:"d1",baseRevision:0,requestId:"r1",operation:"create",spec}}));
 const result=(await r.json()).result;
 assert.equal(result.isError,false);
 assert.equal(calls[0][1],owner);
 assert.equal(JSON.parse(result.content[0].text).status,"queued");
 const status=await post(rpc("tools/call",{name:"cad_job_status",arguments:{projectId:"p1",drawingId:"d1",jobKey:"f".repeat(64)}}));
 assert.equal((await status.json()).result.isError,false);
}));
test("no token, invalid token and unexpected origin fail before any service action",async()=>harness(async({rpc,post,calls,url})=>{
 let r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(rpc("tools/list",{}))});assert.equal(r.status,401);
 r=await post(rpc("tools/list",{}),{headers:{authorization:"Bearer evil"}});assert.equal(r.status,401);
 r=await post(rpc("tools/list",{}),{headers:{origin:"https://evil.example"}});assert.equal(r.status,403);
 assert.equal(calls.length,0);
}));
test("MCP rejects unknown tools and never returns internal exception messages",async()=>harness(async({rpc,post})=>{
 const r=await post(rpc("tools/call",{name:"cad_execute_shell",arguments:{command:"rm -rf /"}}));
 assert.equal((await r.json()).error.code,-32602);
}));
test("MCP rejects too-large requests",async()=>harness(async({post,rpc})=>{
 const r=await post(rpc("ping",{blob:"x".repeat(530000)}));
 assert.equal(r.status,413);
}));
