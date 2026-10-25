import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.75.0";
import {handleModelEdgeRequest} from "./edge-core.mjs";

// ISOLATED CANDIDATE. Do not deploy to production until the SQL RLS,
// private ChatGPT Site OAuth/session, user opt-in and real Hew E2E are proven.
// Secrets only on the Edge server. Never expose service_role to web or Sites.
const endpoint=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const token=Deno.env.get("LIZHI_MODEL_SITE_MCP_TOKEN")??"";
const ownerUid=Deno.env.get("LIZHI_MODEL_SITE_OWNER_UID")??"";
const db=endpoint&&serviceKey?
  createClient(endpoint,serviceKey,{
    auth:{persistSession:false,autoRefreshToken:false},
    global:{headers:{"Cache-Control":"no-store"}}
  }):null;

Deno.serve((request:Request)=>handleModelEdgeRequest(request,{
  db,token,ownerUid
}));
