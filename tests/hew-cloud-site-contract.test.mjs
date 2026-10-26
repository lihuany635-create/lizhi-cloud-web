import test from 'node:test'
import assert from 'node:assert/strict'
import {CLOUD_MODEL_TOOLS,validateCloudModelTool as v} from '../hew/cloud-direct/model-site-contract.mjs'
const doc='11111111-1111-4111-8111-111111111111'
const req='22222222-2222-4222-8222-222222222222'
test('Site v3 registers exactly six cloud direct tools without queue/lease',()=>{
 assert.deepEqual(CLOUD_MODEL_TOOLS.map(t=>t.name),
  ['model_status','model_list_documents','model_new_document','model_create_box','model_move','model_scene'])
 const all=JSON.stringify(CLOUD_MODEL_TOOLS)
 for(const forbidden of ['session_id','approved_until','model_job_status','consent_expires'])
  assert.equal(all.includes(forbidden),false)
})
test('status/list require no browser context and reject injected keys',()=>{
 assert.equal(v('model_status',{}).ok,true)
 assert.equal(v('model_list_documents',{}).ok,true)
 assert.equal(v('model_status',{token:'secret'}).ok,false)
})
test('persistent new document and box writes require version and request ID',()=>{
 assert.equal(v('model_new_document',{name:'新屋',request_id:req}).ok,true)
 const data={document_id:doc,revision:1,request_id:req,origin_mm:[0,0,0],
  width_mm:1200,depth_mm:600,height_mm:750}
 assert.equal(v('model_create_box',data).ok,true)
 assert.equal(v('model_create_box',{...data,revision:undefined}).ok,false)
 assert.equal(v('model_create_box',{...data,width_mm:-1}).ok,false)
 assert.equal(v('model_create_box',{...data,script:'arbitrary JS'}).ok,false)
})
test('move requires stable object ID, nonzero displacement and document revision',()=>{
 const data={document_id:doc,revision:2,request_id:req,
  entity_id:'obj_33333333333343338333333333333333',translation_mm:[15,0,0]}
 assert.equal(v('model_move',data).ok,true)
 assert.equal(v('model_move',{...data,entity_id:'../other-file'}).ok,false)
 assert.equal(v('model_move',{...data,translation_mm:[0,0,0]}).ok,false)
})
