/**
 * Portable owner-scoped JSON-RPC handler for a PRIVATE ChatGPT Site's /mcp.
 *
 * Site runtime MUST register the /mcp route itself and supply trustedAuth from
 * its VERIFIED server-side identity middleware. This module cannot establish
 * a Site login, publish a website, or self-register tools.
 *
 * The production Site platform may provide a native MCP dispatcher; when it
 * does, bind modelSiteTools and handleCloudModelSiteTool directly there rather than
 * mounting a second competing protocol handler.
 */
import {cloudModelSiteTools,handleCloudModelSiteTool} from "./site-cloud-direct-tools.mjs";

const jsonHeaders={"Cache-Control":"no-store, private","Pragma":"no-cache",
  "X-Content-Type-Options":"nosniff"};
const respond=(payload,status=200)=>Response.json(payload,{status,headers:jsonHeaders});
const rpcError=(id,code,message,status=200)=>respond({jsonrpc:"2.0",id,
  error:{code,message}},status);
const isObject=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const MAX_REQUEST_BYTES=16*1024;
async function boundedRequestText(request){
  const length=request.headers.get("content-length");
  if(length!==null&&(!/^[0-9]+$/.test(length)||Number(length)>MAX_REQUEST_BYTES))
    throw Error("TOO_LARGE");
  if(!request.body)return "";
  const reader=request.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let count=0,text="";
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      if(!value)continue;
      count+=value.byteLength;
      if(count>MAX_REQUEST_BYTES)throw Error("TOO_LARGE");
      text+=decoder.decode(value,{stream:true});
    }
    return text+decoder.decode();
  }finally{try{await reader.cancel()}catch{}}
}
export async function handleSiteCloudModelMcpRequest(request,trustedAuth,secrets,fetcher=fetch){
  // Neither request headers nor tools/call arguments can provide identity.
  // Site middleware must populate trustedAuth from its platform session.
  if(trustedAuth?.signedIn!==true||typeof trustedAuth?.verifiedUserEmail!=="string")
    return respond({error:"OWNER_SIGN_IN_REQUIRED"},401);
  const expected=typeof secrets?.ownerEmail==="string"?secrets.ownerEmail.trim().toLowerCase():"";
  if(!expected)return respond({error:"SITE_OWNER_NOT_CONFIGURED"},503);
  if(trustedAuth.verifiedUserEmail.trim().toLowerCase()!==expected)
    return respond({error:"OWNER_ACCESS_DENIED"},403);
  if(new URL(request.url).pathname!=="/mcp")
    return respond({error:"NOT_FOUND"},404);
  if(request.method!=="POST")return respond({error:"POST_ONLY"},405);
  if(request.headers.has("origin"))return respond({error:"BROWSER_ORIGIN_NOT_ALLOWED"},403);
  let rpc;
  try{
    rpc=JSON.parse(await boundedRequestText(request));
  }catch(e){
    if(e instanceof Error&&e.message==="TOO_LARGE")
      return respond({error:"TOO_LARGE"},413);
    return rpcError(null,-32700,"Malformed JSON",400);
  }
  if(!isObject(rpc)||rpc.jsonrpc!=="2.0"||typeof rpc.method!=="string")
    return rpcError(null,-32600,"Invalid Request",400);
  const id=(typeof rpc.id==="string"||typeof rpc.id==="number"&&Number.isFinite(rpc.id))?rpc.id:null;
  if(rpc.method==="notifications/initialized"&&id===null)
    return new Response(null,{status:202,headers:jsonHeaders});
  if(id===null)return rpcError(null,-32600,"Request ID required",400);
  if(rpc.method==="initialize")return respond({jsonrpc:"2.0",id,
    result:{protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false}},
      serverInfo:{name:"lizhi-hew-cloud-direct-private-site",version:"3.0.0"}}});
  if(rpc.method==="ping")return respond({jsonrpc:"2.0",id,result:{}});
  if(rpc.method==="tools/list")return respond({jsonrpc:"2.0",id,result:{tools:cloudModelSiteTools}});
  if(rpc.method!=="tools/call")return rpcError(id,-32601,"Method not found");
  if(!isObject(rpc.params)||typeof rpc.params.name!=="string")
    return rpcError(id,-32602,"Invalid tool parameters");
  const toolResult=await handleCloudModelSiteTool(rpc.params.name,rpc.params.arguments??{},
    trustedAuth,secrets,fetcher);
  return respond({jsonrpc:"2.0",id,result:toolResult});
}
