// Existing English Academy Edge entrypoint. Candidate only; NOT deployed.
// The P10 fail-closed guard remains the default. Enabling P11 requires an
// explicitly approved production release AND deployed reviewed P1/P5/P6/P7/P11
// schemas, so a code commit cannot activate data writes.
import {handleP1Request} from '../../../english-academy/api/p1-handler.mjs';
import {createP10FailClosedEdge} from '../../../english-academy/p10/fail-closed-edge.mjs';
import {createP11WebCardApi} from '../../../english-academy/p11/web-card-api.mjs';
import {createP11SupabaseTrustedWeb} from '../../../english-academy/p11/supabase-verified-web.mjs';
import {createProductionEnglishMcp} from '../../../english-academy/p12/production-mcp.mjs';

const guardedP1=createP10FailClosedEdge({delegate:handleP1Request});
Deno.serve(async(req:Request)=>{
 const env={
   SUPABASE_URL:Deno.env.get('SUPABASE_URL')||'',
   SUPABASE_ANON_KEY:Deno.env.get('SUPABASE_ANON_KEY')||'',
   SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',
   ENGLISH_ALLOWED_ORIGIN:Deno.env.get('ENGLISH_ALLOWED_ORIGIN')||
     'https://lihuany635-create.github.io'
 };
 // The original private Site supplies its existing server-only bridge key.
 // SQL resolves/rechecks the original owner binding and English consent.
 if(new URL(req.url).pathname.split('/').filter(Boolean).at(-1)==='mcp'){
  // Explicitly approved owner-only MCP backend. The SQL bridge resolver
  // still denies every unlinked/unauthorized key; a server env setting can
  // shut this namespace down without changing the legacy Site.
  if(Deno.env.get('ENGLISH_P12_MCP_APPROVED')==='false')
   return Response.json({code:'ENGLISH_MCP_NOT_ENABLED'},{status:503});
  try{return await createProductionEnglishMcp({env})(req);}
  catch{return Response.json({code:'ENGLISH_BACKEND_UNAVAILABLE'},{status:503});}
 }
 // Deliberately OFF unless approved as a separate production change.
 if(Deno.env.get('ENGLISH_P11_WEB_WRITES_APPROVED')!=='true')
   return guardedP1(req,env);
 try{
   const {verifyOwner,trustedDb}=createP11SupabaseTrustedWeb({env});
   const handle=createP11WebCardApi({
     verifyOwner,trustedDb,allowedOrigin:env.ENGLISH_ALLOWED_ORIGIN
   });
   return await handle(req);
 }catch{
   return Response.json({code:'ENGLISH_BACKEND_UNAVAILABLE'},
     {status:503,headers:{'cache-control':'no-store'}});
 }
});

