// PRIVATE ChatGPT Site integration point. Include this file in the Sites server
// project and mount handleFinanceSiteMcp at POST /mcp. Not a browser module.
const EDGE="https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-finance-site-mcp";
const hex=/^[0-9a-f]{64,128}$/i;
const mail=x=>typeof x==="string"?x.trim().toLowerCase():"";
const response=(code,status)=>Response.json({error:code},{status,headers:{"Cache-Control":"no-store"}});
const GOAL_WRITES=new Set([
  "finance_goals_salary_set","finance_goals_goal_set","finance_goals_allocation_set"
]);
async function goalHmac(secret,frame,timestamp){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),
    {name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const data=new TextEncoder().encode(String(timestamp)+"\n"+JSON.stringify(frame));
  const signature=new Uint8Array(await crypto.subtle.sign("HMAC",key,data));
  return [...signature].map(b=>b.toString(16).padStart(2,"0")).join("");
}

/**
 * @param {Request} request
 * @param {Record<string,string>} env  Server-side only Sites secrets.
 * @param {{verifyOwner:(req:Request)=>Promise<string|null>,fetchImpl?:typeof fetch,approveGoalWrite?:(args:{request:Request,principal:string,name:string,arguments:Record<string,unknown>})=>Promise<boolean>}} opts
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
  // A privileged Goals write is never inferred from a model-generated flag.
  // Sites MUST use its own trusted real-user confirmation callback.
  let writeFrame;
  try{writeFrame=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(content));}
  catch{return response("INVALID_REQUEST_BODY",400)}
  const goalName=writeFrame?.method==="tools/call"?writeFrame?.params?.name:null;
  let goalProof=null;
  if(GOAL_WRITES.has(goalName)){
    if(typeof opts.approveGoalWrite!=="function")
      return response("GOALS_EXPLICIT_APPROVAL_REQUIRED",403);
    let permitted=false;
    try{
      permitted=await opts.approveGoalWrite({request,principal:authenticated,
        name:goalName,arguments:writeFrame.params?.arguments??{}})===true;
    }catch{permitted=false}
    if(!permitted)return response("GOALS_EXPLICIT_APPROVAL_REQUIRED",403);
    // The proof is bound to the exact tool arguments; never forward a raw
    // browser-provided confirmation header or expose the HMAC secret.
    const timestamp=Math.floor(Date.now()/1000);
    goalProof=String(timestamp)+"."+await goalHmac(token,writeFrame,timestamp);
  }
  const headers=new Headers({
    "Authorization":"Bearer "+token,
    "Content-Type":"application/json",
    "Accept":"application/json"
  });
  if(goalProof)headers.set("x-lizhi-goals-write-approval",goalProof);
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
