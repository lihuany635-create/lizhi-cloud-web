"use strict";
// GitHub Actions staging E2E: real official Linux CADCraft binary, real HTTP MCP,
// real Node worker and revision CAS, ephemeral test-only stores and fake auth.
// This is NOT a production deployment or a real Supabase authorization test.
const assert=require("node:assert/strict");
const http=require("node:http");
const crypto=require("node:crypto");
const os=require("node:os"),path=require("node:path"),fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const {createCadMcpHttpHandler}=require("./cloud-cad-mcp-http.cjs");
const {createCadMcpService}=require("./cloud-cad-mcp-service.cjs");
const {createQueue,createMemoryStorage}=require("./cloud-cad-queue.cjs");
const {createWorker}=require("./cloud-cad-worker.cjs");
const {createCadcraftExecute}=require("./cloud-cad-execute.cjs");
const OWNER="aabbccdd-1234-4abc-8abc-abc123456789",PROJECT="proj1",DRAWING="draw1";
const sha256=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const queue=createQueue(createMemoryStorage()),intentData=new Map();
const versions=new Map([[DRAWING,{revision:0,dxf:null}]]);
const service=createCadMcpService({
 authorizeDrawing:async ({ownerId,projectId,drawingId})=>ownerId===OWNER&&projectId===PROJECT&&drawingId===DRAWING,
 queueForOwner:()=>queue,
 intents:{
  async get({ownerId,key}){return intentData.get(ownerId+":"+key)??null;},
  async putIfAbsent({ownerId,key,value}){
   const index=ownerId+":"+key;if(intentData.has(index))return intentData.get(index);
   intentData.set(index,value);return value;
  }
 }
});
function info(bin,bytes){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"lizhi-cad-inspect-"));
 try{
  const file=path.join(dir,"check.dxf");fs.writeFileSync(file,bytes);
  const output=spawnSync(bin,["info",file],{encoding:"utf8",timeout:30000,maxBuffer:1024*1024});
  assert.equal(output.status,0,output.stderr);
  return JSON.parse(output.stdout);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
function spec(points){return{
 schema_version:"cad-drawing-spec@1",units:"mm",view:"front",
 source_identity:{design_id:"cloud-cabinet",revision:9},
 entities:[{type:"polyline",closed:true,layer:"FURNITURE",points}]
};}
async function main(){
 const bin=process.env.CADCRAFT_BIN;
 assert.ok(bin&&fs.existsSync(bin),"CADCRAFT_BIN must point to the verified official Linux binary");
 const execute=createCadcraftExecute({
  binPath:bin,
  loadPreparedExport:async(job)=>intentData.get(OWNER+":"+job.idempotency_key)
 });
 const worker=createWorker({queue,workerId:"linux_worker",ports:{
  async authorize(j){assert.equal(j.project_id,PROJECT);assert.equal(j.drawing_id,DRAWING);},
  async loadRevision(j){
   const current=versions.get(j.drawing_id);
   assert.equal(current.revision,j.expected_revision,"Expected drawing revision conflict");
   return current.revision?{drawing_id:j.drawing_id,revision:current.revision,dxf:current.dxf}:null;
  },
  execute,
  async inspect({job,output}){
   const result=info(bin,output.artifacts.dxf.bytes);
   assert.equal(result.entityCount,job.expected_revision===0?1:2);
   return {valid:true,entityCount:result.entityCount,extents:result.extents};
  },
  async storeImmutable({output}){return {sha256:output.artifacts.dxf.sha256,artifacts:output.artifacts};},
  async publishRevision({job,artifact,inspection}){
   const prev=versions.get(job.drawing_id);
   assert.equal(prev.revision,job.expected_revision,"Publisher must enforce expectedRevision");
   assert.equal(artifact.sha256,sha256(artifact.artifacts.dxf.bytes));
   const revision=prev.revision+1;
   versions.set(job.drawing_id,{revision,dxf:artifact.artifacts.dxf.bytes,artifacts:artifact.artifacts,inspection});
   return {revision};
  }
 }});
 const server=http.createServer(createCadMcpHttpHandler({
  verifyBearer:async token=>token==="TEST_ONLY"?{userId:OWNER}:null,
  service
 }));
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const url="http://127.0.0.1:"+server.address().port+"/mcp";
 let nextId=1;
 async function tool(name,args){
  const payload={jsonrpc:"2.0",id:nextId++,method:"tools/call",params:{name,arguments:args}};
  const res=await fetch(url,{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer TEST_ONLY"},body:JSON.stringify(payload)});
  assert.equal(res.status,200);
  const parsed=await res.json();
  assert.equal(parsed.result?.isError,false,JSON.stringify(parsed));
  return JSON.parse(parsed.result.content[0].text);
 }
 try{
  const common={projectId:PROJECT,drawingId:DRAWING};
  const first=await tool("cad_submit_drawing",{...common,baseRevision:0,requestId:"first",operation:"create",spec:spec([[0,0],[800,0],[800,900],[0,900]])});
  assert.equal((await tool("cad_job_status",{...common,jobKey:first.job_key})).status,"queued");
  const again=await tool("cad_submit_drawing",{...common,baseRevision:0,requestId:"first",operation:"create",spec:spec([[0,0],[800,0],[800,900],[0,900]])});
  assert.equal(again.job_key,first.job_key);
  const result1=await worker.run(first.job_key);
  assert.equal(result1.revision,1);
  assert.equal((await tool("cad_job_status",{...common,jobKey:first.job_key})).output_revision,1);
  const second=await tool("cad_submit_drawing",{...common,baseRevision:1,requestId:"second",operation:"modify",spec:spec([[900,900],[1000,900],[1000,1000],[900,1000]])});
  assert.equal((await worker.run(second.job_key)).revision,2);
  const status=await tool("cad_job_status",{...common,jobKey:second.job_key});
  assert.equal(status.output_revision,2);
  const last=versions.get(DRAWING);assert.equal(last.inspection.entityCount,2);
  assert.deepEqual(last.inspection.extents,[[0,0],[1000,1000]]);
  const dir=path.resolve("cad-evidence");fs.mkdirSync(dir,{recursive:true});
  for(const format of ["dxf","svg","png"])fs.writeFileSync(path.join(dir,"cloud-mcp-rev2."+format),last.artifacts[format].bytes);
  fs.writeFileSync(path.join(dir,"cloud-mcp-proof.json"),JSON.stringify({scenario:"MCP HTTP -> queue -> actual Linux CADCraft -> revision 1 -> revision 2 -> MCP status",auth:"TEST STUB ONLY",durability:"IN_MEMORY_ONLY",drawing:DRAWING,latest_revision:last.revision,entities:last.inspection.entityCount,extents:last.inspection.extents,sha256:last.artifacts.dxf.sha256},null,2));
  console.log("CLOUD_CAD_REAL_MCP_E2E_PASS",JSON.stringify({revision:last.revision,entities:last.inspection.entityCount,extents:last.inspection.extents}));
 }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
