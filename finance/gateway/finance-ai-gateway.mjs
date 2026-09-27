import http from "node:http";
import {pathToFileURL} from "node:url";
import {loadGatewayConfig} from "./gateway-config.mjs";
import {verifyGatewayAuthorization} from "./gateway-auth.mjs";
import {GatewayRequestError,validateFinanceParseRequest} from "./gateway-request-validator.mjs";
import {buildGatewayFinancePrompt} from "./gateway-prompt.mjs";
import {guardGatewayModelOutput} from "./gateway-output-guard.mjs";
import {GatewayOllamaError,generateGatewayPatch} from "./gateway-ollama-client.mjs";
import {createRateLimiter,createConcurrencyLimiter} from "./gateway-rate-limit.mjs";
import {createGatewayLogger} from "./gateway-logger.mjs";

const json=(response,status,body,headers={})=>{response.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers});response.end(JSON.stringify(body));};
const errorBody=(code)=>({ok:false,error:{code}});
function cors(config,origin){return origin&&config.allowedOrigins.includes(origin)?{"access-control-allow-origin":origin,"vary":"Origin"}:{};}
async function readJson(request,limit){
  let size=0,text="";
  for await(const chunk of request){size+=chunk.length;if(size>limit)throw new GatewayRequestError(413,"BODY_TOO_LARGE","Request body is too large");text+=chunk.toString("utf8");}
  try{return JSON.parse(text);}catch{throw new GatewayRequestError(400,"INVALID_REQUEST","Request body must be valid JSON");}
}
export function createFinanceGateway(options={}){
  const config=options.config||loadGatewayConfig(),authVerifier=options.authVerifier||verifyGatewayAuthorization,ollamaGenerate=options.ollamaGenerate||generateGatewayPatch,logger=options.logger||createGatewayLogger(),rateLimiter=options.rateLimiter||createRateLimiter({limit:config.rateLimit}),concurrencyLimiter=options.concurrencyLimiter||createConcurrencyLimiter({maximum:config.concurrency});
  const server=http.createServer(async(request,response)=>{
    const started=Date.now(),url=new URL(request.url||"/",`http://${request.headers.host||"127.0.0.1"}`),origin=request.headers.origin||"";
    if(request.method==="GET"&&url.pathname==="/health"){
      if(origin&&!config.allowedOrigins.includes(origin))return json(response,403,errorBody("ORIGIN_NOT_ALLOWED"));
      return json(response,200,{status:"ok",service:"finance-ai-gateway",version:"phase5"},cors(config,origin));
    }
    if(url.pathname!=="/finance/parse")return json(response,404,errorBody("NOT_FOUND"));
    if(!origin||!config.allowedOrigins.includes(origin))return json(response,403,errorBody("ORIGIN_NOT_ALLOWED"));
    const corsHeaders=cors(config,origin);
    if(request.method==="OPTIONS")return json(response,204,{}, {...corsHeaders,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"Authorization, Content-Type","access-control-max-age":"600"});
    if(request.method!=="POST")return json(response,404,errorBody("NOT_FOUND"),corsHeaders);
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"]||""))return json(response,400,errorBody("INVALID_REQUEST"),corsHeaders);
    let requestId=null,release=null;
    try{
      const user=await authVerifier({authorization:request.headers.authorization,config});
      const body=await readJson(request,config.bodyLimit),validated=validateFinanceParseRequest(body);requestId=validated.requestId;
      const rateKey=user.id||user.email;
      if(!rateLimiter.take(rateKey))return json(response,429,errorBody("RATE_LIMITED"),corsHeaders);
      release=concurrencyLimiter.acquire(validated.requestId);
      if(!release)return json(response,429,errorBody("BUSY"),corsHeaders);
      const promptPackage=buildGatewayFinancePrompt(validated),raw=await ollamaGenerate({prompt:promptPackage.prompt,config}),guarded=guardGatewayModelOutput(raw,validated,promptPackage);
      if(!guarded.valid)return json(response,502,errorBody(guarded.code),corsHeaders);
      const elapsedMs=Date.now()-started;
      logger.info("finance_parse",{requestId,route:url.pathname,status:200,elapsedMs});
      return json(response,200,{ok:true,requestId,patch:guarded.patch,issues:guarded.issues,elapsedMs},corsHeaders);
    }catch(error){
      const status=Number(error?.status)||500,code=error?.code||"INTERNAL_ERROR";
      logger.warn("finance_parse_failed",{requestId,route:url.pathname,status,code,elapsedMs:Date.now()-started});
      return json(response,status,errorBody(code),corsHeaders);
    }finally{release?.();}
  });
  return server;
}

export async function startFinanceGateway(options={}){
  const config=options.config||loadGatewayConfig(),server=createFinanceGateway({...options,config});
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(config.port,config.host,resolve);});
  return Object.freeze({server,config});
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  startFinanceGateway().then(({config})=>console.log(`Finance AI Gateway listening on http://${config.host}:${config.port}`)).catch(error=>{console.error(`Finance AI Gateway failed: ${error.message}`);process.exitCode=1;});
}

