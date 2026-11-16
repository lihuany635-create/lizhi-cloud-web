import {test} from "node:test";
import assert from "node:assert/strict";
import {authorizeUsage,UsageAccessError,originAllowed,TRUSTED_ORIGIN} from "../supabase/functions/_shared/lizhi-usage-access.mjs";
const owner="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const config=(overrides={})=>({
  base:"https://example.supabase.co",anon:"test_publishable_only",service:"test_server_only",
  ownerUid:owner,
  fetchImpl:async(url,opt)=>({ok:true,status:200,json:async()=>({id:owner})}),
  ...overrides
});
const request=(header={},url="https://example.supabase.co/functions/v1/lizhi-usage-monitor/snapshot")=>
  new Request(url,{headers:header});
async function rejectsStatus(fn,status){
  await assert.rejects(fn,e=>e instanceof UsageAccessError&&e.status===status);
}
test("accepts actual owner only after remote Auth verification",async()=>{
  let endpoint,header;
  const conf=config({fetchImpl:async(u,o)=>{endpoint=u;header=o.headers;return {ok:true,status:200,json:async()=>({id:owner})};}});
  await authorizeUsage(request({authorization:"Bearer valid-user-token"}),conf);
  assert.equal(endpoint,"https://example.supabase.co/auth/v1/user");
  assert.equal(header.Authorization,"Bearer valid-user-token");
  assert.equal(header.apikey,"test_publishable_only");
});
test("missing token rejected",async()=>rejectsStatus(()=>authorizeUsage(request(),config()),401));
test("only publishable api key is insufficient to impersonate user",async()=>
  rejectsStatus(()=>authorizeUsage(request({apikey:"test_publishable_only"}),config()),401));
test("forged owner uid in user metadata is ignored",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer bad"}),config({
    fetchImpl:async()=>({ok:true,status:200,json:async()=>({id:other,user_metadata:{owner:owner}})})
  })),403));
test("cross-account valid JWT rejected",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer other"}),config({
    fetchImpl:async()=>({ok:true,status:200,json:async()=>({id:other})})
  })),403));
test("expired token rejected",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer expired"}),config({
    fetchImpl:async()=>({ok:false,status:401})
  })),401));
test("auth outage fail-closed with 503",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer any"}),config({
    fetchImpl:async()=>{throw Error("network down");}
  })),503));
test("upstream 500 fail-closed with 503",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer any"}),config({
    fetchImpl:async()=>({ok:false,status:502})
  })),503));
test("invalid auth response fail-closed",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer any"}),config({
    fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw Error("JSON");}})
  })),503));
test("no owner secret always fails closed",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer any"}),config({ownerUid:""})),503));
test("invalid owner UID format rejects deployment misconfiguration",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer any"}),config({ownerUid:"owner@example.com"})),503));
test("rejects Site bridge header if secret is missing even with a valid JWT",async()=>
  rejectsStatus(()=>authorizeUsage(request({authorization:"Bearer any","x-lizhi-usage-bridge":"a".repeat(64)}),config({forMcp:true})),403));
test("Site bridge is not allowed on browser snapshots",async()=>{
  await rejectsStatus(()=>authorizeUsage(request({"x-lizhi-usage-bridge":"a".repeat(64)}),config({forMcp:false})),401);
});
test("verified Site bridge requires exact authenticated actor and secret",async()=>{
  const actor="chatgpt:verified-owner-123",secret="s".repeat(64);
  await authorizeUsage(request({"x-lizhi-usage-bridge":secret,"x-lizhi-usage-actor":actor}),config({
    forMcp:true,bridgeSecret:secret,bridgeActor:actor,
    fetchImpl:()=>{throw Error("Site bridge auth must not call Supabase Auth");}
  }));
  await rejectsStatus(()=>authorizeUsage(request({"x-lizhi-usage-bridge":secret,"x-lizhi-usage-actor":"attacker-123"}),config({
    forMcp:true,bridgeSecret:secret,bridgeActor:actor
  })),403);
});
test("CORS allows same origin and server-to-server, rejects foreign origins and null",()=>{
  assert.equal(originAllowed(new Headers()),true);
  assert.equal(originAllowed(new Headers({origin:TRUSTED_ORIGIN})),true);
  assert.equal(originAllowed(new Headers({origin:"https://evil.example"})),false);
  assert.equal(originAllowed(new Headers({origin:"null"})),false);
});
