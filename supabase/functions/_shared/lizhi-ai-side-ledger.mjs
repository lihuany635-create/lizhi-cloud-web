// AI self-registered action log report sourced ONLY from existing Workbench Side logs.
// It does not fetch Supabase Management/Usage API or claim official billable data.
import {createAiActionEntry,summarizeAiActionEntries,checkOwnActionCap}
  from "./lizhi-ai-operation-ledger.mjs";
export const SIDE_PROJECT = "Supabase 流量監控中心";
export const SIDE_AGENT = "ChatGPT";
export const AI_LOG_TITLE = "AI_USAGE";
export const BUDGET_SCHEMA = "lizhi.ai-usage-budget.v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH = /^20\d{2}-(?:0[1-9]|1[0-2])$/;
const onlyJSON = s => typeof s === "string" && s.length <= 3000;
const validCap = n => Number.isSafeInteger(n) && n >= 1 && n <= 1000000;
function twParts(date) {
  const p = new Intl.DateTimeFormat("en-US", {timeZone:"Asia/Taipei",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(date));
  const get = k => p.find(x=>x.type===k)?.value||"";
  return {month:get("year")+"-"+get("month"),day:get("year")+"-"+get("month")+"-"+get("day")};
}
function sameRecord(a,b) {
  return JSON.stringify(a)===JSON.stringify(b);
}
function parseRow(row,month) {
  if (!row || row.agent !== SIDE_AGENT || row.project !== SIDE_PROJECT ||
      !onlyJSON(row.done)) return null;
  const match = /^AI_USAGE (before|after) ([0-9a-f-]{36})$/i.exec(row.title||"");
  if (!match || !UUID.test(match[2])) return null;
  let v;
  try {v=JSON.parse(row.done);}catch{return null;}
  if (!v || v.schema!=="lizhi.ai-operation-ledger.v1" ||
      v.source!=="ai_self_registered_operations" ||
      v.project!=="hrdzywkihfqggiwjgavi" ||
      typeof v.eventId!=="string" || v.eventId.toLowerCase()!==match[2].toLowerCase() ||
      v.phase!==match[1] || !Number.isFinite(Date.parse(v.at)) ||
      twParts(v.at).month!==month) return null;
  try {
    const canonical = createAiActionEntry(v);
    // Reject altered or untrusted null billing fields, even if a canonical
    // constructor would otherwise remove the fake claim.
    for (const k of ["schema","source","project","eventId","at","service","feature",
      "taskLabel","actionDetail","operation","phase","outcome","toolCalls",
      "evidenceUrl","officialEdgeInvocations","officialEgressBytes",
      "officialCost","measuredProviderRequestCount"]) {
      if ((canonical[k]??null)!==(v[k]??null)) return null;
    }
    return canonical;
  } catch {return null;}
}
function parseBudget(rows,month) {
  if (!Array.isArray(rows)) throw new Error("Invalid budget records");
  const valid = rows.filter(x=>x && x.title==="AI_USAGE_BUDGET "+month &&
    x.project===SIDE_PROJECT && x.agent===SIDE_AGENT &&
    onlyJSON(x.done)).sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0));
  for (const row of valid) {
    try {
      const data=JSON.parse(row.done);
      if (data.schema===BUDGET_SCHEMA && data.month===month &&
          validCap(data.cap) && Number.isFinite(Date.parse(data.at)))
        return {monthlyToolCap:data.cap,configuredAt:data.at};
    }catch{}
  }
  return {monthlyToolCap:null,configuredAt:null};
}
export function createBudgetRow(month,cap,at) {
  if (!MONTH.test(month)||!validCap(cap)||!Number.isFinite(Date.parse(at)))
    throw new Error("Invalid AI action budget");
  const payload={schema:BUDGET_SCHEMA,month,cap,at};
  return {agent:SIDE_AGENT,project:SIDE_PROJECT,title:"AI_USAGE_BUDGET "+month,
    done:JSON.stringify(payload)};
}
export function buildAiSideSnapshot({rows,budgets=[],month,moreRows=false}={}){
  if (!MONTH.test(month)||!Array.isArray(rows)||rows.length>5000||
      !Array.isArray(budgets)||budgets.length>100)
    throw new Error("Invalid AI Side ledger input");
  const entries=new Map();
  let invalidRows=0,duplicateRows=0,conflictRows=0;
  for (const row of rows) {
    const v=parseRow(row,month);
    if(!v){invalidRows++;continue;}
    let item=entries.get(v.eventId);
    if(!item){item={};entries.set(v.eventId,item);}
    if(item[v.phase]){
      if(sameRecord(item[v.phase],v))duplicateRows++;
      else {item.corrupt=true;conflictRows++;}
    }else item[v.phase]=v;
  }
  const validPairs=[...entries.values()].filter(x=>{
    if(x.corrupt)return false;
    if(x.before&&x.after&&(x.before.feature!==x.after.feature||
      x.before.taskLabel!==x.after.taskLabel||
      x.before.actionDetail!==x.after.actionDetail||
      x.before.service!==x.after.service||
      x.before.operation!==x.after.operation)){
      conflictRows++;return false;
    }
    return true;
  });
  const flat=validPairs.flatMap(x=>[x.before,x.after].filter(Boolean));
  const summary=summarizeAiActionEntries(flat);
  const budget=parseBudget(budgets,month);
  const tasks=new Map(),days=new Map();
  const detail=[];
  for (const pair of validPairs) {
    if(!pair.after)continue;
    if(pair.before && (pair.before.feature!==pair.after.feature ||
        pair.before.taskLabel!==pair.after.taskLabel ||
        pair.before.actionDetail!==pair.after.actionDetail ||
        pair.before.service!==pair.after.service ||
        pair.before.operation!==pair.after.operation)) {
      conflictRows++;continue;
    }
    const v=pair.after;
    const taskKey=v.feature+"\u0000"+v.taskLabel;
    const t=tasks.get(taskKey)||{feature:v.feature,taskLabel:v.taskLabel,
      finishedActions:0,assistantObservedToolCalls:0,failures:0};
    t.finishedActions++;
    t.assistantObservedToolCalls+=v.toolCalls;
    if(v.outcome!=="success")t.failures++;
    tasks.set(taskKey,t);
    const day=twParts(v.at).day;
    days.set(day,(days.get(day)||0)+v.toolCalls);
    detail.push({eventId:v.eventId,at:v.at,service:v.service,feature:v.feature,
      taskLabel:v.taskLabel,actionDetail:v.actionDetail,operation:v.operation,
      outcome:v.outcome,toolCalls:v.toolCalls,evidenceUrl:v.evidenceUrl});
  }
  detail.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  const complete=!moreRows&&invalidRows===0&&conflictRows===0&&summary.missingBefore===0;
  // Counter is only ChatGPT self-reported tool calls, never billable consumption.
  const planned=Math.max(0,summary.unfinishedActions);
  const cap=budget.monthlyToolCap;
  const alert=cap===null?"UNCONFIGURED":!complete?"INCOMPLETE":
    summary.assistantObservedToolCalls>=cap?"LIMIT_REACHED":
    summary.assistantObservedToolCalls/cap>=0.85?"NEAR_LIMIT":"WITHIN_CAP";
  return {
    month,source:"ai_self_registered_operations",
    coverage:"assistant_observed_actions_only",complete,
    officialBillingConnected:false,officialCost:null,
    officialEdgeInvocations:null,officialEgressBytes:null,
    summary:{...summary,invalidRows,duplicateRows,conflictRows},
    features:summary.features,
    tasks:[...tasks.values()].sort((a,b)=>b.assistantObservedToolCalls-a.assistantObservedToolCalls),
    days:[...days.entries()].map(([day,toolCalls])=>({day,toolCalls})).sort((a,b)=>a.day.localeCompare(b.day)),
    events:detail.slice(0,100),
    budget:{...budget,alert,plannedCount:planned},
    note:"自登記 AI 工具操作數，不是 Supabase 官方 Usage、Edge Invocations、Egress 或費用。"
  };
}
export function aiPreflight(snapshot,plannedCalls,{optional=true}={}){
  if(!snapshot || snapshot.source!=="ai_self_registered_operations" ||
     !snapshot.complete || snapshot.budget?.monthlyToolCap==null)
    return {decision:"hold",reason:"unverified_local_budget"};
  return checkOwnActionCap({
    recordedCalls:snapshot.summary.assistantObservedToolCalls,
    plannedCalls,cap:snapshot.budget.monthlyToolCap,optional
  });
}
