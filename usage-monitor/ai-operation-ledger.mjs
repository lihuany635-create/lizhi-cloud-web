// ChatGPT-initiated action register; this is NOT a Supabase usage API client.
// A separate authorized append-only writer must persist each returned entry.
// Only actions actually observed by the assistant can be counted as such.
export const AI_LEDGER_SOURCE = "ai_self_registered_operations";
const PROJECT = "hrdzywkihfqggiwjgavi";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OP=/^[a-z][a-z0-9_.:-]{1,79}$/;
const TYPES=new Set(["sql_read","sql_write","edge_read","edge_deploy","logs_read","auth_read","management_read","other"]);
const OUTCOMES=new Set(["success","failure","unknown"]);
const dateOk=x=>typeof x==="string"&&x.length<=40&&/Z$|[+-][0-9]{2}:[0-9]{2}$/.test(x)&&Number.isFinite(Date.parse(x));
const safeInt=x=>Number.isSafeInteger(x)&&x>=0;
const hasOnly=(value,keys)=>Object.keys(value).every(k=>keys.includes(k));
/**
 * Record once before an operation, then once after the tool result is known.
 * If no tool invocation happened, record completed toolCalls=0. Never fake
 * Edge invocations, Egress, SQL execution cost or the platform bill.
 */
export function createAiActionEntry({
  eventId,at,service,operation,phase,outcome,toolCalls=0,evidenceUrl=null
}={}){
  if(!UUID.test(eventId||"")||!dateOk(at)||!OP.test(service||"")||
     !TYPES.has(operation)||!["before","after"].includes(phase)||
     !safeInt(toolCalls)||toolCalls>1000)
    throw new Error("Invalid AI action ledger fields");
  if(phase==="before"&&(outcome!=="planned"||toolCalls!==0))
    throw new Error("Before entry must be planned with no executed calls");
  if(phase==="after"&&!OUTCOMES.has(outcome))
    throw new Error("After entry must state actual result or unknown");
  if(evidenceUrl!==null&&(
     typeof evidenceUrl!=="string"||evidenceUrl.length>300||
     !/^https:\/\/(github\.com|docs\.google\.com|drive\.google\.com)\//.test(evidenceUrl)
  ))throw new Error("Untrusted evidence link");
  return Object.freeze({
    schema:"lizhi.ai-operation-ledger.v1",source:AI_LEDGER_SOURCE,
    project:PROJECT,eventId,at,service,operation,phase,outcome,
    toolCalls,evidenceUrl,
    // These are intentionally UNKNOWN, not zero, until independently measured.
    officialEdgeInvocations:null,officialEgressBytes:null,officialCost:null,
    measuredProviderRequestCount:null
  });
}
export function summarizeAiActionEntries(entries){
  if(!Array.isArray(entries)||entries.length>100000)throw new Error("Invalid ledger");
  const seen=new Map();
  for(const entry of entries){
    if(!entry||entry.schema!=="lizhi.ai-operation-ledger.v1"||
       entry.source!==AI_LEDGER_SOURCE||entry.project!==PROJECT||
       !UUID.test(entry.eventId||"")||!dateOk(entry.at)||
       !OP.test(entry.service||"")||!TYPES.has(entry.operation)||
       !["before","after"].includes(entry.phase)||
       !["planned","success","failure","unknown"].includes(entry.outcome)||
       !safeInt(entry.toolCalls)||entry.toolCalls>1000||
       entry.officialEdgeInvocations!==null||entry.officialEgressBytes!==null||
       entry.officialCost!==null||entry.measuredProviderRequestCount!==null)
      throw new Error("Untrusted or invalid ledger entry");
    const prev=seen.get(entry.eventId)||{};
    if(prev[entry.phase])throw new Error("Duplicate ledger phase");
    if(prev.before&&(entry.service!==prev.before.service||entry.operation!==prev.before.operation))throw new Error("Mismatched event");
    if(prev.after&&(entry.service!==prev.after.service||entry.operation!==prev.after.operation))throw new Error("Mismatched event");
    prev[entry.phase]=entry;seen.set(entry.eventId,prev);
  }
  let finished=0,failed=0,unknown=0,toolCalls=0,missingBefore=0;
  for(const pair of seen.values()){
    if(!pair.after)continue;
    finished++;
    if(!pair.before)missingBefore++;
    if(pair.after.outcome==="failure")failed++;
    if(pair.after.outcome==="unknown")unknown++;
    toolCalls+=pair.after.toolCalls;
  }
  return Object.freeze({
    source:AI_LEDGER_SOURCE,coverage:"assistant_observed_actions_only",
    plannedActions:seen.size,finishedActions:finished,
    unfinishedActions:seen.size-finished,missingBefore,
    failures:failed,unknownResults:unknown,assistantObservedToolCalls:toolCalls,
    // Cannot translate tool calls into provider use or billable quota.
    officialEdgeInvocations:null,officialEgressBytes:null,officialCost:null
  });
}
/**
 * Stops only THIS assistant's next planned operations, not external clients.
 * If the local budget or ledger is uncertain, hold optional operations.
 */
export function checkOwnActionCap({recordedCalls,plannedCalls,cap,optional=true}={}){
  if(!safeInt(recordedCalls)||!safeInt(plannedCalls)||plannedCalls===0||
      !safeInt(cap)||cap===0)return {decision:"hold",reason:"unverified_local_budget"};
  if(recordedCalls+plannedCalls>cap)
    return {decision:"hold",reason:"ai_action_cap_reached"};
  return {decision:optional?"allow":"allow",reason:"self_registered_actions_only",
    officialQuotaGuaranteed:false};
}
