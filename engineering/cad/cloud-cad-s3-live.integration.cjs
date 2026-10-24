"use strict";
// STAGING ONLY: S3-compatible HTTP integration (ephemeral Moto emulator).
// No production credentials or paid buckets.
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const {S3Client,CreateBucketCommand,PutObjectCommand,HeadObjectCommand,GetObjectCommand}=require("@aws-sdk/client-s3");
const {createCadS3Store}=require("./cloud-cad-s3-store.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789";
const sdk={PutObjectCommand,HeadObjectCommand,GetObjectCommand};
const job={job_key:"f".repeat(64),project_id:"cloudp",drawing_id:"cloudD",source_identity:{design_id:"cad-design",revision:7},view:"front",exporter_version:"cadcraft-0.12.0"};
const dxf=Buffer.from("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n");
const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 10 0"/></svg>');
const sha=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
async function main(){
 assert.equal(process.env.CAD_TEST_S3_ENDPOINT,"http://127.0.0.1:9000","Refusing nonlocal S3 endpoint");
 const client=new S3Client({
  endpoint:process.env.CAD_TEST_S3_ENDPOINT,
  region:"us-east-1",
  forcePathStyle:true,
  credentials:{accessKeyId:"cad_ci_only",secretAccessKey:"cad_ci_only_password"}
 });
 const bucket="cad-ci-"+crypto.randomBytes(4).toString("hex");
 try{
  await client.send(new CreateBucketCommand({Bucket:bucket}));
  const store=createCadS3Store({client,sdk,bucket});
  const root={ownerId:owner,projectId:"cloudp",drawingId:"cloudD",job};
  const a=await store.put({...root,revision:1,format:"dxf",bytes:dxf});
  assert.equal(a.reused,false);assert.equal(a.sha256,sha(dxf));
  assert.equal((await store.put({...root,revision:1,format:"dxf",bytes:dxf})).reused,true);
  await assert.rejects(store.put({...root,revision:1,format:"dxf",bytes:Buffer.from("0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n0\nENDSEC\n0\nEOF\n")}),{code:"CAD_S3_IMMUTABLE_CONFLICT"});
  const loaded=await store.get({...root,revision:1,format:"dxf",expectedSha256:a.sha256});
  assert.ok(loaded.bytes.equals(dxf));
  const second=await store.put({...root,revision:2,format:"dxf",bytes:Buffer.from("0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n0\nENDSEC\n0\nEOF\n")});
  assert.notEqual(a.object_key,second.object_key);
  assert.equal((await store.get({...root,revision:2,format:"dxf",expectedSha256:second.sha256})).sha256,second.sha256);
  const preview=await store.put({...root,revision:2,format:"svg",bytes:svg});
  const readPreview=await store.get({...root,revision:2,format:"svg",expectedSha256:preview.sha256});
  assert.ok(readPreview.bytes.equals(svg));
  await assert.rejects(store.get({...root,revision:2,format:"dxf",expectedSha256:a.sha256}),{code:"CAD_S3_CHECKSUM_MISMATCH"});
  console.log("CAD_S3_HTTP_EMULATOR_IMMUTABLE_STORE_PASS",JSON.stringify({
   version1_sha256:a.sha256,version2_sha256:second.sha256,
   svg_sha256:preview.sha256,old_revision_preserved:true,
   conflicting_overwrite:"blocked",cross_revision_retrieval:"PASS"
  }));
 }finally{client.destroy();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
