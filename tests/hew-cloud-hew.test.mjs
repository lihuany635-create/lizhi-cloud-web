import test from "node:test";
import assert from "node:assert/strict";
import {writeFile,readFile,appendFile} from "node:fs/promises";
import {runJob,workLoop} from "../hew/cloud-hew/worker.mjs";
import {handleWorkerRequest,revisionPath} from "../supabase/functions/lizhi-model-cloud-worker/worker-edge-core.mjs";
import {validateModelSiteTool} from "../hew/sites/model-site-contract.mjs";
import {handleModelEdgeRequest} from "../supabase/functions/lizhi-model-site-mcp/edge-core.mjs";

const owner="11111111-1111-4111-8111-111111111111";
const doc="44444444-4444-4444-8444-444444444444";
const jobId="66666666-6666-4666-8666-666666666666";
const req="55555555-5555-4555-8555-555555555555";
const token="c".repeat(64);

// Fake hew-cli: `run --out` creates a file, a mutating dispatch appends to it.
function fakeHew(reply,{mutate=false,code=0}={}){
 const calls=[];
 return {calls,hew:async args=>{
  calls.push(args);
  if(args[0]==="run"){await writeFile(args[3],"HEW-EMPTY");return {code:0,stdout:"",stderr:""}}
  if(mutate)await appendFile(args[4],"+edit");
  return {code,stdout:JSON.stringify(reply)+"\n",stderr:""};
 }};
}
function fakeNet(){
 const puts=[];const apiCalls=[];
 let n=0;
 const api=async body=>{
  apiCalls.push(body);
  if(body.op==="upload_url")return {ok:true,path:body.kind==="revision"?revisionPath(owner,doc,4):`${owner}/${jobId}/f${++n}.${body.ext}`,upload_url:`https://up.example/${n}`};
  return {ok:true};
 };
 const http=async(url,init)=>{
  if(init.method==="GET")return new Response(new Uint8Array([1,2,3]));
  puts.push({url,type:init.headers["Content-Type"],bytes:init.body.length});
  return new Response(null,{status:200});
 };
 return {api,http,puts,apiCalls};
}
const job=(extra={})=>({job_id:jobId,document_id:doc,revision:3,method:"hew.solid.push_pull",params:{distance:0.1},
 download_url:"https://dl.example/r3",...extra});

test("worker: mutating call uploads the next revision and finishes with its path",async()=>{
 const h=fakeHew({jsonrpc:"2.0",id:"dispatch",result:{object_id:"obj_9"}},{mutate:true});
 const net=fakeNet();
 const out=await runJob(job(),{api:net.api,hew:h.hew,http:net.http,workdir:"/tmp"});
 assert.deepEqual(out,{success:true,mutated:true,new_path:revisionPath(owner,doc,4),result:{object_id:"obj_9"}});
 assert.equal(h.calls[0][0],"dispatch");assert.equal(h.calls[0][1],"hew.solid.push_pull");
 assert.equal(net.puts[0].type,"application/zip");
});

test("worker: read-only snapshot keeps the revision and stores the PNG privately",async()=>{
 const png=Buffer.from("\x89PNG-bytes").toString("base64");
 const h=fakeHew({jsonrpc:"2.0",id:"dispatch",result:{png_base64:png,width:256,height:256}});
 const net=fakeNet();
 const out=await runJob(job({method:"hew.view.snapshot",params:{width:256}}),{api:net.api,hew:h.hew,http:net.http,workdir:"/tmp"});
 assert.equal(out.success,true);assert.equal(out.mutated,false);assert.equal(out.new_path,null);
 assert.equal(out.result.png_base64,undefined);
 assert.deepEqual(out.result.artifacts.png_base64,{bucket:"lizhi-model-files",path:`${owner}/${jobId}/f1.png`,mime:"image/png",bytes:11});
});

test("worker: export bytes get the format's file type",async()=>{
 const h=fakeHew({jsonrpc:"2.0",id:"dispatch",result:{format:"glb",bytes_base64:Buffer.from("glTF").toString("base64")}});
 const net=fakeNet();
 const out=await runJob(job({method:"hew.doc.export",params:{format:"glb"}}),{api:net.api,hew:h.hew,http:net.http,workdir:"/tmp"});
 assert.equal(out.result.artifacts.bytes_base64.mime,"model/gltf-binary");
 assert.match(out.result.artifacts.bytes_base64.path,/\.glb$/);
});

test("worker: first job on a new document creates it, kernel refusal is reported",async()=>{
 const h=fakeHew({jsonrpc:"2.0",id:"dispatch",error:{code:-32602,message:"bad region"}},{code:1});
 const net=fakeNet();
 const out=await runJob(job({download_url:null}),{api:net.api,hew:h.hew,http:net.http,workdir:"/tmp"});
 assert.equal(h.calls[0][0],"run");
 assert.deepEqual(out,{success:false,mutated:false,error:"HEW_KERNEL_REFUSED",result:{error:{code:-32602,message:"bad region"}}});
 assert.equal(net.puts.length,0);
});

