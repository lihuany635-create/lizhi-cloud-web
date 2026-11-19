import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.109.0";
import {handleFinanceSiteRequest} from "./edge-core.mjs";
import {createGoalsBrowserBridge} from "./finance-goals-browser-bridge.mjs";
import {verifiedFirstPartyClaims} from "./finance-goals-auth-claims.mjs";

/** 
 * Separate from OAuth Finance MCP: private ChatGPT Sites server-to-server route.
 * FAIL CLOSED until both server secrets are configured. Site must authenticate
 * its private owner BEFORE forwarding a server-only bearer. No CORS.
 * Never return, log or store the service-role key or site bearer.
 */
const url=Deno.env.get("SUPABASE_URL")||"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const token=Deno.env.get("LIZHI_FINANCE_SITE_MCP_TOKEN")||"";
const ownerUid=Deno.env.get("LIZHI_FINANCE_SITE_OWNER_UID")||"";
const db=url&&serviceKey?createClient(url,serviceKey,{
  auth:{persistSession:false,autoRefreshToken:false}
}):null;

// Browser read requests must use an actual first-party Supabase session.
// A verified OAuth client_id is never a valid Finance browser principal.
const publicKey=Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||
 Deno.env.get("SUPABASE_ANON_KEY")||"";
const browserBridge=createGoalsBrowserBridge({
  db,ownerUid,
  origins:(Deno.env.get("LIZHI_FINANCE_GOALS_ORIGINS")||"").split(",")
    .map(x=>x.trim()).filter(Boolean),
  verifyUser:async (jwt:string)=>{
    if(!db?.auth?.getUser||!publicKey||!url)return null;
    // getUser(jwt) authenticates the token BEFORE any decoded claim is trusted.
    const {data,error}=await db.auth.getUser(jwt);
    if(error||!data?.user?.id)return null;
    const claims=verifiedFirstPartyClaims(jwt,data.user.id);
    if(!claims)return null;
    // The service role bypasses RLS. Check the original allowlist with the
    // owner's own JWT instead, and require an exact true response.
    const userDb=createClient(url,publicKey,{
      auth:{persistSession:false,autoRefreshToken:false},
      global:{headers:{Authorization:"Bearer "+jwt}}
    });
    const result=await userDb.rpc("lizhi_web_is_allowed");
    if(result.error||result.data!==true)return null;
    return {id:data.user.id,firstParty:true,allowlisted:true};
  }
});
Deno.serve(request=>{
  const pathname=new URL(request.url).pathname;
  if(pathname.endsWith("/ui/goals")){
    if(Deno.env.get("LIZHI_FINANCE_GOALS_BROWSER_ENABLED")!=="true")
      return Response.json({ok:false,code:"GOALS_NOT_CONNECTED"},{status:503,
        headers:{"cache-control":"no-store"}});
    return browserBridge.handle(request);
  }
  return handleFinanceSiteRequest(request,{db,token,ownerUid,
    goalToolsEnabled:Deno.env.get("LIZHI_FINANCE_GOALS_MCP_ENABLED")==="true"});
});
