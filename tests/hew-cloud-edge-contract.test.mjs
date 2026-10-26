import test from 'node:test'
import assert from 'node:assert/strict'
import {handleCloudModelEdgeRequest as handler} from '../hew/cloud-direct/model-edge-core.mjs'
const token='a'.repeat(64),owner='11111111-1111-4111-8111-111111111111'
const doc='22222222-2222-4222-8222-222222222222'
const requestId='33333333-3333-4333-8333-333333333333'
const calls=[]
const db={rpc:async(name,params)=>{
 calls.push({name,params})
 return {data:({
   lizhi_model_cloud_list:[],
   lizhi_model_cloud_get:{document_id:doc,revision:2,format:'lizhi-model-cloud-v1',
     native_hew_saved:false,entities:[]},
   lizhi_model_cloud_write:{ok:true,document_id:doc,revision:2,
     native_hew_saved:false,entity_id:'obj_44444444444444448444444444444444'}
 })[name],error:null}
}}
const rpc=(method,params,id=1,secret=token,origin)=>new Request('https://cloud.example/model',{
 method:'POST',headers:{'Content-Type':'application/json',
  Authorization:'Bearer '+secret,...origin?{Origin:origin}:{}},
 body:JSON.stringify({jsonrpc:'2.0',id,method,...params?{params}:{}})
})
async function invoke(method,params){const r=await handler(rpc(method,params),{db,ownerUid:owner,token})
 return {http:r.status,data:await r.json()}}
test('cloud MCP advertises six stateless tools and no browser-session lease',async()=>{
 const r=await invoke('tools/list')
 assert.equal(r.http,200)
 const tools=r.data.result.tools.map(t=>t.name)
 assert.deepEqual(tools,['model_status','model_list_documents','model_new_document',
  'model_create_box','model_move','model_scene'])
 assert.ok(!JSON.stringify(r).includes('session_id'))
})
test('status is online independently of Hew browser and does not require approval',async()=>{
 calls.length=0
 const r=await invoke('tools/call',{name:'model_status',arguments:{}})
 assert.equal(r.http,200)
 const result=JSON.parse(r.data.result.content[0].text)
 assert.deepEqual(result,{ok:true,mode:'cloud_direct',requires_browser:false,
   requires_page_consent:false,document_count:0})
 assert.deepEqual(calls.map(x=>x.name),['lizhi_model_cloud_list'])
})
test('write maps version, document and request to one service role-only RPC',async()=>{
 calls.length=0
 const args={document_id:doc,revision:1,request_id:requestId,
  origin_mm:[0,0,0],width_mm:1200,depth_mm:600,height_mm:750}
 const r=await invoke('tools/call',{name:'model_create_box',arguments:args})
 const receipt=JSON.parse(r.data.result.content[0].text)
 assert.equal(receipt.mode,'cloud_direct')
 assert.equal(receipt.native_hew_saved,false)
 assert.equal(calls.length,1)
 assert.deepEqual(calls[0],{
  name:'lizhi_model_cloud_write',
  params:{p_owner:owner,p_request:requestId,p_op:'create_box',
   p_document:doc,p_revision:1,
   p_args:{origin_mm:[0,0,0],width_mm:1200,depth_mm:600,height_mm:750}}
 })
})
test('wrong bearer, browser origins and invalid commands never reach SQL',async()=>{
 calls.length=0
 const unauth=await handler(rpc('tools/list',null,1,'b'.repeat(64)),{db,ownerUid:owner,token})
 assert.equal(unauth.status,401)
 const crossOrigin=await handler(rpc('tools/list',null,1,token,'https://untrusted.example'),
  {db,ownerUid:owner,token})
 assert.equal(crossOrigin.status,403)
 const bad=await invoke('tools/call',{name:'model_delete_all',arguments:{}})
 assert.equal(bad.data.result.isError,true)
 assert.equal(calls.length,0)
})
test('a direct cloud model scene returns a persisted document not a native Hew file',async()=>{
 calls.length=0
 const r=await invoke('tools/call',{name:'model_scene',arguments:{document_id:doc}})
 const data=JSON.parse(r.data.result.content[0].text)
 assert.equal(data.document_id,doc)
 assert.equal(data.revision,2)
 assert.equal(data.native_hew_saved,false)
 assert.deepEqual(calls.map(x=>x.name),['lizhi_model_cloud_get'])
})
