// Pure budget decision for a future PRE-SUPABASE gateway (NOT an enforcing gateway).
// The result is advisory until backed by an ATOMIC distributed reservation store
// and until every protected client is prevented from bypassing the gateway.
export function budgetDecision({
  limit, officialUsed=null, officialAgeMinutes=null, maxAgeMinutes=60,
  observedUsed=null, reserve=0, projectedAdditional=0,
  category="optional", thresholds={notice:0.7,throttle:0.85,stop:0.95}
}={}) {
  if (!(Number.isFinite(limit) && limit>0)) return {action:"block",reason:"invalid_limit"};
  if (!["critical","optional","background"].includes(category)) return {action:"block",reason:"unknown_category"};
  if(![officialUsed,observedUsed].every(x=>x===null || (Number.isFinite(x)&&x>=0)) ||
     !Number.isFinite(projectedAdditional)||projectedAdditional<0||
     !Number.isFinite(reserve)||reserve<0||reserve>=limit||
     !Number.isFinite(maxAgeMinutes)||maxAgeMinutes<=0||
     (officialAgeMinutes!==null&&(!Number.isFinite(officialAgeMinutes)||officialAgeMinutes<0)))
    return {action:"block",reason:"invalid_usage"};
  if(![thresholds.notice,thresholds.throttle,thresholds.stop].every(x=>x>0&&x<=1) ||
     !(thresholds.notice<thresholds.throttle && thresholds.throttle<thresholds.stop))
    return {action:"block",reason:"invalid_threshold"};
  // An instrumented subset is only a lower bound; it cannot prove headroom.
  const missing=officialUsed===null||officialAgeMinutes===null;
  if(missing)return category==="critical"?
    {action:"allow",reason:"critical_missing_official"}:
    {action:"block",reason:"official_usage_unavailable"};
  if(officialAgeMinutes>maxAgeMinutes)return category==="critical"?
    {action:"allow",reason:"critical_stale_official"}:
    {action:"block",reason:"official_usage_stale"};
  const known=Math.max(officialUsed,observedUsed??0);
  const ratio=(known+reserve+projectedAdditional)/limit;
  if(ratio>=thresholds.stop)return category==="critical"?
    {action:"allow",reason:"critical_reserved",ratio}:
    {action:"block",reason:"stop_threshold",ratio};
  if(ratio>=thresholds.throttle)return category==="background"?
    {action:"block",reason:"background_throttled",ratio}:
    {action:"warn",reason:"throttle_threshold",ratio};
  if(ratio>=thresholds.notice)return {action:"warn",reason:"notice_threshold",ratio};
  return {action:"allow",reason:"within_fresh_official_budget",ratio};
}
