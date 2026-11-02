import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MODEL_SITE_TOOLS,validateModelSiteTool,hewApiReference,HEW_METHODS,checkHewCall}
  from "../hew/sites/model-site-contract.mjs";
import {handleModelEdgeRequest} from "../supabase/functions/lizhi-model-site-mcp/edge-core.mjs";
import {handleModelSiteTool} from "../sites-migration/hew/site-tools.mjs";

const owner="11111111-1111-4111-8111-111111111111";
const session="33333333-3333-4333-8333-333333333333";
const document="44444444-4444-4444-8444-444444444444";
const request_id="55555555-5555-4555-8555-555555555555";
const jobId="66666666-6666-4666-8666-666666666666";
const fileId="77777777-7777-4777-8777-777777777777";
const bearer="a".repeat(64);
const call=(method,params,extra={})=>({session_id:session,request_id,method,...(params?{params}:{}),...extra});

test("registry covers the whole Hew API and every tool schema is closed",()=>{
 assert.ok(HEW_METHODS.size>=100);
 for(const m of ["hew.solid.follow_me","hew.sketch.offset","hew.solid.slice","hew.component.place",
   "hew.scenes.add","hew.material.paint","hew.view.snapshot","hew.doc.export","hew.doc.save"])
  assert.ok(HEW_METHODS.has(m),m);
 for(const tool of MODEL_SITE_TOOLS)assert.equal(tool.inputSchema.additionalProperties,false);
});

test("Edge bundle ships the same contract and registry as hew/sites",()=>{
 for(const f of ["model-site-contract.mjs","hew-api-registry.json"])
  assert.equal(readFileSync(`supabase/functions/lizhi-model-site-mcp/${f}`,"utf8"),
   readFileSync(`hew/sites/${f}`,"utf8"),f);
});

test("model_call accepts any registry method and builds a call job",()=>{
 const v=validateModelSiteTool("model_call",call("hew.solid.push_pull",{face:{object:"obj_1",at:[0,0,1]},distance:0.1}));
 assert.deepEqual(v,{ok:true,kind:"write",args:{session_id:session,request_id},command:"call",
  params:{method:"hew.solid.push_pull",params:{face:{object:"obj_1",at:[0,0,1]},distance:0.1}},readOnly:false});
 assert.equal(validateModelSiteTool("model_call",call("hew.query.scene")).readOnly,true);
 assert.deepEqual(validateModelSiteTool("model_call",call("hew.doc.save",{format:"hew"})).params,
  {method:"hew.doc.save",params:{format:"hew",return_bytes:true}});
});

test("model_call guards: unknown, host-owned, destructive, paths, solitary nesting, size",()=>{
 const code=args=>validateModelSiteTool("model_call",args).code;
 assert.equal(code(call("hew.nope.thing",{})),"MODEL_UNKNOWN_HEW_METHOD");
 assert.equal(code(call("hew.doc.attach",{})),"MODEL_METHOD_RESERVED_FOR_HOST");
 assert.equal(code(call("hew.entity.delete",{ids:["obj_1"]})),"MODEL_DESTRUCTIVE_CALL_REQUIRES_USER_CONFIRMATION");
 assert.equal(validateModelSiteTool("model_call",call("hew.entity.delete",{ids:["obj_1"]},{confirm_destructive:true})).params.confirmed,true);
 assert.equal(code(call("hew.doc.export",{format:"glb",path:"/tmp/a.glb"})),"MODEL_BROWSER_HAS_NO_FILESYSTEM_PATH");
 assert.equal(code(call("hew.doc.transact",{commands:[{method:"hew.view.snapshot",params:{}}]})),"MODEL_SOLITARY_METHOD_IN_TRANSACTION");
 assert.equal(code(call("hew.doc.transact",{commands:[{method:"hew.entity.delete",params:{}}]})),"MODEL_DESTRUCTIVE_CALL_REQUIRES_USER_CONFIRMATION");
 assert.equal(code(call("hew.query.scene",{},{confirm_destructive:false})),"INVALID_ARGUMENTS");
 assert.equal(code({...call("hew.query.scene"),extra:1}),"INVALID_ARGUMENTS");
 assert.equal(code(call("hew.doc.transact",{commands:Array.from({length:201},()=>({method:"hew.sketch.draw_line",params:{}}))})),"MODEL_INVALID_TRANSACTION");
 assert.equal(checkHewCall("hew.doc.save",{return_bytes:false}).code,"MODEL_BROWSER_SAVE_RETURNS_BYTES");
});

test("model_api_reference: index, namespace and full method schema",()=>{
 const index=hewApiReference({});
 assert.ok(index.namespaces.solid.includes("follow_me"));
 const ns=hewApiReference({namespace:"solid"});
 assert.ok(ns.methods.every(m=>m.method.startsWith("hew.solid.")));
 const m=hewApiReference({method:"hew.entity.delete"});
 assert.equal(m.method.destructive,true);assert.ok(m.method.params);
 assert.equal(hewApiReference({method:"hew.meta.hello"}).method.allowed,false);
 assert.equal(hewApiReference({namespace:"zzz"}).ok,false);
 assert.equal(validateModelSiteTool("model_api_reference",{method:"rm -rf"}).ok,false);
});

