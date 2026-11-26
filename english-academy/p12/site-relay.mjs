// Runs only in the existing private Site, after its native identity check.
import {MCP_VERSION} from '../p3/mcp-server.mjs';
const READONLY=new Set(['get_learning_profile','get_review_summary','list_card_candidates','get_sync_status']);
export function createEnglishSiteRelay({endpoint,getCredentials,fetchImpl=fetch}={}){
 if(typeof endpoint!=='string'||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/lizhi-english-academy\/mcp$/.test(endpoint)||typeof getCredentials!=='function')throw Error('TRUSTED_RELAY_REQUIRED');
 async function send(rpc){
  const {key,actor}=getCredentials();
  if(!key||!actor)throw Error('ENGLISH_RELAY_NOT_CONFIGURED');
  const body={jsonrpc:'2.0',id:rpc.id??'english-relay',method:rpc.method,
   params:{...(rpc.params||{}),_meta:{
    'io.modelcontextprotocol/protocolVersion':MCP_VERSION,
    'io.modelcontextprotocol/clientCapabilities':{}
   }}};
  if(body.method==='tools/call'){
   if(typeof body.params.name!=='string'||!body.params.name.startsWith('english_'))throw Error('ENGLISH_TOOL_REQUIRED');
   body.params.name=body.params.name.slice(8);
   if(body.params.name==='add_vocabulary')throw Error('WEBSITE_APPROVAL_REQUIRED');
  }
  const r=await fetchImpl(endpoint,{method:'POST',headers:{authorization:'Bearer '+key,
   'x-lizhi-actor':actor,'content-type':'application/json','mcp-protocol-version':MCP_VERSION},
   body:JSON.stringify(body),signal:AbortSignal.timeout(20000),cache:'no-store'});
  const out=await r.json().catch(()=>null);
  if(!r.ok||!out?.result||out.error)throw Error('ENGLISH_BACKEND_UNAVAILABLE');
  return {...out,id:rpc.id??null};
 }
 return {
  async extendCatalog(original,rpc){
   try{
    const answer=await send({id:rpc.id,method:'tools/list',params:{}});
    const base=original?.result?.tools,tools=answer.result.tools;
    if(!Array.isArray(base)||!Array.isArray(tools)||!tools.length)throw Error('INVALID_CATALOG');
    const names=new Set(base.map(t=>t.name));
    const extra=tools.filter(t=>t.name!=='add_vocabulary').map(t=>{
     if(typeof t.name!=='string'||!t.inputSchema)throw Error('INVALID_TOOL');
     const name='english_'+t.name;if(names.has(name))throw Error('TOOL_COLLISION');names.add(name);
     return {...t,name,annotations:{...t.annotations,readOnlyHint:READONLY.has(t.name)}};
    });
    return {...original,result:{...original.result,tools:[...base,...extra]}};
   }catch{return original;}
  },
  call:send
 };
}
