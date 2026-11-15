// P10 fail-closed wrapper for the UNDEPLOYED English Edge candidate.
// P1 candidate creation and audit are two separate writes; until there is a
// reviewed atomic, session-scoped server workflow, deny all direct writes.
// Not a migration or an authorization layer by itself.
const GET=new Set(['status','candidates','cards']);
const MUTATING=new Set(['candidate','card','accept','ignore']);
const response=(status,code,origin)=>new Response(JSON.stringify({code}),{
  status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'vary':'Origin',
    ...(origin?{'access-control-allow-origin':origin}:{})
  }
});
export function createP10FailClosedEdge({
  delegate,allowedOrigin='https://lihuany635-create.github.io'
}={}){
 if(typeof delegate!=='function'||!/^https:\/\/[^/?#]+$/.test(allowedOrigin))
   throw new TypeError('TRUSTED_EDGE_CANDIDATE_REQUIRED');
 return async function handle(req,env,fetchImpl){
   if(!(req instanceof Request))return response(400,'INVALID_REQUEST',null);
   let action;
   try{action=new URL(req.url).pathname.split('/').filter(Boolean).at(-1)||'';}
   catch{return response(400,'INVALID_URL',null);}
   const origin=req.headers.get('origin')===allowedOrigin?allowedOrigin:null;
   if(req.method==='OPTIONS')return delegate(req,env,fetchImpl);
   if(!origin)return response(403,'ORIGIN_NOT_ALLOWED',null);
   if(req.method==='POST'&&MUTATING.has(action))
     return response(403,'P10_TRUSTED_ATOMIC_WRITE_NOT_READY',origin);
   if(req.method==='GET'&&GET.has(action))
     return delegate(req,env,fetchImpl);
   return response(404,'UNEXPOSED_ENGLISH_ACTION',origin);
 };
}
