import {test} from "node:test";
import assert from "node:assert/strict";
import {
  isValidMonth,taiwanMonth,formatCount,formatBytes,quotaLabel,validateSnapshot,validateAiSideSnapshot,errorForHttp
} from "./monitor-core.mjs";
const sample=(month="2026-11")=>({
  month,coverage:"instrumented_only",source:"app_telemetry_not_official_billing",
  summary:{request_count:2,response_bytes_known:1024,blocked_count:1},
  sources:[{source:"lizhi-ai-workbench",request_count:2,error_count:0,blocked_count:1,response_bytes_known:1024}],
  events:[{occurred_at:"2026-11-15T10:30:00Z",source:"lizhi-ai-workbench",route:"/mcp",status_code:200,response_bytes:1024,decision:"allow"}],
  quotas:[{label:"Edge Invocations",limit:500000,unit:" 次",observed:2,official_used:null}]
});
test("Taiwan month is stable even on a UTC month boundary",()=>{
  assert.equal(taiwanMonth(new Date("2026-10-31T17:00:00Z")),"2026-11");
});
test("month validation blocks malformed inputs",()=>{
  assert.equal(isValidMonth("2026-11"),true);
  for(const s of ["2026-00","2026-13","foo","2026-1","2026-11/../../","1999-01"]){
    assert.equal(isValidMonth(s),false,s);
  }
});
test("formatCount refuses corrupt or absent numbers",()=>{
  assert.equal(formatCount(null),"未知");
  assert.equal(formatCount(-1),"未知");
  assert.equal(formatCount(0),"0");
});
test("network bytes use decimal GB and no invented zero for null",()=>{
  assert.equal(formatBytes(null),"未知");
  assert.equal(formatBytes(5_000_000_000),"5.000 GB");
  assert.equal(quotaLabel(5_000_000_000," B"),"5.000 GB");
});
test("known quota uses units accurately",()=>{
  assert.equal(quotaLabel(500000," 次"),"500,000 次");
});
test("well-formed observed snapshot is accepted",()=>{
  assert.equal(validateSnapshot(sample(),"2026-11").summary.request_count,2);
});
test("snapshot from different month is rejected",()=>{
  assert.throws(()=>validateSnapshot(sample("2026-10"),"2026-11"),/月份/);
});
test("official billing cannot be replaced by a frontend-provided total",()=>{
  const x=sample();x.source="official";assert.throws(()=>validateSnapshot(x,"2026-11"),/格式/);
});
test("unsafe or corrupt totals are rejected",()=>{
  const x=sample();x.summary.request_count=-2;assert.throws(()=>validateSnapshot(x,"2026-11"),/計數/);
});
test("oversized response arrays are rejected",()=>{
  const x=sample();x.events=Array.from({length:101},()=>x.events[0]);
  assert.throws(()=>validateSnapshot(x,"2026-11"),/超過/);
});
test("misleading quota values are rejected",()=>{
  const x=sample();x.quotas[0].official_used=-1;
  assert.throws(()=>validateSnapshot(x,"2026-11"),/配額/);
});
test("authorization errors are separated",()=>{
  assert.match(errorForHttp(401),/登入/);
  assert.match(errorForHttp(403),/本人/);
  assert.match(errorForHttp(429),/頻繁/);
});

const aiSample=()=>({
 month:"2026-11",source:"ai_self_registered_operations",
 coverage:"assistant_observed_actions_only",complete:true,officialBillingConnected:false,
 officialCost:null,officialEdgeInvocations:null,officialEgressBytes:null,
 summary:{assistantObservedToolCalls:1,finishedActions:1,unfinishedActions:0,
   missingBefore:0,failures:0,unknownResults:0,invalidRows:0,conflictRows:0},
 features:[{feature:"english_classroom",assistantObservedToolCalls:1,finishedActions:1}],
 tasks:[{feature:"english_classroom",taskLabel:"英文教室單字卡測試",
   assistantObservedToolCalls:1,finishedActions:1}],
 days:[{day:"2026-11-16",toolCalls:1}],
 events:[{at:"2026-11-16T01:00:00Z",feature:"english_classroom",
   taskLabel:"英文教室單字卡測試",actionDetail:"核對單字卡",
   outcome:"success",toolCalls:1}],
 budget:{monthlyToolCap:null,alert:"UNCONFIGURED"}
});
test("accepts AI self-ledger with purpose and unknown billing",()=>{
 const r=validateAiSideSnapshot(aiSample(),"2026-11");
 assert.equal(r.events[0].actionDetail,"核對單字卡");
 assert.equal(r.officialCost,null);
});
test("rejects attempt to claim self-reported calls are official fees",()=>{
 const r=aiSample();r.officialCost=0;
 assert.throws(()=>validateAiSideSnapshot(r,"2026-11"),/格式|來源/);
});
test("rejects missing task label or invalid payload",()=>{
 const r=aiSample();delete r.events[0].taskLabel;
 assert.throws(()=>validateAiSideSnapshot(r,"2026-11"),/事件/);
});
test("rejects mismatched calendar month",()=>{
 assert.throws(()=>validateAiSideSnapshot(aiSample(),"2026-12"),/格式|來源/);
});
test("rejects invented or out-of-range self-budget",()=>{
 const r=aiSample();r.budget.monthlyToolCap=50000000;
 assert.throws(()=>validateAiSideSnapshot(r,"2026-11"),/上限/);
});
