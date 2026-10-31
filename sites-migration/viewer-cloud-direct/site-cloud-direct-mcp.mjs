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
export function viewerCloudToMcpContent(result){
 if(result?.ok===true&&result?.image?.mimeType==='image/jpeg'
   &&typeof result.image.data==='string'
   &&result.image.data.startsWith('/9j/')
   &&result.image.data.length<=350000){
  const {image,...metadata}=result;
  return [{type:'text',text:JSON.stringify(metadata)},
   {type:'image',mimeType:'image/jpeg',data:image.data}];
 }
 return [{type:'text',text:JSON.stringify(result)}];
}
