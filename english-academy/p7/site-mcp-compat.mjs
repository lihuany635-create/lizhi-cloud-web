// P7 non-destructive candidate for the existing private Site MCP route.
// This is NOT wired to app/mcp/route.ts and cannot deploy anything.
import { MCP_TOOLS } from '../p3/mcp-server.mjs';
const PHOTO_NAMES=Object.freeze([
 'list_projects','get_project','create_project','list_project_images',
 'read_project_image','import_project_image','update_project_image'
]);
const READ=new Set(['get_learning_profile','get_review_summary','list_card_candidates','get_sync_status']);
const CANDIDATE=new Set(['sync_learning_session','create_card_candidates','record_language_errors']);
const FORMAL='add_vocabulary';
const toolName=name=>'english_'+name;
const validateList=(tools,label)=>{
 if(!Array.isArray(tools)||tools.length===0||
    tools.some(t=>!t||typeof t.name!=='string'||!t.name.trim()))
   throw new TypeError('INVALID_TOOL_LIST:'+label);
 const names=tools.map(t=>t.name);
 if(new Set(names).size!==names.length)throw Error('DUPLICATE_TOOL_NAME:'+label);
 return new Set(names);
};
export function composePrivateSiteCatalog({
  existingTools,legacyBaselineNames,englishTools=MCP_TOOLS,includeFormalWrites=false
}={}){
 const existing=validateList(existingTools,'existing');
 if(!Array.isArray(legacyBaselineNames)||!legacyBaselineNames.length||
    !legacyBaselineNames.every(x=>typeof x==='string'&&x))
   throw new TypeError('BASELINE_INVENTORY_REQUIRED');
 const baseline=new Set(legacyBaselineNames);
 for(const name of baseline)if(!existing.has(name))
   throw Error('LEGACY_TOOL_MISSING:'+name);
 for(const name of PHOTO_NAMES)if(!existing.has(name))
   throw Error('PHOTO_TOOL_MISSING:'+name);
 if(![...existing].some(x=>x.startsWith('aiwb_')))
   throw Error('WORKBENCH_TOOL_MISSING');
 validateList(englishTools,'english');
 const added=[];
 for(const item of englishTools){
   if(item.name===FORMAL&&!includeFormalWrites)continue;
   if(!READ.has(item.name)&&!CANDIDATE.has(item.name)&&item.name!==FORMAL)
     throw Error('UNRECOGNIZED_ENGLISH_TOOL');
   const prefixed=toolName(item.name);
   if(existing.has(prefixed))throw Error('MCP_TOOL_COLLISION:'+prefixed);
   added.push({...item,name:prefixed});
 }
 // Stable order of every existing tool is preserved. No shadowing, replacing,
 // truncating or filtering the original AI workbench/photo/side/licit tools.
 return {tools:[...existingTools.map(x=>({...x})),...added],
   originalCount:existingTools.length,englishCount:added.length,
   preservedNames:[...existing],safeForProduction:false};
}
const code=(value)=>({ok:false,code:value,retryable:false});
export function createPrivateSiteEnglishDispatcher({
  verifySiteOwner,invokeEnglish,formalWriteEnabled=false,consumeApproval
}={}){
 if(typeof verifySiteOwner!=='function'||typeof invokeEnglish!=='function')
   throw new TypeError('TRUSTED_SITE_DISPATCH_REQUIRED');
 return async function dispatch({request,toolName:requestedName,arguments:args={}}={}){
   if(!(request instanceof Request)||!requestedName?.startsWith('english_')||
      !args||typeof args!=='object'||Array.isArray(args))
     return code('INVALID_ENGLISH_TOOL_CALL');
   const inner=requestedName.slice(8);
   const kind=READ.has(inner)?'read':CANDIDATE.has(inner)?'candidate':
      inner===FORMAL?'formal':'unknown';
   if(kind==='unknown')return code('UNKNOWN_TOOL');
   const clean={...args};
   if(Object.keys(clean).some(x=>['ownerId','userId','approved','userConfirmed',
     'scope','scopes','googleEmail'].includes(x)))return code('FORGED_OWNER_OR_APPROVAL');
   let actor;
   try{actor=await verifySiteOwner({request});}
   catch{return code('SITE_IDENTITY_DENIED');}
   if(actor?.serverVerified!==true||typeof actor.ownerId!=='string'||
      !Array.isArray(actor.scopes))return code('SITE_IDENTITY_DENIED');
   const required=kind==='read'?'english:read':
     kind==='candidate'?'english:candidate':'english:formal_write';
   if(!actor.scopes.includes(required))return code('SCOPE_DENIED');
   if(kind==='formal'){
     if(!formalWriteEnabled||typeof consumeApproval!=='function')
       return code('FORMAL_WRITE_NOT_APPROVED');
     // Approval is action-bound and atomically consumed by trusted backend.
     try{
       const evidence=await consumeApproval({actor,action:'create_formal_card',requestId:clean.requestId,
         approvalId:clean.approvalId,payload:{term:clean.term,meaningZh:clean.meaningZh,
           senseKey:clean.senseKey??''}});
       if(evidence?.verified!==true||evidence.ownerId!==actor.ownerId||
          evidence.oneTime!==true)return code('FORMAL_WRITE_NOT_APPROVED');
     }catch{return code('FORMAL_WRITE_NOT_APPROVED');}
     delete clean.approvalId;
   }
   // The owner is always from the trusted Site registry. The backend must
   // additionally enforce allowed session, idempotency and RLS.
   try{return await invokeEnglish({actor,toolName:inner,arguments:clean});}
   catch{return code('ENGLISH_UPSTREAM_UNAVAILABLE');}
 };
}
export const PRIVATE_PHOTO_TOOL_NAMES=PHOTO_NAMES;
