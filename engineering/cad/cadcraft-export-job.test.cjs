"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {prepareJob,verifyArtifact}=require("./cadcraft-export-job.cjs");
const base={schema_version:"cad-drawing-spec@1",units:"mm",view:"front",source_identity:{design_id:"cab",template_id:"open-box-cabinet",template_version:"1.1.0",revision:2},entities:[{type:"polyline",closed:true,layer:"FURNITURE",points:[[0,0],[800,0],[800,900],[0,900]]}]};
test("deterministic job key and closed polyline",()=>{
 const a=prepareJob(base,{projectId:"project_1"}),b=prepareJob(base,{projectId:"project_1"});
 assert.equal(a.job_key,b.job_key);
 assert.match(a.script,/_PLINE\n0,0\n800,0\n800,900\n0,900\n_C/);
 assert.equal(a.status,"prepared_not_executed");
 assert.notEqual(a.job_key,prepareJob({...base,source_identity:{...base.source_identity,revision:3}},{projectId:"project_1"}).job_key);
});
test("rejects unsafe geometry and project identifiers",()=>{
 assert.throws(()=>prepareJob(base,{projectId:"../escape"}),{code:"CAD_PROJECT_INVALID"});
 assert.throws(()=>prepareJob({...base,entities:[{...base.entities[0],points:[[0,0],[Infinity,0],[1,1]]}]},{projectId:"p"}),{code:"CAD_COORD_INVALID"});
});
test("artifact metadata checks checksum but does not imply content verification",()=>{
 const job=prepareJob(base,{projectId:"p"});
 const a=verifyArtifact(job,{format:"dxf",sha256:"a".repeat(64),byteSize:123});
 assert.equal(a.verified_content,false);
 assert.throws(()=>verifyArtifact(job,{format:"exe",sha256:"a".repeat(64),byteSize:123}),{code:"CAD_ARTIFACT_INVALID"});
});
