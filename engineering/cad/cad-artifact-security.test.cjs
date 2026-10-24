"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {verifyAndRecord,digest}=require("./cad-artifact-manifest.cjs");
const job={job_key:"a".repeat(64),project_id:"p",source_identity:{design_id:"d",revision:1},view:"front",exporter_version:"0.12.0"};
const record=(format,bytes)=>verifyAndRecord({job,format,bytes,revision:1});
test("safe svg hashes bytes with download-only metadata",()=>{
 const b=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>');
 const v=record("svg",b);assert.equal(v.sha256,digest(b));assert.equal(v.preview_policy,"download_only");assert.equal(v.content_verification,"signature_only");
});
test("active SVG rejected",()=>{
 for(const payload of ['<script>alert(1)</script>','<path onload="evil()"/>','<image href="https://example.org/x"/>','<foreignObject></foreignObject>','<path style="fill:url(http://x)"/>']){
  assert.throws(()=>record("svg",Buffer.from("<svg>"+payload+"</svg>")),{code:"CAD_SVG_ACTIVE_CONTENT"});
 }
});
test("incomplete SVG document rejected",()=>assert.throws(()=>record("svg",Buffer.from("<svg><path />")),{code:"CAD_CONTENT_INVALID"}));
test("corrupt PNG rejected",()=>assert.throws(()=>record("png",Buffer.from("garbage")),{code:"CAD_CONTENT_INVALID"}));
test("DXF without structure rejected",()=>assert.throws(()=>record("dxf",Buffer.from("SECTION")),{code:"CAD_CONTENT_INVALID"}));
test("mismatched hash rejected",()=>assert.throws(()=>verifyAndRecord({job,format:"svg",bytes:Buffer.from("<svg></svg>"),revision:1,expectedSha256:"0".repeat(64)}),{code:"CAD_CHECKSUM_MISMATCH"}));
