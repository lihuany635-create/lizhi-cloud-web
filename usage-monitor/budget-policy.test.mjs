import {test} from "node:test";
import assert from "node:assert/strict";
import {budgetDecision} from "./budget-policy.mjs";
test("blocks optional work when usage data is completely unavailable",()=>{
  assert.equal(budgetDecision({limit:100,category:"optional"}).action,"block");
});
test("preserves critical recovery when usage is unknown",()=>{
  assert.equal(budgetDecision({limit:100,category:"critical"}).action,"allow");
});
test("observed lower bound above stop threshold blocks",()=>{
  assert.equal(budgetDecision({limit:100,observedUsed:96,category:"optional"}).action,"block");
});
test("notice and throttle are separate",()=>{
  assert.equal(budgetDecision({limit:100,officialUsed:71}).action,"warn");
  assert.equal(budgetDecision({limit:100,officialUsed:86,category:"background"}).action,"block");
});
test("reservation and estimated future cost affect gate",()=>{
  assert.equal(budgetDecision({limit:100,officialUsed:80,reserve:8,projectedAdditional:8}).action,"block");
});
test("critical path is not automatically stopped",()=>{
  assert.equal(budgetDecision({limit:100,officialUsed:99,category:"critical"}).reason,"critical_reserved");
});
test("malformed data is fail closed",()=>{
  assert.equal(budgetDecision({limit:100,observedUsed:-1}).action,"block");
  assert.equal(budgetDecision({limit:0,officialUsed:3}).action,"block");
});
