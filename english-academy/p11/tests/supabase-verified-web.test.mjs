import test from 'node:test';
import assert from 'node:assert/strict';
import {createP11SupabaseTrustedWeb} from '../supabase-verified-web.mjs';
const owner='4efc178f-e255-4e87-9197-d1b286ef892e';
const session='d2a34502-7256-47c3-8c5e-3a9e1b4f54d1';
const base='https://synthetic-project.supabase.co';
const env={SUPABASE_URL:base,SUPABASE_ANON_KEY:'synthetic-anon-only',
 SUPABASE_SERVICE_ROLE_KEY:'synthetic-service-only'};
function makeJwt(mods={}){
 const claims={iss:base+'/auth/v1',aud:'authenticated',role:'authenticated',
  sub:owner,session_id:session,exp:Date.now()/1000+600,...mods};
 return 'synthetic.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.synthetic';
}
function fixture({revoked=false,provider='google',ownerAllowed=true}={}){
 const calls=[];
 const fetchImpl=async(url,init)=>{
  calls.push({url,init});
  if(url.endsWith('/auth/v1/user'))
   return Response.json({id:owner,app_metadata:{provider}});
  if(url.includes('english_authorized_users'))
   return Response.json(ownerAllowed?[{owner_id:owner}]:[]);
  if(url.endsWith('/rpc/english_web_session_active'))return Response.json(!revoked);
  if(url.includes('/rpc/english_web_create_candidate'))
   return Response.json({status:'pending',id:'fake-candidate'});
  if(url.includes('english_card_candidates?'))
   return Response.json([{id:'fake-candidate',owner_id:owner,term:'museum',
    meaning_zh:'博物館',status:'pending'}]);
  return Response.json({code:'UNKNOWN'}, {status:404});
 };
 return {adapter:createP11SupabaseTrustedWeb({env,fetchImpl}),calls};
}
test('verified Google user, allowlist, JWT owner/session and active auth.sessions are mandatory',async()=>{
 const f=fixture();
 const actor=await f.adapter.verifyOwner({bearer:makeJwt()});
 assert.equal(actor.serverVerified,true);
 assert.equal(actor.ownerId,owner);
 assert.equal(actor.sessionId,session);
 assert.equal(actor.identityType,'google-user');
 assert.ok(f.calls.some(x=>x.url.endsWith('/rpc/english_web_session_active')));
 assert.ok(f.calls.some(x=>x.url.includes('english_authorized_users')));
 assert.ok(f.calls.every(x=>x.url.startsWith(base+'/')));
});
test('revoked session, non-Google identity, or missing owner allowlist are denied',async()=>{
 for(const options of [{revoked:true},{provider:'email'},{ownerAllowed:false}]){
  const f=fixture(options);
  await assert.rejects(f.adapter.verifyOwner({bearer:makeJwt()}));
 }
});
test('claims cannot spoof a different owner or issuer after Auth validation',async()=>{
 const f=fixture();
 for(const mods of [{sub:'fffebc22-39cc-4cd8-a812-988818400823'},
  {session_id:'not-a-uuid'},{iss:'https://attacker.example/auth/v1'},
  {aud:'anon'},{role:'service_role'},{exp:1}]){
  await assert.rejects(f.adapter.verifyOwner({bearer:makeJwt(mods)}));
 }
});
test('server-only selects force owner scope and RPCs can only use allowlisted names',async()=>{
 const f=fixture();
 const rows=await f.adapter.trustedDb.select('english_card_candidates',
  {ownerId:owner,filters:{status:'pending'},limit:10});
 assert.equal(rows[0].owner_id,owner);
 const call=f.calls.at(-1);
 const url=new URL(call.url);
 assert.equal(url.searchParams.get('owner_id'),'eq.'+owner);
 assert.equal(url.searchParams.get('status'),'eq.pending');
 assert.match(call.init.headers.authorization,/^Bearer synthetic-service-only$/);
 const result=await f.adapter.trustedDb.rpc('english_web_create_candidate',
   {p_owner_id:owner,p_request_id:'synthetic-123456',p_term:'museum',p_meaning_zh:'博物館'});
 assert.equal(result.status,'pending');
 await assert.rejects(f.adapter.trustedDb.select('auth.users',{ownerId:owner}));
 await assert.rejects(f.adapter.trustedDb.rpc('arbitrary_sql',{p_owner_id:owner}));
});
test('no env, host spoof or malformed access token may silently grant authorization',async()=>{
 assert.throws(()=>createP11SupabaseTrustedWeb({env:{
  ...env,SUPABASE_URL:'https://attacker.example'}}),/ENV_REQUIRED/);
 const f=fixture();
 await assert.rejects(f.adapter.verifyOwner({bearer:'not-a-jwt'}));
});
