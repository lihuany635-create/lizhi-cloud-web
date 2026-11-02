import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.75.0";
import {handleWorkerRequest} from "./worker-edge-core.mjs";

// REVIEW ONLY until SQL 005 is applied. Server to server: the GitHub Actions
// worker sends LIZHI_MODEL_WORKER_TOKEN; service_role never leaves this function.
const endpoint=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const token=Deno.env.get("LIZHI_MODEL_WORKER_TOKEN")??"";
const ownerUid=Deno.env.get("LIZHI_MODEL_SITE_OWNER_UID")??"";
const db=endpoint&&serviceKey?createClient(endpoint,serviceKey,{
  auth:{persistSession:false,autoRefreshToken:false},
  global:{headers:{"Cache-Control":"no-store"}},
}):null;

Deno.serve((request:Request)=>handleWorkerRequest(request,{token,ownerUid,db}));
