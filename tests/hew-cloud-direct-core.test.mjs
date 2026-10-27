import test from 'node:test'
import assert from 'node:assert/strict'
import {createCloudDocument,applyCloudOperation,readCloudScene} from '../hew/cloud-direct/model-core.mjs'
const id='11111111-1111-4111-8111-111111111111', req='22222222-2222-4222-8222-222222222222'
const eid='obj_33333333333343338333333333333333'
const base=()=>createCloudDocument({document_id:id,name:'房屋設計'})
const box={origin_mm:[0,0,0],width_mm:1200,depth_mm:600,height_mm:750,name:'櫃體'}
const add=(doc,override={})=>applyCloudOperation(doc,{request_id:req,expected_revision:doc.revision,operation:'create_box',entity_id:eid,args:box,...override})
test('document has persistent ID, name and initial revision without a browser session',()=>{
 const doc=base();assert.equal(doc.revision,1);assert.equal(doc.entities.length,0)
 assert.equal(readCloudScene(doc).document_id,id)
})
test('offline cloud box creation commits bounded millimetre geometry and revision',()=>{
 const doc=base();const v=add(doc)
 assert.equal(doc.entities.length,0)
 assert.equal(v.document.revision,2)
 assert.deepEqual(v.document.entities[0].size_mm,[1200,600,750])
 assert.equal(v.receipt.persisted_by,'cloud_document')
 assert.equal(v.receipt.native_hew_saved,false)
})
test('move operates stable entity ID with optimistic revision',()=>{
 const v=add(base())
 const moved=applyCloudOperation(v.document,{operation:'move',request_id:'44444444-4444-4444-8444-444444444444',
  expected_revision:2,args:{entity_id:eid,translation_mm:[100,-100,50]}})
 assert.deepEqual(moved.document.entities[0].origin_mm,[100,-100,50])
 assert.equal(moved.document.revision,3)
 assert.deepEqual(v.document.entities[0].origin_mm,[0,0,0])
})
test('stale revision and duplicated entity ID cannot overwrite previous model state',()=>{
 const v=add(base())
 assert.throws(()=>add(v.document,{expected_revision:1}),/MODEL_REVISION_CONFLICT/)
 assert.throws(()=>add(v.document),/MODEL_ENTITY_ALREADY_EXISTS/)
})
test('rejects arbitrary commands and invalid parameters',()=>{
 assert.throws(()=>add(base(),{operation:'delete_all'}),/MODEL_UNSUPPORTED_COMMAND|MODEL_INVALID_ARGS/)
 for(const value of [0,-1,Infinity,NaN,20001])
   assert.throws(()=>add(base(),{args:{...box,width_mm:value}}),/MODEL_INVALID_GEOMETRY/)
 assert.throws(()=>add(base(),{args:{...box,script:'eval'}}),/MODEL_INVALID_ARGS/)
 assert.throws(()=>add(base(),{entity_id:'not-object'}),/MODEL_INVALID_ENTITY_ID/)
})
test('read returns a defensive copy; signed-in identity and idempotency are NOT faked',()=>{
 const v=add(base())
 const view=readCloudScene(v.document)
 view.entities[0].origin_mm[0]=999
 assert.equal(v.document.entities[0].origin_mm[0],0)
 assert.equal(Object.keys(v.receipt).includes('owner_verified'),false)
})
