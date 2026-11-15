import test from 'node:test';
import assert from 'node:assert/strict';
import {handleP1Request,isVerifiedGoogleAccount,normalizeTerm} from '../api/p1-handler.mjs';

const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const candidate='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const origin='https://lihuany635-create.github.io';
const base='https://fake-supabase.local';
const env={
 SUPABASE_URL:base,
 SUPABASE_ANON_KEY:'test-anon-key',
 SUPABASE_SERVICE_ROLE_KEY:'test-service-key',
 ENGLISH_ALLOWED_ORIGIN:origin
};
function request(path,method='GET',payload,opts={}){
 const headers={origin,authorization:'Bearer test-jwt',...opts};
 if(payload)headers['content-type']='application/json';
 return new Request('https://fake-endpoint.local/'+path,{
   method,headers,body:payload?JSON.stringify(payload):undefined
 });
}
function mockBackend({google=true,allowed=true,failAuth=false}={}){
 const calls=[];
 async function fakeFetch(input,opts={}){
   const url=String(input);calls.push({url,opts});
   let body;
   if(url.endsWith('/auth/v1/user'))
      return new Response(JSON.stringify(
        google?{id:owner,app_metadata:{providers:['google']}}
        :{id:owner,app_metadata:{providers:['email']}}),{status:failAuth?401:200});
   if(url.includes('english_authorized_users?'))
      return new Response(JSON.stringify(allowed?[{owner_id:owner}]:[]),{status:200});
   if(url.includes('english_cards?'))
      return new Response(JSON.stringify([{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',owner_id:owner,term:'rice'}]),{status:200});
   if(url.includes('english_card_candidates?')&&opts.method==='PATCH')
      return new Response(JSON.stringify([{id:candidate}]),{status:200});
   if(url.includes('english_card_candidates?'))
      return new Response(JSON.stringify([{id:candidate,owner_id:owner,term:'hungry'}]),{status:200});
   if(url.endsWith('english_card_candidates')&&opts.method==='POST')
      return new Response(JSON.stringify([{id:candidate,owner_id:owner}]),{status:201});
   if(url.endsWith('english_cards')&&opts.method==='POST')
      return new Response(JSON.stringify([{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'}]),{status:201});
   if(url.endsWith('english_audit_events'))
      return new Response(JSON.stringify([{id:'an-audit-row'}]),{status:201});
   if(url.endsWith('/rpc/english_promote_candidate'))
      return new Response(JSON.stringify({status:'accepted',card_id:'card'}),{status:200});
   throw new Error('unexpected mock request: '+url);
 }
 return {fakeFetch,calls};
}
async function json(res){return res.json()}
test('verified Google identity requires UUID and google provider',()=>{
 assert.equal(isVerifiedGoogleAccount({id:owner,app_metadata:{providers:['google']}}),true);
 assert.equal(isVerifiedGoogleAccount({id:owner,app_metadata:{provider:'email'}}),false);
 assert.equal(isVerifiedGoogleAccount({id:'not-uuid',app_metadata:{provider:'google'}}),false);
 assert.equal(normalizeTerm('  HAVE   EATEN '),'have eaten');
});
test('unapproved browser origin refused before auth or DB calls',async()=>{
 const {fakeFetch,calls}=mockBackend();
 const r=await handleP1Request(request('status','GET',null,{origin:'https://malicious.example'}),env,fakeFetch);
 assert.equal(r.status,403);assert.equal((await json(r)).code,'ORIGIN_NOT_ALLOWED');
 assert.equal(calls.length,0);
});
test('missing server keys fails closed',async()=>{
 const {fakeFetch}=mockBackend();
 const r=await handleP1Request(request('status'),{...env,SUPABASE_SERVICE_ROLE_KEY:''},fakeFetch);
 assert.equal(r.status,503);
});
test('missing bearer and revoked JWT denied',async()=>{
 const b=mockBackend();
 const a=await handleP1Request(request('cards','GET',null,{authorization:''}),env,b.fakeFetch);
 assert.equal(a.status,401);
 const revoked=mockBackend({failAuth:true});
 const c=await handleP1Request(request('cards'),env,revoked.fakeFetch);
 assert.equal(c.status,401);
});
test('non-Google account or not on server allowlist cannot access',async()=>{
 const p=mockBackend({google:false});
 const a=await handleP1Request(request('cards'),env,p.fakeFetch);assert.equal(a.status,403);
 const q=mockBackend({allowed:false});
 const b=await handleP1Request(request('cards'),env,q.fakeFetch);assert.equal(b.status,403);
});
test('authenticated GET scopes query by verified owner and limits results',async()=>{
 const b=mockBackend();
 const response=await handleP1Request(request('cards'),env,b.fakeFetch);
 assert.equal(response.status,200);
 assert.equal((await response.json()).items[0].owner_id,owner);
 const url=b.calls.at(-1).url;
 assert.ok(url.includes('owner_id=eq.'+owner));
 assert.ok(url.includes('limit=200'));
});
test('candidate POST derives owner ID from validated token, not supplied JSON',async()=>{
 const b=mockBackend();
 const res=await handleP1Request(request('candidate','POST',{
   requestId:'request-candidate-00001',sourceEventId:'chat-00001',
   term:'hungry',meaningZh:'餓',owner_id:other
 }),env,b.fakeFetch);
 assert.equal(res.status,201);
 const row=b.calls.find(c=>c.url.endsWith('english_card_candidates')&&c.opts.method==='POST');
 assert.equal(JSON.parse(row.opts.body).owner_id,owner);
});
test('manual card POST uses server owner and refuses blank data',async()=>{
 const b=mockBackend();
 const r=await handleP1Request(request('card','POST',{
   requestId:'request-manual-00001',term:' apple ',meaningZh:'蘋果',owner_id:other
 }),env,b.fakeFetch);
 assert.equal(r.status,201);
 const post=b.calls.find(c=>c.url.endsWith('english_cards')&&c.opts.method==='POST');
 assert.equal(JSON.parse(post.opts.body).owner_id,owner);
 const bad=await handleP1Request(request('card','POST',{
   requestId:'request-manual-00002',term:' ',meaningZh:''
 }),env,b.fakeFetch);
 assert.equal(bad.status,400);
});
test('promote accepts only explicit authorized user action; forged owner ignored',async()=>{
 const b=mockBackend();
 const denied=await handleP1Request(request('accept','POST',{
   requestId:'request-promote-00001',candidateId:candidate
 }),env,b.fakeFetch);
 assert.equal(denied.status,400);
 const r=await handleP1Request(request('accept','POST',{
   requestId:'request-promote-00001',candidateId:candidate,
   userConfirmed:true,owner_id:other
 }),env,b.fakeFetch);
 assert.equal(r.status,200);
 const rpc=b.calls.find(x=>x.url.endsWith('/rpc/english_promote_candidate'));
 assert.equal(JSON.parse(rpc.opts.body).p_owner_id,owner);
 assert.match(JSON.parse(rpc.opts.body).p_payload_digest,/^[a-f0-9]{64}$/);
});
test('ignore is constrained to own pending candidate',async()=>{
 const b=mockBackend();
 const r=await handleP1Request(request('ignore','POST',{
   requestId:'request-ignore-000001',candidateId:candidate,userConfirmed:true
 }),env,b.fakeFetch);
 assert.equal(r.status,200);
 const url=b.calls.find(x=>x.opts.method==='PATCH').url;
 assert.ok(url.includes('owner_id=eq.'+owner));
 assert.ok(url.includes('status=eq.pending'));
});
test('dangerous and unknown operations rejected',async()=>{
 const b=mockBackend();
 const a=await handleP1Request(request('reset','POST',{requestId:'request-unsafe-00001'}),env,b.fakeFetch);
 assert.equal(a.status,404);
 const c=await handleP1Request(request('cards','DELETE'),env,b.fakeFetch);
 assert.equal(c.status,404);
});
test('CORS preflight permits only exact configured origin',async()=>{
 const b=mockBackend();
 const r=await handleP1Request(request('candidate','OPTIONS'),env,b.fakeFetch);
 assert.equal(r.status,204);
 assert.equal(r.headers.get('access-control-allow-origin'),origin);
 assert.equal(b.calls.length,0);
});
