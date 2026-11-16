import {test} from "node:test";
import assert from "node:assert/strict";
import {createAiActionEntry} from "./ai-operation-ledger.mjs";
import {buildAiSideSnapshot,createBudgetRow,aiPreflight,estimateAiTaskCalls,SIDE_PROJECT}
  from "../supabase/functions/_shared/lizhi-ai-side-ledger.mjs";
const id="45a2fa13-8eed-4bb1-9be4-91fe576cfac7";
const at="2026-11-16T01:11:23.620Z";
function event(phase,extras={}){
  const data=createAiActionEntry({eventId:id,at,service:"supabase",feature:"usage_monitor",
    taskLabel:"流量監控實際記帳",actionDetail:"核對資料庫欄位",operation:"sql_read",
    phase,outcome:phase==="before"?"planned":"success",toolCalls:phase==="before"?0:1,
    ...extras});
  return {id:phase==="before"?"id-before":"id-after",agent:"ChatGPT",project:SIDE_PROJECT,
    title:"AI_USAGE "+phase+" "+data.eventId,done:JSON.stringify(data),
    created_at:"2026-11-16T01:12:00Z"};
}
const read=(rows,budgets=[],opts={})=>buildAiSideSnapshot({rows,budgets,month:"2026-11",...opts});
test("reads Side before/after as one verified AI tool call",()=>{
  const r=read([event("before"),event("after")]);
  assert.equal(r.complete,true);
  assert.equal(r.summary.assistantObservedToolCalls,1);
  assert.equal(r.summary.finishedActions,1);
  assert.equal(r.features[0].feature,"usage_monitor");
  assert.equal(r.tasks[0].taskLabel,"流量監控實際記帳");
  assert.equal(r.events[0].actionDetail,"核對資料庫欄位");
});
test("does not report official billable traffic",()=>{
  const r=read([event("before"),event("after")]);
  assert.equal(r.officialCost,null);
  assert.equal(r.officialEgressBytes,null);
  assert.equal(r.officialEdgeInvocations,null);
  assert.equal(r.officialBillingConnected,false);
});
test("deduplicates identical retries instead of double-counting",()=>{
  const r=read([event("before"),event("after"),event("after")]);
  assert.equal(r.summary.duplicateRows,1);
  assert.equal(r.summary.assistantObservedToolCalls,1);
  assert.equal(r.complete,true);
});
test("conflicting post record makes snapshot incomplete",()=>{
  const r=read([event("before"),event("after"),
    event("after",{toolCalls:4})]);
  assert.equal(r.complete,false);
  assert.equal(r.summary.conflictRows,1);
  assert.equal(r.summary.assistantObservedToolCalls,0);
});
test("after-only record is visible but integrity flag prevents cap use",()=>{
  const r=read([event("after")]);
  assert.equal(r.complete,false);
  assert.equal(r.summary.missingBefore,1);
  assert.equal(r.summary.assistantObservedToolCalls,1);
});
test("rejects invalid Side source, rather than silently trusting it",()=>{
  const r=read([event("before"),{...event("after"),agent:"untrusted"}]);
  assert.equal(r.complete,false);
  assert.equal(r.summary.invalidRows,1);
});
test("rejects declared official billed cost in Side JSON",()=>{
  const bad=event("after");bad.done=JSON.stringify({...JSON.parse(bad.done),officialCost:0});
  const r=read([event("before"),bad]);
  assert.equal(r.complete,false);
  assert.equal(r.summary.invalidRows,1);
});
test("other months cannot be counted in selected month",()=>{
  const r=read([event("before",{at:"2026-12-01T01:00:00Z"}),event("after")]);
  assert.equal(r.summary.assistantObservedToolCalls,1);
  assert.equal(r.complete,false);
});
test("incomplete truncated result cannot be used for preflight",()=>{
  const r=read([event("before"),event("after")],[],{moreRows:true});
  assert.equal(r.complete,false);
  assert.equal(aiPreflight(r,1).decision,"hold");
});
test("budget record may be set without provider API",()=>{
  const b=createBudgetRow("2026-11",10,at);
  assert.equal(b.title,"AI_USAGE_BUDGET 2026-11");
  const r=read([event("before"),event("after")],
    [{...b,created_at:"2026-11-16T01:12:00Z"}]);
  assert.equal(r.budget.monthlyToolCap,10);
  assert.equal(r.budget.alert,"WITHIN_CAP");
  assert.equal(aiPreflight(r,9).decision,"allow");
  assert.equal(aiPreflight(r,10).decision,"hold");
});
test("unconfigured budget holds optional AI operations",()=>{
  const r=read([event("before"),event("after")]);
  assert.equal(r.budget.monthlyToolCap,null);
  assert.equal(aiPreflight(r,1).decision,"hold");
});
test("near limit gives an explicit alert",()=>{
  const b=createBudgetRow("2026-11",1,at);
  const r=read([event("before"),event("after")],[{...b,created_at:at}]);
  assert.equal(r.budget.alert,"LIMIT_REACHED");
});
test("invalid budget cannot be accepted",()=>{
  assert.throws(()=>createBudgetRow("2026-11",0,at));
  assert.throws(()=>createBudgetRow("2026-11",1000001,at));
  assert.throws(()=>createBudgetRow("2026-13",10,at));
});
test("records only requested month, never other-project Side logs",()=>{
  const r=read([event("before"),event("after"),{...event("after"),project:"Other"}]);
  assert.equal(r.summary.assistantObservedToolCalls,1);
  assert.equal(r.complete,false);
});
test("unknown after result is still counted as attempted operation",()=>{
  const r=read([event("before"),event("after",{outcome:"unknown"})]);
  assert.equal(r.summary.assistantObservedToolCalls,1);
  assert.equal(r.summary.unknownResults,1);
});
test("month boundary follows Taiwan timezone",()=>{
  const shiftedAt="2026-10-31T16:10:00Z";
  const r=read([event("before",{at:shiftedAt}),event("after",{at:shiftedAt})]);
  assert.equal(r.summary.assistantObservedToolCalls,1);
  assert.equal(r.days[0].day,"2026-11-01");
});

test("estimate next call from a matching real task without inventing billing",()=>{
 const r=read([event("before"),event("after")]);
 const v=estimateAiTaskCalls(r,{feature:"usage_monitor",taskLabel:"流量監控實際記帳"});
 assert.equal(v.state,"estimated");
 assert.equal(v.plannedCalls,1);
 assert.equal(v.sampleSize,1);
 assert.match(v.note,/工具/);
});
test("do not guess from a task with no history",()=>{
 const r=read([event("before"),event("after")]);
 const v=estimateAiTaskCalls(r,{feature:"cad"});
 assert.equal(v.state,"unknown");
 assert.equal(v.plannedCalls,null);
});
test("do not estimate from incomplete records",()=>{
 const r=read([event("after")]);
 assert.equal(estimateAiTaskCalls(r,{feature:"usage_monitor"}).state,"unknown");
});

test("unfinished before-only action makes cap assessment incomplete",()=>{
 const r=read([event("before")]);
 assert.equal(r.complete,false);
 assert.equal(r.summary.unfinishedActions,1);
 assert.equal(r.budget.alert,"UNCONFIGURED");
 assert.equal(aiPreflight(r,1).decision,"hold");
});
test("feature summaries carry failures and unknown outcomes for UI",()=>{
 const r=read([event("before"),event("after",{outcome:"failure"})]);
 assert.equal(r.features[0].failures,1);
 assert.equal(r.features[0].unknownResults,0);
 assert.equal(r.features[0].assistantObservedToolCalls,1);
});
