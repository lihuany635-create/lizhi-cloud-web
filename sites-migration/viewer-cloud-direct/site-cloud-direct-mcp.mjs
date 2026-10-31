import {VIEWER_CLOUD_TOOLS,VIEWER_CLOUD_EDGE} from './site-cloud-direct-tools.mjs';
// Site Worker is responsible for private-Site authentication before invoking.
export async function callViewerCloud({name,args,owner,token,fetcher=fetch}){
 if(!VIEWER_CLOUD_TOOLS.some(t=>t.name===name))throw Error('UNKNOWN_VIEWER_TOOL');
 if(typeof owner!=='string'||!owner.startsWith('appgprj_6ae0c336243881919e9ba2bbf450f1fb:'))throw Error('SITE_OWNER_REQUIRED');
 if(typeof token!=='string'||!/^[a-f0-9]{96}$/.test(token))throw Error('SITE_MCP_SECRET_UNAVAILABLE');
 const r=await fetcher(VIEWER_CLOUD_EDGE,{method:'POST',redirect:'manual',
  headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json','Accept':'application/json'},
  signal:AbortSignal.timeout(20000),
  body:JSON.stringify({kind:'tool',owner,name,args:args||{}})});
 if(!r.ok)throw Error('VIEWER_CLOUD_UPSTREAM_'+r.status);
 const data=await r.json();
 if(!data||typeof data!=='object')throw Error('VIEWER_CLOUD_RESPONSE_INVALID');
 return data;
}

/**
 * Site MCP tools/call response mapping. A base64 JSON string is NOT a
 * vision-readable screenshot: emit a real MCP image content block.
 * Wire this helper into the original private Site after owner auth and
 * callViewerCloud; do not use it for HTTP /api/tool JSON responses.
 */
// Only baseline/progressive JPEGs with the required dimensions become image blocks.
export function isViewerJpeg(data){
 if(typeof data!=='string'||data.length<1000||data.length>350000||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))return false;
 try{
  const b=atob(data),n=b.length,u=i=>b.charCodeAt(i);
  if(u(0)!==255||u(1)!==216||u(n-2)!==255||u(n-1)!==217)return false;
  for(let p=2;p+3<n;){
   if(u(p++)!==255)return false;while(u(p)===255)p++;
   const marker=u(p++);if(marker===218||marker===217)return false;
   if(marker===1||(marker>=208&&marker<=215))continue;
   const len=(u(p)<<8)|u(p+1);if(len<2||p+len>n)return false;
   if(marker===192||marker===194)return len>=8&&((u(p+3)<<8)|u(p+4))===360&&((u(p+5)<<8)|u(p+6))===640;
   p+=len;
  }
 }catch{}
 return false;
}
export function viewerCloudToMcpContent(result){
 if(result?.ok===true&&result?.image?.mimeType==='image/jpeg'&&isViewerJpeg(result.image.data)){
  const {image,...metadata}=result;
  return [{type:'text',text:JSON.stringify(metadata)},{type:'image',mimeType:'image/jpeg',data:image.data}];
 }
 // Malformed image payloads are never echoed as base64 text.
 if(result&&Object.hasOwn(result,'image')){
  const {image,...metadata}=result;
  return [{type:'text',text:JSON.stringify({...metadata,ok:false,code:'INVALID_MCP_JPEG'})}];
 }
 return [{type:'text',text:JSON.stringify(result)}];
}
