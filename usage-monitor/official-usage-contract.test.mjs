import {test} from "node:test";
import assert from "node:assert/strict";
import {evaluateOfficialUsage} from "./official-usage-contract.mjs";
const now=new Date("2026-11-15T12:30:00Z");
const value=(changes={})=>({
 metric:"edge_invocations",unit:"count",source:"supabase_dashboard_manual",
 used:100,limit:500000,asOf:"2026-11-15T12:00:00Z",
 cycleStart:"2026-11-01T00:00:00Z",cycleEnd:"2026-12-01T00:00:00Z",
 ...changes
});
test("unknown official data is not invented",()=>{
 const x=evaluateOfficialUsage(null,now);
 assert.equal(x.state,"unavailable");
 assert.equal(x.remainingAsOf,null);
 assert.equal(x.currentRemaining,null);
});
test("recent official snapshot is explicitly as-of, not current",()=>{
 const x=evaluateOfficialUsage(value(),now);
 assert.equal(x.state,"recent"); assert.equal(x.remainingAsOf,499900);
 assert.equal(x.currentRemaining,null);assert.equal(x.ageMinutes,30);
});
test("old official snapshot becomes stale",()=>{
 assert.equal(evaluateOfficialUsage(value({asOf:"2026-11-15T11:00:00Z"}),now).state,"stale");
});
test("cannot promote arbitrary observed data to official",()=>{
 assert.throws(()=>evaluateOfficialUsage(value({source:"app_telemetry_not_official_billing"}),now),/Untrusted/);
});
test("metric and units must match",()=>{
 assert.throws(()=>evaluateOfficialUsage(value({unit:"bytes"}),now),/metric/);
 assert.throws(()=>evaluateOfficialUsage(value({metric:"unknown_metric"}),now),/metric/);
});
test("negative used and zero limit are refused",()=>{
 assert.throws(()=>evaluateOfficialUsage(value({used:-1}),now),/billed/);
 assert.throws(()=>evaluateOfficialUsage(value({limit:0}),now),/billed/);
});
test("future asOf time is refused",()=>{
 assert.throws(()=>evaluateOfficialUsage(value({asOf:"2026-11-16T00:00:00Z"}),now),/period/);
});
test("sample outside billing cycle is refused",()=>{
 assert.throws(()=>evaluateOfficialUsage(value({asOf:"2026-10-31T23:00:00Z"}),now),/period/);
});
test("cycle end is exclusive and requires ordered cycle",()=>{
 assert.throws(()=>evaluateOfficialUsage(value({cycleEnd:"2026-11-15T12:00:00Z"}),now),/period/);
 assert.throws(()=>evaluateOfficialUsage(value({cycleStart:"2026-12-01T00:00:00Z"}),now),/period/);
});
test("timestamps must explicitly contain timezone",()=>{
 assert.throws(()=>evaluateOfficialUsage(value({asOf:"2026-11-15T12:00:00"}),now),/timestamp/);
});
test("overage still shows no precise current headroom",()=>{
 const x=evaluateOfficialUsage(value({used:550000}),now);
 assert.equal(x.remainingAsOf,0);assert.equal(x.currentRemaining,null);
 assert.equal(x.percentAsOf,110);
});
test("separate Egress in bytes is valid",()=>{
 const x=evaluateOfficialUsage(value({metric:"egress_uncached",unit:"bytes",used:4000000000,limit:5000000000}),now);
 assert.equal(x.percentAsOf,80);
});
