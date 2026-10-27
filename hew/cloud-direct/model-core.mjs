/**
 * Cloud-direct 3D document rules. This is a deterministic, bounded model
 * specification, NOT a native .hew file or proof that Hew WASM has executed.
 * The authoritative persistence layer must perform owner scope, request-id
 * idempotency and revision locking atomically before calling applyOperation.
 */
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const entityId=/^obj_[0-9a-f]{32}$/i
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max
const vec=(v,min,max)=>Array.isArray(v)&&v.length===3&&v.every(n=>finite(n,min,max))
const clean=(name,max)=>typeof name==='string'&&name.trim().length>0&&name.length<=max&&
  !/[\u0000-\u001f]/.test(name)
const assert=(condition,code)=>{if(!condition)throw Error(code)}
const oneOf=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.keys(obj).every(k=>keys.includes(k))
const copy=value=>structuredClone(value)
export const CLOUD_DOCUMENT_FORMAT='lizhi-model-cloud-v1'
export function createCloudDocument({document_id,name}) {
 assert(uuid.test(document_id),'MODEL_INVALID_DOCUMENT_ID')
 assert(clean(name,80),'MODEL_INVALID_DOCUMENT_NAME')
 return {format:CLOUD_DOCUMENT_FORMAT,document_id,name:name.trim(),revision:1,entities:[]}
}
export function readCloudScene(document){
 assert(document?.format===CLOUD_DOCUMENT_FORMAT&&uuid.test(document.document_id)&&
   Number.isSafeInteger(document.revision)&&document.revision>=1&&
   Array.isArray(document.entities)&&document.entities.length<=1000,
   'MODEL_DOCUMENT_INVALID')
 return {document_id:document.document_id,name:document.name,
   revision:document.revision,format:document.format,
   entities:copy(document.entities)}
}
export function applyCloudOperation(document,{request_id,expected_revision,operation,args,entity_id}) {
 const prev=readCloudScene(document)
 assert(uuid.test(request_id),'MODEL_INVALID_REQUEST_ID')
 assert(Number.isSafeInteger(expected_revision)&&expected_revision>=1,
   'MODEL_INVALID_REVISION')
 assert(prev.revision===expected_revision,'MODEL_REVISION_CONFLICT')
 assert(prev.revision<Number.MAX_SAFE_INTEGER,'MODEL_REVISION_LIMIT')
 assert(oneOf(args,operation==='create_box'
   ?['origin_mm','width_mm','depth_mm','height_mm','name']
   :['entity_id','translation_mm']),'MODEL_INVALID_ARGS')
 const next=copy(document)
 let affected
 if(operation==='create_box') {
   assert(entityId.test(entity_id),'MODEL_INVALID_ENTITY_ID')
   assert(next.entities.length<1000,'MODEL_ENTITY_LIMIT')
   assert(!next.entities.some(e=>e.id===entity_id),'MODEL_ENTITY_ALREADY_EXISTS')
   assert(vec(args.origin_mm,-100000,100000)&&
     finite(args.width_mm,0.1,20000)&&
     finite(args.depth_mm,0.1,20000)&&
     finite(args.height_mm,0.1,20000)&&
     (args.name===undefined||clean(args.name,80)),'MODEL_INVALID_GEOMETRY')
   affected=entity_id
   next.entities.push({id:entity_id,kind:'box',name:args.name?.trim()??'Box',
     origin_mm:[...args.origin_mm],
     size_mm:[args.width_mm,args.depth_mm,args.height_mm]})
 } else if(operation==='move') {
   assert(typeof args.entity_id==='string'&&entityId.test(args.entity_id)&&
     vec(args.translation_mm,-100000,100000)&&
     args.translation_mm.some(n=>n!==0),'MODEL_INVALID_TRANSLATION')
   const entity=next.entities.find(e=>e.id===args.entity_id)
   assert(!!entity,'MODEL_ENTITY_NOT_FOUND')
   const origin=entity.origin_mm.map((n,i)=>n+args.translation_mm[i])
   assert(vec(origin,-100000,100000),'MODEL_TRANSLATION_OUT_OF_BOUNDS')
   entity.origin_mm=origin
   affected=entity.id
 } else throw Error('MODEL_UNSUPPORTED_COMMAND')
 next.revision++
 return {document:next,receipt:{ok:true,document_id:next.document_id,
   revision:next.revision,entity_id:affected,persisted_by:'cloud_document',
   native_hew_saved:false,request_id}}
}
