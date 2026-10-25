// PRIVATE ChatGPT Site integration point. Include this file in the Sites server
// project and mount handleFinanceSiteMcp at POST /mcp. Not a browser module.
const EDGE="https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-finance-site-mcp";
const hex=/^[0-9a-f]{64,128}$/i;
const mail=x=>typeof x==="string"?x.trim().toLowerCase():"";
const response=(code,status)=>Response.json({error:code},{status,headers:{"Cache-Control":"no-store"}});
/**
 * @param {Request} request
 * @param {Record<string,string>} env  Server-side only Sites secrets.
 * @param {{verifyOwner:(req:Request)=>Promise<string|null>,fetchImpl?:typeof fetch}} opts
 * verifyOwner MUST be bound to the actual Sites authenticated principal.
 * Never trust a client-supplied email header or JSON body. No fallback.
 */
export async function handleFinanceSiteMcp(request,env,opts={}) {
  if(request.method!=="POST")return response("POST_ONLY",405);
  if(typeof opts.verifyOwner!=="function")return response("OWNER_CHECK_UNAVAILABLE",403);
  let authenticated;
  try{authenticated=await opts.verifyOwner(request)}catch{return response("OWNER_CHECK_FAILED",403)}
  if(!mail(authenticated)||mail(authenticated)!==mail(env?.SITE_FINANCE_OWNER_EMAIL))
    return response("OWNER_NOT_AUTHORIZED",403);
  const token=env?.LIZHI_FINANCE_SITE_MCP_TOKEN??"";
  if(!hex.test(token))return response("SITE_SECRET_NOT_CONFIGURED",503);
  const limit=16384;
  const declared=request.headers.get("content-length");
  if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>limit))
    return response("BODY_TOO_LARGE",413);
  let content;
  try {
    if(!request.body)return response("EMPTY_BODY",400);
    const reader=request.body.getReader();let bytes=0;const parts=[];
    try{for(;;){const {done,value}=await reader.read();if(done)break;
      if(!value)continue;bytes+=value.byteLength;
      if(bytes>limit)return response("BODY_TOO_LARGE",413);
      parts.push(value);
    }}finally{try{await reader.cancel()}catch{}}
    content=new Uint8Array(bytes);let offset=0;
    for(const part of parts){content.set(part,offset);offset+=part.byteLength}
  }catch{return response("INVALID_REQUEST_BODY",400)}
  // A fixed HTTPS upstream, no client URLs or cookies forwarded.
  const headers=new Headers({
    "Authorization":"Bearer "+token,
    "Content-Type":"application/json",
    "Accept":"application/json"
  });
  let upstream;
  try {
    upstream=await (opts.fetchImpl??fetch)(EDGE,{
      method:"POST",headers,body:content,redirect:"manual"
    });
  }catch{return response("FINANCE_EDGE_UNREACHABLE",502)}
  if(upstream.status>=300&&upstream.status<400)
    return response("FINANCE_EDGE_REDIRECT_REJECTED",502);
  const out=new Headers({"Cache-Control":"private, no-store",
    "Content-Type":upstream.headers.get("content-type")||"application/json",
    "X-Content-Type-Options":"nosniff"});
  return new Response(upstream.body,{status:upstream.status,headers:out});
}
