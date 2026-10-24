"use strict";
const fs=require("node:fs/promises");
const sysfs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const assert=require("node:assert/strict");
const {spawnSync}=require("node:child_process");
const {prepareJob}=require("./cadcraft-export-job.cjs");
const {runPreparedExport}=require("./cadcraft-cli-runner.cjs");
function spec(points){return {schema_version:"cad-drawing-spec@1",units:"mm",view:"front",source_identity:{design_id:"cloud-cabinet",revision:9},entities:[{type:"polyline",layer:"FURNITURE",closed:true,points}]};}
function inspect(bin,bytes){
 const dir=sysfs.mkdtempSync(path.join(os.tmpdir(),"cad-info-"));
 try{
  const file=path.join(dir,"drawing.dxf");sysfs.writeFileSync(file,bytes);
  const res=spawnSync(bin,["info",file],{encoding:"utf8",timeout:30000,maxBuffer:2*1024*1024});
  assert.equal(res.status,0,res.stderr);
  return JSON.parse(res.stdout);
 }finally{sysfs.rmSync(dir,{recursive:true,force:true});}
}
async function main(){
 const bin=process.env.CADCRAFT_BIN;
 assert.ok(bin&&sysfs.existsSync(bin),"Official Linux CADCraft binary is required");
 const first=prepareJob(spec([[0,0],[800,0],[800,900],[0,900]]),{projectId:"cloudp"});
 const a=await runPreparedExport({job:first,binPath:bin});
 const ia=inspect(bin,a.artifacts.dxf.bytes);
 assert.equal(ia.entityCount,1,JSON.stringify(ia));
 const second=prepareJob(spec([[900,900],[1000,900],[1000,1000],[900,1000]]),{projectId:"cloudp"});
 const b=await runPreparedExport({job:second,sourceDxf:a.artifacts.dxf.bytes,binPath:bin});
 const ib=inspect(bin,b.artifacts.dxf.bytes);
 assert.equal(ib.entityCount,2,JSON.stringify(ib));
 assert.deepEqual(ia.extents,[[0,0],[800,900]]);
 assert.deepEqual(ib.extents,[[0,0],[1000,1000]]);
 console.log("CAD_PREPARED_JOB_LINUX_PASS",JSON.stringify({rev1_count:ia.entityCount,rev2_count:ib.entityCount,rev2_extents:ib.extents}));
 const dest=path.resolve("cad-evidence");await fs.mkdir(dest,{recursive:true});
 await Promise.all([
  fs.writeFile(path.join(dest,"cad-prepared-rev1.dxf"),a.artifacts.dxf.bytes),
  fs.writeFile(path.join(dest,"cad-prepared-rev2.dxf"),b.artifacts.dxf.bytes),
  fs.writeFile(path.join(dest,"cad-prepared-rev2.svg"),b.artifacts.svg.bytes),
  fs.writeFile(path.join(dest,"cad-prepared-rev2.png"),b.artifacts.png.bytes),
  fs.writeFile(path.join(dest,"cad-prepared-check.json"),JSON.stringify({first:ia,second:ib},null,2))
 ]);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
