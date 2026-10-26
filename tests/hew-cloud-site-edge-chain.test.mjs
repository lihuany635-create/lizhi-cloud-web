import test from 'node:test'
import assert from 'node:assert/strict'
import {handleSiteCloudModelMcpRequest as site} from '../sites-migration/hew/site-cloud-direct-mcp.mjs'
import {handleCloudModelEdgeRequest as edge} from '../supabase/functions/lizhi-model-site-mcp/cloud-edge-core.mjs'
const token='c'.repeat(64)
const owner='11111111-1111-4111-8111-111111111111'
const doc='22222222-2222-4222-8222-222222222222'
const req='33333333-3333-4333-8333-333333333333'
const auth={signedIn:true,verifiedUserEmail:'owner@example.test'}
const secrets={ownerEmail:auth.verifiedUserEmail,siteMcpToken:token}
const calls=[]
const db={rpc:async(name,params)=>{
 calls.push({name,params})
 const data=name==='lizhi_model_cloud_list'?[]:
  name==='lizhi_model_cloud_get'?{document_id:doc,name:'Room',revision:2,
   entities:[],native_hew_saved:false,format:'lizhi-model-cloud-v1'}:
  {ok:true,document_id:doc,revision:2,native_hew_saved:false,
   entity_id:'obj_44444444444444448444444444444444'}
 return {data,error:null}
}}
let forwarded=0
const fetcher=async(url,init)=>{
 forwarded++
 return edge(new Request(url,{method:init.method,headers:init.headers,body:init.body}),
  {token,ownerUid:owner,db})
}
const mcp=(method,params,id=1)=>new Request('https://private-model.site/mcp',{
 method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({jsonrpc:'2.0',id,method,...params?{params}:{}})
})
test('owner-only Site /mcp lists cloud tools with zero dependency on Hew session',async()=>{
 forwarded=0
 const r=await (await site(mcp('tools/list'),auth,secrets,fetcher)).json()
 assert.deepEqual(r.result.tools.map(x=>x.name),
  ['model_status','model_list_documents','model_new_document','model_create_box','model_move','model_scene'])
 assert.equal(forwarded,0)
 assert.equal(r.result.tools.some(x=>JSON.stringify(x).includes('session_id')),false)
})
test('full Site -> actual Edge code -> mocked atomic SQL writes once with document revision',async()=>{
 calls.length=0;forwarded=0
 const args={document_id:doc,revision:1,request_id:req,origin_mm:[0,0,0],
  width_mm:1200,depth_mm:600,height_mm:750}
 const r=await (await site(mcp('tools/call',{name:'model_create_box',arguments:args}),auth,secrets,fetcher)).json()
 assert.equal(r.result.isError,false)
 const value=JSON.parse(r.result.content[0].text)
 assert.equal(value.native_hew_saved,false)
 assert.equal(value.mode,'cloud_direct')
 assert.equal(forwarded,1)
 assert.deepEqual(calls.map(x=>x.name),['lizhi_model_cloud_write'])
 assert.equal(calls[0].params.p_revision,1)
 assert.equal(calls[0].params.p_request,req)
})
test('Site rejects impostors and incomplete Secrets without entering Edge',async()=>{
 calls.length=0;forwarded=0
 for(const identity of [null,{signedIn:true,verifiedUserEmail:'other@example.test'}]){
  const r=await site(mcp('tools/list'),identity,secrets,fetcher)
  assert.ok([401,403].includes(r.status))
 }
 const noSecret=await site(mcp('tools/call',{name:'model_status',arguments:{}}),auth,
   {...secrets,siteMcpToken:''},fetcher)
 const v=await noSecret.json()
 assert.equal(v.result.isError,true)
 assert.equal(forwarded,0)
 assert.equal(calls.length,0)
})
test('a cloud-direct status is still available when no Hew editing tab is online',async()=>{
 calls.length=0
 const r=await (await site(mcp('tools/call',{name:'model_status',arguments:{}}),auth,secrets,fetcher)).json()
 const value=JSON.parse(r.result.content[0].text)
 assert.equal(value.mode,'cloud_direct')
 assert.equal(value.requires_browser,false)
 assert.equal(value.document_count,0)
})
