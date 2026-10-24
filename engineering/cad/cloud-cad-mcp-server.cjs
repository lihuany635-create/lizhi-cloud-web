"use strict";
// Optional local/staging entrypoint. DO NOT deploy it against production DB.
// A separately managed HTTPS reverse proxy and the Supabase OAuth authorization
// server/consent UI are REQUIRED. This process only submits/checks CAD jobs;
// CADCraft worker and durable object store are separate components.
const {startCadMcpHost}=require("./cloud-cad-mcp-host.cjs");
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
 if(!env.CAD_STAGING_DATABASE_URL||typeof env.CAD_STAGING_DATABASE_URL!=="string")
  throw new CadStartupError("CAD_DB_URL_MISSING","Server-side staging database URL required");
 let allowedOrigins=[];
 if(env.CAD_ALLOWED_ORIGINS){
  allowedOrigins=env.CAD_ALLOWED_ORIGINS.split(",").map(s=>s.trim());
  if(allowedOrigins.some(s=>!/^https:\/\/[^/\s]+$/.test(s)))
   throw new CadStartupError("CAD_ORIGINS_INVALID","Trusted HTTPS origins only");
 }
 return Object.freeze({port,resourceUrl,authorizationServer,
  connectionString:env.CAD_STAGING_DATABASE_URL,allowedOrigins});
}
async function runStagingServer({env=process.env,loadPg=()=>require("pg")}={}){
 const settings=parseConfig(env);
 const {Pool}=loadPg();
 const db=new Pool({connectionString:settings.connectionString,max:5});
 let host;
 try{
  // Fail closed unless the DBA has provisioned a trustworthy grant table.
  await db.query("SELECT 1 FROM public.lizhi_cad_oauth_project_grants LIMIT 0");
  host=await startCadMcpHost({
   db,resourceUrl:settings.resourceUrl,authorizationServer:settings.authorizationServer,
   allowedOrigins:settings.allowedOrigins,port:settings.port
  });
 }catch(error){await db.end();throw error;}
 let stopped=false;
 const close=async()=>{
  if(stopped)return;stopped=true;
  await host.close();await db.end();
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
