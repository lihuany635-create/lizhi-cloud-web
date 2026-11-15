// P7 safe candidate wrapper for the undeployed P1 Supabase Edge entrypoint.
// Unlike UI-supplied userConfirmed, a formal write requires independently
// verified owner consent and atomic backend execution (not provided yet).
// Until implemented, all formal writes FAIL CLOSED.
const cleanResponse=(status,code)=>new Response(JSON.stringify({code}),{
 status,headers:{'content-type':'application/json','cache-control':'no-store'}
});
const FORMAL=new Set(['card','accept','ignore']);
const PASS_GET=new Set(['status','candidates','cards']);
const pathOf=req=>{
 try{return new URL(req.url).pathname.split('/').filter(Boolean).at(-1)??''}
 catch{return ''}
};
export function createSafeP1EdgeCandidate({delegate}={}){
 if(typeof delegate!=='function')throw new TypeError('TRUSTED_P1_DELEGATE_REQUIRED');
 return async function protectedP1(req,env,fetchImpl){
   if(!(req instanceof Request))return cleanResponse(400,'INVALID_REQUEST');
   const action=pathOf(req);
   if(req.method==='POST'&&FORMAL.has(action))
     return cleanResponse(403,'FORMAL_WRITE_PENDING_TRUSTED_APPROVAL');
   if(req.method==='POST'&&action==='candidate')
     return delegate(req,env,fetchImpl);
   if(req.method==='GET'&&PASS_GET.has(action))
     return delegate(req,env,fetchImpl);
   if(req.method==='OPTIONS')
     return delegate(req,env,fetchImpl);
   return cleanResponse(404,'ACTION_NOT_ENABLED');
 };
}
