import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.75.0";
import {handleModelEdgeRequest} from "./edge-core.mjs";
import {handleCloudModelEdgeRequest} from "./cloud-edge-core.mjs";

// ISOLATED CANDIDATE. Do not deploy to production until the SQL RLS,
// private ChatGPT Site OAuth/session, user opt-in and real Hew E2E are proven.
// Secrets only on the Edge server. Never expose service_role to web or Sites.
const endpoint=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const token=Deno.env.get("LIZHI_MODEL_SITE_MCP_TOKEN")??"";
const ownerUid=Deno.env.get("LIZHI_MODEL_SITE_OWNER_UID")??"";
// Optional: start the cloud Hew worker (GitHub Actions repository_dispatch).
const dispatchToken=Deno.env.get("LIZHI_MODEL_WORKER_DISPATCH_TOKEN")??"";
const workerRepo=Deno.env.get("LIZHI_MODEL_WORKER_REPO")??"";
const dispatchWorker=dispatchToken&&/^[\w.-]+\/[\w.-]+$/.test(workerRepo)?async()=>{
  const r=await fetch(`https://api.github.com/repos/${workerRepo}/dispatches`,{method:"POST",
    headers:{Authorization:`Bearer ${dispatchToken}`,Accept:"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"},
    body:JSON.stringify({event_type:"lizhi-hew-cloud-job"})});
  return r.status===204;
}:null;
const db=endpoint&&serviceKey?
  createClient(endpoint,serviceKey,{
    auth:{persistSession:false,autoRefreshToken:false},
    global:{headers:{"Cache-Control":"no-store"}}
  }):null;

// v2 /mcp remains unchanged; v3 cloud-direct is explicitly opt-in via
// the server-only Site adapter's query flag until private Site v3 is published.
Deno.serve((request:Request)=>{
  const cloud=new URL(request.url).searchParams.get('cloud')==='1';
  return cloud
   ? handleCloudModelEdgeRequest(request,{db,token,ownerUid})
   : handleModelEdgeRequest(request,{db,token,ownerUid,dispatchWorker});
});
