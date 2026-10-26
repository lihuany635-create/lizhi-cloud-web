/** SERVER ONLY: Site v3 direct cloud 3D tool adapter. No browser/Hew lease. */
import {CLOUD_MODEL_TOOLS,validateCloudModelTool} from '../../hew/cloud-direct/model-site-contract.mjs'
export const cloudModelSiteTools=CLOUD_MODEL_TOOLS
export const CLOUD_MODEL_UPSTREAM=
 'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-model-site-mcp?cloud=1'
const HEX=/^[0-9a-f]{64,128}$/i
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)
const fail=code=>({isError:true,content:[{type:'text',text:code}]})
async function readBounded(resp){
 const n=resp.headers.get('content-length')
 if(n!==null&&(!/^\d+$/.test(n)||Number(n)>32768))throw Error('MODEL_RESPONSE_OVERSIZE')
 const text=await resp.text()
 if(new TextEncoder().encode(text).length>32768)throw Error('MODEL_RESPONSE_OVERSIZE')
 return JSON.parse(text)
}
export async function handleCloudModelSiteTool(name,args,trustedAuth,serverSecrets,fetcher=fetch){
 const c=validateCloudModelTool(name,args)
 if(!c.ok)return fail(c.code)
 if(trustedAuth?.signedIn!==true||typeof trustedAuth?.verifiedUserEmail!=='string')
  return fail('MODEL_OWNER_AUTH_REQUIRED')
 const email=serverSecrets?.ownerEmail
 if(typeof email!=='string'||trustedAuth.verifiedUserEmail.trim().toLowerCase()!==
  email.trim().toLowerCase())return fail('MODEL_OWNER_ACCESS_DENIED')
 const token=serverSecrets?.siteMcpToken
 if(!HEX.test(token??''))return fail('MODEL_SITE_NOT_CONFIGURED')
 const controller=new AbortController()
 const timeout=setTimeout(()=>controller.abort(),18000)
 try{
  const id=crypto.randomUUID()
  const response=await fetcher(CLOUD_MODEL_UPSTREAM,{
   method:'POST',redirect:'manual',signal:controller.signal,
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},
   body:JSON.stringify({jsonrpc:'2.0',id,method:'tools/call',params:{name,arguments:c.args}})
  })
  if(response.status>=300&&response.status<400)return fail('MODEL_REDIRECT_REFUSED_DO_NOT_RETRY')
  if(response.status===401)return fail('MODEL_UPSTREAM_UNAUTHORIZED')
  if(response.status===403)return fail('MODEL_UPSTREAM_FORBIDDEN')
  if(response.status===503)return fail('MODEL_UPSTREAM_UNAVAILABLE')
  if(!response.ok)return fail('MODEL_UPSTREAM_HTTP_'+response.status)
  const rpc=await readBounded(response)
  if(!obj(rpc)||rpc.jsonrpc!=='2.0'||rpc.id!==id||!obj(rpc.result)||
    typeof rpc.result.isError!=='boolean'||!Array.isArray(rpc.result.content)||
    rpc.result.content.length!==1||rpc.result.content[0].type!=='text'||
    typeof rpc.result.content[0].text!=='string')
    return fail('MODEL_RESULT_UNKNOWN_DO_NOT_RETRY')
  if(rpc.result.isError)return fail(rpc.result.content[0].text.slice(0,200))
  const data=JSON.parse(rpc.result.content[0].text)
  if(!obj(data)||data.ok!==true)return fail('MODEL_INVALID_PERSISTENCE_REPLY')
  return {isError:false,content:[{type:'text',text:JSON.stringify(data)}]}
 }catch(e){
  if(e instanceof Error&&e.name==='AbortError')return fail('MODEL_TIMEOUT_DO_NOT_RETRY')
  return fail('MODEL_RESULT_UNKNOWN_DO_NOT_RETRY')
 }finally{clearTimeout(timeout)}
}
