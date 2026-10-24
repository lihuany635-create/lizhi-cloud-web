"use strict";
// Readiness host for reverse-proxy TLS deployments. This module intentionally
// binds only to loopback, never creates public ingress or runs a CAD worker.
const http=require("node:http");
const {createJwksVerifier}=require("./cloud-cad-jwks-auth.cjs");
const {createCadOauthAcl}=require("./cloud-cad-oauth-acl.cjs");
const {createCadReadService}=require("./cloud-cad-read-service.cjs");
const {createCadJobHistory}=require("./cloud-cad-job-history.cjs");
const {createCadMcpService}=require("./cloud-cad-mcp-service.cjs");
const {createCadMcpHttpHandler}=require("./cloud-cad-mcp-http.cjs");
const {createCadPostgresIntents}=require("./cloud-cad-postgres-intents.cjs");
const {createPostgresStorage}=require("./cloud-cad-postgres-storage.cjs");
const {createQueue}=require("./cloud-cad-queue.cjs");
class CadHostError extends Error{constructor(code,message){super(message);this.name="CadHostError";this.code=code;}}
function createCadMcpHost({db,resourceUrl,authorizationServer,jwksFetchImpl=fetch,allowedOrigins=[],objects=null}={}){
 if(!db||typeof db.query!=="function"||typeof resourceUrl!=="string"||typeof authorizationServer!=="string")
  throw new CadHostError("CAD_HOST_CONFIG_INVALID","DB and public MCP/OAuth URLs required");
 const verifier=createJwksVerifier({
  issuer:authorizationServer,
  jwksUrl:authorizationServer+"/.well-known/jwks.json",
  requireOAuthClient:true,fetchImpl:jwksFetchImpl
 });
 const acl=createCadOauthAcl({db});
 const primary=createCadMcpService({
  authorizeDrawing:acl.authorizeDrawing,
  intents:createCadPostgresIntents({db}),
  requireOAuthClient:true,
  queueForOwner:ownerId=>createQueue(createPostgresStorage({db,ownerId}))
 });
 const reads=objects?createCadReadService({db,objects,authorizeDrawing:acl.authorizeDrawing}):null;
 const history=createCadJobHistory({db,authorizeDrawing:acl.authorizeDrawing});
 const service=Object.freeze({...primary,listJobs:history.list,...(reads?{listRevisions:reads.list,previewPng:reads.preview}:{})});
 return createCadMcpHttpHandler({
  service,verifyBearer:verifier,allowedOrigins,resourceUrl,authorizationServer
 });
}
async function startCadMcpHost({db,resourceUrl,authorizationServer,jwksFetchImpl,allowedOrigins,objects=null,port}={}){
 if(!Number.isSafeInteger(port)||port<0||port>65535)
  throw new CadHostError("CAD_HOST_PORT_INVALID","An explicit TCP port is required");
 const handler=createCadMcpHost({db,resourceUrl,authorizationServer,jwksFetchImpl,allowedOrigins,objects});
 const server=http.createServer(handler);
 // Reverse proxy handles HTTPS, request throttling, connection limits,
 // canonical host, IP filtering, and OAuth consent. This host is loopback-only.
 await new Promise((resolve,reject)=>{
  server.once("error",reject);
  server.listen(port,"127.0.0.1",resolve);
 });
 return Object.freeze({address:server.address(),close:()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))});
}
module.exports=Object.freeze({CadHostError,createCadMcpHost,startCadMcpHost});
