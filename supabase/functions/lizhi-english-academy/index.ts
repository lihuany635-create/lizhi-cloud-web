// Candidate Supabase Edge Function wrapper only. Not deployed.
// Authentication and ownership checks live in p1-handler.mjs.
// P10 safeguard: ALL non-transactional English writes (even candidates) blocked.
// This intentionally limits the preview until a trusted atomic workflow exists.
import { handleP1Request } from '../../../english-academy/api/p1-handler.mjs';
import {createP10FailClosedEdge} from '../../../english-academy/p10/fail-closed-edge.mjs';
// No direct writes until the reviewed transactional session+approval endpoints exist.
const guardedP1=createP10FailClosedEdge({delegate:handleP1Request});

Deno.serve((req:Request) => guardedP1(req,{
  SUPABASE_URL:Deno.env.get('SUPABASE_URL')||'',
  SUPABASE_ANON_KEY:Deno.env.get('SUPABASE_ANON_KEY')||'',
  SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',
  ENGLISH_ALLOWED_ORIGIN:Deno.env.get('ENGLISH_ALLOWED_ORIGIN')||
    'https://lihuany635-create.github.io'
}));
