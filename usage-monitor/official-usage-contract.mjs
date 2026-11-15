// Candidate contract: official supplier must be separately verified and authenticated.
// This does NOT fetch billing data; it prevents observed numbers from pretending
// to be Supabase authoritative billing data.
const METRICS=new Map([
  ["edge_invocations","count"],["egress_uncached","bytes"],["egress_cached","bytes"],
  ["realtime_messages","count"],["storage_size","bytes"],["database_size","bytes"]
]);
export function evaluateOfficialUsage(snapshot, now=new Date()) {
  if(!snapshot)return {state:"unavailable",remainingAsOf:null,currentRemaining:null,percentAsOf:null};
  const {metric,unit,source,used,limit,asOf,cycleStart,cycleEnd}=snapshot;
  if(!METRICS.has(metric)||unit!==METRICS.get(metric))throw new Error("Unsupported official metric or unit.");
  if(!["supabase_dashboard_manual","management_api_verified"].includes(source))
    throw new Error("Untrusted official usage source.");
  if(![used,limit].every(Number.isFinite)||used<0||limit<=0)
    throw new Error("Invalid billed usage value.");
  if(![asOf,cycleStart,cycleEnd].every(v=>typeof v==="string"&&/\d{4}-\d{2}-\d{2}T/.test(v)))
    throw new Error("Official timestamp and billing cycle are required.");
  const sampled=new Date(asOf),start=new Date(cycleStart),end=new Date(cycleEnd);
  if([sampled,start,end,now].some(d=>Number.isNaN(d.getTime()))||start>=end||
     sampled<start||sampled>end||sampled>now)
    throw new Error("Official period or timestamp is invalid.");
  const ageMs=now.getTime()-sampled.getTime();
  const state=ageMs<=3600000?"recent":"stale";
  return {
    state,metric,unit,source,asOf,cycleStart,cycleEnd,
    officialUsedAsOf:used,remainingAsOf:Math.max(0,limit-used),
    currentRemaining:null, // never imply real-time billable headroom.
    percentAsOf:Math.round((used/limit)*10000)/100,
    ageMinutes:Math.round(ageMs/60000)
  };
}
