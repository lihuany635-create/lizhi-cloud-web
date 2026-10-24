"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {verifyAndRecord,digest}=require("./cad-artifact-manifest.cjs");
const job={job_key:"a".repeat(64),project_id:"project1",source_identity:{design_id:"d1",revision:2},view:"front",exporter_version:"cadcraft-0.12.0"};
test("records verified SVG bytes with provenance and immutable metadata",()=>{
 const bytes=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
 const record=verifyAndRecord({job,format:"svg",bytes,revision:1,expectedSha256:digest(bytes)});
 assert.equal(record.sha256,digest(bytes));assert.equal(record.mime_type,"image/svg+xml");
 assert.equal(record.storage_status,"not_uploaded");assert.equal(Object.isFrozen(record),true);
});
test("blocks checksum mismatch and unsupported format",()=>{
 const bytes=Buffer.from('<svg></svg>');
 assert.throws(()=>verifyAndRecord({job,format:"svg",bytes,revision:1,expectedSha256:"0".repeat(64)}),{code:"CAD_CHECKSUM_MISMATCH"});
 assert.throws(()=>verifyAndRecord({job,format:"exe",bytes,revision:1}),{code:"CAD_FORMAT_INVALID"});
});
test("rejects corrupt PNG bytes and invalid revisions",()=>{
 assert.throws(()=>verifyAndRecord({job,format:"png",bytes:Buffer.from("garbage"),revision:1}),{code:"CAD_CONTENT_INVALID"});
 assert.throws(()=>verifyAndRecord({job,format:"svg",bytes:Buffer.from("<svg/>"),revision:0}),{code:"CAD_REVISION_INVALID"});
});
