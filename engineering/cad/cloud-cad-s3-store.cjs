"use strict";
// Staging S3-compatible immutable CAD artifacts. Server-only credentials.
// Objects are written before atomic PostgreSQL publish. Failed publishes may
// leave unreferenced objects, which a separate audited GC must eventually clean.
const {verifyAndRecord}=require("./cad-artifact-manifest.cjs");
class CadObjectStoreError extends Error{
 constructor(code,message){super(message);this.name="CadObjectStoreError";this.code=code;}
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID=/^[a-zA-Z0-9_-]{1,128}$/;
const HASH=/^[a-f0-9]{64}$/;
function createCadS3Store({client,sdk,bucket,prefix="cad-v1"}={}){
 if(!client||typeof client.send!=="function"||!sdk||
  ["PutObjectCommand","HeadObjectCommand","GetObjectCommand"].some(n=>typeof sdk[n]!=="function")||
  typeof bucket!=="string"||!/^[a-z0-9.-]{3,63}$/.test(bucket)||
  typeof prefix!=="string"||!ID.test(prefix))
  throw new CadObjectStoreError("CAD_S3_CONFIG_INVALID","S3 client, SDK, bucket and safe prefix required");
 const build=(ownerId,projectId,drawingId,revision,format)=>{
  if(typeof ownerId!=="string"||!UUID.test(ownerId)||!ID.test(projectId)||!ID.test(drawingId)||
    !Number.isSafeInteger(revision)||revision<1||revision>2147483647||!["dxf","svg","png"].includes(format))
   throw new CadObjectStoreError("CAD_S3_ID_INVALID","Invalid authorized artifact identity");
  return [prefix,ownerId,projectId,drawingId,String(revision),format].join("/");
 };
 const isAlreadyThere=e=>e?.$metadata?.httpStatusCode===412||e?.$metadata?.httpStatusCode===409||
  e?.name==="PreconditionFailed"||e?.name==="ConditionalRequestConflict";
 async function put({ownerId,projectId,drawingId,revision,format,bytes,job}={}){
  const key=build(ownerId,projectId,drawingId,revision,format);
  if(!job||job.project_id!==projectId)throw new CadObjectStoreError("CAD_S3_JOB_MISMATCH","Artifact project and job mismatch");
  const manifest=verifyAndRecord({job,format,bytes,revision});
  const basic={bucket,object_key:key,format,sha256:manifest.sha256,byte_size:manifest.byte_size,mime_type:manifest.mime_type};
  try{
   await client.send(new sdk.PutObjectCommand({
    Bucket:bucket,Key:key,Body:bytes,ContentType:manifest.mime_type,
    Metadata:{sha256:manifest.sha256},
    IfNoneMatch:"*"
   }));
   return Object.freeze({...basic,reused:false});
  }catch(e){
   if(!isAlreadyThere(e))throw e;
   const prev=await client.send(new sdk.HeadObjectCommand({Bucket:bucket,Key:key}));
   if(prev?.Metadata?.sha256!==manifest.sha256||Number(prev.ContentLength)!==bytes.length)
    throw new CadObjectStoreError("CAD_S3_IMMUTABLE_CONFLICT","Existing immutable revision content differs");
   return Object.freeze({...basic,reused:true});
  }
 }
 async function get({ownerId,projectId,drawingId,revision,format,expectedSha256}={}){
  const key=build(ownerId,projectId,drawingId,revision,format);
  if(typeof expectedSha256!=="string"||!HASH.test(expectedSha256))
   throw new CadObjectStoreError("CAD_S3_DIGEST_REQUIRED","Expected immutable artifact digest required");
  const result=await client.send(new sdk.GetObjectCommand({Bucket:bucket,Key:key}));
  if(!result?.Body||typeof result.Body.transformToByteArray!=="function")
   throw new CadObjectStoreError("CAD_S3_READ_INVALID","S3 response body unsupported");
  const length=Number(result.ContentLength);
  if(!Number.isSafeInteger(length)||length<1||length>100*1024*1024)
   throw new CadObjectStoreError("CAD_S3_SIZE_INVALID","Unexpected object size");
  const bytes=Buffer.from(await result.Body.transformToByteArray());
  const crypto=require("node:crypto");
  const actual=crypto.createHash("sha256").update(bytes).digest("hex");
  if(bytes.length!==length||actual!==expectedSha256||result.Metadata?.sha256!==actual)
   throw new CadObjectStoreError("CAD_S3_CHECKSUM_MISMATCH","Immutable artifact bytes changed");
  return Object.freeze({bytes,object_key:key,sha256:actual});
 }
 return Object.freeze({put,get});
}
module.exports=Object.freeze({createCadS3Store,CadObjectStoreError});
