import test from 'node:test';
import assert from 'node:assert/strict';
import {createProductionEnglishMcp} from '../production-mcp.mjs';
import {createEnglishSiteRelay} from '../site-relay.mjs';
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const base='https://synthetic.supabase.co';
const endpoint=base+'/functions/v1/lizhi-english-academy/mcp';
const key='lzp_synthetic-not-a-real-key-1234567890';
const actor='synthetic-native-site-owner';
function setup({valid=true,rows=[],rpcError=null}={}){
 const requests=[];
 const backend=createProductionEnglishMcp({env:{SUPABASE_URL:base,SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'},fetchImpl:async(url,init)=>{
  requests.push({url:String(url),body:init.body&&JSON.parse(init.body)});
  if(String(url).endsWith('/rpc/english_resolve_site_owner'))return Response.json(valid?{owner_id:owner,enabled:true,link_verified:true}:null);
  if(String(url).endsWith('/rpc/english_p6_ingest_batch'))return rpcError?
    Response.json({message:rpcError},{status:400}):Response.json({status:'success',pendingAdded:1,errorsAdded:0});
  return Response.json(rows);
 }});
 const relay=createEnglishSiteRelay({endpoint,getCredentials:()=>({key,actor}),fetchImpl:async(url,init)=>backend(new Request(url,init))});
 return {relay,requests,backend};
}
const call=(relay,name,args={})=>relay.call({jsonrpc:'2.0',id:12,method:'tools/call',params:{name,arguments:args}});
test('original catalog metadata/order and seven English tools coexist; formal card tool is absent',async()=>{
 const {relay}=setup();const original={jsonrpc:'2.0',id:1,result:{tools:[{name:'aiwb_overview',inputSchema:{type:'object'},_meta:{keep:true}},{name:'read_project_image',outputSchema:{type:'object'}}],_meta:{original:true}}};
 const out=await relay.extendCatalog(original,{id:1});
 assert.deepEqual(out.result.tools.slice(0,2),original.result.tools);
 assert.deepEqual(out.result._meta,original.result._meta);
 assert.equal(out.result.tools.length,9);
 assert.equal(out.result.tools.some(t=>t.name==='english_add_vocabulary'),false);
});
test('catalog failure preserves all existing tools and response identity',async()=>{
 const {relay}=setup({valid:false});const original={result:{tools:[{name:'licut_status'}]}};
 assert.equal(await relay.extendCatalog(original,{id:1}),original);
});
test('candidate traverses real protocol translation, hashed key resolution and atomic RPC',async()=>{
 const {relay,requests}=setup();
 const out=await call(relay,'english_create_card_candidates',{requestId:'synthetic-request-123',sourceSessionId:'synthetic-authorized',candidates:[{term:'museum',meaningZh:'博物館'}]});
 assert.equal(out.id,12);assert.equal(out.result.isError,false);
 assert.equal(JSON.parse(out.result.content[0].text).pendingAdded,1);
 assert.equal(requests[0].body.p_chatgpt_owner,actor);
 assert.match(requests[0].body.p_key_hash,/^[a-f0-9]{64}$/);
 assert.ok(!JSON.stringify(requests).includes(key));
 assert.equal(requests.at(-1).body.p_owner_id,owner);
});
test('no Google/Site link rejects read before any data query',async()=>{
 const {relay,requests}=setup({valid:false});
 await assert.rejects(call(relay,'english_list_card_candidates'),/BACKEND_UNAVAILABLE/);
 assert.equal(requests.length,1);
});
test('owner supplied by model is rejected; never reaches a write RPC',async()=>{
 const {relay,requests}=setup();
 const out=await call(relay,'english_record_language_errors',{ownerId:other,requestId:'synthetic-request-123',sourceSessionId:'synthetic-authorized',errors:[{original:'He go.',corrected:'He goes.',explanation:'Agreement'}]});
 assert.equal(out.result.isError,true);
 assert.equal(JSON.parse(out.result.content[0].text).code,'UNEXPECTED_ARGUMENT');
 assert.equal(requests.length,1);
});
test('expired/revoked learning session produces a safe nonretryable refusal',async()=>{
 const {relay}=setup({rpcError:'LEARNING_SESSION_NOT_AUTHORIZED'});
 const out=await call(relay,'english_create_card_candidates',{requestId:'synthetic-request-123',sourceSessionId:'expired-session',candidates:[{term:'museum',meaningZh:'博物館'}]});
 const data=JSON.parse(out.result.content[0].text);
 assert.equal(out.result.isError,true);assert.equal(data.code,'LEARNING_SESSION_NOT_AUTHORIZED');assert.equal(data.retryable,false);
});
test('cross-owner read results are rejected and queries always include the trusted owner',async()=>{
 const {relay,requests}=setup({rows:[{owner_id:other,id:'foreign'}]});
 const out=await call(relay,'english_list_card_candidates',{limit:2});
 assert.equal(out.result.isError,true);
 const url=new URL(requests.at(-1).url);assert.equal(url.searchParams.get('owner_id'),'eq.'+owner);assert.equal(url.searchParams.get('limit'),'2');
});
test('formal writes cannot be relayed; browser-origin request cannot use the private bridge',async()=>{
 const {relay,backend,requests}=setup();
 await assert.rejects(call(relay,'english_add_vocabulary'),/WEBSITE_APPROVAL_REQUIRED/);
 assert.equal(requests.length,0);
 const response=await backend(new Request(endpoint,{method:'POST',headers:{origin:'https://example.com',authorization:'Bearer '+key,'content-type':'application/json'},body:'{}'}));
 assert.equal(response.status,403);assert.equal(requests.length,0);
});
