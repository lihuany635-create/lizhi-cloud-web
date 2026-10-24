"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createCadS3Store}=require("./cloud-cad-s3-store.cjs");
const crypto=require("node:crypto");
class PutObjectCommand{constructor(input){this.input=input;}}
class GetObjectCommand{constructor(input){this.input=input;}}
class HeadObjectCommand{constructor(input){this.input=input;}}
const sdk={PutObjectCommand,GetObjectCommand,HeadObjectCommand};
const owner="aabbccdd-1234-4abc-8abc-abc123456789";
const job={job_key:"f".repeat(64),project_id:"proj1",drawing_id:"draw1",source_identity:{design_id:"cab",revision:1},view:"front",exporter_version:"cadcraft-0.12.0"};
const dxf=Buffer.from("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n");
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const input={ownerId:owner,projectId:"proj1",drawingId:"draw1",revision:1,format:"dxf",bytes:dxf,job};
function fakeS3(){
 const map=new Map(),sent=[];
 return {sent,map,async send(command){
  const x=command.input;sent.push({name:command.constructor.name,...x});
  const k=x.Bucket+"/"+x.Key;
  if(command instanceof PutObjectCommand){
   if(map.has(k))throw Object.assign(Error("already exists"),{$metadata:{httpStatusCode:412}});
   if(x.IfNoneMatch!=="*")throw Error("must not overwrite");
   map.set(k,{bytes:Buffer.from(x.Body),metadata:x.Metadata,type:x.ContentType});
   return {};
  }
  if(command instanceof HeadObjectCommand){
   if(!map.has(k))throw Error("missing");
   return {Metadata:map.get(k).metadata,ContentLength:map.get(k).bytes.length};
  }
  if(command instanceof GetObjectCommand){
   if(!map.has(k))throw Error("missing");
   const item=map.get(k);
   return {Metadata:item.metadata,ContentLength:item.bytes.length,Body:{transformToByteArray:async()=>new Uint8Array(item.bytes)}};
  }
  throw Error("Unknown S3 command");
 }};
}
test("real immutable key shape, conditional write, digest and read roundtrip",async()=>{
 const client=fakeS3(),store=createCadS3Store({client,sdk,bucket:"cad-staging"});
 const first=await store.put(input);
 assert.equal(first.reused,false);
 assert.match(first.object_key,/^cad-v1\/aabbccdd-1234-4abc-8abc-abc123456789\/proj1\/draw1\/1\/dxf$/);
 assert.equal(client.sent[0].IfNoneMatch,"*");
 assert.equal(client.sent[0].Metadata.sha256,sha(dxf));
 const read=await store.get({ownerId:owner,projectId:"proj1",drawingId:"draw1",revision:1,format:"dxf",expectedSha256:first.sha256});
 assert.equal(read.bytes.toString(),dxf.toString());
});
test("duplicate same bytes is safe, different bytes cannot replace revision",async()=>{
 const client=fakeS3(),store=createCadS3Store({client,sdk,bucket:"cad-staging"});
 const first=await store.put(input);
 const second=await store.put(input);
 assert.equal(second.reused,true);assert.equal(second.sha256,first.sha256);
 await assert.rejects(store.put({...input,bytes:Buffer.concat([dxf,Buffer.from("new")])}),{code:"CAD_S3_IMMUTABLE_CONFLICT"});
});
test("wrong owner, project and invalid format are rejected",async()=>{
 const store=createCadS3Store({client:fakeS3(),sdk,bucket:"cad-staging"});
 await assert.rejects(store.put({...input,ownerId:"../escape"}),{code:"CAD_S3_ID_INVALID"});
 await assert.rejects(store.put({...input,projectId:"other"}),{code:"CAD_S3_JOB_MISMATCH"});
 await assert.rejects(store.put({...input,format:"exe"}),{code:"CAD_S3_ID_INVALID"});
});
test("tampered S3 bytes are detected on read",async()=>{
 const client=fakeS3(),store=createCadS3Store({client,sdk,bucket:"cad-staging"});
 const saved=await store.put(input);
 client.map.get("cad-staging/"+saved.object_key).bytes=Buffer.from("different");
 await assert.rejects(store.get({ownerId:owner,projectId:"proj1",drawingId:"draw1",revision:1,format:"dxf",expectedSha256:saved.sha256}),{code:"CAD_S3_CHECKSUM_MISMATCH"});
});
