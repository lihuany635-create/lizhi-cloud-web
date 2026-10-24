"use strict";
// Single-owner STAGING-only CADCraft worker entrypoint. No network listener,
// public write route or embedded secrets. Never auto-deploy to production.
const fs=require("node:fs");
const crypto=require("node:crypto");
const path=require("node:path");
const {createCadWorkerHost}=require("./cloud-cad-worker-host.cjs");
const {createCadOauthAcl}=require("./cloud-cad-oauth-acl.cjs");
const {createCadS3Store}=require("./cloud-cad-s3-store.cjs");
class CadDaemonError extends Error{constructor(code,message){super(message);this.name="CadDaemonError";this.code=code;}}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function parseWorkerConfig(env={}){
 const required=["CAD_STAGING_DATABASE_URL","CAD_STAGING_S3_ENDPOINT","CAD_STAGING_S3_BUCKET","CAD_STAGING_S3_REGION",
  "CAD_STAGING_S3_ACCESS_KEY_ID","CAD_STAGING_S3_SECRET_ACCESS_KEY","CAD_WORKER_OWNER_ID","CAD_WORKER_ID","CADCRAFT_BIN","CADCRAFT_BIN_SHA256"];
 if(env.CAD_DEPLOYMENT_MODE!=="staging"||env.CAD_WORKER_STAGING_CONFIRM!=="isolated-only")
  throw new CadDaemonError("CAD_STAGING_ONLY","Explicit isolated staging confirmation required");
 for(const name of required)if(typeof env[name]!=="string"||!env[name])
  throw new CadDaemonError("CAD_WORKER_CONFIG_MISSING","Required staged worker configuration missing");
 if(!UUID.test(env.CAD_WORKER_OWNER_ID)||!/^[A-Za-z0-9_-]{1,128}$/.test(env.CAD_WORKER_ID))
  throw new CadDaemonError("CAD_WORKER_ID_INVALID","Verified owner and worker identity required");
 if(!/^[a-f0-9]{64}$/.test(env.CADCRAFT_BIN_SHA256)||
    !path.isAbsolute(env.CADCRAFT_BIN)||!fs.existsSync(env.CADCRAFT_BIN))
  throw new CadDaemonError("CAD_CADCRAFT_BIN_INVALID","Absolute, present and hash-pinned CADCraft binary required");
 const actual=crypto.createHash("sha256").update(fs.readFileSync(env.CADCRAFT_BIN)).digest("hex");
 if(actual!==env.CADCRAFT_BIN_SHA256)
  throw new CadDaemonError("CAD_CADCRAFT_HASH_MISMATCH","Unexpected CADCraft executable fingerprint");
 let s3url;
 try{s3url=new URL(env.CAD_STAGING_S3_ENDPOINT);}catch{
  throw new CadDaemonError("CAD_S3_ENDPOINT_INVALID","Valid staging S3 endpoint required");
 }
 if(!(s3url.protocol==="https:"||(s3url.protocol==="http:"&&["127.0.0.1","localhost"].includes(s3url.hostname)))||
    s3url.username||s3url.password||s3url.search||s3url.hash)
  throw new CadDaemonError("CAD_S3_ENDPOINT_INVALID","Remote S3 must use HTTPS without embedded credentials");
 if(!/^[a-z0-9.-]{3,63}$/.test(env.CAD_STAGING_S3_BUCKET)||
    !/^[a-z0-9-]{2,32}$/.test(env.CAD_STAGING_S3_REGION))
  throw new CadDaemonError("CAD_S3_CONFIG_INVALID","Invalid staging S3 bucket or region");
 const dbUrl=env.CAD_STAGING_DATABASE_URL;
 if(!/^postgres(?:ql)?:\/\//.test(dbUrl)||
    dbUrl.includes("hrdzywkihfqggiwjgavi"))
  throw new CadDaemonError("CAD_STAGING_DB_INVALID","Refusing a known production or invalid DB endpoint");
 const pollMs=env.CAD_WORKER_POLL_MS===undefined?5000:Number(env.CAD_WORKER_POLL_MS);
 if(!Number.isSafeInteger(pollMs)||pollMs<250||pollMs>60000)
  throw new CadDaemonError("CAD_POLL_INVALID","Polling range is 250-60000 ms");
 return Object.freeze({
  ownerId:env.CAD_WORKER_OWNER_ID,workerId:env.CAD_WORKER_ID,
  binPath:env.CADCRAFT_BIN,dbUrl,s3endpoint:s3url.toString(),
  bucket:env.CAD_STAGING_S3_BUCKET,region:env.CAD_STAGING_S3_REGION,
  accessKeyId:env.CAD_STAGING_S3_ACCESS_KEY_ID,
  secretAccessKey:env.CAD_STAGING_S3_SECRET_ACCESS_KEY,
  pollMs
 });
}
async function createCadStagingDaemon({env=process.env,loadPg=()=>require("pg"),loadS3=()=>require("@aws-sdk/client-s3")}={}){
 const config=parseWorkerConfig(env);
 const {Pool}=loadPg(),sdk=loadS3();
 const db=new Pool({connectionString:config.dbUrl,max:5});
 const client=new sdk.S3Client({
  endpoint:config.s3endpoint,region:config.region,forcePathStyle:true,
  credentials:{accessKeyId:config.accessKeyId,secretAccessKey:config.secretAccessKey}
 });
 try{
  // Access to all server-only staging tables must already have been provisioned.
  await db.query("SELECT 1 FROM public.lizhi_cad_oauth_project_grants LIMIT 0");
  await db.query("SELECT 1 FROM public.lizhi_cad_cloud_jobs LIMIT 0");
  const objects=createCadS3Store({client,sdk,bucket:config.bucket});
  const acl=createCadOauthAcl({db});
  const worker=createCadWorkerHost({
   db,ownerId:config.ownerId,workerId:config.workerId,
   binPath:config.binPath,objects,authorizeDrawing:acl.authorizeDrawing
  });
  let running=false,closed=false;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  return Object.freeze({
   runOnce:()=>worker.runOnce(),
   async runUntilStopped({shouldStop=()=>false}={}){
    if(running)throw new CadDaemonError("CAD_DAEMON_BUSY","Worker daemon already running");
    running=true;
    try{
     while(!closed&&!shouldStop()){
      try{await worker.runOnce();}
      catch(error){
       // Fenced failures are recorded in Postgres. Avoid printing drawings,
       // access tokens, SQL, object keys, or error stack traces.
       if(error?.code==="CAD_LEASE_LOST")continue;
      }
      if(!closed&&!shouldStop())await sleep(config.pollMs);
     }
    }finally{running=false;}
   },
   async close(){
    if(closed)return;closed=true;
    client.destroy();
    await db.end();
   }
  });
 }catch(error){client.destroy();await db.end();throw error;}
}
if(require.main===module){
 createCadStagingDaemon().then(async daemon=>{
  let stopping=false;
  process.on("SIGINT",()=>{stopping=true;});
  process.on("SIGTERM",()=>{stopping=true;});
  process.stdout.write("CAD_STAGING_WORKER_READY\n");
  try{await daemon.runUntilStopped({shouldStop:()=>stopping});}
  finally{await daemon.close();}
 }).catch(error=>{
  process.stderr.write("CAD_STAGING_WORKER_FAILED "+(error?.code||"UNKNOWN")+"\n");
  process.exitCode=1;
 });
}
module.exports=Object.freeze({CadDaemonError,parseWorkerConfig,createCadStagingDaemon});
