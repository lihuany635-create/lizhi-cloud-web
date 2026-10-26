/**
 * Candidate v3 cloud-direct model MCP Edge core.
 * Server to server only; no browser session or Hew WASM page dependency.
 * Actual native Hew file output is a separate, explicit materialization step.
 */
import {CLOUD_MODEL_TOOLS,validateCloudModelTool} from './model-site-contract.mjs'
const HEX=/^[0-9a-f]{64,128}$/i
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}
const json=(body,status=200)=>Response.json(body,{status,headers})
const packet=(id,result)=>json({jsonrpc:'2.0',id,result})
const fail=(id,code)=>packet(id,{isError:true,content:[{type:'text',text:code}]})
const success=(id,value)=>packet(id,{isError:false,content:[{type:'text',text:JSON.stringify(value)}]})
const rpcError=(id,code,message)=>json({jsonrpc:'2.0',id,error:{code,message}})
async function equalToken(a,b){
 if(!HEX.test(a??'')||!HEX.test(b??''))return false
 const enc=new TextEncoder()
 const aa=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(a)))
 const bb=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(b)))
 let unequal=0
 for(let i=0;i<aa.length;i++)unequal|=aa[i]^bb[i]
 return unequal===0
}
async function query(db,name,args){
 const {data,error}=await db.rpc(name,args)
 if(error)throw Error(error.code==='40001'?'MODEL_REVISION_CONFLICT':'MODEL_STORAGE_ERROR')
 return data
}
export async function handleCloudModelEdgeRequest(req,{token,ownerUid,db}){
 if(req.method!=='POST')return json({error:'POST_ONLY'},405)
 if(req.headers.has('origin'))return json({error:'BROWSER_ORIGIN_REJECTED'},403)
 if(!HEX.test(token??'')||!UUID.test(ownerUid??'')||typeof db?.rpc!=='function')
  return json({error:'CLOUD_MODEL_NOT_CONFIGURED'},503)
 const auth=req.headers.get('authorization')??''
 if(!auth.startsWith('Bearer ')||!await equalToken(auth.slice(7),token))
  return json({error:'MODEL_OWNER_TOKEN_REQUIRED'},401)
 if(Number(req.headers.get('content-length')??'0')>16384)
  return json({error:'MODEL_REQUEST_TOO_LARGE'},413)
 let frame
 try {
  const raw=await req.text()
  if(new TextEncoder().encode(raw).length>16384)throw Error('too-big')
  frame=JSON.parse(raw)
 } catch {return rpcError(null,-32700,'Invalid bounded JSON')}
 if(!obj(frame)||frame.jsonrpc!=='2.0'||typeof frame.method!=='string')
   return rpcError(frame?.id??null,-32600,'Invalid JSON-RPC frame')
 const id=typeof frame.id==='string'||typeof frame.id==='number'?frame.id:null
 if(id===null||frame.method==='notifications/initialized')
   return new Response(null,{status:202,headers})
 if(frame.method==='initialize')
   return packet(id,{protocolVersion:'2025-06-18',
     capabilities:{tools:{listChanged:false}},
     serverInfo:{name:'lizhi-model-cloud-direct',version:'3.0.0'}})
 if(frame.method==='tools/list')return packet(id,{tools:CLOUD_MODEL_TOOLS})
 if(frame.method==='ping')return packet(id,{})
 if(frame.method!=='tools/call')return rpcError(id,-32601,'Unknown method')
 const call=frame.params
 if(!obj(call)||typeof call.name!=='string')return rpcError(id,-32602,'Invalid tool request')
 const valid=validateCloudModelTool(call.name,call.arguments??{})
 if(!valid.ok)return fail(id,valid.code)
 const a=valid.args
 try {
  if(call.name==='model_status'||call.name==='model_list_documents'){
   const list=await query(db,'lizhi_model_cloud_list',{p_owner:ownerUid})
   if(!Array.isArray(list)||list.length>100)return fail(id,'MODEL_BAD_DOCUMENT_LIST')
   return success(id,call.name==='model_status'?
     {ok:true,mode:'cloud_direct',requires_browser:false,
      requires_page_consent:false,document_count:list.length}:
     {ok:true,documents:list})
  }
  if(call.name==='model_scene'){
   const doc=await query(db,'lizhi_model_cloud_get',
     {p_owner:ownerUid,p_document:a.document_id})
   if(!obj(doc)||!UUID.test(doc.document_id??'')||
      !Number.isSafeInteger(doc.revision)||!Array.isArray(doc.entities))
    return fail(id,'MODEL_DOCUMENT_NOT_FOUND')
   return success(id,{ok:true,...doc})
  }
  const op=call.name==='model_new_document'?'new_document':
    call.name==='model_create_box'?'create_box':'move'
  const args=op==='new_document'?{name:a.name}:
    op==='create_box'?{
      origin_mm:a.origin_mm,width_mm:a.width_mm,
      depth_mm:a.depth_mm,height_mm:a.height_mm,...(a.name?{name:a.name}:{})}
    :{entity_id:a.entity_id,translation_mm:a.translation_mm}
  const write=await query(db,'lizhi_model_cloud_write',{
    p_owner:ownerUid,p_request:a.request_id,p_op:op,
    p_document:op==='new_document'?null:a.document_id,
    p_revision:op==='new_document'?null:a.revision,p_args:args
  })
  if(!obj(write)||write.ok!==true||!UUID.test(write.document_id??'')||
     !Number.isSafeInteger(write.revision)||write.native_hew_saved!==false)
   return fail(id,'MODEL_PERSISTENCE_RECEIPT_INVALID')
  return success(id,{...write,mode:'cloud_direct',requires_browser:false})
 }catch(e){
  return fail(id,e instanceof Error&&e.message==='MODEL_REVISION_CONFLICT'?
    'MODEL_REVISION_CONFLICT':'MODEL_STORAGE_FAILED_DO_NOT_RETRY')
 }
}
