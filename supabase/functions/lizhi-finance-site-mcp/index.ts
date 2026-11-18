import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.109.0";
import {handleFinanceSiteRequest} from "./edge-core.mjs";
import {createGoalsBrowserBridge} from "./finance-goals-browser-bridge.mjs";

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

const browserBridge=createGoalsBrowserBridge({
  db,ownerUid,secret:token,
  // Only configured trusted Finance origins may call the browser bridge.
  // Do not include a wildcard. Unconfigured features stay disabled.
  origins:(Deno.env.get("LIZHI_FINANCE_GOALS_ORIGINS")||"").split(",")
    .map(x=>x.trim()).filter(Boolean),
  verifyUser:async jwt=>{
    if(!db?.auth?.getUser)return null;
    const {data,error}=await db.auth.getUser(jwt);
    if(error||!data?.user?.id)return null;
    return data.user;
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
