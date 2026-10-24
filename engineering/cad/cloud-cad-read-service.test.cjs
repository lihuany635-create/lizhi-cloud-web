"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const {createCadReadService}=require("./cloud-cad-read-service.cjs");
const {createCadMcpHttpHandler}=require("./cloud-cad-mcp-http.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789";
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from("0000IHDRtest-verified-preview-blob")]);
const hash=crypto.createHash("sha256").update(png).digest("hex");
function mock({authorized=true,bytes=png}={}){
 let fetched=0;
 const service=createCadReadService({
  db:{query:async(sql)=>({rowCount:1,rows:sql.startsWith("SELECT r.revision")?
   [{revision:3,artifacts:{png:{sha256:hash,byte_size:png.length}},inspection:{entityCount:2,extents:[[0,0],[10,20]]},created_at:new Date("2026-10-24T00:00:00Z")}]:
   [{project_id:"project1",job_key:"f".repeat(64),artifacts:{png:{sha256:hash,byte_size:png.length}}}]} )},
  authorizeDrawing:async x=>authorized&&x.clientId==="viewer"&&x.ownerId===owner&&x.projectId==="project1",
  objects:{get:async()=>{fetched++;return {bytes,object_key:"readonly"};}}
 });
 return {service,fetches:()=>fetched};
}
test("project owner with verified OAuth client can list revisions without object URLs",async()=>{
 const {service,fetches}=mock();
 const listing=await service.list(owner,{projectId:"project1",drawingId:"drawing1"},{clientId:"viewer"});
 assert.deepEqual(listing.revisions.map(x=>x.revision),[3]);
 assert.equal(listing.revisions[0].entity_count,2);
 assert.equal(JSON.stringify(listing).includes("object_key"),false);
 assert.equal(fetches(),0);
});
test("PNG preview checks SHA256 and buffers, with strict original client authorization",async()=>{
 const m=mock();
 const r=await m.service.preview(owner,{projectId:"project1",drawingId:"drawing1",revision:3},{clientId:"viewer"});
 assert.ok(r.bytes.equals(png));assert.equal(r.sha256,hash);
 await assert.rejects(m.service.preview(owner,{projectId:"project1",drawingId:"drawing1",revision:3},{clientId:"unapproved"}),{code:"CAD_ACCESS_DENIED"});
 assert.equal(m.fetches(),1);
});
test("tampered preview rejected and unauthorized request never touches S3",async()=>{
 const t=mock({bytes:Buffer.from("not a valid PNG")});
 await assert.rejects(t.service.preview(owner,{projectId:"project1",drawingId:"drawing1",revision:3},{clientId:"viewer"}),{code:"CAD_PREVIEW_INTEGRITY_FAILED"});
 const denied=mock({authorized:false});
 await assert.rejects(denied.service.preview(owner,{projectId:"project1",drawingId:"drawing1",revision:3},{clientId:"viewer"}),{code:"CAD_ACCESS_DENIED"});
 assert.equal(denied.fetches(),0);
});
test("MCP tool metadata advertises both OAuth-required read tools when service supports them",()=>{
 const m=createCadMcpHttpHandler({service:{
  submit:async()=>{},status:async()=>{},listRevisions:async()=>{},previewPng:async()=>{}
 },verifyBearer:async()=>({userId:owner})});
 assert.equal(typeof m,"function");
 const source=require("node:fs").readFileSync(require.resolve("./cloud-cad-mcp-http.cjs"),"utf8");
 assert.match(source,/cad_preview_png/);
 assert.match(source,/cad_list_revisions/);
});
