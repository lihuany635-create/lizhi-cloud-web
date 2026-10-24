"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createCadcraftExecute}=require("./cloud-cad-execute.cjs");
const job={operation:"modify",project_id:"p1",expected_revision:2};
const prepared={status:"prepared_not_executed",project_id:"p1",source_identity:{revision:2},job_key:"f".repeat(64)};
test("binds queued project, source revision and editable DXF to CLI",async()=>{
 let called=false;
 const execute=createCadcraftExecute({loadPreparedExport:async()=>prepared,runCli:async ({job,sourceDxf})=>{
  called=true;assert.equal(job.project_id,"p1");assert.ok(Buffer.isBuffer(sourceDxf));
  return {job_key:prepared.job_key,artifacts:{dxf:{bytes:Buffer.from("a")},png:{bytes:Buffer.from("b")}}};
 }});
 const result=await execute({job,source:{dxf:Buffer.from("file")}});
 assert.equal(called,true);assert.equal(result.job_key,prepared.job_key);
});
test("refuses source revision or project confusion before CLI",async()=>{
 let called=false;
 const make=(x)=>createCadcraftExecute({loadPreparedExport:async()=>x,runCli:async()=>{called=true;}});
 await assert.rejects(make({...prepared,project_id:"other"})({job,source:{dxf:Buffer.from("x")}}),{code:"CAD_PREPARED_MISMATCH"});
 await assert.rejects(make({...prepared,source_identity:{revision:3}})({job,source:{dxf:Buffer.from("x")}}),{code:"CAD_PREPARED_MISMATCH"});
 assert.equal(called,false);
});
test("rejects missing source and arbitrary command type",async()=>{
 const execute=createCadcraftExecute({loadPreparedExport:async()=>prepared,runCli:async()=>({})});
 await assert.rejects(execute({job,source:null}),{code:"CAD_SOURCE_REQUIRED"});
 await assert.rejects(execute({job:{...job,operation:"shell"},source:{dxf:Buffer.from("x")}}),{code:"CAD_EXECUTE_DENIED"});
});
