"use strict";
// Optional local/staging entrypoint. DO NOT deploy it against production DB.
// A separately managed HTTPS reverse proxy and the Supabase OAuth authorization
// server/consent UI are REQUIRED. This process only submits/checks CAD jobs;
// CADCraft worker and durable object store are separate components.
const {startCadMcpHost}=require("./cloud-cad-mcp-host.cjs");
const {createCadS3Store}=require("./cloud-cad-s3-store.cjs");
class CadStartupError extends Error{constructor(code,message){super(message);this.name="CadStartupError";this.code=code;}}
function parseConfig(env){
 if(env.CAD_DEPLOYMENT_MODE!=="staging")
  throw new CadStartupError("CAD_STAGING_ONLY","Explicit staging mode required");
 const port=Number(env.CAD_MCP_LOOPBACK_PORT);
 if(!Number.isSafeInteger(port)||port<1||port>65535)
  throw new CadStartupError("CAD_PORT_INVALID","Configured loopback port is required");
 const resourceUrl=env.CAD_PUBLIC_RESOURCE_URL,authorizationServer=env.CAD_OAUTH_ISSUER;
 if(typeof resourceUrl!=="string"||!/^https:\/\/[^/\s]+\/mcp$/.test(resourceUrl)||
    typeof authorizationServer!=="string"||!/^https:\/\/[^/\s]+\/auth\/v1$/.test(authorizationServer))
  throw new CadStartupError("CAD_HTTPS_CONFIG_INVALID","HTTPS MCP resource and Supabase Auth issuer required");
 if(typeof env.CAD_STAGING_DATABASE_URL==="string"&&env.CAD_STAGING_DATABASE_URL.includes("hrdzywkihfqggiwjgavi"))
  throw new CadStartupError("CAD_PRODUCTION_DB_DENIED","Production project forbidden in staging");
 if(!env.CAD_STAGING_DATABASE_URL||typeof env.CAD_STAGING_DATABASE_URL!=="string")
  throw new CadStartupError("CAD_DB_URL_MISSING","Server-side staging database URL required");
 let allowedOrigins=[];
 if(env.CAD_ALLOWED_ORIGINS){
  allowedOrigins=env.CAD_ALLOWED_ORIGINS.split(",").map(s=>s.trim());
  if(allowedOrigins.some(s=>!/^https:\/\/[^/\s]+$/.test(s)))
   throw new CadStartupError("CAD_ORIGINS_INVALID","Trusted HTTPS origins only");
 }
 const readKeys=["CAD_READ_S3_ENDPOINT","CAD_READ_S3_BUCKET","CAD_READ_S3_REGION","CAD_READ_S3_ACCESS_KEY_ID","CAD_READ_S3_SECRET_ACCESS_KEY"];
 const supplied=readKeys.filter(k=>env[k]);
 if(supplied.length>0&&supplied.length!==readKeys.length)
  throw new CadStartupError("CAD_READ_S3_CONFIG_INVALID","Incomplete private read-only object-store settings");
 if(supplied.length){
  let u;try{u=new URL(env.CAD_READ_S3_ENDPOINT);}catch{throw new CadStartupError("CAD_READ_S3_CONFIG_INVALID","Invalid S3 URL");}
  if(!(u.protocol==="https:"||(u.protocol==="http:"&&["127.0.0.1","localhost"].includes(u.hostname)))||
     u.username||u.password||u.hash||u.search||!/^[a-z0-9.-]{3,63}$/.test(env.CAD_READ_S3_BUCKET))
   throw new CadStartupError("CAD_READ_S3_CONFIG_INVALID","Read-only S3 requires a trusted endpoint");
 }
 return Object.freeze({port,resourceUrl,authorizationServer,
  connectionString:env.CAD_STAGING_DATABASE_URL,allowedOrigins,
  readStore:supplied.length?{
   endpoint:env.CAD_READ_S3_ENDPOINT,bucket:env.CAD_READ_S3_BUCKET,region:env.CAD_READ_S3_REGION,
   accessKeyId:env.CAD_READ_S3_ACCESS_KEY_ID,secretAccessKey:env.CAD_READ_S3_SECRET_ACCESS_KEY
  }:null});
}
async function runStagingServer({env=process.env,loadPg=()=>require("pg"),loadS3=()=>require("@aws-sdk/client-s3")}={}){
 const settings=parseConfig(env);
 const {Pool}=loadPg();
 const db=new Pool({connectionString:settings.connectionString,max:5});
 let host,s3Client;
 try{
  let objects=null;
  if(settings.readStore){
   const sdk=loadS3(),opts=settings.readStore;
   s3Client=new sdk.S3Client({
    endpoint:opts.endpoint,region:opts.region,forcePathStyle:true,
    credentials:{accessKeyId:opts.accessKeyId,secretAccessKey:opts.secretAccessKey}
   });
   objects=createCadS3Store({client:s3Client,sdk,bucket:opts.bucket});
  }
  // Fail closed unless the DBA has provisioned a trustworthy grant table.
  await db.query("SELECT 1 FROM public.lizhi_cad_oauth_project_grants LIMIT 0");
  host=await startCadMcpHost({
   db,resourceUrl:settings.resourceUrl,authorizationServer:settings.authorizationServer,
   allowedOrigins:settings.allowedOrigins,objects,port:settings.port
  });
 }catch(error){s3Client?.destroy();await db.end();throw error;}
 let stopped=false;
 const close=async()=>{
  if(stopped)return;stopped=true;
  await host.close();s3Client?.destroy();await db.end();
 };
 return Object.freeze({port:host.address.port,close});
}
if(require.main===module){
 runStagingServer().then(app=>{
  // Never log credentials, bearer tokens, drawing content or user identity.
  process.stdout.write("CAD_MCP_STAGING_LOOPBACK_READY\n");
  const stop=()=>{app.close().then(()=>process.exit(0),()=>process.exit(1));};
  process.once("SIGTERM",stop);process.once("SIGINT",stop);
 }).catch(error=>{
  process.stderr.write("CAD_MCP_STAGING_START_FAILED "+(error.code||"UNKNOWN")+"\n");
  process.exitCode=1;
 });
}
module.exports=Object.freeze({parseConfig,runStagingServer,CadStartupError});
