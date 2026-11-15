// Candidate Supabase Edge Function wrapper only. Not deployed.
// Authentication and ownership checks live in p1-handler.mjs.
import { handleP1Request } from '../../../english-academy/api/p1-handler.mjs';

Deno.serve((req:Request) => handleP1Request(req,{
  SUPABASE_URL:Deno.env.get('SUPABASE_URL')||'',
  SUPABASE_ANON_KEY:Deno.env.get('SUPABASE_ANON_KEY')||'',
  SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',
  ENGLISH_ALLOWED_ORIGIN:Deno.env.get('ENGLISH_ALLOWED_ORIGIN')||
    'https://lihuany635-create.github.io'
}));
