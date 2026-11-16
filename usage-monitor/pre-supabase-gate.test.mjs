import {test} from "node:test";
import assert from "node:assert/strict";
import {authorizeBeforeSupabase,GatewayDenied} from "./pre-supabase-gate.mjs";
const now=new Date("2026-11-16T01:00:00Z");
const owner="verified-chatgpt-account-123";
const official=(mods={})=>({source:"supabase_dashboard_manual",scope:"organization",
  asOf:"2026-11-16T00:40:00Z",cycleStart:"2026-11-01T00:00:00Z",
  cycleEnd:"2026-12-01T00:00:00Z",metric:"edge_invocations",
  used:20,limit:100,...mods});
const routes={
 "english.read":{category:"optional",cost:1},
 "bulk.export":{category:"background",cost:2},
 "owner.recover":{category:"critical",cost:1}
};
const store=()=>{let n=0;return {get used(){return n;},
  async reserveIfWithin({amount,maxTotal}){
    if(n+amount>maxTotal)return false;
    n+=amount;return true;
  }
};};
const options=(overrides={})=>({verifiedPrincipal:owner,expectedPrincipal:owner,
 route:"english.read",routePolicy:routes,official:official(),now,atomicStore:store(),...overrides});
const rejects=async(x,code)=>assert.rejects(authorizeBeforeSupabase(x),e=>e instanceof GatewayDenied&&e.reason===code);
test("verified owner and recent organization snapshot can reserve once",async()=>{
 const s=store();const r=await authorizeBeforeSupabase(options({atomicStore:s}));
 assert.equal(r.protected,true);assert.equal(s.used,1);
});
test("other account is forbidden before any external call",async()=>{
 const s=store();await rejects(options({verifiedPrincipal:"attacker",atomicStore:s}),"principal_not_verified");
 assert.equal(s.used,0);
});
test("missing verified principal is forbidden",async()=>rejects(options({verifiedPrincipal:""}),"principal_not_verified"));
test("unknown route cannot self-declare critical",async()=>rejects(options({route:"owner.fake"}),"route_not_allowlisted"));
test("missing official snapshot blocks optional",async()=>rejects(options({official:null}),"official_usage_unavailable"));
test("project API statistics cannot impersonate organization billing",async()=>
 rejects(options({official:official({scope:"project"})}),"official_usage_invalid"));
test("observed app telemetry cannot be used for official headroom",async()=>
 rejects(options({official:official({source:"app_telemetry_not_official_billing"})}),"official_usage_unavailable"));
test("stale official numbers fail closed for optional",async()=>
 rejects(options({official:official({asOf:"2026-11-15T22:30:00Z"})}),"official_usage_stale"));
test("future official data fail closed",async()=>
 rejects(options({official:official({asOf:"2026-11-16T10:00:00Z"})}),"official_usage_invalid"));
test("no distributed store cannot issue admission",async()=>
 rejects(options({atomicStore:null}),"atomic_store_unavailable"));
test("store failures fail closed",async()=>
 rejects(options({atomicStore:{reserveIfWithin:async()=>{throw Error("down");}}}),"atomic_store_unavailable"));
test("concurrent admissions do not exceed shared atomic capacity",async()=>{
 const s=store();
 const attempts=await Promise.allSettled(Array.from({length:30},()=>authorizeBeforeSupabase(options({
   official:official({used:85}),atomicStore:s
 }))));
 const okay=attempts.filter(r=>r.status==="fulfilled");
 assert.equal(okay.length,10);
 assert.equal(s.used,10);
 assert.equal(attempts.length-okay.length,20);
});
test("background routes block at throttling threshold",async()=>
 rejects(options({route:"bulk.export",official:official({used:86})}),"background_throttled"));
test("optional route blocked at 95 percent threshold",async()=>
 rejects(options({official:official({used:95})}),"stop_threshold"));
test("recovery bypass only on fixed trusted route, not arbitrary client classification",async()=>{
 const r=await authorizeBeforeSupabase(options({route:"owner.recover",official:null,atomicStore:null}));
 assert.equal(r.action,"critical_recovery");assert.equal(r.protected,false);
});
test("malformed cost cannot be used to bypass limits",async()=>
 rejects(options({routePolicy:{"english.read":{category:"optional",cost:0}}}),"invalid_route_policy"));
test("wrong billing cycle cannot issue new-month reservation",async()=>
 rejects(options({official:official({cycleEnd:"2026-11-15T00:00:00Z"})}),"official_usage_invalid"));
