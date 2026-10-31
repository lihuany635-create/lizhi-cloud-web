import {VIEWER_CLOUD_TOOLS as TOOLS,VIEWER_CLOUD_EDGE} from '../site-cloud-direct-tools.mjs';
import {callViewerCloud,viewerCloudToMcpContent} from '../site-cloud-direct-mcp.mjs';
export const SITE_ID='appgprj_6ae0c336243881919e9ba2bbf450f1fb';
export {TOOLS};
const json=(v,status=200)=>Response.json(v,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const safeCode=e=>/^[A-Z0-9_]{3,100}$/.test(e?.message||'')?e.message:'VIEWER_CLOUD_ERROR';
function check(v,s){
 if(s.enum&&!s.enum.includes(v))return false;
 if(s.type==='string'&&(typeof v!=='string'||v.length>(s.maxLength??10000)||v.length<(s.minLength??0)||s.pattern&&!new RegExp(s.pattern).test(v)||s.format==='uuid'&&!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v)))return false;
 if(s.type==='boolean'&&typeof v!=='boolean')return false;
 if((s.type==='number'||s.type==='integer')&&(typeof v!=='number'||!Number.isFinite(v)||s.type==='integer'&&!Number.isSafeInteger(v)||v<(s.minimum??-Infinity)||v>(s.maximum??Infinity)))return false;
 if(s.type==='array'&&(!Array.isArray(v)||v.length<(s.minItems??0)||v.length>(s.maxItems??1000)||v.some(x=>!check(x,s.items||{}))))return false;
 if(s.type==='object'){
  if(!v||typeof v!=='object'||Array.isArray(v)||(s.required||[]).some(k=>!Object.hasOwn(v,k)))return false;
  if(Object.keys(v).some(k=>s.properties?.[k]?!check(v[k],s.properties[k]):s.additionalProperties===false))return false;
 }
 return true;
}
export function validate(name,args){
 const t=TOOLS.find(t=>t.name===name);
 if(!t||!check(args,t.inputSchema)||new TextEncoder().encode(JSON.stringify(args)).length>24000)throw Error('VIEWER_INVALID_ARGUMENTS');
 return args;
}
export async function invoke(name,args,identity,env,fetcher=fetch){
 validate(name,args);
 if(!identity)throw Error('OWNER_AUTH_REQUIRED');
 const boundedFetch=async(url,options)=>{
  if(url!==VIEWER_CLOUD_EDGE||options.method!=='POST'||options.redirect!=='manual')throw Error('UPSTREAM_ROUTE_REJECTED');
  let response;
  try{response=await fetcher(url,options);}catch{throw Error('VIEWER_RESULT_UNKNOWN_DO_NOT_RETRY');}
  if(response.status>=300&&response.status<400)throw Error('UPSTREAM_REDIRECT_REFUSED_DO_NOT_RETRY');
  if(Number(response.headers.get('content-length')||0)>1800000)throw Error('UPSTREAM_OVERSIZE_DO_NOT_RETRY');
  let raw;
  try{raw=await response.text();}catch{throw Error('VIEWER_RESULT_UNKNOWN_DO_NOT_RETRY');}
  if(new TextEncoder().encode(raw).length>1800000)throw Error('UPSTREAM_OVERSIZE_DO_NOT_RETRY');
  if(!response.ok){let code;try{code=JSON.parse(raw)?.code;}catch{}throw Error(/^[A-Z0-9_]{3,100}$/.test(code||'')?code:'VIEWER_CLOUD_UPSTREAM_'+response.status);}
  return new Response(raw,{status:response.status,headers:{'content-type':'application/json'}});
 };
 let value;
 try{value=await callViewerCloud({name,args,owner:identity,token:env.VIEWER_CONTROL_TOKEN,fetcher:boundedFetch});}
 catch(e){if(e instanceof SyntaxError)throw Error('UPSTREAM_INVALID_RESULT_DO_NOT_RETRY');throw e;}
 if(!value||typeof value.ok!=='boolean'||(name!=='viewer_get_screenshot'&&Object.hasOwn(value,'image')))throw Error('UPSTREAM_INVALID_RESULT_DO_NOT_RETRY');
 if(name==='viewer_get_screenshot'&&value.ok){
  if(value.real_screenshot!==true||value.model_key!==args.model_key||value.model_sha!==args.model_sha
   ||!Number.isSafeInteger(value.revision)||value.revision<0||typeof value.avatar_id!=='string'||!value.avatar_id
   ||!Number.isFinite(Date.parse(value.captured_at))||Date.now()-Date.parse(value.captured_at)>90000
   ||Date.parse(value.captured_at)>Date.now()+5000||viewerCloudToMcpContent(value).length!==2)
   throw Error('UPSTREAM_INVALID_SCREENSHOT');
 }
 return value;
}
export async function handle(request,env,page,fetcher=fetch){
 const u=new URL(request.url),h=request.headers;
 const uid=h.get('oai-authenticated-user-id'),email=h.get('oai-authenticated-user-email');
 const identity=uid&&email?SITE_ID+':'+uid:null;
 if(u.pathname==='/favicon.ico')return new Response(null,{status:204});
 if(request.method==='GET'&&u.pathname==='/'){
  if(!identity)return new Response('Sign in to the private Site with ChatGPT.',{status:401});
  return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'self' https://chatgpt.com"}});
 }
 if(u.pathname==='/api/browser')return json({ok:false,code:'BROWSER_SESSION_API_RETIRED'},410);
 if(request.method!=='POST')return json({ok:false,code:'METHOD_NOT_ALLOWED'},405);
 if(h.has('origin')&&h.get('origin')!==u.origin)return json({ok:false,code:'ORIGIN_DENIED'},403);
 if(u.pathname!=='/mcp'&&u.pathname!=='/api/tool')return json({ok:false,code:'NOT_FOUND'},404);
 if(u.pathname==='/api/tool'&&(!identity||h.get('origin')!==u.origin||h.get('x-viewer-ui')!=='1'))return json({ok:false,code:'BROWSER_ORIGIN_REQUIRED'},403);
 if(Number(h.get('content-length')||0)>30000)return json({ok:false,code:'BODY_TOO_LARGE'},413);
 let b;try{const text=await request.text();if(new TextEncoder().encode(text).length>30000)throw Error();b=JSON.parse(text);if(!b||typeof b!=='object'||Array.isArray(b))throw Error();}catch{return json({ok:false,code:'INVALID_BODY'},400);}
 const id=b.id??null;let result;
 if(b.method==='server/discover')result={supportedVersions:['2026-07-28'],capabilities:{tools:{}}};
 else if(b.method==='tools/list'){
  result={tools:TOOLS};
  if(u.pathname==='/mcp'){
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(TOOLS)));
   console.info(JSON.stringify({event:'viewer_mcp_discovery',release:'v9',count:TOOLS.length,names:TOOLS.map(t=>t.name),schema_sha256:[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')}));
  }
 }
 else if(b.method==='tools/call'){
  const name=b.params?.name,args=b.params?.arguments??{};
  try{const value=await invoke(name,args,identity,env,fetcher);result={isError:!value.ok,content:u.pathname==='/mcp'?viewerCloudToMcpContent(value):[{type:'text',text:JSON.stringify(value)}]};}
  catch(e){result={isError:true,content:[{type:'text',text:JSON.stringify({ok:false,code:safeCode(e),request_id:typeof args?.request_id==='string'?args.request_id:null})}]};}
 }else return json({jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}});
 return json({jsonrpc:'2.0',id,result});
}
