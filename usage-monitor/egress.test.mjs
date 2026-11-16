import test from "node:test";
import assert from "node:assert/strict";
import {validateEgressInput,parseEgressRows,EGRESS_SOURCE} from "../supabase/functions/_shared/lizhi-uncached-egress.mjs";

const now=new Date("2026-11-16T03:00:00.000Z");
test("total includes cached: subtract to get uncached",()=>{
  const x=validateEgressInput({month:"2026-11",totalGb:4.8,cachedGb:1.1},now);
  assert.equal(x.uncachedBytes,3700000000);
  assert.equal(x.verifiedByProvider,false);
  assert.equal(x.source,EGRESS_SOURCE);
});
test("reject cached > total, missing, negatives, invalid months and strings",()=>{
  for(const x of [
    {month:"2026-11",totalGb:1,cachedGb:1.1},
    {month:"2026-11",totalGb:-1,cachedGb:0},
    {month:"2026-11",totalGb:"1.5",cachedGb:0},
    {month:"2026-13",totalGb:0,cachedGb:0},
    {month:"2026-11",totalGb:Infinity,cachedGb:0},
    {month:"2026-11",totalGb:1,cachedGb:NaN}
  ])assert.throws(()=>validateEgressInput(x,now));
});
function reading(gb,t="2026-11-16T03:00:00Z"){
  const x=validateEgressInput({month:"2026-11",totalGb:gb,cachedGb:0},new Date(t));
  return {id:gb+"",done:JSON.stringify(x)};
}
test("no readings mean unknown; never invent egress or safe state",()=>{
  const x=parseEgressRows([],"2026-11");
  assert.equal(x.latest,null);
  assert.equal(x.alert,"UNKNOWN");
  assert.equal(x.automatic,false);
  assert.equal(x.providerVerified,false);
});
test("warnings at 70%, 85% and 95% of Free 5 GB",()=>{
  for(const [gb,expected] of [
    [0,"WITHIN"],[3.5,"NOTICE"],[4.25,"WARNING"],
    [4.75,"CRITICAL"],[5,"CRITICAL"],[5.5,"CRITICAL"]
  ])assert.equal(parseEgressRows([reading(gb)],"2026-11").alert,expected);
});
test("sort newest first and retain append-only history",()=>{
  const x=parseEgressRows([
    reading(1,"2026-11-15T03:00:00Z"),
    reading(2,"2026-11-16T03:00:00Z")
  ],"2026-11");
  assert.equal(x.latest.uncachedBytes,2000000000);
  assert.equal(x.readings.length,2);
});
test("invalid tampered source and byte mismatch are flagged",()=>{
  const x=parseEgressRows([{id:"1",done:JSON.stringify({
    ...validateEgressInput({month:"2026-11",totalGb:1,cachedGb:0},now),uncachedBytes:4
  })}],"2026-11");
  assert.equal(x.complete,false);
  assert.equal(x.invalidRows,1);
});
test("readings are scoped to billing month and never official API verified",()=>{
  const r=reading(1);
  const x=parseEgressRows([r],"2026-12");
  assert.equal(x.latest,null);
  assert.equal(x.invalidRows,1);
});
test("cap history at 100 entries, detect truncated 501 query",()=>{
  const x=parseEgressRows(Array.from({length:501},()=>reading(1)),"2026-11");
  assert.equal(x.readings.length,100);
  assert.equal(x.complete,false);
});
