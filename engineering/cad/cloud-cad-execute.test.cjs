"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createCadcraftExecute}=require("./cloud-cad-execute.cjs");
const {prepareJob}=require("./cadcraft-export-job.cjs");
const job={operation:"modify",project_id:"p1",drawing_id:"draw1",expected_revision:2,idempotency_key:"f".repeat(64)};
const prepared={status:"prepared_not_executed",project_id:"p1",drawing_id:"draw1",drawing_revision:2,cloud_job_key:job.idempotency_key,source_identity:{design_id:"cab1",revision:9},job_key:"a".repeat(64)};
const source={drawing_id:"draw1",revision:2,dxf:Buffer.from("DXF SOURCE")};
const mockArtifacts={dxf:{bytes:Buffer.from("a")},png:{bytes:Buffer.from("b")}};
test("binds queue, drawing and editable source to CAD CLI, even when design revision differs",async()=>{
 let called=false;
 const execute=createCadcraftExecute({loadPreparedExport:async()=>prepared,runCli:async ({job:spec,sourceDxf})=>{
  called=true;assert.equal(spec.drawing_id,"draw1");assert.equal(spec.source_identity.revision,9);
  assert.equal(sourceDxf,source.dxf);
  return {job_key:prepared.job_key,artifacts:mockArtifacts};
 }});
 const result=await execute({job,source});
 assert.equal(called,true);assert.equal(result.job_key,prepared.job_key);
});
test("rejects cross-project, cross-drawing, stale and unbound prepared jobs",async()=>{
 let called=false;
 const make=(p)=>createCadcraftExecute({loadPreparedExport:async()=>p,runCli:async()=>{called=true;}});
 for(const changed of [
  {...prepared,project_id:"other"},
  {...prepared,drawing_id:"other"},
  {...prepared,drawing_revision:3},
  {...prepared,cloud_job_key:"0".repeat(64)},
  {...prepared,status:"completed"}]){
  await assert.rejects(make(changed)({job,source}),{code:"CAD_PREPARED_MISMATCH"});
 }
 assert.equal(called,false);
});
test("rejects foreign or stale source DXF before running CAD",async()=>{
 let called=false;
 const exec=createCadcraftExecute({loadPreparedExport:async()=>prepared,runCli:async()=>{called=true;}});
 for(const changed of [null,{...source,drawing_id:"other"},{...source,revision:1},{...source,dxf:null}]){
  await assert.rejects(exec({job,source:changed}),{code:"CAD_SOURCE_REQUIRED"});
 }
 assert.equal(called,false);
});
test("only create or modify operations can execute",async()=>{
 const exec=createCadcraftExecute({loadPreparedExport:async()=>prepared,runCli:async()=>({})});
 await assert.rejects(exec({job:{...job,operation:"shell"},source}),{code:"CAD_EXECUTE_DENIED"});
});
test("prepared export binds cloud job key separately from design revision",async()=>{
 const spec={schema_version:"cad-drawing-spec@1",units:"mm",view:"front",source_identity:{design_id:"cab1",revision:9},entities:[{type:"polyline",layer:"FURNITURE",closed:true,points:[[0,0],[800,0],[800,900],[0,900]]}]};
 const args={projectId:"p1",drawingId:"draw1",cloudJobKey:job.idempotency_key,drawingRevision:2};
 const compiled=prepareJob(spec,args);
 assert.equal(compiled.cloud_job_key,job.idempotency_key);
 assert.equal(compiled.drawing_revision,2);
 assert.notEqual(compiled.job_key,prepareJob(spec,{...args,drawingId:"draw2"}).job_key);
 const exec=createCadcraftExecute({loadPreparedExport:async()=>compiled,runCli:async()=>({job_key:compiled.job_key,artifacts:mockArtifacts})});
 assert.equal((await exec({job,source})).job_key,compiled.job_key);
 assert.throws(()=>prepareJob(spec,{...args,drawingId:null}),{code:"CAD_CLOUD_BINDING_INCOMPLETE"});
});
