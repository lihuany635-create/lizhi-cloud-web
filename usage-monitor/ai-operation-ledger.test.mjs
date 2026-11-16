import {test} from "node:test";
import assert from "node:assert/strict";
import {createAiActionEntry,summarizeAiActionEntries,checkOwnActionCap,AI_LEDGER_SOURCE} from "./ai-operation-ledger.mjs";
const id="a9f8c004-252e-4e1e-96fb-2a9aa3c5740f";
const at="2026-11-16T01:00:00Z";
const before=(change={})=>createAiActionEntry({
 eventId:id,at,service:"supabase",feature:"english_classroom",
 taskLabel:"英文教室單字卡測試",actionDetail:"查詢單字卡資料",operation:"sql_read",
 phase:"before",outcome:"planned",...change
});
const after=(change={})=>createAiActionEntry({
 eventId:id,at,service:"supabase",feature:"english_classroom",
 taskLabel:"英文教室單字卡測試",actionDetail:"查詢單字卡資料",operation:"sql_read",
 phase:"after",outcome:"success",toolCalls:1,...change
});
test("AI registers planned operation and completed tool action",()=>{
 const r=summarizeAiActionEntries([before(),after()]);
 assert.equal(r.finishedActions,1);
 assert.equal(r.assistantObservedToolCalls,1);
 assert.equal(r.unfinishedActions,0);
 assert.equal(r.source,AI_LEDGER_SOURCE);
});
test("never count an observed tool call as billable Edge invocation",()=>{
 const r=summarizeAiActionEntries([before(),after()]);
 assert.equal(r.officialEdgeInvocations,null);
 assert.equal(r.officialCost,null);
 assert.equal(r.officialEgressBytes,null);
 assert.equal(r.coverage,"assistant_observed_actions_only");
});
test("create entry explicitly marks measured provider use unknown",()=>{
 const item=after();
 assert.equal(item.measuredProviderRequestCount,null);
 assert.equal(item.officialEdgeInvocations,null);
 assert.equal(item.officialCost,null);
 assert.equal(item.project,"hrdzywkihfqggiwjgavi");
});
test("no fake coverage when only planned action exists",()=>{
 const r=summarizeAiActionEntries([before()]);
 assert.equal(r.assistantObservedToolCalls,0);
 assert.equal(r.unfinishedActions,1);
});
test("failed operation is recorded without implying zero provider usage",()=>{
 const r=summarizeAiActionEntries([before(),after({outcome:"failure"})]);
 assert.equal(r.failures,1);
 assert.equal(r.assistantObservedToolCalls,1);
 assert.equal(r.officialEdgeInvocations,null);
});
test("after-only entry detects missing pre-operation audit",()=>{
 const r=summarizeAiActionEntries([after()]);
 assert.equal(r.missingBefore,1);
 assert.equal(r.finishedActions,1);
});
test("reject duplicate post records to avoid double counting",()=>{
 assert.throws(()=>summarizeAiActionEntries([before(),after(),after()]),/Duplicate/);
});
test("reject mismatched service identity",()=>{
 assert.throws(()=>summarizeAiActionEntries([before(),after({service:"another"})]),/Mismatched/);
});
test("cannot claim provider billing data in self-record",()=>{
 assert.throws(()=>summarizeAiActionEntries([before(),{...after(),officialCost:0}]),/Untrusted/);
});
test("cannot put bearer token or query text into service identifier",()=>{
 assert.throws(()=>before({service:"https://example?access_token=secret"}),/Invalid/);
});
test("refuse arbitrary link domains for sensitive evidence",()=>{
 assert.throws(()=>after({evidenceUrl:"https://attacker.example/export?token=secret"}),/Untrusted/);
});
test("accept bounded vetted link without storing text bodies",()=>{
 const x=after({evidenceUrl:"https://github.com/lihuany635-create/lizhi-cloud-web/pull/77"});
 assert.ok(x.evidenceUrl.startsWith("https://github.com/"));
});
test("before cannot claim it has already executed requests",()=>{
 assert.throws(()=>before({toolCalls:1}),/Before/);
});
test("after cannot be planned",()=>{
 assert.throws(()=>after({outcome:"planned"}),/After/);
});
test("unverified or missing local budget fails closed",()=>{
 assert.equal(checkOwnActionCap({recordedCalls:0,plannedCalls:1,cap:null}).decision,"hold");
 assert.equal(checkOwnActionCap({recordedCalls:-1,plannedCalls:1,cap:20}).decision,"hold");
});
test("self cap holds only AI actions above threshold",()=>{
 const r=checkOwnActionCap({recordedCalls:9,plannedCalls:2,cap:10});
 assert.equal(r.reason,"ai_action_cap_reached");
});
test("self cap may permit actions but never guarantees official quota",()=>{
 const r=checkOwnActionCap({recordedCalls:7,plannedCalls:2,cap:10});
 assert.equal(r.decision,"allow");
 assert.equal(r.officialQuotaGuaranteed,false);
});

test("every row records the actual feature, task and reason for its operation",()=>{
 const x=after();
 assert.equal(x.feature,"english_classroom");
 assert.equal(x.taskLabel,"英文教室單字卡測試");
 assert.equal(x.actionDetail,"查詢單字卡資料");
});
test("summary groups AI actions by feature",()=>{
 const otherId="a9f8c004-252e-4e1e-96fb-2a9aa3c57410";
 const items=[before(),after(),before({
   eventId:otherId,feature:"cad",taskLabel:"CAD 圖元檢查",actionDetail:"讀取線條座標"
 }),after({eventId:otherId,feature:"cad",taskLabel:"CAD 圖元檢查",
   actionDetail:"讀取線條座標",toolCalls:2})];
 const r=summarizeAiActionEntries(items);
 assert.equal(r.assistantObservedToolCalls,3);
 assert.deepEqual(r.features.map(x=>[x.feature,x.assistantObservedToolCalls]),[
   ["cad",2],["english_classroom",1]
 ]);
});
test("cannot silently relabel the purpose after execution",()=>{
 assert.throws(()=>summarizeAiActionEntries([
  before(),after({actionDetail:"測試另一個功能"})
 ]),/Mismatched/);
});
test("feature identifier must be short non-sensitive slug",()=>{
 assert.throws(()=>before({feature:"https://example.net?token=secret"}),/Invalid/);
 assert.throws(()=>before({feature:""}),/Invalid/);
});
test("must include a concrete task label and action detail",()=>{
 assert.throws(()=>before({taskLabel:""}),/Invalid/);
 assert.throws(()=>after({actionDetail:""}),/Invalid/);
});
test("sensitive information and SQL must not appear in task labels",()=>{
 assert.throws(()=>before({taskLabel:"請寄信到 example@private.com"}),/Invalid/);
 assert.throws(()=>after({actionDetail:"SELECT * FROM auth.users"}),/Invalid/);
 assert.throws(()=>after({actionDetail:"金鑰是 abc"}),/Invalid/);
});
test("linebreaks or long unreviewed prompt cannot be logged as purpose",()=>{
 assert.throws(()=>before({taskLabel:"測試\n包含另一行"}),/Invalid/);
 assert.throws(()=>after({actionDetail:"長".repeat(141)}),/Invalid/);
});
