// Candidate hook to mount English tools on the SAME private Site route.
// Usage in the existing Site only after obtaining verified auth/owner, backend
// and existing live tool inventory. This module does not deploy, create Sites,
// read secrets, or network-fetch an API. Original route remains authoritative.
import {createExistingSiteEnglishExtension} from './site-mcp-extension.mjs';

export function mountEnglishOnExistingSite({
 postOriginal,isReady,verifySiteOwner,invokeEnglish,baselineNames
}={}){
 if(typeof postOriginal!=='function')throw new TypeError('ORIGINAL_SITE_HANDLER_REQUIRED');
 const extension=createExistingSiteEnglishExtension({
  isReady,verifySiteOwner,invokeEnglish,baselineNames
 });
 return async function postSite(request){
  if(!(request instanceof Request))throw new TypeError('INVALID_REQUEST');
  if(request.method!=='POST')return postOriginal(request);
  let rpc;
  try{rpc=await request.clone().json()}catch{return postOriginal(request);}
  if(rpc?.method==='tools/call'&&
      typeof rpc.params?.name==='string'&&rpc.params.name.startsWith('english_')){
   try{
    const out=await extension.toolCall({request,body:rpc});
    return Response.json(out,{headers:{'cache-control':'no-store'}});
   }catch{
    // Fail closed: never let English requests reach old tools on an exception.
    return Response.json({jsonrpc:'2.0',id:rpc.id??null,result:{
     content:[{type:'text',text:JSON.stringify({ok:false,code:'ENGLISH_NOT_AVAILABLE'})}],
     isError:true
    }},{headers:{'cache-control':'no-store'}});
   }
  }
  const original=await postOriginal(request);
  if(rpc?.method!=='tools/list'||!original.ok)return original;
  let payload;
  try{payload=await original.clone().json()}catch{return original;}
  try{
   const combined=await extension.toolsList({request,existingReply:payload});
   return Response.json(combined,{headers:{'cache-control':'no-store'}});
  }catch{
   // Original Site must never be unavailable because the English extension
   // lacks a current baseline or its candidate service is offline.
   return original;
  }
 };
}
