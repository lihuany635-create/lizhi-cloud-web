// Candidate route for the EXISTING private Site. Not deployed.
import {env} from 'cloudflare:workers';
// Plain JS module is verified by isolated Node tests.
import {D1Ledger,ManualReadHost,bridgeSource} from '@/lib/ai-loop-v15.mjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 const e=env as unknown as Record<string,any>;
 // Nothing, including grant persistence, is initialised unless explicitly enabled.
 if(e.AI_LOOP_MANUAL_ENABLED!=='true')return Response.json({error:'WORKER_DISABLED'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  // Expected origin is the current, verified owner-private Site; no new Site.
  // Fail closed until a TRUSTED Site runtime supplies a verified principal callback.
  // Environment strings / caller-supplied headers MUST NOT be treated as authentication.
  const verifyIngress=e.AI_LOOP_VERIFIED_INGRESS_CALLBACK;
  if(typeof verifyIngress!=='function')return Response.json({error:'INGRESS_VERIFIER_REQUIRED'},
    {status:503,headers:{'Cache-Control':'no-store'}});
  const host=new ManualReadHost({ledger:new D1Ledger(e.DB),read:bridgeSource(e),
   owner:e.PRODUCTION_CHATGPT_OWNER,origin:'https://lizhi-animation-flow.lihuany635.chatgpt.site',
   enabled:true,verifyIngress});
  return host.handle(req);
 }catch{return Response.json({error:'HOST_UNCONFIGURED'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
