import {test} from "node:test";
import assert from "node:assert/strict";
import {
  isValidMonth,taiwanMonth,formatCount,formatBytes,quotaLabel,validateSnapshot,errorForHttp
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
