/** Site v3 cloud-direct MCP contract: no session_id, page heartbeat, queue or lease. */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OBJECT=/^obj_[0-9a-f]{32}$/i
const okObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)
const exact=(x,required,optional=[])=>okObj(x)&&required.every(k=>Object.hasOwn(x,k))&&
  Object.keys(x).every(k=>required.includes(k)||optional.includes(k))
const name={type:'string',maxLength:80}
const uuid={type:'string',format:'uuid'}
const mm={type:'number',description:'mm'}
const xyz={type:'array',items:mm,minItems:3,maxItems:3}
const rev={type:'integer',minimum:1}
const schema=(properties,required)=>({type:'object',additionalProperties:false,properties,required})
export const CLOUD_MODEL_TOOLS=Object.freeze([
 {name:'model_status',description:'Check cloud model storage readiness. No browser connection required.',inputSchema:schema({},[])},
 {name:'model_list_documents',description:'List the owner\'s stored 3D model documents.',inputSchema:schema({},[])},
 {name:'model_new_document',description:'Create a new persistent cloud 3D document, with idempotent request ID.',inputSchema:schema({request_id:uuid,name},['request_id','name'])},
 {name:'model_create_box',description:'Commit a box in a persistent cloud model with optimistic revision and idempotent request ID, no Hew page required.',inputSchema:schema({document_id:uuid,revision:rev,request_id:uuid,origin_mm:xyz,width_mm:mm,depth_mm:mm,height_mm:mm,name},['document_id','revision','request_id','origin_mm','width_mm','depth_mm','height_mm'])},
 {name:'model_move',description:'Persist a version-checked translation of an object in a stored cloud model.',inputSchema:schema({document_id:uuid,revision:rev,request_id:uuid,entity_id:{type:'string',pattern:'^obj_[0-9a-f]{32}$'},translation_mm:xyz},['document_id','revision','request_id','entity_id','translation_mm'])},
 {name:'model_scene',description:'Read the currently persisted model and revision. Does not claim native .hew output.',inputSchema:schema({document_id:uuid},['document_id'])},
])
const finite=(n,a,b)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b
const vec=(v,a,b)=>Array.isArray(v)&&v.length===3&&v.every(n=>finite(n,a,b))
const err=code=>({ok:false,code})
const validName=x=>typeof x==='string'&&x.trim().length>0&&x.length<=80
export function validateCloudModelTool(name,args) {
 if(!CLOUD_MODEL_TOOLS.some(t=>t.name===name))return err('MODEL_UNKNOWN_TOOL')
 if(!okObj(args)||JSON.stringify(args).length>8192)return err('MODEL_INVALID_ARGS')
 if(name==='model_status'||name==='model_list_documents')
   return exact(args,[])?{ok:true,name,args:{}}:err('MODEL_INVALID_ARGS')
 if(name==='model_new_document')
   return exact(args,['request_id','name'])&&UUID.test(args.request_id)&&validName(args.name)
     ?{ok:true,name,args}:err('MODEL_INVALID_NEW_DOCUMENT')
 if(!UUID.test(args.document_id??''))return err('MODEL_INVALID_DOCUMENT_ID')
 if(name==='model_scene')
   return exact(args,['document_id'])?{ok:true,name,args}:err('MODEL_INVALID_ARGS')
 if(!UUID.test(args.request_id??'')||!Number.isSafeInteger(args.revision)||args.revision<1)
   return err('MODEL_REVISION_OR_REQUEST_ID_REQUIRED')
 if(name==='model_create_box')
  return exact(args,['document_id','revision','request_id','origin_mm','width_mm','depth_mm','height_mm'],['name']) &&
    vec(args.origin_mm,-100000,100000)&&
    ['width_mm','depth_mm','height_mm'].every(k=>finite(args[k],0.1,20000))&&
    (args.name===undefined||validName(args.name))
    ?{ok:true,name,args}:err('MODEL_INVALID_GEOMETRY')
 if(name==='model_move')
  return exact(args,['document_id','revision','request_id','entity_id','translation_mm'])&&
    OBJECT.test(args.entity_id)&&vec(args.translation_mm,-100000,100000)&&
    args.translation_mm.some(n=>n!==0)
    ?{ok:true,name,args}:err('MODEL_INVALID_MOVE')
 return err('MODEL_UNKNOWN_TOOL')
}
