// P9 synthetic health evaluation and privacy-safe diagnostic summaries.
// Intentionally no fetch/network/timer/storage/alerts. Real monitoring requires
// explicit owner authorization, data-retention rules and source verification.
const METRICS=Object.freeze(['requestCount','failureCount','p95LatencyMs',
 'deniedAuthCount','syncConflictCount','unverifiedOwnerAttempts',
 'legacyMissingTools','crossOwnerViolationCount','databaseRollbackFailures']);
export const MONITOR_METRICS=METRICS;
export const MONITOR_POLICY=Object.freeze({
 minRequests:20,
 highErrorRatio:0.05,
 criticalErrorRatio:0.20,
 highP95Ms:2500,
 criticalP95Ms:7000,
 highDeniedAuthCount:20,
 // Security breach or lost legacy tooling is critical regardless of traffic.
 immediateCritical:['crossOwnerViolationCount','databaseRollbackFailures','legacyMissingTools']
});
const int=x=>Number.isSafeInteger(x)&&x>=0;
const countKeys=new Set(METRICS);
function validateMetrics(sample){
 if(!sample||typeof sample!=='object'||Array.isArray(sample))throw new TypeError('INVALID_HEALTH_SAMPLE');
 for(const key of METRICS){
  if(!int(sample[key]))throw new TypeError('INVALID_HEALTH_METRIC:'+key);
 }
 if(sample.failureCount>sample.requestCount||sample.p95LatencyMs>600000 ||
  sample.deniedAuthCount>sample.requestCount||sample.syncConflictCount>sample.requestCount)
   throw new TypeError('INCONSISTENT_HEALTH_METRICS');
}
// Drops all non-whitelisted fields including URLs, tokens, payloads, owner IDs,
// words, sentences, email and exact raw timestamps. Never logs request bodies.
export function sanitizeTelemetry(raw){
 validateMetrics(raw);
 const counts=Object.fromEntries(METRICS.map(key=>[key,raw[key]]));
 return Object.freeze({schema:'english-monitor-v1',metrics:counts,
  safeFields:METRICS,includesPersonalData:false});
}
export function evaluateHealthWindow({sample,expectedLegacyToolCount=null,
  observedLegacyToolCount=null}={}){
 const x=sanitizeTelemetry(sample).metrics;
 const blockers=[],warnings=[],ratio=x.requestCount>0?x.failureCount/x.requestCount:null;
 let state='healthy';
 if(x.crossOwnerViolationCount>0)blockers.push('CROSS_OWNER_VIOLATION');
 if(x.databaseRollbackFailures>0)blockers.push('ROLLBACK_FAILURE');
 if(x.legacyMissingTools>0)blockers.push('LEGACY_TOOL_LOSS');
 if(expectedLegacyToolCount!==null||observedLegacyToolCount!==null){
  if(!int(expectedLegacyToolCount)||!int(observedLegacyToolCount))throw new TypeError('INVALID_TOOL_SNAPSHOT');
  if(observedLegacyToolCount<expectedLegacyToolCount)blockers.push('LEGACY_TOOL_COUNT_DROP');
  // Equal counts do not prove no tools lost: exact names must be compared separately.
 }
 if(x.unverifiedOwnerAttempts>0)blockers.push('UNVERIFIED_OWNER_WRITE_ATTEMPT');
 if(x.requestCount===0||x.requestCount<MONITOR_POLICY.minRequests)
   warnings.push('INSUFFICIENT_REQUEST_SAMPLE');
 if(x.requestCount>=MONITOR_POLICY.minRequests){
  if(ratio>=MONITOR_POLICY.criticalErrorRatio)blockers.push('CRITICAL_ERROR_RATIO');
  else if(ratio>=MONITOR_POLICY.highErrorRatio)warnings.push('HIGH_ERROR_RATIO');
  if(x.p95LatencyMs>=MONITOR_POLICY.criticalP95Ms)blockers.push('CRITICAL_LATENCY');
  else if(x.p95LatencyMs>=MONITOR_POLICY.highP95Ms)warnings.push('HIGH_LATENCY');
 }
 if(x.deniedAuthCount>=MONITOR_POLICY.highDeniedAuthCount)
   warnings.push('AUTH_DENIAL_SPIKE');
 if(blockers.length)state='critical';
 else if(warnings.length)state='warning';
 return Object.freeze({state,blockers,warnings,
   failureRatio:ratio===null?null:Math.round(ratio*10000)/10000,
   confidentiality:'metrics-only',sampleVerified:false,
   automaticallyAlerted:false,automaticallyRolledBack:false});
}
export function evaluateIncidentSequence(windows){
 if(!Array.isArray(windows)||windows.length===0||windows.length>96)
  throw new TypeError('INVALID_MONITOR_WINDOWS');
 const states=windows.map(w=>evaluateHealthWindow({sample:w}));
 const severe=states.some(x=>x.state==='critical');
 const continuedWarnings=states.length>=2 &&
  states.at(-1).state==='warning' && states.at(-2).state==='warning';
 return {
  severity:severe?'SEV1':continuedWarnings?'SEV2':
    states.at(-1).state==='warning'?'OBSERVE':'NONE',
  sampleWindowCount:states.length,
  requireHumanReview:severe||continuedWarnings,
  action:'DOCUMENT_AND_ESCALATE_ONLY',
  noNotificationsSent:true,noAutomatedRollback:true
 };
}
export function redactIncidentReport({
 id,severity,startedAt,summary,affectedSubsystem,commitSha
}={}){
 if(!/^P9-INC-[0-9]{3,5}$/.test(id??'')||
  !['SEV1','SEV2','SEV3'].includes(severity)||
  !['english-api','mcp-adapter','learning-db','english-ui','legacy-site'].includes(affectedSubsystem)||
  typeof summary!=='string'||!summary.trim()||summary.length>300||
  !/^[a-f0-9]{40}$/.test(commitSha??'')||
  !Number.isFinite(Date.parse(startedAt)))throw new TypeError('INVALID_INCIDENT');
 // Deliberately exclude free-text summary: it may contain private example
 // sentences, OAuth tokens, email addresses, identifiers or URLs.
 return Object.freeze({id,severity,affectedSubsystem,commitSha,
  date:new Date(startedAt).toISOString().slice(0,10),
  summary:'Details withheld; retain in authorized private incident record',
  unverified:true,reported:false});
}
