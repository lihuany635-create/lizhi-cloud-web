const LOOPBACK_HOSTS=new Set(["127.0.0.1","localhost","::1","[::1]"]);

function integer(value,fallback,min,max,name){
  const parsed=value==null||value===""?fallback:Number(value);
  if(!Number.isSafeInteger(parsed)||parsed<min||parsed>max)throw new TypeError(`${name} must be an integer from ${min} to ${max}`);
  return parsed;
}
function list(value){return Object.freeze([...new Set(String(value||"").split(",").map(item=>item.trim()).filter(Boolean))]);}
function origins(value){
  return Object.freeze(list(value).map(item=>{
    let url;try{url=new URL(item);}catch{throw new TypeError(`Invalid allowed origin: ${item}`);}
    if(url.origin!==item.replace(/\/$/,""))throw new TypeError(`Allowed origin must not contain a path: ${item}`);
    return url.origin;
  }));
}
export function loadGatewayConfig(env=process.env,{strict=true}={}){
  const host=String(env.FINANCE_GATEWAY_HOST||"127.0.0.1").trim();
  if(host!=="127.0.0.1")throw new TypeError("Finance AI Gateway must bind to 127.0.0.1");
  const port=integer(env.FINANCE_GATEWAY_PORT,4181,1,65535,"FINANCE_GATEWAY_PORT");
  const ollamaBaseUrl=String(env.OLLAMA_BASE_URL||`http://127.0.0.1:${11434}`).replace(/\/$/,"");
  let ollamaUrl;try{ollamaUrl=new URL(ollamaBaseUrl);}catch{throw new TypeError("OLLAMA_BASE_URL is invalid");}
  if(ollamaUrl.protocol!=="http:"||!LOOPBACK_HOSTS.has(ollamaUrl.hostname))throw new TypeError("OLLAMA_BASE_URL must be a loopback HTTP URL");
  const config=Object.freeze({
    host,port,ollamaBaseUrl:ollamaUrl.href.replace(/\/$/,""),model:String(env.OLLAMA_MODEL||"").trim(),
    supabaseUrl:String(env.SUPABASE_URL||"").replace(/\/$/,""),supabasePublishableKey:String(env.SUPABASE_PUBLISHABLE_KEY||"").trim(),
    allowedUsers:list(env.LIZHI_ALLOWED_USER),allowedOrigins:origins(env.FINANCE_GATEWAY_ALLOWED_ORIGINS||"http://127.0.0.1:4180,http://localhost:4180"),
    bodyLimit:integer(env.FINANCE_GATEWAY_BODY_LIMIT,32768,1024,131072,"FINANCE_GATEWAY_BODY_LIMIT"),
    timeoutMs:integer(env.FINANCE_GATEWAY_TIMEOUT_MS,25000,1000,60000,"FINANCE_GATEWAY_TIMEOUT_MS"),
    rateLimit:integer(env.FINANCE_GATEWAY_RATE_LIMIT,20,1,120,"FINANCE_GATEWAY_RATE_LIMIT"),
    concurrency:integer(env.FINANCE_GATEWAY_CONCURRENCY,2,1,4,"FINANCE_GATEWAY_CONCURRENCY")
  });
  if(strict){
    for(const [key,value] of [["OLLAMA_MODEL",config.model],["SUPABASE_URL",config.supabaseUrl],["SUPABASE_PUBLISHABLE_KEY",config.supabasePublishableKey]])if(!value)throw new TypeError(`${key} is required`);
    if(!config.allowedUsers.length)throw new TypeError("LIZHI_ALLOWED_USER is required");
    if(!config.allowedOrigins.length)throw new TypeError("FINANCE_GATEWAY_ALLOWED_ORIGINS is required");
  }
  return config;
}