function edge(jobRow){
 const calls=[];
 const storage={from:bucket=>({
  createSignedUrl:async(path,secs)=>({data:{signedUrl:`https://signed.example/${bucket}/${path}?t=${secs}`},error:null}),
  download:async()=>({data:new Blob([new Uint8Array([137,80,78,71,1,2,3])]),error:null}),
 })};
 const data={
  lizhi_model_site_sessions:[{session_id:session,document_id:document}],
  lizhi_model_site_scene:{document_id:document,revision:"v1",entities:[]},
  lizhi_model_site_enqueue:jobId,
  lizhi_model_site_job:jobRow,
 };
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data:data[name],error:null};},storage};
 const send=body=>handleModelEdgeRequest(new Request("https://e.test/",{method:"POST",
  headers:{Authorization:"Bearer "+bearer},body:JSON.stringify({jsonrpc:"2.0",id:3,method:"tools/call",params:body})}),
  {token:bearer,ownerUid:owner,db}).then(r=>r.json());
 return {calls,send};
}

test("Edge serves model_api_reference with no database access",async()=>{
 const e=edge(null);
 const r=await e.send({name:"model_api_reference",arguments:{namespace:"scenes"}});
 assert.equal(r.result.isError,false);
 assert.ok(JSON.parse(r.result.content[0].text).methods.length>3);
 assert.equal(e.calls.length,0);
});

test("Edge queues model_call as a `call` job at the published revision",async()=>{
 const e=edge(null);
 const r=await e.send({name:"model_call",arguments:call("hew.sketch.offset",{region:"r1",distance:0.02})});
 assert.equal(JSON.parse(r.result.content[0].text).job_id,jobId);
 const q=e.calls.find(c=>c.name==="lizhi_model_site_enqueue");
 assert.equal(q.args.p_command,"call");assert.equal(q.args.p_revision,"v1");
 assert.deepEqual(q.args.p_params,{method:"hew.sketch.offset",params:{region:"r1",distance:0.02}});
});

test("Edge job status: result, signed private links, inline snapshot, foreign paths refused",async()=>{
 const mine=`${owner}/${jobId}/${fileId}.png`;
 const e=edge({job_id:jobId,state:"succeeded",command:"call",method:"hew.view.snapshot",mutated:false,error:null,
  result:{width:256,artifacts:{
   png_base64:{bucket:"lizhi-model-files",path:mine,mime:"image/png",bytes:7},
   depth_png_base64:{bucket:"lizhi-model-files",path:`22222222-2222-4222-8222-222222222222/${jobId}/${fileId}.png`,mime:"image/png",bytes:7},
   normals_png_base64:{dropped:"NO_PRIVATE_STORAGE"}}}});
 const r=await e.send({name:"model_job_status",arguments:{job_id:jobId}});
 const v=JSON.parse(r.result.content[0].text);
 assert.equal(v.job.method,"hew.view.snapshot");assert.equal(v.job.result.width,256);
 assert.match(v.job.result.artifacts.png_base64.url,/^https:\/\/signed\.example\/lizhi-model-files\//);
 assert.deepEqual(v.job.result.artifacts.depth_png_base64,{unavailable:true});
 assert.deepEqual(v.job.result.artifacts.normals_png_base64,{dropped:"NO_PRIVATE_STORAGE"});
 assert.equal(r.result.content[1].type,"image");assert.equal(r.result.content[1].mimeType,"image/png");
 assert.equal(Buffer.from(r.result.content[1].data,"base64")[0],137);
});

test("Site adapter forwards job result and the inline image, nothing else",async()=>{
 const auth={signedIn:true,verifiedUserEmail:"o@example.test"};
 const secrets={ownerEmail:"o@example.test",siteMcpToken:"b".repeat(64)};
 const reply=content=>async(_u,init)=>{
  const id=JSON.parse(init.body).id;
  return Response.json({jsonrpc:"2.0",id,result:{isError:false,content}});
 };
 const text={type:"text",text:JSON.stringify({ok:true,job:{job_id:jobId,state:"succeeded",method:"hew.view.snapshot",mutated:false,error:null,result:{width:1}}})};
 const img={type:"image",mimeType:"image/png",data:"iVBORw0KGgo="};
 const ok=await handleModelSiteTool("model_job_status",{job_id:jobId},auth,secrets,reply([text,img]));
 assert.equal(ok.isError,false);assert.equal(ok.content[1].type,"image");
 assert.deepEqual(JSON.parse(ok.content[0].text).result,{width:1});
 const bad=await handleModelSiteTool("model_job_status",{job_id:jobId},auth,secrets,
  reply([text,{type:"image",mimeType:"text/html",data:"PGh0bWw+"}]));
 assert.equal(bad.isError,true);
});
