import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateCadFullTool,checkCadCall,cadReference,CAD_FULL_TOOLS} from "../supabase/functions/lizhi-cad-site-mcp/cad-full-contract.mjs";
import {handleCadFullTool} from "../supabase/functions/lizhi-cad-site-mcp/cad-full-core.mjs";
import {runJob,toolFor} from "../cad/cloud/worker.mjs";
import {handleWorkerRequest,revisionPath} from "../supabase/functions/lizhi-cad-cloud-worker/worker-edge-core.mjs";

const owner="11111111-1111-4111-8111-111111111111", session="33333333-3333-4333-8333-333333333333";
const doc="44444444-4444-4444-8444-444444444444", req="55555555-5555-4555-8555-555555555555";
const job="66666666-6666-4666-8666-666666666666", file="77777777-7777-4777-8777-777777777777";

test("contract copies stay identical and every tool schema is closed",()=>{
 assert.equal(readFileSync("cad/sites/cad-full-contract.mjs","utf8"),readFileSync("supabase/functions/lizhi-cad-site-mcp/cad-full-contract.mjs","utf8"));
 assert.equal(readFileSync("cad/sites/cad-command-registry.json","utf8"),readFileSync("supabase/functions/lizhi-cad-site-mcp/cad-command-registry.json","utf8"));
 for(const t of CAD_FULL_TOOLS)assert.equal(t.inputSchema.additionalProperties,false);
});

test("any registry command, command line and script are accepted",()=>{
 assert.equal(checkCadCall({op:"execute",command:"offset",params:{distance:2}}).ok,true);
 assert.equal(checkCadCall({op:"execute",command:"dimlinear",params:{}}).ok,true);
 assert.equal(checkCadCall({op:"cmdline",text:"line 0,0 @10,0 @0,5 c"}).ok,true);
 assert.equal(checkCadCall({op:"cmdline",text:"zoom e"}).ok,true);
 assert.equal(checkCadCall({op:"render",width:800,window:[[0,0],[10,10]]}).ok,true);
 const v=validateCadFullTool("cad_call",{session_id:session,request_id:req,op:"execute",command:"erase",params:{handles:["1A"]},confirm_destructive:true});
 assert.deepEqual(v.params,{op:"execute",command:"erase",params:{handles:["1A"]},confirmed:true});
 assert.equal(v.command,"lizhi.call");
});

test("blocked, destructive (also by alias), paths and unknown commands are refused",()=>{
 const code=c=>checkCadCall(c).code;
 assert.equal(code({op:"execute",command:"open"}),"CAD_COMMAND_NOT_ALLOWED_REMOTELY");
 assert.equal(code({op:"cmdline",text:"appload"}),"CAD_COMMAND_NOT_ALLOWED_REMOTELY");
 assert.equal(code({op:"execute",command:"erase",params:{}}),"CAD_DESTRUCTIVE_COMMAND_REQUIRES_CONFIRMATION");
 assert.equal(code({op:"cmdline",text:"e"}),"CAD_DESTRUCTIVE_COMMAND_REQUIRES_CONFIRMATION");
 assert.equal(code({op:"script",text:"line 0,0 1,1\n\npurge"}),"CAD_DESTRUCTIVE_COMMAND_REQUIRES_CONFIRMATION");
 assert.equal(code({op:"execute",command:"saveas",params:{path:"/x.dxf"}}),"CAD_BROWSER_HAS_NO_FILESYSTEM_PATH");
 assert.equal(code({op:"execute",command:"definitely_not_a_command"}),"CAD_UNKNOWN_COMMAND");
 assert.equal(code({op:"shell"}),"CAD_CALL_UNKNOWN_OP");
 assert.equal(code({op:"render",width:99999}),"CAD_CALL_INVALID");
});

test("reference search and per-command docs",()=>{
 const r=cadReference({filter:"dim"});assert.ok(r.count>5);
 assert.equal(cadReference({command:"erase"}).command.destructive,true);
 assert.equal(cadReference({command:"open"}).command.blocked,true);
});

function edgeDb(jobRow){
 const calls=[];
 return {calls,db:{rpc:async(name,args)=>{calls.push({name,args});
  return {data:{lizhi_cad_site_enqueue:job,lizhi_cad_cloud_enqueue:job,lizhi_cad_site_job:jobRow,lizhi_cad_cloud_job:jobRow}[name],error:null}},
  storage:{from:()=>({createSignedUrl:async p=>({data:{signedUrl:"https://signed/"+p},error:null}),
   download:async()=>({data:new Blob([new Uint8Array([137,80,78,71])]),error:null})})}}};
}

