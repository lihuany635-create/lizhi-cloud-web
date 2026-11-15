// Candidate Supabase Edge Function wrapper only. Not deployed.
// Authentication and ownership checks live in p1-handler.mjs.
// P7 safeguard: direct formal-card mutation blocked until trusted server consent RPC exists.
import { handleP1Request } from '../../../english-academy/api/p1-handler.mjs';
import {createSafeP1EdgeCandidate} from '../../../english-academy/p7/safe-p1-edge.mjs';
const guardedP1=createSafeP1EdgeCandidate({delegate:handleP1Request});

Deno.serve((req:Request) => guardedP1(req,{
  SUPABASE_URL:Deno.env.get('SUPABASE_URL')||'',
  SUPABASE_ANON_KEY:Deno.env.get('SUPABASE_ANON_KEY')||'',
  SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',
  ENGLISH_ALLOWED_ORIGIN:Deno.env.get('ENGLISH_ALLOWED_ORIGIN')||
    'https://lihuany635-create.github.io'
}));
