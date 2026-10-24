"use strict";
// Stateless Streamable-HTTP MCP adapter. TLS, OAuth/JWT verification,
// rate limiting and persistent DB stores MUST be supplied by the host.
const {createCadMcpService}=require("./cloud-cad-mcp-service.cjs");
const MAX_BODY=512*1024;
const OAUTH_SCHEME=Object.freeze([{type:"oauth2",scopes:["openid","email"]}]);
const TOOLS=Object.freeze([
 Object.freeze({name:"cad_submit_drawing",securitySchemes:OAUTH_SCHEME,description:"Create or modify a versioned CAD drawing in the remote cloud CADCraft queue. Does not directly execute commands.",inputSchema:{type:"object",additionalProperties:false,required:["projectId","drawingId","baseRevision","requestId","operation","spec"],properties:{
  projectId:{type:"string"},drawingId:{type:"string"},baseRevision:{type:"integer",minimum:0},requestId:{type:"string"},operation:{type:"string",enum:["create","modify"]},spec:{type:"object",description:"Validated cad-drawing-spec@1 closed-polyline drawing contract"}
 }}}),
 Object.freeze({name:"cad_job_status",securitySchemes:OAUTH_SCHEME,description:"Read only the status of a CAD job belonging to an authorized project and drawing.",inputSchema:{type:"object",additionalProperties:false,required:["projectId","drawingId","jobKey"],properties:{projectId:{type:"string"},drawingId:{type:"string"},jobKey:{type:"string",pattern:"^[0-9a-f]{64}$"}}}})
]);
const send=(res,status,payload,headers={})=>{
 const txt=payload===null?"":JSON.stringify(payload);
 res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","content-length":Buffer.byteLength(txt),...headers});res.end(txt);
};
function createCadMcpHttpHandler({verifyBearer,service,allowedOrigins=[],resourceUrl=null,authorizationServer=null}={}){
 if(typeof verifyBearer!=="function"||!service||typeof service.submit!=="function"||typeof service.status!=="function"||!Array.isArray(allowedOrigins))
  throw new TypeError("CAD MCP requires an authenticated token verifier, service and origin allowlist");
 if((resourceUrl===null)!==(authorizationServer===null)||
    (resourceUrl!==null&&(!/^https:\/\/[^\s]+\/mcp$/.test(resourceUrl)||!/^https:\/\/[^\s]+\/auth\/v1$/.test(authorizationServer))))
  throw new TypeError("OAuth discovery requires trusted HTTPS MCP resource and Supabase issuer URLs");
 const resourceMetadataUrl=resourceUrl?new URL("/.well-known/oauth-protected-resource",resourceUrl).toString():null;
 const authHeader=resourceMetadataUrl?`Bearer resource_metadata="${resourceMetadataUrl}"`:"Bearer";
 return async function handle(req,res){
  try{
   if(resourceMetadataUrl&&["/.well-known/oauth-protected-resource","/.well-known/oauth-protected-resource/mcp"].includes(req.url)){
    if(req.method!=="GET"){send(res,405,{error:"METHOD_NOT_ALLOWED"},{allow:"GET"});return;}
    send(res,200,{resource:resourceUrl,authorization_servers:[authorizationServer],scopes_supported:["openid","email"]});return;
   }
   if(req.url!=="/mcp"){send(res,404,{error:"NOT_FOUND"});return;}
   if(req.method!=="POST"){send(res,405,{error:"METHOD_NOT_ALLOWED"},{allow:"POST"});return;}
   const origin=req.headers.origin;
   if(origin&&!allowedOrigins.includes(origin)){send(res,403,{error:"ORIGIN_DENIED"});return;}
   if(!/^application\/json(?:;|$)/i.test(req.headers["content-type"]||"")){send(res,415,{error:"CONTENT_TYPE_INVALID"});return;}
   const auth=/^Bearer ([A-Za-z0-9._~+/-]+={0,2})$/i.exec(req.headers.authorization||"");
   if(!auth){send(res,401,{error:"UNAUTHORIZED"},{"www-authenticate":authHeader});return;}
   // verifyBearer must cryptographically verify expiry, signature, audience,
   // and issuer. The returned subject MUST NOT derive from client arguments.
   let subject;try{subject=await verifyBearer(auth[1]);}catch{send(res,401,{error:"UNAUTHORIZED"},{"www-authenticate":authHeader});return;}
   if(!subject||typeof subject.userId!=="string"){send(res,401,{error:"UNAUTHORIZED"},{"www-authenticate":authHeader});return;}
   let size=0,chunks=[];
   for await(const chunk of req){
    size+=chunk.length;
    if(size>MAX_BODY){send(res,413,{error:"CAD_BODY_TOO_LARGE"});return;}
    chunks.push(chunk);
   }
   let msg;try{msg=JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{send(res,400,{error:"INVALID_JSON"});return;}
   if(!msg||msg.jsonrpc!=="2.0"||typeof msg.method!=="string"||(msg.id!==undefined&&typeof msg.id!=="string"&&typeof msg.id!=="number")){
    send(res,400,{jsonrpc:"2.0",id:null,error:{code:-32600,message:"Invalid request"}});return;
   }
   if(msg.id===undefined){send(res,202,null);return;}
   const respond=(result)=>send(res,200,{jsonrpc:"2.0",id:msg.id,result});
   const fail=(code,message)=>send(res,200,{jsonrpc:"2.0",id:msg.id,error:{code,message}});
   if(msg.method==="initialize"){
    respond({protocolVersion:"2025-03-26",capabilities:{tools:{listChanged:false}},serverInfo:{name:"lizhi-cloud-cad",version:"0.1.0"}});return;
   }
   if(msg.method==="ping"){respond({});return;}
   if(msg.method==="tools/list"){respond({tools:TOOLS});return;}
   if(msg.method!=="tools/call"){fail(-32601,"Method not found");return;}
   const name=msg.params?.name,args=msg.params?.arguments;
   if(!args||typeof args!=="object"||Array.isArray(args)){fail(-32602,"Tool arguments must be an object");return;}
   try{
    const result=name==="cad_submit_drawing"?await service.submit(subject.userId,args,{clientId:subject.clientId??null})
      :name==="cad_job_status"?await service.status(subject.userId,args,{clientId:subject.clientId??null}):null;
    if(result===null){fail(-32602,"Unknown CAD tool");return;}
    respond({content:[{type:"text",text:JSON.stringify(result)}],isError:false});
   }catch(error){
    // Intentionally never expose internal DB/runner exception messages.
    const code=typeof error?.code==="string"&&/^CAD_[A-Z_]+$/.test(error.code)?error.code:"CAD_OPERATION_FAILED";
    respond({content:[{type:"text",text:JSON.stringify({ok:false,code})}],isError:true});
   }
  }catch{
   if(!res.headersSent)send(res,500,{error:"CAD_INTERNAL_ERROR"});
   else res.end();
  }
 };
}
module.exports=Object.freeze({createCadMcpHttpHandler,TOOLS});
