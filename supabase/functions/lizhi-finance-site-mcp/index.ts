import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.109.0";
import {handleFinanceSiteRequest} from "./edge-core.mjs";

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

Deno.serve(request=>handleFinanceSiteRequest(request,{db,token,ownerUid}));
