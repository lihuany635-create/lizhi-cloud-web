import {test} from "node:test";
import assert from "node:assert/strict";
import {runTrackedAiOperation,AiLogError} from "./ai-self-log-runner.mjs";
const common={eventId:"b67a7120-1fa6-485b-a5c7-e8ba1910a7fa",at:"2026-11-16T01:00:00Z",
  service:"supabase",feature:"english_classroom",taskLabel:"英文教室單字卡測試",
  actionDetail:"核對單字卡資料",operation:"sql_read"};
const harness=(changes={})=>{
 const logs=[];let invocations=0,writes=0;
 const writeSide=async r=>{
   writes++;
   if(changes.failBefore&&writes===1)throw Error("offline");
   if(changes.failAfter&&writes===2)throw Error("offline");
   const log={...r,id:String(writes)};
   logs.unshift(log);
   return {log};
 };
 const readSide=async()=>{
   if(changes.failRead)throw Error("offline");
   return {logs};
 };
 const invoke=async()=>{
   invocations++;
   if(changes.failTool)throw Error("upstream unavailable");
   return {ok:true};
 };
 return {logs,writeSide,readSide,invoke,invocations:()=>invocations};
};
test("successful tool call saves both phases and reads them back",async()=>{
 const h=harness();
 const r=await runTrackedAiOperation({...common,...h});
 assert.equal(r.executed,true);
 assert.equal(r.verified,true);
 assert.equal(r.observedToolCalls,1);
 assert.equal(h.logs.length,2);
 assert.equal(h.logs[0].title.startsWith("AI_USAGE after"),true);
 assert.equal(JSON.parse(h.logs[1].done).phase,"before");
});
test("failed before-log prevents the Supabase tool call",async()=>{
 const h=harness({failBefore:true});
 await assert.rejects(runTrackedAiOperation({...common,...h}),/offline/);
 assert.equal(h.invocations(),0);
});
test("failed tool is counted as attempted invocation",async()=>{
 const h=harness({failTool:true});
 const r=await runTrackedAiOperation({...common,...h});
 assert.equal(r.outcome,"failure");
 assert.equal(r.verified,true);
 assert.equal(JSON.parse(h.logs[0].done).toolCalls,1);
 assert.equal(h.invocations(),1);
});
test("failed after-log never reruns the original action",async()=>{
 const h=harness({failAfter:true});
 const r=await runTrackedAiOperation({...common,...h});
 assert.equal(r.verified,false);
 assert.equal(r.reason,"AFTER_LOG_WRITE_FAILED");
 assert.equal(h.invocations(),1);
 assert.equal(h.logs.length,1);
});
test("failed readback reports unverified instead of faking success",async()=>{
 const h=harness({failRead:true});
 const r=await runTrackedAiOperation({...common,...h});
 assert.equal(r.verified,false);
 assert.equal(r.reason,"READBACK_FAILED");
});
test("preflight without a budget cannot execute an optional call",async()=>{
 const h=harness();
 await assert.rejects(runTrackedAiOperation({...common,...h,enforceCap:true,
   capSnapshot:{source:"ai_self_registered_operations",complete:false}}),
   error=>error instanceof AiLogError&&error.code==="AI_ACTION_CAP_HOLD");
 assert.equal(h.invocations(),0);
});
test("enforced budget with verified remaining capacity allows execution",async()=>{
 const h=harness();
 const r=await runTrackedAiOperation({...common,...h,enforceCap:true,
   capSnapshot:{source:"ai_self_registered_operations",complete:true,
     summary:{assistantObservedToolCalls:4},budget:{monthlyToolCap:5}}});
 assert.equal(r.verified,true);
});
test("enforced budget at limit does not execute tool",async()=>{
 const h=harness();
 await assert.rejects(runTrackedAiOperation({...common,...h,enforceCap:true,
   capSnapshot:{source:"ai_self_registered_operations",complete:true,
     summary:{assistantObservedToolCalls:5},budget:{monthlyToolCap:5}}}),
   /AI_ACTION_CAP_HOLD/);
 assert.equal(h.invocations(),0);
});
test("missing actual tracer connector prevents operation",async()=>{
 await assert.rejects(runTrackedAiOperation({...common,invoke:async()=>true}),/TRACKER_NOT_CONNECTED/);
});
