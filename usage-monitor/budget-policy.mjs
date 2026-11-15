// Pure, provider-agnostic policy for a PRE-SUPABASE gateway.
// Important: calling this INSIDE a Supabase Edge Function does NOT save the
// invocation already consumed by reaching that function.
export function budgetDecision({
  limit, officialUsed=null, observedUsed=null, reserve=0, projectedAdditional=0,
  category="optional", thresholds={notice:0.7,throttle:0.85,stop:0.95}
}={}) {
  if (!(Number.isFinite(limit) && limit>0)) return {action:"block",reason:"invalid_limit"};
  if (!["critical","optional","background"].includes(category)) return {action:"block",reason:"unknown_category"};
  if(![officialUsed,observedUsed].every(x=>x===null || (Number.isFinite(x)&&x>=0)) ||
     !Number.isFinite(projectedAdditional)||projectedAdditional<0||
     !Number.isFinite(reserve)||reserve<0||reserve>=limit)
    return {action:"block",reason:"invalid_usage"};
  if(![thresholds.notice,thresholds.throttle,thresholds.stop].every(x=>x>0 && x<=1) ||
    !(thresholds.notice<thresholds.throttle && thresholds.throttle<thresholds.stop))
    return {action:"block",reason:"invalid_threshold"};
  // Observed data is a LOWER BOUND. Official data may be stale.
  const known = Math.max(officialUsed??0,observedUsed??0);
  const unknown = officialUsed===null && observedUsed===null;
  if(unknown) return category==="critical"
    ? {action:"allow",reason:"critical_unknown_usage"}
    : {action:"block",reason:"unknown_usage_fail_closed"};
  const ratio=(known+reserve+projectedAdditional)/limit;
  if(ratio>=thresholds.stop) return category==="critical"
    ? {action:"allow",reason:"critical_reserved",ratio}
    : {action:"block",reason:"stop_threshold",ratio};
  if(ratio>=thresholds.throttle) return category==="background"
    ? {action:"block",reason:"background_throttled",ratio}
    : {action:"warn",reason:"throttle_threshold",ratio};
  if(ratio>=thresholds.notice)return {action:"warn",reason:"notice_threshold",ratio};
  return {action:"allow",reason:officialUsed===null?"observed_only":"within_budget",ratio};
}