test("Edge: cad_call queues lizhi.call; job status shows links and the image",async()=>{
 const e=edgeDb({job_id:job,state:"succeeded",result:{mutated:false,artifacts:{png_base64:{bucket:"lizhi-cad-files",path:`${owner}/${job}/${file}.png`,mime:"image/png",bytes:4}}}});
 const q=await handleCadFullTool("cad_call",{session_id:session,request_id:req,op:"cmdline",text:"circle 0,0 5"},{db:e.db,owner});
 assert.equal(JSON.parse(q.content[0].text).job_id,job);
 assert.deepEqual(e.calls[0].args.p_params,{op:"cmdline",text:"circle 0,0 5"});
 const s=await handleCadFullTool("cad_job_status_v2",{job_id:job},{db:e.db,owner});
 assert.match(JSON.parse(s.content[0].text).job.result.artifacts.png_base64.url,/^https:\/\/signed\//);
 assert.equal(s.content[1].type,"image");
 assert.equal(await handleCadFullTool("cad_status",{},{db:e.db,owner}),null);
});

test("Edge: cloud call validates, queues and starts the worker",async()=>{
 const e=edgeDb(null);let started=0;
 const r=await handleCadFullTool("cad_cloud_call",{document_id:doc,revision:3,request_id:req,op:"execute",command:"offset",params:{distance:1}},
  {db:e.db,owner,dispatchWorker:async()=>{started++;return true}});
 assert.equal(JSON.parse(r.content[0].text).worker,"started");assert.equal(started,1);
 assert.deepEqual(e.calls[0].args.p_call,{op:"execute",command:"offset",params:{distance:1}});
});

test("worker maps ops to CADCraft MCP tools",()=>{
 assert.deepEqual(toolFor({op:"cmdline",text:"x"}),["command_line",{text:"x"}]);
 assert.deepEqual(toolFor({op:"render",width:100}),["render",{width:100}]);
 assert.equal(toolFor({op:"nope"}),null);
});

test("worker: a changed drawing is saved as the next revision; render becomes a private PNG",async()=>{
 let inspectN=0;const tools=[];
 const mcp={init:async()=>{},close(){},tool:async(name,args)=>{tools.push(name);
  if(name==="inspect_drawing")return {content:[{type:"text",text:JSON.stringify({n:inspectN++})}]};
  if(name==="save"){(await import("node:fs/promises")).writeFile(args.path,"DXF");return {content:[{type:"text",text:"{}"}]}}
  if(name==="render")return {content:[{type:"image",mimeType:"image/png",data:Buffer.from("PNG").toString("base64")}]};
  return {content:[{type:"text",text:"{\"ok\":1}"}]}}};
 const puts=[];
 const api=async b=>({ok:true,path:b.kind==="revision"?revisionPath(owner,doc,4):`${owner}/${job}/${file}.png`,upload_url:"https://up"});
 const http=async(u,i)=>i.method==="GET"?new Response("OLD"):(puts.push(i.headers["Content-Type"]),new Response(null,{status:200}));
 const w=await runJob({job_id:job,call:{op:"cmdline",text:"circle 0,0 5"},download_url:"https://dl"},{api,mcp,http,workdir:"/tmp"});
 assert.equal(w.mutated,true);assert.equal(w.new_path,revisionPath(owner,doc,4));assert.deepEqual(puts,["application/dxf"]);
 assert.deepEqual(tools,["open","inspect_drawing","command_line","inspect_drawing","save"]);
 const r=await runJob({job_id:job,call:{op:"render",width:200},download_url:"https://dl"},{api,mcp,http,workdir:"/tmp"});
 assert.equal(r.mutated,false);assert.equal(r.result.artifacts.png_base64.mime,"image/png");
});

test("CAD worker endpoint derives .dxf revision paths and needs its token",async()=>{
 const db={rpc:async n=>({data:{lizhi_cad_cloud_job:{job_id:job,document_id:doc,state:"claimed"},lizhi_cad_cloud_list:[{document_id:doc,revision:2}]}[n],error:null}),
  storage:{from:()=>({createSignedUploadUrl:async p=>({data:{signedUrl:"https://put/"+p},error:null})})}};
 const tok="e".repeat(64);
 const call=body=>handleWorkerRequest(new Request("https://w/",{method:"POST",headers:{Authorization:"Bearer "+tok},body:JSON.stringify(body)}),{token:tok,ownerUid:owner,db});
 assert.equal((await (await call({op:"upload_url",job_id:job,kind:"revision"})).json()).path,`${owner}/docs/${doc}/r3.dxf`);
 assert.equal((await handleWorkerRequest(new Request("https://w/",{method:"POST",headers:{Authorization:"Bearer "+"f".repeat(64)},body:"{}"}),{token:tok,ownerUid:owner,db})).status,401);
});