test("worker loop drains the queue and acks each job",async()=>{
 const h=fakeHew({jsonrpc:"2.0",id:"dispatch",result:{tree:[]}});
 const queue=[job({method:"hew.query.scene",params:{}}),null];
 const finished=[];
 const api=async b=>b.op==="claim"?{ok:true,job:queue.shift()}:(b.op==="finish"?(finished.push(b),{ok:true}):{ok:false});
 const n=await workLoop({api,hew:h.hew,http:fakeNet().http,runId:"t",budgetMs:60000,log:()=>{}});
 assert.equal(n,1);assert.equal(finished[0].success,true);assert.equal(finished[0].mutated,false);
});

function workerDb(jobState="claimed"){
 const calls=[];
 const rows={
  lizhi_model_cloud_hew_claim:{job_id:jobId,owner_uid:owner,document_id:doc,revision:3,current_path:revisionPath(owner,doc,3),method:"hew.query.scene",params:{},confirmed:false},
  lizhi_model_cloud_hew_job:{job_id:jobId,document_id:doc,state:jobState},
  lizhi_model_cloud_hew_list:[{document_id:doc,revision:3}],
  lizhi_model_cloud_hew_finish:{ok:true,revision:4},
 };
 const signed=[];
 return {calls,signed,db:{rpc:async(name,args)=>{calls.push({name,args});return {data:rows[name],error:null}},
  storage:{from:()=>({
   createSignedUrl:async p=>{signed.push(["get",p]);return {data:{signedUrl:"https://get/"+p},error:null}},
   createSignedUploadUrl:async p=>{signed.push(["put",p]);return {data:{signedUrl:"https://put/"+p},error:null}},
  })}}};
}
const wreq=(body,tok=token)=>new Request("https://w/",{method:"POST",headers:{Authorization:"Bearer "+tok},body:JSON.stringify(body)});

test("worker endpoint: token required, claim signs the current revision download",async()=>{
 const w=workerDb();
 assert.equal((await handleWorkerRequest(wreq({op:"claim"},"d".repeat(64)),{token,ownerUid:owner,db:w.db})).status,401);
 const r=await (await handleWorkerRequest(wreq({op:"claim",run_id:"run-1"}),{token,ownerUid:owner,db:w.db})).json();
 assert.equal(r.job.job_id,jobId);assert.equal(r.job.download_url,"https://get/"+revisionPath(owner,doc,3));
 assert.deepEqual(w.calls[0],{name:"lizhi_model_cloud_hew_claim",args:{p_worker:"run-1"}});
});

test("worker endpoint: paths are derived server side; unclaimed jobs refused",async()=>{
 const w=workerDb();
 const rev=await (await handleWorkerRequest(wreq({op:"upload_url",job_id:jobId,kind:"revision",path:"evil/x"}),
  {token,ownerUid:owner,db:w.db})).json();
 assert.equal(rev.path,revisionPath(owner,doc,4));
 const art=await (await handleWorkerRequest(wreq({op:"upload_url",job_id:jobId,kind:"artifact",ext:"png"}),
  {token,ownerUid:owner,db:w.db,uuid:()=>"77777777-7777-4777-8777-777777777777"})).json();
 assert.equal(art.path,`${owner}/${jobId}/77777777-7777-4777-8777-777777777777.png`);
 const bad=await handleWorkerRequest(wreq({op:"upload_url",job_id:jobId,kind:"artifact",ext:"../x"}),{token,ownerUid:owner,db:w.db});
 assert.equal(bad.status,400);
 const done=workerDb("succeeded");
 assert.equal((await handleWorkerRequest(wreq({op:"finish",job_id:jobId,success:true,mutated:false}),
  {token,ownerUid:owner,db:done.db})).status,409);
});

test("Site cloud tools: validation and Edge enqueue starts the worker",async()=>{
 assert.equal(validateModelSiteTool("model_cloud_call",{document_id:doc,revision:0,request_id:req,method:"hew.doc.save"}).code,
  "MODEL_CLOUD_WORKER_OWNS_DOCUMENT_LIFECYCLE");
 assert.equal(validateModelSiteTool("model_cloud_call",{document_id:doc,revision:-1,request_id:req,method:"hew.query.scene"}).ok,false);
 const calls=[];let started=0;
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data:jobId,error:null}}};
 const res=await (await handleModelEdgeRequest(new Request("https://e/",{method:"POST",headers:{Authorization:"Bearer "+"a".repeat(64)},
  body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"model_cloud_call",
   arguments:{document_id:doc,revision:2,request_id:req,method:"hew.solid.follow_me",params:{profile:"r1"}}}})}),
  {token:"a".repeat(64),ownerUid:owner,db,dispatchWorker:async()=>{started++;return true}})).json();
 const v=JSON.parse(res.result.content[0].text);
 assert.equal(v.job_id,jobId);assert.equal(v.worker,"started");assert.equal(started,1);
 assert.deepEqual(calls[0],{name:"lizhi_model_cloud_hew_enqueue",args:{p_owner:owner,p_request:req,p_document:doc,
  p_revision:2,p_method:"hew.solid.follow_me",p_params:{profile:"r1"},p_confirmed:false}});
});
