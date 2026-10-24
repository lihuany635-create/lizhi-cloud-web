import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {createRequire} from "node:module";
import {createCadcraftRunner} from "./cadcraft-runner.mjs";
import {createCadJobStore} from "./cad-job-store.mjs";

const require=createRequire(import.meta.url),cliPath=process.env.CADCRAFT_CLI_PATH;
const template=require("../modules/woodworking/templates/open-box-cabinet-v1.1.js");
const DrawingSpec=require("./cad-drawing-spec.js");
const {prepareJob}=require("./cadcraft-export-job.cjs");

test("real CADCraft MCP plus CLI exports versioned furniture DXF SVG and PNG",{skip:!cliPath},async()=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),"lizhi-cad-e2e-"));
  try{
    const derived=template.derive({width:800,height:900,depth:400,panel_thickness:18,shelf_count:2});
    const design={id:"design-e2e",project_id:"project-e2e",template_id:template.id,template_version:template.version,revision:7,derived_snapshot:derived};
    const spec=DrawingSpec.createFromDesign(design,{view:"front"}),job=prepareJob(spec,{projectId:design.project_id}),runner=createCadcraftRunner({cliPath}),store=createCadJobStore({rootDir:path.join(temp,"store")}),working=await store.createTemporary(job.job_key),execution=await runner.execute(job,{outputDir:working}),record=await store.commit({job,execution,tempDir:working});
    assert.equal(spec.entities.length,6);assert.equal(record.cadcraft.cli_info.entityCount,6);assert.equal(record.cadcraft.mcp_inspection_after.entityCount,6);
    assert.deepEqual(record.cadcraft.cli_info.extents,[[0,0],[800,900]]);
    for(const format of["dxf","svg","png"]){const artifact=await store.artifact(job.job_key,format),bytes=await readFile(artifact.file);assert.ok(bytes.length>0);assert.match(record.artifacts[format].sha256,/^[0-9a-f]{64}$/);}
    const history=await store.list(design.project_id,design.id);assert.equal(history.length,1);assert.equal(history[0].source_identity.revision,7);assert.equal(history[0].job_key,job.job_key);
  }finally{await rm(temp,{recursive:true,force:true});}
});
