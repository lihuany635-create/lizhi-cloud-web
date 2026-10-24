"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const path=require("node:path"),fs=require("node:fs"),os=require("node:os");
const {spawn}=require("node:child_process");
const {validateScript,runPreparedExport}=require("./cadcraft-cli-runner.cjs");
const script="_-LAYER\n_M\nFURNITURE\n\n_PLINE\n0,0\n800,0\n800,900\n0,900\n_C\n";
const job={job_key:"f".repeat(64),status:"prepared_not_executed",script,expected_entities:1,project_id:"p1",source_identity:{design_id:"d1",revision:1}};
let fakePath;
const spawnImpl=(b,args,opts)=>spawn(process.execPath,[fakePath,...args],opts);
test.before(()=>{
 fakePath=path.join(os.tmpdir(),"lizhi-cad-test-"+process.pid+".cjs");
 fs.writeFileSync(fakePath,[
  "const fs=require('node:fs');const a=process.argv.slice(2);",
  "if(a[0]==='run'){",
  "if(!a.includes('--metric')&&!fs.existsSync(a[1]))process.exit(4);",
  "fs.writeFileSync(a[a.indexOf('--save')+1], '0\\nSECTION\\n2\\nENTITIES\\n0\\nENDSEC\\n0\\nEOF\\n');",
  "}else if(a[0]==='convert'){",
  "if(!fs.existsSync(a[1]))process.exit(5);",
  "if(a[2].endsWith('.svg'))fs.writeFileSync(a[2],'<svg><path d=\"M 0 0\"/></svg>');",
  "else fs.writeFileSync(a[2],Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1]));",
  "}else process.exit(9);"
 ].join("\n"));
});
test.after(()=>{if(fakePath)fs.rmSync(fakePath,{force:true});});
test("creates DXF SVG PNG through headless CLI workflow",async()=>{
 const r=await runPreparedExport({job,spawnImpl});
 assert.equal(r.entity_count,1);
 assert.deepEqual(Object.keys(r.artifacts),["dxf","svg","png"]);
 assert.equal(r.artifacts.png.byte_size,24);
 assert.match(r.verification,/NOT_GEOMETRY_ROUNDTRIP/);
});
test("loads previously saved DXF when applying a new edit",async()=>{
 const r=await runPreparedExport({job,sourceDxf:Buffer.from("0\nSECTION\n0\nEOF\n"),spawnImpl});
 assert.equal(r.artifacts.dxf.sha256.length,64);
});
test("rejects commands outside the fixed geometry allowlist",()=>{
 assert.throws(()=>validateScript("_OPEN\n/etc/passwd\n"),{code:"CAD_SCRIPT_DENIED"});
 assert.throws(()=>validateScript("_PLINE\n0,0\n5,0\n5,5\n_C\n_SHELL\n"),{code:"CAD_SCRIPT_DENIED"});
});
test("refuses inconsistent compiled geometry",async()=>{
 await assert.rejects(runPreparedExport({job:{...job,expected_entities:2},spawnImpl}),{code:"CAD_ENTITY_MISMATCH"});
});
test("does not report CLI failures as successful export",async()=>{
 const bad=(b,args,opts)=>spawn(process.execPath,["-e","process.exit(17)"],opts);
 await assert.rejects(runPreparedExport({job,spawnImpl:bad}),{code:"CAD_CLI_FAILED"});
});
