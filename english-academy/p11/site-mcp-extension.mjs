// P11: existing private Site MCP route extension, candidate-only.
// Import/call from the EXISTING Site /mcp handler after obtaining its original
// tools/list result. No alternative Site, no production fetch or credentials.
import {MCP_TOOLS} from '../p3/mcp-server.mjs';
import {composePrivateSiteCatalog, createPrivateSiteEnglishDispatcher} from '../p7/site-mcp-compat.mjs';

const jsonrpc=(id,result)=>({jsonrpc:'2.0',id,result});
const fail=(id,code)=>jsonrpc(id,{content:[{type:'text',text:JSON.stringify({
  ok:false,code,retryable:false
})}],isError:true});
const validated=(x)=>x&&typeof x==='object'&&!Array.isArray(x);
const resultIsError=(x)=>x?.ok===false||x?.isError===true;
function toolResult(out){
 if(out?.content&&Array.isArray(out.content))return out;
 return {content:[{type:'text',text:JSON.stringify(out)}],isError:resultIsError(out)};
}
// Original tools MUST remain the primary handler; this module is only an extension.
export function createExistingSiteEnglishExtension({
 isReady,verifySiteOwner,invokeEnglish,baselineNames
}={}){
 if(typeof isReady!=='function'||typeof verifySiteOwner!=='function'||
    typeof invokeEnglish!=='function'||!Array.isArray(baselineNames)||
    !baselineNames.length||baselineNames.some(s=>typeof s!=='string'||!s))
   throw new TypeError('TRUSTED_SITE_DEPENDENCIES_REQUIRED');

 const englishTools=MCP_TOOLS.filter(t=>t.name!=='add_vocabulary');
 const readTools=new Set(['get_learning_profile','get_review_summary',
   'list_card_candidates','get_sync_status']);
 async function ready(request){
   try{return await isReady({request})===true;}catch{return false;}
 }
 async function verifiedActor(request){
   try{
     const actor=await verifySiteOwner({request});
     if(actor?.serverVerified!==true||typeof actor.ownerId!=='string'||
        !Array.isArray(actor.scopes)||!actor.scopes.includes('english:read'))return null;
     return actor;
   }catch{return null;}
 }
 const toolNames=new Set(englishTools.map(t=>'english_'+t.name));
 const dispatch=createPrivateSiteEnglishDispatcher({
   verifySiteOwner,invokeEnglish,formalWriteEnabled:false
 });

 async function toolsList({request,existingReply}){
   if(!(request instanceof Request)||!validated(existingReply))throw new TypeError('INVALID_BASELINE_RESPONSE');
   // Validate original catalog before doing anything. Never fake/replace a
   // legacy catalog or discard images/structured tool metadata.
   const base=existingReply.result?.tools;
   if(!Array.isArray(base))throw new TypeError('ORIGINAL_SITE_CATALOG_UNAVAILABLE');
   if(!await ready(request))return existingReply;
   const actor=await verifiedActor(request);
   if(!actor)return existingReply;
   const allowed=englishTools.filter(t=>readTools.has(t.name)||
     actor.scopes.includes('english:candidate'));
   const catalog=composePrivateSiteCatalog({
     existingTools:base,legacyBaselineNames:baselineNames,
     englishTools:allowed,includeFormalWrites:false
   });
   return {...existingReply,result:{...existingReply.result,tools:catalog.tools}};
 }
 async function toolCall({request,body}){
   const id=body?.id??null;
   const name=body?.params?.name;
   if(!validated(body)||body.method!=='tools/call'||typeof name!=='string'||
      !(request instanceof Request))return fail(id,'INVALID_MCP_CALL');
   if(!name.startsWith('english_'))return null; // Do not intercept existing tools.
   if(!toolNames.has(name))return fail(id,'ENGLISH_TOOL_NOT_EXPOSED');
   if(!await ready(request))return fail(id,'ENGLISH_NOT_CONFIGURED');
   const args=body.params?.arguments??{};
   if(!validated(args))return fail(id,'INVALID_ARGUMENTS');
   const out=await dispatch({request,toolName:name,arguments:args});
   return jsonrpc(id,toolResult(out));
 }
 return Object.freeze({toolsList,toolCall,englishToolNames:[...toolNames]});
}
