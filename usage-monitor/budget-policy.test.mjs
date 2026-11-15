import {test} from "node:test";
import assert from "node:assert/strict";
import {budgetDecision} from "./budget-policy.mjs";
const fresh=(p={})=>({limit:100,officialUsed:40,officialAgeMinutes:5,...p});
test("blocks optional work when official usage is unavailable",()=>{
  assert.equal(budgetDecision({limit:100,observedUsed:0,category:"optional"}).reason,"official_usage_unavailable");
});
test("does not treat instrumented-only observations as authoritative",()=>{
  assert.equal(budgetDecision({limit:100,observedUsed:3,category:"background"}).action,"block");
});
test("preserves critical recovery if official usage is unavailable",()=>{
  assert.equal(budgetDecision({limit:100,category:"critical"}).action,"allow");
});
test("rejects stale official snapshots for optional work",()=>{
  assert.equal(budgetDecision(fresh({officialAgeMinutes:61})).reason,"official_usage_stale");
});
test("can preserve explicitly critical recovery with stale usage",()=>{
  assert.equal(budgetDecision(fresh({officialAgeMinutes:61,category:"critical"})).action,"allow");
});
test("fresh observed lower bound above stop threshold blocks",()=>{
  assert.equal(budgetDecision(fresh({observedUsed:96})).action,"block");
});
test("notice and throttle are separate",()=>{
  assert.equal(budgetDecision(fresh({officialUsed:71})).action,"warn");
  assert.equal(budgetDecision(fresh({officialUsed:86,category:"background"})).action,"block");
});
test("reservation and estimated future cost affect gate",()=>{
  assert.equal(budgetDecision(fresh({officialUsed:80,reserve:8,projectedAdditional:8})).action,"block");
});
test("critical recovery is allowed above threshold with explicit caution",()=>{
  assert.equal(budgetDecision(fresh({officialUsed:99,category:"critical"})).reason,"critical_reserved");
});
test("malformed negative usage is denied",()=>{
  assert.equal(budgetDecision(fresh({observedUsed:-1})).action,"block");
  assert.equal(budgetDecision(fresh({officialAgeMinutes:-1})).action,"block");
});
test("invalid limits and threshold order are denied",()=>{
  assert.equal(budgetDecision(fresh({limit:0})).action,"block");
  assert.equal(budgetDecision(fresh({thresholds:{notice:0.9,throttle:0.8,stop:0.95}})).action,"block");
});
test("only a recent official snapshot may authorize optional work",()=>{
  assert.equal(budgetDecision(fresh({officialUsed:20})).action,"allow");
});
